package es.latele.abuela

import android.content.Context
import android.util.Xml
import org.xmlpull.v1.XmlPullParser
import java.io.File
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.zip.GZIPInputStream

/** Un canal. Si [appClave] no es null, el canal no tiene emisión directa y se abre en su app oficial. */
data class Canal(
    val nombre: String,
    val urls: List<String>,
    val epg: String?,
    val appClave: String?,
    val appNombre: String?,
    val grupo: String,
    val visiblePorDefecto: Boolean,
) {
    val esApp get() = appClave != null
}

data class Programa(val inicio: Long, val fin: Long, val titulo: String)

/** Lista de canales con sus ajustes (visibles, último canal) y actualización desde TDTChannels. */
class Repositorio(private val ctx: Context) {

    private val prefs = ctx.getSharedPreferences("latele", Context.MODE_PRIVATE)
    private val cacheLista = File(ctx.filesDir, "tv.m3u8")

    /** URLs actualizadas por identificador de guía (tvg-id), leídas de la lista oficial. */
    @Volatile private var urlsFrescas: Map<String, List<String>> = emptyMap()

    @Volatile var guia: Map<String, List<Programa>> = emptyMap()
        private set

    init {
        if (cacheLista.exists()) runCatching { urlsFrescas = parsearM3u(cacheLista.readText()) }
    }

    fun todos(): List<Canal> = CanalesIncluidos.lista.map { c ->
        val frescas = c.epg?.let { urlsFrescas[it] }.orEmpty()
        if (c.esApp || frescas.isEmpty()) c else c.copy(urls = (frescas + c.urls).distinct())
    }

    fun visibles(): List<Canal> = todos().filter { esVisible(it) }

    fun esVisible(c: Canal) = prefs.getBoolean("ver_" + c.nombre, c.visiblePorDefecto)

    fun ponerVisible(c: Canal, v: Boolean) = prefs.edit().putBoolean("ver_" + c.nombre, v).apply()

    fun restablecer() {
        val e = prefs.edit()
        CanalesIncluidos.lista.forEach { e.remove("ver_" + it.nombre) }
        e.apply()
    }

    var ultimoCanal: String?
        get() = prefs.getString("ultimo", null)
        set(v) { prefs.edit().putString("ultimo", v).apply() }

    /** Descarga la lista oficial (en segundo plano). Si falla, se queda la copia guardada. */
    fun actualizarLista() {
        runCatching {
            val texto = descargar(URL_LISTA).use { it.bufferedReader().readText() }
            val mapa = parsearM3u(texto)
            if (mapa.isNotEmpty()) {
                urlsFrescas = mapa
                cacheLista.writeText(texto)
            }
        }
    }

    /** Descarga la guía XMLTV y se queda solo con los canales de la app, de ahora a +24 h. */
    fun actualizarGuia() {
        runCatching {
            val ids = CanalesIncluidos.lista.mapNotNull { it.epg }.toSet()
            val ahora = System.currentTimeMillis()
            val limite = ahora + 24 * 3600_000L
            val res = HashMap<String, MutableList<Programa>>()
            descargar(URL_GUIA).use { bruto ->
                val p = Xml.newPullParser()
                p.setInput(GZIPInputStream(bruto.buffered()), "UTF-8")
                var id: String? = null
                var ini = 0L
                var fin = 0L
                var titulo: String? = null
                var enTitulo = false
                var ev = p.eventType
                while (ev != XmlPullParser.END_DOCUMENT) {
                    when (ev) {
                        XmlPullParser.START_TAG -> when (p.name) {
                            "programme" -> {
                                id = p.getAttributeValue(null, "channel")?.takeIf { it in ids }
                                if (id != null) {
                                    ini = fecha(p.getAttributeValue(null, "start"))
                                    fin = fecha(p.getAttributeValue(null, "stop"))
                                    titulo = null
                                }
                            }
                            "title" -> enTitulo = id != null && titulo == null
                        }
                        XmlPullParser.TEXT -> if (enTitulo) titulo = p.text?.trim()
                        XmlPullParser.END_TAG -> when (p.name) {
                            "title" -> enTitulo = false
                            "programme" -> {
                                val i = id
                                val t = titulo
                                if (i != null && t != null && fin > ahora && ini < limite && fin > ini) {
                                    res.getOrPut(i) { mutableListOf() }.add(Programa(ini, fin, t))
                                }
                                id = null
                            }
                        }
                    }
                    ev = p.next()
                }
            }
            guia = res.mapValues { (_, l) -> l.sortedBy { it.inicio }.distinctBy { it.inicio } }
        }
    }

    /** Programa actual y siguiente de un canal. */
    fun ahoraYDespues(c: Canal): Pair<Programa?, Programa?> {
        val l = c.epg?.let { guia[it] } ?: return null to null
        val t = System.currentTimeMillis()
        val i = l.indexOfFirst { t >= it.inicio && t < it.fin }
        if (i < 0) return null to l.firstOrNull { it.inicio > t }
        return l[i] to l.getOrNull(i + 1)
    }

    companion object {
        const val URL_LISTA = "https://www.tdtchannels.com/lists/tv.m3u8"
        const val URL_GUIA = "https://www.tdtchannels.com/epg/TV.xml.gz"
        const val USER_AGENT = "Mozilla/5.0 (Linux; Android 9; AFTMM) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36 LaTele/1.0"

        private val formato = SimpleDateFormat("yyyyMMddHHmmss Z", Locale.US)

        fun fecha(s: String?): Long = runCatching {
            synchronized(formato) { formato.parse(s!!.trim())!!.time }
        }.getOrDefault(0L)

        fun descargar(url: String): InputStream {
            val c = URL(url).openConnection() as HttpURLConnection
            c.connectTimeout = 10_000
            c.readTimeout = 30_000
            c.instanceFollowRedirects = true
            c.setRequestProperty("User-Agent", USER_AGENT)
            if (c.responseCode !in 200..299) error("HTTP ${c.responseCode}")
            return c.inputStream
        }

        /** Lee una lista M3U y devuelve tvg-id -> URLs (en orden, sin repetir). Tolerante con listas raras. */
        fun parsearM3u(texto: String): Map<String, List<String>> {
            val res = LinkedHashMap<String, MutableList<String>>()
            var id: String? = null
            texto.removePrefix("﻿").lineSequence().forEach { bruta ->
                val l = bruta.trim()
                when {
                    l.startsWith("#EXTINF", ignoreCase = true) ->
                        id = Regex("""tvg-id\s*=\s*"?([^"\s,]+)"?""").find(l)?.groupValues?.get(1)
                    l.isEmpty() || l.startsWith("#") -> Unit
                    else -> {
                        val i = id
                        if (i != null && l.startsWith("http")) {
                            val lista = res.getOrPut(i) { mutableListOf() }
                            if (l !in lista) lista.add(l)
                        }
                        id = null
                    }
                }
            }
            return res
        }
    }
}
