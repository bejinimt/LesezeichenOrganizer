// ============================================================
// Lesezeichen‑Organizer – Parsing, absolute Nummerierung,
// Suche, Duplikate (mit Fundstellen), globale URL‑Anzeige
// ============================================================


// -----------------------------
// Globale Variablen
// -----------------------------

let bookmarkData = { folders: [] };
let showNumbers = false;
let showAllUrls = false;
let showDuplicatesOnly = false;
let showDuplicateLocations = false;   // <-- NEU
let currentSearchTerm = "";


// -----------------------------
// DOM‑Elemente
// -----------------------------

const btnLoad = document.getElementById("btnLoad");
const btnToggleNumbers = document.getElementById("btnToggleNumbers");
const btnToggleAllUrls = document.getElementById("btnToggleAllUrls");
const btnShowDuplicates = document.getElementById("btnShowDuplicates");
const btnToggleLocations = document.getElementById("btnToggleLocations"); // <-- NEU
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


// ============================================================
// PARSING MIT ABSOLUTER NUMMERIERUNG
// ============================================================

function parseBookmarkHTML(htmlText) {
    try {
        const lines = htmlText.split(/\r?\n/);

        bookmarkData = { folders: [] };

        let folderCounter = 0;
        const folderStack = [];
        const numberStack = [];
        const localCounters = {};

        function createFolder(title) {
            folderCounter++;
            const folder = {
                id: folderCounter,
                title: title || "(Ohne Titel)",
                children: [],
                absoluteNumber: null
            };
            bookmarkData.folders.push(folder);
            localCounters[folder.id] = { folderCount: 0, linkCount: 0 };
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

                    localCounters[parentId].folderCount++;

                    const parentNum = numberStack[numberStack.length - 1];
                    const num = parentNum
                        ? parentNum + "." + localCounters[parentId].folderCount
                        : "" + localCounters[parentId].folderCount;

                    newFolder.absoluteNumber = num;
                    numberStack.push(num);
                } else {
                    newFolder.absoluteNumber = null;
                    numberStack.push("");
                }

                folderStack.push(newFolder.id);
                continue;
            }

            // --- Lesezeichen ---
            if (upper.includes("<DT><A") || upper.includes("<A ")) {
                if (folderStack.length === 0) {
                    const autoFolder = createFolder("Allgemein");
                    autoFolder.absoluteNumber = null;
                    folderStack.push(autoFolder.id);
                    numberStack.push("");
                }

                const href = extractHref(line);
                let title = extractATitle(line);
                if (!title) title = href || "(Ohne Titel)";

                const currentFolderId = folderStack[folderStack.length - 1];
                const currentFolder = bookmarkData.folders.find(f => f.id === currentFolderId);

                localCounters[currentFolderId].linkCount++;

                const base = numberStack[numberStack.length - 1];
                const absNum = base
                    ? base + "." + localCounters[currentFolderId].linkCount
                    : "" + localCounters[currentFolderId].linkCount;

                currentFolder.children.push({
                    type: "bookmark",
                    title: title,
                    url: href,
                    absoluteNumber: absNum
                });

                continue;
            }

            // --- Ordner schließen ---
            if (upper.includes("</DL>")) {
                if (folderStack.length > 0) {
                    folderStack.pop();
                    numberStack.pop();
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


// ============================================================
// JSON‑Parsing
// ============================================================

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


// ============================================================
// DUPLIKATE MIT FUNDSTELLEN (Map statt Set)
// ============================================================

function getDuplicateInfo() {
    const map = new Map();

    function walk(folder) {
        for (const child of folder.children) {

            if (child.type === "bookmark") {
                const url = child.url.trim();
                const num = child.absoluteNumber;

                if (!map.has(url)) {
                    map.set(url, []);
                }
                map.get(url).push(num);
            }

            if (child.type === "folder") {
                const sub = bookmarkData.folders.find(f => f.id === child.ref);
                if (sub) walk(sub);
            }
        }
    }

    walk(bookmarkData.folders[0]);

    for (const [url, nums] of map.entries()) {
        if (nums.length < 2) {
            map.delete(url);
        }
    }

    return map;
}


// ============================================================
// SUCHE
// ============================================================

function matchesFolder(folder) {
    if (!currentSearchTerm) return true;
    return (folder.title || "").toLowerCase().includes(currentSearchTerm.toLowerCase());
}

function matchesSearch(bookmark) {
    if (!currentSearchTerm) return true;
    const term = currentSearchTerm.toLowerCase();
    return (
        (bookmark.title || "").toLowerCase().includes(term) ||
        (bookmark.url || "").toLowerCase().includes(term)
    );
}


// ============================================================
// BAUMDARSTELLUNG
// ============================================================

function renderTree() {
    treeContainer.innerHTML = "";

    if (!bookmarkData.folders.length) {
        treeContainer.textContent = "Noch keine Lesezeichen geladen.";
        return;
    }

    const rootFolder = bookmarkData.folders[0];

    const ul = document.createElement("ul");
    ul.className = "bookmark-tree";

    const rootLi = renderFolderNode(rootFolder);

    if (rootLi) {
        ul.appendChild(rootLi);
    } else {
        ul.textContent = "Keine Treffer.";
    }

    treeContainer.appendChild(ul);
}


function renderFolderNode(folder) {
    const duplicates = getDuplicateInfo();
    const folderMatches = matchesFolder(folder);

    let hasVisibleChildren = false;

    const li = document.createElement("li");

    const label = document.createElement("span");
    label.className = "folder-label";

    if (showNumbers && folder.absoluteNumber) {
        const num = document.createElement("span");
        num.className = "entry-number";
        num.textContent = folder.absoluteNumber + " ";
        label.appendChild(num);
    }

    if (folderMatches && currentSearchTerm) {
        label.classList.add("highlight");
    }

    label.appendChild(document.createTextNode(folder.title));
    li.appendChild(label);

    const ul = document.createElement("ul");
    ul.className = "bookmark-tree";

    for (const child of folder.children) {

        // --- Unterordner ---
        if (child.type === "folder") {
            const subFolder = bookmarkData.folders.find(f => f.id === child.ref);
            const subLi = renderFolderNode(subFolder);

            if (subLi) {
                ul.appendChild(subLi);
                hasVisibleChildren = true;
            }
        }

        // --- Lesezeichen ---
        else if (child.type === "bookmark") {

            const liB = document.createElement("li");
            liB.className = "bookmark-item";

            const dupNums = duplicates.get(child.url);
            let visible = true;

            if (showDuplicatesOnly && !dupNums) {
                visible = false;
            }

            if (currentSearchTerm && !matchesSearch(child)) {
                visible = false;
            }

            if (!visible) {
                liB.style.display = "none";
            } else {
                hasVisibleChildren = true;
            }

            if (dupNums) {
                liB.classList.add("duplicate");
            }

            if (showNumbers) {
                const num = document.createElement("span");
                num.className = "entry-number";
                num.textContent = child.absoluteNumber + " ";
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

            // --- Fundstellen hinter dem Link (B1‑b) ---
            if (dupNums && showDuplicateLocations) {
                const info = document.createElement("span");
                info.style.color = "#b00";
                info.style.marginLeft = "8px";
                info.textContent = "(Fundstellen: " + dupNums.join(", ") + ")";
                liB.appendChild(info);
            }

            const urlDiv = document.createElement("div");
            urlDiv.textContent = child.url;
            urlDiv.style.marginLeft = "20px";
            urlDiv.style.fontSize = "0.9em";
            urlDiv.style.color = "#444";
            urlDiv.style.display = showAllUrls ? "block" : "none";

            liB.appendChild(urlDiv);

            ul.appendChild(liB);
        }
    }

    if (showDuplicatesOnly && !hasVisibleChildren) {
        return null;
    }

    li.appendChild(ul);
    return li;
}


// ============================================================
// EVENTS
// ============================================================

searchInput.addEventListener("input", () => {
    currentSearchTerm = searchInput.value.trim();
    renderTree();
});

btnToggleNumbers.addEventListener("click", () => {
    showNumbers = !showNumbers;
    btnToggleNumbers.textContent = showNumbers ? "Nummern ausblenden" : "Nummern anzeigen";
    renderTree();
});

btnToggleAllUrls.addEventListener("click", () => {
    showAllUrls = !showAllUrls;
    btnToggleAllUrls.textContent = showAllUrls ? "Alle URLs ausblenden" : "Alle URLs anzeigen";
    renderTree();
});

btnShowDuplicates.addEventListener("click", () => {
    showDuplicatesOnly = !showDuplicatesOnly;
    btnShowDuplicates.textContent = showDuplicatesOnly
        ? "Alle anzeigen"
        : "Doppelte Links anzeigen";
    renderTree();
});

// --- NEU: Fundstellen‑Toggle ---
btnToggleLocations.addEventListener("click", () => {
    showDuplicateLocations = !showDuplicateLocations;
    btnToggleLocations.textContent = showDuplicateLocations
        ? "Fundstellen ausblenden"
        : "Fundstellen anzeigen";
    renderTree();
});

btnExport.addEventListener("click", () => {
    if (!bookmarkData.folders.length) {
        setMessage("Keine Daten zum Exportieren.");
        return;
    }

    const json = JSON.stringify(bookmarkData, null, 2);
    const now = new Date();
    const fileName = "Lesezeichen_" + now.toISOString().replace(/[:.]/g, "-") + ".json";

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
