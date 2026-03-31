/**
 * ReservationsFilters — panneau de filtres avancés pour les réservations.
 *
 * @prop {object}   filters          — état courant des filtres
 * @prop {Function} setFilter        — (key, value) => void
 * @prop {Function} resetFilters     — () => void
 * @prop {number}   activeFilterCount — nb de filtres actifs
 */
import { useState } from "react";

export default function ReservationsFilters({ filters, setFilter, resetFilters, activeFilterCount }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rs-filters-wrap">
      {/* Bouton toggle */}
      <button
        className={`rs-filters-toggle${open ? " open" : ""}${activeFilterCount > 0 ? " active" : ""}`}
        onClick={() => setOpen((o) => !o)}
      >
        <svg viewBox="0 0 20 20" fill="none" width="15" height="15">
          <path d="M3 5h14M6 10h8M9 15h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
        Filtres
        {activeFilterCount > 0 && (
          <span className="rs-filter-badge">{activeFilterCount}</span>
        )}
        <svg
          className={`rs-chevron${open ? " up" : ""}`}
          viewBox="0 0 20 20" fill="none" width="13" height="13"
        >
          <path d="M5 7l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Bouton reset visible uniquement si filtres actifs */}
      {activeFilterCount > 0 && (
        <button className="rs-reset-btn" onClick={resetFilters}>
          ✕ Réinitialiser
        </button>
      )}

      {/* Panneau filtres */}
      {open && (
        <div className="rs-filters-panel">

          {/* Ligne 1 : Type + Statut */}
          <div className="rs-filters-row">
            <div className="rs-filter-group">
              <label className="rs-filter-label">Source</label>
              <div className="rs-btn-group">
                {[["", "Tous"], ["client", "Client"], ["visiteur", "Visiteur"]].map(([val, label]) => (
                  <button
                    key={val}
                    className={`rs-btn-choice${filters.typeSource === val ? " on" : ""}`}
                    onClick={() => setFilter("typeSource", val)}
                  >
                    {val === "client"   && <span className="rs-dot dot-client" />}
                    {val === "visiteur" && <span className="rs-dot dot-visiteur" />}
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rs-filter-group">
              <label className="rs-filter-label">Statut commission</label>
              <div className="rs-btn-group">
                {[["", "Tous"], ["EN_ATTENTE", "En attente"], ["PAYEE", "Payée"]].map(([val, label]) => (
                  <button
                    key={val}
                    className={`rs-btn-choice${filters.statut === val ? " on" : ""}`}
                    onClick={() => setFilter("statut", val)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Ligne 2 : Période */}
          <div className="rs-filters-row">
            <div className="rs-filter-group">
              <label className="rs-filter-label">Période — du</label>
              <input
                type="date"
                className="rs-date-input"
                value={filters.dateDebut}
                onChange={(e) => setFilter("dateDebut", e.target.value)}
              />
            </div>
            <div className="rs-filter-group">
              <label className="rs-filter-label">au</label>
              <input
                type="date"
                className="rs-date-input"
                value={filters.dateFin}
                onChange={(e) => setFilter("dateFin", e.target.value)}
              />
            </div>
          </div>

          {/* Ligne 3 : Montant min/max */}
          <div className="rs-filters-row">
            <div className="rs-filter-group">
              <label className="rs-filter-label">Montant min (DT)</label>
              <input
                type="number"
                className="rs-number-input"
                placeholder="0"
                min="0"
                value={filters.montantMin}
                onChange={(e) => setFilter("montantMin", e.target.value)}
              />
            </div>
            <div className="rs-filter-group">
              <label className="rs-filter-label">Montant max (DT)</label>
              <input
                type="number"
                className="rs-number-input"
                placeholder="∞"
                min="0"
                value={filters.montantMax}
                onChange={(e) => setFilter("montantMax", e.target.value)}
              />
            </div>
          </div>

        </div>
      )}
    </div>
  );
}