import { getStore } from "@netlify/blobs";

const MAX_BYTES = 4 * 1024 * 1024; // 4 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const EXT_FOR = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);
  if (!authorized(req)) return json({ error: "No autorizado" }, 401);

  let form;
  try {
    form = await req.formData();
  } catch {
    return json({ error: "No se pudo leer el archivo enviado" }, 400);
  }

  const file = form.get("image");
  if (!file || typeof file === "string") {
    return json({ error: "Falta el archivo de imagen" }, 400);
  }
  if (!ALLOWED.includes(file.type)) {
    return json({ error: "Formato no soportado. Usa JPG, PNG, WEBP o GIF." }, 400);
  }

  const buffer = await file.arrayBuffer();
  if (buffer.byteLength > MAX_BYTES) {
    return json({ error: "La imagen pesa más de 4 MB. Usa una versión más ligera." }, 400);
  }

  const width = Number(form.get("width")) || null;
  const height = Number(form.get("height")) || null;
  const ext = EXT_FOR[file.type] || "bin";
  const key = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const store = getStore("images");
  await store.set(key, buffer, {
    metadata: { contentType: file.type, width, height }
  });

  return json({ path: `/img/${key}`, width, height });
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

export const config = { path: "/api/upload-image" };
