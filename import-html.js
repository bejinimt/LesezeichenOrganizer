// ------------------------------------------------------------
// import-html.js (zeilenbasierte Version wie parser-html.js)
// Erkennt Tags im Format [[TAGS: ...]]
// ------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {

    const fileInput = document.getElementById("fileInputHtml");
    const btnLoadHtml = document.getElementById("btnLoadHtml");

    if (!btnLoadHtml || !fileInput) return;

    btnLoadHtml.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const text = await file.text();
        const lines = text.split(/\r?\n/);

        const folders = [];
        let folderIdCounter = 1;
        let absCounter = 1;

        const stack = [];

        function createFolder(title) {
            return {
                id: folderIdCounter++,
                title,
                children: [],
                visible: true,
                selected: false,
                showCheckbox: false
            };
        }

        // Root-Ordner
        const root = createFolder("ROOT");
        folders.push(root);
        stack.push(root);

        for (let rawLine of lines) {
            const line = rawLine.trim();

            // Ordner öffnen
            if (line.startsWith("<H3")) {
                const title = line.replace(/.*<H3[^>]*>(.*?)<\/H3>.*/, "$1").trim();
                const folder = createFolder(title);

                // Elternordner bekommt Verweis
                const parent = stack[stack.length - 1];
                parent.children.push({
                    type: "folder",
                    ref: folder.id
                });

                folders.push(folder);
                continue;
            }

            // <DL> → neuer Ordner beginnt
            if (line.startsWith("<DL")) {
                const lastFolder = folders[folders.length - 1];
                stack.push(lastFolder);
                continue;
            }

            // </DL> → Ordner endet
            if (line.startsWith("</DL")) {
                stack.pop();
                continue;
            }

            // Bookmark
            if (line.startsWith("<DT><A")) {
                const url = line.replace(/.*HREF="(.*?)".*/, "$1");

                let title = line.replace(/.*>(.*?)<\/A>.*/, "$1").trim();
                let tags = [];

                // Tags extrahieren: [[TAGS: ...]]
                const tagMatch = title.match(/^(.*)\s*\[\[TAGS:(.*?)\]\]$/);
                if (tagMatch) {
                    title = tagMatch[1].trim();
                    tags = tagMatch[2].split(",").map(t => t.trim());
                }

                const parent = stack[stack.length - 1];
                parent.children.push({
                    type: "bookmark",
                    title,
                    url,
                    tags,
                    visible: true,
                    selected: false,
                    showCheckbox: false,
                    absoluteNumber: (absCounter++).toString()
                });

                continue;
            }
        }

        // Globale Datenstruktur setzen
        window.bookmarkData = { folders };

        // Index neu aufbauen
        window.buildBookmarkIndex();

        // Rendern
        window.renderTree();

        window.setMessage("HTML erfolgreich importiert.");
    });
});
