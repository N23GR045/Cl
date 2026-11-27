---
name: "flujo-web-completo"
description: "Flujo en 6 pasos para crear o rediseñar webs y apps HTML: planificar, fijar la estética, construir, verificar con capturas, auditar y revisar antes de entregar."
---

# Flujo web completo

Se usa siempre que se cree o rediseñe una web, una landing o una app HTML. Hay que seguir los pasos en orden y no dar nada por terminado sin hacer los pasos 4 a 6.

**Todo se hace sin pedir permiso.** Cuando haya dudas, se toma la decisión más razonable y se explica en una línea al entregar. Solo se para antes de algo irreversible: borrar datos o archivos, hacer force-push o publicar en producción.

## Skills que usa
- **diseno-interfaz** (pack principal): ui-ux-pro-max, frontend-design, apple-hig-designer, make-interfaces-feel-better, liquid-glass-design y ojos-visuales. Se leen sus GUIA.md según el paso.
- **web-design-guidelines** y **ui-pulido** para auditar (accesibilidad, metadatos y rendimiento de animación).
- **emil-design-eng** para pulir interacciones y animaciones de UI; **temas-visuales** si hace falta una paleta rápida sin sistema propio.
- **React/Next.js**: **react-rendimiento** al construir; **artefactos-react** si es un artefacto complejo con estado, rutas o shadcn/ui; **view-transitions-react** para transiciones entre rutas o estados.
- **mejorar-ui** cuando se pide mejorar una interfaz que ya existe sin cambiar su identidad (primero diagnostica y planifica, luego se construye con este flujo).
- **copywriting** para los textos. Si la página tiene que vender, **marketing-conductual**.
- **seo-audit** y **ai-seo** si la web es pública, y **aso** si la app va a tiendas.

## 1. Brief y plan
- Fijar en 3 líneas el propósito, la audiencia y la plataforma (web, iPhone o Android).
- Si hay archivos existentes, leer primero los que se van a tocar. Comprobar si el proyecto tiene un CLAUDE.md o una dirección de diseño fijada: si la tiene, se respeta y no se reinventa.
- Si toca más de 2 archivos o es una app nueva, escribir un plan breve con pantallas, componentes y datos, y ejecutarlo directamente.
- **Auditar el flujo antes de construir** con psicología UX:
  - Hick: una sola acción principal por pantalla y pocas opciones visibles.
  - Fitts: las acciones principales grandes y en la zona del pulgar (abajo en móvil).
  - Carga cognitiva: divulgación progresiva y no pedir lo que se puede deducir.
  - Gestalt y defaults: agrupar por proximidad, y que la opción por defecto sea la mejor para el usuario.
- **Sitio o landing**: si el tráfico llega de campañas (vídeos, anuncios, bio), hacer las dos piezas: el sitio de una página con anclas para quien explora y una landing sin menú por variante de campaña, con el mismo titular que la pieza de origen y una sola acción. Cada variante sale con su propio enlace medible (por ejemplo, una invitación de Discord o un UTM distinto) para que el test se lea fuera de la web.
- Marcar como **[PLACEHOLDER]** todo dato que no se tenga (enlaces, edad mínima, capturas reales, versiones). Un placeholder sin rellenar bloquea la publicación y se lista al entregar.

