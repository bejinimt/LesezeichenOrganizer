window.parseBookmarkHTML = function (htmlText) {
    try {
        const lines = htmlText.split(/\r?\n/);

        window.bookmarkData = { folders: [] };

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
            window.bookmarkData.folders.push(folder);
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

            // Ordner
            if (upper.includes("<DT><H3") || upper.includes("<H3")) {
                const title = extractH3Title(line) || "(Ohne Titel)";
                const newFolder = createFolder(title);

                if (folderStack.length > 0) {
                    const parentId = folderStack[folderStack.length - 1];
                    const parentFolder = window.bookmarkData.folders.find(f => f.id === parentId);

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

            // Lesezeichen
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
                const currentFolder = window.bookmarkData.folders.find(f => f.id === currentFolderId);

                localCounters[currentFolderId].linkCount++;

                const base = numberStack[numberStack.length - 1];
                const absNum = base
                    ? base + "." + localCounters[currentFolderId].linkCount
                    : "" + localCounters[currentFolderId].linkCount;

                currentFolder.children.push({
                    type: "bookmark",
                    title: title,
                    url: href,
                    absoluteNumber: absNum,
                    tags: [currentFolder.title]
                });

                continue;
            }

            // Ordner schließen
            if (upper.includes("</DL>")) {
                if (folderStack.length > 0) {
                    folderStack.pop();
                    numberStack.pop();
                }
                continue;
            }
        }

        window.setMessage("Lesezeichen erfolgreich geladen.");
        window.renderTree();

    } catch (err) {
        console.error(err);
        window.setMessage("Fehler beim Verarbeiten der HTML‑Datei.");
    }
};
