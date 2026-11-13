import { $, $$, formatPrice } from "./dom";
import { t, fmt } from "../i18n/es";
import { catalog, subtotal, discount, hasPromo, clear, count } from "./cart";
import { validate, liveValidation } from "./forms";

let step = 1;
const form = () => $<HTMLFormElement>("[data-co-form]");
const shipValue = () => ($<HTMLInputElement>("input[name=ship]:checked")?.value ?? "home") as "home" | "store";
const shipCost = () => (shipValue() === "store" || subtotal() >= catalog.shipping.freeFrom ? 0 : catalog.shipping.cost);
const grandTotal = () => subtotal() - discount() + shipCost();

function setView(view: "cart" | "checkout") {
  $$("[data-view]").forEach((v) => (v.hidden = v.dataset.view !== view));
  if (view === "cart" && count() === 0) { const f = $("[data-cart-foot]"); if (f) f.hidden = true; }
  const title = $("[data-cart-title]");
  if (title) title.textContent = view === "cart" ? t.cart.title : t.cart.checkout;
}

function summaryRow(label: string, value: string) {
  const d = document.createElement("div");
  const dt = document.createElement("dt"); dt.textContent = label;
  const dd = document.createElement("dd"); dd.textContent = value;
  d.append(dt, dd); return d;
}

function showStep(n: number) {
  step = n;
  $$<HTMLFieldSetElement>("[data-co-form] fieldset").forEach((fs) => (fs.hidden = Number(fs.dataset.step) !== n));
  $$("[data-step-label]").forEach((li) => {
    const i = Number(li.dataset.stepLabel);
    li.classList.toggle("is-done", i < n);
    if (i === n) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
  });
  const back = $("[data-co-back]"), next = $("[data-co-next]");
  if (back) back.textContent = n === 1 ? t.checkout.backCart : t.checkout.back;
  if (next) next.textContent = n === 3 ? fmt(t.checkout.pay, { price: formatPrice(grandTotal()) }) : t.checkout.next;
  const shipPrice = $("[data-ship-home-price]");
  if (shipPrice) shipPrice.textContent = subtotal() >= catalog.shipping.freeFrom ? `Gratis por superar ${formatPrice(catalog.shipping.freeFrom)}` : formatPrice(catalog.shipping.cost);
  if (n === 3) {
    const rows = [summaryRow("Productos", formatPrice(subtotal()))];
    if (hasPromo()) rows.push(summaryRow(`Descuento ${catalog.promo.code}`, `−${formatPrice(discount())}`));
    rows.push(summaryRow("Envío", shipCost() ? formatPrice(shipCost()) : "Gratis"), summaryRow("Total", formatPrice(grandTotal())));
    $("[data-summary]")?.replaceChildren(...rows);
  }
  const err = $("[data-co-error]");
  if (err) err.textContent = "";
  $<HTMLInputElement>(`[data-co-form] fieldset[data-step="${n}"] input:not([type=radio])`)?.focus({ preventScroll: true });
}

export function initCheckout() {
  const f = form();
  if (!f) return;
  liveValidation(f);
  $("[data-checkout]")?.addEventListener("click", () => {
    setView("checkout"); f.hidden = false;
    const done = $("[data-co-done]"); if (done) done.hidden = true;
    const nav = $("[data-co-nav]"); if (nav) nav.hidden = false;
    $(".co-steps")?.removeAttribute("hidden");
    showStep(1);
  });
  $("[data-co-back]")?.addEventListener("click", () => (step === 1 ? setView("cart") : showStep(step - 1)));
  $$<HTMLInputElement>("input[name=ship]").forEach((r) => r.addEventListener("change", () => {
    const addr = $("[data-address]"); if (addr) addr.hidden = shipValue() === "store";
  }));
  f.addEventListener("submit", (e) => {
    e.preventDefault();
    const fs = $(`fieldset[data-step="${step}"]`, f)!;
    if (!validate(fs)) { const err = $("[data-co-error]"); if (err) err.textContent = t.form.fix; return; }
    if (step < 3) { showStep(step + 1); return; }
    // DEMO: aquí se crearía la sesión de pago (p. ej. Stripe Checkout desde una función serverless).
    const num = `RV-${String(Date.now()).slice(-6)}`;
    const extra = shipValue() === "store" ? t.checkout.pickupText : t.checkout.homeText;
    const text = $("[data-co-done-text]");
    if (text) text.textContent = `${fmt(t.checkout.doneText, { num, price: formatPrice(grandTotal()), extra })} ${t.checkout.demo}`;
    f.hidden = true; f.reset();
    const nav = $("[data-co-nav]"); if (nav) nav.hidden = true;
    $(".co-steps")?.setAttribute("hidden", "");
    const done = $<HTMLElement>("[data-co-done]"); if (done) { done.hidden = false; done.focus(); }
    clear();
  });
  document.addEventListener("cart:closed", () => setTimeout(() => setView("cart"), 400));
}
