---
name: "flujo-motion"
description: "Flujo para animación y motion: scroll cinematográfico, intros, microinteracciones, transiciones, 3D o vídeo con Remotion, a 60 fps y con reduced-motion diseñado."
---

# Flujo de motion

Se usa cuando la animación es parte importante del encargo: una landing con scroll cinematográfico, una intro, transiciones entre pantallas, microinteracciones, una escena 3D o un vídeo con Remotion. Si es una web o app normal con alguna animación, manda flujo-web-completo y esta skill solo aporta las reglas de motion. Todo se hace sin pedir permiso y las decisiones se cuentan al final.

## Estándar mínimo de motion (siempre, aunque sea algo muy sencillo)
El usuario quiere que cinemáticas, animaciones, transiciones y efectos salgan pulidos y listos para usar en TODO lo que se cree, incluso en una página o app mínima. Nunca se entrega movimiento "de prueba", a medias o por defecto. Kit base que lleva cualquier entregable visual:
- **Tokens de movimiento** en variables CSS: `--ease-out: cubic-bezier(0.23,1,0.32,1)`, `--ease-in-out: cubic-bezier(0.77,0,0.175,1)`, `--ease-drawer: cubic-bezier(0.32,0.72,0,1)`, duraciones `--dur-press: 140ms`, `--dur-ui: 200ms`, `--dur-panel: 320ms`, `--dur-scene: 600ms`.
- **Entrada de la página orquestada** con coreografia-motion: un protagonista, apoyo con desfases irregulares, decoración solo con fundido, total ≤ 700 ms y nunca bloqueando la interacción.
- **Feedback de pulsación** en todo lo pulsable (`scale(0.97)` en `:active`), hover solo en `(hover: hover) and (pointer: fine)`.
- **Overlays con origen correcto**: popovers y menús desde su disparador, modales centrados, sheets desde abajo con la curva drawer; salida más rápida que la entrada.
- **Cambios de vista o estado con transición**: View Transitions (o crossfade con 8 px de desplazamiento y blur ligero) entre pantallas; listas que se reordenan sin saltos; estados de carga con skeleton y aparición suave del contenido.
- **Revelado al hacer scroll** con IntersectionObserver o `animation-timeline: view()` (dentro de `@supports`), una sola vez y sutil.
- **reduced-motion diseñado**: fundidos cortos, sin desplazamientos, todo visible.
- **60 fps**: solo transform y opacity, will-change temporal, nada de eventos de scroll.

Lo frecuente o de teclado no se "decora": su pulido es la respuesta inmediata y nítida (feedback instantáneo, sin animación de apertura), no más efectos. Antes de entregar, siempre: revision-animaciones con veredicto Aprobar y capturas en varios momentos de la animación con ojos-visuales.

## Doctrina (no negociable)
- Primero la jerarquía estática: la página tiene que funcionar quieta. Solo se anima para aclarar un estado o contar algo.
- La versión con reduced-motion se diseña, no se apaga: fundidos cortos, sin desplazamientos ni parallax, y todo el contenido visible.
- 60 fps en móvil o no está terminado.
- Una sola idea de movimiento por sección. Nada de mezclar efectos sin control.

## 1. Brief
Qué historia cuenta la escena, en una frase. Si no se puede decir en una frase, la animación todavía no tiene sentido.

## 2. Dirección
- Escribir un guion de beats antes del código: momento, qué se mueve, duración y qué elemento lidera.
- Definir el **elemento firma** del movimiento: el gesto que se repite y hace reconocible la pieza.
- Usar frontend-design y ui-ux-pro-max (incluye presets de GSAP) para la dirección visual.
- Antes de animar nada, pasar el marco de decisión de **emil-design-eng**: ¿cuántas veces se verá?, ¿para qué sirve?, ¿qué easing y qué duración? Lo frecuente o de teclado no se anima.
- Si se mueven varios elementos a la vez, usar **coreografia-motion**: reparto de papeles (protagonista, apoyo, decoración, estático), relación entre cada par y la tabla de línea de tiempo antes del código.

## 3. Elegir la capa
| Caso | Herramienta |
|---|---|
| HTML suelto o landing | CSS para lo simple; GSAP + ScrollTrigger + Lenis para el scroll cinematográfico |
| React o Next.js | Motion (antes Framer Motion): layoutId, AnimatePresence, useScroll; transiciones entre rutas o estados con **view-transitions-react** |
| Arrastres, swipes, sheets o drawers | **gestos** (seguir 1:1 con el dedo, soltar con spring según la velocidad; Vaul para bottom sheets) |
| 3D | Three.js o React Three Fiber, con fallback estático |
| Vídeo | Remotion: cargar video-making y remotion-best-practices; video si es producción con IA |

