// Seed data — Marcus, the SW11 plumber/general/carpenter, trial day 2.
// Ported from the design prototype (trade-portal/data.js). All UK-realistic.
//
// UI-FIRST: these constants stand in for the Fixfy OS (master-os) database. Each
// export maps to a real table (see src/types and src/lib/supabase/README.md). When
// wiring real data, replace these imports with Supabase queries returning the same shapes.

import type {
  ActivityItem,
  AvailableJob,
  ChecklistItem,
  Customer,
  Kpis,
  Lead,
  MyJob,
  Partner,
  QuoteRequest,
  ScheduleEvent,
} from "@/types";

export const MARCUS: Partner = {
  id: "usr_marcus",
  firstName: "Marcus",
  lastName: "Adeyemi",
  email: "marcus@example.com",
  phone: "+44 7700 900142",
  initials: "MA",
  avatarBg: "#020040",
  trades: ["Plumbing", "General Maintenance", "Light Carpentry"],
  primaryTrade: "Plumbing",
  postcode: "SW11 4PG",
  radiusMiles: 8,
  tradingName: "Adeyemi Plumbing & Maintenance",
  trialDaysLeft: 1,
  trialEndsOn: "24 May 2026",
  yearsExperience: 11,
  bio: "Battersea-based, 11 years. Gas Safe registered. Same-day call-outs for SW London. Calm in a flooded kitchen.",
  rating: 4.9,
  ratingsCount: 87,
};

export const CUSTOMERS: Customer[] = [
  { id: "c01", name: "Eleanor Whitfield", initials: "EW", priorJobs: 3, address: "14 Battersea Square", postcode: "SW11 3RA" },
  { id: "c02", name: "James Okonkwo", initials: "JO", priorJobs: 0, address: "88 Lavender Hill", postcode: "SW11 5RH" },
  { id: "c03", name: "Priya Shah", initials: "PS", priorJobs: 1, address: "23 Northcote Road", postcode: "SW11 1NJ" },
  { id: "c04", name: "Tom Hargreaves", initials: "TH", priorJobs: 0, address: "Flat 4, 142 Queenstown Rd", postcode: "SW8 4NU" },
  { id: "c05", name: "Aisha Bello", initials: "AB", priorJobs: 2, address: "7 Webbs Road", postcode: "SW11 6RU" },
  { id: "c06", name: "David & Rachel Mead", initials: "DM", priorJobs: 0, address: "31 Latchmere Road", postcode: "SW11 2DS" },
  { id: "c07", name: "Lucia Romano", initials: "LR", priorJobs: 0, address: "12 Battersea Park Road", postcode: "SW11 4JR" },
];

// Fixfy customer enquiries, tradies compete to contact (max 5).
export const LEADS: Lead[] = [
  { id: "L-2026-0418", title: "Leaking radiator valve, lounge", desc: "Drip from TRV on the lounge radiator. Caught in a tub but worsening overnight. Older boiler, last serviced 2024.", trade: "Plumbing", emergency: false, postcode: "SW11 3JT", distance: 0.6, budgetMin: 80, budgetMax: 180, timing: "Within 48 hours", customer: "Eleanor W.", contactedCount: 1, contactedMax: 5, posted: "38 min ago", winnable: true },
  { id: "L-2026-0417", title: "Kitchen tap replacement", desc: "Cold tap drips constantly, mixer is 8 years old. Replacement tap purchased (Bristan Manhattan).", trade: "Plumbing", emergency: false, postcode: "SW11 5LA", distance: 1.1, budgetMin: 120, budgetMax: 200, timing: "Flexible, this week", customer: "James O.", contactedCount: 3, contactedMax: 5, posted: "2h ago" },
  { id: "L-2026-0416", title: "Bedroom door won’t latch", desc: "Hinges sagged, door catches on frame. Soft-close please if you fit those.", trade: "Light Carpentry", emergency: false, postcode: "SW11 1NJ", distance: 0.9, budgetMin: 60, budgetMax: 120, timing: "No rush", customer: "Priya S.", contactedCount: 5, contactedMax: 5, posted: "4h ago", closed: true },
  { id: "L-2026-0414", title: "Loose toilet seat & re-grout shower tray", desc: "Two small jobs. Toilet seat wobbling, also some grout missing along the bottom row of shower tiles.", trade: "General Maintenance", emergency: false, postcode: "SW8 4NU", distance: 1.4, budgetMin: 100, budgetMax: 180, timing: "Saturday morning", customer: "Tom H.", contactedCount: 2, contactedMax: 5, posted: "6h ago" },
  { id: "L-2026-0411", title: "Hot water pressure dropped overnight", desc: "Combi pressure gauge sat at 0.4 bar this morning. Re-pressurised once last winter. Worried it’s the expansion vessel.", trade: "Plumbing", emergency: false, postcode: "SW11 6RU", distance: 0.4, budgetMin: 100, budgetMax: 300, timing: "Today if possible", customer: "Aisha B.", contactedCount: 0, contactedMax: 5, posted: "12 min ago", hot: true },
  { id: "L-2026-0408", title: "Shelf above stairs, 2.4m oak", desc: "Oak shelf already bought. Studs uncertain (lath & plaster). Needs anchors that’ll hold ~25kg.", trade: "Light Carpentry", emergency: false, postcode: "SW11 2DS", distance: 1.6, budgetMin: 80, budgetMax: 160, timing: "This weekend", customer: "David M.", contactedCount: 4, contactedMax: 5, posted: "8h ago" },
  { id: "L-2026-0406", title: "Outside tap install", desc: "Want a garden tap on the side wall, single-storey extension wall. Stopcock is under the sink.", trade: "Plumbing", emergency: false, postcode: "SW11 4JR", distance: 0.8, budgetMin: 180, budgetMax: 320, timing: "Within 2 weeks", customer: "Lucia R.", contactedCount: 2, contactedMax: 5, posted: "1d ago" },
  { id: "L-2026-0402", title: "Squeaky floorboards, bedroom", desc: "Bay window side of master bedroom. Loud squeak in two spots, started after the carpet was lifted.", trade: "Light Carpentry", emergency: false, postcode: "SW11 3RA", distance: 0.7, budgetMin: 100, budgetMax: 200, timing: "Flexible", customer: "Eleanor W.", contactedCount: 1, contactedMax: 5, posted: "1d ago" },
];

