// ---------- Datos ----------
const CATEGORIES = [
  { id: "iluminacion", name: "Iluminación", icon: "💡", desc: "LED, bombillas, timers" },
  { id: "armarios", name: "Armarios", icon: "🏠", desc: "Kits y carpas" },
  { id: "sustratos", name: "Sustratos", icon: "🪴", desc: "Tierra, coco, perlita" },
  { id: "nutrientes", name: "Nutrientes", icon: "🧪", desc: "Abonos y aditivos" },
  { id: "clima", name: "Clima", icon: "🌬️", desc: "Extracción y filtros" },
  { id: "hidroponia", name: "Hidroponía", icon: "💧", desc: "Sistemas y medidores" },
];

const PRODUCTS = [
  { id: "led-240", cat: "iluminacion", name: "Panel LED Full Spectrum 240 W", desc: "Espectro completo regulable. Ideal para 80×80 cm.", price: 189.9, old: 229, icon: "💡", tint: "#fff4d1", badge: "Top ventas" },
  { id: "led-120", cat: "iluminacion", name: "Panel LED Quantum 120 W", desc: "Bajo consumo para espacios de 60×60 cm.", price: 99.9, icon: "🔆", tint: "#fff4d1" },
  { id: "armario-80", cat: "armarios", name: "Armario de cultivo 80×80×160", desc: "Tela Mylar reflectante 600D y estructura metálica.", price: 79.5, icon: "🏠", tint: "#e4efe2" },
  { id: "armario-120", cat: "armarios", name: "Armario de cultivo 120×120×200", desc: "Doble puerta y ventanas de ventilación.", price: 139, old: 159, icon: "🏡", tint: "#e4efe2", badge: "Oferta" },
  { id: "sustrato-50", cat: "sustratos", name: "Sustrato Light Mix 50 L", desc: "Turba ligera con perlita, pH ajustado.", price: 14.95, icon: "🪴", tint: "#f1e4d6" },
  { id: "coco-50", cat: "sustratos", name: "Fibra de coco 50 L", desc: "Lavada y tamponada. Excelente aireación.", price: 16.5, icon: "🥥", tint: "#f1e4d6" },
  { id: "nutri-grow", cat: "nutrientes", name: "Pack Grow + Bloom 1 L", desc: "Abono mineral para crecimiento y floración.", price: 24.9, icon: "🧪", tint: "#e6e4f5", badge: "Nuevo" },
  { id: "nutri-bio", cat: "nutrientes", name: "Abono orgánico Bio 1 L", desc: "100 % orgánico, apto para agricultura ecológica.", price: 19.9, icon: "🌿", tint: "#e6e4f5" },
  { id: "extractor", cat: "clima", name: "Kit extracción 125 mm + filtro", desc: "Extractor silencioso con filtro de carbón activo.", price: 89, old: 105, icon: "🌬️", tint: "#e0eef3" },
  { id: "termo", cat: "clima", name: "Termohigrómetro digital", desc: "Registro de máximas y mínimas con sonda.", price: 12.5, icon: "🌡️", tint: "#e0eef3" },
  { id: "hidro-kit", cat: "hidroponia", name: "Sistema hidropónico DWC 4 macetas", desc: "Cultivo en agua con bomba de aire incluida.", price: 74.9, icon: "💧", tint: "#dff0ee" },
  { id: "ph-meter", cat: "hidroponia", name: "Medidor de pH y EC digital", desc: "Calibración automática y compensación de temperatura.", price: 34.9, icon: "📟", tint: "#dff0ee" },
];

const EXTRA = {
  "kit-interior": { id: "kit-interior", name: "Kit completo de cultivo interior", price: 299, icon: "📦", tint: "#e4efe2" },
};

const FREE_SHIPPING = 49;
const fmt = (n) => n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
const findProduct = (id) => PRODUCTS.find((p) => p.id === id) || EXTRA[id];
const $ = (s) => document.querySelector(s);

// Almacenamiento seguro (puede fallar en modo privado)
const store = {
  get(k, fallback) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch { return fallback; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

// ---------- Aviso de edad ----------
const ageGate = $("#ageGate");
if (!store.get("rv-age-ok", false)) {
  ageGate.hidden = false;
  $("#ageYes").focus();
}
$("#ageYes").addEventListener("click", () => {
  store.set("rv-age-ok", true);
  ageGate.hidden = true;
});

// ---------- Menú móvil ----------
const nav = $("#nav");
const menuBtn = $("#menuBtn");
menuBtn.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  menuBtn.setAttribute("aria-expanded", open);
});
nav.addEventListener("click", (e) => {
  if (e.target.tagName === "A") {
    nav.classList.remove("open");
    menuBtn.setAttribute("aria-expanded", "false");
  }
});

// ---------- Categorías y filtros ----------
let activeFilter = "todos";

$("#catGrid").innerHTML = CATEGORIES.map((c) => `
  <button class="cat" data-cat="${c.id}">
    <div class="cat-icon" aria-hidden="true">${c.icon}</div>
    <strong>${c.name}</strong>
    <small>${c.desc}</small>
  </button>`).join("");

function renderFilters() {
  const all = [{ id: "todos", name: "Todos" }, ...CATEGORIES];
  $("#filters").innerHTML = all.map((c) => `
    <button class="chip" role="tab" data-filter="${c.id}" aria-selected="${c.id === activeFilter}">${c.name}</button>`).join("");
}

