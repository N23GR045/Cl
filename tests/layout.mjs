// Prueba de maquetación: textos superpuestos, cortados o fuera de pantalla en varios anchos.
// Uso: npm run build && node tests/layout.mjs
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { createRequire } from "node:module";
import { join, extname } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const DIST = new URL("../dist/", import.meta.url).pathname;
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".webp": "image/webp", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".woff2": "font/woff2" };
async function resolveFile(u) {
  const clean = decodeURIComponent(u.split("?")[0]);
  for (const c of [clean === "/" ? "/index.html" : clean, `${clean}.html`]) { try { const p = join(DIST, c); if ((await stat(p)).isFile()) return p; } catch {} }
  return null;
}
const server = createServer(async (req, res) => {
  const f = await resolveFile(req.url);
  if (!f) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "Content-Type": TYPES[extname(f)] ?? "application/octet-stream" });
  res.end(await readFile(f));
}).listen(0);
const BASE = `http://127.0.0.1:${server.address().port}`;

// LAYOUT_ALL=1 revisa todas las páginas en los dos móviles más estrechos.
const ALL = process.env.LAYOUT_ALL === "1";
const VIEWPORTS = ALL ? [[320, 640], [390, 844]] : [[320, 640], [360, 740], [390, 844], [414, 896], [768, 1024], [1024, 768], [1280, 800], [1440, 900]];
const { readdir } = await import("node:fs/promises");
async function allPages(dir = DIST, base = "") { const out = []; for (const e of await readdir(dir, { withFileTypes: true })) { if (e.isDirectory()) { if (e.name !== "assets" && e.name !== "img") out.push(...(await allPages(join(dir, e.name), `${base}/${e.name}`))); } else if (e.name.endsWith(".html")) out.push(`${base}/${e.name.replace(/\.html$/, "")}`.replace(/\/index$/, "/")); } return out; }
const PAGES = ALL ? await allPages() : ["/", "/productos", "/productos/led-480", "/productos/kit-interior", "/productos/flor-og", "/categoria/cbd", "/contacto", "/legal/privacidad", "/pedido-confirmado", "/404"];

// Se ejecuta en la página: devuelve problemas de maquetación visibles.
function audit() {
  const vw = document.documentElement.clientWidth;
  const SKIP = ".marquee, .reviews-marquee, .chips, .giant, .intro, .spores, .sr-only, .hp, [hidden], .toast, .cursor-glow, .drawer:not(.is-open), dialog:not([open])";
  const visible = (el) => {
    if (el.closest(SKIP)) return false;
    const det = el.closest("details"); if (det && !det.open && !el.closest("summary")) return false;
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.display === "none" || cs.visibility === "hidden" || Number(cs.opacity) === 0) return false;
    }
    return true;
  };
  const label = (el) => `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}${el.className && typeof el.className === "string" ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".") : ""} «${(el.textContent || "").trim().slice(0, 40)}»`;
  const fixedAncestor = (el) => { for (let n = el; n; n = n.parentElement) { const p = getComputedStyle(n).position; if (p === "fixed" || p === "sticky") return n; } return null; };

  // Elementos con texto propio
  const texts = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: (t) => (t.textContent.trim() ? 1 : 2) });
  for (let t = walker.nextNode(); t; t = walker.nextNode()) {
    const el = t.parentElement;
    if (!el || !visible(el)) continue;
    const range = document.createRange(); range.selectNodeContents(t);
    const rects = [...range.getClientRects()].filter((r) => r.width > 1 && r.height > 1)
      .map((r) => ({ left: r.left, right: r.right, top: r.top + r.height * .2, bottom: r.bottom - r.height * .2 }));
    if (rects.length) texts.push({ el, rects, fixed: fixedAncestor(el) });
  }
  const problems = [];
  // 1) Texto fuera de la pantalla en horizontal
  for (const { el, rects } of texts) {
    if (el.closest("[style*='overflow-x'], .table-wrap")) continue;
    if (rects.some((r) => r.right > vw + 1 || r.left < -1)) problems.push(`fuera de pantalla: ${label(el)}`);
  }
  // 2) Texto recortado por un contenedor con overflow oculto
  for (const { el, rects } of texts) {
    for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.overflowX === "visible" && cs.overflowY === "visible") continue;
      const b = n.getBoundingClientRect();
      const cut = rects.some((r) => r.right > b.right + 2 || r.bottom > b.bottom + 2 || r.left < b.left - 2 || r.top < b.top - 2);
      if (cut && !(cs.overflowY === "auto" || cs.overflowY === "scroll")) { problems.push(`recortado por ${label(n).split(" «")[0]}: ${label(el)}`); }
      break;
    }
  }
  // 3) Textos que se pisan (solo entre elementos del mismo nivel de capa)
  for (let i = 0; i < texts.length; i++) {
    for (let j = i + 1; j < texts.length; j++) {
      const a = texts[i], b = texts[j];
      if (a.el === b.el || a.el.contains(b.el) || b.el.contains(a.el)) continue;
      if (a.fixed !== b.fixed) continue; // capas fijas (cabecera, barra móvil) frente a contenido que pasa por debajo
      for (const ra of a.rects) for (const rb of b.rects) {
        const w = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left), h = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
        if (w > 3 && h > 3) { problems.push(`se superponen: ${label(a.el)} ↔ ${label(b.el)}`); i = j = 1e9; }
      }
    }
  }
  if (document.documentElement.scrollWidth > vw + 1) problems.push(`desbordamiento horizontal de la página: ${document.documentElement.scrollWidth}px > ${vw}px`);
  return [...new Set(problems)];
}

