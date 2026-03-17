window.renderTree = function () {
    treeContainer.innerHTML = "";

    if (!window.bookmarkData.folders.length) {
        treeContainer.textContent = "Noch keine Lesezeichen geladen.";
        return;
    }

    const rootFolder = window.bookmarkData.folders[0];

    const ul = document.createElement("ul");
    ul.className = "bookmark-tree";

    const rootLi = window.renderFolderNode(rootFolder);

    if (rootLi) {
        ul.appendChild(rootLi);
    } else {
        ul.textContent = "Keine Treffer.";
    }

    treeContainer.appendChild(ul);
};


window.renderFolderNode = function (folder) {
    const duplicates = window.getDuplicateInfo();
    const folderMatches = window.matchesFolder(folder);

    let hasVisibleChildren = false;

    const li = document.createElement("li");

    const label = document.createElement("span");
    label.className = "folder-label";

    if (window.showNumbers && folder.absoluteNumber) {
        const num = document.createElement("span");
        num.className = "entry-number";
        num.textContent = folder.absoluteNumber + " ";
        label.appendChild(num);
    }

    if (folderMatches && window.currentSearchTerm) {
        label.classList.add("highlight");
    }

    label.appendChild(document.createTextNode(folder.title));
    li.appendChild(label);

    // Checkbox für Ordner
    if (folder.showCheckbox) {
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.className = "folder-checkbox";
        cb.checked = folder.selected;

        cb.addEventListener("change", () => {
            folder.selected = cb.checked;
        });

        li.appendChild(cb);
    }

    const ul = document.createElement("ul");
    ul.className = "bookmark-tree";

    for (const child of folder.children) {

        // Unterordner
        if (child.type === "folder") {
            const subFolder = window.bookmarkData.folders.find(f => f.id === child.ref);
            const subLi = window.renderFolderNode(subFolder);

            if (subLi) {
                ul.appendChild(subLi);
                hasVisibleChildren = true;
            }
        }

        // Lesezeichen
        else if (child.type === "bookmark") {

            const liB = document.createElement("li");
            liB.className = "bookmark-item";

            liB.id = "link-" + child.absoluteNumber.replace(/\./g, "-");

            const dupNums = duplicates.get(child.url);
            let visible = true;

            // Filter: nur Duplikate
            if (window.showDuplicatesOnly && !dupNums) {
                visible = false;
            }

            // Filter: Suche
            if (window.currentSearchTerm && !window.matchesSearch(child)) {
                visible = false;
            }

            // Filter: Sichtbarkeits-Flag
            if (child.visible === false) {
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

            // Nummer
            if (window.showNumbers) {
                const num = document.createElement("span");
                num.className = "entry-number";
                num.textContent = child.absoluteNumber + " ";
                liB.appendChild(num);
            }

            // Link
            const link = document.createElement("a");

            // NEU: Link nur aktiv, wenn sichtbar
            if (child.visible === false) {
                link.href = "#";
                link.style.pointerEvents = "none";
                link.style.opacity = "0.5";
            } else {
                link.href = child.url;
                link.target = "_blank";
            }

            link.textContent = child.title;

            if (window.currentSearchTerm && window.matchesSearch(child)) {
                link.classList.add("highlight");
            }

            liB.appendChild(link);

            // Checkbox für Bookmark
            if (child.showCheckbox) {
                const cb = document.createElement("input");
                cb.type = "checkbox";
                cb.className = "bookmark-checkbox";
                cb.checked = child.selected;

                cb.addEventListener("change", () => {
                    child.selected = cb.checked;
                });

                liB.appendChild(cb);
            }

            // Fundstellen
            if (dupNums && window.showDuplicateLocations) {
                const info = document.createElement("span");
                info.style.color = "#b00";
                info.style.marginLeft = "8px";
                info.textContent = "(Fundstellen: ";

                dupNums.forEach((num, index) => {
                    const a = document.createElement("a");
                    const id = "link-" + num.replace(/\./g, "-");

                    a.href = "#" + id;
                    a.textContent = num;
                    a.style.color = "#b00";
                    a.style.textDecoration = "underline";

                    a.addEventListener("click", () => {
                        const target = document.getElementById(id);
                        if (target) {
                            target.classList.add("jump-highlight");
                            setTimeout(() => target.classList.remove("jump-highlight"), 1500);
                        }
                    });

                    info.appendChild(a);

                    if (index < dupNums.length - 1) {
                        info.appendChild(document.createTextNode(", "));
                    }
                });

                info.appendChild(document.createTextNode(")"));
                liB.appendChild(info);
            }

            // Tags
            if (child.tags && child.tags.length > 0) {
                const tagDiv = document.createElement("div");
                tagDiv.textContent = "Tags: " + child.tags.join(", ");
                tagDiv.style.marginLeft = "20px";
                tagDiv.style.fontSize = "0.9em";
                tagDiv.style.color = "#006";
                liB.appendChild(tagDiv);
            }

            // URL anzeigen
            const urlDiv = document.createElement("div");
            urlDiv.textContent = child.url;
            urlDiv.style.marginLeft = "20px";
            urlDiv.style.fontSize = "0.9em";
            urlDiv.style.color = "#444";

            // NEU: URL nur anzeigen, wenn sichtbar
            urlDiv.style.display =
                (window.showAllUrls && child.visible !== false)
                    ? "block"
                    : "none";

            liB.appendChild(urlDiv);

            ul.appendChild(liB);
        }
    }

    if (window.showDuplicatesOnly && !hasVisibleChildren) {
        return null;
    }

    li.appendChild(ul);
    return li;
};
