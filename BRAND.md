# Takumi AutoLabs brand implementation notes

This site implements the approved **Calm Operational Intelligence** identity; these notes document implementation rather than introduce a new direction.

## Positioning and voice

**Takumi AutoLabs — Business Systems Implementation & Automation.** Core message: **Build better systems. Run better businesses.** The voice is practical, precise, approachable, and grounded in business operations. Explain what a system or workflow improves instead of relying on AI claims or generic technology language.

## Palette

| Token | Name | Hex | Usage |
| --- | --- | --- | --- |
| `--carbon` | Carbon | `#111614` | Primary page canvas |
| `--carbon-raised` | Carbon raised | `#171E1B` | Quiet card surface |
| `--slate` | Slate | `#202925` | Secondary surface |
| `--slate-raised` | Slate raised | `#28332E` | Raised surface |
| `--chalk` | Chalk | `#E8EAE3` | Primary text |
| `--fog` | Fog | `#A7B0A9` | Supporting text and metadata |
| `--amber` | Signal Amber | `#E4A74B` | Primary action, selected states, decision accents |
| `--sage` | Flow Sage | `#86A88E` | Success or healthy-state accent |
| `--teal` | Connection Teal | `#80AAA1` | Supporting connection accent |
| `--exception` | Exception | `#C87861` | Reserve for exceptions |

Use dark neutral surfaces as the foundation. Signal Amber should direct attention, not flood surfaces; supporting greens and teal communicate flow and connection. Keep borders restrained, and avoid glows, gratuitous gradients, and decorative motion.

## Type

Manrope is the primary display/body/interface family. IBM Plex Mono is reserved for short technical labels, metadata, and system-status text. CSS provides system fallbacks if hosted fonts are unavailable. Body copy remains comfortably sized with open line spacing; mono labels stay small and limited.

## Mark and visual motifs

`assets/logo.svg` is the approved **Connected core** concept: four operational modules connected through a central node. `assets/favicon.svg` adapts it for a small dark-canvas mark. Keep its geometry simple and legible. The website uses connected-system paths, process diagrams, sample operations screens, fine borders, and structured section labels to make operational concepts legible.

The dashboard values are sample visuals only. Every illustrative dashboard must keep the exact visible label **“ILLUSTRATIVE OPERATIONS DASHBOARD · SAMPLE DATA”**. Portfolio diagrams are concepts, not client evidence.
