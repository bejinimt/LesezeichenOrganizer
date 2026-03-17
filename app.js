// ============================================================
// Lesezeichen‑Organizer – Parsing, Nummerierung, Suche,
// globale URL‑Anzeige + DUPLIKAT-ANZEIGE
// ============================================================


// -----------------------------
// Globale Variablen
// -----------------------------

let bookmarkData = { folders: [] };
let showNumbers = false;
let showAllUrls = false;
let showDuplicatesOnly = false;   // <--- NEU
let currentSearchTerm = "";


// -----------------------------
// DOM‑Elemente
// -----------------------------

const btnLoad = document.getElementById("btnLoad");
const btnToggleNumbers = document.getElementById("btnToggleNumbers");
const btnToggleAllUrls = document.getElementById("btnToggleAllUrls");
const btnShowDuplicates = document.getElementById("btnShowDuplicates"); // <--- NEU
const btnExport = document.getElementById("btnExport");
const fileInput = document.getElementById("fileInput");
const messageArea = document.getElementById("messageArea");
const treeContainer = document.getElementById("treeContainer");
const searchInput = document.getElementById("searchInput");


// -----------------------------
// Meldungen
// -----------------------------

function setMessage(text) {
    messageArea.textContent = text;
}


// -----------------------------
// Datei laden
// -----------------------------

btnLoad.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", handleFileSelect);

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) {
        setMessage("Keine Datei ausgewählt.");
        return;
    }

    const reader = new FileReader();

    reader.onload = e => {
        const content = e.target.result;

        if (file.name.toLowerCase().endsWith(".html") || file.name.toLowerCase().endsWith(".htm")) {
            parseBookmarkHTML(content);
        } else if (file.name.toLowerCase().endsWith(".json")) {
            parseBookmarkJSON(content);
        } else {
            setMessage("Bitte eine HTML‑ oder JSON‑Lesezeichenliste laden.");
        }
    };

    reader.readAsText(file, "utf-8");
}


// -----------------------------
// Parsing: HTML‑Export – ZEILENWEISE
// -----------------------------

function parseBookmarkHTML(htmlText) {
    try {
        const lines = htmlText.split(/\r?\n/);

        bookmarkData = { folders: [] };

        let folderCounter = 0;
        const folderStack = [];
        const bookmarkIndexMap = {};

        function createFolder(title) {
            folderCounter++;
            const folder = {
                id: folderCounter,
                title: title || "(Ohne Titel)",
                children: []
            };
            bookmarkData.folders.push(folder);
            bookmarkIndexMap[folder.id] = 0;
            return folder;
        }

        function extractH3Title(line) {
            const upper = line.toUpperCase();
            const start = upper.indexOf("<H3");
            if (start === -1) return null;

            const gt = line.indexOf(">", start);
            const end = upper.indexOf("</H3>", gt);
            return line.substring(gt + 1, end).trim();
        }

        function extractHref(line) {
            const match = line.match(/HREF="([^"]*)"/i);
            return match ? match[1] : "";
        }

        function extractATitle(line) {
            const upper = line.toUpperCase();
            const start = upper.indexOf("<A");
            if (start === -1) return null;

            const gt = line.indexOf(">", start);
            const end = upper.indexOf("</A>", gt);
            return line.substring(gt + 1, end).trim();
        }

        // --- Hauptschleife: Zeile für Zeile ---
        for (let rawLine of lines) {
            const line = rawLine.trim();
            if (!line) continue;

            const upper = line.toUpperCase();

            // --- Ordner ---
            if (upper.includes("<DT><H3") || upper.includes("<H3")) {
                const title = extractH3Title(line) || "(Ohne Titel)";
                const newFolder = createFolder(title);

                if (folderStack.length > 0) {
                    const parentId = folderStack[folderStack.length - 1];
                    const parentFolder = bookmarkData.folders.find(f => f.id === parentId);
                    parentFolder.children.push({
                        type: "folder",
                        ref: newFolder.id
                    });
                }

                folderStack.push(newFolder.id);
                continue;
            }

            // --- Lesezeichen ---
            if (upper.includes("<DT><A") || upper.includes("<A ")) {
                if (folderStack.length === 0) {
                    const autoFolder = createFolder("Allgemein");
                    folderStack.push(autoFolder.id);
                }

                const href = extractHref(line);
                let title = extractATitle(line);
                if (!title) title = href || "(Ohne Titel)";

                const currentFolderId = folderStack[folderStack.length - 1];
                const currentFolder = bookmarkData.folders.find(f => f.id === currentFolderId);

                bookmarkIndexMap[currentFolderId]++;
                const index = bookmarkIndexMap[currentFolderId];

                currentFolder.children.push({
                    type: "bookmark",
                    index: index,
                    title: title,
                    url: href
                });

                continue;
            }

            // --- Ordner schließen ---
            if (upper.includes("</DL>")) {
                if (folderStack.length > 0) {
                    folderStack.pop();
                }
                continue;
            }
        }

        setMessage("Lesezeichen erfolgreich geladen.");
        renderTree();

    } catch (err) {
        console.error(err);
        setMessage("Fehler beim Verarbeiten der HTML‑Datei.");
    }
}


