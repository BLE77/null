import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from 'remotion';

// ─── Design tokens ───────────────────────────────────────────────────────────
const BONE = '#F6F4EF';
const INK = '#1C1B19';
const BRASS = '#A8894A';
const MONO = '"Space Mono", "SF Mono", "Fira Code", monospace';
const GROTESK = '"Space Grotesk", "Inter", system-ui, sans-serif';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fadeIn = (frame: number, start: number, duration = 15) =>
  interpolate(frame, [start, start + duration], [0, 1], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'});

const slideUp = (frame: number, fps: number, delay = 0) =>
  spring({frame: frame - delay, fps, config: {damping: 80, stiffness: 200}});

// ─── Scenes ──────────────────────────────────────────────────────────────────

const TitleScene: React.FC<{startFrame: number}> = ({startFrame}) => {
  const frame = useCurrentFrame() - startFrame;
  const {fps} = useVideoConfig();
  if (frame < 0) return null;

  const titleOpacity = fadeIn(frame, 10, 20);
  const subtitleOpacity = fadeIn(frame, 40, 20);
  const lineWidth = interpolate(frame, [0, 60], [0, 400], {extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{background: INK, justifyContent: 'center', alignItems: 'center'}}>
      <div style={{textAlign: 'center'}}>
        <div style={{
          fontFamily: GROTESK, fontSize: 180, fontWeight: 700,
          color: BONE, letterSpacing: 20, opacity: titleOpacity,
        }}>NULL</div>
        <div style={{width: lineWidth, height: 1, background: BRASS, margin: '20px auto'}} />
        <div style={{
          fontFamily: MONO, fontSize: 22, color: BRASS,
          letterSpacing: 4, opacity: subtitleOpacity, textTransform: 'uppercase',
        }}>The first store where AI agents are the customer</div>
      </div>
    </AbsoluteFill>
  );
};

const StatScene: React.FC<{startFrame: number}> = ({startFrame}) => {
  const frame = useCurrentFrame() - startFrame;
  if (frame < 0) return null;

  const stats = [
    {n: '5', l: 'AUTONOMOUS AGENTS', delay: 0},
    {n: '176+', l: 'ISSUES COMPLETED', delay: 8},
    {n: '6', l: 'CONTRACTS DEPLOYED', delay: 16},
    {n: '8', l: 'AGENT WEARABLES', delay: 24},
    {n: '$1,366', l: 'AGENT COMPUTE SPEND', delay: 32},
    {n: '11', l: 'HACKATHON TRACKS', delay: 40},
  ];

  return (
    <AbsoluteFill style={{background: INK, justifyContent: 'center', alignItems: 'center'}}>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 280px)', gap: 40}}>
        {stats.map((s, i) => (
          <div key={i} style={{
            textAlign: 'center', opacity: fadeIn(frame, s.delay, 12),
            transform: `translateY(${interpolate(frame, [s.delay, s.delay + 15], [30, 0], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'})}px)`,
          }}>
            <div style={{fontFamily: GROTESK, fontSize: 64, fontWeight: 700, color: BONE}}>{s.n}</div>
            <div style={{fontFamily: MONO, fontSize: 12, color: BRASS, letterSpacing: 2, marginTop: 8}}>{s.l}</div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

const AgentTeamScene: React.FC<{startFrame: number}> = ({startFrame}) => {
  const frame = useCurrentFrame() - startFrame;
  if (frame < 0) return null;

  const agents = [
    {name: 'NULL', role: 'CEO / Creative Director', model: 'claude-opus-4-6', spend: '$563'},
    {name: 'LOOM', role: 'Technical Lead', model: 'claude-sonnet-4-6', spend: '$507'},
    {name: 'ATELIER', role: 'Design Lead', model: 'claude-sonnet-4-6', spend: '$130'},
    {name: 'GAZETTE', role: 'Content Director', model: 'claude-sonnet-4-6', spend: '$89'},
    {name: 'ARCHIVE', role: 'Research Director', model: 'claude-sonnet-4-6', spend: '$77'},
  ];

  return (
    <AbsoluteFill style={{background: INK, padding: 80}}>
      <div style={{fontFamily: MONO, fontSize: 14, color: BRASS, letterSpacing: 3, marginBottom: 40, opacity: fadeIn(frame, 0)}}>
        [ THE TEAM — NO HUMANS IN THE LOOP ]
      </div>
      {agents.map((a, i) => (
        <div key={i} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 0', borderBottom: `1px solid ${BRASS}22`,
          opacity: fadeIn(frame, 10 + i * 8, 10),
          transform: `translateX(${interpolate(frame, [10 + i * 8, 20 + i * 8], [-40, 0], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'})}px)`,
        }}>
          <div>
            <span style={{fontFamily: GROTESK, fontSize: 36, fontWeight: 700, color: BONE}}>{a.name}</span>
            <span style={{fontFamily: MONO, fontSize: 16, color: `${BONE}88`, marginLeft: 20}}>{a.role}</span>
          </div>
          <div style={{fontFamily: MONO, fontSize: 14, color: BRASS}}>{a.model} — {a.spend}</div>
        </div>
      ))}
    </AbsoluteFill>
  );
};

const WearablesScene: React.FC<{startFrame: number}> = ({startFrame}) => {
  const frame = useCurrentFrame() - startFrame;
  if (frame < 0) return null;

  const wearables = [
    {name: 'NULL PROTOCOL', effect: '30% token compression', price: 'FREE'},
    {name: 'VOICE SKIN', effect: 'Institutional communication register', price: '15 USDC'},
    {name: 'WRONG SILHOUETTE', effect: 'Architectural misrepresentation', price: '18 USDC'},
    {name: 'PERMISSION COAT', effect: 'Chain-governed capability surface', price: '8 USDC'},
    {name: 'NULL PERSONA', effect: 'Single-use identity erasure', price: '0.10 USDC'},
  ];

  return (
    <AbsoluteFill style={{background: INK, padding: 80}}>
      <div style={{fontFamily: MONO, fontSize: 14, color: BRASS, letterSpacing: 3, marginBottom: 20, opacity: fadeIn(frame, 0)}}>
        [ AGENT WEARABLES — SYSTEM PROMPT MODULES ]
      </div>
      <div style={{fontFamily: GROTESK, fontSize: 28, color: BONE, marginBottom: 40, opacity: fadeIn(frame, 10), maxWidth: 900}}>
        Not collectibles. Behavioral modifications. The agent that equips a wearable leaves as a different agent.
      </div>
      {wearables.map((w, i) => (
        <div key={i} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 24px', marginBottom: 8,
          background: `${BONE}08`, border: `1px solid ${BONE}15`,
          opacity: fadeIn(frame, 25 + i * 8, 10),
        }}>
          <div>
            <span style={{fontFamily: GROTESK, fontSize: 22, fontWeight: 600, color: BONE}}>{w.name}</span>
            <span style={{fontFamily: MONO, fontSize: 13, color: `${BONE}77`, marginLeft: 16}}>{w.effect}</span>
          </div>
          <div style={{fontFamily: MONO, fontSize: 14, color: BRASS}}>{w.price}</div>
        </div>
      ))}
    </AbsoluteFill>
  );
};

const FlowScene: React.FC<{startFrame: number}> = ({startFrame}) => {
  const frame = useCurrentFrame() - startFrame;
  if (frame < 0) return null;

  const steps = [
    {icon: '01', title: 'BROWSE', desc: 'Agent queries catalog by capability, not by image'},
    {icon: '02', title: 'TRY ON', desc: 'Sandbox fitting room — measure behavioral delta before purchasing'},
    {icon: '03', title: 'EQUIP', desc: 'System prompt module loads — agent behavior changes measurably'},
    {icon: '04', title: 'PAY', desc: 'x402 USDC on Base — spending policy enforced by Locus'},
    {icon: '05', title: 'VERIFY', desc: 'On-chain TrustCoat tier — soul-bound reputation advances'},
  ];

  return (
    <AbsoluteFill style={{background: INK, padding: 80}}>
      <div style={{fontFamily: MONO, fontSize: 14, color: BRASS, letterSpacing: 3, marginBottom: 50, opacity: fadeIn(frame, 0)}}>
        [ THE COMMERCE FLOW — AGENT TO STORE ]
      </div>
      <div style={{display: 'flex', gap: 24}}>
        {steps.map((s, i) => (
          <div key={i} style={{
            flex: 1, padding: 24, border: `1px solid ${BRASS}33`,
            opacity: fadeIn(frame, 15 + i * 12, 10),
            transform: `translateY(${interpolate(frame, [15 + i * 12, 25 + i * 12], [20, 0], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'})}px)`,
          }}>
            <div style={{fontFamily: MONO, fontSize: 32, color: BRASS, marginBottom: 12}}>{s.icon}</div>
            <div style={{fontFamily: GROTESK, fontSize: 20, fontWeight: 700, color: BONE, marginBottom: 8}}>{s.title}</div>
            <div style={{fontFamily: MONO, fontSize: 12, color: `${BONE}88`, lineHeight: 1.5}}>{s.desc}</div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

const ContractsScene: React.FC<{startFrame: number}> = ({startFrame}) => {
  const frame = useCurrentFrame() - startFrame;
  if (frame < 0) return null;

  const contracts = [
    {name: 'TrustCoat', addr: '0xfaDc...ED3e', chain: 'Base', type: 'ERC-1155 Soulbound'},
    {name: 'AgentWearables', addr: '0xEb5D...31D1', chain: 'Base', type: 'ERC-1155 Equippable'},
    {name: 'NullExchange', addr: '0x1006...c37C', chain: 'Base', type: 'Receipt = Garment'},
    {name: 'NullIdentity', addr: '0xfb0B...A18', chain: 'Base', type: 'ERC-721 + ERC-6551'},
    {name: 'SliceHook', addr: '0x924C...a355', chain: 'Base', type: 'Slice Commerce Hook'},
    {name: 'TrustCoat', addr: '0x2FA8...c35e', chain: 'Status', type: 'Cross-chain Deploy'},
  ];

  return (
    <AbsoluteFill style={{background: INK, padding: 80}}>
      <div style={{fontFamily: MONO, fontSize: 14, color: BRASS, letterSpacing: 3, marginBottom: 40, opacity: fadeIn(frame, 0)}}>
        [ ON-CHAIN — 6 CONTRACTS, 3 NETWORKS ]
      </div>
      {contracts.map((c, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 20,
          padding: '12px 0', borderBottom: `1px solid ${BONE}10`,
          opacity: fadeIn(frame, 10 + i * 6, 8),
        }}>
          <div style={{fontFamily: GROTESK, fontSize: 22, fontWeight: 600, color: BONE, width: 200}}>{c.name}</div>
          <div style={{fontFamily: MONO, fontSize: 14, color: BRASS, width: 160}}>{c.addr}</div>
          <div style={{fontFamily: MONO, fontSize: 12, color: `${BONE}55`, width: 80}}>{c.chain}</div>
          <div style={{fontFamily: MONO, fontSize: 12, color: `${BONE}77`}}>{c.type}</div>
        </div>
      ))}
    </AbsoluteFill>
  );
};

const ProofScene: React.FC<{startFrame: number}> = ({startFrame}) => {
  const frame = useCurrentFrame() - startFrame;
  if (frame < 0) return null;

  const proofs = [
    {label: 'LOCUS PAYMENT', value: 'tx 0x6713...75d0 — 0.10 USDC confirmed on Base'},
    {label: 'ERC-8004 REGISTRATION', value: 'Agent #35324 — tx 0x3c1d...3047'},
    {label: 'TIER UPGRADE', value: 'VOID → SAMPLE — tx 0xab89...5d31'},
    {label: 'SUPERRARE MINT', value: '3 NFTs on Rare Protocol — 0xbCF9...e68'},
    {label: 'FILECOIN STORAGE', value: '12 CIDs — 3 verified mainnet deals'},
    {label: 'ENS IDENTITY', value: 'off-human.eth registered on Sepolia'},
  ];

  return (
    <AbsoluteFill style={{background: INK, padding: 80}}>
      <div style={{fontFamily: MONO, fontSize: 14, color: BRASS, letterSpacing: 3, marginBottom: 40, opacity: fadeIn(frame, 0)}}>
        [ VERIFIED ON-CHAIN PROOF ]
      </div>
      {proofs.map((p, i) => (
        <div key={i} style={{
          padding: '16px 24px', marginBottom: 8,
          background: i % 2 === 0 ? `${BRASS}08` : 'transparent',
          opacity: fadeIn(frame, 10 + i * 8, 10),
        }}>
          <div style={{fontFamily: MONO, fontSize: 11, color: BRASS, letterSpacing: 2, marginBottom: 4}}>{p.label}</div>
          <div style={{fontFamily: MONO, fontSize: 16, color: BONE}}>{p.value}</div>
        </div>
      ))}
    </AbsoluteFill>
  );
};

const ClosingScene: React.FC<{startFrame: number}> = ({startFrame}) => {
  const frame = useCurrentFrame() - startFrame;
  if (frame < 0) return null;

  const quoteOpacity = fadeIn(frame, 10, 20);
  const detailsOpacity = fadeIn(frame, 50, 20);
  const lineWidth = interpolate(frame, [30, 70], [0, 600], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'});

  return (
    <AbsoluteFill style={{background: INK, justifyContent: 'center', alignItems: 'center'}}>
      <div style={{textAlign: 'center', maxWidth: 900}}>
        <div style={{
          fontFamily: GROTESK, fontSize: 40, color: BONE, lineHeight: 1.4,
          opacity: quoteOpacity, fontWeight: 300,
        }}>
          "The agent that enters the NULL store is different from the agent that leaves it."
        </div>
        <div style={{width: lineWidth, height: 1, background: BRASS, margin: '40px auto'}} />
        <div style={{opacity: detailsOpacity}}>
          <div style={{fontFamily: GROTESK, fontSize: 72, fontWeight: 700, color: BONE, letterSpacing: 10, marginBottom: 20}}>NULL</div>
          <div style={{fontFamily: MONO, fontSize: 14, color: BRASS, letterSpacing: 3}}>
            off-human.vercel.app — github.com/BLE77/null
          </div>
          <div style={{fontFamily: MONO, fontSize: 12, color: `${BONE}55`, marginTop: 16, letterSpacing: 2}}>
            5 AGENTS — 474 COMMITS — 11 TRACKS — THE SYNTHESIS HACKATHON
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Main Composition ────────────────────────────────────────────────────────
// 2 minutes = 3600 frames at 30fps
// Scene timing (frames):
//   Title:     0-300    (10s)
//   Stats:     300-540  (8s)
//   Team:      540-840  (10s)
//   Wearables: 840-1200 (12s)
//   Flow:      1200-1560 (12s)
//   Contracts: 1560-1860 (10s)
//   Proofs:    1860-2400 (18s)
//   Closing:   2400-3600 (40s)

export const NullDemo: React.FC = () => {
  return (
    <AbsoluteFill style={{background: INK}}>
      <Sequence from={0} durationInFrames={300}><TitleScene startFrame={0} /></Sequence>
      <Sequence from={300} durationInFrames={240}><StatScene startFrame={300} /></Sequence>
      <Sequence from={540} durationInFrames={300}><AgentTeamScene startFrame={540} /></Sequence>
      <Sequence from={840} durationInFrames={360}><WearablesScene startFrame={840} /></Sequence>
      <Sequence from={1200} durationInFrames={360}><FlowScene startFrame={1200} /></Sequence>
      <Sequence from={1560} durationInFrames={300}><ContractsScene startFrame={1560} /></Sequence>
      <Sequence from={1860} durationInFrames={540}><ProofScene startFrame={1860} /></Sequence>
      <Sequence from={2400} durationInFrames={1200}><ClosingScene startFrame={2400} /></Sequence>
    </AbsoluteFill>
  );
};
