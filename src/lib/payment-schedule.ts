// Bi-weekly partner payout schedule — every other Friday, covering two full Mon–Sun weeks.

const LONDON = "Europe/London";

/** Reference pay Friday and the week-1 Monday it covers (matches ops calendar). */
const PAY_ANCHOR = new Date(2026, 5, 26, 12, 0, 0); // Fri 26 Jun 2026
const PERIOD_ANCHOR_MON = new Date(2026, 5, 8, 12, 0, 0); // Mon 8 Jun 2026

export interface WeekRange {
  start: Date;
  end: Date;
}

export interface PayPeriod {
  payFriday: Date;
  week1: WeekRange;
  week2: WeekRange;
}

function toLondonNoon(d: Date): Date {
  const s = d.toLocaleDateString("en-CA", { timeZone: LONDON });
  const [y, m, day] = s.split("-").map(Number);
  return new Date(y, m - 1, day, 12, 0, 0);
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function mondayOf(d: Date): Date {
  const x = toLondonNoon(d);
  const dow = x.getDay();
  const back = dow === 0 ? 6 : dow - 1;
  return addDays(x, -back);
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((toLondonNoon(b).getTime() - toLondonNoon(a).getTime()) / 86_400_000);
}

export function fmtDay(d: Date): string {
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: LONDON });
}

export function fmtPayFriday(d: Date): string {
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: LONDON });
}

export function fmtRange(start: Date, end: Date): string {
  const sm = start.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: LONDON });
  const em = end.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: LONDON });
  return `${sm} → ${em}`;
}

export function coverageForPayFriday(payFriday: Date): { week1: WeekRange; week2: WeekRange } {
  const week2End = addDays(payFriday, -5);
  const week2Start = addDays(week2End, -6);
  const week1End = addDays(week2Start, -1);
  const week1Start = addDays(week1End, -6);
  return { week1: { start: week1Start, end: week1End }, week2: { start: week2Start, end: week2End } };
}

function payFridayForPeriodIndex(index: number): Date {
  return addDays(PAY_ANCHOR, index * 14);
}

function periodIndexForDate(d: Date): number {
  const mon = mondayOf(d);
  const weeksSince = Math.floor(daysBetween(PERIOD_ANCHOR_MON, mon) / 7);
  return Math.floor(weeksSince / 2);
}

/** Pay Friday for the bi-weekly period that contains `d` (by job start / work date). */
export function payFridayForDate(d: Date): Date {
  return payFridayForPeriodIndex(periodIndexForDate(d));
}

/** The next pay Friday on or after today — for the period currently in progress or just ended. */
export function getYourNextPayment(from = new Date()): PayPeriod {
  const today = toLondonNoon(from);
  let idx = periodIndexForDate(today);
  let payFriday = payFridayForPeriodIndex(idx);
  let { week1, week2 } = coverageForPayFriday(payFriday);
  if (today > week2.end) {
    idx += 1;
    payFriday = payFridayForPeriodIndex(idx);
    ({ week1, week2 } = coverageForPayFriday(payFriday));
  }
  return { payFriday, week1, week2 };
}

export function upcomingPayments(from = new Date(), count = 4): PayPeriod[] {
  const next = getYourNextPayment(from);
  const startIdx = Math.round(daysBetween(PAY_ANCHOR, next.payFriday) / 14);
  const out: PayPeriod[] = [];
  for (let i = 0; i < count; i++) {
    const payFriday = payFridayForPeriodIndex(startIdx + i);
    const { week1, week2 } = coverageForPayFriday(payFriday);
    out.push({ payFriday, week1, week2 });
  }
  return out;
}

/** Example job date for the "easy example" — Tuesday of week 1 of next payment. */
export function exampleJobDate(period: PayPeriod): Date {
  return addDays(period.week1.start, 1);
}