// -----------------------------
// Parsing: JSON‑Export
// -----------------------------

function parseBookmarkJSON(jsonText) {
    try {
        const data = JSON.parse(jsonText);

        if (!data || !Array.isArray(data.folders)) {
            setMessage("Ungültiges JSON‑Format.");
            return;
        }

        bookmarkData = data;
        setMessage("JSON‑Lesezeichen geladen.");
        renderTree();

    } catch (err) {
        console.error(err);
        setMessage("Fehler beim Lesen der JSON‑Datei.");
    }
}


// -----------------------------
// DUPLIKATE FINDEN
// -----------------------------

function getDuplicateUrls() {
    const urlCount = {};

    function walk(folder) {
        for (const child of folder.children) {
            if (child.type === "bookmark") {
                const url = child.url.trim();
                urlCount[url] = (urlCount[url] || 0) + 1;
            }
            if (child.type === "folder") {
                const sub = bookmarkData.folders.find(f => f.id === child.ref);
                if (sub) walk(sub);
            }
        }
    }

    walk(bookmarkData.folders[0]);

    const duplicates = new Set(
        Object.keys(urlCount).filter(url => urlCount[url] > 1)
    );

    return duplicates;
}


// -----------------------------
// Suche in Ordnern
// -----------------------------

function matchesFolder(folder) {
    if (!currentSearchTerm) return true;

    const term = currentSearchTerm.toLowerCase();
    return (folder.title || "").toLowerCase().includes(term);
}


// -----------------------------
// Suche in Lesezeichen
// -----------------------------

function matchesSearch(bookmark) {
    if (!currentSearchTerm) return true;

    const term = currentSearchTerm.toLowerCase();
    return (
        (bookmark.title || "").toLowerCase().includes(term) ||
        (bookmark.url || "").toLowerCase().includes(term)
    );
}


// -----------------------------
// Baumdarstellung
// -----------------------------

function renderTree() {
    treeContainer.innerHTML = "";

    if (!bookmarkData.folders.length) {
        treeContainer.textContent = "Noch keine Lesezeichen geladen.";
        return;
    }

    const rootFolder = bookmarkData.folders[0];

    const ul = document.createElement("ul");
    ul.className = "bookmark-tree";

    const rootLi = renderFolderNode(rootFolder, "1");

    if (rootLi) {
        ul.appendChild(rootLi);
    } else {
        ul.textContent = "Keine Treffer.";
    }

    treeContainer.appendChild(ul);
}


/**
 * Rendert einen Ordner rekursiv.
 */
