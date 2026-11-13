import { $, $$ } from "./dom";
import { t, fmt } from "../i18n/es";
import { leafBurst } from "./effects";

type Field = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

/** Devuelve el mensaje de error de un campo o "" si es válido. */
export function checkField(f: Field): string {
  if (f.disabled || f.closest("[hidden]")) return "";
  const v = f.value.trim();
  if (f instanceof HTMLInputElement && f.type === "checkbox") return f.required && !f.checked ? t.form.consent : "";
  if (f.required && !v) return t.form.required;
  if (!v) return "";
  if (f instanceof HTMLInputElement && f.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return t.form.email;
  const rule = f.dataset.rule;
  if (rule === "phone" && v.replace(/[\s+().-]/g, "").length < 9) return t.form.phone;
  if (rule === "zip" && !/^\d{5}$/.test(v)) return t.form.zip;
  const min = (f as HTMLInputElement).minLength;
  if (min > 0 && v.length < min) return fmt(t.form.min, { n: min });
  return "";
}

/** Muestra u oculta el error accesible (aria-invalid + texto enlazado por aria-describedby). */
export function showError(f: Field, msg: string) {
  const errId = `${f.id}-err`;
  const box = document.getElementById(errId);
  if (msg) f.setAttribute("aria-invalid", "true"); else f.removeAttribute("aria-invalid");
  if (box) box.textContent = msg;
}

/** Valida los campos de un contenedor. Enfoca el primero con error. */
export function validate(scope: ParentNode): boolean {
  let first: Field | null = null;
  $$<Field>("input, textarea, select", scope).forEach((f) => {
    if (f.type === "radio" || f.classList.contains("hp")) return;
    const msg = checkField(f);
    showError(f, msg);
    if (msg && !first) first = f;
  });
  (first as Field | null)?.focus();
  return !first;
}

/** Valida al salir del campo y limpia el error mientras se corrige. */
export function liveValidation(scope: ParentNode) {
  $$<Field>("input, textarea, select", scope).forEach((f) => {
    f.addEventListener("blur", () => { if (f.value) showError(f, checkField(f)); });
    f.addEventListener("input", () => { if (f.getAttribute("aria-invalid")) showError(f, checkField(f)); });
  });
}

/**
 * Formularios de contacto y newsletter.
 * En Netlify se reciben con Netlify Forms (sin backend ni claves). En otro hosting,
 * cambia `action` por tu endpoint (Formspree, función serverless…).
 */
export function initForms() {
  // Preselecciona un <select data-from-query="x"> con ?x= de la URL, solo si el valor existe en la lista.
  $$<HTMLSelectElement>("select[data-from-query]").forEach((sel) => {
    const v = new URLSearchParams(location.search).get(sel.dataset.fromQuery!);
    if (v && [...sel.options].some((o) => o.value === v)) sel.value = v;
  });
  $$<HTMLFormElement>("form[data-remote]").forEach((form) => {
    liveValidation(form);
    const status = $("[data-form-status]", form);
    const submit = $<HTMLButtonElement>("button[type=submit]", form);
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (status) { status.textContent = ""; status.className = "sr-only"; }
      if (!validate(form)) { if (status) { status.textContent = t.form.fix; status.className = "alert alert--error"; } return; }
      if ((form.elements.namedItem("bot-field") as HTMLInputElement | null)?.value) return; // spam
      submit?.setAttribute("aria-busy", "true");
      try {
        const body = new URLSearchParams(new FormData(form) as unknown as Record<string, string>).toString();
        const res = await fetch(form.getAttribute("action") || "/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
        if (!res.ok) throw new Error(String(res.status));
        form.reset();
        leafBurst(submit);
        if (status) { status.textContent = form.dataset.success || t.form.sent; status.className = "alert alert--success"; }
      } catch {
        const cat = JSON.parse(document.getElementById("catalog-data")?.textContent ?? "{}");
        if (status) { status.textContent = fmt(t.form.fail, { email: cat.email ?? "", phone: cat.phone ?? "" }); status.className = "alert alert--error"; }
      } finally {
        submit?.removeAttribute("aria-busy");
        status?.focus();
      }
    });
  });
}
