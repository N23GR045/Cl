// Punto de entrada: cada módulo se inicializa solo si su HTML existe en la página.
import { initTheme, initMenu, initAgeGate, initReveal } from "./ui";
import { initCart } from "./cart";
import { initCheckout } from "./checkout";
import { initCatalog } from "./catalog";
import { initQuiz } from "./quiz";
import { initProductPage } from "./pdp";
import { initForms } from "./forms";
import { clear } from "./cart";

const safe = (name: string, fn: () => void) => {
  try { fn(); } catch (err) { console.warn(`[raiz-verde] ${name} no se pudo iniciar`, err); }
};

safe("tema", initTheme);
safe("menú", initMenu);
safe("carrito", initCart);
safe("compra", initCheckout);
safe("catálogo", initCatalog);
safe("asistente", initQuiz);
safe("ficha", initProductPage);
safe("formularios", initForms);
safe("revelado", initReveal);
safe("edad", initAgeGate);
// Vuelta desde la pasarela con el pago hecho: vacía el carrito.
safe("pedido", () => { if (document.querySelector("[data-order-done]") && new URLSearchParams(location.search).has("sesion")) clear(); });
