import { getStore } from "@netlify/blobs";

export default async (req) => {
  if (!authorized(req)) return json({ error: "No autorizado" }, 401);

  const store = getStore("links");

  if (req.method === "GET") {
    const { blobs } = await store.list();
    const items = await Promise.all(
      blobs.map((b) => store.get(b.key, { type: "json" }))
    );
    items.sort((a, b) => (b?.creado || 0) - (a?.creado || 0));
    return json(items.filter(Boolean));
  }

  if (req.method === "POST") {
    let data;
    try {
      data = await req.json();
    } catch {
      return json({ error: "Solicitud inválida" }, 400);
    }

    if (!data.slug || !data.destino || !data.titulo) {
      return json({ error: "Faltan campos obligatorios (título, destino, slug)" }, 400);
    }
    if (!/^https?:\/\//i.test(data.destino)) {
      return json({ error: "La URL de destino debe empezar con http:// o https://" }, 400);
    }

    const existing = await store.get(data.slug, { type: "json" });
    if (existing) return json({ error: "Ya existe un enlace con ese slug" }, 409);

    const link = {
      slug: data.slug,
      titulo: data.titulo,
      destino: data.destino,
      descripcion: data.descripcion || "",
      imagen: data.imagen || "",
      imagenAncho: data.imagenAncho ? Number(data.imagenAncho) : null,
      imagenAlto: data.imagenAlto ? Number(data.imagenAlto) : null,
      sitio: data.sitio || "",
      visitas: 0,
      creado: Date.now()
    };
    await store.setJSON(data.slug, link);
    return json(link, 201);
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

export const config = { path: "/api/links" };
