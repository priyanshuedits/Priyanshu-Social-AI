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
      "https://gateway.pixazo.ai/flux-1-schnell/v1/getDataBatch",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "X-Secret-Key": apiKey,
          "Cache-Control": "no-cache"
        },

        body: JSON.stringify({
          prompt: prompt,
          num_steps: 4,
          seed: Math.floor(Math.random() * 1000000),
          height: 768,
          width: 768
        })
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return res.status(response.status).json({
        error:
          data?.message ||
          data?.error ||
          `Pixazo error ${response.status}`,
        details: data
      });
    }

    /*
      Pixazo Flux Schnell may return:
      {
        status: "completed",
        output: "https://....png"
      }

      If processing is asynchronous, return request information
      so the frontend receives a useful error instead of "not found".
    */

    if (data?.output) {
      return res.status(200).json({
        image: data.output,
        mimeType: "image/png"
      });
    }

    if (
      data?.status &&
      data.status.toLowerCase() !== "completed"
    ) {
      return res.status(202).json({
        status: data.status,
        requestId:
          data.request_id ||
          data.requestId ||
          null,
        message: "Image is still generating."
      });
    }

    return res.status(500).json({
      error: "Pixazo returned no image.",
      details: data
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
