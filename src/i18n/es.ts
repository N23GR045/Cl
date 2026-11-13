// Cadenas de la interfaz. Para traducir la web, crea en.ts con las mismas claves.
// Usa marcadores {n}, {price}… en lugar de concatenar texto.
export const es = {
  skip: "Saltar al contenido",
  nav: { home: "Inicio", products: "Productos", assistant: "Asistente", setup: "Montaje", faq: "Preguntas", contact: "Contacto", menu: "Menú", close: "Cerrar menú" },
  theme: { toDark: "Cambiar a modo oscuro", toLight: "Cambiar a modo claro" },
  cart: {
    open: "Abrir carrito ({n} productos)", title: "Tu carrito", close: "Cerrar carrito", empty: "Tu carrito está vacío.", emptyHint: "Empieza por la luz: es lo que más se nota.",
    add: "Añadir al carrito", added: "Añadido: {name}", remove: "Eliminar", less: "Quitar uno", more: "Añadir uno", total: "Total", checkout: "Finalizar compra",
    freeShip: "Envío gratis a partir de {price}", missing: "Te faltan {price} para el envío gratis", gotFree: "Tienes envío gratis",
    complete: "Completa tu cultivo", promoPh: "Código de descuento", promoApply: "Aplicar", promoOk: "{code} aplicado · −{price}", promoBad: "El código «{code}» no es válido.", promoEmpty: "Escribe un código.", promoRemove: "Quitar",
    dispatchToday: "Pide en {h} h {m} min y sale hoy", dispatchNext: "Pide ahora y sale el próximo día laborable", saved: "Tu carrito te espera: {n} productos", count: "{n} productos · {price}",
  },
  checkout: {
    steps: ["Datos", "Envío", "Pago"], back: "Atrás", backCart: "Volver al carrito", next: "Continuar", pay: "Pagar {price}", guest: "Compras como invitado: no hace falta crear cuenta.",
    demo: "Tienda de demostración: no se cobra nada ni se guardan tus datos.", done: "Pedido confirmado", doneText: "Pedido {num} por {price}. {extra}", keep: "Seguir comprando",
    pickupText: "Te avisamos cuando esté listo para recoger.", homeText: "Lo recibirás en 24/48 h en un paquete discreto.",
  },
  catalog: { search: "Buscar producto", searchPh: "Buscar: LED, coco, pH…", sort: "Ordenar", sortRel: "Destacados", sortAsc: "Precio: menor a mayor", sortDesc: "Precio: mayor a menor", all: "Todos", count: "{n} productos", none: "No hay productos que coincidan con tu búsqueda.", reset: "Ver todos los productos" },
  form: { required: "Este campo es obligatorio.", email: "Escribe un email válido, por ejemplo nombre@correo.com.", phone: "El teléfono debe tener al menos 9 cifras.", zip: "El código postal tiene 5 cifras.", min: "Escribe al menos {n} caracteres.", consent: "Necesitamos tu consentimiento para responderte.", sending: "Enviando…", sent: "Mensaje enviado. Te respondemos en menos de 24 h laborables.", fail: "No se ha podido enviar. Escríbenos a {email} o llama al {phone}.", fix: "Revisa los campos marcados." },
  age: { title: "¿Tienes 18 años o más?", text: "Esta tienda vende productos solo para mayores de edad.", yes: "Sí, tengo 18 o más", no: "No", noText: "Lo sentimos: esta tienda es solo para mayores de 18 años." },
  toastClose: "Cerrar aviso",
};
export type Strings = typeof es;
export const t = es;
/** Rellena marcadores: fmt("Hola {name}", { name: "Ana" }) */
export const fmt = (s: string, vars: Record<string, string | number> = {}) => s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
