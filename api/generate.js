async function callGemini(model, prompt) {
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/" +
      model +
      ":generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ]
      })
    }
  );

  const data = await response.json().catch(() => ({}));

  return {
    ok: response.ok,
    status: response.status,
    data: data
  };
}

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "POST only"
    });
  }

  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is missing in Vercel"
      });
    }

    const body = req.body || {};

    const topic = String(body.topic || "").trim();
    const platform = body.platform || "Instagram Reels";
    const style = body.style || "Viral";

    if (!topic) {
      return res.status(400).json({
        error: "Topic is required"
      });
    }

    const prompt =
      "You are a professional social media AI assistant.\n" +
      "Platform: " + platform + "\n" +
      "Topic: " + topic + "\n" +
      "Style: " + style + "\n\n" +
      "Create:\n" +
      "1. HOOK\n" +
      "2. CAPTION\n" +
      "3. CTA\n" +
      "4. 12 relevant hashtags.\n\n" +
      "Keep it engaging and concise.";

    const models = [
      "gemini-3.6-flash",
      "gemini-3.5-flash-lite"
    ];

    for (const model of models) {
      const result = await callGemini(model, prompt);

      if (result.ok) {
        const text =
          result.data?.candidates?.[0]?.content?.parts
            ?.map(part => part.text || "")
            .join("") || "";

        if (text) {
          return res.status(200).json({
            text: text
          });
        }
      }
    }

    return res.status(503).json({
      error: "Gemini is temporarily busy. Please try again in a moment."
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message || "Server error"
    });
  }
}

module.exports = handler;
