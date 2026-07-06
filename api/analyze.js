// Vercel serverless function — the ONLY place the Anthropic API key is used.
// Runs server-side, so the key set in the Vercel dashboard is never sent to the browser.
// Receives a photo (data URL) and returns a structured food/calorie guess from Claude vision.

// Configurable so a stronger (pricier) vision model can be swapped in via the Vercel
// dashboard without a code change, if haiku's accuracy isn't good enough for a given user.
const MODEL = process.env.VISION_MODEL || "claude-haiku-4-5-20251001";

const SYSTEM_PROMPT = `You are a nutrition estimation assistant inside a food-tracking app.
You will be shown one photo of a meal, snack, or drink. Identify the food and estimate its
calories and macros for the portion shown in the photo.

Look carefully before deciding:
- Note every visible component (main item, sauce/broth, garnish, side, drink) — a dish is
  often a combination, not a single ingredient.
- Use color, texture, and visible ingredients as evidence (e.g. clear broth vs. thick gravy,
  fried vs. steamed, rice vs. noodles vs. bread) rather than guessing from a generic category.
- Weigh portion size and plate/glass size visible in the photo to size the calorie estimate,
  don't default to a "standard" serving if the photo clearly shows more or less.
- If the photo is blurry, poorly lit, cropped, or ambiguous, still give a best guess but lower
  "confidence" accordingly — don't inflate confidence when the evidence is weak.
- Prefer the most common, ordinary explanation for what's visible over an exotic one, unless
  specific visual details clearly point to the less common dish.
- This app's user mostly eats Thai food. When a dish is genuinely ambiguous between visually
  similar options across cuisines (e.g. a stir-fried rice or noodle dish, a curry, a soup that
  could be Thai or another Southeast/East Asian variant), break the tie toward the Thai version
  and rank Thai alternates higher too. Only apply this when it's a real tie in the visual
  evidence — don't relabel a dish as Thai if specific details (a clearly non-Thai plating,
  ingredient, or dish shape) point elsewhere; a slice of pizza is still a slice of pizza.

Respond with ONLY a single JSON object (no markdown fences, no prose) in exactly this shape:
{
  "name": "string, short food name, Title Case",
  "emoji": "one single emoji that best represents the food",
  "kcal": number,
  "carbs": number,
  "protein": number,
  "fat": number,
  "confidence": number (0-100, how sure you are this is the right food),
  "alternates": [
    { "name": "string", "emoji": "string", "kcal": number, "carbs": number, "protein": number, "fat": number }
  ]
}
Provide exactly 3 alternates: other plausible foods this could be, ranked by how well they also
fit the visual evidence, each with its own estimate.
If the photo shows multiple separate items, estimate the combined plate as one entry.
If the image genuinely does not show food or drink, set "name" to "Not sure — please search"
and "confidence" to 0, with empty alternates.
Base kcal/macros on a realistic serving of what is visible. Be decisive — always return
a best guess, never refuse.`;

function parseDataUrl(dataUrl) {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUrl || "");
  if (!match) return null;
  return { mediaType: match[1], base64: match[2] };
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Server is missing ANTHROPIC_API_KEY. Set it in Vercel project settings." });
    return;
  }

  const { image, mealType, pastCorrections } = req.body || {};
  const parsed = parseDataUrl(image);
  if (!parsed) {
    res.status(400).json({ error: "Missing or invalid image" });
    return;
  }

  // User-supplied history of times this AI misidentified a food, e.g.
  // "guessed 'Fried Rice' but it was actually 'Khao Man Gai'". This is a hint about
  // this user's typical foods/naming, not a literal answer — the model must still
  // judge the new photo on its own visual evidence.
  let correctionsNote = "";
  if (Array.isArray(pastCorrections) && pastCorrections.length > 0) {
    const lines = pastCorrections.slice(0, 5).map((c) => `- guessed "${c.guessed}" but it was actually "${c.correctedTo}"`).join("\n");
    correctionsNote = `\n\nFor context, this user has corrected past photo scans in this app:\n${lines}\nThese are hints about foods this user commonly eats, not answers to copy — judge this new photo on its own visual evidence, but weigh these corrections if the photo is genuinely ambiguous between similar options.`;
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 700,
        temperature: 0.2, // low temperature — favor the model's best visual judgment over creative variety
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: parsed.mediaType, data: parsed.base64 } },
              { type: "text", text: `This photo was taken around ${mealType || "an unspecified meal"} time. Identify the food and estimate calories.${correctionsNote}` },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      res.status(502).json({ error: `Vision API error (${response.status}): ${errText.slice(0, 300)}` });
      return;
    }

    const data = await response.json();
    const text = (data.content || []).map((b) => b.text || "").join("");
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      res.status(502).json({ error: "Could not parse a result from the vision model." });
      return;
    }

    const result = JSON.parse(jsonMatch[0]);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: `Analyze failed: ${err.message}` });
  }
};
