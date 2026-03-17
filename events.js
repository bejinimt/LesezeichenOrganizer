// Datei laden
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


// Suche
searchInput.addEventListener("input", () => {
    window.currentSearchTerm = searchInput.value.trim();
    window.renderTree();
});


// Nummern ein/aus
btnToggleNumbers.addEventListener("click", () => {
    window.showNumbers = !window.showNumbers;
    btnToggleNumbers.textContent = window.showNumbers ? "Nummern ausblenden" : "Nummern anzeigen";
    window.renderTree();
});


// URLs ein/aus
btnToggleAllUrls.addEventListener("click", () => {
    window.showAllUrls = !window.showAllUrls;
    btnToggleAllUrls.textContent = window.showAllUrls ? "Alle URLs ausblenden" : "Alle URLs anzeigen";
    window.renderTree();
});


// Nur Duplikate anzeigen
btnShowDuplicates.addEventListener("click", () => {
    window.showDuplicatesOnly = !window.showDuplicatesOnly;
    btnShowDuplicates.textContent = window.showDuplicatesOnly
        ? "Alle anzeigen"
        : "Doppelte Links anzeigen";
    window.renderTree();
});


// Fundstellen ein/aus
btnToggleLocations.addEventListener("click", () => {
    window.showDuplicateLocations = !window.showDuplicateLocations;
    btnToggleLocations.textContent = window.showDuplicateLocations
        ? "Fundstellen ausblenden"
        : "Fundstellen anzeigen";
    window.renderTree();
});


// Export
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


// Startmeldung
window.setMessage("Bitte eine Lesezeichen‑Datei laden.");
