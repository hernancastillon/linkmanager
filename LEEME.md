# LinkManager OG — versión con backend en vivo

Ya no es un panel puramente estático: ahora usa **Netlify Functions** (código que corre en el servidor de Netlify) y **Netlify Blobs** (almacenamiento de datos incluido en Netlify, sin necesidad de contratar una base de datos aparte). Al guardar un enlace queda publicado al instante en `/l/tu-slug` — no hay que descargar ni volver a subir nada.

Esto ya no cabe en "solo HTML/CSS": las funciones están escritas en JavaScript (Node.js) y corren del lado del servidor. Es el paso que mencioné antes como posible siguiente etapa.

## Qué cambia frente a la versión anterior

- **Antes:** cada enlace se descargaba como `.html` y tenías que subirlo tú a `/l/`.
- **Ahora:** el formulario llama directamente a funciones en el servidor (`/api/links`), que guardan el enlace en Netlify Blobs. La URL `/l/tu-slug` la genera una función en el momento en que alguien la visita — con las etiquetas correctas siempre, para cualquier rastreador.
- La contraseña ya no vive en el navegador: se valida contra una variable de entorno `ADMIN_PASSWORD` que configuras en Netlify.

## Archivos de este paquete

```
index.html                          → el panel (ahora es solo la interfaz; los datos viven en el servidor)
package.json                        → declara la dependencia @netlify/blobs
netlify.toml                        → le dice a Netlify dónde están las funciones
netlify/functions/api-login.mjs     → valida la contraseña
netlify/functions/api-links.mjs     → lista y crea enlaces  (GET / POST en /api/links)
netlify/functions/api-link.mjs      → edita y elimina un enlace  (PUT / DELETE en /api/links/:slug)
netlify/functions/redirect.mjs      → sirve cada redirección con sus etiquetas Open Graph  (/l/:slug)
```

## Cómo publicarlo (requiere GitHub — ya no es arrastrar y soltar)

Netlify necesita instalar la dependencia `@netlify/blobs` como parte de un build. Eso solo ocurre cuando el sitio está conectado a un repositorio, no al arrastrar una carpeta a Netlify Drop.

1. **Crea un repositorio en GitHub** con todos los archivos de este paquete (manteniendo la carpeta `netlify/functions/` tal cual).
2. En Netlify: **Add new site → Import an existing project** → conecta ese repositorio.
3. En la configuración de build deja:
   - Build command: el que ya trae `netlify.toml` (no necesitas escribir nada extra).
   - Publish directory: `.`
4. Antes o después del primer deploy, ve a **Site configuration → Environment variables** y agrega:
   - `ADMIN_PASSWORD` = la contraseña que quieras usar para entrar al panel.
5. Dispara un deploy (o espera el automático). Cuando termine, abre la URL de tu sitio — ese `index.html` ya es el panel en vivo.
6. Inicia sesión con la contraseña que pusiste en el paso 4. Crea un enlace y pruébalo: queda publicado de inmediato en `https://tu-sitio.netlify.app/l/tu-slug`.

### Si tu sitio actual (`jenrixlinkmanager.netlify.app`) fue desplegado por arrastrar y soltar

Tendrás que conectarlo a un repositorio de GitHub para que esto funcione: en Netlify, ve a **Site configuration → Build & deploy → Link repository**, o crea un sitio nuevo desde el repositorio y actualiza el dominio si quieres conservar el mismo nombre.

## Migrar los enlaces que ya creaste con la versión anterior

Si aún tienes abierta la versión vieja del panel en tu navegador (la que guardaba todo en `localStorage`), usa ahí el botón de exportar respaldo para bajar el `.json`, y vuelve a crear esos enlaces uno por uno en el panel nuevo — el nuevo formulario no tiene un botón de "importar" porque ahora cada creación pasa por validaciones del servidor (slug duplicado, campos obligatorios, etc.).

## Verificar que Facebook ya lee bien las etiquetas

Usa el Depurador de Facebook (developers.facebook.com/tools/debug) sobre la URL `/l/tu-slug` y pulsa "Volver a extraer" — como ahora la respuesta la genera el servidor en cada visita, no debería quedar contenido cacheado incorrecto una vez que fuerces la nueva extracción.

## Límites a tener en cuenta

- Netlify Blobs y las Functions están incluidos en el plan gratuito de Netlify dentro de cuotas generosas para uso interno; revisa los límites actuales en la documentación de Netlify si esperas mucho tráfico.
- La contraseña sigue siendo un candado simple (una sola contraseña compartida), no cuentas individuales por administrador.
