export default async (req) => {
  if (req.method !== "POST") {
    return json({ error: "Método no permitido" }, 405);
  }

  if (!process.env.ADMIN_PASSWORD) {
    return json({ error: "El sitio no tiene configurada la variable ADMIN_PASSWORD en Netlify." }, 500);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Solicitud inválida" }, 400);
  }

  const ok = !!body.password && body.password === process.env.ADMIN_PASSWORD;
  return json({ ok }, ok ? 200 : 401);
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  });
}

export const config = { path: "/api/login" };