function renderFolderNode(folder, numberPrefix) {
    const folderMatches = matchesFolder(folder);
    const duplicates = getDuplicateUrls();

    const li = document.createElement("li");

    const label = document.createElement("span");
    label.className = "folder-label";

    if (showNumbers) {
        const num = document.createElement("span");
        num.className = "entry-number";
        num.textContent = numberPrefix + " ";
        label.appendChild(num);
    }

    if (folderMatches && currentSearchTerm) {
        label.classList.add("highlight");
    }

    label.appendChild(document.createTextNode(folder.title));
    li.appendChild(label);

    const ul = document.createElement("ul");
    ul.className = "bookmark-tree";

    let hasVisibleChildren = false;
    let folderChildCounter = 0;
    let bookmarkCounter = 0;

    for (const child of folder.children) {

        // --- Unterordner ---
        if (child.type === "folder") {
            const subFolder = bookmarkData.folders.find(f => f.id === child.ref);
            if (subFolder) {
                folderChildCounter++;

                const newPrefix = numberPrefix + "." + folderChildCounter;

                const subLi = renderFolderNode(subFolder, newPrefix);
                if (subLi) {
                    ul.appendChild(subLi);
                    hasVisibleChildren = true;
                }
            }
        }

        // --- Lesezeichen ---
        else if (child.type === "bookmark") {

            // Filter: nur Duplikate anzeigen?
            if (showDuplicatesOnly && !duplicates.has(child.url)) {
                continue;
            }

            // Filter: Suchbegriff
            if (currentSearchTerm && !matchesSearch(child)) continue;

            bookmarkCounter++;

            const liB = document.createElement("li");
            liB.className = "bookmark-item";

            if (showNumbers) {
                const num = document.createElement("span");
                num.className = "entry-number";
                num.textContent = numberPrefix + "." + bookmarkCounter + " ";
                liB.appendChild(num);
            }

            const link = document.createElement("a");
            link.href = child.url;
            link.textContent = child.title;
            link.target = "_blank";

            if (currentSearchTerm && matchesSearch(child)) {
                link.classList.add("highlight");
            }

            liB.appendChild(link);

            // URL‑Anzeige (global)
            const urlDiv = document.createElement("div");
            urlDiv.textContent = child.url;
            urlDiv.style.marginLeft = "20px";
            urlDiv.style.fontSize = "0.9em";
            urlDiv.style.color = "#444";
            urlDiv.style.display = showAllUrls ? "block" : "none";

            liB.appendChild(urlDiv);

            ul.appendChild(liB);
            hasVisibleChildren = true;
        }
    }

    if (currentSearchTerm && !hasVisibleChildren && !folderMatches) {
        return null;
    }

    li.appendChild(ul);
    return li;
}


// -----------------------------
// Sucheingabe
// -----------------------------

searchInput.addEventListener("input", () => {
    currentSearchTerm = searchInput.value.trim();
    renderTree();
});


// -----------------------------
// Nummern ein-/ausblenden
// -----------------------------

btnToggleNumbers.addEventListener("click", () => {
    showNumbers = !showNumbers;
    btnToggleNumbers.textContent = showNumbers ? "Nummern ausblenden" : "Nummern anzeigen";
    renderTree();
});


// -----------------------------
// ALLE URLs ein-/ausblenden
// -----------------------------

btnToggleAllUrls.addEventListener("click", () => {
    showAllUrls = !showAllUrls;
    btnToggleAllUrls.textContent = showAllUrls ? "Alle URLs ausblenden" : "Alle URLs anzeigen";
    renderTree();
});


// -----------------------------
// DUPLIKATE anzeigen
// -----------------------------

btnShowDuplicates.addEventListener("click", () => {
    showDuplicatesOnly = !showDuplicatesOnly;
    btnShowDuplicates.textContent = showDuplicatesOnly
        ? "Alle anzeigen"
        : "Doppelte Links anzeigen";

    renderTree();
});


// -----------------------------
// Export
// -----------------------------

btnExport.addEventListener("click", () => {
    if (!bookmarkData.folders.length) {
        setMessage("Keine Daten zum Exportieren.");
        return;
    }

    const json = JSON.stringify(bookmarkData, null, 2);

    const now = new Date();
    const fileName =
        "Lesezeichen_" +
        now.toISOString().replace(/[:.]/g, "-") +
        ".json";

    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();

    URL.revokeObjectURL(url);

    setMessage("Export abgeschlossen.");
});


// -----------------------------
// Startmeldung
// -----------------------------

setMessage("Bitte eine Lesezeichen‑Datei laden.");
