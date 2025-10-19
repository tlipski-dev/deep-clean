// Weekly rotating Saturday reminder via ntfy (ASCII-only headers)
// Works with Node 20 (no emojis, no top-level await required)

const { DateTime } = require("luxon");

(async () => {
  try {
    // ---- Config ----
    const AREAS = [
      "Kitchen",
      "Living Room",
      "Den",
      "Laundry Room and Downstairs Bathroom",
      "Mia's Room",
      "Office",
      "Master Bedroom",
      "Upstairs Bathroom",
      "Stairs and Hallway",
    ];

    // Week 1 Saturday (Kitchen). Change if you want a different start.
    const START_DATE = "2025-10-25"; // YYYY-MM-DD

    // ntfy
    const TOPIC  = process.env.NTFY_TOPIC; // topic ONLY (e.g., deepclean-3f7b9a)
    const SERVER = (process.env.NTFY_SERVER || "https://ntfy.sh").replace(/\/$/, "");

     Testing helper: set BYPASS_GATE="1" in workflow env to force an immediate send
    const BYPASS_GATE = process.env.BYPASS_GATE === "1";

    if (!TOPIC) {
      console.error("Missing NTFY_TOPIC env var (topic name only, no https:// prefix).");
      process.exit(1);
    }

    // ---- Time gating (America/New_York) ----
    const nowNY = DateTime.now().setZone("America/New_York");
    const isSaturday  = nowNY.weekday === 6; // 1=Mon..6=Sat..7=Sun
    const isNineSharp = BYPASS_GATE || (nowNY.hour === 9 && nowNY.minute === 0);

    console.log(`Now NY: ${nowNY.toISO()} | Saturday=${isSaturday} | 9:00=${isNineSharp} | BYPASS=${BYPASS_GATE}`);
    if (!isSaturday || !isNineSharp) {
      console.log("Gate: not 9:00 AM Saturday in New York; exiting without send.");
      process.exit(0);
    }

    // ---- Rotation index ----
    const startNY = DateTime.fromISO(START_DATE, { zone: "America/New_York" }).startOf("day");
    let weeksSince = Math.floor(nowNY.startOf("day").diff(startNY, "days").days / 7);
    if (weeksSince < 0) weeksSince = 0;

    const idx  = ((weeksSince % AREAS.length) + AREAS.length) % AREAS.length;
    const area = AREAS[idx];

    // ---- Optional per-area checklist (pure ASCII) ----
    const CHECKLIST = {
      "Kitchen": [
        "Deep clean oven and range",
        "Wipe fridge shelves and doors",
        "Clean cabinet fronts and handles",
        "Mop under appliances",
      ],
      "Living Room": [
        "Vacuum sofa and rugs",
        "Dust surfaces and electronics",
        "Clean windows and frames",
        "Wipe baseboards",
      ],
      "Den": [
        "Dust media and equipment",
        "Organize books and games",
        "Wash throw blankets",
        "Vacuum edges and under furniture",
      ],
      "Laundry Room and Downstairs Bathroom": [
        "Clean washer and dryer surfaces",
        "Run washer tub clean if available",
        "Scrub toilet and sink",
        "Mop floor and restock supplies",
      ],
      "Mia's Room": [
        "Wash bedding",
        "Sanitize high touch toys",
        "Dust shelves and dresser",
        "Quick declutter",
      ],
      "Office": [
        "Dust monitors and keyboard",
        "Wipe desk and vents",
        "File or scan loose papers",
        "Vacuum",
      ],
      "Master Bedroom": [
        "Wash bedding",
        "Vacuum under bed",
        "Polish furniture",
        "Quick closet tidy",
      ],
      "Upstairs Bathroom": [
        "Scrub tub and shower",
        "Clean grout and glass",
        "Wash mats",
        "Shine fixtures",
      ],
      "Stairs and Hallway": [
        "Vacuum treads and edges",
        "Wipe handrails",
        "Spot clean walls",
        "Dust frames and switches",
      ],
    };

    const checklist = CHECKLIST[area] || [];
    const body =
      (checklist.length ? "- " + checklist.join("\n- ") + "\n\n" : "") +
      "20 minute fallback:\n- Floors and high touch surfaces\n- Tackle 3 biggest eyesores";

    // Headers must be ASCII. Use a plain hyphen in the title.
    const title = `Saturday Deep Clean - ${area}`;
    const url   = `${SERVER}/${encodeURIComponent(TOPIC)}`;

    console.log(`POST -> ${url} | Area="${area}" (idx=${idx}, weeksSince=${weeksSince})`);

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Title": title,
        "Priority": "4",
        "Tags": "bell,house,check" // ASCII-only tags (optional)
      },
      body,
    });

    const txt = await resp.text();
    console.log(`ntfy response: ${resp.status} ${txt.slice(0,120)}`);
    if (!resp.ok) process.exit(1);

    console.log("Sent.");
  } catch (err) {
    console.error("Error:", err?.message || err);
    process.exit(1);
  }
})();