const browser = await chromium.launch();
const report = [];
for (const [w, h] of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  await ctx.addInitScript(() => { try { localStorage.setItem("rv-age-ok", "true"); sessionStorage.setItem("rv-intro", "1"); } catch {} });
  const page = await ctx.newPage();
  for (const path of PAGES) {
    await page.goto(BASE + path, { waitUntil: "networkidle" });
    await page.evaluate(() => document.querySelectorAll(".reveal").forEach((r) => r.classList.add("is-in")));
    await page.evaluate(() => Promise.all(document.getAnimations().filter((a) => a.effect?.getComputedTiming().endTime !== Infinity).map((a) => a.finished.catch(() => {}))));
    // Página completa: se audita desplazando por pantallas (el contenido fijo queda en su sitio)
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    const found = new Set();
    for (let y = 0; y < total; y += Math.round(h * .8)) {
      await page.evaluate((yy) => scrollTo(0, yy), y);
      await page.waitForTimeout(60);
      (await page.evaluate(audit)).forEach((p) => found.add(p));
    }
    // Ciclo de cultivo: cada fase
    if (path === "/") {
      for (const p of [.05, .3, .55, .85]) {
        await page.evaluate((pp) => { const g = document.querySelector("[data-grow]"); scrollTo(0, g.offsetTop + (g.offsetHeight - innerHeight) * pp); }, p);
        await page.waitForTimeout(700);
        (await page.evaluate(() => {
          const out = [];
          const sticky = document.querySelector(".grow__sticky"); if (!sticky) return out;
          const b = sticky.getBoundingClientRect();
          sticky.querySelectorAll(".grow__info *").forEach((el) => {
            if (!el.childNodes.length || ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) return;
            const cs = getComputedStyle(el); if (cs.display === "none" || el.closest(".step:not(.is-active)")) return;
            const r = el.getBoundingClientRect();
            if (r.bottom > b.bottom + 1 || r.top < b.top - 1) out.push(`ciclo: texto cortado «${el.textContent.trim().slice(0, 40)}»`);
          });
          return out;
        })).forEach((x) => found.add(`${x} (fase ${p})`));
      }
    }
    found.forEach((p) => report.push(`${w}×${h} ${path}: ${p}`));
  }
  // Carrito y compra abiertos
  await page.goto(BASE + "/productos/led-240", { waitUntil: "networkidle" });
  await page.click("[data-pdp-buy]");
  await page.waitForTimeout(700);
  (await page.evaluate(audit)).forEach((p) => report.push(`${w}×${h} compra: ${p}`));
  await ctx.close();
}
await browser.close();
server.close();
if (report.length) { console.error(`✖ ${report.length} problemas de maquetación:\n- ${report.join("\n- ")}`); process.exit(1); }
console.log(`✔ Maquetación correcta en ${VIEWPORTS.length} anchos × ${PAGES.length} páginas, ciclo de cultivo y compra.`);