// Fixfy-quoted, customer signed off. First trade to accept wins.
export const AVAILABLE_JOBS: AvailableJob[] = [
  { id: "J-2026-1142", title: "Boiler not firing — no heat or hot water", desc: "Worcester Greenstar 30Si. Fault code EA. Customer with two young kids. Fixfy quote already signed.", trade: "Plumbing", emergency: true, expiresMin: 18, postcode: "SW11 4PG", distance: 0.2, duration: "2–3 hours", total: 285.0, timing: "ASAP — today before 18:00" },
  { id: "J-2026-1140", title: "Replace 3 worktop downlights", desc: "Standard GU10 swap. Bulbs already on site. Customer prefers warm white.", trade: "Electrical", emergency: false, postcode: "SW11 5RH", distance: 1.1, duration: "45 min", total: 95.0, timing: "Tomorrow morning" },
  { id: "J-2026-1139", title: "Bathroom radiator swap, like-for-like", desc: "White ladder radiator (already on site). Existing pipework correct centres. Drain-down required.", trade: "Plumbing", emergency: false, postcode: "SW11 1NJ", distance: 0.9, duration: "2 hours", total: 220.0, timing: "Wed 27 May, AM" },
  { id: "J-2026-1136", title: "Re-hang and re-paint front door", desc: "Hinges shot, door dragging. Strip, re-hang, undercoat + 2 coats Farrow & Ball (provided).", trade: "Light Carpentry", emergency: false, postcode: "SW8 4NU", distance: 1.4, duration: "Half day", total: 280.0, timing: "Thu 28 May" },
  { id: "J-2026-1133", title: "Tile splashback above hob", desc: "0.8m x 0.6m metro tile splashback. Tiles, adhesive, grout supplied. Hob to be temporarily lifted.", trade: "General Maintenance", emergency: false, postcode: "SW11 6RU", distance: 0.4, duration: "3 hours", total: 240.0, timing: "This week" },
  { id: "J-2026-1131", title: "Towel rail leak — bleed & repressurise", desc: "Small leak at the bottom union. Customer thinks the olive needs reseating.", trade: "Plumbing", emergency: false, postcode: "SW11 2DS", distance: 1.6, duration: "45 min", total: 110.0, timing: "Flexible" },
  { id: "J-2026-1129", title: "Garage door spring replacement", desc: "Up-and-over canopy door, one spring snapped. Replacement part shipped to customer.", trade: "General Maintenance", emergency: false, postcode: "SW11 4JR", distance: 0.8, duration: "1.5 hours", total: 165.0, timing: "Sat 30 May" },
  { id: "J-2026-1126", title: "Loft hatch + ladder install", desc: "Cut into ceiling, fit insulated hatch + 3-section aluminium ladder. Customer has both products.", trade: "Light Carpentry", emergency: false, postcode: "SW11 3RA", distance: 0.7, duration: "4 hours", total: 320.0, timing: "Mon 1 Jun" },
  { id: "J-2026-1124", title: "Kitchen mixer tap swap", desc: "Old Franke, replacement is Grohe Minta. Isolation valves present.", trade: "Plumbing", emergency: false, postcode: "SW8 5RA", distance: 1.9, duration: "1 hour", total: 130.0, timing: "This week" },
  { id: "J-2026-1121", title: "Shower head + hose replacement", desc: "Mira shower, head & hose only. Tools and parts on site.", trade: "Plumbing", emergency: false, postcode: "SW11 5LA", distance: 1.1, duration: "30 min", total: 75.0, timing: "Flexible" },
  { id: "J-2026-1118", title: "Sticking sash window, lounge", desc: "Bay window, middle sash won’t lift past halfway. Likely paint binding + worn parting bead.", trade: "Light Carpentry", emergency: false, postcode: "SW11 3JT", distance: 0.6, duration: "2 hours", total: 195.0, timing: "Tue 26 May" },
  { id: "J-2026-1115", title: "Bath panel re-fit + sealant", desc: "Acrylic bath panel coming loose, also reseal where bath meets wall.", trade: "General Maintenance", emergency: false, postcode: "SW11 1AA", distance: 1.3, duration: "1 hour", total: 105.0, timing: "Flexible" },
];

