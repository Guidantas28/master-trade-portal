"use client";

import type { CSSProperties, ReactNode } from "react";
import { T } from "@/lib/tokens";

const ON_2 = "rgba(255,255,255,0.72)";
const ON_LINE_2 = "rgba(255,255,255,0.16)";

export function AuthWordmark({ light, size = 22 }: { light?: boolean; size?: number }) {
  const fix = light ? "#fff" : T.navy;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 9, fontWeight: 600, fontSize: size, letterSpacing: "-0.03em", lineHeight: 1 }}>
      {light && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/fixfy-icon.png" alt="" style={{ height: size * 1.18, width: "auto" }} />
      )}
      <span style={{ display: "inline-flex", alignItems: "baseline" }}>
        <span style={{ color: fix }}>fix</span>
        <span style={{ color: T.coral }}>fy</span>
      </span>
      <span
        style={{
          fontFamily: T.mono,
          fontSize: size * 0.42,
          fontWeight: 500,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: light ? ON_2 : T.mute,
          border: `1px solid ${light ? ON_LINE_2 : T.line}`,
          borderRadius: 4,
          padding: "3px 7px",
          alignSelf: "center",
        }}
      >
        Trade
      </span>
    </span>
  );
}

/** Navy brand panel background — same radial gradients + grid as the login page. */
export function BrandPanelBackground({
  children,
  style,
  className,
}: {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        position: "relative",
        background: T.navy,
        color: T.white,
        overflow: "hidden",
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(900px 500px at 12% 0%, rgba(237,75,0,0.20), transparent 60%), radial-gradient(700px 600px at 100% 100%, rgba(11,95,255,0.14), transparent 55%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "46px 46px",
          maskImage: "radial-gradient(700px 500px at 30% 30%, #000, transparent 75%)",
          WebkitMaskImage: "radial-gradient(700px 500px at 30% 30%, #000, transparent 75%)",
        }}
      />
      <div style={{ position: "relative", height: "100%", minHeight: "100%", display: "flex", flexDirection: "column" }}>{children}</div>
    </div>
  );
}
