package es.latele.abuela

/**
 * Lista de canales incluida en la app (copia de seguridad).
 * Fuente: TDTChannels (github.com/LaQuay/TDTChannels, Apache-2.0): solo emisiones en abierto y oficiales.
 * Al arrancar, la app actualiza los enlaces desde tdtchannels.com por su identificador de guía.
 * Los canales con "app" no tienen emisión directa: se abren en su app oficial gratuita.
 */
object CanalesIncluidos {
    val lista = listOf(
        Canal("La 1", listOf("https://rtvelivestream.rtve.es/rtvesec/la1/la1_main_dvr.m3u8"), "La1.TV", null, null, "Nacionales", true),
        Canal("La 2", listOf("https://rtvelivestream.rtve.es/rtvesec/la2/la2_main_dvr.m3u8", "https://stream.ads.ottera.tv/playlist.m3u8?network_id=15618"), "La2.TV", null, null, "Nacionales", true),
        Canal("Antena 3", listOf(), "Antena3.TV", "atresplayer", "Atresplayer", "Nacionales", true),
        Canal("Cuatro", listOf(), "Cuatro.TV", "mediaset|mitele", "Mediaset Infinity", "Nacionales", true),
        Canal("Telecinco", listOf(), "Telecinco.TV", "mediaset|mitele", "Mediaset Infinity", "Nacionales", true),
        Canal("laSexta", listOf(), "LaSexta.TV", "atresplayer", "Atresplayer", "Nacionales", true),
        Canal("TRECE", listOf("https://play.cdn.enetres.net/091DB7AFBD77442B9BA2F141DCC182F5021/021/playlist.m3u8"), "13.TV", null, null, "Temáticos", true),
        Canal("24h", listOf("https://ztnr.rtve.es/ztnr/1694255.m3u8", "https://rtvelivestream.rtve.es/rtvesec/24h/24h_main_dvr.m3u8", "https://stream.ads.ottera.tv/playlist.m3u8?network_id=15621"), "24Horas.TV", null, null, "Temáticos", true),
        Canal("Teledeporte", listOf("https://rtvelivestream.rtve.es/rtvesec/tdp/tdp_main.m3u8"), "TDP.TV", null, null, "Temáticos", true),
        Canal("Clan", listOf("https://ztnr.rtve.es/ztnr/5466990.m3u8", "https://rtvelivestream.rtve.es/rtvesec/clan/clan_main_dvr.m3u8", "https://stream.ads.ottera.tv/playlist.m3u8?network_id=15620"), "Clan.TV", null, null, "Temáticos", true),
        Canal("Euronews", listOf("https://euronews-live-spa-es.fast.rakuten.tv/v1/master/0547f18649bd788bec7b67b746e47670f558b6b2/production-LiveChannel-6571/bitok/eyJzdGlkIjoiMDA0YjY0NTMtYjY2MC00ZTZkLTlkNzEtMTk3YTM3ZDZhZWIxIiwibWt0IjoiZXMiLCJjaCI6NjU3MSwicHRmIjoxfQ==/26034/euronews-es.m3u8"), "Euronews.TV", null, null, "Temáticos", true),
        Canal("Telemadrid", listOf(), "Telemadrid.TV", "telemadrid", "Telemadrid", "Autonómicos", false),
        Canal("Canal Sur", listOf("https://live-24-canalsur.interactvty.pro/9bb0f4edcb8946e79f5017ddca6c02b0/74cdbd1b401a7598ab8f3e9b5652c9909daa60dd4f6f96f28396a3f1cfd926f2.m3u8", "https://dfk2a268yviz9.cloudfront.net/v1/master/3722c60a815c199d9c0ef36c5b73da68a62b09d1/cc-ddiii1m6jt6of/CanalSurAndaluciaES.m3u8"), "CanalSurA.TV", null, null, "Autonómicos", false),
        Canal("TV Canaria", listOf("https://d1oyt3v08gcy18.cloudfront.net/index-events.m3u8", "https://rtvclive.flumotion.cloud/rtvc1live/smil:channel1PRG.smil/playlist.m3u8"), "Canarias.TV", null, null, "Autonómicos", false),
        Canal("CMM", listOf("https://cdnapisec.kaltura.com/p/2288691/sp/228869100/playManifest/entryId/1_gnz6ity9/protocol/https/format/applehttp/a.m3u8"), "CMM.TV", null, null, "Autonómicos", false),
        Canal("Canal Extremadura", listOf("https://d2ymuyhevki1a1.cloudfront.net/wct-ddd2992e-86fc-4611-a491-7f392259e9ba/continuous/9be76611-d2cd-474d-bf19-ef702ba31b02/index.m3u8"), "Extremadura.TV", null, null, "Autonómicos", false),
        Canal("TV3", listOf("https://directes3-tv-cat.3catdirectes.cat/live-content/tv3-hls/master.m3u8", "https://directes-tv-int-dev.3catdirectes.cat/live-content/tv3-uhd-cmaf/master.m3u8"), "TV3.TV", null, null, "Autonómicos", false),
        Canal("À Punt", listOf("https://fastly.live.brightcove.com/1846756479408303045/eu-central-1/6057955885001/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJob3N0IjoiZWFxNWh4LmVncmVzcy53YzQ3bTEiLCJhY2NvdW50X2lkIjoiNjA1Nzk1NTg4NTAwMSIsImVobiI6ImZhc3RseS5saXZlLmJyaWdodGNvdmUuY29tIiwiaXNzIjoiYmxpdmUtcGxheWJhY2stc291cmNlLWFwaSIsInN1YiI6InBhdGhtYXB0b2tlbiIsImF1ZCI6WyI2MDU3OTU1ODg1MDAxIl0sImp0aSI6IjE4NDY3NTY0Nzk0MDgzMDMwNDUifQ.o6wb_VA-TVxl3ERgr7FKLlaTjY7smErmsf73QAydySE/playlist-hls-dvr.m3u8"), "APUNT.TV", null, null, "Autonómicos", false),
        Canal("TVG", listOf("https://crtvg-europa.flumotion.cloud/playlist_dvr.m3u8"), "TVGAL.TV", null, null, "Autonómicos", false),
        Canal("ETB 1", listOf("https://cdn1.etbon.eus/etb1/index.m3u8"), "ETB1.TV", null, null, "Autonómicos", false),
        Canal("ETB 2", listOf("https://cdn1.etbon.eus/etb2/index.m3u8"), "ETB2.TV", null, null, "Autonómicos", false)
    )
}
