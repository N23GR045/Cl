// Animaciones y efectos. Solo se activan con html.motion (sin "reducir movimiento").
// Todo el trabajo de scroll va en un único requestAnimationFrame por fotograma.
import { $, $$ } from "./dom";

const root = document.documentElement;
const motion = () => root.classList.contains("motion");
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const finePointer = matchMedia("(pointer: fine)").matches;

/* ---------- Intro ---------- */
function initIntro() {
  const el = $("#intro");
  if (!el || !root.classList.contains("has-intro")) return;
  const pct = $("[data-intro-pct]", el);
  const t0 = performance.now(), D = 1900;
  let done = false;
  const finish = () => {
    if (done) return; done = true;
    el.classList.add("is-out");
    window.setTimeout(() => { root.classList.remove("has-intro"); el.remove(); }, 950);
  };
  const tick = (t: number) => {
    if (done) return;
    const k = clamp((t - t0) / D);
    if (pct) pct.textContent = `${Math.round(k * 100)}%`;
    if (k < 1) requestAnimationFrame(tick); else finish();
  };
  requestAnimationFrame(tick);
  $("[data-intro-skip]", el)?.addEventListener("click", finish);
  addEventListener("keydown", finish, { once: true });
}

/* ---------- Partículas en el haz de luz ---------- */
function initSpores() {
  const c = $<HTMLCanvasElement>("[data-spores]");
  const ctx = c?.getContext("2d");
  if (!c || !ctx) return;
  type P = { x: number; y: number; r: number; vy: number; a: number; col: string };
  const cols = ["255,181,71", "224,79,207", "238,242,236", "155,190,255"];
  let w = 0, h = 0, parts: P[] = [], visible = true;
  const size = () => {
    const dpr = Math.min(2, devicePixelRatio || 1);
    w = c.clientWidth; h = c.clientHeight; c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    parts = Array.from({ length: w < 700 ? 40 : 80 }, () => ({ x: Math.random() * w, y: Math.random() * h, r: .4 + Math.random() * 1.8, vy: -(.12 + Math.random() * .4), a: Math.random() * 6.28, col: cols[(Math.random() * cols.length) | 0] }));
  };
  size();
  addEventListener("resize", size);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(c);
  const frame = () => {
    if (visible && !document.hidden) {
      ctx.clearRect(0, 0, w, h);
      const bx = w < 820 ? w * .5 : w * .72;
      for (const p of parts) {
        p.y += p.vy; p.a += .012; p.x += Math.sin(p.a) * .25;
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        const beam = clamp(1 - Math.abs(p.x - bx) / (w * .28));
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 + beam), 0, 6.283);
        ctx.fillStyle = `rgba(${p.col},${.12 + beam * .65})`; ctx.fill();
      }
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

/* ---------- Scroll: progreso, cabecera, parallax, ciclo, montaje, pie ---------- */
function initScroll() {
  const progress = $("[data-progress]");
  const header = $(".header");
  const heroCopy = $("[data-hero-copy]");
  const grow = $("[data-grow]");
  const growLeaves = grow ? $$<SVGGElement>(".grow-plant .leaf", grow) : [];
  const growBuds = grow ? $$<SVGCircleElement>(".grow-plant .bud", grow) : [];
  const growStem = grow ? $<SVGPathElement>(".grow-plant .stem", grow) : null;
  const growBars = grow ? $$(".grow__bar i", grow) : [];
  const growItems = grow ? $$("[data-stage-item]", grow) : [];
  const setup = $(".setup");
  const setupImg = setup ? $("img", setup) : null;
  const giant = $("[data-giant]");
  const levels = 6;
  let lastY = scrollY, stage = -1, ticking = false;

  const update = () => {
    ticking = false;
    const y = scrollY, vh = innerHeight, max = document.documentElement.scrollHeight - vh;
    progress?.style.setProperty("--p", String(max > 0 ? y / max : 0));
    if (header) {
      const menuOpen = $("#nav")?.classList.contains("is-open");
      header.classList.toggle("is-hidden", !menuOpen && y > lastY && y > 400);
    }
    lastY = y;
    if (heroCopy && y < vh * 1.2) heroCopy.style.opacity = String(clamp(1 - y / (vh * .9), .15));

    if (grow) {
      const r = grow.getBoundingClientRect();
      const p = clamp(-r.top / Math.max(1, r.height - vh));
      const g = clamp(p / .5), bud = clamp((p - .5) / .22), harv = clamp((p - .78) / .18);
      growStem?.style.setProperty("stroke-dashoffset", (1 - Math.max(.06, g)).toFixed(3));
      growLeaves.forEach((el) => { el.style.scale = clamp(g * levels - Number(el.dataset.i)).toFixed(3); });
      growBuds.forEach((el) => { el.style.scale = bud.toFixed(3); });
      grow.style.setProperty("--h", harv.toFixed(3));
      growBars.forEach((b, i) => b.style.setProperty("--f", clamp(p * 4 - i).toFixed(3)));
      const st = Math.min(3, Math.floor(p * 4));
      if (st !== stage) {
        stage = st; grow.dataset.stage = String(st);
        growItems.forEach((it, i) => it.classList.toggle("is-active", i === st));
      }
    }
    if (setup && setupImg) {
      const r = setup.getBoundingClientRect();
      if (r.bottom > 0 && r.top < vh) {
        setup.style.setProperty("--clip", `${((1 - clamp((vh - r.top) / (vh * .8))) * 8).toFixed(2)}%`);
        setupImg.style.setProperty("--py", `${(r.top * -.1).toFixed(1)}px`);
      }
    }
    if (giant) {
      const r = giant.getBoundingClientRect();
      giant.style.setProperty("--fill", `${(clamp((vh - r.top) / (vh * .6)) * 100).toFixed(1)}%`);
    }
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll);
  update();
}

/* ---------- Puntero: resplandor, parallax del hero, inclinación de tarjetas, botones magnéticos ---------- */
function initPointer() {
  if (!finePointer) return;
  const glow = $("[data-glow]");
  let gx = innerWidth / 2, gy = innerHeight / 2, tx = gx, ty = gy, running = false;
  const follow = () => {
    gx += (tx - gx) * .14; gy += (ty - gy) * .14;
    if (glow) glow.style.transform = `translate(${gx}px, ${gy}px)`;
    if (Math.abs(tx - gx) + Math.abs(ty - gy) > .5) requestAnimationFrame(follow); else running = false;
  };
  addEventListener("pointermove", (e) => {
    tx = e.clientX; ty = e.clientY; glow?.classList.add("is-on");
    if (!running) { running = true; requestAnimationFrame(follow); }
  }, { passive: true });
  document.addEventListener("pointerleave", () => glow?.classList.remove("is-on"));

  const hero = $(".hero");
  hero?.addEventListener("pointermove", (e) => {
    const r = hero.getBoundingClientRect();
    hero.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 2 - 1).toFixed(3));
    hero.style.setProperty("--my", ((e.clientY - r.top) / r.height * 2 - 1).toFixed(3));
  });

  document.addEventListener("pointermove", (e) => {
    const card = (e.target as Element).closest<HTMLElement>(".card");
    if (!card) return;
    const r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    card.style.setProperty("--ry", `${((x - .5) * 9).toFixed(2)}deg`);
    card.style.setProperty("--rx", `${((.5 - y) * 9).toFixed(2)}deg`);
    card.style.setProperty("--gx", `${(x * 100).toFixed(1)}%`);
    card.style.setProperty("--gy", `${(y * 100).toFixed(1)}%`);
  }, { passive: true });
  document.addEventListener("pointerout", (e) => {
    const card = (e.target as Element).closest<HTMLElement>(".card");
    if (card && !card.contains(e.relatedTarget as Node)) { card.style.setProperty("--rx", "0deg"); card.style.setProperty("--ry", "0deg"); }
  });

  $$<HTMLElement>(".magnetic").forEach((b) => {
    b.addEventListener("pointermove", (e) => {
      const r = b.getBoundingClientRect();
      b.style.transform = `translate(${((e.clientX - r.left - r.width / 2) * .22).toFixed(1)}px, ${((e.clientY - r.top - r.height / 2) * .3).toFixed(1)}px)`;
    });
    b.addEventListener("pointerleave", () => { b.style.transform = ""; });
  });
}

