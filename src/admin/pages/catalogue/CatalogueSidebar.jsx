// src/admin/pages/catalogue/CatalogueSidebar.jsx
import { useState, useMemo } from "react";
import "./CatalogueSidebar.css";
import { ago } from "./utils";

const STATUT_CFG = {
  BROUILLON: { color: "#64748B", bg: "#F1F5F9", dot: "#94A3B8", label: "Brouillon" },
  PLANIFIE:  { color: "#3B82F6", bg: "#DBEAFE", dot: "#3B82F6", label: "Planifié"  },
  EN_COURS:  { color: "#F59E0B", bg: "#FEF3C7", dot: "#F59E0B", label: "En cours"  },
  ENVOYE:    { color: "#10B981", bg: "#D1FAE5", dot: "#10B981", label: "Envoyé"    },
  ECHOUE:    { color: "#EF4444", bg: "#FEE2E2", dot: "#EF4444", label: "Échoué"    },
};

function StatutPill({ statut }) {
  const cfg = STATUT_CFG[statut] || STATUT_CFG.BROUILLON;
  return (
    <span className="cs-pill" style={{ color: cfg.color, background: cfg.bg }}>
      <span className="cs-pill__dot" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

const FILTER_STATUTS = [
  { key: "ALL",      label: "Tous"      },
  { key: "BROUILLON",label: "Brouillons"},
  { key: "ENVOYE",   label: "Envoyés"   },
  { key: "PLANIFIE", label: "Planifiés" },
  { key: "ECHOUE",   label: "Échoués"   },
];

export default function CatalogueSidebar({ catalogues, loading, activeId, onSelect, onNew, onDelete }) {
  const [search,      setSearch]      = useState("");
  const [filterStatut,setFilterStatut]= useState("ALL");
  const [sortBy,      setSortBy]      = useState("date_desc");
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom,    setDateFrom]    = useState("");
  const [dateTo,      setDateTo]      = useState("");

  // ── Filtrage + tri ────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...catalogues];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c => c.titre.toLowerCase().includes(q));
    }

    if (filterStatut !== "ALL") {
      list = list.filter(c => c.statut === filterStatut);
    }

    if (dateFrom) {
      list = list.filter(c => new Date(c.created_at) >= new Date(dateFrom));
    }
    if (dateTo) {
      list = list.filter(c => new Date(c.created_at) <= new Date(dateTo + "T23:59:59"));
    }

    list.sort((a, b) => {
      switch (sortBy) {
        case "date_desc":   return new Date(b.created_at) - new Date(a.created_at);
        case "date_asc":    return new Date(a.created_at) - new Date(b.created_at);
        case "envoyes_desc":return (b.nb_envoyes || 0) - (a.nb_envoyes || 0);
        case "titre_asc":   return a.titre.localeCompare(b.titre);
        default:            return 0;
      }
    });

    return list;
  }, [catalogues, search, filterStatut, sortBy, dateFrom, dateTo]);

  const hasActiveFilters = filterStatut !== "ALL" || dateFrom || dateTo || sortBy !== "date_desc";
  const resetFilters = () => { setFilterStatut("ALL"); setDateFrom(""); setDateTo(""); setSortBy("date_desc"); };

  // ── Stats rapides ──────────────────────────────────────
  const stats = useMemo(() => ({
    total:    catalogues.length,
    envoyes:  catalogues.filter(c => c.statut === "ENVOYE").length,
    brouillons: catalogues.filter(c => c.statut === "BROUILLON").length,
  }), [catalogues]);

  return (
    <aside className="cs-root">

      {/* ── Header ── */}
      <div className="cs-header">
        <div className="cs-header__top">
          <div className="cs-header__title-wrap">
            <div className="cs-header__icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <div>
              <h2 className="cs-header__title">Catalogues Email</h2>
              <p className="cs-header__sub">{stats.total} catalogue{stats.total > 1 ? "s" : ""}</p>
            </div>
          </div>
          <button className="cs-btn-new" onClick={onNew}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nouveau
          </button>
        </div>

        {/* Mini stats */}
        <div className="cs-stats-row">
          <div className="cs-stat">
            <span className="cs-stat__val" style={{ color: "#10B981" }}>{stats.envoyes}</span>
            <span className="cs-stat__lbl">envoyés</span>
          </div>
          <div className="cs-stat-sep" />
          <div className="cs-stat">
            <span className="cs-stat__val" style={{ color: "#64748B" }}>{stats.brouillons}</span>
            <span className="cs-stat__lbl">brouillons</span>
          </div>
          <div className="cs-stat-sep" />
          <div className="cs-stat">
            <span className="cs-stat__val" style={{ color: "#C4973A" }}>
              {catalogues.reduce((s, c) => s + (c.nb_envoyes || 0), 0)}
            </span>
            <span className="cs-stat__lbl">emails envoyés</span>
          </div>
        </div>
      </div>

      {/* ── Barre recherche + filtre ── */}
      <div className="cs-search-bar">
        <div className="cs-search-wrap">
          <svg className="cs-search-ico" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            className="cs-search-input"
            placeholder="Rechercher un catalogue..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="cs-search-clear" onClick={() => setSearch("")}>✕</button>
          )}
        </div>
        <button
          className={`cs-filter-btn${showFilters ? " cs-filter-btn--active" : ""}${hasActiveFilters ? " cs-filter-btn--dot" : ""}`}
          onClick={() => setShowFilters(v => !v)}
          title="Filtres avancés"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
        </button>
      </div>

      {/* ── Filtres avancés (panel déroulant) ── */}
      {showFilters && (
        <div className="cs-filters-panel">
          {/* Statut */}
          <div className="cs-filter-group">
            <label className="cs-filter-label">Statut</label>
            <div className="cs-filter-chips">
              {FILTER_STATUTS.map(f => (
                <button
                  key={f.key}
                  className={`cs-filter-chip${filterStatut === f.key ? " cs-filter-chip--active" : ""}`}
                  onClick={() => setFilterStatut(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tri */}
          <div className="cs-filter-group">
            <label className="cs-filter-label">Trier par</label>
            <select className="cs-filter-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="date_desc">Date (récent d'abord)</option>
              <option value="date_asc">Date (ancien d'abord)</option>
              <option value="envoyes_desc">Envois (plus élevé)</option>
              <option value="titre_asc">Titre (A → Z)</option>
            </select>
          </div>

          {/* Plage de dates */}
          <div className="cs-filter-group">
            <label className="cs-filter-label">Période de création</label>
            <div className="cs-filter-dates">
              <input type="date" className="cs-filter-date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} placeholder="Du" />
              <span className="cs-filter-date-sep">→</span>
              <input type="date" className="cs-filter-date" value={dateTo}   onChange={e => setDateTo(e.target.value)}   placeholder="Au" />
            </div>
          </div>

          {hasActiveFilters && (
            <button className="cs-filter-reset" onClick={resetFilters}>
              ↺ Réinitialiser les filtres
            </button>
          )}
        </div>
      )}

      {/* ── Tabs statut rapide ── */}
      {!showFilters && (
        <div className="cs-tabs">
          {FILTER_STATUTS.slice(0, 4).map(f => (
            <button
              key={f.key}
              className={`cs-tab${filterStatut === f.key ? " cs-tab--active" : ""}`}
              onClick={() => setFilterStatut(f.key)}
            >
              {f.label}
              <span className="cs-tab__count">
                {f.key === "ALL" ? catalogues.length : catalogues.filter(c => c.statut === f.key).length}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* ── Résultat filtré ── */}
      {(search || hasActiveFilters) && (
        <div className="cs-result-bar">
          {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
          {hasActiveFilters && (
            <button className="cs-result-bar__reset" onClick={resetFilters}>Effacer</button>
          )}
        </div>
      )}

      {/* ── Liste ── */}
      <div className="cs-list">
        {loading && (
          <div className="cat-loading-center">
            <div className="cs-spinner" />
            Chargement...
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="cs-empty">
            <div className="cs-empty__icon">📭</div>
            <p className="cs-empty__title">
              {search ? "Aucun résultat" : "Aucun catalogue"}
            </p>
            <p className="cs-empty__sub">
              {search ? `"${search}" ne correspond à aucun catalogue` : "Créez votre premier catalogue email"}
            </p>
          </div>
        )}

        {filtered.map((cat, i) => {
          const isActive = cat.id === activeId;
          const cfg = STATUT_CFG[cat.statut] || STATUT_CFG.BROUILLON;
          const totalEnvoyes = cat.nb_envoyes || 0;

          return (
            <div
              key={cat.id}
              className={`cs-card${isActive ? " cs-card--active" : ""}`}
              onClick={() => onSelect(cat)}
              style={{ animationDelay: `${i * 0.04}s` }}
            >
              {/* Indicateur statut (barre gauche) */}
              <div className="cs-card__accent" style={{ background: cfg.dot }} />

              <div className="cs-card__body">
                <div className="cs-card__row1">
                  <p className="cs-card__titre">{cat.titre}</p>
                  <button
                    className="cs-card__del"
                    onClick={e => { e.stopPropagation(); onDelete(cat.id); }}
                    title="Supprimer"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>

                <div className="cs-card__row2">
                  <StatutPill statut={cat.statut} />
                  <span className="cs-card__date">{ago(cat.created_at)}</span>
                </div>

                {(totalEnvoyes > 0 || cat.nb_echecs > 0) && (
                  <div className="cs-card__metrics">
                    {totalEnvoyes > 0 && (
                      <span className="cs-card__metric cs-card__metric--green">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        {totalEnvoyes}
                      </span>
                    )}
                    {cat.nb_echecs > 0 && (
                      <span className="cs-card__metric cs-card__metric--red">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        {cat.nb_echecs}
                      </span>
                    )}
                    {(cat.hotel_ids?.length > 0) && (
                      <span className="cs-card__metric cs-card__metric--neutral">
                        🏨 {cat.hotel_ids.length}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}