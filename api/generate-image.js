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

    const apiKey = process.env.PIXAZO_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "PIXAZO_API_KEY is missing in Vercel"
      });
    }

    const response = await fetch(
      "https://gateway.pixazo.ai/flux/text-to-image",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Ocp-Apim-Subscription-Key": apiKey
        },

        body: JSON.stringify({
          prompt: prompt
        })
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return res.status(response.status).json({
        error:
          data?.error ||
          data?.message ||
          "Pixazo image generation failed"
      });
    }

    const imageUrl =
      data?.output ||
      data?.image_url ||
      data?.url ||
      data?.output?.media_url;

    if (!imageUrl) {
      return res.status(500).json({
        error: "Pixazo did not return an image URL.",
        response: data
      });
    }

    return res.status(200).json({
      image: imageUrl,
      mimeType: "image/png"
    });

  } catch (error) {
    console.error("PIXAZO IMAGE ERROR:", error);

    return res.status(500).json({
      error:
        error.message ||
        "Pixazo image generation server error"
    });
  }
}

module.exports = handler;
