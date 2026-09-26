async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "GET only" });
  }

  try {
    const imageUrl = String(req.query?.url || "").trim();

    if (!imageUrl) {
      return res.status(400).json({
        error: "Image URL is required"
      });
    }

    const url = new URL(imageUrl);

    if (!url.hostname.endsWith(".r2.dev")) {
      return res.status(403).json({
        error: "Invalid image source"
      });
    }

    const response = await fetch(imageUrl);

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Image download failed (${response.status})`
      });
    }

    const contentType =
      response.headers.get("content-type") ||
      "image/png";

    const buffer =
      Buffer.from(await response.arrayBuffer());

    res.setHeader("Content-Type", contentType);

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="priyanshu-ai-image.png"'
    );

    res.setHeader(
      "Content-Length",
      buffer.length
    );

    res.setHeader(
      "Cache-Control",
      "no-store"
    );

    return res.status(200).send(buffer);

  } catch (error) {
    console.error("DOWNLOAD ERROR:", error);

    return res.status(500).json({
      error:
        error.message ||
        "Download failed"
    });
  }
}

module.exports = handler;
