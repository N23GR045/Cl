# La Tele 📺

Televisión sencillísima para el Fire TV (pensada para mayores): se abre directamente en el último canal y se maneja con tres botones.

| Botón del mando | Qué hace |
|---|---|
| ▲ / ▼ | Canal siguiente / anterior |
| OK | Lista de canales (o abre la app oficial en Antena 3, Cuatro, Telecinco, laSexta y Telemadrid) |
| ◀ / ▶ | Ver qué echan ahora y después |
| Atrás | Lista de canales (Inicio para salir) |
| ☰ | **Modo nieto**: elegir qué canales aparecen |

- Canales con emisión directa: La 1, La 2, TRECE, 24h, Teledeporte, Clan, Euronews y autonómicas (se activan en modo nieto).
- **Cine y series** (▶ en el mando o deslizar a la izquierda): unos 600 canales 24/7 gratis y oficiales (Pluto TV, Rakuten TV, Samsung TV Plus, Tubi, Runtime…) en español, inglés, francés, italiano, portugués, alemán y catalán. Lista generada cada lunes por `tools/cine.py` desde iptv-org, aceptando solo servidores oficiales. Idiomas en modo nieto.
- Más canales gratis (Pluto TV, Rakuten TV, Samsung TV Plus, locales) de [iptv-org](https://github.com/iptv-org/iptv), dominio público: se activan en modo nieto. Se descartan reenvíos de canales de pago o que solo se emiten en su app.
- Fuente: [TDTChannels](https://github.com/LaQuay/TDTChannels) (Apache-2.0), solo emisiones oficiales en abierto. La lista y la guía se actualizan solas.
- Antena 3, laSexta, Telecinco, Cuatro y Telemadrid no tienen emisión directa pública: se abren en Atresplayer, Mediaset Infinity o Telemadrid (gratis).

## Instalar en el Fire TV
1. Fire TV › Buscar › instalar **Downloader** (AFTVnews).
2. Ajustes › Mi Fire TV › Opciones para desarrolladores › Instalar apps desconocidas › Downloader: **Activado**.
   (Si no aparece «Opciones para desarrolladores»: Ajustes › Mi Fire TV › Información › pulsar 7 veces sobre el nombre del dispositivo.)
3. En Downloader escribir: `https://github.com/N23GR045/Cl/releases/latest/download/LaTele.apk` › Instalar › Abrir.
4. Opcional: instalar también **Atresplayer** y **Mediaset Infinity** desde la tienda del Fire TV.
5. Mantener pulsado Inicio › Apps › mover **La Tele** a la primera fila.

## Compilar
GitHub Actions (`.github/workflows/la-tele.yml`) ejecuta los tests, genera el APK y lo publica en Releases.
Firma estable opcional con los Secrets `LATELE_KEYSTORE_B64`, `LATELE_KS_PASS`, `LATELE_KEY_ALIAS`, `LATELE_KEY_PASS`.
