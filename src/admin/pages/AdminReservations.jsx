import { useState, useEffect, useCallback } from "react";
import "./AdminReservations.css";

const BASE = "http://localhost:8000/api/v1";
const auth = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
});

// ── Helpers ───────────────────────────────────────────────
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const fmtDatetime = (d) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
const nuits = (d1, d2) => Math.max(0, Math.round((new Date(d2) - new Date(d1)) / 86400000));

// ── Statut pill ───────────────────────────────────────────
const STATUTS = {
  EN_ATTENTE: { label: "En attente", color: "#E67E22", bg: "#FFF3E0", border: "#FFB74D" },
  CONFIRMEE:  { label: "Confirmée",  color: "#27AE60", bg: "#E8F5E9", border: "#81C784" },
  ANNULEE:    { label: "Annulée",    color: "#E53935", bg: "#FFEBEE", border: "#EF9A9A" },
  TERMINEE:   { label: "Terminée",   color: "#1565C0", bg: "#E3F2FD", border: "#90CAF9" },
};

function Pill({ statut }) {
  const s = STATUTS[statut] || { label: statut, color: "#8A9BB0", bg: "#F5F7FA", border: "#D8E4EF" };
  return (
    <span className="ar-pill" style={{ color: s.color, background: s.bg, borderColor: s.border }}>
      {s.label}
    </span>
  );
}

function SourceTag({ source }) {
  return (
    <span className={`ar-source ${source}`}>
      {source === "client" ? "Compte" : "Visiteur"}
    </span>
  );
}

