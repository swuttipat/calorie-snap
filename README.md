# 🍽️ Calorie Snap

A bright, mobile-first Progressive Web App that turns a photo of your food into calorie and
macro estimates, tracks your day, and serves up friendly healthy-eating insights.
Install it on your phone's home screen, no App Store needed.

> **How recognition works:** the photo → calories step is **real AI vision**. Your photo is
> sent to a small serverless function (`api/analyze.js`) that calls Claude's vision model to
> identify the food and estimate calories/macros. The API key lives only on the server
> (a Vercel environment variable) — it never reaches the browser. Every result still shows a
> confirm/adjust step (swap to an alternate, or search the built-in food list), since any
> vision model can misjudge portion size or a partly-hidden dish. Requires an internet
> connection and an Anthropic API key (see setup below); each scan has a small API cost. The
> "Try a demo plate" button on the Snap screen skips the API and uses an offline simulated
> guess, for exploring the app without a key or a photo.

---

## Features

- 📸 **Snap** — take or choose a photo; an animated "analyzing" step suggests a food with a
  match score, plus alternates and a full searchable food list to correct it
- 🍚 **Portion + meal** — Small / Medium / Large scaling and Breakfast / Lunch / Dinner / Snack
- 📔 **Diary** — animated calorie ring vs your goal, carbs/protein/fat bars, meals grouped with
  per-item delete, and an editable daily goal
- 📈 **Trends** — 14-day calorie bar chart with goal line, 7-day average, and a logging streak
- 💡 **Insights** — rule-based tips generated from what you logged (streaks, protein balance,
  snack share, average vs goal)
- 🇹🇭 Built-in food database mixing Thai favorites (Pad Thai, Green Curry, Som Tam, Mango
  Sticky Rice, Thai Milk Tea) with international staples
- 💾 Saved locally on your device (localStorage) and works offline (service worker)
- 📱 Installs to the home screen and respects the iPhone notch / safe areas

---

## Setup — Anthropic API key

Real photo scanning needs an Anthropic API key.

1. Get a key at [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
2. Locally: copy `.env.example` to `.env` and paste your key in. **Never commit `.env`.**
3. In production: add `ANTHROPIC_API_KEY` under Vercel → your project → **Settings →
   Environment Variables**, then redeploy.

Without a key configured, real photo scans will show a friendly error and drop you straight
into search — the rest of the app (Diary, Trends, Insights, the demo plate) still works fully
offline.

## Run locally

The `/api/analyze` function is a Vercel serverless function, so `npm run dev` alone won't serve
it. Use the Vercel CLI instead, which runs the Vite frontend and the API function together:

```bash
npm install -g vercel   # one-time
npm install
vercel dev
```

Then open the URL it prints (usually http://localhost:3000). On a laptop with no food photo
handy, or to test without an API key, use the **"Try a demo plate"** button.

## Build for production

```bash
npm run build
```

This builds the frontend only (`dist/`). The `/api` function is deployed separately by Vercel —
plain static hosts like Netlify Drop won't run it, so real photo scanning needs Vercel (or
another host that supports serverless/edge functions).

---

## Deploy to Vercel (free, ~3 minutes)

### Step 1 — Push to GitHub

```bash
cd calories-snap
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/swuttipat/calorie-snap.git
git push -u origin main
```

### Step 2 — Deploy on Vercel

1. Go to **vercel.com** and sign in with GitHub
2. Click **Add New → Project** and select your `calorie-snap` repository
3. Before the first deploy (or any time after, under **Settings → Environment Variables**),
   add `ANTHROPIC_API_KEY` with your key
4. Click **Deploy** (Vercel auto-detects Vite for the frontend and `api/analyze.js` as a
   serverless function, no other settings needed)
5. In about a minute you'll get a URL like `https://calorie-snap-abc.vercel.app`

If you added the app already and are only adding the key now: set the env var, then go to
**Deployments → ⋯ → Redeploy** so the function picks it up.

## Install on iPhone

1. Open your Vercel URL in **Safari**
2. Tap the **Share** button, then **"Add to Home Screen"**
3. Name it **Calorie Snap** → tap **Add**

The app opens fullscreen like a native app. ✅

---

## Tech

React + Vite frontend (single-file `src/App.jsx`, food data in `src/foodData.js`, no
dependencies beyond React), plus one Vercel serverless function (`api/analyze.js`) that calls
Claude vision (`claude-haiku-4-5`) server-side. Mirrors the structure of the sibling
`water-tracker` app, with the vision function as the one addition.
