import type { APIRoute } from "astro";

// robots.txt generado con el dominio real (PUBLIC_SITE_URL).
export const GET: APIRoute = ({ site }) =>
  new Response(`User-agent: *\nAllow: /\nDisallow: /404\n\nSitemap: ${new URL("sitemap-index.xml", site).href}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
