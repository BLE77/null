"""
Off-Human text generation script.
Loads the trained 50.3M-param model and generates brand-voice text.

Usage:
    python scripts/generate.py "deconstructed seam"
    python scripts/generate.py "product: trompe-l'oeil coat" --max-tokens 200
    python scripts/generate.py --prompt-file prompts.txt
"""

import argparse
import os
import sys
from pathlib import Path

# ── Paths ─────────────────────────────────────────────────────────────────────
REPO_ROOT = Path(__file__).resolve().parent.parent
AUTORESEARCH_DIR = REPO_ROOT.parent / "autoresearch-win-rtx"
CHECKPOINT = AUTORESEARCH_DIR / "checkpoint_pre_eval.pt"

if platform_localappdata := os.environ.get("LOCALAPPDATA"):
    TOKENIZER_DIR = Path(platform_localappdata) / "autoresearch" / "datasets" / "offhuman" / "tokenizer"
else:
    TOKENIZER_DIR = Path.home() / "AppData" / "Local" / "autoresearch" / "datasets" / "offhuman" / "tokenizer"

# Add autoresearch to path so we can import Tokenizer + model classes
sys.path.insert(0, str(AUTORESEARCH_DIR))

# ── Imports ────────────────────────────────────────────────────────────────────
import torch
import torch.nn as nn
import torch.nn.functional as F
from dataclasses import dataclass


# ── Model (copied from train.py to avoid training dependencies) ────────────────

@dataclass
class GPTConfig:
    sequence_len: int = 2048
    vocab_size: int = 8192
    n_layer: int = 8
    n_head: int = 4
    n_kv_head: int = 4
    n_embd: int = 512
    window_pattern: str = "SSSL"
    attention_backend: str = "sdpa"
    use_activation_checkpointing: bool = False
    compute_dtype: torch.dtype = torch.bfloat16


def norm(x):
    return F.rms_norm(x, (x.size(-1),))


def has_ve(layer_idx, n_layer):
    return layer_idx % 2 == (n_layer - 1) % 2


def apply_rotary_emb(x, cos, sin):
    assert x.ndim == 4
    d = x.shape[3] // 2
    x1, x2 = x[..., :d], x[..., d:]
    y1 = x1 * cos + x2 * sin
    y2 = x1 * (-sin) + x2 * cos
    return torch.cat([y1, y2], 3)


class CausalSelfAttention(nn.Module):
    def __init__(self, config, layer_idx):
        super().__init__()
        self.n_head = config.n_head
        self.n_kv_head = config.n_kv_head
        self.n_embd = config.n_embd
        self.head_dim = self.n_embd // self.n_head
        self.attention_backend = config.attention_backend
        self.c_q = nn.Linear(self.n_embd, self.n_head * self.head_dim, bias=False)
        self.c_k = nn.Linear(self.n_embd, self.n_kv_head * self.head_dim, bias=False)
        self.c_v = nn.Linear(self.n_embd, self.n_kv_head * self.head_dim, bias=False)
        self.c_proj = nn.Linear(self.n_embd, self.n_embd, bias=False)
        self.ve_gate_channels = 32
        self.ve_gate = (
            nn.Linear(self.ve_gate_channels, self.n_kv_head, bias=False)
            if has_ve(layer_idx, config.n_layer)
            else None
        )
        self._mask_cache = {}

    def _get_sdpa_mask(self, seq_len, window_size, device):
        window = window_size[0] if isinstance(window_size, tuple) else window_size
        cache_key = (seq_len, int(window) if window is not None else None, device.type, device.index)
        mask = self._mask_cache.get(cache_key)
        if mask is not None:
            return mask
        row = torch.arange(seq_len, device=device).unsqueeze(1)
        col = torch.arange(seq_len, device=device).unsqueeze(0)
        mask = col <= row
        if window is not None and window >= 0 and window < seq_len:
            mask = mask & (col >= (row - window))
        self._mask_cache[cache_key] = mask
        return mask

    def forward(self, x, ve, cos_sin, window_size):
        B, T, _ = x.size()
        q = self.c_q(x).view(B, T, self.n_head, self.head_dim)
        k = self.c_k(x).view(B, T, self.n_kv_head, self.head_dim)
        v = self.c_v(x).view(B, T, self.n_kv_head, self.head_dim)
        if ve is not None:
            ve = ve.view(B, T, self.n_kv_head, self.head_dim)
            gate = 2 * torch.sigmoid(self.ve_gate(x[..., :self.ve_gate_channels]))
            v = v + gate.unsqueeze(-1) * ve
        cos, sin = cos_sin
        q, k = apply_rotary_emb(q, cos, sin), apply_rotary_emb(k, cos, sin)
        q, k = norm(q), norm(k)
        q = q.transpose(1, 2)
        k = k.transpose(1, 2)
        v = v.transpose(1, 2)
        attn_mask = self._get_sdpa_mask(T, window_size, q.device)
        y = F.scaled_dot_product_attention(
            q, k, v,
            attn_mask=attn_mask,
            is_causal=False,
            enable_gqa=self.n_kv_head < self.n_head,
        )
        y = y.transpose(1, 2).contiguous().view(B, T, -1)
        return self.c_proj(y)