## 2. Sistema de diseño y estética
- Antes de nada, aplicar **gusto-web**: decidir el tipo (lugar, producto, servicio, software, gaming, tech) y su plan de página, una sección por pantalla, bordes iguales y efectos solo si el tema es técnico (un servidor de rol cuenta como gaming). La marca del usuario manda sobre sus reglas. Partir de **kit-base-web**; si hay 3D, **threejs-pro**; textos de interfaz con **ux-copy**.
- Cargar diseno-interfaz y seguir su orden: ui-ux-pro-max para el sistema (estilo, paleta, fuentes), luego frontend-design para la personalidad. Si es para iPhone, añadir apple-hig-designer. Si pide efecto cristal, liquid-glass-design (en HTML se imita con `backdrop-filter`).
- Elegir UN tono extremo y ejecutarlo con precisión: minimal radical, maximalista, retrofuturista, orgánico, lujo, juguete, editorial, brutalista, art déco, pastel o industrial.
- Antes de escribir CSS, dejar por escrito:
  - Los tokens en variables CSS: un color dominante y un acento fuerte, tipografía (nada de Inter, Roboto, Arial ni fuentes del sistema; tampoco repetir siempre las mismas elecciones «seguras»), espaciado, radios, sombras y movimiento, en claro y oscuro.
  - Un **elemento firma** propio del producto.
  - Un fondo con atmósfera (degradados en capas, ruido o patrones) en lugar de un color plano.
  - Una sola animación de carga orquestada con entradas escalonadas.
- Evitar la estética genérica de IA: degradados morados sobre blanco, rejillas de tarjetas idénticas o el esquema hero + 3 features + CTA.

## 3. Construir
- Textos reales y en español de España, escritos con copywriting. Nada de lorem ipsum.
- HTML semántico y ARIA solo si el HTML nativo no llega. Áreas táctiles de 44 px como mínimo.
- WCAG 2.2 AA: teclado completo, foco visible y que nunca quede tapado, contraste AA en todos los temas, texto escalable al 200 % y `prefers-reduced-motion`.
- **Base accesible de serie** (sale de la auditoría del entrenamiento, días 13 y 14; con ella la QA dio 0 avisos a la primera):
  ```css
  html{scroll-padding-top:<alto de cabecera + 16px>;scroll-padding-bottom:<alto de barra fija + 16px>}
  :focus-visible{outline:3px solid <acento claro>;outline-offset:3px}
  .btn:focus-visible{outline-color:#fff}
  nav a, footer a, .enlace-suelto{display:inline-flex;align-items:center;min-height:44px}
  @media (min-width:1600px){:focus-visible{outline-width:4px}}
  ```
  Más: enlace «Saltar al contenido» al principio, `id` + `tabindex="-1"` en el bloque principal, barra fija como `<aside aria-label="Acceso rápido">`, FAQ con `<details>` nativo y enlaces sueltos de texto también a 44 px.
- **Héroe con imagen o render 3D**: componer con espacio negativo donde va el texto, enmascarar hacia el texto con `mask-image` y comprobar en cada ancho que el arte no pisa la entradilla (en escritorio y en el navegador de la tele a 960 px es donde suele fallar). Imagen en WebP/AVIF, de menos de 50 KB si es de fondo.
- Si hay TypeScript, en modo estricto y sin `any`.
- Nunca silenciar errores. Contemplar los estados de carga, vacío y error.
- Mobile-first: el usuario usa iPhone y todo tiene que caber en su pantalla, con las safe areas respetadas (`env(safe-area-inset-*)`).
- Pulir con make-interfaces-feel-better y emil-design-eng: botones con `scale(0.97)` en `:active`, popovers desde su disparador, ease-out con curva propia, UI por debajo de 300 ms y nada de animación en acciones de teclado o muy frecuentes.
- Aplicar ui-pulido mientras se construye (`h-dvh`, `text-balance`/`text-pretty`, `tabular-nums`, AlertDialog en acciones destructivas, escala fija de z-index). Sus reglas de diseño (sin degradados, sin glow) solo mandan si no hay una dirección estética fijada en el paso 2; si la hay, manda la dirección.
- Si hay drawers, sheets o swipes: gestos (y Vaul para bottom sheets). Si varios elementos se animan a la vez: coreografia-motion.
- En React: react-rendimiento (sin waterfalls, sin barrel imports, sin componentes dentro de componentes, sin props booleanas para variantes).

