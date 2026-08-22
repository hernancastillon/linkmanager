import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  const slug = context.params.slug;
  const store = getStore("links");
  const link = await store.get(slug, { type: "json" });

  if (!link) {
    return new Response(pageNotFound(slug), {
      status: 404,
      headers: { "content-type": "text/html; charset=utf-8" }
    });
  }

  // Conteo de visitas — no bloquea la respuesta al visitante.
  context.waitUntil(
    store.setJSON(slug, { ...link, visitas: (link.visitas || 0) + 1 })
  );

  const url = new URL(req.url);
  const shortUrl = `${url.protocol}//${url.host}/l/${slug}`;
  const siteName = link.sitio || url.host;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>${esc(link.titulo)}</title>
<link rel="canonical" href="${esc(shortUrl)}">
<meta name="robots" content="noindex">

<meta property="og:type" content="website">
<meta property="og:title" content="${esc(link.titulo)}">
<meta property="og:description" content="${esc(link.descripcion)}">
<meta property="og:image" content="${esc(link.imagen)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="${esc(shortUrl)}">
<meta property="og:site_name" content="${esc(siteName)}">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(link.titulo)}">
<meta name="twitter:description" content="${esc(link.descripcion)}">
<meta name="twitter:image" content="${esc(link.imagen)}">

<style>
  html,body{height:100%;margin:0;background:#12161c;color:#edeff2;font-family:ui-sans-serif,system-ui,sans-serif;
    display:flex;align-items:center;justify-content:center;text-align:center;}
  .box{max-width:320px;padding:24px;}
  .spinner{width:26px;height:26px;border:3px solid #2a3341;border-top-color:#ffb238;border-radius:50%;
    margin:0 auto 16px;animation:spin 0.8s linear infinite;}
  @keyframes spin{to{transform:rotate(360deg)}}
  p{font-size:14px;color:#8c97a8;margin:0 0 10px;}
  a{color:#4fb6c9;font-size:13px;}
</style>
</head>
<body>
  <div class="box">
    <div class="spinner"></div>
    <p>Redirigiendo…</p>
    <a href="${esc(link.destino)}">Haz clic aquí si no avanza automáticamente</a>
  </div>
  <script>window.location.replace(${JSON.stringify(link.destino)});<\/script>
</body>
</html>`;

  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8" }
  });
};

function esc(str) {
  return String(str || "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

function pageNotFound(slug) {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<title>Enlace no encontrado</title>
<meta name="robots" content="noindex">
<style>body{background:#12161c;color:#edeff2;font-family:ui-sans-serif,system-ui,sans-serif;
display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;}
p{color:#8c97a8;font-size:14px;}</style></head>
<body><div><h2>Enlace no encontrado</h2><p>No existe ninguna redirección activa para <code>${esc(slug)}</code>.</p></div></body></html>`;
}

export const config = { path: "/l/:slug" };
