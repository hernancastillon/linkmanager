import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  const key = context.params.key;
  const store = getStore("images");

  const entry = await store.getWithMetadata(key, { type: "arrayBuffer" });
  if (!entry) {
    return new Response("Imagen no encontrada", { status: 404 });
  }

  const contentType = (entry.metadata && entry.metadata.contentType) || "application/octet-stream";

  return new Response(entry.data, {
    headers: {
      "content-type": contentType,
      "cache-control": "public, max-age=31536000, immutable"
    }
  });
};

export const config = { path: "/img/:key" };
