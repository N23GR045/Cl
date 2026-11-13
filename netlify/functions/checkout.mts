// Función de servidor (Netlify Functions): crea una sesión de pago de Stripe Checkout.
// Seguridad:
//  - Los precios se recalculan aquí a partir de src/data/catalog.ts; nunca se aceptan precios del navegador.
//  - La clave secreta solo existe como variable de entorno del servidor (STRIPE_SECRET_KEY).
//  - Se validan tipos, longitudes y cantidades; los errores no revelan detalles internos.
import { products } from "../../src/data/catalog.ts";
import { site } from "../../src/data/site.ts";

type Ship = "home" | "store";
interface Payload {
  items: { id: string; qty: number }[];
  promo?: string;
  ship: Ship;
  customer: { name: string; email: string; phone: string; address?: string; zip?: string; city?: string };
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Valida y normaliza el pedido. Devuelve un mensaje de error o el pedido limpio. */
export function parseOrder(raw: unknown): { error: string } | { order: Payload } {
  if (!raw || typeof raw !== "object") return { error: "Pedido no válido." };
  const r = raw as Record<string, unknown>;
  if (!Array.isArray(r.items) || r.items.length === 0 || r.items.length > 50) return { error: "El carrito está vacío o no es válido." };
  const items: Payload["items"] = [];
  for (const it of r.items as Record<string, unknown>[]) {
    const id = str(it?.id, 40), qty = Number(it?.qty);
    if (!products.some((p) => p.id === id)) return { error: "Hay un producto que ya no existe. Revisa el carrito." };
    if (!Number.isInteger(qty) || qty < 1 || qty > 99) return { error: "Cantidad no válida." };
    items.push({ id, qty });
  }
  const ship: Ship = r.ship === "store" ? "store" : "home";
  const c = (r.customer ?? {}) as Record<string, unknown>;
  const customer = { name: str(c.name, 120), email: str(c.email, 160), phone: str(c.phone, 30), address: str(c.address, 200), zip: str(c.zip, 5), city: str(c.city, 80) };
  if (customer.name.length < 3) return { error: "Falta el nombre." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(customer.email)) return { error: "El email no es válido." };
  if (customer.phone.replace(/[\s+().-]/g, "").length < 9) return { error: "El teléfono no es válido." };
  if (ship === "home" && (customer.address.length < 5 || !/^\d{5}$/.test(customer.zip) || customer.city.length < 2)) return { error: "Falta la dirección de envío." };
  return { order: { items, ship, customer, promo: str(r.promo, 20).toUpperCase() } };
}

/** Calcula importes en céntimos con los precios del servidor. */
export function priceOrder(order: Payload) {
  const promo = order.promo === site.promo.code;
  const lines = order.items.map(({ id, qty }) => {
    const p = products.find((x) => x.id === id)!;
    const unit = Math.round(p.price * 100 * (promo ? 1 - site.promo.percent / 100 : 1));
    return { id, name: promo ? `${p.name} (−${site.promo.percent} %)` : p.name, qty, unit, image: new URL(`/img/${p.img}.webp`, site.url).href };
  });
  const subtotal = order.items.reduce((s, { id, qty }) => s + Math.round(products.find((x) => x.id === id)!.price * 100) * qty, 0);
  const shipping = order.ship === "store" || subtotal >= site.shipping.freeFrom * 100 ? 0 : Math.round(site.shipping.cost * 100);
  const total = lines.reduce((s, l) => s + l.unit * l.qty, 0) + shipping;
  return { lines, shipping, total, promo };
}

export default async (req: Request) => {
  if (req.method !== "POST") return json(405, { error: "Método no permitido." });
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return json(503, { error: "El pago online no está activado todavía. Llámanos y te ayudamos con el pedido." });

  let raw: unknown;
  try { raw = await req.json(); } catch { return json(400, { error: "Pedido no válido." }); }
  const parsed = parseOrder(raw);
  if ("error" in parsed) return json(400, parsed);
  const { order } = parsed;
  const { lines, shipping } = priceOrder(order);

  const base = process.env.PUBLIC_SITE_URL || new URL(req.url).origin;
  const form = new URLSearchParams();
  form.set("mode", "payment");
  form.set("locale", "es");
  form.set("customer_email", order.customer.email);
  form.set("success_url", `${base}/pedido-confirmado?sesion={CHECKOUT_SESSION_ID}`);
  form.set("cancel_url", `${base}/productos?pago=cancelado`);
  form.set("metadata[ship]", order.ship);
  form.set("metadata[name]", order.customer.name);
  form.set("metadata[phone]", order.customer.phone);
  if (order.ship === "home") form.set("metadata[address]", `${order.customer.address}, ${order.customer.zip} ${order.customer.city}`);
  lines.forEach((l, i) => {
    form.set(`line_items[${i}][quantity]`, String(l.qty));
    form.set(`line_items[${i}][price_data][currency]`, "eur");
    form.set(`line_items[${i}][price_data][unit_amount]`, String(l.unit));
    form.set(`line_items[${i}][price_data][product_data][name]`, l.name);
    form.set(`line_items[${i}][price_data][product_data][images][0]`, l.image);
  });
  if (shipping) {
    const i = lines.length;
    form.set(`line_items[${i}][quantity]`, "1");
    form.set(`line_items[${i}][price_data][currency]`, "eur");
    form.set(`line_items[${i}][price_data][unit_amount]`, String(shipping));
    form.set(`line_items[${i}][price_data][product_data][name]`, "Envío a domicilio 24/48 h");
  }

  try {
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    });
    const data = (await res.json()) as { url?: string; error?: { message?: string } };
    if (!res.ok || !data.url) {
      console.error("Stripe error", res.status, data.error?.message);
      return json(502, { error: "No hemos podido iniciar el pago. Inténtalo de nuevo en unos minutos." });
    }
    return json(200, { url: data.url });
  } catch (err) {
    console.error("Stripe fetch failed", err);
    return json(502, { error: "No hemos podido conectar con la pasarela de pago." });
  }
};

export const config = { path: "/api/checkout" };
