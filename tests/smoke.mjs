// Pruebas de humo sobre el sitio compilado (dist/). Ejecuta antes `npm run build`.
// Usa Playwright (Chromium) y axe-core. Si no tienes Playwright: npm i -D playwright && npx playwright install chromium
import { createServer } from "node:http";
import { readFile, readdir, stat } from "node:fs/promises";
import { createRequire } from "node:module";
import { join, extname } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const axeSource = await readFile(require.resolve("axe-core/axe.min.js"), "utf8");
const DIST = new URL("../dist/", import.meta.url).pathname;
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".webp": "image/webp", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".xml": "application/xml", ".txt": "text/plain" };

async function resolveFile(urlPath) {
  const clean = decodeURIComponent(urlPath.split("?")[0].split("#")[0]);
  for (const cand of [clean, `${clean}.html`, join(clean, "index.html")]) {
    try { const p = join(DIST, cand); if ((await stat(p)).isFile()) return p; } catch {}
  }
  return null;
}
const server = createServer(async (req, res) => {
  const file = await resolveFile(req.url === "/" ? "/index.html" : req.url);
  if (!file) { res.writeHead(404, { "Content-Type": TYPES[".html"] }); res.end(await readFile(join(DIST, "404.html"))); return; }
  res.writeHead(200, { "Content-Type": TYPES[extname(file)] ?? "application/octet-stream" });
  res.end(await readFile(file));
}).listen(0);
const BASE = `http://127.0.0.1:${server.address().port}`;

const failures = [];
const ok = (cond, msg) => { if (!cond) failures.push(msg); };
async function walk(dir) { const out = []; for (const e of await readdir(dir, { withFileTypes: true })) { const p = join(dir, e.name); if (e.isDirectory()) out.push(...(await walk(p))); else if (p.endsWith(".html")) out.push(p); } return out; }
const pages = (await walk(DIST)).map((p) => "/" + p.slice(DIST.length).replace(/\.html$/, "").replace(/^index$/, "")).map((p) => (p === "/index" ? "/" : p));

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
await ctx.addInitScript(() => { try { localStorage.setItem("rv-age-ok", "true"); } catch {} });
const titles = new Map();
const links = new Set();

// 1) Todas las páginas: consola, h1, títulos únicos, alt, desbordamiento, axe (muestra)
for (const path of pages) {
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource.*404/.test(m.text())) errors.push(m.text()); });
  const res = await page.goto(BASE + path, { waitUntil: "networkidle" });
  ok(path === "/404" || res.status() === 200, `${path}: HTTP ${res.status()}`);
  ok(!errors.length, `${path}: errores de consola → ${errors.join(" | ")}`);
  const info = await page.evaluate(() => ({
    h1: document.querySelectorAll("h1").length, title: document.title,
    desc: document.querySelector('meta[name="description"]')?.getAttribute("content") ?? "",
    canonical: !!document.querySelector('link[rel="canonical"]'),
    noAlt: [...document.images].filter((i) => !i.hasAttribute("alt")).length,
    noDims: [...document.images].filter((i) => !i.getAttribute("width") || !i.getAttribute("height")).length,
    overflow: document.documentElement.scrollWidth > innerWidth,
    links: [...document.querySelectorAll("a[href^='/']")].map((a) => a.getAttribute("href")),
  }));
  ok(info.h1 === 1, `${path}: ${info.h1} h1`);
  ok(info.desc.length >= 50 && info.desc.length <= 170, `${path}: meta description de ${info.desc.length} caracteres`);
  ok(info.canonical, `${path}: falta canonical`);
  ok(info.noAlt === 0, `${path}: ${info.noAlt} imágenes sin alt`);
  ok(info.noDims === 0, `${path}: ${info.noDims} imágenes sin width/height`);
  ok(!info.overflow, `${path}: desbordamiento horizontal a 390 px`);
  if (path !== "/404") { ok(!titles.has(info.title), `${path}: título repetido con ${titles.get(info.title)}`); titles.set(info.title, path); }
  info.links.forEach((l) => links.add(l));
  if (["/", "/productos", "/productos/led-240", "/categoria/cbd", "/contacto", "/legal/privacidad", "/404"].includes(path)) {
    for (const theme of ["dark", "light"]) {
      await page.evaluate((t) => { document.documentElement.dataset.theme = t; document.querySelectorAll(".reveal").forEach((r) => r.classList.add("is-in")); }, theme);
      await page.waitForTimeout(350);
      await page.addScriptTag({ content: axeSource });
      const r = await page.evaluate(async () => (await window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] })).violations.map((v) => `${v.id} (${v.nodes.length}): ${v.nodes[0]?.target}`));
      ok(!r.length, `${path} [${theme}]: axe → ${r.join(" ; ")}`);
    }
  }
  await page.close();
}

