// Built-in food database for the simulated "recognition" step.
// Values are per one standard (Medium) serving. Macros are grams and
// roughly reconcile with kcal (carbs*4 + protein*4 + fat*9); they are
// friendly estimates, not lab figures — the app always lets the user adjust.
//
// `meals` biases the mock recognition toward what you'd plausibly eat at a
// given time of day. `category` is only used for grouping in search.

export const FOODS = [
  // ── Thai favorites ──────────────────────────────────────────────
  { id: "pad-thai",       name: "Pad Thai",            emoji: "🍜", kcal: 400, carbs: 55, protein: 14, fat: 14, category: "thai",      meals: ["lunch", "dinner"] },
  { id: "green-curry",    name: "Green Curry",         emoji: "🍛", kcal: 350, carbs: 20, protein: 20, fat: 22, category: "thai",      meals: ["lunch", "dinner"] },
  { id: "som-tam",        name: "Som Tam",             emoji: "🥗", kcal: 120, carbs: 22, protein: 4,  fat: 2,  category: "thai",      meals: ["lunch", "dinner"] },
  { id: "mango-sticky",   name: "Mango Sticky Rice",   emoji: "🥭", kcal: 380, carbs: 70, protein: 5,  fat: 9,  category: "thai",      meals: ["snack", "dinner"] },
  { id: "thai-milk-tea",  name: "Thai Milk Tea",       emoji: "🧋", kcal: 220, carbs: 38, protein: 3,  fat: 6,  category: "drink",     meals: ["snack", "breakfast"] },
  { id: "tom-yum",        name: "Tom Yum Goong",       emoji: "🍲", kcal: 180, carbs: 12, protein: 20, fat: 6,  category: "thai",      meals: ["lunch", "dinner"] },
  { id: "khao-man-gai",   name: "Chicken Rice",        emoji: "🍗", kcal: 550, carbs: 65, protein: 30, fat: 18, category: "thai",      meals: ["lunch"] },
  { id: "pad-krapow",     name: "Basil Pork Rice",     emoji: "🍚", kcal: 520, carbs: 60, protein: 25, fat: 20, category: "thai",      meals: ["lunch", "dinner"] },
  { id: "spring-rolls",   name: "Spring Rolls",        emoji: "🥟", kcal: 150, carbs: 18, protein: 4,  fat: 7,  category: "thai",      meals: ["snack"] },
  { id: "satay",          name: "Chicken Satay",       emoji: "🍢", kcal: 280, carbs: 8,  protein: 24, fat: 17, category: "thai",      meals: ["snack", "lunch"] },

  // ── Mains (international) ────────────────────────────────────────
  { id: "cheeseburger",   name: "Cheeseburger",        emoji: "🍔", kcal: 550, carbs: 42, protein: 28, fat: 30, category: "main",      meals: ["lunch", "dinner"] },
  { id: "pizza",          name: "Pizza Slice",         emoji: "🍕", kcal: 285, carbs: 36, protein: 12, fat: 10, category: "main",      meals: ["lunch", "dinner"] },
  { id: "caesar-salad",   name: "Caesar Salad",        emoji: "🥗", kcal: 220, carbs: 10, protein: 8,  fat: 16, category: "main",      meals: ["lunch"] },
  { id: "spaghetti",      name: "Spaghetti Bolognese", emoji: "🍝", kcal: 450, carbs: 60, protein: 20, fat: 14, category: "main",      meals: ["dinner"] },
  { id: "fried-rice",     name: "Fried Rice",          emoji: "🍚", kcal: 420, carbs: 58, protein: 12, fat: 15, category: "main",      meals: ["lunch", "dinner"] },
  { id: "sushi",          name: "Sushi Roll",          emoji: "🍣", kcal: 250, carbs: 38, protein: 9,  fat: 6,  category: "main",      meals: ["lunch", "dinner"] },
  { id: "ramen",          name: "Ramen",               emoji: "🍜", kcal: 470, carbs: 60, protein: 20, fat: 17, category: "main",      meals: ["lunch", "dinner"] },
  { id: "grilled-chicken",name: "Grilled Chicken",     emoji: "🍗", kcal: 230, carbs: 0,  protein: 43, fat: 5,  category: "main",      meals: ["lunch", "dinner"] },
  { id: "steak",          name: "Steak",               emoji: "🥩", kcal: 420, carbs: 0,  protein: 46, fat: 26, category: "main",      meals: ["dinner"] },
  { id: "tacos",          name: "Tacos",               emoji: "🌮", kcal: 340, carbs: 30, protein: 14, fat: 18, category: "main",      meals: ["lunch", "dinner"] },

  // ── Breakfast ───────────────────────────────────────────────────
  { id: "fried-egg",      name: "Fried Egg",           emoji: "🍳", kcal: 90,  carbs: 1,  protein: 6,  fat: 7,  category: "breakfast", meals: ["breakfast"] },
  { id: "pancakes",       name: "Pancakes",            emoji: "🥞", kcal: 350, carbs: 55, protein: 8,  fat: 11, category: "breakfast", meals: ["breakfast"] },
  { id: "toast",          name: "Buttered Toast",      emoji: "🍞", kcal: 150, carbs: 20, protein: 4,  fat: 6,  category: "breakfast", meals: ["breakfast"] },
  { id: "oatmeal",        name: "Oatmeal",             emoji: "🥣", kcal: 220, carbs: 40, protein: 6,  fat: 4,  category: "breakfast", meals: ["breakfast"] },
  { id: "croissant",      name: "Croissant",           emoji: "🥐", kcal: 270, carbs: 31, protein: 5,  fat: 14, category: "breakfast", meals: ["breakfast", "snack"] },
  { id: "cereal",         name: "Cereal & Milk",       emoji: "🥣", kcal: 250, carbs: 44, protein: 8,  fat: 5,  category: "breakfast", meals: ["breakfast"] },

  // ── Fresh / fruit ───────────────────────────────────────────────
  { id: "apple",          name: "Apple",               emoji: "🍎", kcal: 95,  carbs: 25, protein: 0,  fat: 0,  category: "fresh",     meals: ["snack", "breakfast"] },
  { id: "banana",         name: "Banana",              emoji: "🍌", kcal: 105, carbs: 27, protein: 1,  fat: 0,  category: "fresh",     meals: ["snack", "breakfast"] },
  { id: "orange",         name: "Orange",              emoji: "🍊", kcal: 62,  carbs: 15, protein: 1,  fat: 0,  category: "fresh",     meals: ["snack"] },
  { id: "grapes",         name: "Grapes",              emoji: "🍇", kcal: 104, carbs: 27, protein: 1,  fat: 0,  category: "fresh",     meals: ["snack"] },
  { id: "watermelon",     name: "Watermelon",          emoji: "🍉", kcal: 85,  carbs: 21, protein: 2,  fat: 0,  category: "fresh",     meals: ["snack"] },
  { id: "yogurt",         name: "Greek Yogurt",        emoji: "🥛", kcal: 150, carbs: 17, protein: 9,  fat: 4,  category: "fresh",     meals: ["breakfast", "snack"] },
  { id: "nuts",           name: "Mixed Nuts",          emoji: "🥜", kcal: 200, carbs: 7,  protein: 6,  fat: 18, category: "fresh",     meals: ["snack"] },
  { id: "avocado",        name: "Avocado",             emoji: "🥑", kcal: 240, carbs: 12, protein: 3,  fat: 22, category: "fresh",     meals: ["breakfast", "snack"] },

  // ── Snacks & treats ─────────────────────────────────────────────
  { id: "chocolate",      name: "Chocolate Bar",       emoji: "🍫", kcal: 230, carbs: 26, protein: 3,  fat: 13, category: "snack",     meals: ["snack"] },
  { id: "chips",          name: "Potato Chips",        emoji: "🥔", kcal: 160, carbs: 15, protein: 2,  fat: 10, category: "snack",     meals: ["snack"] },
  { id: "ice-cream",      name: "Ice Cream",           emoji: "🍦", kcal: 210, carbs: 24, protein: 4,  fat: 11, category: "snack",     meals: ["snack"] },
  { id: "donut",          name: "Donut",               emoji: "🍩", kcal: 250, carbs: 31, protein: 3,  fat: 14, category: "snack",     meals: ["snack", "breakfast"] },
  { id: "cookies",        name: "Cookies",             emoji: "🍪", kcal: 160, carbs: 22, protein: 2,  fat: 8,  category: "snack",     meals: ["snack"] },
  { id: "fries",          name: "French Fries",        emoji: "🍟", kcal: 320, carbs: 42, protein: 4,  fat: 15, category: "snack",     meals: ["snack", "lunch"] },

  // ── Drinks ──────────────────────────────────────────────────────
  { id: "latte",          name: "Latte",               emoji: "☕", kcal: 130, carbs: 10, protein: 8,  fat: 5,  category: "drink",     meals: ["breakfast", "snack"] },
  { id: "orange-juice",   name: "Orange Juice",        emoji: "🧃", kcal: 110, carbs: 26, protein: 2,  fat: 0,  category: "drink",     meals: ["breakfast"] },
  { id: "cola",           name: "Cola",                emoji: "🥤", kcal: 140, carbs: 39, protein: 0,  fat: 0,  category: "drink",     meals: ["snack", "lunch"] },
  { id: "smoothie",       name: "Fruit Smoothie",      emoji: "🥤", kcal: 200, carbs: 40, protein: 5,  fat: 3,  category: "drink",     meals: ["breakfast", "snack"] },
  { id: "beer",           name: "Beer",                emoji: "🍺", kcal: 150, carbs: 13, protein: 2,  fat: 0,  category: "drink",     meals: ["dinner", "snack"] },
];

// Map an hour (0–23) to the meal it most likely belongs to.
export function mealForHour(h) {
  if (h >= 5 && h < 11) return "breakfast";
  if (h >= 11 && h < 15) return "lunch";
  if (h >= 15 && h < 18) return "snack";
  if (h >= 18 && h < 22) return "dinner";
  return "snack";
}

export const currentMeal = () => mealForHour(new Date().getHours());

const shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Simulated recognition: pick a plausible best guess biased by meal time,
// plus a few alternates so the user can correct it. Returns the primary with a
// mock confidence and 3 distinct alternates.
export function recognize(mealType) {
  const matches = FOODS.filter((f) => f.meals.includes(mealType));
  const pool = matches.length >= 4 ? matches : FOODS;
  const picks = shuffle(pool).slice(0, 4);
  const [primary, ...alternates] = picks;
  const confidence = Math.floor(78 + Math.random() * 18); // 78–95%
  return { primary: { ...primary, confidence }, alternates };
}
