package es.latele.abuela

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class ListaTest {
    @Test fun leeListaNormalYRara() {
        val m3u = "﻿#EXTM3U\r\n" +
            "#EXTINF:-1 tvg-id=\"La1.TV\" tvg-logo=\"x\" group-title=\"Generalistas\",La 1\r\n" +
            "https://a/la1.m3u8\r\n\r\n" +
            "#EXTINF:-1 tvg-id=La2.TV group-title=\"G\",La 2, con coma\n" +
            "#EXTVLCOPT:http-user-agent=Algo\n" +
            "https://a/la2.m3u8\n" +
            "#EXTINF:-1 tvg-id=\"La1.TV\",La 1 (2)\n" +
            "https://a/la1b.m3u8\n" +
            "#EXTINF:-1 tvg-id=\"La1.TV\",La 1 repetida\n" +
            "https://a/la1.m3u8\n" +
            "#EXTINF:-1,Sin id\nhttps://a/sinid.m3u8\n"
        val r = Repositorio.parsearM3u(m3u)
        assertEquals(listOf("https://a/la1.m3u8", "https://a/la1b.m3u8"), r["La1.TV"])
        assertEquals(listOf("https://a/la2.m3u8"), r["La2.TV"])
        assertEquals(2, r.size)
    }

    @Test fun fechasXmltvConZona() {
        val t = Repositorio.fecha("20261113210000 +0100")
        assertEquals(1794600000000L, t)
        assertEquals(0L, Repositorio.fecha("basura"))
    }

    @Test fun listaIncluidaSana() {
        val l = CanalesIncluidos.lista
        assertTrue(l.isNotEmpty())
        l.forEach { c -> assertTrue(c.nombre, c.esApp || c.urls.isNotEmpty()) }
        assertEquals(l.size, l.map { it.nombre }.toSet().size)
    }

    @Test fun canalesDeLaComunidadFiltrados() {
        val m3u = "#EXTM3U\n" +
            "#EXTINF:-1 tvg-id=\"Cine.es\" group-title=\"Movies;Series\",Pluto TV Cine (720p) [Not 24/7]\n" +
            "https://a/cine.m3u8\n" +
            "#EXTINF:-1 group-title=\"General, varios\",Canal Cocina, el bueno\n" +
            "https://a/cocina.m3u8\n" +
            "#EXTINF:-1,Antena 3 HD\nhttp://1.2.3.4:8000/a3.m3u8\n" +
            "#EXTINF:-1,AXN Movies\nhttp://x/axn.m3u8\n" +
            "#EXTINF:-1,La 1 HD\nhttps://a/otra-la1.m3u8\n" +
            "#EXTINF:-1 group-title=\"XXX\",Algo\nhttps://a/x.m3u8\n" +
            "#EXTINF:-1,Pluto TV Cine\nhttps://a/cine2.m3u8\n"
        val l = Repositorio.filtrarExtras(Repositorio.parsearCanales(m3u))
        assertEquals(listOf("Pluto TV Cine", "Canal Cocina, el bueno"), l.map { it.nombre })
        assertEquals("Movies", l[0].grupo)
        assertEquals(listOf("https://a/cine.m3u8", "https://a/cine2.m3u8"), l[0].urls)
        assertTrue(l.none { it.visiblePorDefecto })
    }
}
