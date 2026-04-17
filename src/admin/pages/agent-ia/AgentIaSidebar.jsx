// ══════════════════════════════════════════════════════════
//  src/admin/pages/agent-ia/AgentIaSidebar.jsx
//  Sidebar des conversations (type ChatGPT)
// ══════════════════════════════════════════════════════════
import { useState, useMemo } from "react";

/* ── Helpers date ── */
function groupByDate(convs) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86400000;
  const weekAgo = today - 7 * 86400000;
  const monthAgo = today - 30 * 86400000;

  const groups = {
    "Aujourd'hui": [],
    "Hier": [],
    "7 derniers jours": [],
    "30 derniers jours": [],
    "Plus ancien": [],
  };

  for (const c of convs) {
    const ts = new Date(c.last_message_at).getTime();
    if (ts >= today) groups["Aujourd'hui"].push(c);
    else if (ts >= yesterday) groups["Hier"].push(c);
    else if (ts >= weekAgo) groups["7 derniers jours"].push(c);
    else if (ts >= monthAgo) groups["30 derniers jours"].push(c);
    else groups["Plus ancien"].push(c);
  }
  return groups;
}

export default function AgentIaSidebar({
  conversations,
  loading,
  activeConvId,
  onNewChat,
  onSelect,
  onRename,
  onDelete,
  onClearAll,
  collapsed,
  onToggleCollapse,
}) {
  const [search, setSearch] = useState("");
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  // Filtre par recherche
  const filtered = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter((c) => c.titre.toLowerCase().includes(q));
  }, [conversations, search]);

  const groups = useMemo(() => groupByDate(filtered), [filtered]);

  const startRename = (c) => {
    setRenamingId(c.id);
    setRenameValue(c.titre);
    setMenuOpenId(null);
  };

  const validateRename = async () => {
    if (renameValue.trim() && renameValue !== "") {
      await onRename(renamingId, renameValue.trim());
    }
    setRenamingId(null);
  };

  if (collapsed) {
    return (
      <aside className="aia-side aia-side-collapsed">
        <button
          className="aia-side-toggle"
          onClick={onToggleCollapse}
          title="Afficher l'historique"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <button className="aia-side-new-mini" onClick={onNewChat} title="Nouveau chat">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </aside>
    );
  }

  return (
    <aside className="aia-side">
      {/* Header sidebar */}
      <div className="aia-side-header">
        <button className="aia-side-new" onClick={onNewChat}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nouveau chat
        </button>
        <button
          className="aia-side-toggle"
          onClick={onToggleCollapse}
          title="Masquer l'historique"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>

      {/* Recherche */}
      <div className="aia-side-search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Rechercher…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Liste */}
      <div className="aia-side-list">
        {loading && <div className="aia-side-empty">Chargement…</div>}

        {!loading && filtered.length === 0 && (
          <div className="aia-side-empty">
            {search ? "Aucun résultat" : "Aucune conversation"}
          </div>
        )}

        {!loading &&
          Object.entries(groups).map(([label, items]) => {
            if (items.length === 0) return null;
            return (
              <div key={label} className="aia-side-group">
                <div className="aia-side-group-label">{label}</div>
                {items.map((c) => (
                  <div
                    key={c.id}
                    className={`aia-side-item ${
                      c.id === activeConvId ? "active" : ""
                    }`}
                  >
                    {renamingId === c.id ? (
                      <input
                        className="aia-side-rename"
                        value={renameValue}
                        autoFocus
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={validateRename}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") validateRename();
                          if (e.key === "Escape") setRenamingId(null);
                        }}
                      />
                    ) : (
                      <>
                        <button
                          className="aia-side-item-btn"
                          onClick={() => onSelect(c.id)}
                          title={c.titre}
                        >
                          <svg
                            className="aia-side-item-icon"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          </svg>
                          <span className="aia-side-item-title">{c.titre}</span>
                        </button>

                        <button
                          className="aia-side-item-more"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenId(menuOpenId === c.id ? null : c.id);
                          }}
                          title="Actions"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            stroke="none"
                          >
                            <circle cx="12" cy="5" r="1.8" />
                            <circle cx="12" cy="12" r="1.8" />
                            <circle cx="12" cy="19" r="1.8" />
                          </svg>
                        </button>

                        {menuOpenId === c.id && (
                          <>
                            <div
                              className="aia-menu-backdrop"
                              onClick={() => setMenuOpenId(null)}
                            />
                            <div className="aia-side-menu">
                              <button onClick={() => startRename(c)}>
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                                Renommer
                              </button>
                              <button
                                className="aia-side-menu-danger"
                                onClick={() => {
                                  setMenuOpenId(null);
                                  onDelete(c.id);
                                }}
                              >
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                                Supprimer
                              </button>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
      </div>

      {/* Footer sidebar */}
      {conversations.length > 0 && (
        <div className="aia-side-footer">
          <button className="aia-side-clear-all" onClick={onClearAll}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
            </svg>
            Effacer toutes les conversations
          </button>
        </div>
      )}
    </aside>
  );
}