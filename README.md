# 🍽️ Calorie Snap

A bright, mobile-first Progressive Web App that turns a photo of your food into calorie and
macro estimates, tracks your day, and serves up friendly healthy-eating insights.
Install it on your phone's home screen, no App Store needed.

> **How recognition works:** the photo → calories step runs **fully on-device and offline**.
> The app simulates recognition against a built-in food database and always shows a
> confirm/adjust step, so the numbers stay honest and in your control. No API key, no account,
> no data leaves your phone.

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

## Run locally

```bash
npm install
npm run dev
```

Then open http://localhost:5173 in your browser. On a laptop with no food photo handy, use the
**"Try a demo plate"** button to walk through the full flow.

## Build for production

```bash
npm run build
```

The `dist/` folder can be dragged onto **netlify.com/drop** for instant hosting.

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
3. Click **Deploy** (Vercel auto-detects Vite, no settings to change)
4. In about a minute you'll get a URL like `https://calorie-snap-abc.vercel.app`

## Install on iPhone

1. Open your Vercel URL in **Safari**
2. Tap the **Share** button, then **"Add to Home Screen"**
3. Name it **Calorie Snap** → tap **Add**

The app opens fullscreen like a native app. ✅

---

## Tech

React + Vite, single-file `src/App.jsx`, food data in `src/foodData.js`. No dependencies beyond
React. Mirrors the structure of the sibling `water-tracker` app.