function renderProducts() {
  const list = activeFilter === "todos" ? PRODUCTS : PRODUCTS.filter((p) => p.cat === activeFilter);
  const catName = (id) => CATEGORIES.find((c) => c.id === id).name;
  $("#productGrid").innerHTML = list.map((p) => `
    <article class="card">
      <div class="card-media" style="background:${p.tint}" aria-hidden="true">
        ${p.badge ? `<span class="badge">${p.badge}</span>` : ""}${p.icon}
      </div>
      <div class="card-body">
        <span class="card-cat">${catName(p.cat)}</span>
        <h3>${p.name}</h3>
        <p>${p.desc}</p>
        <div class="card-foot">
          <span class="price">${fmt(p.price)}${p.old ? `<s>${fmt(p.old)}</s>` : ""}</span>
          <button class="add-btn" data-add="${p.id}" aria-label="Añadir ${p.name} al carrito">+</button>
        </div>
      </div>
    </article>`).join("");
}

function setFilter(id) {
  activeFilter = id;
  renderFilters();
  renderProducts();
}

$("#filters").addEventListener("click", (e) => {
  const b = e.target.closest("[data-filter]");
  if (b) setFilter(b.dataset.filter);
});
$("#catGrid").addEventListener("click", (e) => {
  const b = e.target.closest("[data-cat]");
  if (!b) return;
  setFilter(b.dataset.cat);
  $("#productos").scrollIntoView({ behavior: "smooth" });
});

setFilter("todos");

// ---------- Carrito ----------
let cart = store.get("rv-cart", {});
const cartEl = $("#cart");
const overlay = $("#overlay");

function openCart() {
  $("#toast").classList.remove("show");
  cartEl.classList.add("open");
  cartEl.setAttribute("aria-hidden", "false");
  overlay.hidden = false;
  $("#cartClose").focus();
}
function closeCart() {
  cartEl.classList.remove("open");
  cartEl.setAttribute("aria-hidden", "true");
  overlay.hidden = true;
}

function addToCart(id) {
  cart[id] = (cart[id] || 0) + 1;
  saveCart();
  toast(`Añadido: ${findProduct(id).name}`);
}

function changeQty(id, delta) {
  cart[id] = (cart[id] || 0) + delta;
  if (cart[id] <= 0) delete cart[id];
  saveCart();
}

function saveCart() {
  store.set("rv-cart", cart);
  renderCart();
}

function renderCart() {
  const ids = Object.keys(cart).filter(findProduct);
  const count = ids.reduce((n, id) => n + cart[id], 0);
  const total = ids.reduce((s, id) => s + findProduct(id).price * cart[id], 0);

  $("#cartCount").textContent = count;
  $("#cartTotal").textContent = fmt(total);

  $("#cartItems").innerHTML = ids.length
    ? ids.map((id) => {
        const p = findProduct(id);
        return `
        <li class="cart-item">
          <div class="cart-thumb" style="background:${p.tint}" aria-hidden="true">${p.icon}</div>
          <div>
            <h3>${p.name}</h3>
            <div class="qty">
              <button data-dec="${id}" aria-label="Quitar uno">−</button>
              <span>${cart[id]}</span>
              <button data-inc="${id}" aria-label="Añadir uno">+</button>
            </div>
          </div>
          <div>
            <div class="line-price">${fmt(p.price * cart[id])}</div>
            <button class="remove" data-remove="${id}">Eliminar</button>
          </div>
        </li>`;
      }).join("")
    : `<li class="cart-empty">Tu carrito está vacío 🌱</li>`;

  const missing = FREE_SHIPPING - total;
  $("#shippingNote").textContent = total === 0
    ? `Envío gratis a partir de ${fmt(FREE_SHIPPING)}`
    : missing > 0
      ? `Te faltan ${fmt(missing)} para el envío gratis`
      : "¡Tienes envío gratis! 🎉";
  $("#checkout").disabled = total === 0;
}

document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-add],[data-inc],[data-dec],[data-remove]");
  if (!t) return;
  if (t.dataset.add) addToCart(t.dataset.add);
  if (t.dataset.inc) changeQty(t.dataset.inc, 1);
  if (t.dataset.dec) changeQty(t.dataset.dec, -1);
  if (t.dataset.remove) { delete cart[t.dataset.remove]; saveCart(); }
});

$("#cartBtn").addEventListener("click", openCart);
$("#cartClose").addEventListener("click", closeCart);
overlay.addEventListener("click", closeCart);
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeCart(); });

$("#checkout").addEventListener("click", () => {
  cart = {};
  saveCart();
  closeCart();
  toast("¡Gracias por tu pedido! Te enviaremos la confirmación por email.");
});

renderCart();

// ---------- Newsletter ----------
$("#newsletter").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = $("#email");
  const msg = $("#formMsg");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())) {
    msg.textContent = "Introduce un correo electrónico válido.";
    input.focus();
    return;
  }
  msg.textContent = "¡Listo! Revisa tu correo: tu código es RAIZ10.";
  input.value = "";
});

// ---------- Utilidades ----------
let toastTimer;
function toast(text) {
  const el = $("#toast");
  el.textContent = text;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2400);
}

$("#year").textContent = new Date().getFullYear();