## 4. Construir con reglas anti-genéricas
- Nunca usar `power3.out` + 0,6 s + stagger de 0,08 s como valor por defecto para todo.
- La duración depende de la distancia y del peso: 150–250 ms para un elemento pequeño y 400–700 ms para cambios de pantalla.
- Un elemento lidera y el resto reacciona con desfases irregulares.
- Casi todo el texto entra con un corte o un fundido. La máquina de escribir se reserva para lo que de verdad se teclea.
- Las pausas no se congelan: la cámara deriva un poco y el plano nunca se queda muerto.
- Solo se animan `transform` y `opacity`. `will-change` solo mientras dura la animación. Nada de animar width, height, top o left.
- Scroll: nada de scroll-jacking que impida leer o volver atrás. El contenido es legible aunque el JS falle.
- Pulir las microinteracciones con make-interfaces-feel-better y emil-design-eng (curvas `cubic-bezier(0.23, 1, 0.32, 1)` para entradas, `cubic-bezier(0.77, 0, 0.175, 1)` para movimiento en pantalla, transitions o springs en lo interrumpible, salida más rápida que la entrada).

## 5. Verificar
- ojos-visuales: capturas a 390 (iPhone), 768 y 1440 px en varios momentos de la animación (inicio, mitad y final del scroll), y también con reduced-motion activado.
- Revisar la consola y que no haya saltos de layout (CLS) al cargar.

## 6. Auditar
- **revision-animaciones**: tabla Antes/Después/Por qué y veredicto Bloquear o Aprobar. No se entrega con «Bloquear».
- **ui-pulido** (módulo de rendimiento de animación): nada de animar desde eventos de scroll, blur ≤ 8 px, will-change temporal, mediciones agrupadas (FLIP).
- 60 fps: solo transform y opacity, sin lecturas de layout dentro de los bucles y con requestAnimationFrame o el ticker de GSAP.
- Accesibilidad: la ruta con `prefers-reduced-motion` diseñada y probada, nada que parpadee más de 3 veces por segundo, foco visible y contraste AA durante y después de la animación.
- Peso: librerías cargadas solo donde hacen falta y modelos 3D comprimidos.

## 7. Revisión final
¿Los primeros 3 segundos pararian tu propio pulgar en el scroll? Si no, se refuerza el primer beat antes de entregar.

## Recetario probado (CINEMA//MOTION LAB)
Antes de inventar una técnica, se parte de estas recetas, que ya están probadas en navegador real:
- Profundidad: parallax con lerp y IntersectionObserver; scroll-driven animations nativas (`animation-timeline: view()` dentro de `@supports`); dolly zoom cambiando `perspective` con el sujeto fijo.
- Foco: desenfoque del resto con `:has()` y también con `:focus-visible`.
- Física: easings con nombre (seda, resorte, piedra, látigo y gelatina con `linear()`), anticipación con WAAPI y arrastre con inercia, fricción por milisegundo y teclado.
- Montaje: match cut con FLIP, whip pan con blur solo a mitad del barrido, wipe e iris con `clip-path`, View Transitions pasando el `view-transition-name` de un elemento a otro y morph SVG con las mismas instrucciones en las dos rutas.
- Materiales: vidrio con `backdrop-filter`, grano SVG con `steps()`, texto líquido con `feDisplacementMap` y partículas en canvas retina que se pausan fuera de pantalla.
- Coreografía: timeline maestra de GSAP con desfases distintos, onboarding con «Saltar» en el que la última escena se queda, y cursor con transform e inercia solo en `(pointer: fine)`.
- 3D: render solo cuando se ve, `setPixelRatio(min(2, dpr))`, ResizeObserver, aviso si no hay WebGL y `setAnimationLoop(time => …)` en lugar de Clock.

## Reglas de los screenings (CINEMA//MOTION LAB)
- **S1 · La línea de tiempo se puede arrastrar.** Toda pieza con guion se monta sobre animaciones pausables (WAAPI o timeline de GSAP) y se mueve con `currentTime`/`progress`; nada de `setTimeout` para coreografiar. El storyboard y las capturas se sacan congelándola.
- **S1 · Velocidad sin desenfoque.** Barridos y golpes rápidos se venden con estelas, copias desplazadas o escala; `filter: blur` solo sobre elementos pequeños, ≤ 6 px y nunca a pantalla completa.
- **S1 · El temblor es una reacción, no un estilo.** Sacudida de cámara ≤ 4 px y ≤ 300 ms, solo como respuesta a un impacto visible; nada de cámara al hombro continua en móvil, y en movimiento reducido desaparece.

## Laboratorios de creatividad forzada
Si el resultado sale genérico, se aplica una restricción: sin opacidad (solo máscaras, escala y color), tres elementos como máximo, una sola curva para todo, remezclar dos referencias opuestas, quitar cosas hasta llegar a 60 fps, que todo tenga causa (scroll, clic, foco o estado), y que funcione en silencio.

## Rúbrica
Intención narrativa 20 %, ritmo 15 %, física y continuidad 15 %, creatividad 15 %, transiciones 10 %, rendimiento 10 %, accesibilidad 10 %, documentación 5 %. Si algún criterio queda flojo, se corrige antes de entregar.

## Entrega
La pieza funcionando, con una línea sobre la idea de movimiento y las decisiones tomadas. Si es para Claude Code, el kit tiene CLAUDE-motion.md e install-motion.sh con las skills verificadas.