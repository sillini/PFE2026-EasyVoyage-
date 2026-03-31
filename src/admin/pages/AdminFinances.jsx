/**
 * AdminFinances.jsx — Module Finances Avancé
 * Dashboard financier complet avec drill-down hiérarchique :
 *   Partenaires → Hôtels → Réservations
 * + Soldes à payer, Historique, Clients/Visiteurs, Graphiques
 */
import { useState, useEffect, useCallback, useRef } from "react";
import "./AdminFinances.css";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
});
const fmt  = (n) => Number(n || 0).toLocaleString("fr-TN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtD = (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";
const api  = (url) => fetch(`${BASE}${url}`, { headers: authHeaders() }).then(r => r.json());

// ════════════════════════════════════════════════════════════
//  COMPOSANTS UTILITAIRES
// ════════════════════════════════════════════════════════════

function Pill({ statut }) {
  const map = {
    EN_ATTENTE: { label: "En attente", cls: "pill-wait" },
    PAYEE:      { label: "Payée",      cls: "pill-paid" },
    CONFIRMEE:  { label: "Confirmée",  cls: "pill-ok"   },
    TERMINEE:   { label: "Terminée",   cls: "pill-end"  },
  };
  const v = map[statut] || { label: statut, cls: "pill-default" };
  return <span className={`af2-pill ${v.cls}`}>{v.label}</span>;
}

function KpiCard({ icon, label, value, sub, color, small }) {
  return (
    <div className={`af2-kpi${small ? " af2-kpi-sm" : ""}`} style={{ "--acc": color }}>
      <div className="af2-kpi-icon">{icon}</div>
      <div className="af2-kpi-body">
        <div className="af2-kpi-val">{value}</div>
        <div className="af2-kpi-label">{label}</div>
        {sub && <div className="af2-kpi-sub">{sub}</div>}
      </div>
    </div>
  );
}

function Spinner() { return <div className="af2-spinner"><span className="af2-spin" /></div>; }

function Breadcrumb({ crumbs }) {
  return (
    <div className="af2-breadcrumb">
      {crumbs.map((c, i) => (
        <span key={i}>
          {i > 0 && <span className="af2-bc-sep">›</span>}
          {c.onClick
            ? <button className="af2-bc-btn" onClick={c.onClick}>{c.label}</button>
            : <span className="af2-bc-current">{c.label}</span>}
        </span>
      ))}
    </div>
  );
}

// Mini bar chart SVG
function BarChart({ data, height = 120 }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map(d => d.revenu_total), 1);
  const W = 100 / data.length;
  return (
    <svg viewBox={`0 0 ${data.length * 40} ${height + 20}`} className="af2-chart-svg">
      {data.map((d, i) => {
        const hH = (d.revenu_hotel  / max) * height;
        const vH = (d.revenu_voyage / max) * height;
        const x  = i * 40 + 4;
        return (
          <g key={i}>
            <rect x={x} y={height - hH} width={16} height={hH} fill="var(--c-blue)" rx="2" opacity="0.9" />
            <rect x={x + 17} y={height - vH} width={16} height={vH} fill="var(--c-gold)" rx="2" opacity="0.9" />
            <text x={x + 16} y={height + 14} textAnchor="middle" fontSize="8" fill="var(--c-muted)">{d.periode}</text>
          </g>
        );
      })}
    </svg>
  );
}

// Donut chart SVG
function DonutChart({ comm, part }) {
  const total = comm + part || 1;
  const pComm = comm / total;
  const r = 36; const cx = 44; const cy = 44;
  const circumference = 2 * Math.PI * r;
  const dashComm = pComm * circumference;
  return (
    <svg viewBox="0 0 88 88" className="af2-donut-svg">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--c-gold)" strokeWidth="14" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--c-blue)" strokeWidth="14"
        strokeDasharray={`${dashComm} ${circumference - dashComm}`}
        strokeDashoffset={circumference * 0.25}
        transform={`rotate(-90 ${cx} ${cy})`} />
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="9" fill="var(--c-text)" fontWeight="700">{Math.round(pComm * 100)}%</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize="7" fill="var(--c-muted)">Agence</text>
    </svg>
  );
}

// ════════════════════════════════════════════════════════════
//  ONGLET 1 — REVENUS
// ════════════════════════════════════════════════════════════

