// All data here is mock data for the prototype. Nothing is real.

// Traditional Play Whe "marks". Verify against the official chart before launch.
export const MARKS: { n: number; name: string; icon: string }[] = [
  [1, "Centipede", "🐛"], [2, "Old Lady", "👵"], [3, "Carriage", "🛺"],
  [4, "Dead Man", "💀"], [5, "Parson Man", "⛪"], [6, "Belly", "🤰"],
  [7, "Hog", "🐖"], [8, "Tiger", "🐯"], [9, "Cattle", "🐂"],
  [10, "Monkey", "🐒"], [11, "Corbeau", "🦅"], [12, "King", "👑"],
  [13, "Crapaud", "🐸"], [14, "Money", "💰"], [15, "Sick Woman", "🤒"],
  [16, "Jamette", "💃"], [17, "Pigeon", "🕊️"], [18, "Water Boat", "⛵"],
  [19, "Horse", "🐎"], [20, "Dog", "🐕"], [21, "Mouth", "👄"],
  [22, "Rat", "🐀"], [23, "House", "🏠"], [24, "Queen", "👸"],
  [25, "Morocoy", "🐢"], [26, "Fowl", "🐓"], [27, "Little Snake", "🐍"],
  [28, "Red Fish", "🐟"], [29, "Opium Man", "🎩"], [30, "House Cat", "🐈"],
  [31, "Bull", "🐃"], [32, "Wash Belly", "🧺"], [33, "Goat", "🐐"],
  [34, "Pretty Woman", "💄"], [35, "Big Snake", "🐉"], [36, "Big Boy", "🦍"],
].map(([n, name, icon]) => ({ n: n as number, name: name as string, icon: icon as string }));

export const DRAWS = [
  { label: "10:30 AM", h: 10, m: 30 },
  { label: "1:00 PM", h: 13, m: 0 },
  { label: "4:00 PM", h: 16, m: 0 },
  { label: "7:00 PM", h: 19, m: 0 },
] as const;

export const ATTACH_TIERS = [
  { id: "MB", odds: 70, tag: "Bronze" },
  { id: "MU", odds: 100, tag: "Silver" },
  { id: "MX", odds: 125, tag: "Max" },
] as const;

export const CHIPS = [1, 5, 10, 20, 50, 100] as const;

export const BASE_PAYOUT = 35;
// Mock "hot" numbers get a reduced payout, like #21 on the original site.
export const HOT: Record<number, number> = { 21: 30, 7: 32, 22: 33 };
export const payoutFor = (n: number) => HOT[n] ?? BASE_PAYOUT;

export const LAST_DRAW = {
  issue: 27580,
  winning: 11,
  bonus: { MB: false, MU: true, MX: false },
  trail: [8, 12, 20, 27, 32],
};
export const CURRENT_ISSUE = 27581;

export const MOCK_WINNERS = [
  "Kareem R. just hit #12 King for TT$3,500",
  "Anisa P. won TT$8,750 on #22 Rat + MX",
  "Devon B. cashed TT$1,750 on #8 Tiger",
  "Shanice M. won TT$12,500 on #14 Money + MU",
  "Rishi D. hit #27 Little Snake for TT$700",
  "Marcus T. won TT$6,250 on #3 Carriage + MX",
];