export const QUOTES: QuoteRequest[] = [
  { id: "Q-2026-0303", title: "Full ensuite refresh", desc: "Strip and re-tile floor + wet wall, swap basin & taps, new toilet, re-paint ceiling. Tiles already chosen.", trades: ["Plumbing", "General Maintenance"], postcode: "SW11 4PG", distance: 0.2, deadline: "27 May", status: "to-quote" },
  { id: "Q-2026-0301", title: "Garage to study conversion", desc: "Insulate, plasterboard, two double sockets, replace up-and-over with French doors, lay LVT.", trades: ["Light Carpentry", "Electrical", "General Maintenance"], postcode: "SW11 2DS", distance: 1.6, deadline: "01 Jun", status: "to-quote" },
  { id: "Q-2026-0298", title: "Repair + repaint, hallway plaster", desc: "Cracked plaster around stairwell, prep & repaint white (Pure Brilliant). Approx 30sqm wall.", trades: ["General Maintenance"], postcode: "SW11 5RH", distance: 1.1, deadline: "02 Jun", status: "submitted", yourBid: 540, leadingBid: 480 },
  { id: "Q-2026-0294", title: "New combi boiler + Hive thermostat", desc: "Existing Vaillant 824, 12 years old. 3-bed Victorian terrace, 1 bath, 1 ensuite.", trades: ["Plumbing"], postcode: "SW11 3RA", distance: 0.7, deadline: "30 May", status: "submitted", yourBid: 2480, leadingBid: 2380 },
  { id: "Q-2026-0289", title: "Decking re-stain + replace 4 boards", desc: "4m x 3m softwood deck, four boards rotten. Customer has stain and replacement boards.", trades: ["Light Carpentry"], postcode: "SW11 1NJ", distance: 0.9, deadline: "12 May", status: "won", awardedAmount: 380 },
];

