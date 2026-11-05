# GoalStream: live data + hosting

## What's inside
- public/index.html: the app (ad gate, matches, search, following, player)
- netlify/functions/matches.js: serverless endpoint /api/matches that calls API-Football with your secret key, maps the data and caches it
- netlify/functions/streams.js: where you list LICENSED stream URLs per fixture or league
- netlify.toml: Netlify settings

## 1. Get a data key
Sign up (free) at api-football.com / dashboard.api-football.com. Copy the key from Account > My Access.
The free plan allows 100 requests/day and limits which seasons you can read. Test with your key whether
current matches come back. If the list is empty, you probably need a paid plan.

## 2. Deploy (no install needed)
1. Create a free GitHub account and a new repository. Upload all these files with "Add file > Upload files"
   (keep the folder structure).
2. At netlify.com, choose "Add new site > Import an existing project", connect GitHub, pick the repository.
3. Before deploying, open Site configuration > Environment variables and add:
   API_FOOTBALL_KEY = your key
   (optional) CACHE_SECONDS = 900
4. Deploy. Your site gets a link like https://yourname.netlify.app. Add your own domain under Domain management.

Note: Netlify's plain drag-and-drop upload does NOT run functions, so use the GitHub route above.
Opened as a plain file, the page falls back to a small sample list.

## Request budget
Each unique date is fetched at most once per CACHE_SECONDS across all visitors, so at 900 seconds the free
plan cannot exceed about 96 requests/day for one date. Yesterday/Today/Tomorrow each count separately. On a paid plan
set CACHE_SECONDS=30 for near-live scores.

## Streams (rights!)
Add only URLs you are licensed to redistribute in streams.js. Matches with no entry show the
"no licensed stream" message. Never put keys inside index.html.

## Ads
The ad screen (<div id="ad">) shows on EVERY app open and every time someone opens a match that has a stream.
Replace the placeholder with your ad network's code (see the adGate function in index.html). Matches without a stream
open without an ad, since there is nothing to watch.

## Install on phones (PWA)
The site is installable: manifest.webmanifest, icons, and sw.js (service worker) are in public/.
- Android/Chrome: Settings tab shows an "Install app" button (or browser menu > Install app).
- iPhone/Safari: Share > Add to Home Screen.
Requires HTTPS, which Netlify provides. The last match list also shows offline. If you change sw.js, bump the V number.
