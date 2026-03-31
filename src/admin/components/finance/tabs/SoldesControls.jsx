/**
 * SoldesControls — barre de recherche + filtres avancés pour l'onglet Soldes.
 *
 * @prop {object}   filters          — état courant des filtres
 * @prop {Function} setFilter        — (key, value) => void
 * @prop {Function} resetFilters     — () => void
 * @prop {number}   activeFilterCount
 * @prop {number}   total            — nb total de partenaires
 * @prop {number}   filtered         — nb après filtrage
 */
import { useState } from "react";

export default function SoldesControls({
  filters, setFilter, resetFilters, activeFilterCount, total, filtered,
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="sl-controls">
      {/* ── Ligne principale ── */}
      <div className="sl-controls-row">

        {/* Barre de recherche */}
        <div className="sl-search-wrap">
          <svg className="sl-search-icon" viewBox="0 0 20 20" fill="none" width="15" height="15">
            <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M15 15l-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          <input
            className="sl-search-input"
            type="text"
            placeholder="Rechercher par nom, email ou entreprise…"
            value={filters.search}
            onChange={(e) => setFilter("search", e.target.value)}
          />
          {filters.search && (
            <button className="sl-search-clear" onClick={() => setFilter("search", "")}>✕</button>
          )}
        </div>

        {/* Bouton filtres */}
        <button
          className={`sl-filter-btn${open ? " open" : ""}${activeFilterCount > 0 ? " active" : ""}`}
          onClick={() => setOpen((o) => !o)}
        >
          <svg viewBox="0 0 20 20" fill="none" width="14" height="14">
            <path d="M3 5h14M6 10h8M9 15h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          Filtres
          {activeFilterCount > 0 && (
            <span className="sl-filter-badge">{activeFilterCount}</span>
          )}
        </button>

        {/* Reset */}
        {activeFilterCount > 0 && (
          <button className="sl-reset-btn" onClick={resetFilters}>✕ Réinitialiser</button>
        )}

        {/* Compteur résultats */}
        {total > 0 && (
          <span className="sl-count">
            {filtered !== total
              ? <><b>{filtered}</b> / {total} partenaire{total > 1 ? "s" : ""}</>
              : <>{total} partenaire{total > 1 ? "s" : ""}</>}
          </span>
        )}
      </div>

      {/* ── Panneau filtres avancés ── */}
      {open && (
        <div className="sl-filters-panel">

          {/* Tri */}
          <div className="sl-filter-section">
            <span className="sl-filter-section-label">Trier par</span>
            <div className="sl-btn-group">
              {[
                ["solde_du",       "Montant dû"],
                ["nb_commissions", "Nb commissions"],
                ["partenaire_nom", "Nom"],
                ["revenu_hotel",   "Revenu hôtel"],
              ].map(([col, label]) => (
                <button
                  key={col}
                  className={`sl-btn-choice${filters.sortCol === col ? " on" : ""}`}
                  onClick={() => setFilter("sortCol", col)}
                >
                  {label}
                  {filters.sortCol === col && (
                    <span className="sl-sort-dir">{filters.sortDir === "desc" ? " ↓" : " ↑"}</span>
                  )}
                </button>
              ))}
              <button
                className="sl-btn-choice sl-dir-btn"
                onClick={() => setFilter("sortDir", filters.sortDir === "desc" ? "asc" : "desc")}
                title="Inverser l'ordre"
              >
                {filters.sortDir === "desc" ? "↓ Décroissant" : "↑ Croissant"}
              </button>
            </div>
          </div>

          <div className="sl-filter-grid">
            {/* Montant min / max */}
            <div className="sl-filter-group">
              <label className="sl-filter-label">Montant dû — min (DT)</label>
              <input
                type="number" min="0" className="sl-num-input"
                placeholder="0"
                value={filters.montantMin}
                onChange={(e) => setFilter("montantMin", e.target.value)}
              />
            </div>
            <div className="sl-filter-group">
              <label className="sl-filter-label">Montant dû — max (DT)</label>
              <input
                type="number" min="0" className="sl-num-input"
                placeholder="∞"
                value={filters.montantMax}
                onChange={(e) => setFilter("montantMax", e.target.value)}
              />
            </div>

            {/* Nb commissions min / max */}
            <div className="sl-filter-group">
              <label className="sl-filter-label">Commissions — min</label>
              <input
                type="number" min="0" className="sl-num-input"
                placeholder="0"
                value={filters.nbCommMin}
                onChange={(e) => setFilter("nbCommMin", e.target.value)}
              />
            </div>
            <div className="sl-filter-group">
              <label className="sl-filter-label">Commissions — max</label>
              <input
                type="number" min="0" className="sl-num-input"
                placeholder="∞"
                value={filters.nbCommMax}
                onChange={(e) => setFilter("nbCommMax", e.target.value)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}