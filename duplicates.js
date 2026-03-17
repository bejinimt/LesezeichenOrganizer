// ------------------------------------------------------------
// duplicates.js
// Findet Duplikate + führt Tags zusammen (nutzt bookmarkIndex)
// ------------------------------------------------------------

window.getDuplicateInfo = function () {

    // Falls der Index noch nicht existiert → jetzt aufbauen
    if (!window.bookmarkIndex) {
        window.buildBookmarkIndex();
    }

    const map = new Map();

    // Baum einmal durchlaufen und URLs sammeln
    function walk(folder) {
        for (const child of folder.children) {

            if (child.type === "bookmark") {

                // ⭐ NEU: Unsichtbare Bookmarks ignorieren
                if (child.visible === false) continue;

                const url = child.url.trim();
                const num = child.absoluteNumber;

                if (!map.has(url)) {
                    map.set(url, []);
                }
                map.get(url).push(num);
            }

            if (child.type === "folder") {
                const sub = window.bookmarkData.folders.find(f => f.id === child.ref);
                if (sub) walk(sub);
            }
        }
    }

    walk(window.bookmarkData.folders[0]);

    // Nur echte Duplikate behalten
    for (const [url, nums] of map.entries()) {
        if (nums.length < 2) {
            map.delete(url);
        }
    }

    // --------------------------------------------------------
    // Tags aller Duplikate zusammenführen
    // --------------------------------------------------------

    for (const [url, nums] of map.entries()) {

        const collectedTags = new Set(); // verhindert doppelte Tags

        // Tags einsammeln
        nums.forEach(num => {
            const bm = window.bookmarkIndex[num]; // DIREKTER Zugriff
            if (bm && bm.tags) {
                bm.tags.forEach(t => collectedTags.add(t));
            }
        });

        const mergedTags = Array.from(collectedTags);

        // Allen Bookmarks diese neuen Tags zuweisen
        nums.forEach(num => {
            const bm = window.bookmarkIndex[num];
            if (bm) {
                bm.tags = mergedTags; // alte Tags überschreiben
            }
        });
    }

    return map;
};
