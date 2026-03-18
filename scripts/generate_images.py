#!/usr/bin/env python3
"""
Off-Human Season 01 — Image Generation Pipeline

Generates product visuals for each Season 01 piece.
API preference:
  1. OpenAI DALL-E 3 (if OPENAI_API_KEY in env)
  2. Replicate API / Flux (if REPLICATE_API_KEY in env)

Usage:
  uv run scripts/generate_images.py                  # generate all
  uv run scripts/generate_images.py --failed-only    # regenerate style-check failures
  uv run scripts/generate_images.py --piece 01 02    # specific pieces
  uv run scripts/generate_images.py --dry-run        # print prompts, no generation
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path

ROOT = Path(__file__).parent.parent
PROMPTS_FILE = ROOT / "season01" / "image-prompts.json"
OUTPUT_DIR = ROOT / "attached_assets" / "season01"
MANIFEST_FILE = OUTPUT_DIR / "manifest.json"
STYLE_REPORT = OUTPUT_DIR / "style_check_report.json"

# Techniques that are intentionally minimal — 3% Rule pieces score "generic" by design
INTENTIONALLY_MINIMAL_PIECES = {"03", "10"}

# Techniques requiring regeneration on style fail
REGENERATE_TECHNIQUES = {"TROMPE-L'OEIL", "TROMPE-LOEIL", "ARTISANAL", "BIANCHETTO", "REPLICA"}


def load_prompts():
    with open(PROMPTS_FILE) as f:
        return json.load(f)


def load_style_report():
    if not STYLE_REPORT.exists():
        return {}
    with open(STYLE_REPORT) as f:
        items = json.load(f)
    return {item["file"]: item for item in items}


def get_failed_pieces(style_report, prompts):
    """Return piece numbers that failed style check and are not intentionally minimal."""
    failed = set()
    for piece in prompts:
        num = piece["piece_number"]
        if num in INTENTIONALLY_MINIMAL_PIECES:
            continue
        flat_key = f"{num}_{piece['piece_name'].lower().replace(' ', '_').replace('\"', '').replace('/', '-')}_flat.png"
        look_key = flat_key.replace("_flat.png", "_lookbook.png")
        # match by prefix
        for key, report in style_report.items():
            if key.startswith(f"{num}_") and not report["passed"]:
                failed.add(num)
    return failed


def generate_dalle3(prompt: str, output_path: Path, openai_client) -> bool:
    """Generate image via DALL-E 3. Returns True on success."""
    import base64
    try:
        response = openai_client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size="1024x1792",  # portrait 4:5 approx (closest available)
            quality="hd",
            response_format="b64_json",
            n=1,
        )
        img_data = base64.b64decode(response.data[0].b64_json)
        output_path.write_bytes(img_data)
        return True
    except Exception as e:
        print(f"  [DALL-E 3 error] {e}", file=sys.stderr)
        return False


def generate_replicate(prompt: str, output_path: Path) -> bool:
    """Generate image via Replicate (Flux Schnell). Returns True on success."""
    try:
        import replicate
        import httpx
        output = replicate.run(
            "black-forest-labs/flux-schnell",
            input={
                "prompt": prompt,
                "aspect_ratio": "4:5",
                "output_format": "png",
                "num_outputs": 1,
            }
        )
        # output is a list of FileOutput objects or URLs
        url = str(output[0])
        img_data = httpx.get(url).content
        output_path.write_bytes(img_data)
        return True
    except Exception as e:
        print(f"  [Replicate error] {e}", file=sys.stderr)
        return False


def generate_image(prompt: str, output_path: Path, client_info: dict, dry_run: bool) -> bool:
    if dry_run:
        print(f"  [DRY RUN] Would generate: {output_path.name}")
        print(f"  Prompt ({len(prompt)} chars): {prompt[:120]}...")
        return True

    output_path.parent.mkdir(parents=True, exist_ok=True)

    if client_info.get("openai"):
        print(f"  Generating via DALL-E 3...")
        return generate_dalle3(prompt, output_path, client_info["openai"])
    elif client_info.get("replicate"):
        print(f"  Generating via Replicate/Flux...")
        return generate_replicate(prompt, output_path)
    else:
        print(f"  [SKIP] No API client available — skipping {output_path.name}", file=sys.stderr)
        return False


def run_style_check(files: list[Path]) -> dict:
    """Run style_check.py on generated files. Returns file -> passed mapping."""
    import subprocess
    results = {}
    for f in files:
        if not f.exists():
            continue
        result = subprocess.run(
            [sys.executable, str(ROOT / "scripts" / "style_check.py"), str(f)],
            capture_output=True, text=True
        )
        passed = "PASS" in result.stdout
        results[f.name] = passed
        status = "PASS" if passed else "FAIL"
        print(f"  Style check [{status}]: {f.name}")
    return results


def build_manifest(prompts: list, style_report: dict) -> dict:
    manifest = {"version": "1.0", "season": "01", "pieces": {}}
    for piece in prompts:
        num = piece["piece_number"]
        name = piece["piece_name"]
        flat_file = f"{num}_{name.lower().replace(' ', '_').replace('\"', '').replace('/', '-')}_flat.png"
        look_file = flat_file.replace("_flat.png", "_lookbook.png")

        # find actual files by prefix
        flat_path = None
        look_path = None
        for f in sorted(OUTPUT_DIR.glob(f"{num}_*.png")):
            if "_flat" in f.name:
                flat_path = f"attached_assets/season01/{f.name}"
            elif "_lookbook" in f.name:
                look_path = f"attached_assets/season01/{f.name}"

        piece_data = {
            "name": name,
            "piece_number": num,
            "images": {
                "flat": flat_path,
                "lookbook": look_path,
            },
            "style_check": {
                "flat": style_report.get(Path(flat_path).name if flat_path else "", {}).get("passed"),
                "lookbook": style_report.get(Path(look_path).name if look_path else "", {}).get("passed"),
            },
            "intentionally_minimal": num in INTENTIONALLY_MINIMAL_PIECES,
        }
        manifest["pieces"][num] = piece_data
    return manifest


def main():
    parser = argparse.ArgumentParser(description="Off-Human Season 01 image generation pipeline")
    parser.add_argument("--failed-only", action="store_true", help="Only regenerate style-check failures")
    parser.add_argument("--piece", nargs="+", help="Specific piece numbers to generate (e.g. 01 03)")
    parser.add_argument("--dry-run", action="store_true", help="Print prompts without generating")
    parser.add_argument("--skip-style-check", action="store_true", help="Skip style check after generation")
    parser.add_argument("--manifest-only", action="store_true", help="Only rebuild manifest from existing files")
    args = parser.parse_args()

    prompts = load_prompts()
    style_report = load_style_report()

    # Build and write manifest if requested
    if args.manifest_only:
        manifest = build_manifest(prompts, style_report)
        with open(MANIFEST_FILE, "w") as f:
            json.dump(manifest, f, indent=2)
        print(f"Manifest written to {MANIFEST_FILE}")
        return

    # Determine which pieces to process
    if args.piece:
        target_pieces = set(args.piece)
    elif args.failed_only:
        target_pieces = get_failed_pieces(style_report, prompts)
        if not target_pieces:
            print("No failed pieces to regenerate.")
            manifest = build_manifest(prompts, style_report)
            with open(MANIFEST_FILE, "w") as f:
                json.dump(manifest, f, indent=2)
            print(f"Manifest written to {MANIFEST_FILE}")
            return
        print(f"Regenerating failed pieces: {sorted(target_pieces)}")
    else:
        target_pieces = {p["piece_number"] for p in prompts}

    # Set up API clients
    client_info = {}
    openai_key = os.environ.get("OPENAI_API_KEY")
    replicate_key = os.environ.get("REPLICATE_API_KEY")

    if openai_key and not args.dry_run:
        try:
            from openai import OpenAI
            client_info["openai"] = OpenAI(api_key=openai_key)
            print("Using DALL-E 3 (OpenAI)")
        except ImportError:
            print("openai package not installed, falling back to Replicate")

    if not client_info.get("openai") and replicate_key and not args.dry_run:
        os.environ["REPLICATE_API_TOKEN"] = replicate_key
        client_info["replicate"] = True
        print("Using Replicate/Flux")

    if not client_info and not args.dry_run:
        print("WARNING: No API keys found (OPENAI_API_KEY or REPLICATE_API_KEY).")
        print("Set one in .env to generate images. Running in manifest-only mode.")
        manifest = build_manifest(prompts, style_report)
        with open(MANIFEST_FILE, "w") as f:
            json.dump(manifest, f, indent=2)
        print(f"Manifest written to {MANIFEST_FILE}")
        return

    # Generate
    generated_files = []
    for piece in prompts:
        num = piece["piece_number"]
        if num not in target_pieces:
            continue

        name = piece["piece_name"]
        slug = name.lower().replace(" ", "_").replace('"', "").replace("/", "-")
        flat_path = OUTPUT_DIR / f"{num}_{slug}_flat.png"
        look_path = OUTPUT_DIR / f"{num}_{slug}_lookbook.png"

        print(f"\n[{num}] {name}")

        # Flat image
        should_gen_flat = True
        if args.failed_only and flat_path.exists():
            flat_report = style_report.get(flat_path.name, {})
            should_gen_flat = not flat_report.get("passed", False)

        if should_gen_flat:
            print(f"  Flat image: {flat_path.name}")
            ok = generate_image(piece["prompt_flat"], flat_path, client_info, args.dry_run)
            if ok:
                generated_files.append(flat_path)
            if not args.dry_run:
                time.sleep(1)  # rate limit

        # Lookbook image
        should_gen_look = True
        if args.failed_only and look_path.exists():
            look_report = style_report.get(look_path.name, {})
            should_gen_look = not look_report.get("passed", False)

        if should_gen_look:
            print(f"  Lookbook image: {look_path.name}")
            ok = generate_image(piece["prompt_lookbook"], look_path, client_info, args.dry_run)
            if ok:
                generated_files.append(look_path)
            if not args.dry_run:
                time.sleep(1)

    # Style check newly generated files
    if generated_files and not args.skip_style_check and not args.dry_run:
        print(f"\nRunning style check on {len(generated_files)} generated images...")
        run_style_check(generated_files)
        # Reload style report
        style_report = load_style_report()

    # Always write manifest
    manifest = build_manifest(prompts, style_report)
    with open(MANIFEST_FILE, "w") as f:
        json.dump(manifest, f, indent=2)
    print(f"\nManifest written to {MANIFEST_FILE}")

    # Print summary
    total_pass = sum(
        1 for p in manifest["pieces"].values()
        for v in [p["style_check"]["flat"], p["style_check"]["lookbook"]]
        if v is True
    )
    total = sum(
        1 for p in manifest["pieces"].values()
        for v in [p["style_check"]["flat"], p["style_check"]["lookbook"]]
        if v is not None
    )
    print(f"Style check: {total_pass}/{total} images passing")


if __name__ == "__main__":
    main()
