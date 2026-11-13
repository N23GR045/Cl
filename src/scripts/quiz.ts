import { $, el, formatPrice } from "./dom";
import { add, openCart, catalog, findP } from "./cart";

type Answers = { space?: "s" | "m" | "l"; medium?: "soil" | "coco" | "hydro"; have?: "none" | "tent" | "both" };
const QUESTIONS = [
  { key: "space", q: "¿Cuánto espacio tienes?", opts: [["s", "Pequeño", "Un rincón o un armario de 60×60 cm"], ["m", "Mediano", "Hasta 80×80 cm, lo más habitual"], ["l", "Grande", "Una habitación o 120×120 cm"]] },
  { key: "medium", q: "¿Dónde quieres cultivar?", opts: [["soil", "En tierra", "Lo más sencillo para empezar"], ["coco", "En fibra de coco", "Más control y crecimiento rápido"], ["hydro", "En agua (hidroponía)", "El máximo rendimiento"]] },
  { key: "have", q: "¿Qué tienes ya?", opts: [["none", "Nada, empiezo de cero", "Te preparamos el equipo completo"], ["tent", "Ya tengo armario", "Solo te falta el resto"], ["both", "Armario y luz", "Completamos lo que falta"]] },
] as const;

/** Reglas de recomendación: devuelven productos compatibles con el espacio y el medio. */
export function recommend(a: Required<Answers>): { items: [string, number][]; note: string } {
  if (a.space === "m" && a.medium === "soil" && a.have === "none") return { items: [["kit-interior", 1]], note: "El kit completo lleva todo lo que necesitas y te ahorras 90 €." };
  const items: [string, number][] = [];
  if (a.have === "none") items.push([a.space === "l" ? "armario-120" : a.space === "s" ? "armario-60" : "armario-80", 1]);
  if (a.have !== "both") items.push([a.space === "s" ? "led-120" : a.space === "l" ? "led-480" : "led-240", 1], ["timer", 1]);
  if (a.have === "none") items.push(["extractor", 1], ["termo", 1], ["clip-fan", 1]);
  const bags = a.space === "l" ? 2 : 1;
  if (a.medium === "soil") items.push(["macetas", 1], ["sustrato-50", bags], ["nutri-gb", 1]);
  if (a.medium === "coco") items.push(["macetas", 1], ["coco-50", bags], ["nutri-gb", 1], ["calmag", 1], ["phmeter", 1]);
  if (a.medium === "hydro") items.push(["dwc", 1], ["nutri-gb", 1], ["phmeter", 1]);
  return { items: items.filter(([id]) => findP(id)), note: "Todo es compatible entre sí y cubre tu espacio." };
}

export function initQuiz() {
  const box = $("[data-quiz]");
  if (!box) return;
  let step = 0;
  const answers: Answers = {};
  const progress = () => el("span", { className: "quiz__progress", ariaHidden: "true" }, ...QUESTIONS.map((_, i) => el("i", { className: i <= step ? "is-on" : "" })));

  const render = (focus = false) => {
    if (step < QUESTIONS.length) {
      const q = QUESTIONS[step];
      const heading = el("p", { className: "quiz__q", id: "quiz-q", tabIndex: -1, textContent: q.q });
      const opts = el("div", { className: "quiz__opts", role: "group" });
      opts.setAttribute("aria-labelledby", "quiz-q");
      q.opts.forEach(([value, title, hint]) => {
        const b = el("button", { type: "button", className: "quiz__opt" }, el("span", {}, el("strong", { textContent: title }), el("small", { textContent: hint })), el("span", { ariaHidden: "true", textContent: "→" }));
        b.addEventListener("click", () => { (answers as Record<string, string>)[q.key] = value; step++; render(true); });
        opts.append(b);
      });
      const parts: Node[] = [el("div", { className: "quiz__top mono" }, `Pregunta ${step + 1} de ${QUESTIONS.length}`, progress()), heading, opts];
      if (step > 0) { const back = el("button", { type: "button", className: "link-btn", textContent: "← Pregunta anterior" }); back.addEventListener("click", () => { step--; render(true); }); parts.push(back); }
      box.replaceChildren(...parts);
      if (focus) heading.focus();
      return;
    }
    const { items, note } = recommend(answers as Required<Answers>);
    const total = items.reduce((s, [id, n]) => s + findP(id)!.price * n, 0);
    const heading = el("p", { className: "quiz__q", tabIndex: -1, textContent: "Tu equipo recomendado" });
    const list = el("ul", { className: "quiz__list" }, ...items.map(([id, n]) => {
      const p = findP(id)!;
      return el("li", {}, el("img", { src: `/img/${p.img}-360.webp`, alt: "", width: 48, height: 48, loading: "lazy" }), el("span", { textContent: `${n > 1 ? `${n} × ` : ""}${p.name}` }), el("strong", { className: "tabular", textContent: formatPrice(p.price * n) }));
    }));
    const promoTotal = total - Math.round(total * catalog.promo.percent) / 100;
    const addAll = el("button", { type: "button", className: "btn btn--primary", textContent: "Añadir todo al carrito →" });
    addAll.addEventListener("click", () => { items.forEach(([id, n]) => add(id, n)); openCart(addAll); });
    const again = el("button", { type: "button", className: "btn", textContent: "Empezar de nuevo" });
    again.addEventListener("click", () => { step = 0; Object.keys(answers).forEach((k) => delete (answers as Record<string, string>)[k]); render(true); });
    box.replaceChildren(
      el("div", { className: "quiz__top mono" }, "Resultado", progress()), heading, list,
      el("div", { className: "quiz__total" }, el("span", { className: "muted", textContent: note }), el("strong", { textContent: formatPrice(total) })),
      el("p", { className: "mono muted", textContent: `${total >= catalog.shipping.freeFrom ? "Envío gratis incluido" : "Envío 4,95 €"} · Con ${catalog.promo.code}: ${formatPrice(promoTotal)}` }),
      el("div", { className: "quiz__actions" }, addAll, again),
    );
    heading.focus();
  };
  render();
}
