import { $, $$, el, store, toast, trapFocus, formatPrice } from "./dom";
import { t, fmt } from "../i18n/es";
import { flyToCart } from "./effects";

export interface ClientProduct { id: string; name: string; price: number; img: string; cat: string; combo: string[] }
interface Catalog {
  products: ClientProduct[];
  shipping: { freeFrom: number; cost: number; cutoffHour: number };
  promo: { code: string; percent: number };
  phone: string; email: string; demoCheckout: boolean;
}

const raw = document.getElementById("catalog-data")?.textContent ?? "{}";
export const catalog: Catalog = JSON.parse(raw);
export const findP = (id: string) => catalog.products.find((p) => p.id === id);

type Cart = Record<string, number>;
let cart: Cart = sanitize(store.get<Cart>("rv-cart", {}));
let promo = store.get<boolean>("rv-promo", false);
const listeners = new Set<() => void>();

/** Ignora entradas manipuladas o productos que ya no existen. */
function sanitize(c: Cart): Cart {
  const out: Cart = {};
  for (const [id, n] of Object.entries(c ?? {})) if (findP(id) && Number.isInteger(n) && n > 0 && n < 100) out[id] = n;
  return out;
}

export const getCart = () => ({ ...cart });
export const count = () => Object.values(cart).reduce((a, b) => a + b, 0);
export const subtotal = () => Object.entries(cart).reduce((s, [id, n]) => s + (findP(id)?.price ?? 0) * n, 0);
export const discount = (base = subtotal()) => (promo ? Math.round(base * catalog.promo.percent) / 100 : 0);
export const hasPromo = () => promo;
export const promoCode = () => (promo ? catalog.promo.code : "");
export const onChange = (fn: () => void) => listeners.add(fn);

function save() { store.set("rv-cart", cart); listeners.forEach((fn) => fn()); render(); }
export function add(id: string, qty = 1, source?: Element | null) {
  const p = findP(id);
  if (!p) return;
  cart[id] = Math.min(99, (cart[id] ?? 0) + qty);
  save();
  toast(fmt(t.cart.added, { name: qty > 1 ? `${qty} × ${p.name}` : p.name }));
  bump(source);
}
export function setQty(id: string, qty: number) { if (qty <= 0) delete cart[id]; else cart[id] = Math.min(99, qty); save(); }
export function clear() { cart = {}; promo = false; store.set("rv-promo", false); save(); }

export function dispatchMessage(now = new Date()) {
  const day = now.getDay(), mins = now.getHours() * 60 + now.getMinutes(), cutoff = catalog.shipping.cutoffHour * 60;
  if (day >= 1 && day <= 5 && mins < cutoff) { const left = cutoff - mins; return fmt(t.cart.dispatchToday, { h: Math.floor(left / 60), m: left % 60 }); }
  return t.cart.dispatchNext;
}

function bump(source?: Element | null) { flyToCart(source); }

/* ---------- Render ---------- */
function lineItem(id: string, n: number) {
  const p = findP(id)!;
  const minus = el("button", { type: "button", textContent: "−", ariaLabel: `${t.cart.less}: ${p.name}`, dataset: { qty: id, delta: "-1" } });
  const plus = el("button", { type: "button", textContent: "+", ariaLabel: `${t.cart.more}: ${p.name}`, dataset: { qty: id, delta: "1" } });
  return el("li", { className: "cart-line" },
    el("img", { src: `/img/${p.img}-360.webp`, alt: "", width: 56, height: 56, loading: "lazy" }),
    el("div", {}, el("h3", { textContent: p.name }), el("div", { className: "qty" }, minus, el("span", { textContent: String(n), ariaLabel: `Cantidad: ${n}` }), plus)),
    el("div", { className: "cart-line__end" },
      el("strong", { className: "tabular", textContent: formatPrice(p.price * n) }),
      el("button", { type: "button", className: "link-btn", textContent: t.cart.remove, ariaLabel: `${t.cart.remove}: ${p.name}`, dataset: { remove: id } })),
  );
}

function suggestions() {
  const ids = Object.keys(cart);
  const out: string[] = [];
  ids.forEach((id) => findP(id)?.combo.forEach((c) => { if (!ids.includes(c) && !out.includes(c) && findP(c)) out.push(c); }));
  return out.slice(0, 2);
}

