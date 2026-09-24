async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  try {
    const body = req.body || {};

    const topic = String(body.topic || "").trim();
    const platform = String(body.platform || "Instagram Reels").trim();
    const style = String(body.style || "Viral").trim();

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is missing in Vercel"
      });
    }

    if (!topic) {
      return res.status(400).json({
        error: "Topic/content is required"
      });
    }

    let prompt;

    // AI IMAGE PROMPT GENERATOR
    if (platform === "AI Image Generator") {

      prompt =
        "You are a professional AI image prompt engineer.\n\n" +
        "Create ONE detailed, ready-to-use image-generation prompt.\n\n" +
        "Topic: " + topic + "\n" +
        "Visual style: " + style + "\n\n" +

        "Include:\n" +
        "- Main subjects and their appearance\n" +
        "- Pose and action\n" +
        "- Composition\n" +
        "- Environment and background\n" +
        "- Lighting\n" +
        "- Colors\n" +
        "- Camera angle\n" +
        "- Lens/camera feel\n" +
        "- Depth of field\n" +
        "- Atmosphere\n" +
        "- Visual effects\n" +
        "- High-quality details\n\n" +

        "If the topic contains VS or a battle, " +
        "clearly describe both characters facing each other " +
        "in an intense action scene.\n\n" +

        "Return ONLY the final image-generation prompt.\n" +
        "Do NOT generate a hook, caption, CTA, hashtags, " +
        "script, explanation, heading or analysis.";

    } else {

      // NORMAL SOCIAL MEDIA GENERATOR

      prompt =
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
    }

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
          ],

          generationConfig: {
            temperature: 0.7,

            maxOutputTokens:
              platform === "AI Image Generator"
                ? 500
                : 700
          }
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
      ? parts
          .map(function (part) {
            return part.text || "";
          })
          .join("")
      : "";

    return res.status(200).json({
      text: text.trim() || "No AI output received."
    });

  } catch (error) {

    return res.status(500).json({
      error:
        error.message ||
        "Server error"
    });

  }
}

module.exports = handler;
