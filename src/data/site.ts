// Datos del negocio. Todo lo marcado con DEMO es de ejemplo: cámbialo por tus datos reales.
export const site = {
  name: "Raíz Verde",
  legalName: "Raíz Verde SL", // DEMO
  taxId: "B00000000", // DEMO
  tagline: "Grow shop en Valencia",
  description:
    "Iluminación LED, armarios, sustratos, nutrientes, hidroponía, accesorios de fumador y CBD. Envío discreto en 24/48 h y asesoría de cultivadores.",
  // En Astro llega de astro.config (PUBLIC_SITE_URL); fuera de Astro (funciones de servidor) usa la variable de entorno.
  url: ((import.meta as { env?: Record<string, string> }).env?.SITE ?? globalThis.process?.env?.PUBLIC_SITE_URL ?? "https://www.raizverde.example") as string,
  locale: "es_ES",
  lang: "es",
  phone: "960\u00a0000\u00a0000", // DEMO (espacios no separables)
  phoneE164: "+34960000000", // DEMO
  email: "hola@raizverde.example", // DEMO
  address: { street: "Calle de las Semillas 12", postalCode: "46001", city: "Valencia", region: "Valencia", country: "ES" }, // DEMO
  hours: [
    { days: "Lunes a viernes", time: "10:00–14:00 y 17:00–20:30", schema: ["Mo-Fr 10:00-14:00", "Mo-Fr 17:00-20:30"] },
    { days: "Sábado", time: "10:00–14:00", schema: ["Sa 10:00-14:00"] },
  ],
  shipping: { freeFrom: 49, cost: 4.95, cutoffHour: 14 },
  promo: { code: "RAIZ10", percent: 10 },
  /** true mientras las opiniones y cifras sean de ejemplo: muestra un aviso visible. */
  demoContent: true,
  /** true mientras el pago no esté conectado a una pasarela real. */
  demoCheckout: true,
} as const;

export const formatPrice = (n: number) => n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
