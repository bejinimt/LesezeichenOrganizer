// Globale Zustandsvariablen

window.bookmarkData = { folders: [] };

window.showNumbers = false;
window.showAllUrls = false;
window.showDuplicatesOnly = false;
window.showDuplicateLocations = false;
window.currentSearchTerm = "";

// NEU: Checkbox-Modi
window.showUrlCheckboxes = false;
window.showFolderCheckboxes = false;


// DOM-Elemente

window.btnLoad = document.getElementById("btnLoad");
window.btnToggleNumbers = document.getElementById("btnToggleNumbers");
window.btnToggleAllUrls = document.getElementById("btnToggleAllUrls");
window.btnShowDuplicates = document.getElementById("btnShowDuplicates");
window.btnToggleLocations = document.getElementById("btnToggleLocations");
window.btnExport = document.getElementById("btnExport");
window.fileInput = document.getElementById("fileInput");
window.messageArea = document.getElementById("messageArea");
window.treeContainer = document.getElementById("treeContainer");
window.searchInput = document.getElementById("searchInput");

// NEU: Buttons für Checkboxen
window.btnToggleCheckboxes = document.getElementById("btnToggleCheckboxes");



// Globale Hilfsfunktion
window.setMessage = function (text) {
    messageArea.textContent = text;
};
