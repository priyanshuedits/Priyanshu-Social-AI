async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "POST only"
    });
  }

  try {
    const body = req.body || {};
    const prompt = String(body.prompt || "").trim();

    if (!prompt) {
      return res.status(400).json({
        error: "Image prompt is required"
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is missing in Vercel"
      });
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent",
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
            responseModalities: ["IMAGE"]
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "Image generation failed"
      });
    }

    const parts =
      data?.candidates?.[0]?.content?.parts || [];

    const imagePart = parts.find(
      part => part.inlineData
    );

    if (!imagePart) {
      return res.status(500).json({
        error: "No image was returned by Gemini."
      });
    }

    return res.status(200).json({
      image: imagePart.inlineData.data,
      mimeType:
        imagePart.inlineData.mimeType ||
        "image/png"
    });

  } catch (error) {

    return res.status(500).json({
      error:
        error.message ||
        "Image generation server error"
    });

  }
}

module.exports = handler;
