// Server-side proxy for GitHub Releases. The CDN cache is shared by visitors,
// so browsers never consume GitHub's anonymous API quota independently.
module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
  res.setHeader("Access-Control-Allow-Methods", "GET");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const upstream = await fetch(
      "https://api.github.com/repos/fenixlife1978/sicoven-descargas/releases?per_page=100",
      {
        headers: {
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "SICOVEN-Downloads-Portal"
        }
      }
    );
    if (!upstream.ok) {
      const detail = await upstream.text();
      res.setHeader("Cache-Control", "no-store");
      return res.status(upstream.status).json({
        error: "No fue posible consultar las publicaciones oficiales.",
        upstreamStatus: upstream.status,
        detail: detail.slice(0, 300)
      });
    }

    const releases = await upstream.json();
    if (!Array.isArray(releases)) {
      res.setHeader("Cache-Control", "no-store");
      return res.status(502).json({ error: "GitHub devolvió un formato inesperado." });
    }

    return res.status(200).json(releases);
  } catch (error) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(502).json({
      error: "Servicio de versiones temporalmente no disponible."
    });
  }
};
