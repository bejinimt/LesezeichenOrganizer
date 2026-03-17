// ------------------------------------------------------------
// bookmark-index.js
// Baut einen schnellen Lookup-Index: absoluteNumber → Bookmark
// ------------------------------------------------------------

window.buildBookmarkIndex = function () {
    window.bookmarkIndex = {}; // flaches Objekt für O(1)-Zugriff

    function walk(folder) {
        for (const child of folder.children) {

            // Bookmark → in Index eintragen
            if (child.type === "bookmark") {
                window.bookmarkIndex[child.absoluteNumber] = child;
            }

            // Unterordner → rekursiv weiterlaufen
            if (child.type === "folder") {
                const sub = window.bookmarkData.folders.find(f => f.id === child.ref);
                if (sub) walk(sub);
            }
        }
    }

    // Startpunkt: Root-Ordner
    walk(window.bookmarkData.folders[0]);
};
