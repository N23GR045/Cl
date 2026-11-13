# Raíz Verde · Grow Shop

Tienda online de un grow shop en Valencia, hecha con **Astro + TypeScript + CSS propio**.
Genera un sitio 100 % estático: **55 páginas** (portada, catálogo, 8 categorías, 39 fichas de producto, contacto, 4 páginas legales y 404), con carrito, asistente de compra y compra en 3 pasos que funcionan en el navegador.

| Lighthouse (móvil) | Rendimiento | Accesibilidad | Buenas prácticas | SEO |
|---|---|---|---|---|
| Portada | 98 | 100 | 100 | 100 |
| Ficha de producto | 98 | 100 | 100 | 100 |

## Requisitos

- Node.js 20 o superior (probado con 22).
- Para las pruebas: Playwright con Chromium (`npm i -D playwright && npx playwright install chromium` si no lo tienes).

## Uso

```bash
npm install          # instala dependencias (versiones exactas)
npm run dev          # servidor de desarrollo en http://localhost:4321
npm run build        # genera el sitio en dist/
npm run preview      # sirve dist/ para revisarlo
npm run verify       # tipos + build + validación HTML + pruebas en navegador
```

Copia `.env.example` a `.env` y pon tu dominio en `PUBLIC_SITE_URL` (lo usan canonical, sitemap, robots y Open Graph).

## Cómo editar

| Quiero cambiar… | Archivo |
|---|---|
| Productos, precios, descripciones, combinaciones | `src/data/catalog.ts` |
| Nombre, dirección, teléfono, horario, envío, código de descuento | `src/data/site.ts` |
| Preguntas frecuentes | `src/data/faq.ts` |
| Opiniones | `src/data/reviews.ts` |
| Textos de botones, errores, carrito (para traducir) | `src/i18n/es.ts` |
| Colores, tipografía, espaciado, radios, sombras | `src/styles/tokens.css` |
| Textos legales | `src/pages/legal/*.astro` |

**Añadir un producto:** añade un objeto a `products` en `src/data/catalog.ts` y sus imágenes en `public/img/<img>.webp` (720×591) y `<img>-360.webp` (360×295). La página `/productos/<id>` se crea sola.

**Imágenes de producto:** son renders 3D generados con three.js (`tools/studio.html`, `tools/render.js`). Puedes sustituirlas por fotos reales con el mismo nombre y tamaño.

## Antes de publicar (contenido de ejemplo)

Mientras `demoContent` y `demoCheckout` sean `true` en `src/data/site.ts`, la web muestra avisos visibles:

- [ ] Datos de la empresa, NIF, dirección, teléfono y email (`site.ts`).
- [ ] Opiniones reales y verificadas (`reviews.ts`), y luego `demoContent: false`.
- [ ] Textos legales revisados por un profesional (`src/pages/legal/`).
- [ ] Pasarela de pago real (ver `docs/DESPLIEGUE.md`), y luego `demoCheckout: false`.
- [ ] Revisión legal de la venta de productos de CBD.

## Decisiones técnicas

- **Astro estático** en lugar de SPA: cada producto tiene su URL, título y datos estructurados propios, todo indexable sin JavaScript. Solo se envían ~22 KB de JS.
- **Sin frameworks de UI ni dependencias en el navegador**: el JS son módulos pequeños (`src/scripts/`) que solo se activan si su HTML existe en la página.
- **Seguridad**: el DOM dinámico se crea con `textContent`/`createElement`, nunca con `innerHTML` sobre datos. CSP estricta con hash del único script en línea; los datos guardados en `localStorage` se sanean al leerlos.
- **Fuentes alojadas en el propio dominio** (`@fontsource`), con `font-display: swap`: más rápido y sin enviar la IP del visitante a Google (RGPD).
- **Sin cookies no esenciales**: solo almacenamiento técnico, por eso no hay banner (ver `/legal/cookies`).
- **Formularios** con Netlify Forms (sin backend ni claves) y honeypot antispam.
- **Modo claro y oscuro** según el sistema, con botón para elegir; ambos cumplen contraste AA.

## Estructura

```
.
├── astro.config.mjs        Configuración (sitemap, formato de URLs)
├── netlify.toml            Build, cabeceras de seguridad y caché
├── package.json
├── tsconfig.json
├── .env.example            PUBLIC_SITE_URL
├── .htmlvalidate.json      Reglas de validación HTML
├── .github/workflows/ci.yml  Integración continua
├── docs/
│   ├── CHECKLIST.md        Los 30 puntos y su estado
│   └── DESPLIEGUE.md       Netlify, Vercel, GitHub Pages, hosting tradicional
├── public/                 Archivos tal cual: favicon, og.jpg, img/*.webp
├── src/
│   ├── components/         Header, Footer, ProductCard, Catalog, CartDrawer, AgeGate, Breadcrumbs, Seo, JsonLd, Icon, Plant
│   ├── data/               catalog.ts, site.ts, faq.ts, reviews.ts
│   ├── i18n/es.ts          Cadenas de la interfaz
│   ├── layouts/            Base.astro, Legal.astro
│   ├── pages/              index, productos/, categoria/, contacto, legal/, 404, robots.txt
│   ├── scripts/            main, dom, ui, cart, checkout, catalog, quiz, pdp, forms
│   └── styles/             tokens, base, components, sections
├── tests/smoke.mjs         Pruebas con Playwright + axe-core
└── tools/                  Estudio 3D para regenerar las imágenes
```