/* ---------- Bola de luz que vuela al carrito ---------- */
export function flyToCart(from?: Element | null) {
  if (!motion() || !from) return;
  const target = $$("[data-cart-open]").find((b) => b.offsetParent !== null && b.closest(".header"));
  if (!target) return;
  const a = from.getBoundingClientRect(), b = target.getBoundingClientRect();
  const x0 = a.left + a.width / 2, y0 = a.top + a.height / 2, x1 = b.left + b.width / 2, y1 = b.top + b.height / 2;
  const dot = document.createElement("div");
  dot.className = "fly-dot"; document.body.append(dot);
  dot.animate([
    { transform: `translate(${x0}px, ${y0}px) scale(1)` },
    { transform: `translate(${(x0 + x1) / 2}px, ${Math.min(y0, y1) - 140}px) scale(1.6)`, offset: .45 },
    { transform: `translate(${x1}px, ${y1}px) scale(.4)` },
  ], { duration: 780, easing: "cubic-bezier(.5,0,.3,1)" }).onfinish = () => {
    dot.remove();
    target.animate([{ transform: "scale(1)" }, { transform: "scale(1.22) rotate(-8deg)" }, { transform: "scale(1)" }], { duration: 450, easing: "cubic-bezier(.34,1.56,.64,1)" });
  };
}

/* ---------- Explosión de hojas (celebración) ---------- */
export function leafBurst(from?: Element | null) {
  if (!motion() || !from) return;
  const r = from.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const cols = ["#7fd88a", "#ffb547", "#e05fd0", "#6f97ff"];
  for (let i = 0; i < 22; i++) {
    const l = document.createElement("div");
    l.className = "leaf-bit"; l.style.background = cols[i % 4]; document.body.append(l);
    const ang = Math.random() * Math.PI * 2, dist = 70 + Math.random() * 130;
    l.animate([
      { transform: `translate(${cx}px, ${cy}px) rotate(0) scale(1)`, opacity: 1 },
      { transform: `translate(${cx + Math.cos(ang) * dist}px, ${cy + Math.sin(ang) * dist + 60}px) rotate(${Math.random() * 540}deg) scale(.4)`, opacity: 0 },
    ], { duration: 1000 + Math.random() * 500, easing: "cubic-bezier(.16,1,.3,1)" }).onfinish = () => l.remove();
  }
}

export function initEffects() {
  if (!motion()) return;
  initIntro();
  initSpores();
  initScroll();
  initPointer();
}
