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
| `PUBLIC_SITE_URL` | Sí | Dominio público sin barra final. Canonical, sitemap, robots.txt, Open Graph y vuelta desde Stripe. |
| `STRIPE_SECRET_KEY` | Para cobrar | Clave secreta de Stripe. Solo en el servidor. |

La clave de Stripe vive solo en el servidor (función de Netlify), nunca en el código del navegador.

## Otras opciones

- **Vercel**: importa el repo; detecta Astro. Añade `PUBLIC_SITE_URL`. Los formularios necesitan un servicio externo (Formspree, Basin) o una función: cambia el `action` del formulario. Traslada las cabeceras de `netlify.toml` a `vercel.json`.
- **GitHub Pages**: usa la acción oficial `withastro/action`. Sin cabeceras personalizadas ni formularios: usa un servicio externo de formularios.
- **Hosting tradicional (Apache/Nginx)**: sube `dist/` por FTP o SFTP. Configura HTTPS, las cabeceras de seguridad de `netlify.toml` y que `/ruta` sirva `/ruta.html`. En Nginx: `try_files $uri $uri.html $uri/ =404;`.

## Activar el pago real con Stripe

El código ya está hecho: `netlify/functions/checkout.mts` (ruta `/api/checkout`).

- Recalcula todos los precios en el servidor desde `src/data/catalog.ts`; ignora cualquier precio que llegue del navegador.
- Valida el pedido: productos existentes, cantidades entre 1 y 99, email, teléfono y dirección.
- Aplica el código de descuento y el envío, crea la sesión de Stripe Checkout y devuelve su URL.
- Al terminar el pago, Stripe vuelve a `/pedido-confirmado`, que vacía el carrito.

Para activarlo:

1. Crea una cuenta en stripe.com y copia la **clave secreta** (`sk_live_…`; para pruebas, `sk_test_…`).
2. En Netlify → **Environment variables**, añade `STRIPE_SECRET_KEY` con esa clave. No la pongas nunca en el código ni con prefijo `PUBLIC_`.
3. En `src/data/site.ts`, cambia `demoCheckout: true` por `false` y vuelve a desplegar.
4. Haz una compra de prueba con la clave `sk_test_` y la tarjeta 4242 4242 4242 4242.

Mientras no exista la clave, la función responde «El pago online no está activado todavía» y la tienda no se rompe.

**Siguientes pasos opcionales:**
- Webhook `checkout.session.completed` para recibir los pedidos en tu email o ERP.
- Bizum mediante Redsys, que necesita contrato con tu banco.
- Las pasarelas pueden pedir requisitos extra a las tiendas que venden CBD: confírmalo con Stripe antes.

## Después de cada cambio

```bash
npm run verify
```

Si cambias el script en línea del tema (`src/layouts/Base.astro`), la prueba te dirá el hash nuevo que debes poner en la CSP de `netlify.toml`.
