/** Partner monthly revenue goal for dashboard gamification (no OS setting yet). */
export const DEFAULT_PARTNER_MONTHLY_GOAL_GBP = 5000;

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
