import { useState, useEffect, useCallback, useRef } from "react";
import { FOODS, recognize, currentMeal } from "./foodData.js";

// ── Palette (bright, foodie) ─────────────────────────────────────────
const C = {
  cream: "#fff7ed",
  coral: "#ff6b4a",
  coralDeep: "#f4512c",
  tangerine: "#ff9f45",
  yellow: "#ffb43d", // carbs
  green: "#35c07a", // protein
  berry: "#f6689b", // fat
  grape: "#8b5cf6",
  ink: "#4a3226",
  ink2: "#6b5546",
  muted: "#a8917f",
  card: "#ffffff",
  line: "rgba(74,50,38,0.08)",
};

const MEALS = [
  { key: "breakfast", label: "Breakfast", emoji: "🌅" },
  { key: "lunch", label: "Lunch", emoji: "☀️" },
  { key: "dinner", label: "Dinner", emoji: "🌙" },
  { key: "snack", label: "Snack", emoji: "🍿" },
];

const PORTIONS = [
  { key: "S", label: "Small", mult: 0.6 },
  { key: "M", label: "Medium", mult: 1 },
  { key: "L", label: "Large", mult: 1.5 },
];

const TABS = [
  { key: "snap", label: "Snap", emoji: "📸" },
  { key: "diary", label: "Diary", emoji: "📔" },
  { key: "trends", label: "Trends", emoji: "📈" },
  { key: "insights", label: "Insights", emoji: "💡" },
];

const MACRO_TARGETS = { carbs: 250, protein: 90, fat: 70 };
const DEFAULT_GOAL = 2000;

const font = "'DM Sans', sans-serif";
const heading = "'Baloo 2', 'DM Sans', cursive";

// ── Date helpers (shared pattern with water-tracker) ─────────────────
const getTodayKey = () => new Date().toISOString().slice(0, 10);

const formatDate = (key) => {
  const d = new Date(key + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
};

const getLast14Days = () => {
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
};

const sumBy = (arr, k) => arr.reduce((a, e) => a + (e[k] || 0), 0);
const mealMeta = (key) => MEALS.find((m) => m.key === key) || MEALS[3];
const portionMult = (key) => (PORTIONS.find((p) => p.key === key) || PORTIONS[1]).mult;

// Logging streak: consecutive days (from today back) with at least one entry.
// An empty "today" doesn't break a streak earned yesterday.
function calcStreak(diary) {
  const days = getLast14Days().slice().reverse();
  let streak = 0;
  for (let i = 0; i < days.length; i++) {
    const has = (diary[days[i]]?.length || 0) > 0;
    if (has) streak++;
    else if (i === 0) continue;
    else break;
  }
  return streak;
}

// ── Rule-based insights, generated from logged data (offline) ────────
function buildInsights({ entries, kcal, macros, goal, streak, avg, loggedDays }) {
  if (entries.length === 0) {
    return [{
      tone: "tip", emoji: "📸", title: "Snap your first meal",
      body: "Take a photo of anything you eat or drink, and your personal insights will appear right here.",
    }];
  }
  const out = [];

  if (streak >= 3) out.push({ tone: "good", emoji: "🔥", title: `${streak}-day logging streak!`, body: "Consistency is the hard part, and you're nailing it. Keep the camera handy." });
  else out.push({ tone: "tip", emoji: "🌱", title: "Building the habit", body: "Log something every day this week to grow your streak. Small snaps add up fast." });

  const left = goal - kcal;
  if (left >= 0) out.push({ tone: "good", emoji: "🎯", title: `${left} kcal left today`, body: `You're at ${kcal} of your ${goal} kcal goal. A nice, steady pace.` });
  else out.push({ tone: "warn", emoji: "⚖️", title: `${Math.abs(left)} kcal over goal`, body: "No stress at all. A short walk today or a lighter dinner tomorrow keeps the week balanced." });

  const proteinShare = kcal > 0 ? (macros.protein * 4) / kcal : 0;
  if (proteinShare < 0.15) out.push({ tone: "tip", emoji: "💪", title: "Protein looks light", body: "Add eggs, chicken, tofu, or Greek yogurt to stay fuller for longer." });
  else if (proteinShare >= 0.25) out.push({ tone: "good", emoji: "💪", title: "Great protein balance", body: "Your meals are protein-forward today, which is great for muscle and satiety." });

  const snackKcal = entries.filter((e) => e.mealType === "snack").reduce((a, e) => a + e.kcal, 0);
  const snackShare = kcal > 0 ? snackKcal / kcal : 0;
  if (snackShare > 0.35) out.push({ tone: "tip", emoji: "🍎", title: `Snacks are ${Math.round(snackShare * 100)}% of today`, body: "Swapping one snack for fruit or a handful of nuts keeps energy steady with fewer calories." });

  if (loggedDays >= 3) {
    const pctOfGoal = Math.round((avg / goal) * 100);
    out.push({ tone: "info", emoji: "📊", title: `7-day average: ${avg} kcal`, body: `That's about ${pctOfGoal}% of your daily goal across the days you've logged.` });
  }

  return out.slice(0, 5);
}

// ── Calorie progress ring ────────────────────────────────────────────
function CalorieRing({ pct, kcal, goal, size = 210 }) {
  const r = 84;
  const circ = 2 * Math.PI * r;
  const dash = circ * Math.min(pct, 1);
  const over = pct > 1;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 210 210">
        <circle cx="105" cy="105" r={r} fill="none" stroke="rgba(255,107,74,0.13)" strokeWidth="16" />
        <circle
          cx="105" cy="105" r={r}
          fill="none"
          stroke="url(#calGrad)"
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          strokeDashoffset={circ * 0.25}
          style={{ transition: "stroke-dasharray 0.7s cubic-bezier(.4,0,.2,1)" }}
        />
        <defs>
          <linearGradient id="calGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={over ? C.berry : C.coral} />
            <stop offset="100%" stopColor={over ? "#ff8fb3" : C.tangerine} />
          </linearGradient>
        </defs>
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span key={kcal} style={{ fontFamily: heading, fontSize: 44, fontWeight: 800, color: over ? C.berry : C.ink, lineHeight: 1, animation: "pop .4s ease" }}>
          {kcal}
        </span>
        <span style={{ fontSize: 13, color: C.muted, fontWeight: 600, marginTop: 2 }}>of {goal} kcal</span>
        <span style={{ fontSize: 11, color: C.muted, fontWeight: 500, marginTop: 1 }}>eaten today</span>
      </div>
    </div>
  );
}

