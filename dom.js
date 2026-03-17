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

window.setMessage = function (text) {
    messageArea.textContent = text;
};
