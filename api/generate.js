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

    const topic = body.topic || "";
    const platform = body.platform || "Instagram Reels";
    const style = body.style || "Viral";

    if (!topic.trim()) {
      return res.status(400).json({
        error: "Topic is required"
      });
    }

    const prompt =
      "You are a professional social media AI assistant.\n\n" +
      "Platform: " + platform + "\n" +
      "Topic: " + topic + "\n" +
      "Style: " + style + "\n\n" +
      "Create high-quality social media content.\n" +
      "Include:\n" +
      "1. HOOK\n" +
      "2. CAPTION\n" +
      "3. CTA\n" +
      "4. 12 relevant hashtags\n\n" +
      "Keep the response useful, engaging and concise.";

    // First model
    const models = [
      "gemini-3.6-flash",
      "gemini-3.5-flash-lite"
    ];

    let lastError = "";

    for (const model of models) {

      // Retry each model up to 2 times
      for (let attempt = 0; attempt < 2; attempt++) {

        const result = await callGemini(model, prompt);

        if (result.ok) {
          const parts =
            result.data &&
            result.data.candidates &&
            result.data.candidates[0] &&
            result.data.candidates[0].content &&
            result.data.candidates[0].content.parts;

          const text = parts
            ? parts
                .map(function (part) {
                  return part.text || "";
                })
                .join("")
            : "";

          if (text) {
            return res.status(200).json({
              text: text,
              model: model
            });
          }

          lastError = "No AI output received.";
          break;
        }

        lastError =
          result.data &&
          result.data.error &&
          result.data.error.message
            ? result.data.error.message
            : "Gemini HTTP " + result.status;

        // Retry only temporary errors
        if (
          result.status !== 429 &&
          result.status !== 500 &&
          result.status !== 503
        ) {
          break;
        }

        // Wait before retry
        await new Promise(function (resolve) {
          setTimeout(resolve, 1500 * (attempt + 1));
        });
      }
    }

    return res.status(503).json({
      error:
        "All Gemini models are temporarily busy. Please try again in a moment.\n\n" +
        "Details: " +
        lastError
    });

  } catch (error) {
    console.error("SERVER ERROR:", error);

    return res.status(500).json({
      error: error.message || "Server error"
    });
  }
}

module.exports = handler;
