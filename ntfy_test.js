(async () => {
  try {
    const topic  = process.env.NTFY_TOPIC;               // e.g., deepclean-3f7b9a
    const server = (process.env.NTFY_SERVER || "https://ntfy.sh").replace(/\/$/, "");

    if (!topic) {
      console.error("Missing NTFY_TOPIC env var (topic ONLY, no https:// prefix).");
      process.exit(1);
    }

    const title = "GitHub to ntfy test";
    const body  = "If you see this, the pipeline works.";

    const url = `${server}/${encodeURIComponent(topic)}`;
    console.log(`POST → ${url}`);

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Title": title, "Priority": "4" },
      body
    });

    const text = await resp.text();
    console.log(`Response: ${resp.status} ${text.slice(0,120)}`);
    if (!resp.ok) process.exit(1);

    console.log("Sent push via ntfy successfully.");
  } catch (err) {
    console.error("Error:", err?.message || err);
    process.exit(1);
  }
})();