function OngletRevenus({ dash }) {
  const [periode, setPeriode] = useState("mois");
  const [annee,   setAnnee]   = useState(new Date().getFullYear());
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api(`/finances/revenus?periode=${periode}&annee=${annee}`);
      setData(d);
    } finally { setLoading(false); }
  }, [periode, annee]);

  useEffect(() => { load(); }, [load]);

  const annees = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="af2-tab-content">
      {/* KPIs du dashboard */}
      {dash && (
        <div className="af2-kpis-grid">
          <KpiCard icon="💰" label="Revenu total (année)" value={`${fmt(dash.revenu_total_annee)} DT`} color="#1A3F63" />
          <KpiCard icon="🏨" label="Hôtels" value={`${fmt(dash.revenu_hotel_annee)} DT`} color="#2B5F8E" />
          <KpiCard icon="✈️" label="Voyages" value={`${fmt(dash.revenu_voyage_annee)} DT`} color="#C4973A" />
          <KpiCard icon="⚡" label="Commission agence (10%)" value={`${fmt(dash.commission_annee)} DT`} color="#27AE60" />
          <KpiCard icon="🤝" label="Part partenaires" value={`${fmt(dash.total_part_partenaires)} DT`} color="#8E44AD" />
          <KpiCard icon="⏳" label="Soldes à payer" value={`${fmt(dash.total_du_partenaires)} DT`} color="#E74C3C" sub={`${dash.nb_partenaires_en_attente} partenaire(s)`} />
        </div>
      )}

      {/* Répartition donut */}
      {dash && (
        <div className="af2-donut-row">
          <div className="af2-donut-card">
            <DonutChart comm={dash.commission_annee} part={dash.total_part_partenaires} />
            <div className="af2-donut-legend">
              <div><span className="af2-leg-dot" style={{ background: "var(--c-blue)" }} />Commission agence : <b>{fmt(dash.commission_annee)} DT</b></div>
              <div><span className="af2-leg-dot" style={{ background: "var(--c-gold)" }} />Part partenaires : <b>{fmt(dash.total_part_partenaires)} DT</b></div>
            </div>
          </div>
          <div className="af2-donut-info">
            <div className="af2-info-row"><span>📅 Ce mois</span><b>{fmt(dash.revenu_total_mois)} DT</b></div>
            <div className="af2-info-row"><span>📋 Réservations (mois)</span><b>{dash.nb_reservations_mois}</b></div>
            <div className="af2-info-row"><span>📋 Réservations (année)</span><b>{dash.nb_reservations_annee}</b></div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="af2-toolbar">
        <div className="af2-period-tabs">
          {[["jour","Quotidien"],["mois","Mensuel"],["annee","Annuel"]].map(([v,l]) => (
            <button key={v} className={`af2-period-btn${periode===v?" on":""}`} onClick={() => setPeriode(v)}>{l}</button>
          ))}
        </div>
        <select className="af2-select" value={annee} onChange={e => setAnnee(+e.target.value)}>
          {annees.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {loading ? <Spinner /> : data ? (
        <>
          <div className="af2-chart-card">
            <div className="af2-chart-header">
              <h3>Évolution des revenus</h3>
              <div className="af2-legend">
                <span className="af2-leg-dot" style={{ background: "var(--c-blue)" }} />Hôtels
                <span className="af2-leg-dot" style={{ background: "var(--c-gold)" }} />Voyages
              </div>
            </div>
            <BarChart data={data.evolution} />
          </div>

          <div className="af2-table-card">
            <table className="af2-table">
              <thead><tr>
                <th>Période</th><th>Hôtels</th><th>Voyages</th><th>Total</th>
                <th>Commission (10%)</th><th>Part partenaires</th><th>Réservations</th>
              </tr></thead>
              <tbody>
                {data.evolution.map((r, i) => (
                  <tr key={i} className={r.revenu_total > 0 ? "af2-tr af2-tr-active" : "af2-tr"}>
                    <td><b>{r.periode}</b></td>
                    <td>{fmt(r.revenu_hotel)} DT</td>
                    <td>{fmt(r.revenu_voyage)} DT</td>
                    <td><b>{fmt(r.revenu_total)} DT</b></td>
                    <td className="af2-td-comm">{fmt(r.commission_total)} DT</td>
                    <td>{fmt(r.revenu_total - r.commission_total)} DT</td>
                    <td>{r.nb_reservations}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  ONGLET 2 — PARTENAIRES (drill-down)
// ════════════════════════════════════════════════════════════

function OngletPartenaires() {
  const [view,       setView]       = useState("partenaires"); // partenaires | hotels | reservations
  const [partenaires, setPart]      = useState([]);
  const [hotels,     setHotels]     = useState([]);
  const [reservations, setResas]    = useState([]);
  const [selPart,    setSelPart]    = useState(null);
  const [selHotel,   setSelHotel]   = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [filtreComm, setFiltreComm] = useState("");
  const [page,       setPage]       = useState(1);
  const [total,      setTotal]      = useState(0);
  const [paying,     setPaying]     = useState(null);
  const PER = 15;

  const loadPartenaires = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ page, per_page: PER });
      if (search) q.set("search", search);
      const d = await api(`/finances/partenaires?${q}`);
      setPart(d.items || []); setTotal(d.total || 0);
    } finally { setLoading(false); }
  }, [page, search]);

  const loadHotels = useCallback(async (partId) => {
    setLoading(true);
    try {
      const d = await api(`/finances/partenaires/${partId}/hotels`);
      setHotels(d.items || []);
    } finally { setLoading(false); }
  }, []);

  const loadReservations = useCallback(async (partId, hotelId) => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ page, per_page: PER });
      if (filtreComm) q.set("statut_commission", filtreComm);
      const d = await api(`/finances/partenaires/${partId}/hotels/${hotelId}/reservations?${q}`);
      setResas(d.items || []); setTotal(d.total || 0);
    } finally { setLoading(false); }
  }, [page, filtreComm]);

  useEffect(() => {
    if (view === "partenaires") loadPartenaires();
    else if (view === "hotels" && selPart) loadHotels(selPart.id_partenaire);
    else if (view === "reservations" && selPart && selHotel) loadReservations(selPart.id_partenaire, selHotel.id_hotel);
  }, [view, loadPartenaires, loadHotels, loadReservations, selPart, selHotel]);

  const drillHotels = (part) => { setSelPart(part); setPage(1); setView("hotels"); };
  const drillResas  = (hotel) => { setSelHotel(hotel); setPage(1); setView("reservations"); };
  const backToList  = () => { setView("partenaires"); setSelPart(null); setSelHotel(null); setPage(1); };
  const backToHotels= () => { setView("hotels"); setSelHotel(null); setPage(1); };

  const totalPages = Math.ceil(total / PER);

  // Breadcrumb
  const crumbs = [{ label: "Partenaires", onClick: view !== "partenaires" ? backToList : null }];
  if (selPart) crumbs.push({ label: selPart.nom_entreprise, onClick: view === "reservations" ? backToHotels : null });
  if (selHotel) crumbs.push({ label: selHotel.hotel_nom });

  const handlePay = async (part) => {
    if (!window.confirm(`Payer ${fmt(part.solde_restant)} DT à ${part.partenaire_prenom} ${part.partenaire_nom} ?`)) return;
    await fetch(`${BASE}/finances/payer/${part.id_partenaire}`, {
      method: "POST", headers: authHeaders(), body: JSON.stringify({ note: "" }),
    });
    loadPartenaires();
  };

  return (
    <div className="af2-tab-content">
      <Breadcrumb crumbs={crumbs} />

      {/* Toolbar */}
      <div className="af2-toolbar">
        {view === "partenaires" && (
          <input className="af2-search" placeholder="🔍 Rechercher partenaire…"
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        )}
        {view === "reservations" && (
          <select className="af2-select" value={filtreComm} onChange={e => { setFiltreComm(e.target.value); setPage(1); }}>
            <option value="">Tous les statuts</option>
            <option value="EN_ATTENTE">En attente</option>
            <option value="PAYEE">Payée</option>
          </select>
        )}
      </div>

      {loading ? <Spinner /> : (
        <>
          {/* ── Vue Partenaires ── */}
          {view === "partenaires" && (
            <div className="af2-table-card">
              <table className="af2-table">
                <thead><tr>
                  <th>Partenaire</th><th>Entreprise</th><th>Revenu total</th>
                  <th>Commission agence</th><th>Part partenaire</th>
                  <th>Payé</th><th>Solde restant</th><th>Réservations</th><th>Actions</th>
                </tr></thead>
                <tbody>
                  {partenaires.map(p => (
                    <tr key={p.id_partenaire} className="af2-tr">
                      <td>
                        <div className="af2-person">
                          <div className="af2-avatar">{(p.partenaire_prenom[0]||"?")+( p.partenaire_nom[0]||"")}</div>
                          <div><b>{p.partenaire_prenom} {p.partenaire_nom}</b><br/><small>{p.partenaire_email}</small></div>
                        </div>
                      </td>
                      <td>{p.nom_entreprise}</td>
                      <td><b>{fmt(p.revenu_total)} DT</b></td>
                      <td className="af2-td-comm">{fmt(p.commission_agence)} DT<br/><small>{p.commission_taux}%</small></td>
                      <td>{fmt(p.part_partenaire)} DT</td>
                      <td className="af2-td-paid">{fmt(p.montant_paye)} DT</td>
                      <td>
                        {p.solde_restant > 0
                          ? <span className="af2-badge-due">{fmt(p.solde_restant)} DT</span>
                          : <span className="af2-badge-ok">✓ À jour</span>}
                      </td>
                      <td>{p.nb_reservations}</td>
                      <td>
                        <div className="af2-actions">
                          <button className="af2-btn-drill" onClick={() => drillHotels(p)} title="Voir hôtels">🏨</button>
                          {p.solde_restant > 0 && (
                            <button className="af2-btn-pay" onClick={() => handlePay(p)} title="Payer">💸</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {partenaires.length === 0 && (
                    <tr><td colSpan={9} className="af2-empty-row">Aucun partenaire trouvé</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Vue Hôtels ── */}
          {view === "hotels" && (
            <div className="af2-table-card">
              <div className="af2-part-header">
                <div className="af2-part-avatar">{selPart.partenaire_prenom[0]}{selPart.partenaire_nom[0]}</div>
                <div>
                  <h3>{selPart.partenaire_prenom} {selPart.partenaire_nom}</h3>
                  <p>{selPart.nom_entreprise} — Commission : {selPart.commission_taux}%</p>
                </div>
                <div className="af2-part-kpis">
                  <KpiCard small icon="💰" label="Revenu total" value={`${fmt(selPart.revenu_total)} DT`} color="#1A3F63" />
                  <KpiCard small icon="⚡" label="Agence" value={`${fmt(selPart.commission_agence)} DT`} color="#27AE60" />
                  <KpiCard small icon="🤝" label="Part" value={`${fmt(selPart.part_partenaire)} DT`} color="#8E44AD" />
                  <KpiCard small icon="⏳" label="Solde" value={`${fmt(selPart.solde_restant)} DT`} color="#E74C3C" />
                </div>
              </div>
              <table className="af2-table">
                <thead><tr>
                  <th>Hôtel</th><th>Ville</th><th>Revenu total</th>
                  <th>Commission agence</th><th>Part partenaire</th>
                  <th>Payé</th><th>Solde restant</th><th>Réservations</th><th>Détail</th>
                </tr></thead>
                <tbody>
                  {hotels.map(h => (
                    <tr key={h.id_hotel} className="af2-tr">
                      <td><b>{h.hotel_nom}</b></td>
                      <td>{h.hotel_ville}</td>
                      <td><b>{fmt(h.revenu_total)} DT</b></td>
                      <td className="af2-td-comm">{fmt(h.commission_agence)} DT</td>
                      <td>{fmt(h.part_partenaire)} DT</td>
                      <td className="af2-td-paid">{fmt(h.montant_paye)} DT</td>
                      <td>
                        {h.solde_restant > 0
                          ? <span className="af2-badge-due">{fmt(h.solde_restant)} DT</span>
                          : <span className="af2-badge-ok">✓ À jour</span>}
                      </td>
                      <td>{h.nb_reservations}</td>
                      <td><button className="af2-btn-drill" onClick={() => drillResas(h)}>📋</button></td>
                    </tr>
                  ))}
                  {hotels.length === 0 && (
                    <tr><td colSpan={9} className="af2-empty-row">Aucun hôtel pour ce partenaire</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Vue Réservations ── */}
          {view === "reservations" && (
            <div className="af2-table-card">
              <div className="af2-hotel-header">
                <h3>🏨 {selHotel.hotel_nom}</h3>
                <div className="af2-part-kpis">
                  <KpiCard small icon="💰" label="Revenu" value={`${fmt(selHotel.revenu_total)} DT`} color="#1A3F63" />
                  <KpiCard small icon="⚡" label="Agence" value={`${fmt(selHotel.commission_agence)} DT`} color="#27AE60" />
                  <KpiCard small icon="⏳" label="Solde" value={`${fmt(selHotel.solde_restant)} DT`} color="#E74C3C" />
                </div>
              </div>
              <table className="af2-table">
                <thead><tr>
                  <th>#Resa</th><th>Client</th><th>Période</th><th>Total résa</th>
                  <th>Commission agence</th><th>Part partenaire</th><th>Taux</th><th>Statut</th><th>Date paiement</th>
                </tr></thead>
                <tbody>
                  {reservations.map(r => (
                    <tr key={r.id_commission} className="af2-tr">
                      <td><span className="af2-resa-id">#{r.id_reservation}</span></td>
                      <td>{r.client_nom}</td>
                      <td><small>{fmtD(r.date_debut)} → {fmtD(r.date_fin)}</small></td>
                      <td><b>{fmt(r.montant_total)} DT</b></td>
                      <td className="af2-td-comm">{fmt(r.commission_agence)} DT</td>
                      <td>{fmt(r.part_partenaire)} DT</td>
                      <td>{r.taux_commission}%</td>
                      <td><Pill statut={r.statut_commission} /></td>
                      <td>{fmtD(r.date_paiement)}</td>
                    </tr>
                  ))}
                  {reservations.length === 0 && (
                    <tr><td colSpan={9} className="af2-empty-row">Aucune réservation</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="af2-pagination">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Préc.</button>
              <span>Page {page} / {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Suiv. →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  ONGLET 3 — SOLDES À PAYER
// ════════════════════════════════════════════════════════════

function OngletSoldes() {
  const [soldes,  setSoldes]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying,  setPaying]  = useState(null);
  const [payNote, setPayNote] = useState("");
  const [payLoading, setPayLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api("/finances/soldes-partenaires");
      setSoldes(d.items || []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handlePay = async () => {
    if (!paying) return;
    setPayLoading(true);
    try {
      await fetch(`${BASE}/finances/payer/${paying.id_partenaire}`, {
        method: "POST", headers: authHeaders(), body: JSON.stringify({ note: payNote }),
      });
      setPaying(null); setPayNote(""); load();
    } finally { setPayLoading(false); }
  };

  const totalDu = soldes.reduce((s, x) => s + x.solde_du, 0);

  return (
    <div className="af2-tab-content">
      {paying && (
        <div className="af2-modal-overlay" onClick={() => setPaying(null)}>
          <div className="af2-modal" onClick={e => e.stopPropagation()}>
            <div className="af2-modal-head">
              <h3>💸 Payer {paying.partenaire_prenom} {paying.partenaire_nom}</h3>
              <button onClick={() => setPaying(null)}>✕</button>
            </div>
            <div className="af2-modal-body">
              <div className="af2-modal-amount">
                <span>Montant à payer</span>
                <strong>{fmt(paying.solde_du)} DT</strong>
              </div>
              <p className="af2-modal-warn">
                ⚠️ Cette action marquera <b>{paying.nb_commissions} commission(s)</b> comme payées.
              </p>
              <textarea className="af2-textarea" placeholder="Note optionnelle…"
                value={payNote} onChange={e => setPayNote(e.target.value)} rows={2} />
            </div>
            <div className="af2-modal-foot">
              <button className="af2-btn-cancel" onClick={() => setPaying(null)}>Annuler</button>
              <button className="af2-btn-confirm" onClick={handlePay} disabled={payLoading}>
                {payLoading ? <span className="af2-spin" /> : `✓ Confirmer ${fmt(paying.solde_du)} DT`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KPI total dû */}
      <div className="af2-kpis-grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        <KpiCard icon="⏳" label="Total à payer" value={`${fmt(totalDu)} DT`} color="#E74C3C" />
        <KpiCard icon="🤝" label="Partenaires en attente" value={soldes.length} color="#C4973A" />
        <KpiCard icon="📋" label="Commissions en attente" value={soldes.reduce((s, x) => s + x.nb_commissions, 0)} color="#2B5F8E" />
      </div>

      {loading ? <Spinner /> : soldes.length === 0 ? (
        <div className="af2-empty-full">✅ Tous les partenaires sont à jour !</div>
      ) : (
        <div className="af2-table-card">
          <table className="af2-table">
            <thead><tr>
              <th>Partenaire</th><th>Entreprise</th>
              <th>Commissions en attente</th><th>Montant dû</th><th>Action</th>
            </tr></thead>
            <tbody>
              {soldes.map(s => (
                <tr key={s.id_partenaire} className="af2-tr">
                  <td>
                    <div className="af2-person">
                      <div className="af2-avatar">{s.partenaire_prenom[0]}{s.partenaire_nom[0]}</div>
                      <div><b>{s.partenaire_prenom} {s.partenaire_nom}</b><br/><small>{s.partenaire_email}</small></div>
                    </div>
                  </td>
                  <td>{s.nom_entreprise}</td>
                  <td><span className="af2-badge-nb">{s.nb_commissions}</span></td>
                  <td><span className="af2-amount-due">{fmt(s.solde_du)} DT</span></td>
                  <td>
                    <button className="af2-btn-pay-full" onClick={() => setPaying(s)}>
                      💸 Payer {fmt(s.solde_du)} DT
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  ONGLET 4 — HISTORIQUE PAIEMENTS
// ════════════════════════════════════════════════════════════

function OngletHistorique() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);
  const [total,   setTotal]   = useState(0);
  const [filtreP, setFiltreP] = useState("");
  const [dateD,   setDateD]   = useState("");
  const [dateF,   setDateF]   = useState("");
  const PER = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ page, per_page: PER });
      if (filtreP) q.set("id_partenaire", filtreP);
      if (dateD)   q.set("date_debut", dateD);
      if (dateF)   q.set("date_fin", dateF);
      const d = await api(`/finances/paiements?${q}`);
      setItems(d.items || []); setTotal(d.total || 0);
    } finally { setLoading(false); }
  }, [page, filtreP, dateD, dateF]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / PER);
  const totalMontant = items.reduce((s, x) => s + x.montant, 0);

  return (
    <div className="af2-tab-content">
      <div className="af2-toolbar af2-toolbar-wrap">
        <input type="date" className="af2-input-date" value={dateD} onChange={e => { setDateD(e.target.value); setPage(1); }} />
        <span className="af2-date-sep">→</span>
        <input type="date" className="af2-input-date" value={dateF} onChange={e => { setDateF(e.target.value); setPage(1); }} />
        {(dateD || dateF) && (
          <button className="af2-btn-clear" onClick={() => { setDateD(""); setDateF(""); setPage(1); }}>✕ Effacer</button>
        )}
      </div>

      {items.length > 0 && (
        <div className="af2-histo-summary">
          Total période : <b>{fmt(totalMontant)} DT</b> — {total} paiement(s)
        </div>
      )}

      {loading ? <Spinner /> : (
        <div className="af2-table-card">
          <table className="af2-table">
            <thead><tr>
              <th>#</th><th>Partenaire</th><th>Montant payé</th><th>Note</th><th>Date</th>
            </tr></thead>
            <tbody>
              {items.map(p => (
                <tr key={p.id} className="af2-tr">
                  <td><span className="af2-resa-id">#{p.id}</span></td>
                  <td><b>{p.partenaire_prenom} {p.partenaire_nom}</b></td>
                  <td><span className="af2-amount-paid">{fmt(p.montant)} DT</span></td>
                  <td>{p.note || <span className="af2-muted">—</span>}</td>
                  <td>{fmtD(p.created_at)}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={5} className="af2-empty-row">Aucun paiement</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="af2-pagination">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Préc.</button>
          <span>Page {page} / {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Suiv. →</button>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  ONGLET 5 — CLIENTS & VISITEURS
// ════════════════════════════════════════════════════════════

function OngletClients() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [critere, setCritere] = useState("depenses");
  const [limit,   setLimit]   = useState(50);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api(`/finances/classement-clients?critere=${critere}&limit=${limit}`);
      setItems(d.items || []);
    } finally { setLoading(false); }
  }, [critere, limit]);

  useEffect(() => { load(); }, [load]);

  const maxVal = Math.max(...items.map(x => {
    return critere === "depenses" ? x.total_depenses
         : critere === "commissions" ? x.commissions_generees
         : critere === "nb_hotel" ? x.nb_hotel
         : critere === "nb_voyage" ? x.nb_voyage
         : x.nb_reservations;
  }), 1);

  const getVal = (x) => {
    if (critere === "depenses")    return { display: `${fmt(x.total_depenses)} DT`,    raw: x.total_depenses };
    if (critere === "commissions") return { display: `${fmt(x.commissions_generees)} DT`, raw: x.commissions_generees };
    if (critere === "nb_hotel")    return { display: x.nb_hotel,    raw: x.nb_hotel };
    if (critere === "nb_voyage")   return { display: x.nb_voyage,   raw: x.nb_voyage };
    return { display: x.nb_reservations, raw: x.nb_reservations };
  };

  return (
    <div className="af2-tab-content">
      <div className="af2-toolbar">
        <select className="af2-select" value={critere} onChange={e => setCritere(e.target.value)}>
          <option value="depenses">Dépenses totales</option>
          <option value="commissions">Commissions générées</option>
          <option value="nb_hotel">Réservations hôtel</option>
          <option value="nb_voyage">Réservations voyage</option>
          <option value="nb_reservations">Total réservations</option>
        </select>
        <select className="af2-select" value={limit} onChange={e => setLimit(+e.target.value)}>
          <option value={20}>Top 20</option>
          <option value={50}>Top 50</option>
          <option value={100}>Top 100</option>
        </select>
      </div>

      {loading ? <Spinner /> : (
        <div className="af2-clients-list">
          {items.map((x, i) => {
            const v = getVal(x);
            const pct = (v.raw / maxVal) * 100;
            return (
              <div key={i} className="af2-client-row">
                <div className="af2-client-rank">{i + 1}</div>
                <div className={`af2-client-badge ${x.type_source === "client" ? "badge-client" : "badge-visiteur"}`}>
                  {x.type_source === "client" ? "Client" : "Visiteur"}
                </div>
                <div className="af2-client-info">
                  <b>{x.nom}</b>
                  <small>{x.email}</small>
                </div>
                <div className="af2-client-bar-wrap">
                  <div className="af2-client-bar" style={{ width: `${pct}%` }} />
                </div>
                <div className="af2-client-val">{v.display}</div>
                <div className="af2-client-meta">
                  🏨 {x.nb_hotel} &nbsp; ✈️ {x.nb_voyage}
                </div>
              </div>
            );
          })}
          {items.length === 0 && <div className="af2-empty-full">Aucune donnée</div>}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  PAGE PRINCIPALE
// ════════════════════════════════════════════════════════════

const TABS = [
  { id: "revenus",      label: "📈 Revenus"        },
  { id: "partenaires",  label: "🤝 Partenaires"     },
  { id: "soldes",       label: "⏳ Soldes à payer"  },
  { id: "historique",   label: "📜 Historique"      },
  { id: "clients",      label: "👥 Clients & Visiteurs" },
];

export default function AdminFinances() {
  const [tab,     setTab]     = useState("revenus");
  const [dash,    setDash]    = useState(null);
  const [dashErr, setDashErr] = useState(false);

  useEffect(() => {
    api("/finances/dashboard").then(setDash).catch(() => setDashErr(true));
  }, []);

  return (
    <div className="af2-page">
      <div className="af2-header">
        <div>
          <h1 className="af2-title">Gestion Financière</h1>
          <p className="af2-subtitle">Revenus · Commissions · Partenaires · Facturation</p>
        </div>
        {dash && (
          <div className="af2-header-kpis">
            <div className="af2-header-kpi">
              <span className="af2-hkpi-icon">💰</span>
              <div><b>{fmt(dash.revenu_total_annee)} DT</b><small>Revenu année</small></div>
            </div>
            <div className="af2-header-kpi af2-hkpi-warn">
              <span className="af2-hkpi-icon">⏳</span>
              <div><b>{fmt(dash.total_du_partenaires)} DT</b><small>À payer</small></div>
            </div>
          </div>
        )}
      </div>

      {/* Onglets */}
      <div className="af2-tabs">
        {TABS.map(t => (
          <button key={t.id} className={`af2-tab${tab === t.id ? " on" : ""}`}
            onClick={() => setTab(t.id)}>
            {t.label}
            {t.id === "soldes" && dash?.nb_partenaires_en_attente > 0 && (
              <span className="af2-tab-badge">{dash.nb_partenaires_en_attente}</span>
            )}
          </button>
        ))}
      </div>

      {/* Contenu */}
      {tab === "revenus"     && <OngletRevenus dash={dash} />}
      {tab === "partenaires" && <OngletPartenaires />}
      {tab === "soldes"      && <OngletSoldes />}
      {tab === "historique"  && <OngletHistorique />}
      {tab === "clients"     && <OngletClients />}
    </div>
  );
}