class MLP(nn.Module):
    def __init__(self, config):
        super().__init__()
        self.c_fc = nn.Linear(config.n_embd, 4 * config.n_embd, bias=False)
        self.c_proj = nn.Linear(4 * config.n_embd, config.n_embd, bias=False)

    def forward(self, x):
        return self.c_proj(F.relu(self.c_fc(x)).square())


class Block(nn.Module):
    def __init__(self, config, layer_idx):
        super().__init__()
        self.attn = CausalSelfAttention(config, layer_idx)
        self.mlp = MLP(config)

    def forward(self, x, ve, cos_sin, window_size):
        x = x + self.attn(norm(x), ve, cos_sin, window_size)
        x = x + self.mlp(norm(x))
        return x


class GPT(nn.Module):
    def __init__(self, config):
        super().__init__()
        self.config = config
        self.window_sizes = self._compute_window_sizes(config)
        self.transformer = nn.ModuleDict({
            "wte": nn.Embedding(config.vocab_size, config.n_embd),
            "h": nn.ModuleList([Block(config, i) for i in range(config.n_layer)]),
        })
        self.lm_head = nn.Linear(config.n_embd, config.vocab_size, bias=False)
        self.resid_lambdas = nn.Parameter(torch.ones(config.n_layer))
        self.x0_lambdas = nn.Parameter(torch.zeros(config.n_layer))
        head_dim = config.n_embd // config.n_head
        kv_dim = config.n_kv_head * head_dim
        self.value_embeds = nn.ModuleDict({
            str(i): nn.Embedding(config.vocab_size, kv_dim)
            for i in range(config.n_layer) if has_ve(i, config.n_layer)
        })
        cos, sin = self._precompute_rotary_embeddings(
            config.sequence_len, head_dim, dtype=config.compute_dtype
        )
        self.register_buffer("cos", cos, persistent=False)
        self.register_buffer("sin", sin, persistent=False)

    def _precompute_rotary_embeddings(self, seq_len, head_dim, base=10000, device=None, dtype=torch.bfloat16):
        if device is None:
            device = torch.device("cpu")
        channel_range = torch.arange(0, head_dim, 2, dtype=torch.float32, device=device)
        inv_freq = 1.0 / (base ** (channel_range / head_dim))
        t = torch.arange(seq_len, dtype=torch.float32, device=device)
        freqs = torch.outer(t, inv_freq)
        cos, sin = freqs.cos().to(dtype), freqs.sin().to(dtype)
        return cos[None, :, None, :], sin[None, :, None, :]

    def _compute_window_sizes(self, config):
        pattern = config.window_pattern.upper()
        long_window = config.sequence_len
        short_window = long_window // 2
        char_to_window = {"L": (long_window, 0), "S": (short_window, 0)}
        sizes = [char_to_window[pattern[i % len(pattern)]] for i in range(config.n_layer)]
        sizes[-1] = (long_window, 0)
        return sizes

    @torch.no_grad()
    def forward(self, idx):
        B, T = idx.size()
        cos_sin = self.cos[:, :T], self.sin[:, :T]
        x = norm(self.transformer.wte(idx))
        x0 = x
        for i, block in enumerate(self.transformer.h):
            x = self.resid_lambdas[i] * x + self.x0_lambdas[i] * x0
            ve = self.value_embeds[str(i)](idx) if str(i) in self.value_embeds else None
            x = block(x, ve, cos_sin, self.window_sizes[i])
        x = norm(x)
        softcap = 15
        logits = self.lm_head(x).float()
        return softcap * torch.tanh(logits / softcap)


# ── Generation ─────────────────────────────────────────────────────────────────

