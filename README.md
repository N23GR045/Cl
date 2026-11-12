# Raíz Verde · Grow Shop

Web de un grow shop en un solo archivo: abre `index.html` en el navegador.

- Intro animada, aviso +18, planta que crece con el scroll, catálogo con filtros, buscador y orden por precio.
- Ficha rápida de producto, carrito y compra en 3 pasos (datos, envío y pago; es una demo y no cobra).
- Sala de cultivo y tienda en 3D, preguntas frecuentes y newsletter.
- Las fotos de producto son renders 3D generados con three.js (`tools/studio.html`). Están incrustadas en `index.html` y también sueltas en `img/`.
- Para editar productos, modifica `PRODUCTS` dentro del `<script>` de `index.html`.

## Volver a generar las fotos

```
cd tools && npm i three@0.160.0 playwright
python3 -m http.server 8765 &
mkdir -p out && node render.js led-240 led-120 armario-80 armario-120 sustrato-50 coco-50 nutri-gb nutri-bio extractor termo dwc phmeter kit sala tienda
```
