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
}
