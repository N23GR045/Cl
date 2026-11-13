// Pruebas de la función de pago (sin red: fetch simulado). Ejecuta: node --test tests/
import { test } from "node:test";
import assert from "node:assert/strict";
import handler, { parseOrder, priceOrder } from "../netlify/functions/checkout.mts";

const customer = { name: "Ana Pérez", email: "ana@correo.com", phone: "600 123 456", address: "Calle Mayor 3", zip: "46001", city: "Valencia" };
const post = (body) => new Request("https://tienda.test/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

function mockStripe() {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url, body: new URLSearchParams(init.body.toString()), auth: init.headers.Authorization });
    return new Response(JSON.stringify({ url: "https://checkout.stripe.com/c/pay/cs_test_123" }), { status: 200 });
  };
  return calls;
}

test("sin clave de Stripe responde 503 con un mensaje útil", async () => {
  delete process.env.STRIPE_SECRET_KEY;
  const res = await handler(post({ items: [{ id: "led-240", qty: 1 }], ship: "home", customer }));
  assert.equal(res.status, 503);
  assert.match((await res.json()).error, /no está activado/);
});

test("solo acepta POST", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_x";
  const res = await handler(new Request("https://tienda.test/api/checkout"));
  assert.equal(res.status, 405);
});

test("rechaza pedidos no válidos", () => {
  assert.ok("error" in parseOrder(null));
  assert.ok("error" in parseOrder({ items: [], ship: "home", customer }));
  assert.ok("error" in parseOrder({ items: [{ id: "no-existe", qty: 1 }], ship: "home", customer }));
  assert.ok("error" in parseOrder({ items: [{ id: "led-240", qty: 0 }], ship: "home", customer }));
  assert.ok("error" in parseOrder({ items: [{ id: "led-240", qty: 1.5 }], ship: "home", customer }));
  assert.ok("error" in parseOrder({ items: [{ id: "led-240", qty: 1 }], ship: "home", customer: { ...customer, email: "mal" } }));
  assert.ok("error" in parseOrder({ items: [{ id: "led-240", qty: 1 }], ship: "home", customer: { ...customer, zip: "460" } }));
  assert.ok("order" in parseOrder({ items: [{ id: "led-240", qty: 1 }], ship: "store", customer: { ...customer, address: "", zip: "", city: "" } }));
});

test("ignora precios enviados por el navegador y usa los del catálogo", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_x";
  const calls = mockStripe();
  const res = await handler(post({ items: [{ id: "led-240", qty: 2, price: 0.01 }], ship: "home", customer }));
  assert.equal(res.status, 200);
  assert.equal((await res.json()).url, "https://checkout.stripe.com/c/pay/cs_test_123");
  const b = calls[0].body;
  assert.equal(calls[0].auth, "Bearer sk_test_x");
  assert.equal(b.get("line_items[0][price_data][unit_amount]"), "18990");
  assert.equal(b.get("line_items[0][quantity]"), "2");
  assert.equal(b.get("line_items[1][price_data][unit_amount]"), null, "por encima de 49 € no se cobra envío");
});

test("aplica RAIZ10 y cobra envío por debajo de 49 €", () => {
  const { order } = parseOrder({ items: [{ id: "termo", qty: 1 }], promo: "raiz10", ship: "home", customer });
  const p = priceOrder(order);
  assert.equal(p.promo, true);
  assert.equal(p.lines[0].unit, 1125); // 12,50 € −10 %
  assert.equal(p.shipping, 495);
  assert.equal(p.total, 1125 + 495);
});

test("recogida en tienda: sin envío", () => {
  const { order } = parseOrder({ items: [{ id: "termo", qty: 1 }], ship: "store", customer });
  assert.equal(priceOrder(order).shipping, 0);
});

test("si Stripe falla devuelve 502 sin filtrar detalles", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_x";
  globalThis.fetch = async () => new Response(JSON.stringify({ error: { message: "Invalid API Key provided: sk_test_x" } }), { status: 401 });
  const orig = console.error; console.error = () => {};
  const res = await handler(post({ items: [{ id: "led-240", qty: 1 }], ship: "home", customer }));
  console.error = orig;
  assert.equal(res.status, 502);
  assert.doesNotMatch(JSON.stringify(await res.json()), /sk_test|Invalid API/);
});
