// ------------------------------------------------------------
// export-html.js
// Exportiert NUR sichtbare Bookmarks als Netscape-HTML
// Tags werden als [[TAGS: ...]] an den Titel angehängt
// ------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {

    const btn = document.getElementById("btnExportHtml");
    if (!btn) return;

    btn.addEventListener("click", () => {

        if (!window.bookmarkData || !window.bookmarkData.folders.length) {
            window.setMessage("Keine Daten zum Exportieren.");
            return;
        }

        let html = "";
        html += '<!DOCTYPE NETSCAPE-Bookmark-file-1>\n';
        html += '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">\n';
        html += '<TITLE>Bookmarks</TITLE>\n';
        html += '<H1>Bookmarks</H1>\n';
        html += '<DL><p>\n';

        // --------------------------------------------------------
        // Rekursive Exportfunktion
        // --------------------------------------------------------
        function exportFolder(folder, indent) {
            const pad = "    ".repeat(indent);

            html += `${pad}<DT><H3>${escapeHtml(folder.title)}</H3>\n`;
            html += `${pad}<DL><p>\n`;

            for (const child of folder.children) {

                // Sichtbare Bookmarks exportieren
                if (child.type === "bookmark") {

                    if (child.visible === false) continue;

                    const title = escapeHtml(child.title || "");

                    // Tags anhängen
                    let tagSuffix = "";
                    if (child.tags && child.tags.length > 0) {
                        tagSuffix = ` [[TAGS: ${child.tags.join(", ")}]]`;
                    }

                    html += `${pad}    <DT><A HREF="${escapeHtml(child.url)}">${title}${tagSuffix}</A>\n`;
                }

                // Unterordner
                if (child.type === "folder") {
                    const sub = window.bookmarkData.folders.find(f => f.id === child.ref);
                    if (sub) exportFolder(sub, indent + 1);
                }
            }

            html += `${pad}</DL><p>\n`;
        }

        // Root-Folder exportieren
        exportFolder(window.bookmarkData.folders[0], 1);

        html += '</DL><p>\n';

        // Datei speichern
        const blob = new Blob([html], { type: "text/html" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "Lesezeichen_export.html";
        a.click();

        URL.revokeObjectURL(url);

        window.setMessage("HTML-Export abgeschlossen.");
    });

});


// ------------------------------------------------------------
// HTML escapen
// ------------------------------------------------------------
function escapeHtml(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}
