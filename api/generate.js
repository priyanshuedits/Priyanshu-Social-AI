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
      "Create useful social media content.\n" +
      "Include hook, caption, CTA and relevant hashtags.\n" +
      "Keep it engaging and concise.";

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
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
      console.error("GEMINI ERROR:", data);

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          data?.error?.status ||
          ("Gemini HTTP " + response.status)
      });
    }

    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map(p => p.text || "")
        .join("") || "";

    return res.status(200).json({
      text: text || "No AI output received."
    });

  } catch (error) {
    console.error("SERVER ERROR:", error);

    return res.status(500).json({
      error: error.message || "Server error"
    });
  }
}

module.exports = handler;
