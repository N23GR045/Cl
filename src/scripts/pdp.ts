import { $ } from "./dom";
import { add, openCart } from "./cart";

/** Ficha de producto: selector de cantidad, añadir y comprar ahora. */
export function initProductPage() {
  const root = $("[data-pdp]");
  if (!root) return;
  const id = root.dataset.pdp!;
  const out = $<HTMLOutputElement>("[data-pdp-qty]", root)!;
  let qty = 1;
  const set = (n: number) => { qty = Math.max(1, Math.min(20, n)); out.value = String(qty); };
  $("[data-pdp-minus]", root)?.addEventListener("click", () => set(qty - 1));
  $("[data-pdp-plus]", root)?.addEventListener("click", () => set(qty + 1));
  $("[data-pdp-add]", root)?.addEventListener("click", (e) => add(id, qty, e.currentTarget as Element));
  $("[data-pdp-buy]", root)?.addEventListener("click", (e) => {
    add(id, qty);
    openCart(e.currentTarget as HTMLElement);
    $<HTMLButtonElement>("[data-checkout]")?.click();
  });
}
