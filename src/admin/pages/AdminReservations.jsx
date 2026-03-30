import { useState, useEffect, useCallback } from "react";
import "./AdminReservations.css";

const BASE = "http://localhost:8000/api/v1";
const auth = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
});

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const nuits = (d1, d2) => Math.max(0, Math.round((new Date(d2) - new Date(d1)) / 86400000));
const fmt = (n) => Number(n || 0).toLocaleString("fr-FR");

const STATUTS = {
  EN_ATTENTE: { label: "En attente", color: "#B45309", bg: "#FFFBEB", border: "#FDE68A", dot: "#F59E0B" },
  CONFIRMEE:  { label: "Confirmée",  color: "#047857", bg: "#ECFDF5", border: "#6EE7B7", dot: "#10B981" },
  ANNULEE:    { label: "Annulée",    color: "#B91C1C", bg: "#FEF2F2", border: "#FECACA", dot: "#EF4444" },
  TERMINEE:   { label: "Terminée",   color: "#1D4ED8", bg: "#EFF6FF", border: "#BFDBFE", dot: "#3B82F6" },
};

function Pill({ statut }) {
  const s = STATUTS[statut] || { label: statut, color: "#64748B", bg: "#F8FAFC", border: "#E2E8F0", dot: "#94A3B8" };
  return (
    <span className="ar-pill" style={{ color: s.color, background: s.bg, borderColor: s.border }}>
      <span className="ar-pill-dot" style={{ background: s.dot }} />
      {s.label}
    </span>
  );
}

function SourceTag({ source }) {
  return <span className={`ar-src-tag ${source}`}>{source === "client" ? "Compte" : "Visiteur"}</span>;
}

// ── Bouton télécharger facture ────────────────────────────
function DownloadFactureBtn({ resa }) {
  const [loading, setLoading] = useState(false);
  const download = async () => {
    setLoading(true);
    try {
      const url = resa.source === "visiteur"
        ? `${BASE}/reservations/visiteur/${resa.numero_voucher}/facture-pdf`
        : `${BASE}/reservations/${resa.id}/voucher-pdf`;
      const filename = `facture-${resa.numero_facture || resa.numero_voucher || resa.id}.pdf`;
      const r = await fetch(url, { headers: auth() });
      if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.detail || "Erreur"); }
      const blob = await r.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = filename; a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) { alert("Erreur : " + e.message); }
    finally { setLoading(false); }
  };
  if (!resa.numero_facture && !resa.numero_voucher) return null;
  return (
    <button className="ar-dl-btn" onClick={download} disabled={loading}>
      {loading ? <span className="ar-spin-sm" /> : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      )}
      {loading ? "Génération…" : "Télécharger la facture"}
    </button>
  );
}

