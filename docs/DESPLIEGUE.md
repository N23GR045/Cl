# Despliegue

El sitio es estático: cualquier hosting que sirva archivos vale. El build es `npm run build` y la carpeta a publicar es `dist/`.

## Recomendado: Netlify

Es la opción más completa sin escribir backend: **Netlify Forms** recibe los formularios de contacto y newsletter, y `netlify.toml` ya incluye las cabeceras de seguridad y caché.

1. Sube el repositorio a GitHub y en Netlify elige **Add new site → Import from Git**.
2. Netlify lee `netlify.toml`: build `npm run build`, publicar `dist`, Node 22.
3. En **Site settings → Environment variables** añade `PUBLIC_SITE_URL=https://www.tudominio.es`.
4. En **Domain management** conecta tu dominio; el HTTPS (Let's Encrypt) se activa solo.
5. En **Forms** activa la detección de formularios y configura las notificaciones por email.

## Variables de entorno

| Variable | Obligatoria | Uso |
|---|---|---|
| `PUBLIC_SITE_URL` | Sí | Dominio público sin barra final. Canonical, sitemap, robots.txt y Open Graph. |

No hay más claves ni secretos. Cuando conectes un pago real, las claves irán **solo** en el servidor (ver abajo), nunca en el código del navegador.

## Otras opciones

- **Vercel**: importa el repo; detecta Astro. Añade `PUBLIC_SITE_URL`. Los formularios necesitan un servicio externo (Formspree, Basin) o una función: cambia el `action` del formulario. Traslada las cabeceras de `netlify.toml` a `vercel.json`.
- **GitHub Pages**: usa la acción oficial `withastro/action`. Sin cabeceras personalizadas ni formularios: usa un servicio externo de formularios.
- **Hosting tradicional (Apache/Nginx)**: sube `dist/` por FTP o SFTP. Configura HTTPS, las cabeceras de seguridad de `netlify.toml` y que `/ruta` sirva `/ruta.html`. En Nginx: `try_files $uri $uri.html $uri/ =404;`.

## Conectar un pago real (pendiente)

La compra actual es una demostración (`demoCheckout: true`). Para cobrar:

1. Crea una función serverless (por ejemplo `netlify/functions/checkout.ts`) que reciba el carrito, **recalcule precios en el servidor** a partir de `catalog.ts` y cree una sesión de Stripe Checkout o de Redsys.
2. Guarda la clave secreta como variable de entorno del servidor: `STRIPE_SECRET_KEY` (nunca con prefijo `PUBLIC_`).
3. En `src/scripts/checkout.ts`, sustituye el bloque marcado como `DEMO` por una llamada a esa función y la redirección al pago.
4. Pon `demoCheckout: false` en `src/data/site.ts`.

Las pasarelas suelen pedir requisitos extra a las tiendas de CBD: consúltalo antes.

## Después de cada cambio

```bash
npm run verify
```

Si cambias el script en línea del tema (`src/layouts/Base.astro`), la prueba te dirá el hash nuevo que debes poner en la CSP de `netlify.toml`.
