/**
 * TabHistorique — Historique des paiements avec recherche, filtres avancés,
 * téléchargement PDF et renvoi email.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import Pagination from "../ui/Pagination.jsx";
import Spinner    from "../ui/Spinner.jsx";
import {
  fetchPaiements,
  downloadFacturePaiement,
  renvoyerEmailPaiement,
} from "../../../services/financesApi.js";
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

// ── Résumé filtres actifs ─────────────────────────────────
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

// ── Bouton PDF ────────────────────────────────────────────
function BtnPdf({ paiementId, numeroFacture }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await downloadFacturePaiement(paiementId, numeroFacture);
    } catch {
      alert("PDF indisponible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      title={`Télécharger ${numeroFacture}`}
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: "5px 10px", borderRadius: 6, border: "none",
        background: loading ? "#F0F4F8" : "#EBF4FF",
        color: "#1A3F63", fontSize: 12, fontWeight: 700,
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.7 : 1, fontFamily: "inherit",
      }}
    >
      {loading ? "⏳" : (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="12" y1="18" x2="12" y2="12"/>
            <polyline points="9 15 12 18 15 15"/>
          </svg>
          PDF
        </>
      )}
    </button>
  );
}

// ── Bouton Renvoyer email ─────────────────────────────────
function BtnEmail({ paiementId, email }) {
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);

  const handleClick = async () => {
    if (!window.confirm(`Renvoyer l'email de paiement à ${email} ?`)) return;
    setLoading(true);
    try {
      await renvoyerEmailPaiement(paiementId);
      setDone(true);
      setTimeout(() => setDone(false), 4000);
    } catch {
      alert("Erreur lors de l'envoi de l'email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      title={`Renvoyer email à ${email}`}
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: "5px 10px", borderRadius: 6, border: "none",
        background: done ? "#D4EDDA" : loading ? "#F0F4F8" : "#F0FBF4",
        color: done ? "#155724" : "#0F6E56",
        fontSize: 12, fontWeight: 700,
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.7 : 1, fontFamily: "inherit",
      }}
    >
      {loading ? "⏳" : done ? "✓ Envoyé" : (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
          Email
        </>
      )}
    </button>
  );
}

// ── Composant principal ───────────────────────────────────
export default function TabHistorique() {
  const [items,      setItems]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(1);
  const [total,      setTotal]      = useState(0);
  const [filters,    setFilters]    = useState(DEFAULT_FILTERS);
  const [panelOpen,  setPanelOpen]  = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const debounceRef = useRef(null);

  const { search, ...advFilters } = filters;
  const activeAdvCount = Object.values(advFilters).filter(Boolean).length;

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

  const handleSearchChange = (val) => {
    setSearchInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: val }));
      setPage(1);
    }, 350);
  };

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

      {/* ── Barre de contrôle ── */}
      <div className="th-controls">
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
            <button className="th-search-clear" onClick={() => handleSearchChange("")} title="Effacer">✕</button>
          )}
        </div>

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

      {/* ── Filtres avancés ── */}
      {panelOpen && (
        <div className="th-filters-panel">
          <div className="th-filter-row">
            <div className="th-filter-group">
              <label className="th-filter-label">Date de début</label>
              <input type="date" className="th-date-input" value={filters.dateDebut}
                onChange={e => setFilter("dateDebut", e.target.value)} />
            </div>
            <div className="th-filter-group">
              <label className="th-filter-label">Date de fin</label>
              <input type="date" className="th-date-input" value={filters.dateFin}
                onChange={e => setFilter("dateFin", e.target.value)} />
            </div>
            <div className="th-filter-group">
              <label className="th-filter-label">Montant min (DT)</label>
              <input type="number" min="0" className="th-num-input" placeholder="0"
                value={filters.montantMin} onChange={e => setFilter("montantMin", e.target.value)} />
            </div>
            <div className="th-filter-group">
              <label className="th-filter-label">Montant max (DT)</label>
              <input type="number" min="0" className="th-num-input" placeholder="∞"
                value={filters.montantMax} onChange={e => setFilter("montantMax", e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {/* ── Résumé ── */}
      <FilterSummary filters={filters} total={total} totalMontant={totalMontant} />

      {/* ── Tableau ── */}
      {loading ? <Spinner /> : (
        <div className="af2-table-card th-table-card">
          <table className="af2-table th-table">
            <thead>
              <tr>
                <th>Partenaire</th>
                <th>Entreprise</th>
                <th>Contact</th>
                <th>N° Facture</th>
                <th>Montant payé</th>
                <th>Note</th>
                <th>Date</th>
                <th style={{ textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p, i) => (
                <tr key={i} className="af2-tr">

                  {/* Partenaire */}
                  <td>
                    <div className="af2-person">
                      <div className="af2-avatar th-avatar">
                        {(p.partenaire_prenom?.[0] || "?").toUpperCase()}
                        {(p.partenaire_nom?.[0]    || "").toUpperCase()}
                      </div>
                      <div>
                        <b className="th-name">{p.partenaire_prenom} {p.partenaire_nom}</b>
                        <br />
                        {p.partenaire_email && p.partenaire_email !== "—" && (
                          <a className="th-email-link" href={`mailto:${p.partenaire_email}`}>
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

                  {/* Contact */}
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

                  {/* N° Facture */}
                  <td>
                    {p.numero_facture ? (
                      <span style={{
                        fontFamily: "monospace", fontSize: 12,
                        fontWeight: 700, color: "#1A3F63",
                        background: "#EBF4FF", padding: "3px 8px",
                        borderRadius: 5, display: "inline-block",
                      }}>
                        {p.numero_facture}
                      </span>
                    ) : (
                      <span className="af2-muted">—</span>
                    )}
                  </td>

                  {/* Montant */}
                  <td>
                    <span className="th-montant">{fmt(p.montant)} DT</span>
                  </td>

                  {/* Note */}
                  <td>
                    {p.note
                      ? <span className="th-note" title={p.note}>
                          {p.note.length > 35 ? p.note.slice(0, 35) + "…" : p.note}
                        </span>
                      : <span className="af2-muted">—</span>}
                  </td>

                  {/* Date */}
                  <td>
                    <span className="th-date">{fmtD(p.created_at)}</span>
                  </td>

                  {/* Actions PDF + Email */}
                  <td>
                    <div style={{ display: "flex", gap: 6, justifyContent: "center", alignItems: "center" }}>
                      {p.numero_facture ? (
                        <>
                          <BtnPdf   paiementId={p.id} numeroFacture={p.numero_facture} />
                          <BtnEmail paiementId={p.id} email={p.partenaire_email} />
                        </>
                      ) : (
                        <span className="af2-muted" style={{ fontSize: 12 }}>—</span>
                      )}
                    </div>
                  </td>

                </tr>
              ))}

              {items.length === 0 && (
                <tr>
                  <td colSpan={8} className="af2-empty-row">
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