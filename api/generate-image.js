async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "POST only"
    });
  }

  try {
    const prompt = String(req.body?.prompt || "").trim();

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
      "https://gateway.pixazo.ai/flux-1-schnell/v1/getData",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",

          // IMPORTANT
          "Ocp-Apim-Subscription-Key": apiKey
        },

        body: JSON.stringify({
          prompt: prompt,
          num_steps: 4,
          seed: Math.floor(Math.random() * 1000000),
          height: 512,
          width: 512
        })
      }
    );

    const data = await response.json().catch(() => ({}));

    console.log("PIXAZO STATUS:", response.status);
    console.log("PIXAZO RESPONSE:", data);

    if (!response.ok) {
      return res.status(response.status).json({
        error:
          data?.message ||
          data?.error ||
          `Pixazo error ${response.status}`,
        details: data
      });
    }

    if (!data?.output) {
      return res.status(500).json({
        error: "Pixazo did not return an image URL.",
        details: data
      });
    }

    return res.status(200).json({
      image: data.output,
      mimeType: "image/png"
    });

  } catch (error) {
    console.error("IMAGE ERROR:", error);

    return res.status(500).json({
      error: error.message || "Image generation failed"
    });
  }
}

module.exports = handler;
