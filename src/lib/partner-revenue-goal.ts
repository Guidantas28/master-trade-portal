/** Partner monthly revenue goal for dashboard gamification (no OS setting yet). */
export const DEFAULT_PARTNER_MONTHLY_GOAL_GBP = 5000;

export type PartnerLevelTone = "mute" | "coral" | "amber" | "green" | "navy";

export type PartnerLevelConfig = {
  level: number;
  minPct: number;
  name: string;
  priorityLabel: string;
  tone: PartnerLevelTone;
};

export const PARTNER_LEVELS: readonly PartnerLevelConfig[] = [
  {
    level: 1,
    minPct: 0,
    name: "Starter",
    priorityLabel: "Standard queue for leads, quotes & jobs",
    tone: "mute",
  },
  {
    level: 2,
    minPct: 25,
    name: "Rising",
    priorityLabel: "Better visibility on new opportunities",
    tone: "coral",
  },
  {
    level: 3,
    minPct: 50,
    name: "Priority",
    priorityLabel: "Higher priority on leads, quotes & jobs",
    tone: "amber",
  },
  {
    level: 4,
    minPct: 100,
    name: "Elite",
    priorityLabel: "Top priority — first to see new work",
    tone: "green",
  },
] as const;

export const ELITE_PLUS_CONFIG = {
  level: 5,
  name: "Elite+",
  priorityLabel: "You've doubled your target — maximum priority this month",
  tone: "navy" as PartnerLevelTone,
  stretchMultiplier: 2,
};

export type PartnerLevelIconId = "circle-dot" | "trending-up" | "zap" | "crown" | "gem";

export const PARTNER_LEVEL_ICONS: Record<number, PartnerLevelIconId> = {
  1: "circle-dot",
  2: "trending-up",
  3: "zap",
  4: "crown",
  5: "gem",
};

export function resolvePartnerMonthlyGoal(weekEarnings: number): number {
  if (weekEarnings <= 0) return DEFAULT_PARTNER_MONTHLY_GOAL_GBP;
  // Stretch goal: ~4.3 weeks at current pace, rounded to nearest £250.
  const pace = Math.ceil((weekEarnings * 4.3) / 250) * 250;
  return Math.max(DEFAULT_PARTNER_MONTHLY_GOAL_GBP, pace);
}

export function revenueGoalProgress(earned: number, goal: number): {
  earned: number;
  goal: number;
  pct: number;
  remaining: number;
  hit: boolean;
} {
  const safeGoal = Math.max(1, goal);
  const pct = Math.min(100, Math.round((earned / safeGoal) * 100));
  return {
    earned,
    goal: safeGoal,
    pct,
    remaining: Math.max(0, safeGoal - earned),
    hit: earned >= safeGoal,
  };
}

export type PartnerLevelMilestone = {
  pct: number;
  amount: number;
  label: string;
};

/** Tick marks for the progress bar (25/50/75/100% of goal, plus 2× stretch). */
export function partnerLevelMilestones(goal: number): PartnerLevelMilestone[] {
  const safeGoal = Math.max(1, goal);
  const stretch = safeGoal * ELITE_PLUS_CONFIG.stretchMultiplier;
  return [
    { pct: 25, amount: safeGoal * 0.25, label: "L2" },
    { pct: 50, amount: safeGoal * 0.5, label: "L3" },
    { pct: 75, amount: safeGoal * 0.75, label: "" },
    { pct: 100, amount: safeGoal, label: "L4" },
    { pct: 200, amount: stretch, label: "2×" },
  ];
}

export type PartnerLevelState = {
  level: number;
  name: string;
  priorityLabel: string;
  tone: PartnerLevelTone;
  pct: number;
  goal: number;
  earned: number;
  nextLevel: PartnerLevelConfig | null;
  amountToNext: number;
  isElitePlus: boolean;
  stretchGoal: number;
  stretchPct: number;
  footerLine: string;
  barPct: number;
  icon: PartnerLevelIconId;
};

function levelForPct(pct: number): PartnerLevelConfig {
  if (pct >= 100) return PARTNER_LEVELS[3];
  if (pct >= 50) return PARTNER_LEVELS[2];
  if (pct >= 25) return PARTNER_LEVELS[1];
  return PARTNER_LEVELS[0];
}

function nextLevelFor(current: PartnerLevelConfig): PartnerLevelConfig | null {
  const idx = PARTNER_LEVELS.findIndex((l) => l.level === current.level);
  if (idx < 0 || idx >= PARTNER_LEVELS.length - 1) return null;
  return PARTNER_LEVELS[idx + 1];
}

export function partnerLevelFromProgress(earned: number, goal: number): PartnerLevelState {
  const safeGoal = Math.max(1, goal);
  const pct = Math.round((earned / safeGoal) * 100);
  const stretchGoal = safeGoal * ELITE_PLUS_CONFIG.stretchMultiplier;
  const isElitePlus = earned >= stretchGoal;
  const stretchPct = Math.min(200, Math.round((earned / safeGoal) * 100));

  if (isElitePlus) {
    return {
      level: ELITE_PLUS_CONFIG.level,
      name: ELITE_PLUS_CONFIG.name,
      priorityLabel: ELITE_PLUS_CONFIG.priorityLabel,
      tone: ELITE_PLUS_CONFIG.tone,
      pct,
      goal: safeGoal,
      earned,
      nextLevel: null,
      amountToNext: 0,
      isElitePlus: true,
      stretchGoal,
      stretchPct,
      footerLine: ELITE_PLUS_CONFIG.priorityLabel,
      barPct: 100,
      icon: PARTNER_LEVEL_ICONS[5],
    };
  }

  if (earned >= safeGoal) {
    const toDouble = Math.max(0, stretchGoal - earned);
    return {
      level: PARTNER_LEVELS[3].level,
      name: PARTNER_LEVELS[3].name,
      priorityLabel: PARTNER_LEVELS[3].priorityLabel,
      tone: PARTNER_LEVELS[3].tone,
      pct,
      goal: safeGoal,
      earned,
      nextLevel: null,
      amountToNext: toDouble,
      isElitePlus: false,
      stretchGoal,
      stretchPct,
      footerLine:
        toDouble > 0
          ? `Elite unlocked — top priority this month · £${Math.ceil(toDouble).toLocaleString("en-GB")} to double your goal`
          : "Elite unlocked — top priority this month",
      barPct: 100,
      icon: PARTNER_LEVEL_ICONS[4],
    };
  }

  const current = levelForPct(pct);
  const next = nextLevelFor(current);
  const nextThreshold = next ? (next.minPct / 100) * safeGoal : safeGoal;
  const amountToNext = Math.max(0, Math.ceil(nextThreshold - earned));

  let footerLine: string;
  if (next) {
    footerLine = `£${amountToNext.toLocaleString("en-GB")} to Level ${next.level} · ${next.priorityLabel.toLowerCase()}`;
  } else {
    footerLine = current.priorityLabel;
  }

  return {
    level: current.level,
    name: current.name,
    priorityLabel: current.priorityLabel,
    tone: current.tone,
    pct,
    goal: safeGoal,
    earned,
    nextLevel: next,
    amountToNext,
    isElitePlus: false,
    stretchGoal,
    stretchPct,
    footerLine,
    barPct: Math.min(100, pct),
    icon: PARTNER_LEVEL_ICONS[current.level] ?? PARTNER_LEVEL_ICONS[1],
  };
}
