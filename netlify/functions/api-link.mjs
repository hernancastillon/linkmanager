import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  if (!authorized(req)) return json({ error: "No autorizado" }, 401);

  const slug = context.params.slug;
  const store = getStore("links");

  if (req.method === "PUT") {
    let data;
    try {
      data = await req.json();
    } catch {
      return json({ error: "Solicitud inválida" }, 400);
    }

    const existing = await store.get(slug, { type: "json" });
    if (!existing) return json({ error: "Ese enlace no existe" }, 404);

    if (data.destino && !/^https?:\/\//i.test(data.destino)) {
      return json({ error: "La URL de destino debe empezar con http:// o https://" }, 400);
    }

    const updated = {
      ...existing,
      titulo: data.titulo ?? existing.titulo,
      destino: data.destino ?? existing.destino,
      descripcion: data.descripcion ?? existing.descripcion,
      imagen: data.imagen ?? existing.imagen,
      imagenAncho: data.imagenAncho !== undefined ? (data.imagenAncho ? Number(data.imagenAncho) : null) : existing.imagenAncho,
      imagenAlto: data.imagenAlto !== undefined ? (data.imagenAlto ? Number(data.imagenAlto) : null) : existing.imagenAlto,
      sitio: data.sitio ?? existing.sitio,
      actualizado: Date.now()
    };
    await store.setJSON(slug, updated);
    return json(updated);
  }

  if (req.method === "DELETE") {
    const existing = await store.get(slug, { type: "json" });
    if (!existing) return json({ error: "Ese enlace no existe" }, 404);
    await store.delete(slug);
    return json({ ok: true });
  }

  return json({ error: "Método no permitido" }, 405);
};

function authorized(req) {
  const pass = req.headers.get("x-admin-password");
  return !!pass && !!process.env.ADMIN_PASSWORD && pass === process.env.ADMIN_PASSWORD;
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  });
}

export const config = { path: "/api/links/:slug" };
