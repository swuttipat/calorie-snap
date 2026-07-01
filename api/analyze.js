// Vercel serverless function — the ONLY place the Anthropic API key is used.
// Runs server-side, so the key set in the Vercel dashboard is never sent to the browser.
// Receives a photo (data URL) and returns a structured food/calorie guess from Claude vision.

const MODEL = "claude-haiku-4-5-20251001"; // fast + cheap, good enough for food ID + calorie estimate

const SYSTEM_PROMPT = `You are a nutrition estimation assistant inside a food-tracking app.
You will be shown one photo of a meal, snack, or drink. Identify the food and estimate its
calories and macros for the portion shown in the photo.

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
Provide exactly 3 alternates: other plausible foods this could be, each with its own estimate.
If the photo shows multiple items, estimate the combined plate as one entry.
If the image genuinely does not show food or drink, set "name" to "Not sure — please search"
and "confidence" to 0, with empty alternates.
Base kcal/macros on a realistic single serving of what is visible. Be decisive — always return
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

  const { image, mealType } = req.body || {};
  const parsed = parseDataUrl(image);
  if (!parsed) {
    res.status(400).json({ error: "Missing or invalid image" });
    return;
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
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: parsed.mediaType, data: parsed.base64 } },
              { type: "text", text: `This photo was taken around ${mealType || "an unspecified meal"} time. Identify the food and estimate calories.` },
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
