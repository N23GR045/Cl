#!/usr/bin/env python3
"""Genera la lista «Cine y series» de La Tele a partir de iptv-org (dominio público).

Solo canales 24/7 de películas o series, gratuitos y públicos (Pluto TV, Samsung TV Plus, Rakuten TV,
Plex, Runtime, cadenas en abierto…), en varios idiomas. Quita: canales cerrados, NSFW, los que iptv-org
tiene bloqueados por reclamaciones de derechos (blocklist.csv) y nombres de canales de pago conocidos.
Uso: cine.py <repo iptv-org/iptv> <repo iptv-org/database> <salida.m3u>
"""
import csv, os, re, sys, unicodedata

IPTV, DB, OUT = sys.argv[1:4]
IDIOMAS = [("spa", "Español"), ("eng", "English"), ("fra", "Français"), ("ita", "Italiano"),
           ("por", "Português"), ("deu", "Deutsch"), ("cat", "Català")]
CATS = {"movies": "Cine", "series": "Series", "classic": "Clásicos", "animation": "Animación"}
DE_PAGO = ["axn", "amc", "hbo", "sky", "tnt", "syfy", "warner", "fox", "cinemax", "showtime", "starz",
           "canal plus", "canal+", "movistar", "dazn", "paramount network", "comedy central", "calle 13",
           "cosmo", "hollywood", "tcm", "mgm", "epix", "sundance", "ifc", "filmbox", "film1", "ciné+"]

# Solo se aceptan enlaces de servicios gratuitos oficiales (FAST) o de cadenas en abierto.
# Así se descartan los reenvíos desde IPs o servidores cualquiera, aunque estén en la lista de la comunidad.
HOSTS_OFICIALES = {
    "jmp2.uk": "/plu-",            # Pluto TV (redirección pública a su CDN)
    "amagi.tv": "", "wurl.tv": "", "wurl.com": "",  # Samsung TV Plus, LG Channels, Xumo, Roku…
    "tubi.video": "",              # Tubi
    "getpublica.com": "", "frequency.stream": "",
    "otteravision.com": "", "ottera.tv": "",  # Runtime
    "rtve.es": "", "3catdirectes.cat": "", "mediaset.net": "",
}

def oficial(url, nombre):
    m = re.match(r"https?://([^/:]+)", url)
    if not m:
        return False
    host = m.group(1).lower()
    if host.endswith("amazonaws.com") and "rakuten" in nombre.lower():
        return True
    for dom, ruta in HOSTS_OFICIALES.items():
        if host == dom or host.endswith("." + dom):
            return ruta in url
    return False

def norm(s):
    s = unicodedata.normalize("NFD", s.lower())
    s = "".join(c for c in s if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9+]+", " ", s).strip()

def leer(n):
    with open(os.path.join(DB, "data", n), newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))

bloqueados = {r["channel"] for r in leer("blocklist.csv")}
canales = {}
for r in leer("channels.csv"):
    cats = [c for c in r["categories"].split(";") if c in CATS]
    if not cats or r["is_nsfw"] == "TRUE" or r["closed"] or r["id"] in bloqueados:
        continue
    if any(norm(p) in norm(r["name"]).split(" ") or norm(r["name"]).startswith(norm(p)) for p in DE_PAGO):
        continue
    canales[r["id"]] = (r["name"], cats)

idiomas_feed, idiomas_canal = {}, {}
for r in leer("feeds.csv"):
    ls = [l for l in r["languages"].split(";") if l]
    idiomas_feed[(r["channel"], r["id"])] = ls
    if r["is_main"] == "TRUE" or r["channel"] not in idiomas_canal:
        idiomas_canal[r["channel"]] = ls

orden = {c: i for i, (c, _) in enumerate(IDIOMAS)}
nombre_idioma = dict(IDIOMAS)
salida = {}
for fn in sorted(os.listdir(os.path.join(IPTV, "streams"))):
    if not fn.endswith(".m3u"):
        continue
    info = None
    for linea in open(os.path.join(IPTV, "streams", fn), encoding="utf-8"):
        l = linea.strip()
        if l.startswith("#EXTINF"):
            m = re.search(r'tvg-id="([^"]*)"', l)
            info = m.group(1) if m else None
        elif l.startswith("http") and info:
            cid, _, feed = info.partition("@")
            if cid in canales and oficial(l, canales[cid][0]):
                ls = idiomas_feed.get((cid, feed)) or idiomas_canal.get(cid) or []
                lang = min((x for x in ls if x in orden), key=lambda x: orden[x], default=None)
                if lang:
                    nombre, cats = canales[cid]
                    k = (lang, cid)
                    salida.setdefault(k, {"nombre": nombre, "cat": CATS[cats[0]], "urls": []})
                    if l not in salida[k]["urls"]:
                        salida[k]["urls"].append(l)
            info = None
        elif not l.startswith("#"):
            info = None

filas = sorted(salida.items(), key=lambda kv: (orden[kv[0][0]], kv[1]["cat"], kv[1]["nombre"].lower()))
with open(OUT, "w", encoding="utf-8") as f:
    f.write("#EXTM3U\n# La Tele · Cine y series · fuente: iptv-org (dominio público)\n")
    for (lang, cid), d in filas:
        g = f'{nombre_idioma[lang]} · {d["cat"]}'
        for u in d["urls"]:
            f.write(f'#EXTINF:-1 tvg-id="{cid}" tvg-language="{lang}" group-title="{g}",{d["nombre"]}\n{u}\n')
cuenta = {}
for (lang, _), d in filas:
    cuenta[nombre_idioma[lang]] = cuenta.get(nombre_idioma[lang], 0) + 1
print(len(filas), "canales:", cuenta)