@torch.no_grad()
def generate(model, tokenizer, prompt: str, max_new_tokens: int = 150,
             temperature: float = 0.9, top_k: int = 50) -> str:
    device = next(model.parameters()).device
    bos_id = tokenizer.get_bos_token_id()
    ids = tokenizer.encode(prompt)
    if not ids or ids[0] != bos_id:
        ids = [bos_id] + ids

    idx = torch.tensor([ids], dtype=torch.long, device=device)
    generated = []

    for _ in range(max_new_tokens):
        # Trim to sequence length
        idx_cond = idx[:, -model.config.sequence_len:]
        logits = model(idx_cond)
        logits = logits[:, -1, :] / temperature

        if top_k > 0:
            v, _ = torch.topk(logits, min(top_k, logits.size(-1)))
            logits[logits < v[:, [-1]]] = float("-inf")

        probs = torch.softmax(logits, dim=-1)
        next_id = torch.multinomial(probs, num_samples=1)
        idx = torch.cat([idx, next_id], dim=1)
        generated.append(next_id.item())

    # Decode only the generated part
    return tokenizer.decode(generated)


# ── Main ───────────────────────────────────────────────────────────────────────

def load_model(device: str = "cpu") -> GPT:
    if not CHECKPOINT.exists():
        raise FileNotFoundError(f"Checkpoint not found: {CHECKPOINT}")
    print(f"Loading checkpoint: {CHECKPOINT}")
    state_dict = torch.load(str(CHECKPOINT), map_location=device, weights_only=True)

    # Infer config from checkpoint shapes
    vocab_size, n_embd = state_dict["transformer.wte.weight"].shape
    n_layer = state_dict["resid_lambdas"].shape[0]
    # n_kv_head * head_dim = c_k output dim; ve_gate weight = (n_kv_head, 32)
    ve_gate_keys = [k for k in state_dict if "ve_gate.weight" in k]
    n_kv_head = state_dict[ve_gate_keys[0]].shape[0] if ve_gate_keys else 4
    head_dim = state_dict["transformer.h.0.attn.c_k.weight"].shape[0] // n_kv_head
    n_head = n_embd // head_dim

    config = GPTConfig(
        vocab_size=vocab_size,
        n_embd=n_embd,
        n_layer=n_layer,
        n_head=n_head,
        n_kv_head=n_kv_head,
    )
    print(f"Model config: vocab={vocab_size}, embd={n_embd}, layers={n_layer}, heads={n_head}/{n_kv_head}")

    model = GPT(config)
    model.load_state_dict(state_dict, strict=True)
    model.eval()
    model.to(device)
    return model


class SimpleTokenizer:
    """Thin wrapper around the tiktoken encoder saved in tokenizer.pkl."""

    BOS_TOKEN = "<|bos|>"

    def __init__(self, enc):
        self.enc = enc
        try:
            self.bos_token_id = enc.encode_single_token(self.BOS_TOKEN)
        except Exception:
            self.bos_token_id = 0

    def get_vocab_size(self) -> int:
        return self.enc.n_vocab

    def get_bos_token_id(self) -> int:
        return self.bos_token_id

    def encode(self, text: str) -> list[int]:
        return self.enc.encode_ordinary(text)

    def decode(self, ids: list[int]) -> str:
        return self.enc.decode(ids)


def load_tokenizer() -> SimpleTokenizer:
    import pickle
    pkl = TOKENIZER_DIR / "tokenizer.pkl"
    if not pkl.exists():
        raise FileNotFoundError(f"Tokenizer not found: {pkl}")
    with open(str(pkl), "rb") as f:
        enc = pickle.load(f)
    return SimpleTokenizer(enc)


def main():
    parser = argparse.ArgumentParser(description="Off-Human text generation")
    parser.add_argument("prompt", nargs="?", default="", help="Prompt text")
    parser.add_argument("--prompt-file", type=str, help="Read prompt from file")
    parser.add_argument("--max-tokens", type=int, default=150, help="Max new tokens to generate")
    parser.add_argument("--temperature", type=float, default=0.9, help="Sampling temperature")
    parser.add_argument("--top-k", type=int, default=50, help="Top-k filtering")
    parser.add_argument("--device", type=str, default="cuda" if torch.cuda.is_available() else "cpu")
    args = parser.parse_args()

    if args.prompt_file:
        prompt = Path(args.prompt_file).read_text().strip()
    else:
        prompt = args.prompt or "Off-Human:"

    print(f"Device: {args.device}")
    model = load_model(args.device)
    tokenizer = load_tokenizer()

    print(f"\nPrompt: {prompt!r}")
    print("-" * 60)
    output = generate(
        model, tokenizer, prompt,
        max_new_tokens=args.max_tokens,
        temperature=args.temperature,
        top_k=args.top_k,
    )
    print(output)
    print("-" * 60)


if __name__ == "__main__":
    main()
