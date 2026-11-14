package es.latele.abuela

import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.TypedValue
import android.view.GestureDetector
import android.view.Gravity
import android.view.KeyEvent
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.view.animation.DecelerateInterpolator
import android.widget.FrameLayout
import android.widget.GridLayout
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import androidx.annotation.OptIn
import androidx.media3.common.MediaItem
import androidx.media3.common.MimeTypes
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.datasource.DefaultHttpDataSource
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory
import androidx.media3.ui.AspectRatioFrameLayout
import androidx.media3.ui.PlayerView
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * La Tele: televisión sencilla para el Fire TV.
 * ▲ / ▼ cambian de canal · OK abre la lista (o la app oficial del canal) · ☰ modo nieto para elegir canales.
 */
@OptIn(UnstableApi::class)
class MainActivity : Activity() {

    private lateinit var repo: Repositorio
    private val h = Handler(Looper.getMainLooper())

    private var player: ExoPlayer? = null
    private var canales: List<Canal> = emptyList()
    private var actual = 0
    private var urlIdx = 0
    private var pendiente = -1
    private var digitos = ""

    // Vistas
    private lateinit var raiz: FrameLayout
    private lateinit var video: PlayerView
    private lateinit var cargando: LinearLayout
    private lateinit var cargandoTxt: TextView
    private lateinit var aviso: LinearLayout
    private lateinit var avisoTitulo: TextView
    private lateinit var avisoTexto: TextView
    private lateinit var avisoPista: TextView
    private lateinit var banner: LinearLayout
    private lateinit var bNumero: TextView
    private lateinit var bLado: TextView
    private lateinit var cortinilla: TextView
    private lateinit var bNombre: TextView
    private lateinit var bAhora: TextView
    private lateinit var bProgreso: ProgressBar
    private lateinit var bDespues: TextView
    private lateinit var reloj: TextView
    private lateinit var lista: FrameLayout
    private lateinit var listaTitulo: TextView
    private lateinit var listaRejilla: GridLayout
    private var modoNieto = false
    private lateinit var gestos: GestureDetector

    private val horaFmt = SimpleDateFormat("HH:mm", Locale("es", "ES"))

    // Colores pensados para leer bien de lejos
    private val cFondo = Color.parseColor("#E6101826")
    private val cTarjeta = Color.parseColor("#FF1C2638")
    private val cAcento = Color.parseColor("#FFFFC83D")
    private val cTexto = Color.WHITE
    private val cTenue = Color.parseColor("#FFB8C2D6")

