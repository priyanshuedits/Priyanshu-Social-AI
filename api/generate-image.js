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
          "Cache-Control": "no-cache",
          "Ocp-Apim-Subscription-Key": apiKey
        },

        body: JSON.stringify({
          prompt: prompt
        })
      }
    );

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return res.status(response.status).json({
        error:
          data?.message ||
          data?.error ||
          data?.detail ||
          `Pixazo error: ${response.status}`,
        details: data
      });
    }

    // Pixazo free Flux endpoint returns the generated image URL
    const imageUrl =
      data?.output ||
      data?.image ||
      data?.image_url ||
      data?.url;

    if (!imageUrl) {
      return res.status(500).json({
        error: "Pixazo returned no image URL.",
        details: data
      });
    }

    return res.status(200).json({
      image: imageUrl,
      mimeType: "image/png"
    });

  } catch (error) {
    console.error("PIXAZO ERROR:", error);

    return res.status(500).json({
      error:
        error.message ||
        "Pixazo image generation failed"
    });
  }
}

module.exports = handler;