// Statuses: scheduled, in_progress, awaiting_signoff, completed
export const MY_JOBS: MyJob[] = [
  { id: "J-2026-1098", source: "job", title: "Boiler service — annual", desc: "Annual service, Worcester 30Si. Customer wants the report emailed for landlord cert.", trade: "Plumbing", customer: CUSTOMERS[0], postcode: "SW11 3RA", distance: 0.7, status: "in_progress", startedAt: "2026-05-23T09:42:00Z", scheduled: "23 May, 09:30–11:30", durationEst: "2 hours", total: 145.0, labour: 110, materials: 35, vat: true, progress: 0.55, checklistDone: 6, checklistTotal: 11, beforePhotos: 2, afterPhotos: 0, notesAdded: true, signed: false, accessNotes: "Buzzer #4. Boiler in airing cupboard, hallway. Cat — don’t let out.", parkingNotes: "Free 1h on Battersea Square. Pay-and-display Battersea Park Rd.", elapsed: "01:18:23" },
  { id: "J-2026-1101", source: "lead", title: "Replace kitchen tap (Bristan Manhattan)", desc: "Customer-supplied tap. Old tap leaking constantly. Isolators present.", trade: "Plumbing", customer: CUSTOMERS[1], postcode: "SW11 5RH", distance: 1.1, status: "scheduled", scheduled: "23 May, 14:00–15:00", durationEst: "1 hour", total: 145.0, labour: 110, materials: 35, vat: true, checklistDone: 0, checklistTotal: 7, beforePhotos: 0, afterPhotos: 0, accessNotes: "Mobile on the door, customer working from home.", parkingNotes: "CPZ — free after 13:30." },
  { id: "J-2026-1103", source: "job", title: "Outside tap install — side wall", desc: "Single-storey wall, stopcock under sink, copper through-wall with isolator.", trade: "Plumbing", customer: CUSTOMERS[6], postcode: "SW11 4JR", distance: 0.8, status: "scheduled", scheduled: "24 May, 09:00–11:30", durationEst: "2.5 hours", total: 260.0, labour: 195, materials: 65, vat: true, checklistDone: 0, checklistTotal: 9, beforePhotos: 0, afterPhotos: 0, accessNotes: "Side gate code 4521.", parkingNotes: "Resident permits only — customer will leave a visitor scratch card." },
  { id: "J-2026-1104", source: "quote", title: "Re-grout shower tray + reseal bath", desc: "Two small jobs. Customer flexible on dust sheets.", trade: "General Maintenance", customer: CUSTOMERS[3], postcode: "SW8 4NU", distance: 1.4, status: "scheduled", scheduled: "25 May, 10:00–12:30", durationEst: "2.5 hours", total: 175.0, labour: 140, materials: 35, vat: true, checklistDone: 0, checklistTotal: 8, beforePhotos: 0, afterPhotos: 0, accessNotes: "Flat 4, top floor. Buzzer broken — ring mobile.", parkingNotes: "CPZ all day. Customer will pay parking on arrival." },
  { id: "J-2026-1107", source: "job", title: "Bedroom door re-hang", desc: "Door catches on frame; hinges sagged. Customer ordered new brass hinges (on site).", trade: "Light Carpentry", customer: CUSTOMERS[2], postcode: "SW11 1NJ", distance: 0.9, status: "scheduled", scheduled: "26 May, 14:30–16:00", durationEst: "1.5 hours", total: 165.0, labour: 130, materials: 35, vat: true, checklistDone: 0, checklistTotal: 7, beforePhotos: 0, afterPhotos: 0, accessNotes: "Dog (friendly) will be in the kitchen.", parkingNotes: "Northcote Rd pay-and-display, £2.50/h." },
  { id: "J-2026-1095", source: "job", title: "Loose toilet seat + minor re-grout", desc: "Customer-supplied seat, plus 4 missing grout lines along shower tray edge.", trade: "General Maintenance", customer: CUSTOMERS[4], postcode: "SW11 6RU", distance: 0.4, status: "awaiting_signoff", scheduled: "22 May, 11:00–12:00", durationEst: "1 hour", total: 95.0, labour: 70, materials: 25, vat: true, checklistDone: 7, checklistTotal: 7, beforePhotos: 2, afterPhotos: 3, notesAdded: true, signed: false, signoffLink: "Sent to customer 22 May, 12:24", accessNotes: "Customer working from home.", parkingNotes: "Free residential street." },
  { id: "J-2026-1086", source: "lead", title: "Hot water pressure repressurise", desc: "Combi pressure low, repressurised + checked expansion vessel pre-charge.", trade: "Plumbing", customer: CUSTOMERS[4], postcode: "SW11 6RU", distance: 0.4, status: "completed", completed: "19 May 2026", scheduled: "19 May, 16:00–17:00", durationEst: "1 hour", total: 120.0, labour: 95, materials: 25, vat: true, checklistDone: 6, checklistTotal: 6, beforePhotos: 3, afterPhotos: 3, notesAdded: true, signed: true, rating: 5, ratingComment: "Quick, tidy, explained the gauge clearly. Will book again.", selfBillOn: "29 May 2026" },
  { id: "J-2026-1078", source: "job", title: "Drip from bathroom basin trap", desc: "Old trap perished, swapped for shallow bottle trap.", trade: "Plumbing", customer: CUSTOMERS[0], postcode: "SW11 3RA", distance: 0.7, status: "completed", completed: "17 May 2026", scheduled: "17 May, 10:30–11:30", durationEst: "1 hour", total: 110.0, labour: 85, materials: 25, vat: true, checklistDone: 5, checklistTotal: 5, beforePhotos: 2, afterPhotos: 2, notesAdded: true, signed: true, rating: 5, ratingComment: "Marcus is our go-to. Already booked him for the boiler service.", selfBillOn: "24 May 2026" },
];

