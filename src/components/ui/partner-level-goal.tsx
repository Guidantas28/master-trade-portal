"use client";

import { CircleDot, Crown, Gem, TrendingUp, Zap, type LucideIcon } from "lucide-react";
import { T } from "@/lib/tokens";
import { formatGBP } from "@/lib/format";
import {
  partnerLevelFromProgress,
  partnerLevelMilestones,
  type PartnerLevelIconId,
  type PartnerLevelTone,
} from "@/lib/partner-revenue-goal";

const LEVEL_ICONS: Record<PartnerLevelIconId, LucideIcon> = {
  "circle-dot": CircleDot,
  "trending-up": TrendingUp,
  zap: Zap,
  crown: Crown,
  gem: Gem,
};

const TONE_STYLES: Record<
  PartnerLevelTone,
  { badgeBg: string; badgeColor: string; bar: string }
> = {
  mute: { badgeBg: T.paper2, badgeColor: T.slate, bar: `linear-gradient(90deg, ${T.mute}, #9B9BB0)` },
  coral: { badgeBg: T.coralTint, badgeColor: T.coral, bar: `linear-gradient(90deg, ${T.coral}, #ff8a4c)` },
  amber: { badgeBg: T.amber50, badgeColor: T.amber, bar: `linear-gradient(90deg, ${T.amber}, #F5C842)` },
  green: { badgeBg: T.green50, badgeColor: T.green, bar: `linear-gradient(90deg, ${T.green}, #3DD68C)` },
  navy: { badgeBg: T.blue50, badgeColor: T.navy, bar: `linear-gradient(90deg, ${T.navy}, ${T.blue})` },
};

export function PartnerLevelIcon({
  icon,
  tone,
  size = 14,
}: {
  icon: PartnerLevelIconId;
  tone: PartnerLevelTone;
  size?: number;
}) {
  const Icon = LEVEL_ICONS[icon];
  const styles = TONE_STYLES[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size + 10,
        height: size + 10,
        borderRadius: 9999,
        background: styles.badgeBg,
        color: styles.badgeColor,
        flexShrink: 0,
      }}
    >
      <Icon size={size} strokeWidth={2.25} />
    </span>
  );
}

export function PartnerLevelGoal({ earned, goal }: { earned: number; goal: number }) {
  const level = partnerLevelFromProgress(earned, goal);
  const milestones = partnerLevelMilestones(goal);
  const styles = TONE_STYLES[level.tone];
  const displayPct = level.isElitePlus ? 100 : level.barPct;

  return (
    <div style={{ flex: 1, minWidth: 200 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          marginBottom: 6,
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 11,
            fontWeight: 600,
            padding: "3px 8px 3px 4px",
            borderRadius: 9999,
            background: styles.badgeBg,
            color: styles.badgeColor,
          }}
        >
          <PartnerLevelIcon icon={level.icon} tone={level.tone} size={13} />
          Level {level.level} · {level.name}
        </span>
        <span style={{ fontSize: 12, color: T.mute, fontFamily: T.mono }}>
          {formatGBP(earned)} / {formatGBP(goal)} · {level.pct}%
        </span>
      </div>

      <div style={{ position: "relative", marginBottom: 8 }}>
        <div style={{ height: 6, borderRadius: 9999, background: T.paper2, overflow: "hidden" }}>
          <div
            style={{
              width: `${displayPct}%`,
              height: "100%",
              borderRadius: 9999,
              background: styles.bar,
              transition: "width 400ms ease",
            }}
          />
        </div>
        {milestones
          .filter((m) => m.pct <= 100)
          .map((m) => (
            <span
              key={m.pct}
              title={m.label || `${m.pct}%`}
              style={{
                position: "absolute",
                left: `${m.pct}%`,
                top: -2,
                width: 2,
                height: 10,
                marginLeft: -1,
                borderRadius: 1,
                background: level.pct >= m.pct ? "rgba(255,255,255,0.85)" : T.lineStrong,
                opacity: 0.9,
              }}
            />
          ))}
      </div>

      <p style={{ margin: 0, fontSize: 11.5, color: T.slate, lineHeight: 1.45 }}>{level.footerLine}</p>
    </div>
  );
}
