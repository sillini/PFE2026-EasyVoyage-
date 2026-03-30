import { useState, useEffect, useCallback } from "react";
import "./AdminClients.css";

const BASE = "http://localhost:8000/api/v1";
const auth = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
});

/* ── Helpers ─────────────────────────────────────────── */
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const fmtDatetime = (d) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
const nuits = (d1, d2) => Math.max(0, Math.round((new Date(d2) - new Date(d1)) / 86400000));

const STATUTS_RESA = {
  EN_ATTENTE: { label: "En attente", color: "#D4870A", bg: "rgba(212,135,10,0.08)",  border: "rgba(212,135,10,0.25)" },
  CONFIRMEE:  { label: "Confirmée",  color: "#27AE60", bg: "rgba(39,174,96,0.08)",   border: "rgba(39,174,96,0.25)"  },
  ANNULEE:    { label: "Annulée",    color: "#C0392B", bg: "rgba(192,57,43,0.07)",   border: "rgba(192,57,43,0.2)"   },
  TERMINEE:   { label: "Terminée",   color: "#1A3F63", bg: "rgba(26,63,99,0.07)",    border: "rgba(26,63,99,0.18)"   },
};

function PillResa({ statut }) {
  const s = STATUTS_RESA[statut] || { label: statut, color: "#8A9BB0", bg: "#F5F7FA", border: "#D8E4EF" };
  return (
    <span className="ac-pill" style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}>
      <span className="ac-pill-dot" style={{ background: s.color }} />
      {s.label}
    </span>
  );
}

