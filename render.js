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

            if (window.showDuplicatesOnly && !dupNums) {
                visible = false;
            }

            if (window.currentSearchTerm && !window.matchesSearch(child)) {
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

            if (window.showNumbers) {
                const num = document.createElement("span");
                num.className = "entry-number";
                num.textContent = child.absoluteNumber + " ";
                liB.appendChild(num);
            }

            const link = document.createElement("a");
            link.href = child.url;
            link.textContent = child.title;
            link.target = "_blank";

            if (window.currentSearchTerm && window.matchesSearch(child)) {
                link.classList.add("highlight");
            }

            liB.appendChild(link);

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
            urlDiv.style.display = window.showAllUrls ? "block" : "none";

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
