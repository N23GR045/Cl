// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// URL pública: defínela en el hosting como PUBLIC_SITE_URL (ver README).
const site = process.env.PUBLIC_SITE_URL || "https://www.raizverde.example";

export default defineConfig({
  site,
  trailingSlash: "never",
  build: { format: "file", inlineStylesheets: "auto", assets: "assets" },
  compressHTML: true,
  integrations: [sitemap({ filter: (page) => !page.includes("/404") })],
});
