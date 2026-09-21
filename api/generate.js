async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  try {
    const body = req.body || {};

    const topic = body.topic || "";
    const platform = body.platform || "Instagram Reels";
    const style = body.style || "Viral";

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is missing in Vercel"
      });
    }

    const prompt =
      "You are a professional social media manager.\n\n" +
      "Platform: " + platform + "\n" +
      "Topic: " + topic + "\n" +
      "Style: " + style + "\n\n" +
      "Create:\n" +
      "1. HOOK\n" +
      "2. CAPTION\n" +
      "3. CTA\n" +
      "4. 12 relevant hashtags\n\n" +
      "Keep it engaging and concise.";

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent",
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

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error:
          data &&
          data.error &&
          data.error.message
            ? data.error.message
            : "Gemini API request failed"
      });
    }

    const parts =
      data &&
      data.candidates &&
      data.candidates[0] &&
      data.candidates[0].content &&
      data.candidates[0].content.parts;

    const text = parts
      ? parts.map(function (part) {
          return part.text || "";
        }).join("")
      : "";

    return res.status(200).json({
      text: text || "No AI output received."
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message || "Server error"
    });
  }
}

module.exports = handler;
