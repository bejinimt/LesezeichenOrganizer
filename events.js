// ---------------------------------------------------------
// Globale Flags für Checkbox-Modus
// ---------------------------------------------------------
window.showUrlCheckboxes = false;
window.showFolderCheckboxes = false;


// ---------------------------------------------------------
// Datei laden
// ---------------------------------------------------------
btnLoad.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (!file) {
        window.setMessage("Keine Datei ausgewählt.");
        return;
    }

    const reader = new FileReader();

    reader.onload = e => {
        const content = e.target.result;

        if (file.name.toLowerCase().endsWith(".html") || file.name.toLowerCase().endsWith(".htm")) {
            window.parseBookmarkHTML(content);
        } else if (file.name.toLowerCase().endsWith(".json")) {
            window.parseBookmarkJSON(content);
        } else {
            window.setMessage("Bitte eine HTML‑ oder JSON‑Lesezeichenliste laden.");
        }
    };

    reader.readAsText(file, "utf-8");
});



document.getElementById("btnLoadHtml").addEventListener("click", handleLoadHtml);

function handleLoadHtml() {
    const input = document.getElementById("fileInputHtml");
    if (!input) return;

    input.value = ""; // wichtig, damit zweimal dieselbe Datei geht
    input.click();

    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const text = await file.text();

        // 🔥 Hier wird die Funktion aus import-html.js aufgerufen
        window.parseBookmarkHTMLWithTags(text);
    };
}




// ---------------------------------------------------------
// Suche
// ---------------------------------------------------------
searchInput.addEventListener("input", () => {
    window.currentSearchTerm = searchInput.value.trim();
    window.renderTree();
});


// ---------------------------------------------------------
// Nummern ein/aus
// ---------------------------------------------------------
btnToggleNumbers.addEventListener("click", () => {
    window.showNumbers = !window.showNumbers;
    btnToggleNumbers.textContent = window.showNumbers ? "Nummern ausblenden" : "Nummern anzeigen";
    window.renderTree();
});


// ---------------------------------------------------------
// URLs ein/aus
// ---------------------------------------------------------
btnToggleAllUrls.addEventListener("click", () => {
    window.showAllUrls = !window.showAllUrls;
    btnToggleAllUrls.textContent = window.showAllUrls ? "Alle URLs ausblenden" : "Alle URLs anzeigen";
    window.renderTree();
});


// ---------------------------------------------------------
// Nur Duplikate anzeigen
// ---------------------------------------------------------
btnShowDuplicates.addEventListener("click", () => {
    window.showDuplicatesOnly = !window.showDuplicatesOnly;
    btnShowDuplicates.textContent = window.showDuplicatesOnly
        ? "Alle anzeigen"
        : "Doppelte Links anzeigen";
    window.renderTree();
});


// ---------------------------------------------------------
// Fundstellen ein/aus
// ---------------------------------------------------------
btnToggleLocations.addEventListener("click", () => {
    window.showDuplicateLocations = !window.showDuplicateLocations;
    btnToggleLocations.textContent = window.showDuplicateLocations
        ? "Fundstellen ausblenden"
        : "Fundstellen anzeigen";
    window.renderTree();
});


// ---------------------------------------------------------
// Export (noch ohne Filter "nur sichtbare")
// ---------------------------------------------------------
btnExport.addEventListener("click", () => {
    if (!window.bookmarkData.folders.length) {
        window.setMessage("Keine Daten zum Exportieren.");
        return;
    }

    const json = JSON.stringify(window.bookmarkData, null, 2);
    const now = new Date();
    const fileName = "Lesezeichen_" + now.toISOString().replace(/[:.]/g, "-") + ".json";

    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();

    URL.revokeObjectURL(url);

    window.setMessage("Export abgeschlossen.");
});


// ---------------------------------------------------------
// Checkboxen für Bookmarks + Ordner ein/aus
// ---------------------------------------------------------
btnToggleCheckboxes.addEventListener("click", () => {
    const newState = !(window.showUrlCheckboxes || window.showFolderCheckboxes);

    window.showUrlCheckboxes = newState;
    window.showFolderCheckboxes = newState;

    btnToggleCheckboxes.textContent = newState
        ? "Checkboxen ausblenden"
        : "Checkboxen anzeigen";

    // Ordner-Checkboxen setzen
    for (const folder of window.bookmarkData.folders) {
        folder.showCheckbox = newState;
    }

    // Bookmark-Checkboxen rekursiv setzen
    function updateFolder(folder) {
        for (const child of folder.children) {
            if (child.type === "bookmark") {
                child.showCheckbox = newState;
            }
            if (child.type === "folder") {
                const sub = window.bookmarkData.folders.find(f => f.id === child.ref);
                if (sub) updateFolder(sub);
            }
        }
    }

    for (const folder of window.bookmarkData.folders) {
        updateFolder(folder);
    }

    window.renderTree();
});


// ---------------------------------------------------------
// NEU: Ausgewählte URLs ausblenden (visible = false)
// ---------------------------------------------------------
btnHideSelectedUrls.addEventListener("click", () => {

    function walk(folder) {
        for (const child of folder.children) {

            if (child.type === "bookmark" && child.selected) {
                child.visible = false;   // URL bleibt erhalten, wird nur versteckt
            }

            if (child.type === "folder") {
                const sub = window.bookmarkData.folders.find(f => f.id === child.ref);
                if (sub) walk(sub);
            }
        }
    }

    for (const folder of window.bookmarkData.folders) {
        walk(folder);
    }

    window.renderTree();
    window.setMessage("Ausgewählte URLs wurden ausgeblendet.");
});


// ---------------------------------------------------------
// OPTIONAL: Alle ausgeblendeten wieder einblenden
// ---------------------------------------------------------
btnShowHiddenUrls.addEventListener("click", () => {

    function walk(folder) {
        for (const child of folder.children) {

            if (child.type === "bookmark") {
                child.visible = true;
            }

            if (child.type === "folder") {
                const sub = window.bookmarkData.folders.find(f => f.id === child.ref);
                if (sub) walk(sub);
            }
        }
    }

    for (const folder of window.bookmarkData.folders) {
        walk(folder);
    }

    window.renderTree();
    window.setMessage("Alle ausgeblendeten URLs wurden wieder eingeblendet.");
});


// ---------------------------------------------------------
// Startmeldung
// ---------------------------------------------------------
window.setMessage("Bitte eine Lesezeichen‑Datei laden.");