// ── Macro bar ────────────────────────────────────────────────────────
function MacroBar({ label, grams, target, color }) {
  const fill = Math.min(grams / target, 1) * 100;
  return (
    <div style={{ flex: 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.ink2 }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color, fontFamily: "'DM Mono', monospace" }}>{grams}g</span>
      </div>
      <div style={{ height: 7, borderRadius: 5, background: "rgba(74,50,38,0.07)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${fill}%`, borderRadius: 5, background: color, transition: "width 0.5s cubic-bezier(.4,0,.2,1)" }} />
      </div>
    </div>
  );
}

// ── History bar chart ────────────────────────────────────────────────
function HistoryChart({ data, goal }) {
  const max = Math.max(goal, ...data.map((d) => d.kcal), 1);
  const goalH = Math.round((goal / max) * 100);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 130, padding: "0 2px" }}>
      {data.map((d) => {
        const isToday = d.key === getTodayKey();
        const barH = d.kcal > 0 ? Math.max(Math.round((d.kcal / max) * 100), 3) : 2;
        const over = d.kcal > goal;
        const bg = d.kcal === 0
          ? "rgba(74,50,38,0.09)"
          : isToday
          ? "linear-gradient(180deg,#ff8a63,#f4512c)"
          : over
          ? "linear-gradient(180deg,#f6689b,#e04d84)"
          : "linear-gradient(180deg,#ffc06a,#ff9f45)";
        return (
          <div key={d.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ position: "relative", width: "100%", height: 108, display: "flex", alignItems: "flex-end" }}>
              <div style={{ position: "absolute", bottom: `${goalH}%`, left: 0, right: 0, borderTop: "1.5px dashed rgba(244,81,44,0.35)", pointerEvents: "none" }} />
              <div style={{
                width: "100%", height: `${barH}%`, borderRadius: 6, background: bg,
                transition: "height 0.5s cubic-bezier(.4,0,.2,1)",
                boxShadow: isToday ? "0 0 12px rgba(244,81,44,0.35)" : "none",
              }} />
            </div>
            <span style={{ fontSize: 9, color: isToday ? C.coralDeep : C.muted, fontWeight: isToday ? 800 : 500, whiteSpace: "nowrap" }}>
              {new Date(d.key + "T00:00:00").toLocaleDateString("en-US", { weekday: "narrow" })}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Insight card ─────────────────────────────────────────────────────
const TONE = {
  good: { bg: "rgba(53,192,122,0.10)", border: "rgba(53,192,122,0.28)", dot: C.green },
  tip: { bg: "rgba(255,159,69,0.12)", border: "rgba(255,159,69,0.30)", dot: C.tangerine },
  warn: { bg: "rgba(246,104,155,0.11)", border: "rgba(246,104,155,0.30)", dot: C.berry },
  info: { bg: "rgba(139,92,246,0.10)", border: "rgba(139,92,246,0.26)", dot: C.grape },
};
function InsightCard({ tone, emoji, title, body }) {
  const t = TONE[tone] || TONE.info;
  return (
    <div style={{ display: "flex", gap: 12, background: t.bg, border: `1.5px solid ${t.border}`, borderRadius: 18, padding: "15px 16px" }}>
      <div style={{ fontSize: 26, lineHeight: 1 }}>{emoji}</div>
      <div>
        <p style={{ fontFamily: heading, fontWeight: 700, fontSize: 16, color: C.ink, marginBottom: 3 }}>{title}</p>
        <p style={{ fontSize: 13, color: C.ink2, lineHeight: 1.45 }}>{body}</p>
      </div>
    </div>
  );
}

// ── Section label ────────────────────────────────────────────────────
const Label = ({ children }) => (
  <p style={{ color: C.muted, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 10 }}>{children}</p>
);

// ── Main App ─────────────────────────────────────────────────────────
export default function App() {
  const [diary, setDiary] = useState({});
  const [goal, setGoal] = useState(DEFAULT_GOAL);
  const [view, setView] = useState("snap");
  const [loaded, setLoaded] = useState(false);

  // Snap flow
  const [image, setImage] = useState(null);
  const [phase, setPhase] = useState("idle"); // idle | analyzing | result
  const [candidate, setCandidate] = useState(null);
  const [alternates, setAlternates] = useState([]);
  const [portion, setPortion] = useState("M");
  const [mealType, setMealType] = useState("lunch");
  const [showSearch, setShowSearch] = useState(false);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);
  const [analyzeError, setAnalyzeError] = useState(null);

  const fileRef = useRef(null);
  const timerRef = useRef(null);

  // Load
  useEffect(() => {
    try {
      const d = localStorage.getItem("calorie-snap-diary");
      if (d) setDiary(JSON.parse(d));
      const g = localStorage.getItem("calorie-snap-goal");
      if (g) setGoal(JSON.parse(g));
    } catch (_) {}
    setLoaded(true);
    return () => clearTimeout(timerRef.current);
  }, []);

  // Save
  useEffect(() => { if (loaded) try { localStorage.setItem("calorie-snap-diary", JSON.stringify(diary)); } catch (_) {} }, [diary, loaded]);
  useEffect(() => { if (loaded) try { localStorage.setItem("calorie-snap-goal", JSON.stringify(goal)); } catch (_) {} }, [goal, loaded]);

  // Derived — today
  const todayKey = getTodayKey();
  const todayEntries = diary[todayKey] || [];
  const todayKcal = sumBy(todayEntries, "kcal");
  const macros = {
    carbs: sumBy(todayEntries, "carbs"),
    protein: sumBy(todayEntries, "protein"),
    fat: sumBy(todayEntries, "fat"),
  };
  const pct = todayKcal / goal;

  // Derived — history
  const chartData = getLast14Days().map((key) => ({ key, kcal: sumBy(diary[key] || [], "kcal") }));
  const last7 = getLast14Days().slice(-7).map((k) => sumBy(diary[k] || [], "kcal"));
  const logged7 = last7.filter((v) => v > 0);
  const avgLast7 = logged7.length ? Math.round(logged7.reduce((a, b) => a + b, 0) / logged7.length) : 0;
  const streak = calcStreak(diary);

  const insights = buildInsights({ entries: todayEntries, kcal: todayKcal, macros, goal, streak, avg: avgLast7, loggedDays: logged7.length });

  // ── Snap handlers ──────────────────────────────────
  // Demo mode (no photo): fall back to the offline simulated guess so the
  // flow is still explorable without a camera or API key.
  const startDemoAnalyze = useCallback(() => {
    setImage(null);
    setPhase("analyzing");
    setAnalyzeError(null);
    setShowSearch(false);
    setSearch("");
    const meal = currentMeal();
    setMealType(meal);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const r = recognize(meal);
      setCandidate({ ...r.primary });
      setAlternates(r.alternates);
      setPortion("M");
      setPhase("result");
    }, 1600);
  }, []);

  // Real photo: send to the /api/analyze serverless function, which calls
  // Claude vision server-side (API key never touches the browser).
  const analyzePhoto = useCallback(async (dataUrl, meal) => {
    setPhase("analyzing");
    setAnalyzeError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ image: dataUrl, mealType: meal }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      if (!data.name) throw new Error("No result returned");

      const id = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "food";
      setCandidate({
        id, name: data.name, emoji: data.emoji || "🍽️",
        kcal: Number(data.kcal) || 0, carbs: Number(data.carbs) || 0,
        protein: Number(data.protein) || 0, fat: Number(data.fat) || 0,
        confidence: data.confidence != null ? Math.round(data.confidence) : null,
      });
      setAlternates((data.alternates || []).slice(0, 3).map((a, i) => ({
        id: `${id}-alt-${i}`, name: a.name, emoji: a.emoji || "🍽️",
        kcal: Number(a.kcal) || 0, carbs: Number(a.carbs) || 0,
        protein: Number(a.protein) || 0, fat: Number(a.fat) || 0,
      })));
      setPortion("M");
      setPhase("result");
    } catch (err) {
      // Analysis failed (no API key configured, offline, model hiccup) —
      // land on the result screen with search open instead of a dead end.
      setCandidate(null);
      setAlternates([]);
      setAnalyzeError(err.message || "Couldn't analyze this photo.");
      setShowSearch(true);
      setPhase("result");
    }
  }, []);

  // Downscale to keep uploads fast/cheap, then dispatch to analysis.
  const startAnalyze = useCallback((file) => {
    const meal = currentMeal();
    setMealType(meal);
    setShowSearch(false);
    setSearch("");

    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      img.onload = () => {
        const maxDim = 768;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        const resized = canvas.toDataURL("image/jpeg", 0.82);
        setImage(resized);
        analyzePhoto(resized, meal);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }, [analyzePhoto]);

  const onPickFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    startAnalyze(file);
  };

  const chooseFood = (food) => {
    setCandidate({ ...food, confidence: null }); // manual pick — no mock confidence
    setShowSearch(false);
    setSearch("");
  };

  const resetSnap = () => {
    clearTimeout(timerRef.current);
    setImage(null);
    setPhase("idle");
    setCandidate(null);
    setAlternates([]);
    setShowSearch(false);
    setSearch("");
    setAnalyzeError(null);
  };

  const addEntry = () => {
    if (!candidate) return;
    const m = portionMult(portion);
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      foodId: candidate.id,
      name: candidate.name,
      emoji: candidate.emoji,
      kcal: Math.round(candidate.kcal * m),
      carbs: Math.round(candidate.carbs * m),
      protein: Math.round(candidate.protein * m),
      fat: Math.round(candidate.fat * m),
      portion,
      mealType,
      time: new Date().toISOString(),
    };
    setDiary((prev) => ({ ...prev, [todayKey]: [...(prev[todayKey] || []), entry] }));
    setToast({ emoji: candidate.emoji, name: candidate.name });
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToast(null), 2200);
    resetSnap();
    setView("diary");
  };

  const deleteEntry = (id) => {
    setDiary((prev) => ({ ...prev, [todayKey]: (prev[todayKey] || []).filter((e) => e.id !== id) }));
  };

  const scaled = candidate
    ? {
        kcal: Math.round(candidate.kcal * portionMult(portion)),
        carbs: Math.round(candidate.carbs * portionMult(portion)),
        protein: Math.round(candidate.protein * portionMult(portion)),
        fat: Math.round(candidate.fat * portionMult(portion)),
      }
    : null;

  const searchResults = search.trim()
    ? FOODS.filter((f) => f.name.toLowerCase().includes(search.trim().toLowerCase())).slice(0, 8)
    : FOODS.slice(0, 8);

  if (!loaded) {
    return (
      <div style={{ minHeight: "100dvh", background: C.cream, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: C.coral, fontFamily: heading, fontSize: 20, fontWeight: 700 }}>Warming up the kitchen…</span>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { height: 100%; background: ${C.cream}; }
        body { -webkit-tap-highlight-color: transparent; }
        @keyframes pop { 0% { transform: scale(0.6); opacity: 0; } 60% { transform: scale(1.15); } 100% { transform: scale(1); opacity: 1; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes floatY { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-16px) rotate(8deg); } }
        @keyframes bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes scanSweep { 0% { top: 4%; opacity: 0; } 20% { opacity: 1; } 80% { opacity: 1; } 100% { top: 92%; opacity: 0; } }
        @keyframes toastIn { from { opacity: 0; transform: translate(-50%, 16px); } to { opacity: 1; transform: translate(-50%, 0); } }
        @keyframes spinPulse { 0%,100% { opacity: .5; } 50% { opacity: 1; } }
        .press { cursor: pointer; -webkit-user-select: none; user-select: none; transition: transform .1s, background .15s, border-color .15s, box-shadow .15s; }
        .press:active { transform: scale(0.95); }
        .scroll-area { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch; }
        input { font-family: ${font}; }
        input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
      `}</style>

      <div style={{
        height: "100dvh", maxWidth: 430, margin: "0 auto", position: "relative",
        display: "flex", flexDirection: "column", fontFamily: font,
        background: "radial-gradient(ellipse at 50% -8%, #ffe9d3 0%, #fff7ed 55%)",
        color: C.ink, overflow: "hidden",
      }}>
        {/* Ambient floating food emojis (decoration) */}
        {[
          { e: "🍓", top: 90, left: -6, s: 46, d: 0 },
          { e: "🥑", top: 320, left: "88%", s: 40, d: 1.5 },
          { e: "🍩", top: 540, left: -10, s: 44, d: 0.8 },
          { e: "🥕", top: 210, left: "92%", s: 34, d: 2.2 },
        ].map((o, i) => (
          <div key={i} aria-hidden style={{
            position: "absolute", top: o.top, left: o.left, fontSize: o.s, opacity: 0.12,
            animation: `floatY ${5 + o.d}s ease-in-out ${o.d}s infinite`, pointerEvents: "none", zIndex: 0,
          }}>{o.e}</div>
        ))}

        {/* Brand header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 20px 10px", zIndex: 2, flexShrink: 0,
        }}>
          <span style={{ fontFamily: heading, fontWeight: 800, fontSize: 20, color: C.coralDeep }}>🍽️ Calorie Snap</span>
          <span style={{
            fontSize: 13, fontWeight: 800, color: C.tangerine, background: "rgba(255,159,69,0.14)",
            border: "1.5px solid rgba(255,159,69,0.3)", borderRadius: 999, padding: "4px 11px",
          }}>🔥 {streak}</span>
        </div>

        {/* ── SCROLL CONTENT ─────────────────────────── */}
        <div className="scroll-area" style={{ zIndex: 1 }}>
          <div style={{ padding: "6px 18px 96px", animation: "fadeUp .3s ease" }}>

            {/* ═══ SNAP ═══ */}
            {view === "snap" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div>
                  <h1 style={{ fontFamily: heading, fontSize: 26, fontWeight: 800, lineHeight: 1.15 }}>Snap your food 📸</h1>
                  <p style={{ color: C.muted, fontSize: 13.5, marginTop: 2 }}>Photograph a meal, snack, or drink and we'll estimate the calories.</p>
                </div>

                {phase === "idle" && (
                  <>
                    <button className="press" onClick={() => fileRef.current?.click()} style={{
                      border: "none", borderRadius: 26, padding: "34px 20px", color: "#fff",
                      background: "linear-gradient(135deg,#ff8a63,#f4512c)", boxShadow: "0 14px 30px rgba(244,81,44,0.32)",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                    }}>
                      <span style={{ fontSize: 52 }}>📷</span>
                      <span style={{ fontFamily: heading, fontSize: 20, fontWeight: 800 }}>Take / choose a photo</span>
                      <span style={{ fontSize: 12.5, opacity: 0.9, fontWeight: 500 }}>Opens your camera on a phone</span>
                    </button>
                    <button className="press" onClick={startDemoAnalyze} style={{
                      background: "#fff", border: `1.5px dashed ${C.line}`, borderRadius: 16, padding: "13px",
                      color: C.ink2, fontWeight: 700, fontSize: 14,
                    }}>✨ No photo handy? Try a demo plate</button>

                    {/* Recent snaps preview */}
                    {todayEntries.length > 0 && (
                      <div style={{ marginTop: 4 }}>
                        <Label>Logged today</Label>
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                          {todayEntries.slice(-6).reverse().map((e) => (
                            <div key={e.id} style={{
                              display: "flex", alignItems: "center", gap: 7, background: "#fff",
                              border: `1px solid ${C.line}`, borderRadius: 999, padding: "6px 12px 6px 8px",
                            }}>
                              <span style={{ fontSize: 18 }}>{e.emoji}</span>
                              <span style={{ fontSize: 12.5, fontWeight: 700, color: C.ink }}>{e.name}</span>
                              <span style={{ fontSize: 11, fontWeight: 700, color: C.coral, fontFamily: "'DM Mono',monospace" }}>{e.kcal}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {(phase === "analyzing" || phase === "result") && (
                  <>
                    {/* Photo preview + scan overlay */}
                    <div style={{ position: "relative", width: "100%", aspectRatio: "4 / 3", borderRadius: 24, overflow: "hidden", boxShadow: "0 12px 30px rgba(244,81,44,0.18)" }}>
                      {image ? (
                        <img src={image} alt="Your food" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#ffd9a8,#ffb27a)", fontSize: 76 }}>🍽️</div>
                      )}

                      {phase === "analyzing" && (
                        <div style={{ position: "absolute", inset: 0, background: "rgba(74,50,38,0.34)", backdropFilter: "blur(2px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
                          <div style={{ position: "absolute", left: "6%", right: "6%", height: 3, borderRadius: 3, background: "linear-gradient(90deg,transparent,#fff,transparent)", boxShadow: "0 0 14px #fff", animation: "scanSweep 2s ease-in-out infinite" }} />
                          <div style={{ display: "flex", gap: 12 }}>
                            {["🍔", "🥗", "🍣"].map((e, i) => (
                              <span key={i} style={{ fontSize: 34, animation: `bob .9s ease-in-out ${i * 0.15}s infinite` }}>{e}</span>
                            ))}
                          </div>
                          <p style={{ color: "#fff", fontFamily: heading, fontWeight: 700, fontSize: 17, animation: "spinPulse 1.2s ease-in-out infinite" }}>Analyzing your plate…</p>
                        </div>
                      )}
                    </div>

                    {phase === "result" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {/* Analysis error banner — shown when the vision API couldn't return a guess */}
                        {analyzeError && (
                          <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "rgba(246,104,155,0.1)", border: `1.5px solid rgba(246,104,155,0.28)`, borderRadius: 16, padding: "13px 15px" }}>
                            <span style={{ fontSize: 20 }}>🙈</span>
                            <div>
                              <p style={{ fontWeight: 800, fontSize: 13.5, color: C.ink }}>Couldn't analyze this photo</p>
                              <p style={{ fontSize: 12, color: C.ink2, marginTop: 2 }}>{analyzeError} — search for it below instead.</p>
                            </div>
                          </div>
                        )}

                        {/* Guess card */}
                        {candidate && (
                        <div style={{ background: "#fff", borderRadius: 22, padding: 18, boxShadow: "0 10px 26px rgba(244,81,44,0.10)", border: `1px solid ${C.line}` }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                            <div style={{ fontSize: 46, width: 66, height: 66, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,159,69,0.14)", borderRadius: 18 }}>{candidate.emoji}</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                <h2 style={{ fontFamily: heading, fontSize: 21, fontWeight: 800, color: C.ink }}>{candidate.name}</h2>
                                {candidate.confidence != null ? (
                                  <span style={{ fontSize: 11, fontWeight: 800, color: C.green, background: "rgba(53,192,122,0.12)", borderRadius: 999, padding: "2px 8px" }}>{candidate.confidence}% match</span>
                                ) : (
                                  <span style={{ fontSize: 11, fontWeight: 800, color: C.grape, background: "rgba(139,92,246,0.12)", borderRadius: 999, padding: "2px 8px" }}>your pick</span>
                                )}
                              </div>
                              <p style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>Estimated — tap below to adjust</p>
                            </div>
                          </div>

                          {/* Scaled kcal + macros */}
                          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 14 }}>
                            <span style={{ fontFamily: heading, fontSize: 34, fontWeight: 800, color: C.coralDeep }}>{scaled.kcal}</span>
                            <span style={{ fontSize: 14, color: C.muted, fontWeight: 600 }}>kcal</span>
                          </div>
                          <div style={{ display: "flex", gap: 14, marginTop: 12 }}>
                            <MacroBar label="Carbs" grams={scaled.carbs} target={MACRO_TARGETS.carbs} color={C.yellow} />
                            <MacroBar label="Protein" grams={scaled.protein} target={MACRO_TARGETS.protein} color={C.green} />
                            <MacroBar label="Fat" grams={scaled.fat} target={MACRO_TARGETS.fat} color={C.berry} />
                          </div>
                        </div>
                        )}

                        {/* Portion */}
                        <div>
                          <Label>Portion</Label>
                          <div style={{ display: "flex", gap: 8 }}>
                            {PORTIONS.map((p) => {
                              const on = portion === p.key;
                              return (
                                <button key={p.key} className="press" onClick={() => setPortion(p.key)} style={{
                                  flex: 1, borderRadius: 14, padding: "11px 0", fontWeight: 700, fontSize: 13.5,
                                  border: `1.5px solid ${on ? C.coral : C.line}`, color: on ? "#fff" : C.ink2,
                                  background: on ? "linear-gradient(135deg,#ff8a63,#f4512c)" : "#fff",
                                }}>{p.label}<span style={{ display: "block", fontSize: 10, opacity: 0.75, fontWeight: 600 }}>{p.mult}×</span></button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Meal */}
                        <div>
                          <Label>Meal</Label>
                          <div style={{ display: "flex", gap: 8 }}>
                            {MEALS.map((m) => {
                              const on = mealType === m.key;
                              return (
                                <button key={m.key} className="press" onClick={() => setMealType(m.key)} style={{
                                  flex: 1, borderRadius: 14, padding: "9px 0", fontWeight: 700, fontSize: 11.5,
                                  border: `1.5px solid ${on ? C.tangerine : C.line}`, color: on ? C.coralDeep : C.muted,
                                  background: on ? "rgba(255,159,69,0.16)" : "#fff",
                                }}><span style={{ fontSize: 16, display: "block" }}>{m.emoji}</span>{m.label}</button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Alternates / search */}
                        <div>
                          <Label>{candidate ? "Not quite right?" : "Find your food"}</Label>
                          {!showSearch ? (
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                              {alternates.map((f) => (
                                <button key={f.id} className="press" onClick={() => chooseFood(f)} style={{
                                  background: "#fff", border: `1.5px solid ${C.line}`, borderRadius: 999,
                                  padding: "8px 13px", fontWeight: 700, fontSize: 13, color: C.ink2,
                                }}>{f.emoji} {f.name}</button>
                              ))}
                              <button className="press" onClick={() => setShowSearch(true)} style={{
                                background: "rgba(255,107,74,0.1)", border: `1.5px solid rgba(255,107,74,0.3)`, borderRadius: 999,
                                padding: "8px 13px", fontWeight: 800, fontSize: 13, color: C.coralDeep,
                              }}>🔎 Search all</button>
                            </div>
                          ) : (
                            <div>
                              <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search foods, drinks, snacks…" style={{
                                width: "100%", background: "#fff", border: `1.5px solid ${C.line}`, borderRadius: 14,
                                padding: "12px 14px", fontSize: 15, color: C.ink, outline: "none", marginBottom: 8,
                              }} />
                              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 220, overflowY: "auto" }}>
                                {searchResults.map((f) => (
                                  <button key={f.id} className="press" onClick={() => chooseFood(f)} style={{
                                    display: "flex", alignItems: "center", gap: 10, background: "#fff",
                                    border: `1px solid ${C.line}`, borderRadius: 12, padding: "10px 12px", textAlign: "left",
                                  }}>
                                    <span style={{ fontSize: 22 }}>{f.emoji}</span>
                                    <span style={{ flex: 1, fontWeight: 700, fontSize: 14, color: C.ink }}>{f.name}</span>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: C.coral, fontFamily: "'DM Mono',monospace" }}>{f.kcal} kcal</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div style={{ display: "flex", gap: 10, marginTop: 2 }}>
                          <button className="press" onClick={resetSnap} style={{
                            flex: "0 0 auto", background: "#fff", border: `1.5px solid ${C.line}`, borderRadius: 16,
                            padding: "14px 18px", fontWeight: 700, fontSize: 14, color: C.ink2,
                          }}>↺ Retake</button>
                          <button className="press" onClick={addEntry} disabled={!candidate} style={{
                            flex: 1, border: "none", borderRadius: 16, padding: "14px", color: "#fff", fontWeight: 800, fontSize: 15.5,
                            fontFamily: heading, opacity: candidate ? 1 : 0.45,
                            background: "linear-gradient(135deg,#ff8a63,#f4512c)", boxShadow: candidate ? "0 10px 22px rgba(244,81,44,0.3)" : "none",
                          }}>{candidate ? `Add to Diary +${scaled.kcal}` : "Pick a food first"}</button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ═══ DIARY ═══ */}
            {view === "diary" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <p style={{ color: C.muted, fontSize: 13, fontWeight: 600 }}>{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
                  <h1 style={{ fontFamily: heading, fontSize: 26, fontWeight: 800 }}>Today's Diary 📔</h1>
                </div>

                {/* Ring */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <CalorieRing pct={pct} kcal={todayKcal} goal={goal} />
                  <p style={{ fontSize: 14, fontWeight: 700, color: pct > 1 ? C.berry : C.green }}>
                    {pct > 1 ? `${todayKcal - goal} kcal over goal` : `${goal - todayKcal} kcal left today`}
                  </p>
                </div>

                {/* Goal editor */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                  <span style={{ fontSize: 12.5, color: C.muted, fontWeight: 600 }}>Daily goal</span>
                  <button className="press" onClick={() => setGoal((g) => Math.max(800, g - 100))} style={{ width: 30, height: 30, borderRadius: 10, border: `1.5px solid ${C.line}`, background: "#fff", fontWeight: 800, color: C.ink2 }}>−</button>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontWeight: 700, fontSize: 14, color: C.ink, minWidth: 62, textAlign: "center" }}>{goal}</span>
                  <button className="press" onClick={() => setGoal((g) => Math.min(5000, g + 100))} style={{ width: 30, height: 30, borderRadius: 10, border: `1.5px solid ${C.line}`, background: "#fff", fontWeight: 800, color: C.ink2 }}>+</button>
                </div>

                {/* Macro summary */}
                <div style={{ background: "#fff", borderRadius: 20, padding: "16px 16px", boxShadow: "0 8px 22px rgba(244,81,44,0.07)", border: `1px solid ${C.line}` }}>
                  <div style={{ display: "flex", gap: 16 }}>
                    <MacroBar label="Carbs" grams={macros.carbs} target={MACRO_TARGETS.carbs} color={C.yellow} />
                    <MacroBar label="Protein" grams={macros.protein} target={MACRO_TARGETS.protein} color={C.green} />
                    <MacroBar label="Fat" grams={macros.fat} target={MACRO_TARGETS.fat} color={C.berry} />
                  </div>
                </div>

                {/* Meals */}
                {todayEntries.length === 0 ? (
                  <div style={{ background: "#fff", borderRadius: 20, padding: "28px 20px", textAlign: "center", border: `1.5px dashed ${C.line}` }}>
                    <div style={{ fontSize: 40 }}>🍽️</div>
                    <p style={{ fontFamily: heading, fontWeight: 700, fontSize: 16, color: C.ink, marginTop: 6 }}>No meals logged yet</p>
                    <p style={{ fontSize: 13, color: C.muted, marginTop: 2, marginBottom: 14 }}>Snap your first food to start today's diary.</p>
                    <button className="press" onClick={() => setView("snap")} style={{ border: "none", borderRadius: 14, padding: "12px 22px", color: "#fff", fontWeight: 800, fontFamily: heading, fontSize: 14.5, background: "linear-gradient(135deg,#ff8a63,#f4512c)" }}>📸 Snap a meal</button>
                  </div>
                ) : (
                  MEALS.map((m) => {
                    const items = todayEntries.filter((e) => e.mealType === m.key);
                    if (items.length === 0) return null;
                    const sub = sumBy(items, "kcal");
                    return (
                      <div key={m.key}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <span style={{ fontFamily: heading, fontWeight: 700, fontSize: 15, color: C.ink }}>{m.emoji} {m.label}</span>
                          <span style={{ fontSize: 12.5, fontWeight: 700, color: C.muted, fontFamily: "'DM Mono',monospace" }}>{sub} kcal</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {items.map((e) => (
                            <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 12, background: "#fff", border: `1px solid ${C.line}`, borderRadius: 14, padding: "11px 14px" }}>
                              <span style={{ fontSize: 26 }}>{e.emoji}</span>
                              <div style={{ flex: 1 }}>
                                <p style={{ fontWeight: 700, fontSize: 14.5, color: C.ink }}>{e.name}</p>
                                <p style={{ fontSize: 11.5, color: C.muted }}>{e.portion === "M" ? "Medium" : e.portion === "S" ? "Small" : "Large"} · {e.carbs}c · {e.protein}p · {e.fat}f</p>
                              </div>
                              <span style={{ fontFamily: "'DM Mono',monospace", fontWeight: 700, fontSize: 15, color: C.coralDeep }}>{e.kcal}</span>
                              <button className="press" onClick={() => deleteEntry(e.id)} aria-label="Delete" style={{ background: "none", border: "none", fontSize: 17, color: C.muted, padding: 2 }}>✕</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ═══ TRENDS ═══ */}
            {view === "trends" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <h1 style={{ fontFamily: heading, fontSize: 26, fontWeight: 800 }}>Trends 📈</h1>
                  <p style={{ color: C.muted, fontSize: 13 }}>Your last 14 days</p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  {[
                    { label: "Today", value: todayKcal, color: C.coralDeep },
                    { label: "7-day avg", value: avgLast7, color: C.tangerine },
                    { label: "🔥 Streak", value: `${streak}d`, color: C.green },
                  ].map((s) => (
                    <div key={s.label} style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 16, padding: "14px 8px", textAlign: "center", boxShadow: "0 6px 16px rgba(244,81,44,0.06)" }}>
                      <p style={{ fontFamily: heading, fontSize: 21, fontWeight: 800, color: s.color }}>{s.value}</p>
                      <p style={{ fontSize: 11, color: C.muted, marginTop: 2, fontWeight: 600 }}>{s.label}</p>
                    </div>
                  ))}
                </div>

                <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 20, padding: "18px 14px", boxShadow: "0 8px 22px rgba(244,81,44,0.07)" }}>
                  <Label>Daily calories · dashed line = goal</Label>
                  <HistoryChart data={chartData} goal={goal} />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[...chartData].reverse().filter((d) => d.kcal > 0 || d.key === todayKey).map((d) => {
                    const isToday = d.key === todayKey;
                    const over = d.kcal > goal;
                    return (
                      <div key={d.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: isToday ? "rgba(255,159,69,0.12)" : "#fff", border: `1px solid ${isToday ? "rgba(255,159,69,0.3)" : C.line}`, borderRadius: 12, padding: "12px 14px" }}>
                        <div>
                          <p style={{ fontWeight: isToday ? 800 : 600, fontSize: 14, color: C.ink }}>{isToday ? "Today" : formatDate(d.key)}</p>
                          <div style={{ width: 130, height: 4, background: "rgba(74,50,38,0.08)", borderRadius: 4, marginTop: 5, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${Math.min((d.kcal / goal) * 100, 100)}%`, borderRadius: 4, background: over ? C.berry : C.tangerine, transition: "width .4s" }} />
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontFamily: "'DM Mono',monospace", fontWeight: 700, fontSize: 15, color: over ? C.berry : C.coralDeep }}>{d.kcal > 0 ? d.kcal : "—"}</span>
                          {d.kcal > 0 && <p style={{ fontSize: 10, color: over ? C.berry : C.green, fontWeight: 700 }}>{over ? "over goal" : "on track"}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ═══ INSIGHTS ═══ */}
            {view === "insights" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <h1 style={{ fontFamily: heading, fontSize: 26, fontWeight: 800 }}>Insights 💡</h1>
                  <p style={{ color: C.muted, fontSize: 13 }}>Friendly tips from what you've logged</p>
                </div>
                {insights.map((ins, i) => <InsightCard key={i} {...ins} />)}
                <div style={{ background: "rgba(255,159,69,0.1)", border: `1.5px solid rgba(255,159,69,0.24)`, borderRadius: 18, padding: "14px 16px", display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 22 }}>💧</span>
                  <p style={{ fontSize: 13, color: C.ink2, lineHeight: 1.45 }}>Tip of the day: sip water before meals. It aids digestion and helps you read true hunger.</p>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div style={{ position: "absolute", bottom: 84, left: "50%", transform: "translateX(-50%)", zIndex: 5, background: C.ink, color: "#fff", borderRadius: 999, padding: "10px 18px", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 10px 24px rgba(0,0,0,0.2)", animation: "toastIn .3s ease", whiteSpace: "nowrap" }}>
            <span style={{ fontSize: 18 }}>{toast.emoji}</span>
            <span style={{ fontWeight: 700, fontSize: 13.5 }}>Logged {toast.name}! 🎉</span>
          </div>
        )}

        {/* ── BOTTOM TAB BAR ─────────────────────────── */}
        <div style={{
          display: "flex", flexShrink: 0, zIndex: 3, background: "rgba(255,247,237,0.92)",
          backdropFilter: "blur(10px)", borderTop: `1px solid ${C.line}`, padding: "8px 8px calc(8px + env(safe-area-inset-bottom))",
        }}>
          {TABS.map((t) => {
            const on = view === t.key;
            return (
              <button key={t.key} className="press" onClick={() => setView(t.key)} style={{
                flex: 1, background: "none", border: "none", display: "flex", flexDirection: "column",
                alignItems: "center", gap: 2, padding: "6px 0", color: on ? C.coralDeep : C.muted,
              }}>
                <span style={{ fontSize: 21, filter: on ? "none" : "grayscale(0.4) opacity(0.75)", transform: on ? "scale(1.12)" : "none", transition: "transform .15s" }}>{t.emoji}</span>
                <span style={{ fontSize: 10.5, fontWeight: on ? 800 : 600 }}>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Hidden camera / file input */}
        <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={onPickFile} style={{ display: "none" }} />
      </div>
    </>
  );
}