function Avatar({ prenom, nom, size = "md", actif = true }) {
  const initials = `${prenom?.[0] || ""}${nom?.[0] || ""}`.toUpperCase();
  return (
    <div className={`ac-avatar ac-avatar-${size} ${actif ? "actif" : "inactif"}`}>
      {initials}
      <span className={`ac-avatar-ring ${actif ? "on" : "off"}`} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MODAL DÉTAIL RÉSERVATION
══════════════════════════════════════════════════════════ */
function ResaDetailModal({ resa, onClose, onRefresh }) {
  const [confirming, setConfirming] = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [err,        setErr]        = useState(null);
  const n = nuits(resa.date_debut, resa.date_fin);
  const isVoyage = resa.type_resa === "voyage";

  const handleAnnuler = async () => {
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
    <div className="ac-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="ac-modal">
        {/* Ridge */}
        <div className={`ac-modal-ridge ${isVoyage ? "voyage" : "hotel"}`} />

        {/* Header */}
        <div className="ac-modal-head">
          <div className={`ac-modal-icon ${isVoyage ? "voyage" : "hotel"}`}>
            {isVoyage
              ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            }
          </div>
          <div className="ac-modal-head-info">
            <h3>{isVoyage ? resa.voyage_titre : resa.hotel_nom}</h3>
            <p>{isVoyage ? resa.voyage_destination : resa.hotel_ville}</p>
          </div>
          <div className="ac-modal-head-right">
            <PillResa statut={resa.statut} />
            <button className="ac-close-btn" onClick={onClose}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="ac-modal-body">
          <div className="ac-modal-section">
            <div className="ac-modal-section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="12" height="12">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Détails du séjour
            </div>
            <div className="ac-modal-grid">
              <div className="ac-mfield"><span>Réservé le</span><strong>{fmtDatetime(resa.date_reservation)}</strong></div>
              <div className="ac-mfield"><span>Durée</span><strong>{n} nuit{n > 1 ? "s" : ""}</strong></div>
              <div className="ac-mfield"><span>Arrivée</span><strong>{fmtDate(resa.date_debut)}</strong></div>
              <div className="ac-mfield"><span>Départ</span><strong>{fmtDate(resa.date_fin)}</strong></div>
            </div>
            <div className="ac-montant-box">
              <span>Montant total TTC</span>
              <strong>{resa.total_ttc?.toFixed(2)} DT</strong>
            </div>
          </div>

          {resa.numero_facture && (
            <div className="ac-modal-section">
              <div className="ac-modal-section-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="12" height="12">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                Facturation
              </div>
              <div className="ac-modal-grid">
                <div className="ac-mfield"><span>N° Facture</span><strong className="ac-mono">{resa.numero_facture}</strong></div>
                <div className="ac-mfield"><span>Statut facture</span><strong>{resa.statut_facture || "—"}</strong></div>
              </div>
            </div>
          )}

          {(resa.statut === "EN_ATTENTE" || resa.statut === "CONFIRMEE") && (
            <div className="ac-danger-zone">
              {!confirming ? (
                <button className="ac-btn-annuler" onClick={() => setConfirming(true)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                    <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                  Annuler cette réservation
                </button>
              ) : (
                <div className="ac-confirm-cancel">
                  <p>Confirmer l'annulation de cette réservation ?</p>
                  {err && <span className="ac-err">{err}</span>}
                  <div className="ac-confirm-btns">
                    <button className="ac-btn-ghost" onClick={() => setConfirming(false)}>Retour</button>
                    <button className="ac-btn-confirm-cancel" onClick={handleAnnuler} disabled={loading}>
                      {loading ? <span className="ac-spin" /> : "Confirmer l'annulation"}
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

/* ══════════════════════════════════════════════════════════
   VUE DÉTAIL CLIENT
══════════════════════════════════════════════════════════ */
function ClientDetail({ client, onBack, onToggle, onRefresh }) {
  const [reservations, setReservations] = useState([]);
  const [loadingResa,  setLoadingResa]  = useState(true);
  const [toggling,     setToggling]     = useState(false);
  const [resaDetail,   setResaDetail]   = useState(null);
  const [searchResa,   setSearchResa]   = useState("");
  const [filtStatut,   setFiltStatut]   = useState("");
  const [filtType,     setFiltType]     = useState("");

  useEffect(() => { loadResas(); }, [client.id]);

  const loadResas = async () => {
    setLoadingResa(true);
    try {
      const r = await fetch(`${BASE}/admin/clients/${client.id}/reservations`, { headers: auth() });
      const d = await r.json();
      setReservations(d.items || []);
    } catch { setReservations([]); }
    finally { setLoadingResa(false); }
  };

  const handleToggle = async () => {
    setToggling(true);
    try { await onToggle(client.id, !client.actif); }
    finally { setToggling(false); }
  };

  const filtered = reservations.filter(r => {
    if (filtStatut && r.statut !== filtStatut) return false;
    if (filtType   && r.type_resa !== filtType) return false;
    if (searchResa) {
      const q = searchResa.toLowerCase();
      if (!(r.hotel_nom || r.voyage_titre || "").toLowerCase().includes(q) &&
          !(r.numero_facture || "").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const totalDepense = reservations.reduce((s, r) => s + (r.total_ttc || 0), 0);
  const nbConfirmees = reservations.filter(r => r.statut === "CONFIRMEE").length;

  return (
    <div className="ac-detail-page">

      {/* Breadcrumb */}
      <div className="ac-breadcrumb">
        <button className="ac-back-btn" onClick={onBack}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Clients
        </button>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="11" height="11" className="ac-bc-sep">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
        <span className="ac-bc-current">{client.prenom} {client.nom}</span>
      </div>

      {/* Hero banner client */}
      <div className="ac-client-banner">
        <div className="ac-banner-bg">
          <div className="ac-banner-mesh" />
          <div className="ac-banner-line ac-bl-1" />
          <div className="ac-banner-line ac-bl-2" />
        </div>
        <div className="ac-banner-body">
          <div className="ac-banner-left">
            <div className="ac-banner-avatar-wrap">
              <Avatar prenom={client.prenom} nom={client.nom} size="xl" actif={client.actif} />
            </div>
            <div className="ac-banner-identity">
              <div className="ac-banner-pills">
                <span className={`ac-status-pill ${client.actif ? "on" : "off"}`}>
                  <span className="ac-spill-dot" />
                  {client.actif ? "Actif" : "Désactivé"}
                </span>
              </div>
              <h1 className="ac-banner-name">{client.prenom} {client.nom}</h1>
              <p className="ac-banner-email">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="12" height="12">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                {client.email}
              </p>
              {client.telephone && (
                <p className="ac-banner-tel">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="12" height="12">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.27 2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  {client.telephone}
                </p>
              )}
            </div>
          </div>
          <div className="ac-banner-right">
            <button
              className={`ac-toggle-btn ${client.actif ? "suspend" : "activate"}`}
              onClick={handleToggle}
              disabled={toggling}>
              {toggling
                ? <span className="ac-spin" />
                : client.actif
                  ? <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>Désactiver</>
                  : <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><polygon points="5 3 19 12 5 21 5 3"/></svg>Activer</>
              }
            </button>
          </div>
        </div>

        {/* KPI strip */}
        <div className="ac-kpi-strip">
          {[
            { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><polyline points="16 2 16 6 8 6 8 2"/></svg>, val: reservations.length, lbl: "Réservations" },
            { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="20 6 9 17 4 12"/></svg>, val: nbConfirmees, lbl: "Confirmées" },
            { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>, val: `${totalDepense.toFixed(0)} DT`, lbl: "Total dépensé" },
            { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, val: fmtDate(client.date_inscription), lbl: "Membre depuis" },
          ].map((k, i) => (
            <div key={i} className="ac-kpi-item">
              <div className="ac-kpi-icon">{k.icon}</div>
              <div className="ac-kpi-body">
                <span className="ac-kpi-val">{k.val}</span>
                <span className="ac-kpi-lbl">{k.lbl}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section réservations */}
      <div className="ac-resas-panel">
        {/* Panel header */}
        <div className="ac-resas-panel-header">
          <div className="ac-resas-panel-title">
            <div className="ac-panel-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <polyline points="16 2 16 6 8 6 8 2"/>
              </svg>
            </div>
            <div>
              <h2>Réservations</h2>
              <p>{reservations.length} réservation{reservations.length !== 1 ? "s" : ""} au total</p>
            </div>
            <span className="ac-resas-count-badge">{filtered.length} / {reservations.length}</span>
          </div>

          {/* Filtres */}
          <div className="ac-resas-filters">
            <label className="ac-filter-search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                value={searchResa}
                onChange={e => setSearchResa(e.target.value)}
                placeholder="Hôtel, voyage, n° facture…"
              />
              {searchResa && (
                <button className="ac-filter-clear" onClick={() => setSearchResa("")}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="10" height="10">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </label>

            <select className="ac-filter-select" value={filtStatut} onChange={e => setFiltStatut(e.target.value)}>
              <option value="">Tous statuts</option>
              <option value="EN_ATTENTE">En attente</option>
              <option value="CONFIRMEE">Confirmée</option>
              <option value="TERMINEE">Terminée</option>
              <option value="ANNULEE">Annulée</option>
            </select>

            <div className="ac-type-tabs">
              {[{v:"",l:"Tous"},{v:"hotel",l:"🏨 Hôtels"},{v:"voyage",l:"✈️ Voyages"}].map(t => (
                <button key={t.v} className={`ac-type-tab ${filtType === t.v ? "active" : ""}`}
                  onClick={() => setFiltType(t.v)}>{t.l}</button>
              ))}
            </div>

            {(searchResa || filtStatut || filtType) && (
              <button className="ac-reset-filters" onClick={() => { setSearchResa(""); setFiltStatut(""); setFiltType(""); }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                  <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
                </svg>
                Réinitialiser
              </button>
            )}
          </div>
        </div>

        {/* Tableau — scroll ici uniquement */}
        <div className="ac-resas-body">
          {loadingResa ? (
            <div className="ac-state-inline">
              <div className="ac-loader">
                <div className="ac-loader-ring" />
                <div className="ac-loader-ring ac-lr2" />
              </div>
              <p>Chargement des réservations…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="ac-state-inline">
              <div className="ac-empty-icon">
                {reservations.length === 0
                  ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8" width="52" height="52"><rect x="3" y="4" width="18" height="18" rx="2"/><polyline points="16 2 16 6 8 6 8 2"/></svg>
                  : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8" width="52" height="52"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                }
              </div>
              <h3>{reservations.length === 0 ? "Aucune réservation" : "Aucun résultat"}</h3>
              <p>{reservations.length === 0 ? "Ce client n'a pas encore effectué de réservation" : "Modifiez vos critères de filtrage"}</p>
            </div>
          ) : (
            <table className="ac-resas-table">
              <thead>
                <tr>
                  <th>Destination</th>
                  <th>Période</th>
                  <th>Durée</th>
                  <th>Montant</th>
                  <th>Statut</th>
                  <th>Facture</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => {
                  const n = nuits(r.date_debut, r.date_fin);
                  const isV = r.type_resa === "voyage";
                  return (
                    <tr key={r.id} className="ac-resa-row" style={{ animationDelay: `${i * 0.03}s` }}
                      onClick={() => setResaDetail(r)}>
                      <td>
                        <div className="ac-dest">
                          <span className={`ac-dest-bar ${isV ? "voyage" : "hotel"}`} />
                          <div>
                            <strong>{isV ? r.voyage_titre : r.hotel_nom}</strong>
                            <span>{isV ? r.voyage_destination : r.hotel_ville}</span>
                          </div>
                        </div>
                      </td>
                      <td className="ac-period">
                        <span>{fmtDate(r.date_debut)}</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="10" height="10" className="ac-arrow-icon">
                          <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                        </svg>
                        <span>{fmtDate(r.date_fin)}</span>
                      </td>
                      <td className="ac-nuits">
                        <span className="ac-nuits-badge">{n}n</span>
                      </td>
                      <td className="ac-ttc">{r.total_ttc?.toFixed(2)} DT</td>
                      <td><PillResa statut={r.statut} /></td>
                      <td className="ac-facture">{r.numero_facture || "—"}</td>
                      <td onClick={e => e.stopPropagation()}>
                        <button className="ac-btn-detail" onClick={() => setResaDetail(r)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                          </svg>
                          Détails
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {resaDetail && (
        <ResaDetailModal
          resa={resaDetail}
          onClose={() => setResaDetail(null)}
          onRefresh={() => { loadResas(); setResaDetail(null); }}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE PRINCIPALE — Liste clients
══════════════════════════════════════════════════════════ */
export default function AdminClients() {
  const [clients,   setClients]   = useState([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [err,       setErr]       = useState(null);
  const [search,    setSearch]    = useState("");
  const [filtActif, setFiltActif] = useState("");
  const [page,      setPage]      = useState(1);
  const [selected,  setSelected]  = useState(null);
  const perPage = 20;

  const load = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const q = new URLSearchParams({ page, per_page: perPage });
      if (search.trim()) q.set("search", search.trim());
      if (filtActif)     q.set("actif",  filtActif);
      const r = await fetch(`${BASE}/admin/clients?${q}`, { headers: auth() });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Erreur");
      setClients(d.items || []);
      setTotal(d.total || 0);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, [page, search, filtActif]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [filtActif]);
  useEffect(() => { const t = setTimeout(() => setPage(1), 400); return () => clearTimeout(t); }, [search]);

  const handleToggle = async (id, actif) => {
    try {
      const r = await fetch(`${BASE}/admin/clients/${id}/toggle`, {
        method: "PATCH", headers: auth(),
        body: JSON.stringify({ actif }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Erreur");
      setClients(prev => prev.map(c => c.id === id ? { ...c, actif: d.actif } : c));
      if (selected?.id === id) setSelected(d);
    } catch (e) { alert(e.message); }
  };

  const totalPages = Math.ceil(total / perPage);
  const nbActifs   = clients.filter(c => c.actif).length;
  const nbInactifs = clients.filter(c => !c.actif).length;

  if (selected) {
    return (
      <ClientDetail
        client={selected}
        onBack={() => { setSelected(null); load(); }}
        onToggle={async (id, actif) => { await handleToggle(id, actif); }}
        onRefresh={load}
      />
    );
  }

  return (
    <div className="ac-page">

      {/* Header */}
      <header className="ac-page-header">
        <div className="ac-page-title-block">
          <div className="ac-page-eyebrow">
            <span className="ac-eyebrow-dot" />
            Gestion des comptes
          </div>
          <h1 className="ac-page-title">Clients</h1>
          <p className="ac-page-desc">{total} client{total !== 1 ? "s" : ""} enregistrés sur la plateforme</p>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="ac-kpi-grid">
        {[
          { color: "blue",  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, val: total,      lbl: "Total clients",   sub: "enregistrés" },
          { color: "green", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,                 val: nbActifs,    lbl: "Clients actifs",  sub: "avec accès" },
          { color: "rose",  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>, val: nbInactifs,  lbl: "Désactivés",      sub: "sans accès" },
        ].map((k, i) => (
          <div key={i} className={`ac-kpi-card ac-kpi-${k.color}`}>
            <div className="ac-kpi-card-icon">{k.icon}</div>
            <div className="ac-kpi-card-body">
              <span className="ac-kpi-card-val">{k.val}</span>
              <span className="ac-kpi-card-lbl">{k.lbl}</span>
              <span className="ac-kpi-card-sub">{k.sub}</span>
            </div>
            <div className="ac-kpi-card-deco" />
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="ac-toolbar">
        <div className="ac-actif-tabs">
          {[
            { val: "",      lbl: "Tous",       dot: null },
            { val: "true",  lbl: "Actifs",     dot: "green" },
            { val: "false", lbl: "Désactivés", dot: "red" },
          ].map(t => (
            <button key={t.val} className={`ac-atab ${filtActif === t.val ? "active" : ""}`}
              onClick={() => setFiltActif(t.val)}>
              {t.dot && <span className={`ac-atab-dot ac-atab-${t.dot}`} />}
              {t.lbl}
              {t.val === "" && <span className="ac-atab-count">{total}</span>}
              {t.val === "true"  && <span className="ac-atab-count">{nbActifs}</span>}
              {t.val === "false" && <span className="ac-atab-count">{nbInactifs}</span>}
            </button>
          ))}
        </div>

        <div className="ac-toolbar-spacer" />

        <label className="ac-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nom, prénom, email…" />
          {search && (
            <button className="ac-search-clear" onClick={() => setSearch("")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="10" height="10">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </label>

        <div className="ac-result-pill">
          <span className="ac-rp-num">{clients.length}</span>
          <span className="ac-rp-lbl">affiché{clients.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Contenu */}
      {loading ? (
        <div className="ac-state-box">
          <div className="ac-loader"><div className="ac-loader-ring" /><div className="ac-loader-ring ac-lr2" /></div>
          <p>Chargement des clients…</p>
        </div>
      ) : err ? (
        <div className="ac-state-box error">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <h3>Erreur de chargement</h3>
          <p>{err}</p>
          <button className="ac-retry-btn" onClick={load}>Réessayer</button>
        </div>
      ) : clients.length === 0 ? (
        <div className="ac-state-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8" width="52" height="52">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
          </svg>
          <h3>Aucun client trouvé</h3>
          <p>{search ? `Aucun résultat pour "${search}"` : "Aucun client dans cette catégorie"}</p>
        </div>
      ) : (
        <div className="ac-table-shell">
          <table className="ac-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Téléphone</th>
                <th>Inscription</th>
                <th>Dernière connexion</th>
                <th>Réservations</th>
                <th>Total dépensé</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c, i) => (
                <ClientRow key={c.id} client={c} index={i} onView={() => setSelected(c)} onToggle={handleToggle} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="ac-pagination">
          <button className="ac-pg-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Précédent
          </button>
          <div className="ac-pg-pages">
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
              <button key={p} className={`ac-pg-num ${page === p ? "active" : ""}`} onClick={() => setPage(p)}>{p}</button>
            ))}
          </div>
          <button className="ac-pg-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
            Suivant
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Ligne tableau client ──────────────────────────────── */
function ClientRow({ client, index, onView, onToggle }) {
  const [toggling, setToggling] = useState(false);

  const handleToggle = async (e) => {
    e.stopPropagation();
    setToggling(true);
    try { await onToggle(client.id, !client.actif); }
    finally { setToggling(false); }
  };

  return (
    <tr className="ac-tr" style={{ animationDelay: `${index * 0.04}s` }} onClick={onView}>
      <td>
        <div className="ac-person">
          <Avatar prenom={client.prenom} nom={client.nom} size="sm" actif={client.actif} />
          <div className="ac-person-info">
            <strong>{client.prenom} {client.nom}</strong>
            <span>{client.email}</span>
          </div>
        </div>
      </td>
      <td className="ac-tel">{client.telephone || "—"}</td>
      <td className="ac-date">{fmtDate(client.date_inscription)}</td>
      <td className="ac-date">{fmtDatetime(client.derniere_connexion) || "Jamais"}</td>
      <td>
        <span className="ac-resa-badge">{client.nb_reservations}</span>
      </td>
      <td className="ac-depense">{client.total_depense?.toFixed(0)} DT</td>
      <td>
        <span className={`ac-actif-pill ${client.actif ? "on" : "off"}`}>
          <span className="ac-pill-dot" />
          {client.actif ? "Actif" : "Désactivé"}
        </span>
      </td>
      <td onClick={e => e.stopPropagation()}>
        <div className="ac-row-actions">
          <button className="ac-btn-view" onClick={onView}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
            Voir
          </button>
          <button className={`ac-btn-toggle ${client.actif ? "suspend" : "activate"}`}
            onClick={handleToggle} disabled={toggling}>
            {toggling ? <span className="ac-spin-sm" /> : client.actif ? "Désactiver" : "Activer"}
          </button>
        </div>
      </td>
    </tr>
  );
}