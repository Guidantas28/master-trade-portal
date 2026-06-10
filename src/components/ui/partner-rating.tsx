"use client";

import type { CSSProperties } from "react";
import { T } from "@/lib/tokens";
import {
  PARTNER_RATING_MAX,
  partnerRatingLabel,
  partnerRatingTone,
  type PartnerComplaintDetail,
} from "@/lib/partner-rating";

const TONE_COLORS = {
  green: { main: T.green, soft: T.green50, border: T.green },
  amber: { main: T.amber, soft: T.amber50, border: "#F3D9A4" },
  coral: { main: T.coral, soft: "#FFF0ED", border: "#F5C4BC" },
} as const;

function starFill(rating: number, index: number): "full" | "half" | "empty" {
  const threshold = index + 1;
  if (rating >= threshold) return "full";
  if (rating >= threshold - 0.5) return "half";
  return "empty";
}

export function PartnerRatingStars({
  rating,
  size = 14,
  gap = 2,
}: {
  rating: number;
  size?: number;
  gap?: number;
}) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap, lineHeight: 1 }} aria-hidden>
      {Array.from({ length: 5 }, (_, i) => {
        const fill = starFill(rating, i);
        return (
          <span
            key={i}
            style={{
              position: "relative",
              fontSize: size,
              width: size,
              height: size,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ color: "#E0DCD4" }}>★</span>
            {fill !== "empty" && (
              <span
                style={{
                  position: "absolute",
                  inset: 0,
                  overflow: "hidden",
                  width: fill === "half" ? "50%" : "100%",
                  color: "#F5B942",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                }}
              >
                ★
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}

export function PartnerRatingInline({
  rating,
  size = "sm",
  showMax = false,
  dark = false,
}: {
  rating: number;
  size?: "xs" | "sm" | "md";
  showMax?: boolean;
  dark?: boolean;
}) {
  const tone = partnerRatingTone(rating);
  const colors = TONE_COLORS[tone];
  const starSize = size === "xs" ? 11 : size === "md" ? 16 : 13;
  const numSize = size === "xs" ? 12 : size === "md" ? 20 : 14;

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: size === "xs" ? 4 : 6 }}>
      <PartnerRatingStars rating={rating} size={starSize} />
      <span
        className="fx-mono"
        style={{
          fontSize: numSize,
          fontWeight: 600,
          color: dark ? T.white : colors.main,
          lineHeight: 1,
        }}
      >
        {rating.toFixed(1)}
      </span>
      {showMax && (
        <span style={{ fontSize: numSize - 3, color: dark ? "rgba(255,255,255,0.5)" : T.mute }}>
          /{PARTNER_RATING_MAX.toFixed(1)}
        </span>
      )}
    </span>
  );
}

export function PartnerRatingCard({
  rating,
  topComplaints = [],
  style,
  compact = false,
}: {
  rating: number;
  complaintCount?: number;
  pointsLost?: number;
  topComplaints?: PartnerComplaintDetail[];
  style?: CSSProperties;
  compact?: boolean;
}) {
  const tone = partnerRatingTone(rating);
  const colors = TONE_COLORS[tone];
  const label = partnerRatingLabel(rating);
  const pct = Math.round((rating / PARTNER_RATING_MAX) * 100);

  return (
    <div
      style={{
        padding: compact ? 12 : 16,
        borderRadius: 12,
        border: `1px solid ${colors.border}`,
        background: `linear-gradient(135deg, ${colors.soft} 0%, ${T.white} 72%)`,
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.mute, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
            Partner score
          </div>
          <PartnerRatingInline rating={rating} size={compact ? "sm" : "md"} showMax />
          <div
            style={{
              marginTop: 6,
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontSize: 11,
              fontWeight: 600,
              color: colors.main,
              padding: "2px 8px",
              borderRadius: 9999,
              background: "rgba(255,255,255,0.75)",
            }}
          >
            {label}
          </div>
        </div>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            border: `3px solid ${colors.main}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            background: T.white,
          }}
        >
          <span className="fx-mono" style={{ fontSize: 15, fontWeight: 700, color: T.navy }}>
            {pct}%
          </span>
        </div>
      </div>

      <div style={{ marginTop: compact ? 10 : 12, height: 6, borderRadius: 9999, background: "rgba(2,0,64,0.06)", overflow: "hidden" }}>
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            borderRadius: 9999,
            background: `linear-gradient(90deg, ${colors.main}, ${tone === "green" ? "#3DD68C" : tone === "amber" ? "#F5C842" : "#FF8A7A"})`,
            transition: "width 400ms ease",
          }}
        />
      </div>

      <p style={{ margin: compact ? "10px 0 0" : "12px 0 0", fontSize: 11.5, color: T.slate, lineHeight: 1.5 }}>
        Higher scores get priority when leads, quotes, and jobs are offered, a lower rating can reduce your volume.
      </p>

      {topComplaints.length > 0 ? (
        <div
          style={{
            marginTop: compact ? 10 : 12,
            fontSize: 10,
            fontWeight: 700,
            color: T.coral,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          Biggest impact: Complaints
        </div>
      ) : null}
    </div>
  );
}