    // ---------- Ciclo de vida ----------

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        repo = Repositorio(this)
        construirVista()
        gestos = GestureDetector(this, object : GestureDetector.SimpleOnGestureListener() {
            override fun onDown(e: MotionEvent) = true
            override fun onSingleTapUp(e: MotionEvent): Boolean { tocar(); return true }
            override fun onLongPress(e: MotionEvent) { abrirLista(true) }
            override fun onFling(e1: MotionEvent?, e2: MotionEvent, vx: Float, vy: Float): Boolean {
                if (Math.abs(vx) > Math.abs(vy) && Math.abs(vx) > 600f) {
                    cambiarLado(if (vx < 0) "cine" else "tele")
                    return true
                }
                if (Math.abs(vy) < Math.abs(vx) || Math.abs(vy) < 600f) return false
                zapear(if (vy < 0) +1 else -1)
                return true
            }
        })
        lado = repo.lado
        canales = listaDelLado()
        actualizarEnSegundoPlano()
    }

    override fun onStart() {
        super.onStart()
        crearPlayer()
        val i = canales.indexOfFirst { it.nombre == ultimoDelLado() }.coerceAtLeast(0)
        sintonizar(i)
        tickReloj.run()
    }

    override fun onStop() {
        super.onStop()
        h.removeCallbacksAndMessages(null)
        player?.release()
        player = null
    }

    private fun actualizarEnSegundoPlano() {
        Thread {
            repo.actualizarLista()
            repo.actualizarExtras()
            repo.actualizarCine()
            runOnUiThread { recargarCanales() }
            repo.actualizarGuia()
            runOnUiThread { if (banner.visibility == View.VISIBLE) rellenarBanner(canales.getOrNull(actual)) }
        }.start()
        h.postDelayed({ actualizarEnSegundoPlano() }, 3 * 3600_000L)
    }

    /** Vuelve a leer los canales sin cortar el que se está viendo. */
    private fun recargarCanales() {
        val nombre = canales.getOrNull(actual)?.nombre
        canales = listaDelLado()
        actual = canales.indexOfFirst { it.nombre == nombre }.coerceAtLeast(0)
    }

    // ---------- Dos lados: «Tele» y «Cine y series» ----------

    private var lado = "tele"
    private val esCine get() = lado == "cine"

    private fun listaDelLado(): List<Canal> =
        if (esCine) repo.visiblesCine().ifEmpty { repo.visibles() }
        else repo.visibles().ifEmpty { repo.todos().take(1) }

    private fun ultimoDelLado() = if (esCine) repo.ultimoCine else repo.ultimoCanal

    /** Cambia de lado con una cortinilla: ▶ o deslizar a la izquierda = Cine y series; ◀ = Tele. */
    private fun cambiarLado(nuevo: String) {
        if (nuevo == lado) { canales.getOrNull(actual)?.let { mostrarBanner(it) }; return }
        if (nuevo == "cine" && repo.cine.isEmpty()) {
            Toast.makeText(this, "Cine y series se está descargando, prueba en un momento", Toast.LENGTH_LONG).show()
            return
        }
        lado = nuevo
        repo.lado = nuevo
        canales = listaDelLado()
        cortinilla.text = if (esCine) "🎬  Cine y series" else "📺  Tele"
        cortinilla.translationX = (if (esCine) 1 else -1) * raiz.width.toFloat()
        cortinilla.alpha = 1f
        cortinilla.visibility = View.VISIBLE
        cortinilla.animate().translationX(0f).setDuration(320).setInterpolator(DecelerateInterpolator()).withEndAction {
            val i = canales.indexOfFirst { it.nombre == ultimoDelLado() }.coerceAtLeast(0)
            sintonizar(i)
            cortinilla.animate().alpha(0f).setStartDelay(500).setDuration(260)
                .withEndAction { cortinilla.visibility = View.GONE; cortinilla.alpha = 1f }.start()
        }.start()
    }

    // ---------- Reproductor ----------

    private fun crearPlayer() {
        val http = DefaultHttpDataSource.Factory()
            .setUserAgent(Repositorio.USER_AGENT)
            .setAllowCrossProtocolRedirects(true)
            .setConnectTimeoutMs(10_000)
            .setReadTimeoutMs(15_000)
        val p = ExoPlayer.Builder(this)
            .setMediaSourceFactory(DefaultMediaSourceFactory(this).setDataSourceFactory(http))
            .build()
        p.playWhenReady = true
        p.addListener(object : Player.Listener {
            override fun onPlaybackStateChanged(estado: Int) {
                when (estado) {
                    Player.STATE_READY -> {
                        h.removeCallbacks(vigilante)
                        h.removeCallbacks(mostrarCargandoTarde)
                        ocultar(cargando)
                        ocultar(aviso)
                    }
                    Player.STATE_BUFFERING -> {
                        h.removeCallbacks(vigilante)
                        h.postDelayed(vigilante, 25_000)
                        h.postDelayed(mostrarCargandoTarde, 700)
                    }
                    else -> Unit
                }
            }

            override fun onPlayerError(error: PlaybackException) {
                if (error.errorCode == PlaybackException.ERROR_CODE_BEHIND_LIVE_WINDOW) {
                    player?.seekToDefaultPosition()
                    player?.prepare()
                } else {
                    probarSiguienteEnlace()
                }
            }
        })
        video.player = p
        player = p
    }

    private val vigilante = Runnable { probarSiguienteEnlace() }
    private val mostrarCargandoTarde = Runnable { mostrar(cargando) }
    private val reintento = Runnable {
        val c = canales.getOrNull(actual)
        if (c != null && !c.esApp) { urlIdx = 0; reproducir() }
    }

    /** Cambia al canal i (con vuelta al principio). */
    private fun sintonizar(i: Int) {
        if (canales.isEmpty()) return
        actual = modulo(i, canales.size)
        urlIdx = 0
        h.removeCallbacks(reintento)
        h.removeCallbacks(vigilante)
        val c = canales[actual]
        if (esCine) repo.ultimoCine = c.nombre else repo.ultimoCanal = c.nombre
        mostrarBanner(c)
        if (c.esApp) {
            player?.stop()
            player?.clearMediaItems()
            ocultar(cargando)
            mostrarAvisoApp(c)
        } else {
            ocultar(aviso)
            reproducir()
        }
    }

    private fun reproducir() {
        val c = canales.getOrNull(actual) ?: return
        val url = c.urls.getOrNull(urlIdx) ?: return sinSenal(c)
        cargandoTxt.text = "Poniendo ${c.nombre}…"
        val item = MediaItem.Builder().setUri(url).setMimeType(MimeTypes.APPLICATION_M3U8).build()
        player?.apply {
            setMediaItem(item)
            prepare()
            play()
        }
    }

    private fun probarSiguienteEnlace() {
        h.removeCallbacks(vigilante)
        val c = canales.getOrNull(actual) ?: return
        if (c.esApp) return
        urlIdx++
        if (urlIdx < c.urls.size) reproducir() else sinSenal(c)
    }

    private fun sinSenal(c: Canal) {
        player?.stop()
        h.removeCallbacks(mostrarCargandoTarde)
        ocultar(cargando)
        mostrarAviso(
            c.nombre,
            "Ahora mismo no funciona.\nLo vuelvo a intentar yo sola.",
            "Pulsa  ▲  o  ▼  para cambiar de canal",
        )
        h.postDelayed(reintento, 30_000)
    }

    // ---------- Canales en su app oficial ----------

    private fun mostrarAvisoApp(c: Canal) {
        val instalada = buscarApp(c.appClave!!) != null
        mostrarAviso(
            c.nombre,
            "Este canal se ve en la app ${c.appNombre}.",
            if (instalada) "Pulsa  OK  para verlo" else "Falta instalar ${c.appNombre}. Pulsa  OK  para buscarla",
        )
    }

    private fun abrirApp(c: Canal) {
        val pkg = buscarApp(c.appClave!!)
        if (pkg != null) {
            val i = packageManager.getLeanbackLaunchIntentForPackage(pkg)
                ?: packageManager.getLaunchIntentForPackage(pkg)
            if (i != null) { startActivity(i); return }
        }
        val nombre = Uri.encode(c.appNombre ?: c.nombre)
        val tienda = listOf("amzn://apps/android?s=$nombre", "market://search?q=$nombre")
        for (u in tienda) {
            try { startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(u))); return } catch (_: ActivityNotFoundException) {}
        }
        Toast.makeText(this, "Instala ${c.appNombre} desde la tienda de apps", Toast.LENGTH_LONG).show()
    }

    /** Busca una app instalada cuyo nombre o paquete contenga alguna de las claves (separadas por |). */
    private fun buscarApp(clave: String): String? {
        val claves = clave.lowercase().split("|")
        val pm = packageManager
        for (cat in listOf(Intent.CATEGORY_LEANBACK_LAUNCHER, Intent.CATEGORY_LAUNCHER)) {
            val q = Intent(Intent.ACTION_MAIN).addCategory(cat)
            for (ri in pm.queryIntentActivities(q, 0)) {
                val pkg = ri.activityInfo.packageName
                if (pkg == packageName) continue
                val nombre = ri.loadLabel(pm).toString().lowercase()
                if (claves.any { nombre.contains(it) || pkg.lowercase().contains(it) }) return pkg
            }
        }
        return null
    }

    // ---------- Pantalla táctil (móvil o tablet) ----------
    // Deslizar arriba/abajo cambia de canal · tocar muestra el rótulo y, con el rótulo visible, la lista
    // · mantener pulsado abre el modo nieto. En la lista, el toque normal elige o marca.

    override fun dispatchTouchEvent(ev: MotionEvent): Boolean {
        if (lista.visibility == View.VISIBLE) return super.dispatchTouchEvent(ev)
        gestos.onTouchEvent(ev)
        return true
    }

    private fun tocar() {
        val c = canales.getOrNull(actual) ?: return
        when {
            c.esApp -> abrirApp(c)
            banner.visibility == View.VISIBLE && banner.alpha > 0.5f -> abrirLista(false)
            else -> mostrarBanner(c)
        }
    }

    // ---------- Mando ----------

    override fun dispatchKeyEvent(e: KeyEvent): Boolean {
        if (e.action != KeyEvent.ACTION_DOWN) return super.dispatchKeyEvent(e)
        val k = e.keyCode
        if (lista.visibility == View.VISIBLE) {
            when (k) {
                KeyEvent.KEYCODE_BACK -> { cerrarLista(); return true }
                KeyEvent.KEYCODE_MENU -> { abrirLista(!modoNieto); return true }
            }
            return super.dispatchKeyEvent(e)
        }
        when (k) {
            KeyEvent.KEYCODE_DPAD_UP, KeyEvent.KEYCODE_CHANNEL_UP -> zapear(+1)
            KeyEvent.KEYCODE_DPAD_DOWN, KeyEvent.KEYCODE_CHANNEL_DOWN -> zapear(-1)
            KeyEvent.KEYCODE_DPAD_CENTER, KeyEvent.KEYCODE_ENTER, KeyEvent.KEYCODE_NUMPAD_ENTER -> {
                val c = canales.getOrNull(actual)
                if (c != null && c.esApp) abrirApp(c) else abrirLista(false)
            }
            KeyEvent.KEYCODE_DPAD_RIGHT -> cambiarLado("cine")
            KeyEvent.KEYCODE_DPAD_LEFT -> cambiarLado("tele")
            KeyEvent.KEYCODE_INFO ->
                canales.getOrNull(actual)?.let { mostrarBanner(it) }
            KeyEvent.KEYCODE_BACK -> {
                if (banner.visibility == View.VISIBLE) ocultar(banner) else abrirLista(false)
            }
            KeyEvent.KEYCODE_MENU -> abrirLista(true)
            in KeyEvent.KEYCODE_0..KeyEvent.KEYCODE_9 -> marcarDigito(k - KeyEvent.KEYCODE_0)
            else -> return super.dispatchKeyEvent(e)
        }
        return true
    }

    /** Zapping con espera corta: el rótulo cambia al momento y el canal se pone al soltar. */
    private fun zapear(paso: Int) {
        if (canales.isEmpty()) return
        val base = if (pendiente >= 0) pendiente else actual
        pendiente = modulo(base + paso, canales.size)
        mostrarBanner(canales[pendiente], pendiente)
        h.removeCallbacks(aplicarZapping)
        h.postDelayed(aplicarZapping, 450)
    }

    private val aplicarZapping = Runnable {
        val p = pendiente
        pendiente = -1
        if (p >= 0 && p != actual) sintonizar(p)
    }

    private fun marcarDigito(d: Int) {
        digitos = (digitos + d).takeLast(2)
        val n = digitos.toInt() - 1
        canales.getOrNull(n)?.let { mostrarBanner(it, n) }
        h.removeCallbacks(aplicarDigitos)
        h.postDelayed(aplicarDigitos, 1500)
    }

    private val aplicarDigitos = Runnable {
        val n = digitos.toIntOrNull()?.minus(1) ?: -1
        digitos = ""
        if (n in canales.indices) sintonizar(n)
    }

    // ---------- Rótulo del canal ----------

    private val ocultarBanner = Runnable { ocultar(banner) }

    private fun mostrarBanner(c: Canal, indice: Int = actual) {
        bNumero.text = (indice + 1).toString()
        rellenarBanner(c)
        mostrar(banner, desdeAbajo = true)
        h.removeCallbacks(ocultarBanner)
        h.postDelayed(ocultarBanner, 5_000)
    }

    private fun rellenarBanner(c: Canal?) {
        c ?: return
        bNombre.text = c.nombre
        bLado.text = if (esCine) "CINE Y SERIES · ${c.grupo.uppercase()}   ◀ Tele" else "TELE   ▶ Cine y series"
        val (ahora, despues) = repo.ahoraYDespues(c)
        if (ahora != null) {
            bAhora.text = "${horaFmt.format(Date(ahora.inicio))}  ${ahora.titulo}"
            val total = (ahora.fin - ahora.inicio).coerceAtLeast(1)
            bProgreso.progress = (((System.currentTimeMillis() - ahora.inicio) * 100) / total).toInt().coerceIn(0, 100)
            bProgreso.visibility = View.VISIBLE
        } else {
            bAhora.text = if (c.esApp) "En la app ${c.appNombre}" else "En directo"
            bProgreso.visibility = View.GONE
        }
        bDespues.text = despues?.let { "Después  ${horaFmt.format(Date(it.inicio))}  ${it.titulo}" } ?: ""
        bDespues.visibility = if (despues != null) View.VISIBLE else View.GONE
    }

    private val tickReloj = object : Runnable {
        override fun run() {
            reloj.text = horaFmt.format(Date())
            h.postDelayed(this, 20_000)
        }
    }

    // ---------- Lista de canales y modo nieto ----------

    private fun abrirLista(nieto: Boolean) {
        modoNieto = nieto
        ocultar(banner)
        listaTitulo.text = when {
            nieto && esCine -> "Modo nieto · Cine y series: elige idiomas · ☰ o Atrás para salir"
            nieto -> "Modo nieto · OK o toque marca/quita (${repo.todos().size}) · ☰ o Atrás para salir"
            esCine -> "Cine y series · ${canales.size} canales · ◀ vuelve a la Tele"
            else -> "Canales · elige con las flechas y OK, o tócalo"
        }
        listaRejilla.removeAllViews()
        var foco: View? = null
        if (nieto && esCine) {
            repo.idiomas().forEach { (idi, n) ->
                val t = tarjeta("$idi  ($n)", repo.idiomaVisible(idi))
                t.setOnClickListener {
                    val v = !repo.idiomaVisible(idi)
                    repo.ponerIdioma(idi, v)
                    marcarTarjeta(t, v)
                }
                listaRejilla.addView(t)
                if (foco == null) foco = t
            }
            mostrarLista(foco)
            return
        }
        val fuente = if (nieto) repo.todos() else canales
        var grupoAnterior: String? = null
        fuente.forEachIndexed { i, c ->
            if (esCine && !nieto && c.grupo != grupoAnterior) {
                grupoAnterior = c.grupo
                listaRejilla.addView(cabecera(c.grupo))
            }
            val t = tarjeta(if (nieto) c.nombre else "${i + 1}   ${c.nombre}", if (nieto) repo.esVisible(c) else null)
            t.setOnClickListener {
                if (nieto) {
                    val v = !repo.esVisible(c)
                    repo.ponerVisible(c, v)
                    marcarTarjeta(t, v)
                } else {
                    cerrarLista()
                    sintonizar(i)
                }
            }
            listaRejilla.addView(t)
            if ((!nieto && i == actual) || (nieto && foco == null)) foco = t
        }
        if (nieto) {
            val r = tarjeta("↺  Restablecer", null)
            r.setOnClickListener { repo.restablecer(); abrirLista(true) }
            listaRejilla.addView(r)
        }
        mostrarLista(foco)
    }

    private fun mostrarLista(foco: View?) {
        mostrar(lista)
        lista.scaleX = 1.04f; lista.scaleY = 1.04f
        lista.animate().scaleX(1f).scaleY(1f).setDuration(220).setInterpolator(DecelerateInterpolator()).start()
        foco?.post { foco.requestFocus() }
    }

    /** Título de sección a lo ancho de la rejilla (p. ej. «Español · Cine»). */
    private fun cabecera(texto: String) = TextView(this).apply {
        text = texto
        textSize = 24f
        typeface = Typeface.DEFAULT_BOLD
        setTextColor(cAcento)
        setPadding(dp(10), dp(22), dp(10), dp(4))
        layoutParams = GridLayout.LayoutParams(GridLayout.spec(GridLayout.UNDEFINED), GridLayout.spec(0, 3))
    }

    private fun cerrarLista() {
        ocultar(lista)
        if (modoNieto) {
            modoNieto = false
            val antes = canales.getOrNull(actual)?.nombre
            recargarCanales()
            if (canales.getOrNull(actual)?.nombre != antes) sintonizar(actual)
        }
    }

    private fun tarjeta(texto: String, marcada: Boolean?): TextView {
        val t = TextView(this)
        t.text = texto
        t.setTextColor(cTexto)
        t.textSize = 24f
        t.maxLines = 1
        t.ellipsize = android.text.TextUtils.TruncateAt.END
        t.typeface = Typeface.DEFAULT_BOLD
        t.isFocusable = true
        t.isClickable = true
        t.gravity = Gravity.CENTER_VERTICAL
        t.setPadding(dp(24), dp(18), dp(24), dp(18))
        t.minWidth = dp(250)
        t.background = fondoTarjeta(false)
        val lp = GridLayout.LayoutParams()
        lp.setMargins(dp(10), dp(10), dp(10), dp(10))
        t.layoutParams = lp
        if (marcada != null) marcarTarjeta(t, marcada)
        t.setOnFocusChangeListener { v, f ->
            v.background = fondoTarjeta(f)
            (v as TextView).setTextColor(if (f) Color.parseColor("#FF101826") else cTexto)
            if (v.text.startsWith("✗")) v.alpha = if (f) 1f else 0.55f
            v.animate().scaleX(if (f) 1.08f else 1f).scaleY(if (f) 1.08f else 1f)
                .setDuration(150).setInterpolator(DecelerateInterpolator()).start()
            v.parent?.let { (it as? View)?.invalidate() }
        }
        return t
    }

    private fun marcarTarjeta(t: TextView, v: Boolean) {
        val base = t.text.toString().removePrefix("✓  ").removePrefix("✗  ")
        t.text = (if (v) "✓  " else "✗  ") + base
        t.alpha = if (v) 1f else 0.55f
    }

    private fun fondoTarjeta(foco: Boolean) = GradientDrawable().apply {
        cornerRadius = dp(18).toFloat()
        setColor(if (foco) cAcento else cTarjeta)
        if (!foco) setStroke(dp(2), Color.parseColor("#33FFFFFF"))
    }

    // ---------- Avisos ----------

    private fun mostrarAviso(titulo: String, texto: String, pista: String) {
        avisoTitulo.text = titulo
        avisoTexto.text = texto
        avisoPista.text = pista
        mostrar(aviso)
    }

    private fun mostrar(v: View, desdeAbajo: Boolean = false) {
        if (v.visibility == View.VISIBLE && v.alpha == 1f) return
        v.animate().cancel()
        v.visibility = View.VISIBLE
        v.alpha = 0f
        v.translationY = if (desdeAbajo) dp(40).toFloat() else 0f
        v.animate().alpha(1f).translationY(0f).setDuration(240).setInterpolator(DecelerateInterpolator()).start()
    }

    private fun ocultar(v: View) {
        if (v.visibility != View.VISIBLE) return
        v.animate().cancel()
        v.animate().alpha(0f).setDuration(180).withEndAction { v.visibility = View.GONE }.start()
    }

    // ---------- Construcción de la pantalla ----------

    private fun modulo(a: Int, n: Int) = ((a % n) + n) % n

    private fun dp(v: Int) = TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v.toFloat(), resources.displayMetrics).toInt()

    private fun texto(tam: Float, color: Int = cTexto, negrita: Boolean = false) = TextView(this).apply {
        textSize = tam
        setTextColor(color)
        if (negrita) typeface = Typeface.DEFAULT_BOLD
        setShadowLayer(6f, 0f, 2f, Color.BLACK)
    }

    private fun panel() = GradientDrawable().apply {
        cornerRadius = dp(24).toFloat()
        setColor(cFondo)
    }

    private fun construirVista() {
        raiz = FrameLayout(this)
        raiz.setBackgroundColor(Color.BLACK)
        val todo = ViewGroup.LayoutParams.MATCH_PARENT
        val ajusta = ViewGroup.LayoutParams.WRAP_CONTENT

        video = PlayerView(this).apply {
            useController = false
            resizeMode = AspectRatioFrameLayout.RESIZE_MODE_FIT
            setShutterBackgroundColor(Color.BLACK)
            isFocusable = false
        }
        raiz.addView(video, FrameLayout.LayoutParams(todo, todo))

        // Cargando
        cargando = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            visibility = View.GONE
        }
        cargando.addView(ProgressBar(this), LinearLayout.LayoutParams(dp(72), dp(72)))
        cargandoTxt = texto(28f).apply { setPadding(0, dp(16), 0, 0) }
        cargando.addView(cargandoTxt)
        raiz.addView(cargando, FrameLayout.LayoutParams(ajusta, ajusta, Gravity.CENTER))

        // Aviso central
        aviso = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            background = panel()
            setPadding(dp(56), dp(40), dp(56), dp(40))
            visibility = View.GONE
        }
        avisoTitulo = texto(52f, cTexto, true).apply { gravity = Gravity.CENTER }
        avisoTexto = texto(28f, cTenue).apply { gravity = Gravity.CENTER; setPadding(0, dp(12), 0, dp(20)); minWidth = dp(560) }
        avisoPista = texto(30f, cAcento, true).apply { gravity = Gravity.CENTER }
        aviso.addView(avisoTitulo); aviso.addView(avisoTexto); aviso.addView(avisoPista)
        raiz.addView(aviso, FrameLayout.LayoutParams(ajusta, ajusta, Gravity.TOP or Gravity.CENTER_HORIZONTAL).apply { topMargin = dp(100) })

        // Rótulo del canal (abajo)
        banner = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            background = panel()
            setPadding(dp(32), dp(24), dp(40), dp(24))
            visibility = View.GONE
        }
        bNumero = texto(72f, cAcento, true).apply { setPadding(0, 0, dp(32), 0) }
        val col = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        bLado = texto(16f, cAcento, true).apply { letterSpacing = 0.08f }
        col.addView(bLado)
        bNombre = texto(44f, cTexto, true)
        bAhora = texto(28f, cTexto)
        bProgreso = ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal).apply {
            max = 100
            progressTintList = android.content.res.ColorStateList.valueOf(cAcento)
        }
        bDespues = texto(22f, cTenue)
        col.addView(bNombre)
        col.addView(bAhora)
        col.addView(bProgreso, LinearLayout.LayoutParams(dp(520), dp(10)).apply { topMargin = dp(10); bottomMargin = dp(8) })
        col.addView(bDespues)
        banner.addView(bNumero)
        banner.addView(col)
        raiz.addView(banner, FrameLayout.LayoutParams(ajusta, ajusta, Gravity.BOTTOM or Gravity.START).apply {
            setMargins(dp(48), 0, dp(48), dp(40))
        })

        // Reloj
        reloj = texto(30f, cTexto, true).apply {
            background = panel()
            setPadding(dp(20), dp(8), dp(20), dp(8))
        }
        raiz.addView(reloj, FrameLayout.LayoutParams(ajusta, ajusta, Gravity.TOP or Gravity.END).apply {
            setMargins(0, dp(32), dp(48), 0)
        })

        // Lista de canales
        lista = FrameLayout(this).apply {
            setBackgroundColor(Color.parseColor("#F00A0F1A"))
            visibility = View.GONE
        }
        val listaCol = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(64), dp(40), dp(64), dp(24))
        }
        listaTitulo = texto(34f, cAcento, true).apply { setPadding(dp(10), 0, 0, dp(16)) }
        listaRejilla = GridLayout(this).apply { columnCount = 3; clipChildren = false; clipToPadding = false }
        val scroll = ScrollView(this).apply { clipChildren = false; isFillViewport = true }
        scroll.addView(listaRejilla)
        listaCol.addView(listaTitulo)
        listaCol.addView(scroll, LinearLayout.LayoutParams(todo, todo))
        lista.addView(listaCol, FrameLayout.LayoutParams(todo, todo))
        raiz.addView(lista, FrameLayout.LayoutParams(todo, todo))

        // Cortinilla al cambiar de lado
        cortinilla = texto(64f, cTexto, true).apply {
            gravity = Gravity.CENTER
            setBackgroundColor(Color.parseColor("#FF101826"))
            visibility = View.GONE
        }
        raiz.addView(cortinilla, FrameLayout.LayoutParams(todo, todo))

        setContentView(raiz)
    }
}