export function render() {
  const n = count(), sub = subtotal(), total = sub - discount(sub);
  $$("[data-cart-count]").forEach((b) => (b.textContent = String(n)));
  $$<HTMLButtonElement>("button[data-cart-open][aria-controls]").forEach((b) => b.setAttribute("aria-label", fmt(t.cart.open, { n })));

  const list = $("[data-cart-list]"), empty = $("[data-cart-empty]");
  if (list) list.replaceChildren(...Object.entries(cart).map(([id, q]) => lineItem(id, q)));
  if (empty) empty.hidden = n > 0;
  const foot = $("[data-cart-foot]");
  if (foot) foot.hidden = n === 0 && !$("[data-view='checkout']:not([hidden])");

  const sug = suggestions(), up = $("[data-upsell]"), upList = $("[data-upsell-list]");
  if (up && upList) {
    up.hidden = !sug.length;
    upList.replaceChildren(...sug.map((id) => {
      const p = findP(id)!;
      return el("li", { className: "upsell__item" },
        el("img", { src: `/img/${p.img}-360.webp`, alt: "", width: 40, height: 40, loading: "lazy" }),
        el("span", {}, p.name, el("br"), el("strong", { textContent: formatPrice(p.price) })),
        el("button", { type: "button", className: "btn btn--sm", textContent: "+ Añadir", ariaLabel: `${t.cart.add}: ${p.name}`, dataset: { add: id } }));
    }));
  }

  const ok = $("[data-promo-ok]"), form = $("[data-promo-form]");
  if (ok && form) {
    ok.hidden = !promo; form.hidden = promo;
    const txt = $("[data-promo-ok-text]");
    if (txt) txt.textContent = fmt(t.cart.promoOk, { code: catalog.promo.code, price: formatPrice(discount(sub)) });
  }
  const missing = catalog.shipping.freeFrom - sub;
  const shipText = $("[data-ship-text]");
  if (shipText) shipText.textContent = sub === 0 ? fmt(t.cart.freeShip, { price: formatPrice(catalog.shipping.freeFrom) }) : missing > 0 ? fmt(t.cart.missing, { price: formatPrice(missing) }) : t.cart.gotFree;
  $("[data-ship-bar]")?.style.setProperty("--p", String(Math.min(1, sub / catalog.shipping.freeFrom)));
  const totalEl = $("[data-cart-total]");
  if (totalEl) totalEl.textContent = formatPrice(total);
  const disp = $("[data-dispatch]");
  if (disp) disp.textContent = n ? dispatchMessage() : "";
  const chk = $<HTMLButtonElement>("[data-checkout]");
  if (chk) chk.disabled = n === 0;
  syncMobileBar();
}

/* ---------- Barra móvil ---------- */
function syncMobileBar() {
  const bar = $("[data-mbar]");
  if (!bar) return;
  const n = count();
  const show = n > 0 && scrollY > 400 && !isOpen();
  bar.hidden = !show;
  document.body.classList.toggle("has-mbar", show && innerWidth < 820);
  const txt = $("[data-mbar-text]");
  if (txt) txt.textContent = fmt(t.cart.count, { n, price: formatPrice(subtotal() - discount()) });
}

/* ---------- Abrir / cerrar ---------- */
const drawer = () => $("#cart");
const isOpen = () => !!drawer()?.classList.contains("is-open");
let release: (() => void) | null = null;
let opener: HTMLElement | null = null;

export function openCart(trigger?: HTMLElement | null) {
  const d = drawer(), ov = $("[data-cart-overlay]");
  if (!d || !ov) return;
  opener = trigger ?? (document.activeElement as HTMLElement);
  d.classList.add("is-open"); ov.hidden = false; document.body.style.overflow = "hidden";
  $$("[data-cart-open][aria-controls]").forEach((b) => b.setAttribute("aria-expanded", "true"));
  release = trapFocus(d);
  d.focus();
  syncMobileBar();
}
export function closeCart() {
  const d = drawer(), ov = $("[data-cart-overlay]");
  if (!d || !ov || !isOpen()) return;
  d.classList.remove("is-open"); ov.hidden = true; document.body.style.overflow = "";
  $$("[data-cart-open][aria-controls]").forEach((b) => b.setAttribute("aria-expanded", "false"));
  release?.(); release = null;
  document.dispatchEvent(new CustomEvent("cart:closed"));
  opener?.focus({ preventScroll: true });
  syncMobileBar();
}

export function initCart() {
  document.addEventListener("click", (e) => {
    const target = e.target as Element;
    const addBtn = target.closest<HTMLElement>("[data-add]");
    if (addBtn) { add(addBtn.dataset.add!, 1, addBtn); return; }
    const q = target.closest<HTMLElement>("[data-qty]");
    if (q) { const id = q.dataset.qty!; setQty(id, (cart[id] ?? 0) + Number(q.dataset.delta)); $<HTMLElement>(`[data-qty="${CSS.escape(id)}"][data-delta="${q.dataset.delta}"]`)?.focus(); return; }
    const rm = target.closest<HTMLElement>("[data-remove]");
    if (rm) { setQty(rm.dataset.remove!, 0); drawer()?.focus(); return; }
    const op = target.closest<HTMLElement>("[data-cart-open]");
    if (op) { openCart(op); return; }
    if (target.closest("[data-cart-close], [data-cart-overlay]")) closeCart();
    if (target.closest("[data-promo-remove]")) { promo = false; store.set("rv-promo", false); render(); }
  });
  addEventListener("keydown", (e) => { if (e.key === "Escape" && isOpen()) closeCart(); });

  const form = $<HTMLFormElement>("[data-promo-form]");
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = $<HTMLInputElement>("#promo-input", form)!;
    const code = input.value.trim().toUpperCase();
    const msg = $("[data-promo-msg]");
    if (code === catalog.promo.code) { promo = true; store.set("rv-promo", true); input.value = ""; if (msg) msg.textContent = ""; input.removeAttribute("aria-invalid"); render(); toast(fmt(t.cart.promoOk, { code, price: formatPrice(discount()) })); }
    else { input.setAttribute("aria-invalid", "true"); if (msg) msg.textContent = code ? fmt(t.cart.promoBad, { code: code.slice(0, 20) }) : t.cart.promoEmpty; input.focus(); }
  });

  addEventListener("scroll", syncMobileBar, { passive: true });
  addEventListener("resize", syncMobileBar);
  render();
  const n = count();
  if (n) setTimeout(() => toast(fmt(t.cart.saved, { n })), 1200);
}
