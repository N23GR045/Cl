# Checklist de los 30 puntos

Estado: ✅ cumplido · 🟡 parcial · ⏳ pendiente (depende de datos o servicios del negocio) · ➖ no aplica.
Las pruebas se ejecutan con `npm run verify`.

| # | Punto | Estado | Cómo se cumple / evidencia |
|---|---|---|---|
| 1 | Alcance | ✅ | Ver «Alcance» abajo. |
| 2 | Estructura de archivos | ✅ | `src/{components,data,i18n,layouts,pages,scripts,styles}`, `tests/`, `docs/`, `tools/` (README). |
| 3 | HTML5 semántico | ✅ | header, nav, main, section, article, footer, dl, figure, details. Un solo h1 por página (probado en las 55). Validación HTML sin errores. |
| 4 | Mobile-first y responsive | ✅ | Estilos base para móvil y `min-width` 560/820/1080. La prueba comprueba que no hay desbordamiento a 390 px en las 55 páginas. |
| 5 | Sistema de diseño | ✅ | `src/styles/tokens.css`: color, tipografía, espaciado, radios, sombras, contenedor y breakpoints. |
| 6 | Escala tipográfica | ✅ | Escala modular 1,25 con `clamp()`, interlineado 1,05 a 1,6 y medida de 65ch. |
| 7 | Paleta con contraste | ✅ | Explicada en `tokens.css`. axe-core: 0 fallos de contraste en claro y oscuro. |
| 8 | Componentes reutilizables | ✅ | Botones (primario, secundario, ghost, sm), insignias, alertas, campos, chips, tarjeta, cantidad, cabecera, pie, migas, panel lateral, diálogo y aviso flotante. |
| 9 | Layout consistente | ✅ | Contenedor de 1240 px, grid y flex con `gap`, espaciado de secciones con `--section`. |
| 10 | Navegación | ✅ | Menú con `aria-current`, migas de pan con JSON-LD, menú móvil accesible y enlace «Saltar al contenido». |
| 11 | Hero | ✅ | Propuesta de valor, subtítulo, CTA principal y secundaria, sellos de confianza. |
| 12 | Secciones con jerarquía | ✅ | Asistente, categorías, destacados, kit, guía, montaje, opiniones, FAQ y newsletter. |
| 13 | CTAs coherentes | ✅ | Una acción principal por sección; las secundarias usan otro estilo. |
| 14 | Contenido realista sin inventar | ✅ | Textos útiles y reales. Opiniones, datos de contacto y legales marcados visiblemente como ejemplo (`demoContent`). Sin valoraciones falsas en los datos estructurados. |
| 15 | Formularios accesibles | ✅ | Etiquetas, ayudas, `fieldset` y `legend`, `autocomplete` correcto, consentimiento RGPD. |
| 16 | Validación en cliente | ✅ | Mensajes en texto con icono, `aria-invalid` y `aria-describedby`, foco en el primer error (probado). |
| 17 | Estados de UI | ✅ | hover, focus-visible, active, disabled, cargando (`aria-busy`), vacío (carrito y búsqueda), error y éxito. |
| 18 | Modo oscuro | ✅ | Sigue al sistema, con botón para elegir; sin parpadeo; contraste AA en los dos modos. |
| 19 | WCAG 2.2 AA | ✅ | axe-core (wcag2a, 2aa, 21aa, 22aa): 0 fallos. Lighthouse Accesibilidad: 100. Teclado, foco atrapado en diálogos, Escape, objetivos de 44 px o más. Con «reducir movimiento» no hay intro ni animaciones (probado). La intro se puede saltar y nunca dura más de 2,4 s. |
| 20 | SEO técnico | ✅ | Título y descripción únicos (probado), canonical, Open Graph, Twitter Card, sitemap, robots.txt y JSON-LD (Store, FAQPage, Product, ItemList, BreadcrumbList). Lighthouse SEO: 100. |
| 21 | Rendimiento | ✅ | Unos 22 KB de JS, fuentes propias con `swap`, `srcset` y `lazy`, caché inmutable. Lighthouse 96 a 98 con animaciones: LCP 1,9 a 2,3 s, CLS 0, TBT 0 ms. Partículas en pausa fuera de pantalla; scroll en un solo requestAnimationFrame. |
| 22 | Imágenes | ✅ | WebP en 2 tamaños, `width` y `height` en todas (probado), `alt` descriptivo o vacío si es decorativa. |
| 23 | JavaScript moderno | ✅ | Módulos ES y TypeScript estricto (0 errores), sin dependencias en el navegador, cada módulo protegido con try/catch. |
| 24 | Seguridad | ✅ | Sin `innerHTML` con datos, CSP estricta con hash (comprobada en las pruebas), HSTS, nosniff, `frame-ancestors 'none'`, honeypot, `rel="noopener noreferrer"`, saneo de `localStorage`, sin secretos. |
| 25 | Privacidad y cookies | ✅ | No hay cookies no esenciales, así que no hace falta banner (art. 22.2 LSSI), explicado en `/legal/cookies`. Política de privacidad RGPD. |
| 26 | Internacionalización | 🟡 | Cadenas de la interfaz en `src/i18n/es.ts` con marcadores `{n}` (sin concatenar). Falta: los textos de contenido de las páginas siguen en las plantillas. Para un segundo idioma, usar el i18n de Astro (`/en/…`). |
| 27 | Pruebas y checklist | ✅ | `npm run verify`: tipos, build, validación HTML y `tests/smoke.mjs`: consola, h1, títulos, alt, dimensiones, desbordamiento, enlaces, axe y flujos de asistente, filtros, compra y contacto. Integración continua en GitHub Actions. |
| 28 | Documentación | ✅ | `README.md` y `docs/`. |
| 29 | Despliegue | ✅ | `docs/DESPLIEGUE.md` y `netlify.toml`. Variables: `PUBLIC_SITE_URL` y `STRIPE_SECRET_KEY`. |
| 30 | Entrega final | ✅ | Repositorio, árbol en el README y este documento. |

## Pendiente del negocio (no técnico)

| Tema | Estado |
|---|---|
| Datos reales de empresa, contacto y opiniones verificadas | ⏳ |
| Pasarela de pago real | ✅ programada (Stripe Checkout, con 7 pruebas). Falta tu clave `STRIPE_SECRET_KEY` y poner `demoCheckout: false` |
| Revisión legal de textos y de la venta de CBD | ⏳ |
| Fotos reales de producto (ahora son renders 3D) | ⏳ opcional |

## Alcance

**Incluido:** portada, catálogo con filtros, búsqueda y orden; 8 páginas de categoría; 39 fichas de producto; carrito persistente con código de descuento y venta cruzada; asistente de compra; compra en 3 pasos (demo); contacto; newsletter; 4 páginas legales; 404; modo claro y oscuro; aviso de mayoría de edad.

**Fuera de alcance:** cuentas de usuario, gestión de stock e inventario, panel de administración, reseñas verificadas, multidioma y analítica. Si se añadiera analítica, haría falta el banner de consentimiento.