// 2b) CSP: cada script en línea ejecutable debe tener su hash en netlify.toml
{
  const { createHash } = await import("node:crypto");
  const toml = await readFile(new URL("../netlify.toml", import.meta.url), "utf8");
  const seen = new Set();
  for (const file of await walk(DIST)) {
    const html = await readFile(file, "utf8");
    for (const m of html.matchAll(/<script(?![^>]*type="application\/(?:ld\+)?json")(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)) {
      const hash = `sha256-${createHash("sha256").update(m[1]).digest("base64")}`;
      if (!seen.has(hash)) { seen.add(hash); ok(toml.includes(hash), `CSP: añade '${hash}' a script-src en netlify.toml`); }
    }
  }
}

// 2) Enlaces internos
for (const href of links) { const f = await resolveFile(href.split("#")[0] || "/index.html"); ok(!!f || href.startsWith("/#"), `Enlace roto: ${href}`); }

// 3) Flujos
const p = await ctx.newPage();
p.on("pageerror", (e) => failures.push(`flujo: ${e.message}`));
await p.goto(BASE + "/");
for (const v of ["Mediano", "En fibra de coco", "Nada, empiezo de cero"]) await p.getByRole("button", { name: new RegExp(v) }).click();
await p.getByRole("button", { name: /Añadir todo al carrito/ }).click();
ok(Number(await p.textContent("[data-cart-count]")) >= 8, "Asistente: no añadió el equipo al carrito");
ok(await p.locator("#cart.is-open").count() === 1, "Asistente: no abrió el carrito");
await p.keyboard.press("Escape");
ok(await p.locator("#cart.is-open").count() === 0, "Escape no cierra el carrito");

await p.goto(BASE + "/productos");
await p.fill("#q", "hidroponia"); await p.waitForTimeout(400);
ok((await p.locator(".card:not([hidden])").count()) >= 3, "Búsqueda sin tildes no encuentra hidroponía");
await p.fill("#q", ""); await p.getByRole("button", { name: "CBD", exact: true }).click(); await p.waitForTimeout(400);
ok((await p.locator(".card:not([hidden])").count()) === 6, "Filtro CBD no muestra 6 productos");
await p.selectOption("#sort", "asc"); await p.waitForTimeout(300);
const prices = await p.$$eval(".card:not([hidden])", (cs) => cs.map((c) => Number(c.dataset.price)));
ok(prices.every((v, i) => !i || prices[i - 1] <= v), "Orden por precio ascendente incorrecto");

await p.goto(BASE + "/productos/led-240");
await p.evaluate(() => localStorage.removeItem("rv-cart")); await p.reload();
await p.click("[data-pdp-plus]"); await p.click("[data-pdp-buy]");
ok((await p.textContent("[data-cart-count]")) === "2", "Comprar ahora: cantidad incorrecta");
await p.click("[data-co-next]");
ok((await p.getAttribute("#co-name", "aria-invalid")) === "true", "Compra: no marca el nombre vacío como inválido");
ok(((await p.textContent("#co-name-err")) ?? "").length > 5, "Compra: falta el mensaje de error del nombre");
await p.fill("#co-name", "Ana Pérez"); await p.fill("#co-email", "ana@correo.com"); await p.fill("#co-phone", "600123456"); await p.click("[data-co-next]");
await p.fill("#co-addr", "Calle Mayor 3"); await p.fill("#co-zip", "4600"); await p.fill("#co-city", "Valencia"); await p.click("[data-co-next]");
ok((await p.getAttribute("#co-zip", "aria-invalid")) === "true", "Compra: acepta un código postal de 4 cifras");
await p.fill("#co-zip", "46001"); await p.click("[data-co-next]");
ok(/379,80/.test(await p.textContent("[data-co-next]")), "Compra: total incorrecto (2 × 189,90 € con envío gratis)");
await p.click("[data-co-next]");
ok(await p.isVisible("[data-co-done]"), "Compra: no muestra la confirmación");
ok((await p.textContent("[data-cart-count]")) === "0", "Compra: no vacía el carrito");

await p.goto(BASE + "/contacto");
await p.click("form[name=contacto] button[type=submit]");
ok((await p.getAttribute("#c-email", "aria-invalid")) === "true", "Contacto: no valida el email vacío");
ok(await p.evaluate(() => document.activeElement?.id === "c-name"), "Contacto: no enfoca el primer campo con error");

await p.goto(BASE + "/");
await p.keyboard.press("Tab");
ok(await p.evaluate(() => document.activeElement?.classList.contains("skip")), "El primer Tab no llega al enlace «Saltar al contenido»");

const fresh = await browser.newPage();
await fresh.goto(BASE + "/");
ok(await fresh.locator("#age-gate[open]").count() === 1, "No aparece el aviso de edad en la primera visita");

await browser.close();
server.close();
if (failures.length) { console.error(`✖ ${failures.length} fallos:\n- ${failures.join("\n- ")}`); process.exit(1); }
console.log(`✔ ${pages.length} páginas y todos los flujos verificados (${links.size} enlaces internos, axe en claro y oscuro).`);
