import { $, $$, store, reduceMotion } from "./dom";
import { t } from "../i18n/es";

export function initTheme() {
  const btn = $<HTMLButtonElement>("[data-theme-toggle]");
  if (!btn) return;
  const current = () =>
    (document.documentElement.dataset.theme as "light" | "dark" | undefined) ??
    (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
  const label = () => btn.setAttribute("aria-label", current() === "dark" ? t.theme.toLight : t.theme.toDark);
  label();
  btn.addEventListener("click", () => {
    const next = current() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    store.set("rv-theme", next);
    label();
  });
  matchMedia("(prefers-color-scheme: light)").addEventListener("change", label);
}

export function initMenu() {
  const btn = $<HTMLButtonElement>("[data-menu]");
  const nav = $("#nav");
  if (!btn || !nav) return;
  const set = (open: boolean) => {
    nav.classList.toggle("is-open", open);
    btn.setAttribute("aria-expanded", String(open));
    btn.setAttribute("aria-label", open ? t.nav.close : t.nav.menu);
    document.body.style.overflow = open ? "hidden" : "";
  };
  btn.addEventListener("click", () => set(!nav.classList.contains("is-open")));
  nav.addEventListener("click", (e) => { if ((e.target as Element).closest("a")) set(false); });
  addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("is-open")) { set(false); btn.focus(); }
  });
  matchMedia("(min-width: 820px)").addEventListener("change", () => set(false));
}

export function initAgeGate() {
  const dlg = $<HTMLDialogElement>("#age-gate");
  if (!dlg || store.get("rv-age-ok", false) || typeof dlg.showModal !== "function") return;
  dlg.showModal();
  dlg.addEventListener("cancel", (e) => e.preventDefault()); // la tecla Escape no salta la verificación
  $("[data-age-yes]", dlg)?.addEventListener("click", () => { store.set("rv-age-ok", true); dlg.close(); });
  $("[data-age-no]", dlg)?.addEventListener("click", () => {
    const msg = $("[data-age-msg]", dlg);
    if (msg) msg.textContent = t.age.noText;
  });
}

export function initReveal() {
  const items = $$(".reveal");
  if (!items.length) return;
  if (reduceMotion() || !("IntersectionObserver" in window)) { items.forEach((i) => i.classList.add("is-in")); return; }
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }),
    { rootMargin: "0px 0px -8% 0px" },
  );
  items.forEach((i) => io.observe(i));
}