// ══════════════════════════════════════════════════════════
//  MODAL DÉTAIL RÉSERVATION
// ══════════════════════════════════════════════════════════
function DetailModal({ resa, onClose, onRefresh }) {
  const [confirming, setConfirming] = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [err,        setErr]        = useState(null);
  const n = nuits(resa.date_debut, resa.date_fin);

  const handleAnnuler = async () => {
    if (resa.source === "visiteur") { setErr("Annulation non disponible pour les visiteurs."); return; }
    setLoading(true); setErr(null);
    try {
      const r = await fetch(`${BASE}/reservations/${resa.id}/annuler`, { method: "POST", headers: auth() });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Erreur");
      onRefresh(); onClose();
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="ar-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="ar-detail">

        {/* Bande colorée supérieure */}
        <div className={`ar-detail-band ${resa.type_resa}`} />

        {/* Header */}
        <div className="ar-detail-head">
          <div className="ar-detail-head-left">
            <div className={`ar-detail-icon ${resa.type_resa}`}>
              {resa.type_resa === "voyage"
                ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              }
            </div>
            <div>
              <h3>{resa.type_resa === "voyage" ? resa.voyage_titre : resa.hotel_nom}</h3>
              <p>{resa.type_resa === "voyage" ? resa.voyage_destination : resa.hotel_ville}</p>
            </div>
          </div>
          <div className="ar-detail-head-right">
            <Pill statut={resa.statut} />
            <button className="ar-detail-close" onClick={onClose}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        <div className="ar-detail-body">

          {/* Personne */}
          <div className="ar-detail-section">
            <div className="ar-detail-section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>
              {resa.source === "visiteur" ? "Visiteur" : "Client"}
              <SourceTag source={resa.source} />
            </div>
            <div className="ar-detail-grid">
              <div className="ar-detail-field">
                <span>Nom complet</span>
                <strong>{resa.client_prenom} {resa.client_nom}</strong>
              </div>
              <div className="ar-detail-field">
                <span>Email</span>
                <strong>{resa.client_email}</strong>
              </div>
              {resa.client_telephone && (
                <div className="ar-detail-field">
                  <span>Téléphone</span>
                  <strong>{resa.client_telephone}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Dates & montant */}
          <div className="ar-detail-section">
            <div className="ar-detail-section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/></svg>
              Séjour
            </div>
            <div className="ar-detail-grid">
              <div className="ar-detail-field">
                <span>Réservé le</span>
                <strong>{resa.date_reservation}</strong>
              </div>
              <div className="ar-detail-field">
                <span>Arrivée</span>
                <strong>{fmtDate(resa.date_debut)}</strong>
              </div>
              <div className="ar-detail-field">
                <span>Départ</span>
                <strong>{fmtDate(resa.date_fin)}</strong>
              </div>
              <div className="ar-detail-field">
                <span>Durée</span>
                <strong>{n} nuit{n > 1 ? "s" : ""}</strong>
              </div>
            </div>
            <div className="ar-detail-montant-box">
              <span>Montant total</span>
              <strong>{resa.total_ttc?.toFixed(2)} DT</strong>
            </div>
          </div>

          {/* Document */}
          <div className="ar-detail-section">
            <div className="ar-detail-section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              Document
            </div>
            <div className="ar-detail-grid">
              {resa.numero_facture && <>
                <div className="ar-detail-field">
                  <span>N° Facture</span>
                  <strong className="ar-mono">{resa.numero_facture}</strong>
                </div>
                <div className="ar-detail-field">
                  <span>Statut facture</span>
                  <strong>{resa.statut_facture || "—"}</strong>
                </div>
              </>}
              {resa.numero_voucher && (
                <div className="ar-detail-field">
                  <span>N° Voucher</span>
                  <strong className="ar-mono ar-voucher">{resa.numero_voucher}</strong>
                </div>
              )}
              {resa.methode_paiement && (
                <div className="ar-detail-field">
                  <span>Paiement</span>
                  <strong>{resa.methode_paiement.replace(/_/g, " ")}</strong>
                </div>
              )}
              {!resa.numero_facture && !resa.numero_voucher && (
                <div className="ar-detail-field"><span>Document</span><strong>—</strong></div>
              )}
            </div>
          </div>

          {/* Annulation */}
          {resa.source !== "visiteur" && (resa.statut === "EN_ATTENTE" || resa.statut === "CONFIRMEE") && (
            <div className="ar-detail-danger">
              {!confirming ? (
                <button className="ar-btn-danger" onClick={() => setConfirming(true)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                  Annuler la réservation
                </button>
              ) : (
                <div className="ar-confirm-danger">
                  <p>Annuler la réservation de <strong>{resa.client_prenom} {resa.client_nom}</strong> ?</p>
                  {err && <span className="ar-err">{err}</span>}
                  <div className="ar-confirm-btns">
                    <button className="ar-btn-ghost" onClick={() => setConfirming(false)}>Retour</button>
                    <button className="ar-btn-confirm-danger" onClick={handleAnnuler} disabled={loading}>
                      {loading ? <span className="ar-spin" /> : "Confirmer l'annulation"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  VUE TOUTES — tableau plat
// ══════════════════════════════════════════════════════════
function VueToutes({ reservations, onSelect }) {
  return (
    <div className="ar-table-shell">
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
            const n = nuits(r.date_debut, r.date_fin);
            return (
              <tr key={`${r.source}-${r.id}`} className="ar-tr" onClick={() => onSelect(r)}>
                <td>
                  <div className="ar-person">
                    <div className={`ar-avatar ${r.source}`}>{r.client_prenom?.[0]}{r.client_nom?.[0]}</div>
                    <div>
                      <b>{r.client_prenom} {r.client_nom}</b>
                      <s>{r.client_email}</s>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="ar-dest">
                    <span className={`ar-type-bar ${r.type_resa}`} />
                    <div>
                      <b>{r.type_resa === "voyage" ? r.voyage_titre : r.hotel_nom}</b>
                      <s>{r.type_resa === "voyage" ? r.voyage_destination : r.hotel_ville}</s>
                    </div>
                  </div>
                </td>
                <td className="ar-period">
                  <span>{fmtDate(r.date_debut)}</span>
                  <em>→</em>
                  <span>{fmtDate(r.date_fin)}</span>
                  <small>{n}n</small>
                </td>
                <td className="ar-ttc">{r.total_ttc?.toFixed(2)} DT</td>
                <td><Pill statut={r.statut} /></td>
                <td><SourceTag source={r.source} /></td>
                <td className="ar-doc">{r.numero_facture || r.numero_voucher || "—"}</td>
                <td><button className="ar-btn-view" onClick={e => { e.stopPropagation(); onSelect(r); }}>Voir</button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  VUE PAR ENTITÉ (hôtel ou voyage) — 2 niveaux
// ══════════════════════════════════════════════════════════
function VueEntite({ reservations, mode, onSelect }) {
  const [selected,      setSelected]      = useState(null);
  const [searchEntity,  setSearchEntity]  = useState(""); // recherche sur la grille
  // Filtres du niveau détail (réservations d'une entité)
  const [searchDetail,  setSearchDetail]  = useState("");
  const [filtStatut,    setFiltStatut]    = useState("");
  const [filtSource,    setFiltSource]    = useState("");

  // Réinitialiser filtres détail au changement d'entité
  const handleSelectEntity = (label) => {
    setSelected(label);
    setSearchDetail("");
    setFiltStatut("");
    setFiltSource("");
  };

  const handleBack = () => {
    setSelected(null);
    setSearchDetail("");
    setFiltStatut("");
    setFiltSource("");
  };

  // Grouper toutes les réservations par entité
  const groups = {};
  reservations.forEach(r => {
    const key = mode === "hotel" ? (r.hotel_nom || "Hôtel inconnu") : (r.voyage_titre || "Voyage inconnu");
    const sub = mode === "hotel" ? r.hotel_ville : r.voyage_destination;
    if (!groups[key]) groups[key] = { label: key, sub, items: [] };
    groups[key].items.push(r);
  });

  // Liste filtrée par searchEntity
  const list = Object.values(groups).filter(g =>
    !searchEntity ||
    g.label.toLowerCase().includes(searchEntity.toLowerCase()) ||
    (g.sub || "").toLowerCase().includes(searchEntity.toLowerCase())
  );

  const current = groups[selected];

  // ── NIVEAU 1 — Grille des entités ──────────────────────
  if (!selected || !current) {
    return (
      <div className="ar-entity-view">
        <div className="ar-entity-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={searchEntity}
            onChange={e => setSearchEntity(e.target.value)}
            placeholder={mode === "hotel" ? "Rechercher un hôtel..." : "Rechercher un voyage..."}
          />
          {searchEntity && <button onClick={() => setSearchEntity("")}>✕</button>}
        </div>

        {list.length === 0 ? (
          <div className="ar-empty">
            <span>{mode === "hotel" ? "🏨" : "✈️"}</span>
            <p>Aucun {mode === "hotel" ? "hôtel" : "voyage"} trouvé</p>
          </div>
        ) : (
          <div className="ar-entity-grid">
            {list.map(g => {
              const nb      = g.items.length;
              const rev     = g.items.reduce((s, r) => s + (r.total_ttc || 0), 0);
              const attente = g.items.filter(r => r.statut === "EN_ATTENTE").length;
              const statuts = [...new Set(g.items.map(r => r.statut))];

              return (
                <div key={g.label} className={`ar-entity-card ${mode}`} onClick={() => handleSelectEntity(g.label)}>
                  <div className={`ar-entity-card-accent ${mode}`} />
                  <div className="ar-entity-card-header">
                    <div className={`ar-entity-card-icon ${mode}`}>
                      {mode === "hotel"
                        ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                        : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                      }
                    </div>
                    {attente > 0 && <div className="ar-entity-alert">{attente}</div>}
                  </div>
                  <div className="ar-entity-card-body">
                    <h4>{g.label}</h4>
                    {g.sub && <p>{g.sub}</p>}
                  </div>
                  <div className="ar-entity-card-stats">
                    <div className="ar-entity-stat"><span>{nb}</span><label>résa</label></div>
                    <div className="ar-entity-stat-sep" />
                    <div className="ar-entity-stat"><span>{rev.toFixed(0)}</span><label>DT</label></div>
                    <div className="ar-entity-stat-sep" />
                    <div className="ar-entity-stat-pills">
                      {statuts.slice(0, 3).map(s => (
                        <span key={s} className="ar-entity-mini-pill" style={{ background: STATUTS[s]?.bg, color: STATUTS[s]?.color, borderColor: STATUTS[s]?.border }}>
                          {STATUTS[s]?.label || s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="ar-entity-card-footer">
                    Voir les réservations
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── NIVEAU 2 — Réservations d'une entité avec filtres ──
  const totalRev = current.items.reduce((s, r) => s + (r.total_ttc || 0), 0);

  // Appliquer les filtres sur les items
  const filtered = current.items.filter(r => {
    if (filtStatut && r.statut !== filtStatut) return false;
    if (filtSource && r.source !== filtSource) return false;
    if (searchDetail) {
      const q = searchDetail.toLowerCase();
      const matchPerson = `${r.client_prenom} ${r.client_nom}`.toLowerCase().includes(q)
        || (r.client_email || "").toLowerCase().includes(q)
        || (r.client_telephone || "").toLowerCase().includes(q);
      const matchDoc = (r.numero_facture || "").toLowerCase().includes(q)
        || (r.numero_voucher || "").toLowerCase().includes(q);
      if (!matchPerson && !matchDoc) return false;
    }
    return true;
  });

  const hasFilters = searchDetail || filtStatut || filtSource;

  return (
    <div className="ar-entity-detail">

      {/* Breadcrumb */}
      <div className="ar-breadcrumb">
        <button onClick={handleBack}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          Retour aux {mode === "hotel" ? "hôtels" : "voyages"}
        </button>
        <span>/</span>
        <span>{current.label}</span>
      </div>

      {/* Header entité */}
      <div className={`ar-entity-header-band ${mode}`}>
        <div className={`ar-entity-hb-icon ${mode}`}>
          {mode === "hotel"
            ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          }
        </div>
        <div>
          <h3>{current.label}</h3>
          <p>{current.sub}</p>
        </div>
        <div className="ar-entity-hb-stats">
          <div className="ar-entity-hb-stat">
            <strong>{current.items.length}</strong>
            <span>réservations</span>
          </div>
          <div className="ar-entity-hb-sep" />
          <div className="ar-entity-hb-stat">
            <strong>{totalRev.toFixed(0)} DT</strong>
            <span>revenus</span>
          </div>
        </div>
      </div>

      {/* ── Barre de filtres niveau 2 ── */}
      <div className="ar-detail-filters">
        {/* Searchbar */}
        <div className="ar-detail-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={searchDetail}
            onChange={e => setSearchDetail(e.target.value)}
            placeholder="Nom, email, téléphone, n° facture / voucher..."
          />
          {searchDetail && <button onClick={() => setSearchDetail("")}>✕</button>}
        </div>

        {/* Filtre statut */}
        <select
          className="ar-detail-select"
          value={filtStatut}
          onChange={e => setFiltStatut(e.target.value)}
        >
          <option value="">Tous statuts</option>
          <option value="EN_ATTENTE">En attente</option>
          <option value="CONFIRMEE">Confirmée</option>
          <option value="TERMINEE">Terminée</option>
          <option value="ANNULEE">Annulée</option>
        </select>

        {/* Filtre source */}
        <div className="ar-detail-source-btns">
          {[
            { val: "",         lbl: "Tous"      },
            { val: "client",   lbl: "👤 Clients"   },
            { val: "visiteur", lbl: "🚶 Visiteurs" },
          ].map(s => (
            <button
              key={s.val}
              className={`ar-detail-source-btn ${filtSource === s.val ? "active" : ""}`}
              onClick={() => setFiltSource(s.val)}
            >
              {s.lbl}
            </button>
          ))}
        </div>

        {/* Résultat / reset */}
        <div className="ar-detail-filter-meta">
          <span>{filtered.length} / {current.items.length} résultat{filtered.length !== 1 ? "s" : ""}</span>
          {hasFilters && (
            <button className="ar-detail-reset" onClick={() => { setSearchDetail(""); setFiltStatut(""); setFiltSource(""); }}>
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* Tableau */}
      {filtered.length === 0 ? (
        <div className="ar-empty">
          <span>🔍</span>
          <p>Aucune réservation ne correspond aux filtres</p>
          <button onClick={() => { setSearchDetail(""); setFiltStatut(""); setFiltSource(""); }}>
            Effacer les filtres
          </button>
        </div>
      ) : (
        <div className="ar-table-shell">
          <table className="ar-table">
            <thead>
              <tr>
                <th>Personne</th>
                <th>Période</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Source</th>
                <th>Document</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const nn = nuits(r.date_debut, r.date_fin);
                return (
                  <tr key={`${r.source}-${r.id}`} className="ar-tr" onClick={() => onSelect(r)}>
                    <td>
                      <div className="ar-person">
                        <div className={`ar-avatar ${r.source}`}>{r.client_prenom?.[0]}{r.client_nom?.[0]}</div>
                        <div>
                          <b>{r.client_prenom} {r.client_nom}</b>
                          <s>{r.client_email}</s>
                        </div>
                      </div>
                    </td>
                    <td className="ar-period">
                      <span>{fmtDate(r.date_debut)}</span>
                      <em>→</em>
                      <span>{fmtDate(r.date_fin)}</span>
                      <small>{nn}n</small>
                    </td>
                    <td className="ar-ttc">{r.total_ttc?.toFixed(2)} DT</td>
                    <td><Pill statut={r.statut} /></td>
                    <td><SourceTag source={r.source} /></td>
                    <td className="ar-doc">{r.numero_facture || r.numero_voucher || "—"}</td>
                    <td><button className="ar-btn-view" onClick={e => { e.stopPropagation(); onSelect(r); }}>Voir</button></td>
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

// ══════════════════════════════════════════════════════════
//  PAGE PRINCIPALE
// ══════════════════════════════════════════════════════════
export default function AdminReservations() {
  const [data,     setData]     = useState([]);
  const [total,    setTotal]    = useState(0);
  const [nbCli,    setNbCli]    = useState(0);
  const [nbVis,    setNbVis]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [err,      setErr]      = useState(null);

  const [tab,      setTab]      = useState("tous");
  const [statut,   setStatut]   = useState("");
  const [source,   setSource]   = useState("");
  const [search,   setSearch]   = useState("");
  const [page,     setPage]     = useState(1);
  const [detail,   setDetail]   = useState(null);

  const perPage = 30;

  const load = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const q = new URLSearchParams({ page, per_page: perPage });
      if (statut)           q.set("statut",    statut);
      if (source)           q.set("source",    source);
      if (tab !== "tous")   q.set("type_resa", tab);
      if (search.trim())    q.set("search",    search.trim());

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

  const totalTTC   = data.reduce((s, r) => s + (r.total_ttc || 0), 0);
  const nbAttente  = data.filter(r => r.statut === "EN_ATTENTE").length;
  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="ar-root">

      {/* ── HEADER ─────────────────────────────── */}
      <div className="ar-top">
        <div className="ar-top-left">
          <h1>Réservations</h1>
          <p>{total} réservation{total !== 1 ? "s" : ""} • {nbCli} client{nbCli !== 1 ? "s" : ""} • {nbVis} visiteur{nbVis !== 1 ? "s" : ""}</p>
        </div>
        {nbAttente > 0 && (
          <div className="ar-alert">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span>{nbAttente} en attente</span>
          </div>
        )}
      </div>

      {/* ── STATS CARDS ────────────────────────── */}
      <div className="ar-kpis">
        {[
          { icon: "📋", val: total,                    lbl: "Total",     accent: "#2B5F8E" },
          { icon: "👤", val: nbCli,                    lbl: "Clients",   accent: "#1A3F63" },
          { icon: "🚶", val: nbVis,                    lbl: "Visiteurs", accent: "#6B2D8E" },
          { icon: "💰", val: `${totalTTC.toFixed(0)} DT`, lbl: "Revenus",   accent: "#C4973A" },
        ].map((k, i) => (
          <div key={i} className="ar-kpi" style={{ "--accent": k.accent }}>
            <div className="ar-kpi-icon">{k.icon}</div>
            <div>
              <strong>{k.val}</strong>
              <span>{k.lbl}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── ONGLETS VUE ────────────────────────── */}
      <div className="ar-tabs-bar">
        <div className="ar-tabs">
          {[
            { id: "tous",   label: "Toutes les réservations", icon: "≡" },
            { id: "hotel",  label: "Par hôtel",               icon: "🏨" },
            { id: "voyage", label: "Par voyage",              icon: "✈️" },
          ].map(t => (
            <button key={t.id} className={`ar-tab ${tab === t.id ? "active" : ""}`}
              onClick={() => setTab(t.id)}>
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        {/* Filtres (visibles uniquement en vue Toutes) */}
        {tab === "tous" && (
          <div className="ar-filters">
            <div className="ar-search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Nom, email, hôtel, voyage, facture, voucher..." />
              {search && <button onClick={() => setSearch("")}>✕</button>}
            </div>
            <select className="ar-select" value={statut} onChange={e => setStatut(e.target.value)}>
              <option value="">Tous statuts</option>
              <option value="EN_ATTENTE">En attente</option>
              <option value="CONFIRMEE">Confirmées</option>
              <option value="TERMINEE">Terminées</option>
              <option value="ANNULEE">Annulées</option>
            </select>
            <div className="ar-source-btns">
              {[
                { val: "",         lbl: "Tous"        },
                { val: "client",   lbl: "👤 Clients"   },
                { val: "visiteur", lbl: "🚶 Visiteurs" },
              ].map(s => (
                <button key={s.val}
                  className={"ar-source-btn " + (source === s.val ? "active" : "")}
                  onClick={() => setSource(s.val)}>
                  {s.lbl}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── CONTENU ────────────────────────────── */}
      <div className="ar-content">
        {loading ? (
          <div className="ar-loading">
            <div className="ar-spin-lg" />
            <p>Chargement des réservations...</p>
          </div>
        ) : err ? (
          <div className="ar-error-state">
            <span>⚠️</span>
            <p>{err}</p>
            <button onClick={load}>Réessayer</button>
          </div>
        ) : data.length === 0 ? (
          <div className="ar-empty">
            <span>📭</span>
            <p>Aucune réservation trouvée</p>
            {search && <button onClick={() => setSearch("")}>Effacer la recherche</button>}
          </div>
        ) : tab === "tous" ? (
          <VueToutes reservations={data} onSelect={setDetail} />
        ) : (
          <VueEntite reservations={data} mode={tab} onSelect={setDetail} />
        )}
      </div>

      {/* ── PAGINATION (vue Toutes seulement) ─── */}
      {tab === "tous" && totalPages > 1 && (
        <div className="ar-pagination">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Précédent</button>
          <span>Page {page} / {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Suivant →</button>
        </div>
      )}

      {/* ── MODAL DÉTAIL ───────────────────────── */}
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