- **Motion siempre pulido**: aplicar el "Estándar mínimo de motion" de flujo-motion en todo lo que se construya, aunque sea muy sencillo (tokens de movimiento, entrada orquestada, feedback de pulsación, overlays con origen correcto, transiciones entre vistas, revelado al scroll y reduced-motion diseñado). Nada de animaciones por defecto o a medias.

## 4. Verificar visualmente
- Usar ojos-visuales: capturas a 320, 360, 390 (iPhone), 412 (Android), 768, 1440 y 1920 px, en claro y oscuro si existen los dos. Si el proyecto se ve en Fire TV o Android TV, añadir 960×540 (ancho CSS del navegador de la tele) con el foco del mando visible (diseno-tv).
- Si las fuentes de Google no cargan en el entorno, instalarlas con npm (`@fontsource/<familia>`) e inyectarlas solo para las capturas; nunca juzgar el diseño con la fuente de reserva.
- Mirar las capturas de verdad y leer la consola. Corregir desbordes, solapes, textos cortados, scroll horizontal y contraste pobre, y repetir hasta que todo esté limpio.

## 5. Auditar
- **Medir, no solo mirar** (Playwright): axe-core con las etiquetas wcag2a, wcag2aa, wcag21aa, wcag22aa y best-practice en cada ancho; recorrido de foco con Tab y Mayús+Tab comprobando que ningún elemento queda bajo la cabecera o la barra fija (axe no ve este fallo); lista de enlaces, botones y `summary` de menos de 24 px; y `scrollWidth` a 320 px. Se entrega la tabla de resultados.
- web-design-guidelines: accesibilidad, foco, formularios, animación, tipografía, imágenes, rendimiento y modo oscuro.
- ui-pulido: módulos de accesibilidad (nombres, teclado, foco, formularios), metadatos (title, canonical, Open Graph, JSON-LD sin datos inventados) y rendimiento de animación.
- Si hay animaciones: revision-animaciones, con su tabla Antes/Después/Por qué y veredicto. Si sale «Bloquear», se corrige antes de entregar.
- Rendimiento: imágenes con dimensiones fijas y AVIF/WebP, fuentes con `font-display: swap` y nada de JS innecesario. Objetivo en móvil: LCP < 2,5 s, CLS < 0,1, INP < 200 ms.
- Robustez: textos largos, datos vacíos o raros y doble clic en botones.
- Si es una web pública: repaso rápido de seo-audit (title, meta description, encabezados, Open Graph) y de ai-seo (contenido citable, datos estructurados).

## 6. Revisión final
- [ ] Cabe y se usa bien en iPhone (390 px), sin scroll horizontal.
- [ ] Cada pantalla tiene una sola acción principal, en la zona del pulgar.
- [ ] Los tokens se usan en todo el CSS, sin colores sueltos.
- [ ] El elemento firma está presente y la tipografía no es genérica.
- [ ] Teclado completo y foco visible.
- [ ] Contraste AA en todos los temas y texto escalable al 200 %.
- [ ] Existen los estados de carga, vacío y error.
- [ ] No hay errores en consola.
- [ ] Se respeta reduced-motion.
- [ ] El estándar mínimo de motion está completo y revision-animaciones da Aprobar.
- [ ] Ninguna animación en acciones de teclado o muy frecuentes, nada desde `scale(0)` ni con ease-in, y la UI por debajo de 300 ms.
- [ ] Los textos están en español de España y no suenan a IA.
- [ ] Si es pública, tiene title, description y Open Graph.
- [ ] axe 0 avisos y 0 focos tapados en móvil, 320 px y escritorio (y tele si aplica).
- [ ] Si hay campaña: landing por variante con su enlace medible, sin menú y con el titular de la pieza de origen.
- [ ] Ningún dato inventado: lo que falta va como [PLACEHOLDER] y se lista al entregar.
- [ ] No se despliega en un dominio público sin un sí explícito del usuario.

Al entregar, resumir en 1 o 2 frases qué se ha hecho y las decisiones tomadas por cuenta propia. No hay que repetir los pasos seguidos.