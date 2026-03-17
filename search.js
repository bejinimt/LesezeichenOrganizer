window.matchesFolder = function (folder) {
    if (!window.currentSearchTerm) return true;
    return (folder.title || "").toLowerCase().includes(window.currentSearchTerm.toLowerCase());
};

window.matchesSearch = function (bookmark) {
    if (!window.currentSearchTerm) return true;
    const term = window.currentSearchTerm.toLowerCase();
    return (
        (bookmark.title || "").toLowerCase().includes(term) ||
        (bookmark.url || "").toLowerCase().includes(term) ||
        (bookmark.tags || []).some(t => t.toLowerCase().includes(term))
    );
};