// ══════════════════════════════════════════════════════════
//  MODAL DÉTAIL
// ══════════════════════════════════════════════════════════
function DetailModal({ resa, onClose, onRefresh }) {
  const [confirming, setConfirming] = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [err,        setErr]        = useState(null);
  const n = nuits(resa.date_debut, resa.date_fin);
  const canCancel = resa.statut === "EN_ATTENTE" || resa.statut === "CONFIRMEE";
  const docNum = resa.numero_facture || resa.numero_voucher;

  const handleAnnuler = async () => {
    setLoading(true); setErr(null);
    try {
      const url = resa.source === "visiteur"
        ? `${BASE}/reservations/visiteur/${resa.id}/annuler`
        : `${BASE}/reservations/${resa.id}/annuler`;
      const r = await fetch(url, { method: "POST", headers: auth() });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Erreur");
      onRefresh(); onClose();
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="ar-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="ar-modal">
        <div className={`ar-modal-topbar ${resa.type_resa}`} />

        {/* Header */}
        <div className="ar-modal-head">
          <div className={`ar-modal-thumb ${resa.type_resa}`}>
            {resa.type_resa === "voyage"
              ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 15a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 4.11h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 11.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            }
          </div>
          <div className="ar-modal-head-text">
            <div className="ar-modal-head-row">
              <h3>{resa.type_resa === "voyage" ? resa.voyage_titre : resa.hotel_nom}</h3>
              <span className={`ar-type-chip ${resa.type_resa}`}>
                {resa.type_resa === "voyage" ? "✈ Voyage" : "🏨 Hôtel"}
              </span>
            </div>
            <p>{resa.type_resa === "voyage" ? resa.voyage_destination : resa.hotel_ville}</p>
          </div>
          <div className="ar-modal-head-right">
            <Pill statut={resa.statut} />
            <button className="ar-modal-close-btn" onClick={onClose}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="ar-modal-content">
          {/* Personne */}
          <section className="ar-modal-section">
            <h4 className="ar-modal-section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>
              {resa.source === "visiteur" ? "Visiteur" : "Client"}
              <SourceTag source={resa.source} />
            </h4>
            <div className="ar-modal-grid">
              <div className="ar-modal-field">
                <label>Nom complet</label>
                <span>{resa.client_prenom} {resa.client_nom}</span>
              </div>
              <div className="ar-modal-field">
                <label>Email</label>
                <span>{resa.client_email}</span>
              </div>
              {resa.client_telephone && (
                <div className="ar-modal-field">
                  <label>Téléphone</label>
                  <span>{resa.client_telephone}</span>
                </div>
              )}
            </div>
          </section>

          {/* Séjour */}
          <section className="ar-modal-section">
            <h4 className="ar-modal-section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/></svg>
              Séjour
            </h4>
            <div className="ar-modal-grid">
              <div className="ar-modal-field">
                <label>Réservé le</label>
                <span>{resa.date_reservation}</span>
              </div>
              <div className="ar-modal-field">
                <label>Arrivée</label>
                <span>{fmtDate(resa.date_debut)}</span>
              </div>
              <div className="ar-modal-field">
                <label>Départ</label>
                <span>{fmtDate(resa.date_fin)}</span>
              </div>
              <div className="ar-modal-field">
                <label>Durée</label>
                <span>{n} nuit{n > 1 ? "s" : ""}</span>
              </div>
            </div>
            {/* Montant */}
            <div className="ar-modal-amount-row">
              <div className="ar-modal-amount-left">
                <span>Montant total</span>
                <strong>{resa.total_ttc?.toFixed(2)} <em>DT</em></strong>
              </div>
              {resa.methode_paiement && (
                <div className="ar-modal-payment-method">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                  {resa.methode_paiement.replace(/_/g, " ")}
                </div>
              )}
            </div>
          </section>

          {/* Document */}
          {docNum && (
            <section className="ar-modal-section">
              <h4 className="ar-modal-section-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                Document
              </h4>
              <div className="ar-modal-doc-card">
                <div className="ar-modal-doc-fields">
                  <div className="ar-modal-field">
                    <label>{resa.numero_facture ? "N° Facture" : "N° Voucher"}</label>
                    <span className="ar-mono">{docNum}</span>
                  </div>
                  {resa.numero_facture && resa.statut_facture && (
                    <div className="ar-modal-field">
                      <label>Statut facture</label>
                      <span>{resa.statut_facture}</span>
                    </div>
                  )}
                  {resa.source === "visiteur" && resa.numero_voucher && resa.numero_facture && (
                    <div className="ar-modal-field">
                      <label>N° Voucher</label>
                      <span className="ar-mono ar-voucher-num">{resa.numero_voucher}</span>
                    </div>
                  )}
                </div>
                <DownloadFactureBtn resa={resa} />
              </div>
            </section>
          )}

          {/* Annulation */}
          {canCancel && (
            <section className="ar-modal-section ar-modal-danger">
              {!confirming ? (
                <button className="ar-annuler-btn" onClick={() => setConfirming(true)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                  Annuler la réservation
                </button>
              ) : (
                <div className="ar-confirm-zone">
                  <p>
                    Annuler la réservation de{" "}
                    <strong>{resa.client_prenom} {resa.client_nom}</strong> ?
                    {resa.source === "visiteur" && (
                      <em className="ar-annulation-note"> La facture associée sera également annulée.</em>
                    )}
                  </p>
                  {err && <div className="ar-err-msg">{err}</div>}
                  <div className="ar-confirm-actions">
                    <button className="ar-btn-retour" onClick={() => { setConfirming(false); setErr(null); }}>
                      Retour
                    </button>
                    <button className="ar-btn-confirmer-annul" onClick={handleAnnuler} disabled={loading}>
                      {loading ? <span className="ar-spin-sm" /> : null}
                      {loading ? "En cours…" : "Confirmer l'annulation"}
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  VUE TOUTES
// ══════════════════════════════════════════════════════════
function VueToutes({ reservations, onSelect, page, totalPages, onPage }) {
  return (
    <div className="ar-table-card">
      <table className="ar-table">
        <thead>
          <tr>
            <th>Personne</th>
            <th>Destination</th>
            <th>Période</th>
            <th>Montant</th>
            <th>Statut</th>
            <th>Source</th>
            <th>Document</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {reservations.map(r => {
            const n   = nuits(r.date_debut, r.date_fin);
            const doc = r.numero_facture || r.numero_voucher || "—";
            return (
              <tr key={`${r.source}-${r.id}`} className="ar-row" onClick={() => onSelect(r)}>
                <td>
                  <div className="ar-person-cell">
                    <div className={`ar-avatar ${r.source}`}>
                      {(r.client_prenom?.[0] || "").toUpperCase()}{(r.client_nom?.[0] || "").toUpperCase()}
                    </div>
                    <div>
                      <div className="ar-person-name">{r.client_prenom} {r.client_nom}</div>
                      <div className="ar-person-email">{r.client_email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="ar-dest-cell">
                    <div className={`ar-dest-bar ${r.type_resa}`} />
                    <div>
                      <div className="ar-dest-name">{r.type_resa === "voyage" ? r.voyage_titre : r.hotel_nom}</div>
                      <div className="ar-dest-sub">{r.type_resa === "voyage" ? r.voyage_destination : r.hotel_ville}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="ar-period-cell">
                    <span>{fmtDate(r.date_debut)}</span>
                    <span className="ar-arrow">→</span>
                    <span>{fmtDate(r.date_fin)}</span>
                    <span className="ar-nuits-badge">{n}n</span>
                  </div>
                </td>
                <td className="ar-amount-cell">{r.total_ttc?.toFixed(2)} DT</td>
                <td><Pill statut={r.statut} /></td>
                <td><SourceTag source={r.source} /></td>
                <td className="ar-doc-cell">{doc}</td>
                <td>
                  <button className="ar-voir-btn" onClick={e => { e.stopPropagation(); onSelect(r); }}>
                    Voir
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* ── Pagination intégrée — collée sous le tableau, jamais flottante ── */}
      {totalPages > 1 && (
        <div className="ar-pagination">
          <button className="ar-pg-btn" disabled={page === 1} onClick={() => onPage(p => p - 1)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14"><polyline points="15 18 9 12 15 6"/></svg>
            Précédent
          </button>
          <div className="ar-pg-numbers">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce((acc, p, i, arr) => {
                if (i > 0 && arr[i - 1] !== p - 1) acc.push("…");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) => p === "…"
                ? <span key={i} className="ar-pg-ellipsis">…</span>
                : <button key={p} className={`ar-pg-num ${p === page ? "active" : ""}`}
                    onClick={() => onPage(p)}>{p}</button>
              )
            }
          </div>
          <button className="ar-pg-btn" disabled={page === totalPages} onClick={() => onPage(p => p + 1)}>
            Suivant
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  VUE ENTITÉ
// ══════════════════════════════════════════════════════════
function VueEntite({ reservations, mode, onSelect }) {
  const [selected,     setSelected]     = useState(null);
  const [searchEntity, setSearchEntity] = useState("");
  const [searchDetail, setSearchDetail] = useState("");
  const [filtStatut,   setFiltStatut]   = useState("");
  const [filtSource,   setFiltSource]   = useState("");

  const reset = () => { setSearchDetail(""); setFiltStatut(""); setFiltSource(""); };

  const groups = {};
  reservations.forEach(r => {
    const key = mode === "hotel" ? (r.hotel_nom || "Hôtel inconnu") : (r.voyage_titre || "Voyage inconnu");
    const sub = mode === "hotel" ? (r.hotel_ville || "") : (r.voyage_destination || "");
    if (!groups[key]) groups[key] = { label: key, sub, items: [] };
    groups[key].items.push(r);
  });

  const entityList    = Object.values(groups).sort((a, b) => b.items.length - a.items.length);
  const filteredCards = searchEntity.trim()
    ? entityList.filter(g => g.label.toLowerCase().includes(searchEntity.toLowerCase()) || g.sub.toLowerCase().includes(searchEntity.toLowerCase()))
    : entityList;

  // ── Vue détail d'une entité ──
  if (selected) {
    const current = groups[selected];
    if (!current) return null;

    let items = current.items;
    if (searchDetail.trim()) {
      const s = searchDetail.toLowerCase();
      items = items.filter(r =>
        `${r.client_prenom} ${r.client_nom} ${r.client_email} ${r.numero_facture || ""} ${r.numero_voucher || ""}`.toLowerCase().includes(s)
      );
    }
    if (filtStatut) items = items.filter(r => r.statut === filtStatut);
    // Voyages = clients seulement
    if (filtSource && mode === "hotel") items = items.filter(r => r.source === filtSource);

    const nbCli = current.items.filter(r => r.source === "client").length;
    const nbVis = current.items.filter(r => r.source === "visiteur").length;
    const ca    = current.items.reduce((s, r) => s + (r.total_ttc || 0), 0);
    const hasFilters = searchDetail || filtStatut || filtSource;

    return (
      <div className="ar-entity-view">
        {/* Header entité */}
        <div className={`ar-entity-header ${mode}`}>
          <button className="ar-back-btn" onClick={() => { setSelected(null); reset(); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            Retour
          </button>
          <div className="ar-entity-header-icon">
            {mode === "hotel"
              ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 15a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 4.11h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 11.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            }
          </div>
          <div className="ar-entity-header-info">
            <h3>{current.label}</h3>
            <p>{current.sub}</p>
          </div>
          <div className="ar-entity-header-kpis">
            <div className="ar-ekpi"><strong>{current.items.length}</strong><span>Réservations</span></div>
            <div className="ar-ekpi-sep" />
            <div className="ar-ekpi"><strong>{nbCli}</strong><span>Clients</span></div>
            {/* Visiteurs uniquement pour les hôtels */}
            {mode === "hotel" && <>
              <div className="ar-ekpi-sep" />
              <div className="ar-ekpi"><strong>{nbVis}</strong><span>Visiteurs</span></div>
            </>}
            <div className="ar-ekpi-sep" />
            <div className="ar-ekpi ar-ekpi-gold"><strong>{ca.toFixed(0)} DT</strong><span>Revenus</span></div>
          </div>
        </div>

        {/* Filtres niveau 2 */}
        <div className="ar-filter-row">
          <input className="ar-filter-search" placeholder="Rechercher par nom, email, facture…"
            value={searchDetail} onChange={e => setSearchDetail(e.target.value)} />
          <div className="ar-pills-group">
            {[{ v: "", l: "Tous" }, { v: "EN_ATTENTE", l: "En attente" }, { v: "CONFIRMEE", l: "Confirmée" }, { v: "ANNULEE", l: "Annulée" }, { v: "TERMINEE", l: "Terminée" }].map(s => (
              <button key={s.v} className={`ar-pill-btn ${filtStatut === s.v ? "on" : ""}`}
                onClick={() => setFiltStatut(s.v)}>{s.l}</button>
            ))}
          </div>
          {mode === "hotel" && (
            <div className="ar-pills-group">
              {[{ v: "", l: "Tous" }, { v: "client", l: "Clients" }, { v: "visiteur", l: "Visiteurs" }].map(s => (
                <button key={s.v} className={`ar-pill-btn ${filtSource === s.v ? "on" : ""}`}
                  onClick={() => setFiltSource(s.v)}>{s.l}</button>
              ))}
            </div>
          )}
          <div className="ar-filter-meta">
            <span>{items.length} / {current.items.length}</span>
            {hasFilters && <button className="ar-reset-btn" onClick={reset}>Réinitialiser</button>}
          </div>
        </div>

        {/* Tableau */}
        {items.length === 0 ? (
          <div className="ar-empty-state">
            <div className="ar-empty-icon">🔍</div>
            <p>Aucune réservation ne correspond</p>
            <button onClick={reset}>Effacer les filtres</button>
          </div>
        ) : (
          <div className="ar-table-card">
            <table className="ar-table">
              <thead>
                <tr>
                  <th>Personne</th>
                  <th>Période</th>
                  <th>Montant</th>
                  <th>Statut</th>
                  {mode === "hotel" && <th>Source</th>}
                  <th>Document</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map(r => {
                  const nn  = nuits(r.date_debut, r.date_fin);
                  const doc = r.numero_facture || r.numero_voucher || "—";
                  return (
                    <tr key={`${r.source}-${r.id}`} className="ar-row" onClick={() => onSelect(r)}>
                      <td>
                        <div className="ar-person-cell">
                          <div className={`ar-avatar ${r.source}`}>
                            {(r.client_prenom?.[0] || "").toUpperCase()}{(r.client_nom?.[0] || "").toUpperCase()}
                          </div>
                          <div>
                            <div className="ar-person-name">{r.client_prenom} {r.client_nom}</div>
                            <div className="ar-person-email">{r.client_email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="ar-period-cell">
                          <span>{fmtDate(r.date_debut)}</span>
                          <span className="ar-arrow">→</span>
                          <span>{fmtDate(r.date_fin)}</span>
                          <span className="ar-nuits-badge">{nn}n</span>
                        </div>
                      </td>
                      <td className="ar-amount-cell">{r.total_ttc?.toFixed(2)} DT</td>
                      <td><Pill statut={r.statut} /></td>
                      {mode === "hotel" && <td><SourceTag source={r.source} /></td>}
                      <td className="ar-doc-cell">{doc}</td>
                      <td>
                        <button className="ar-voir-btn" onClick={e => { e.stopPropagation(); onSelect(r); }}>
                          Voir
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // ── Grille des entités ──
  return (
    <div className="ar-entity-grid-view">
      <div className="ar-entity-grid-toolbar">
        <div className="ar-entity-searchbox">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input placeholder={mode === "hotel" ? "Rechercher un hôtel…" : "Rechercher un voyage…"}
            value={searchEntity} onChange={e => setSearchEntity(e.target.value)} />
        </div>
        <span className="ar-entity-count-label">
          {filteredCards.length} {mode === "hotel" ? "hôtel" : "voyage"}{filteredCards.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="ar-cards-grid">
        {filteredCards.map(g => {
          const nbC = g.items.filter(r => r.source === "client").length;
          const nbV = g.items.filter(r => r.source === "visiteur").length;
          const ca  = g.items.reduce((s, r) => s + (r.total_ttc || 0), 0);
          const statuts = [...new Set(g.items.map(r => r.statut))];
          const confirmed = g.items.filter(r => r.statut === "CONFIRMEE").length;
          return (
            <div key={g.label} className={`ar-entity-card ${mode}`}
              onClick={() => setSelected(g.label)}>
              <div className={`ar-card-accent ${mode}`} />
              <div className="ar-card-top">
                <div className={`ar-card-icon ${mode}`}>
                  {mode === "hotel"
                    ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 15a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 4.11h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 11.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  }
                </div>
                <div className="ar-card-info">
                  <h4>{g.label}</h4>
                  <p>{g.sub}</p>
                </div>
              </div>

              <div className="ar-card-stats">
                <div className="ar-cstat">
                  <strong>{g.items.length}</strong>
                  <span>Réservations</span>
                </div>
                <div className="ar-cstat-sep" />
                <div className="ar-cstat">
                  <strong>{nbC}</strong>
                  <span>Clients</span>
                </div>
                {/* Visiteurs seulement pour hôtels */}
                {mode === "hotel" && <>
                  <div className="ar-cstat-sep" />
                  <div className="ar-cstat">
                    <strong>{nbV}</strong>
                    <span>Visiteurs</span>
                  </div>
                </>}
                <div className="ar-cstat-sep" />
                <div className="ar-cstat ar-cstat-gold">
                  <strong>{ca.toFixed(0)} DT</strong>
                  <span>Revenus</span>
                </div>
              </div>

              <div className="ar-card-footer">
                <div className="ar-card-statuts">
                  {statuts.map(st => (
                    <span key={st} className="ar-card-dot"
                      style={{ background: STATUTS[st]?.dot || "#94A3B8" }}
                      title={STATUTS[st]?.label || st} />
                  ))}
                  <span className="ar-card-confirmed">{confirmed} confirmée{confirmed !== 1 ? "s" : ""}</span>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  width="16" height="16" className="ar-card-chevron">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  PAGE PRINCIPALE
// ══════════════════════════════════════════════════════════
export default function AdminReservations() {
  const [data,    setData]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [nbCli,   setNbCli]   = useState(0);
  const [nbVis,   setNbVis]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [err,     setErr]     = useState(null);

  const [tab,    setTab]    = useState("tous");
  const [statut, setStatut] = useState("");
  const [source, setSource] = useState("");
  const [search, setSearch] = useState("");
  const [page,   setPage]   = useState(1);
  const [detail, setDetail] = useState(null);

  const perPage = 30;

  const load = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const q = new URLSearchParams({ page, per_page: perPage });
      if (statut)         q.set("statut",    statut);
      if (source)         q.set("source",    source);
      if (tab !== "tous") q.set("type_resa", tab);
      if (search.trim())  q.set("search",    search.trim());
      const r = await fetch(`${BASE}/reservations/admin/enrichi?${q}`, { headers: auth() });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Erreur");
      setData(d.items || []);
      setTotal(d.total || 0);
      setNbCli(d.nb_clients || 0);
      setNbVis(d.nb_visiteurs || 0);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, [page, statut, source, tab, search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [statut, source, tab]);
  useEffect(() => { const t = setTimeout(() => setPage(1), 400); return () => clearTimeout(t); }, [search]);

  const totalPages = Math.ceil(total / perPage);
  const pageRevenu = data.reduce((s, r) => s + (r.total_ttc || 0), 0);

  return (
    <div className="ar-root">

      {/* HEADER */}
      <div className="ar-page-header">
        <div className="ar-page-header-left">
          <div className="ar-page-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
              <rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/>
              <line x1="9" y1="16" x2="13" y2="16"/>
            </svg>
          </div>
          <div>
            <h1>Réservations</h1>
            <p>{total} réservation{total !== 1 ? "s" : ""} · {nbCli} client{nbCli !== 1 ? "s" : ""} · {nbVis} visiteur{nbVis !== 1 ? "s" : ""}</p>
          </div>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="ar-kpis">
        {[
          { icon: "📋", val: fmt(total),               label: "Total",     sub: "réservations", accent: "#1A3F63" },
          { icon: "👤", val: fmt(nbCli),               label: "Clients",   sub: "avec compte",  accent: "#2B5F8E" },
          { icon: "🚶", val: fmt(nbVis),               label: "Visiteurs", sub: "sans compte",  accent: "#7C3AED" },
          { icon: "💰", val: `${pageRevenu.toFixed(0)} DT`, label: "Revenus", sub: "page actuelle", accent: "#B45309" },
        ].map((k, i) => (
          <div key={i} className="ar-kpi" style={{ "--acc": k.accent }}>
            <span className="ar-kpi-emoji">{k.icon}</span>
            <div>
              <strong>{k.val}</strong>
              <span>{k.label}</span>
              <small>{k.sub}</small>
            </div>
          </div>
        ))}
      </div>

      {/* TOOLBAR : onglets + filtres */}
      <div className="ar-toolbar-card">
        <div className="ar-tabs-row">
          <div className="ar-tabs">
            {[
              { id: "tous",   icon: "≡",  label: "Toutes"     },
              { id: "hotel",  icon: "🏨", label: "Par hôtel"  },
              { id: "voyage", icon: "✈️", label: "Par voyage" },
            ].map(t => (
              <button key={t.id}
                className={`ar-tab ${tab === t.id ? "active" : ""}`}
                onClick={() => { setTab(t.id); setSource(""); }}>
                <span>{t.icon}</span>
                {t.label}
                {t.id === "tous" && total > 0 && (
                  <span className="ar-tab-count">{total}</span>
                )}
              </button>
            ))}
          </div>

          {tab === "tous" && (
            <div className="ar-filters-row">
              <div className="ar-searchbox">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input placeholder="Nom, email, hôtel, voyage, facture…"
                  value={search} onChange={e => setSearch(e.target.value)} />
                {search && (
                  <button onClick={() => setSearch("")} className="ar-clear-btn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                )}
              </div>
              <select className="ar-filter-select" value={statut}
                onChange={e => { setStatut(e.target.value); setPage(1); }}>
                <option value="">Tous statuts</option>
                <option value="EN_ATTENTE">En attente</option>
                <option value="CONFIRMEE">Confirmée</option>
                <option value="ANNULEE">Annulée</option>
                <option value="TERMINEE">Terminée</option>
              </select>
              <div className="ar-seg-ctrl">
                {[{ v: "", l: "Tous" }, { v: "client", l: "Clients" }, { v: "visiteur", l: "Visiteurs" }].map(s => (
                  <button key={s.v}
                    className={`ar-seg-btn ${source === s.v ? "active" : ""}`}
                    onClick={() => { setSource(s.v); setPage(1); }}>
                    {s.l}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CONTENU */}
      <div className="ar-content">
        {loading ? (
          <div className="ar-loading-box">
            <div className="ar-loader" />
            <p>Chargement…</p>
          </div>
        ) : err ? (
          <div className="ar-error-box">
            <span>⚠️</span><p>{err}</p><button onClick={load}>Réessayer</button>
          </div>
        ) : data.length === 0 ? (
          <div className="ar-empty-box">
            <div className="ar-empty-illus">📭</div>
            <h3>Aucune réservation</h3>
            <p>{search ? "Aucun résultat pour votre recherche." : "Aucune réservation pour ces filtres."}</p>
            {search && <button onClick={() => setSearch("")}>Effacer la recherche</button>}
          </div>
        ) : tab === "tous" ? (
          <VueToutes reservations={data} onSelect={setDetail} page={page} totalPages={totalPages} onPage={setPage} />
        ) : (
          <VueEntite reservations={data} mode={tab} onSelect={setDetail} />
        )}
      </div>

      {/* MODAL */}
      {detail && (
        <DetailModal
          resa={detail}
          onClose={() => setDetail(null)}
          onRefresh={() => { load(); setDetail(null); }}
        />
      )}
    </div>
  );
}