import { $, $$ } from "./dom";
import { t, fmt } from "../i18n/es";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Filtrado del catálogo: todos los productos ya están en el HTML (indexables); aquí solo se ocultan/ordenan. */
export function initCatalog() {
  const root = $("[data-catalog]");
  if (!root) return;
  const grid = $("[data-grid]", root)!;
  const cards = $$<HTMLElement>(".card", grid);
  const original = [...cards];
  const q = $<HTMLInputElement>("#q", root)!;
  const sort = $<HTMLSelectElement>("#sort", root)!;
  const countEl = $("[data-count]", root)!;
  const empty = $("[data-empty]", root)!;
  const chips = $$<HTMLButtonElement>("[data-filter]", root);
  const params = new URLSearchParams(location.search);
  let cat = params.get("cat") ?? "todos";
  q.value = params.get("q") ?? "";
  sort.value = params.get("orden") ?? "rel";

  const apply = () => {
    const query = norm(q.value.trim());
    let visible = original.filter((c) => (cat === "todos" || c.dataset.cat === cat) && (!query || norm(c.dataset.search ?? "").includes(query)));
    if (query) visible = [...visible.filter((c) => norm(c.dataset.name ?? "").includes(query)), ...visible.filter((c) => !norm(c.dataset.name ?? "").includes(query))];
    if (sort.value !== "rel") visible.sort((a, b) => (Number(a.dataset.price) - Number(b.dataset.price)) * (sort.value === "asc" ? 1 : -1));
    const set = new Set(visible);
    original.forEach((c) => (c.hidden = !set.has(c)));
    grid.append(...visible, ...original.filter((c) => !set.has(c)));
    chips.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.filter === cat)));
    countEl.textContent = fmt(t.catalog.count, { n: visible.length });
    empty.hidden = visible.length > 0;
    const p = new URLSearchParams();
    if (cat !== "todos") p.set("cat", cat);
    if (q.value.trim()) p.set("q", q.value.trim());
    if (sort.value !== "rel") p.set("orden", sort.value);
    history.replaceState(null, "", `${location.pathname}${p.size ? `?${p}` : ""}`);
  };
  const run = () => ((document as Document & { startViewTransition?: (cb: () => void) => void }).startViewTransition && !matchMedia("(prefers-reduced-motion: reduce)").matches
    ? (document as Document & { startViewTransition: (cb: () => void) => void }).startViewTransition(apply)
    : apply());

  chips.forEach((b) => b.addEventListener("click", () => { cat = b.dataset.filter!; run(); }));
  let timer: number | undefined;
  q.addEventListener("input", () => { clearTimeout(timer); timer = window.setTimeout(run, 150); });
  sort.addEventListener("change", run);
  $("[data-reset]", root)?.addEventListener("click", () => { cat = "todos"; q.value = ""; sort.value = "rel"; run(); q.focus(); });
  apply();
}
