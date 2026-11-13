// Utilidades comunes: selección, almacenamiento seguro, avisos, foco.
export const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
export const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => [...root.querySelectorAll<T>(sel)];
export const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/** localStorage puede fallar (modo privado, cuota): nunca rompe la página. */
export const store = {
  get<T>(key: string, fallback: T): T {
    try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : fallback; } catch { return fallback; }
  },
  set(key: string, value: unknown) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* sin almacenamiento: seguimos sin persistir */ }
  },
};

export const formatPrice = (n: number) => n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });

let toastTimer: number | undefined;
export function toast(message: string) {
  const node = $("[data-toast]");
  if (!node) return;
  node.textContent = message;
  node.classList.add("is-on");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => node.classList.remove("is-on"), 2600);
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Mantiene el foco dentro de un contenedor (diálogos). Devuelve la función para liberarlo. */
export function trapFocus(container: HTMLElement) {
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== "Tab") return;
    const items = $$<HTMLElement>(FOCUSABLE, container).filter((n) => n.offsetParent !== null);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  container.addEventListener("keydown", onKey);
  return () => container.removeEventListener("keydown", onKey);
}

type ElProps<K extends keyof HTMLElementTagNameMap> = Partial<Omit<HTMLElementTagNameMap[K], "dataset">> & { dataset?: Record<string, string> };

/** Crea un elemento con texto seguro (nunca innerHTML con datos). */
export function el<K extends keyof HTMLElementTagNameMap>(tag: K, props: ElProps<K> = {}, ...children: (Node | string)[]) {
  const node = document.createElement(tag);
  const { dataset, ...rest } = props;
  Object.assign(node, rest);
  if (dataset) Object.assign(node.dataset, dataset);
  node.append(...children);
  return node;
}
