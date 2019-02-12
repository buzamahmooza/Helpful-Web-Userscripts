/**Open all torrents*/
(function () {
    var tls = getTorrentLinks();
    var mls = getMagnetLinks();

    console.log('TorrentLinks:', tls.map(a=>a.href));

    if(confirm("Open " +tls.length+ " torrent links?"))
        for (const tl of tls) {
            window.open(tl.href, "_blank");
        }
    
    console.log('MangetLinks:', mls.map(a=>a.href));
    
    if(confirm("Open " +mls.length+ " magnet links?"))
        for (const ml of mls) {
            window.open(ml.href, "_blank");
        }
    function getTorrentLinks() {
        return Array.from(document.links).filter(a=>a.href.search("/torrent/") != -1 ||
            a.href.search("http://itorrents.org/torrent/") != -1 ||
            a.href.search("https://rarbg.to/download.php?") != -1
        )
    }
    function getMagnetLinks() {
        return Array.from(document.links).filter(link => /magnet[:_\-+%?=&;.0-9a-zA-Z]*/mi.test(link.href));
    }
})();
