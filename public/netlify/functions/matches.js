import STREAMS from "./streams.js";

export const config = { path: "/api/matches" };

const LIVE = new Set(["1H", "2H", "ET", "BT", "P", "LIVE", "INT", "HT"]);
const DONE = new Set(["FT", "AET", "PEN", "AWD", "WO"]);
const UP = new Set(["NS", "TBD"]);

export default async (req) => {
  const json = { "content-type": "application/json" };
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) {
    return new Response(JSON.stringify({ error: "API_FOOTBALL_KEY is not set" }), { status: 500, headers: json });
  }
  // 900s default keeps a free plan (100 requests/day) safe. Lower it on a paid plan.
  const ttl = Number(process.env.CACHE_SECONDS) || 900;

  let date = new URL(req.url).searchParams.get("date") || "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) date = new Date().toISOString().slice(0, 10);

  try {
    const r = await fetch(`https://v3.football.api-sports.io/fixtures?date=${date}`, {
      headers: { "x-apisports-key": key },
    });
    const j = await r.json();
    const errs = j.errors && (Array.isArray(j.errors) ? j.errors : Object.values(j.errors));
    if (!r.ok || (errs && errs.length)) {
      return new Response(JSON.stringify({ error: "Data provider error", detail: errs }), { status: 502, headers: json });
    }
    const matches = (j.response || []).map((f) => {
      const s = f.fixture.status.short;
      const st = LIVE.has(s) ? "live" : DONE.has(s) ? "ft" : UP.has(s) ? "up" : "x";
      return {
        id: f.fixture.id,
        l: f.league.name,
        c: f.league.country,
        lf: f.league.flag || null,
        hl: f.teams.home.logo || null,
        al: f.teams.away.logo || null,
        h: f.teams.home.name,
        a: f.teams.away.name,
        hs: f.goals.home ?? 0,
        as: f.goals.away ?? 0,
        st,
        min: s === "HT" ? "HT" : f.fixture.status.elapsed ?? "",
        t: f.fixture.date,
        src: STREAMS.fixtures[f.fixture.id] || STREAMS.leagues[f.league.id] || [],
      };
    });
    matches.sort((a, b) => (a.st === "live" ? 0 : 1) - (b.st === "live" ? 0 : 1) || a.t.localeCompare(b.t));
    return new Response(JSON.stringify({ date, matches }), {
      headers: {
        ...json,
        "cache-control": "public, max-age=30",
        "netlify-cdn-cache-control": `public, s-maxage=${ttl}, stale-while-revalidate=60`,
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Could not reach data provider" }), { status: 502, headers: json });
  }
};
