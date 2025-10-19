// Rotating Saturday reminder for 9 areas at 9:00 AM America/New_York
// Sends a free push via ntfy (https://ntfy.sh)

import { DateTime } from "luxon";

const AREAS = [
  "Kitchen",
  "Living Room",
  "Den",
  "Laundry Room & Downstairs Bathroom",
  "Mia's Room",
  "Office",
  "Master Bedroom",
  "Upstairs Bathroom",
  "Stairs & Hallway",
];

// Week 1 start date (Saturday). Change if you want a different starting point.
const START_DATE = "2025-10-25"; // YYYY-MM-DD

// ntfy config (topic required; server optional)
const NTFY_TOPIC  = process.env.NTFY_TOPIC;              // e.g. deepclean-3f7b9a
const NTFY_SERVER = process.env.NTFY_SERVER || "https://ntfy.sh";

if (!NTFY_TOPIC) {
  console.error("Missing NTFY_TOPIC env var.");
  process.exit(1);
}

// Figure out local NY time now, and only send exactly at 9:00 AM Saturday
const nowNY = DateTime.now().setZone("America/New_York");
const isSaturday = nowNY.weekday === 6; // 1=Mon ... 6=Sat 7=Sun
const isNineSharp = nowNY.hour === 9 && nowNY.minute === 0;

if (!isSaturday || !isNineSharp) {
  console.log(`Gate: Not 9:00 AM Saturday in NY (now: ${nowNY.toISO()}). Exiting.`);
  process.exit(0);
}

// Compute week index since START_DATE (NY local)
const startNY = DateTime.fromISO(START_DATE, { zone: "America/New_York" }).startOf("day");
let weeksSince = Math.floor(nowNY.startOf("day").diff(startNY, "days").days / 7);
if (weeksSince < 0) weeksSince = 0;

const idx = ((weeksSince % AREAS.length) + AREAS.length) % AREAS.length;
const area = AREAS[idx];

// Optional per-area checklist (edit freely)
const CHECKLIST = {
  "Kitchen": [
    "Deep clean oven/range",
    "Wipe fridge shelves & doors",
    "Clean cabinet fronts/handles",
    "Mop under appliances",
  ],
  "Living Room": [
    "Vacuum sofa/rugs",
    "Dust surfaces & electronics",
    "Clean windows/frames",
    "Wipe baseboards",
  ],
  "Den": [
    "Dust media/equipment",
    "Organize books/games",
    "Wash throw blankets",
    "Vacuum edges/under furniture",
  ],
  "Laundry Room & Downstairs Bathroom": [
    "Clean washer/dryer surfaces",
    "Run washer tub clean (if available)",
    "Scrub toilet/sink",
    "Mop floor & restock supplies",
  ],
  "Mia's Room": [
    "Wash bedding",
    "Sanitize high-touch toys",
    "Dust shelves & dresser",
    "Quick declutter",
  ],
  "Office": [
    "Dust monitors/keyboard",
    "Wipe desk & vents",
    "File/scan loose papers",
    "Vacuum",
  ],
  "Master Bedroom": [
    "Wash bedding",
    "Vacuum under bed",
    "Polish furniture",
    "Quick closet tidy",
  ],
  "Upstairs Bathroom": [
    "Scrub tub/shower",
    "Clean grout & glass",
    "Wash mats",
    "Shine fixtures",
  ],
  "Stairs & Hallway": [
    "Vacuum treads & edges",
    "Wipe handrails",
    "Spot-clean walls",
    "Dust frames/switches",
  ],
};

const checklist = CHECKLIST[area] || [];
const body =
  (checklist.length
    ? "• " + checklist.join("\n• ") + "\n\n"
    : "") +
  "20-min fallback:\n• Floors + high-touch surfaces\n• Tackle 3 biggest eyesores";

const title = `🧼 Saturday Deep Clean — ${area}`;

// Post to ntfy
const resp = await fetch(`${NTFY_SERVER.replace(/\/$/, "")}/${encodeURIComponent(NTFY_TOPIC)}`, {
  method: "POST",
  headers: {
    "Title": title,
    "Tags": "bell,house",
    "Priority": "4", // 1–5; 4 = important
  },
  body,
});

if (!resp.ok) {
  console.error(`ntfy error: ${resp.status} ${await resp.text()}`);
  process.exit(1);
}
console.log(`Sent ntfy: ${title}`);
