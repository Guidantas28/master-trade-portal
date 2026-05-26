// Fixfy design tokens — ported 1:1 from the trade-portal prototype (primitives.jsx).
// These mirror the `--color-fx-*` custom properties already present in Fixfy OS
// (master-os/src/app/globals.css), so the desktop trade portal stays brand-identical.
//
// Font families are expressed as CSS variables (set on <html> via next/font in
// src/app/layout.tsx) so inline `fontFamily: T.sans` resolves to the loaded Geist face.

export const T = {
  navy: "#020040",
  navyDeep: "#010030",
  navySoft: "#0A0A2E",
  coral: "#ED4B00",
  coralHover: "#F26527",
  coralPress: "#D13F00",
  coralTint: "#FFF1EA",
  ink: "#0A0A1F",
  slate: "#3A3A55",
  mute: "#6B6B85",
  line: "#E4E4EC",
  lineStrong: "#CDCDD8",
  paper: "#F7F7FB",
  paper2: "#EEEEF5",
  white: "#FFFFFF",
  green: "#0E8A5F",
  green50: "#E4F4EC",
  amber: "#C47A00",
  amber50: "#FBEFD6",
  red: "#C8102E",
  red50: "#FBE3E7",
  blue: "#0B5FFF",
  blue50: "#E1ECFF",
  sans: "var(--font-geist), Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  mono: "var(--font-geist-mono), 'JetBrains Mono', ui-monospace, monospace",
  ease: "cubic-bezier(0.2,0,0,1)",
} as const;

export type Tokens = typeof T;
