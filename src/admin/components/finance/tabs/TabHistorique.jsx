/**
 * TabHistorique — Historique des paiements avec recherche et filtres avancés.
 *
 * Recherche/filtres transmis au backend (SQL) :
 *   - search      : nom, prénom, email, entreprise, note
 *   - dateDebut / dateFin
 *   - montantMin / montantMax
 *
 * Pagination côté backend (performances garanties même sur gros volumes).
 * Debounce 350ms sur la recherche pour éviter trop de requêtes.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import Pagination from "../ui/Pagination.jsx";
import Spinner    from "../ui/Spinner.jsx";
import { fetchPaiements } from "../../../services/financesApi.js";
import { fmt, fmtD } from "../../../services/formatters.js";
import "./TabHistorique.css";

const PER = 20;

const DEFAULT_FILTERS = {
  search:     "",
  dateDebut:  "",
  dateFin:    "",
  montantMin: "",
  montantMax: "",
};

// ── Résumé des filtres actifs ─────────────────────────────
function FilterSummary({ filters, total, totalMontant }) {
  const active = Object.values(filters).filter(Boolean).length;
  if (!active && total === 0) return null;
  return (
    <div className="th-summary">
      <span className="th-summary-count">
        <b>{total}</b> paiement{total > 1 ? "s" : ""}
        {active > 0 && <span className="th-summary-filtered"> (filtré{active > 1 ? "s" : ""})</span>}
      </span>
      {total > 0 && (
        <span className="th-summary-total">
          Total : <b>{fmt(totalMontant)} DT</b>
        </span>
      )}
    </div>
  );
}

export default function TabHistorique() {
  const [items,    setItems]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(1);
  const [total,    setTotal]    = useState(0);
  const [filters,  setFilters]  = useState(DEFAULT_FILTERS);
  const [panelOpen, setPanelOpen] = useState(false);

  // Valeur de recherche locale avec debounce
  const [searchInput, setSearchInput] = useState("");
  const debounceRef = useRef(null);

  // Nombre de filtres avancés actifs (hors search)
  const { search, ...advFilters } = filters;
  const activeAdvCount = Object.values(advFilters).filter(Boolean).length;

  // ── Mise à jour d'un filtre ────────────────────────────
  const setFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setSearchInput("");
    setPage(1);
    setPanelOpen(false);
  }, []);

  // Debounce sur la saisie de recherche
  const handleSearchChange = (val) => {
    setSearchInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: val }));
      setPage(1);
    }, 350);
  };

  // ── Chargement API ─────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await fetchPaiements(page, PER, filters);
      setItems(d.items || []);
      setTotal(d.total || 0);
    } finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { load(); }, [load]);

  const totalMontant = items.reduce((s, x) => s + (x.montant || 0), 0);
  const totalPages   = Math.ceil(total / PER);
  const hasFilters   = Object.values(filters).some(Boolean);

  return (
    <div className="af2-tab-content">

      {/* ══ BARRE DE CONTRÔLE ══════════════════════════════ */}
      <div className="th-controls">

        {/* Recherche globale */}
        <div className="th-search-wrap">
          <svg className="th-search-icon" viewBox="0 0 20 20" fill="none" width="15" height="15">
            <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M15 15l-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          <input
            className="th-search-input"
            type="text"
            placeholder="Rechercher par nom, email, entreprise ou note…"
            value={searchInput}
            onChange={e => handleSearchChange(e.target.value)}
            autoComplete="off"
          />
          {searchInput && (
            <button className="th-search-clear" onClick={() => handleSearchChange("")} title="Effacer">
              ✕
            </button>
          )}
        </div>

        {/* Bouton filtres avancés */}
        <button
          className={`th-filter-btn${panelOpen ? " open" : ""}${activeAdvCount > 0 ? " active" : ""}`}
          onClick={() => setPanelOpen(o => !o)}
        >
          <svg viewBox="0 0 20 20" fill="none" width="14" height="14">
            <path d="M3 5h14M6 10h8M9 15h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          Filtres
          {activeAdvCount > 0 && <span className="th-filter-badge">{activeAdvCount}</span>}
          <svg className={`th-chevron${panelOpen ? " up" : ""}`} viewBox="0 0 20 20" fill="none" width="12" height="12">
            <path d="M5 7l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </button>

        {hasFilters && (
          <button className="th-reset-btn" onClick={resetFilters}>✕ Réinitialiser</button>
        )}
      </div>

      {/* ══ PANNEAU FILTRES AVANCÉS ════════════════════════ */}
      {panelOpen && (
        <div className="th-filters-panel">

          {/* Ligne 1 : Période */}
          <div className="th-filter-row">
            <div className="th-filter-group">
              <label className="th-filter-label">Date de début</label>
              <input
                type="date" className="th-date-input"
                value={filters.dateDebut}
                onChange={e => setFilter("dateDebut", e.target.value)}
              />
            </div>
            <div className="th-filter-group">
              <label className="th-filter-label">Date de fin</label>
              <input
                type="date" className="th-date-input"
                value={filters.dateFin}
                onChange={e => setFilter("dateFin", e.target.value)}
              />
            </div>

            {/* Ligne 2 : Montant */}
            <div className="th-filter-group">
              <label className="th-filter-label">Montant min (DT)</label>
              <input
                type="number" min="0" className="th-num-input"
                placeholder="0"
                value={filters.montantMin}
                onChange={e => setFilter("montantMin", e.target.value)}
              />
            </div>
            <div className="th-filter-group">
              <label className="th-filter-label">Montant max (DT)</label>
              <input
                type="number" min="0" className="th-num-input"
                placeholder="∞"
                value={filters.montantMax}
                onChange={e => setFilter("montantMax", e.target.value)}
              />
            </div>
          </div>

        </div>
      )}

      {/* ══ RÉSUMÉ ════════════════════════════════════════ */}
      <FilterSummary filters={filters} total={total} totalMontant={totalMontant} />

      {/* ══ TABLEAU ═══════════════════════════════════════ */}
      {loading ? <Spinner /> : (
        <div className="af2-table-card th-table-card">
          <table className="af2-table th-table">
            <thead>
              <tr>
                <th>Partenaire</th>
                <th>Entreprise</th>
                <th>Contact</th>
                <th>Montant payé</th>
                <th>Note</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p, i) => (
                <tr key={i} className="af2-tr">

                  {/* Partenaire — avatar initiales */}
                  <td>
                    <div className="af2-person">
                      <div className="af2-avatar th-avatar">
                        {(p.partenaire_prenom?.[0] || "?").toUpperCase()}
                        {(p.partenaire_nom?.[0]    || "").toUpperCase()}
                      </div>
                      <div>
                        <b className="th-name">
                          {p.partenaire_prenom} {p.partenaire_nom}
                        </b>
                        <br />
                        {p.partenaire_email && p.partenaire_email !== "—" && (
                          <a
                            className="th-email-link"
                            href={`mailto:${p.partenaire_email}`}
                          >
                            {p.partenaire_email}
                          </a>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Entreprise */}
                  <td>
                    <span className="th-entreprise">
                      {p.nom_entreprise || <span className="af2-muted">—</span>}
                    </span>
                  </td>

                  {/* Contact groupé : email + tel */}
                  <td>
                    <div className="th-contact">
                      {p.partenaire_email && p.partenaire_email !== "—" && (
                        <a className="th-email-link" href={`mailto:${p.partenaire_email}`}>
                          ✉ {p.partenaire_email}
                        </a>
                      )}
                      {p.partenaire_tel && (
                        <a className="th-tel-link" href={`tel:${p.partenaire_tel}`}>
                          📞 {p.partenaire_tel}
                        </a>
                      )}
                    </div>
                  </td>

                  {/* Montant */}
                  <td>
                    <span className="th-montant">{fmt(p.montant)} DT</span>
                  </td>

                  {/* Note */}
                  <td>
                    {p.note
                      ? <span className="th-note">{p.note}</span>
                      : <span className="af2-muted">—</span>}
                  </td>

                  {/* Date */}
                  <td>
                    <span className="th-date">{fmtD(p.created_at)}</span>
                  </td>
                </tr>
              ))}

              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="af2-empty-row">
                    {hasFilters
                      ? "🔍 Aucun paiement ne correspond aux filtres"
                      : "Aucun paiement enregistré"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}