export const ACTIVITY: ActivityItem[] = [
  { id: "a01", type: "lead", when: "12 min ago", icon: "sparkles", tone: "coral", text: "New lead matched: Hot water pressure dropped overnight — Webbs Road, SW11", meta: "0.4 mi away · £100–£300" },
  { id: "a02", type: "job", when: "38 min ago", icon: "wrench", tone: "coral", text: "Emergency job posted: Boiler not firing — Sussex Mansions", meta: "0.2 mi · expires in 18 min" },
  { id: "a03", type: "rating", when: "2 hours ago", icon: "star", tone: "amber", text: "Eleanor W. left a 5★ review on your basin trap job" },
  { id: "a04", type: "signoff", when: "Yesterday", icon: "check-circle-2", tone: "green", text: "Aisha B. signed off the pressure repressurise. Payment scheduled for 29 May." },
  { id: "a05", type: "trial", when: "Yesterday", icon: "clock", tone: "navy", text: "Trial ends in 1 day. You’ll be charged £99 on 24 May." },
  { id: "a06", type: "quote", when: "2 days ago", icon: "file-check", tone: "green", text: "Your quote on “Decking re-stain” was accepted (£380)" },
];

// Day numbers correspond to May 2026 (Fri 1 -> Sun 31)
export const SCHEDULE_EVENTS: ScheduleEvent[] = [
  { day: 23, start: "09:30", end: "11:30", title: "Boiler service", status: "in_progress", customer: "Eleanor W.", jobId: "J-2026-1098" },
  { day: 23, start: "14:00", end: "15:00", title: "Kitchen tap swap", status: "scheduled", customer: "James O.", jobId: "J-2026-1101" },
  { day: 24, start: "09:00", end: "11:30", title: "Outside tap install", status: "scheduled", customer: "Lucia R.", jobId: "J-2026-1103" },
  { day: 25, start: "10:00", end: "12:30", title: "Re-grout shower + bath", status: "scheduled", customer: "Tom H.", jobId: "J-2026-1104" },
  { day: 26, start: "14:30", end: "16:00", title: "Bedroom door re-hang", status: "scheduled", customer: "Priya S.", jobId: "J-2026-1107" },
  { day: 22, start: "11:00", end: "12:00", title: "Toilet seat + grout", status: "awaiting", customer: "Aisha B.", jobId: "J-2026-1095" },
  { day: 19, start: "16:00", end: "17:00", title: "Pressure repressurise", status: "completed", customer: "Aisha B.", jobId: "J-2026-1086" },
  { day: 17, start: "10:30", end: "11:30", title: "Basin trap", status: "completed", customer: "Eleanor W.", jobId: "J-2026-1078" },
  { day: 27, start: "08:00", end: "18:00", title: "Holiday — Brighton", status: "block", customer: "", jobId: "" },
];

export const CHECKLISTS: Record<string, ChecklistItem[]> = {
  "J-2026-1098": [
    { id: 1, label: "Isolate gas & water at appliance", done: true, required: true },
    { id: 2, label: "Visual inspection of casing & flue", done: true, required: true },
    { id: 3, label: "Combustion analysis — record ratios", done: true, required: true, note: "CO/CO₂ ratio 0.0023, within spec" },
    { id: 4, label: "Clean condensate trap", done: true, required: true },
    { id: 5, label: "Check expansion vessel pre-charge", done: true, required: true, note: "Re-charged to 1.0 bar" },
    { id: 6, label: "Check & clean magnetic filter", done: true, required: true },
    { id: 7, label: "Test flow & return temperatures", done: false, required: true },
    { id: 8, label: "Check pressure relief valve operation", done: false, required: true },
    { id: 9, label: "Replace boiler casing & test fire", done: false, required: true },
    { id: 10, label: "Issue Gas Safe service record to customer", done: false, required: true },
    { id: 11, label: "Recommend follow-up if needed", done: false, required: false },
  ],
  "J-2026-1095": [
    { id: 1, label: "Photograph before condition", done: true, required: true },
    { id: 2, label: "Remove old seat, clean fixings", done: true, required: true },
    { id: 3, label: "Fit new seat, torque-check fixings", done: true, required: true },
    { id: 4, label: "Rake out failed grout lines", done: true, required: true },
    { id: 5, label: "Re-grout, smooth & wipe back", done: true, required: true },
    { id: 6, label: "Photograph after", done: true, required: true },
    { id: 7, label: "Demo to customer & answer questions", done: true, required: false },
  ],
};

export const KPIS: Kpis = {
  thisWeek: { value: 1245.0, delta: "+18% vs last week", trend: [620, 480, 720, 980, 1145, 1245, 1245] },
  newLeads: { value: 8, delta: "5 matched in last 24h" },
  available: { value: 12, delta: "1 emergency, 0.2 mi away" },
  active: { value: 5, delta: "1 in progress now" },
};
