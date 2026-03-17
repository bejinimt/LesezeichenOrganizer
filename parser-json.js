window.parseBookmarkJSON = function (jsonText) {
    try {
        const data = JSON.parse(jsonText);

        if (!data || !Array.isArray(data.folders)) {
            window.setMessage("Ungültiges JSON‑Format.");
            return;
        }

        // ---------------------------------------------
        // Rekursive Ergänzung fehlender Eigenschaften
        // ---------------------------------------------
        function enhanceFolder(folder) {

            // Ordner-Flags ergänzen
            if (folder.showCheckbox === undefined) folder.showCheckbox = false;
            if (folder.selected === undefined) folder.selected = false;
            if (folder.visible === undefined) folder.visible = true;

            if (!Array.isArray(folder.children)) return;

            for (const child of folder.children) {

                if (child.type === "folder") {
                    const sub = data.folders.find(f => f.id === child.ref);
                    if (sub) enhanceFolder(sub);
                }

                else if (child.type === "bookmark") {

                    // Checkbox-Flags ergänzen
                    if (child.showCheckbox === undefined) child.showCheckbox = false;
                    if (child.selected === undefined) child.selected = false;

                    // NEU: Sichtbarkeits-Flag ergänzen
                    if (child.visible === undefined) child.visible = true;
                }
            }
        }

        // Alle Ordner durchgehen
        for (const folder of data.folders) {
            enhanceFolder(folder);
        }

        // ---------------------------------------------

        window.bookmarkData = data;
        window.setMessage("JSON‑Lesezeichen geladen.");
        window.renderTree();

    } catch (err) {
        console.error(err);
        window.setMessage("Fehler beim Lesen der JSON‑Datei.");
    }
};
