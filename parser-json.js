window.parseBookmarkJSON = function (jsonText) {
    try {
        const data = JSON.parse(jsonText);

        if (!data || !Array.isArray(data.folders)) {
            window.setMessage("Ungültiges JSON‑Format.");
            return;
        }

        window.bookmarkData = data;
        window.setMessage("JSON‑Lesezeichen geladen.");
        window.renderTree();

    } catch (err) {
        console.error(err);
        window.setMessage("Fehler beim Lesen der JSON‑Datei.");
    }
};
