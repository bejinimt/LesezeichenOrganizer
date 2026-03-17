// ============================================================
// Lesezeichen‑Organizer – Version mit zeilenweisem Parsing
// ============================================================


// -----------------------------
// Globale Variablen
// -----------------------------

let bookmarkData = {
    folders: []
};

let showNumbers = false;
let currentSearchTerm = "";


// -----------------------------
// DOM‑Elemente
// -----------------------------

const btnLoad = document.getElementById("btnLoad");
const btnToggleNumbers = document.getElementById("btnToggleNumbers");
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

                // Wenn wir schon in einem Ordner sind → Kind hinzufügen
                if (folderStack.length > 0) {
                    const parentId = folderStack[folderStack.length - 1];
                    const parentFolder = bookmarkData.folders.find(f => f.id === parentId);
                    parentFolder.children.push({
                        type: "folder",
                        ref: newFolder.id
                    });
                }

                // Dies ist jetzt der aktuelle Ordner
                folderStack.push(newFolder.id);
                continue;
            }

            // --- Lesezeichen ---
            if (upper.includes("<DT><A") || upper.includes("<A ")) {
                // Falls ein Link vor dem ersten Ordner kommt → eigenen Ordner erzeugen
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
// Baumdarstellung
// -----------------------------

function renderTree() {
    treeContainer.innerHTML = "";

    if (!bookmarkData.folders.length) {
        treeContainer.textContent = "Noch keine Lesezeichen geladen.";
        return;
    }

    // Der erste Ordner ist jetzt die echte Wurzel
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


/**
 * Rendert einen Ordner rekursiv.
 */
function renderFolderNode(folder) {
    const li = document.createElement("li");

    const label = document.createElement("span");
    label.className = "folder-label";

    if (showNumbers) {
        const num = document.createElement("span");
        num.className = "entry-number";
        num.textContent = `[${folder.id}] `;
        label.appendChild(num);
    }

    label.appendChild(document.createTextNode(folder.title));
    li.appendChild(label);

    const ul = document.createElement("ul");
    ul.className = "bookmark-tree";

    let hasVisibleChildren = false;

    for (const child of folder.children) {

        // --- Unterordner ---
        if (child.type === "folder") {
            const subFolder = bookmarkData.folders.find(f => f.id === child.ref);
            if (subFolder) {
                const subLi = renderFolderNode(subFolder);
                if (subLi) {
                    ul.appendChild(subLi);
                    hasVisibleChildren = true;
                }
            }
        }

        // --- Lesezeichen ---
        else if (child.type === "bookmark") {
            if (currentSearchTerm && !matchesSearch(child)) continue;

            const liB = document.createElement("li");
            liB.className = "bookmark-item";

            if (showNumbers) {
                const num = document.createElement("span");
                num.className = "entry-number";
                num.textContent = `[${folder.id}/${child.index}] `;
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
            ul.appendChild(liB);
            hasVisibleChildren = true;
        }
    }

    if (currentSearchTerm && !hasVisibleChildren) return null;

    li.appendChild(ul);
    return li;
}


// -----------------------------
// Suche
// -----------------------------

function matchesSearch(bookmark) {
    if (!currentSearchTerm) return true;

    const term = currentSearchTerm.toLowerCase();
    return (
        (bookmark.title || "").toLowerCase().includes(term) ||
        (bookmark.url || "").toLowerCase().includes(term)
    );
}

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
