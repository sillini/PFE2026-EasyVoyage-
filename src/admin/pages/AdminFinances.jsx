import { useState, useEffect, useCallback } from "react";
import "./AdminFinances.css";

const BASE = "http://localhost:8000/api/v1";
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("access_token")}`,
});

const fmt = (n) =>
  new Intl.NumberFormat("fr-TN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);

const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
};

// ═══════════════════════════════════════════════════════════
//  MINI CHART — Barres inline SVG
// ═══════════════════════════════════════════════════════════
function MiniBarChart({ data, colorHotel = "#1A3F63", colorVoyage = "#C4973A" }) {
  if (!data?.length) return null;
  const maxVal = Math.max(...data.map((d) => d.revenu_total), 1);
  const W = 600, H = 140, barW = Math.max(4, Math.floor((W - 40) / data.length) - 4);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="af-chart-svg" preserveAspectRatio="none">
      {data.map((d, i) => {
        const x = 20 + i * ((W - 40) / data.length);
        const totalH = (d.revenu_total / maxVal) * (H - 30);
        const hotelH = (d.revenu_hotel / maxVal) * (H - 30);
        const voyH   = totalH - hotelH;
        const y = H - 20 - totalH;
        return (
          <g key={i}>
            <rect x={x} y={H - 20 - hotelH} width={barW} height={hotelH} fill={colorHotel} rx="2" opacity="0.85" />
            {voyH > 0 && (
              <rect x={x} y={y} width={barW} height={voyH} fill={colorVoyage} rx="2" opacity="0.85" />
            )}
            <text x={x + barW / 2} y={H - 4} textAnchor="middle" fontSize="9" fill="#8A9BB0">
              {d.periode}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════
//  ONGLET 1 — REVENUS
// ═══════════════════════════════════════════════════════════
function OngletRevenus() {
  const [data,    setData]    = useState(null);
  const [periode, setPeriode] = useState("mois");
  const [annee,   setAnnee]   = useState(new Date().getFullYear());
  const [mois,    setMois]    = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ periode, annee });
      if (periode === "jour") q.set("mois", mois);
      const res = await fetch(`${BASE}/finances/revenus?${q}`, { headers: authHeaders() });
      const d   = await res.json();
      setData(d);
    } catch { setData(null); }
    finally { setLoading(false); }
  }, [periode, annee, mois]);

  useEffect(() => { load(); }, [load]);

  const annees = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 4 + i);
  const moisNoms = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];

  return (
    <div className="af-tab-content">
      {/* Filtres */}
      <div className="af-toolbar">
        <div className="af-period-tabs">
          {[["jour","Quotidien"],["mois","Mensuel"],["annee","Annuel"]].map(([v,l]) => (
            <button key={v} className={`af-period-tab ${periode===v?"on":""}`}
              onClick={() => setPeriode(v)}>{l}</button>
          ))}
        </div>
        <div className="af-filters-row">
          <select className="af-select" value={annee} onChange={e => setAnnee(+e.target.value)}>
            {annees.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          {periode === "jour" && (
            <select className="af-select" value={mois} onChange={e => setMois(+e.target.value)}>
              {moisNoms.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
            </select>
          )}
        </div>
      </div>

      {loading ? (
        <div className="af-loading"><span className="af-spin" />Chargement…</div>
      ) : data ? (
        <>
          {/* KPIs revenus */}
          <div className="af-kpis-grid">
            {[
              { icon:"💰", label:"Revenu total", val:`${fmt(data.revenu_total)} DT`, color:"#1A3F63" },
              { icon:"🏨", label:"Hôtels", val:`${fmt(data.revenu_hotel)} DT`, color:"#2B5F8E" },
              { icon:"✈️", label:"Voyages", val:`${fmt(data.revenu_voyage)} DT`, color:"#C4973A" },
              { icon:"⚡", label:"Commission agence (10%)", val:`${fmt(data.commission_total)} DT`, color:"#27AE60" },
              { icon:"📋", label:"Réservations", val:data.nb_reservations, color:"#8A9BB0" },
            ].map((k, i) => (
              <div key={i} className="af-kpi" style={{ "--acc": k.color }}>
                <span>{k.icon}</span>
                <div>
                  <strong>{k.val}</strong>
                  <label>{k.label}</label>
                </div>
              </div>
            ))}
          </div>

          {/* Graphique */}
          <div className="af-chart-card">
            <div className="af-chart-header">
              <h3>Évolution des revenus</h3>
              <div className="af-legend">
                <span className="af-legend-dot" style={{background:"#1A3F63"}}/>Hôtels
                <span className="af-legend-dot" style={{background:"#C4973A"}}/>Voyages
              </div>
            </div>
            <MiniBarChart data={data.evolution} />
          </div>

          {/* Tableau détail */}
          <div className="af-table-card">
            <table className="af-table">
              <thead>
                <tr>
                  <th>Période</th><th>Hôtels</th><th>Voyages</th>
                  <th>Total</th><th>Commission (10%)</th><th>Réservations</th>
                </tr>
              </thead>
              <tbody>
                {data.evolution.map((row, i) => (
                  <tr key={i} className={row.revenu_total > 0 ? "af-tr" : "af-tr af-tr-zero"}>
                    <td><strong>{row.periode}</strong></td>
                    <td>{fmt(row.revenu_hotel)} DT</td>
                    <td>{fmt(row.revenu_voyage)} DT</td>
                    <td><strong>{fmt(row.revenu_total)} DT</strong></td>
                    <td className="af-td-commission">{fmt(row.commission_total)} DT</td>
                    <td>{row.nb_reservations}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="af-empty">⚠️ Impossible de charger les données</div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  ONGLET 2 — COMMISSIONS PARTENAIRES
// ═══════════════════════════════════════════════════════════
function ModalPayer({ partenaire, onClose, onPaid }) {
  const [note,    setNote]    = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const handlePay = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${BASE}/finances/payer/${partenaire.id_partenaire}`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ note }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || "Erreur");
      }
      onPaid();
      onClose();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="af-modal-overlay" onClick={onClose}>
      <div className="af-modal" onClick={e => e.stopPropagation()}>
        <div className="af-modal-header">
          <h3>💸 Paiement partenaire</h3>
          <button className="af-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="af-modal-body">
          <div className="af-modal-info">
            <div className="af-modal-partner">
              <strong>{partenaire.partenaire_prenom} {partenaire.partenaire_nom}</strong>
              <span>{partenaire.nom_entreprise}</span>
            </div>
            <div className="af-modal-amount">
              <span>Montant à payer</span>
              <strong>{fmt(partenaire.solde_du)} DT</strong>
            </div>
          </div>
          <div className="af-modal-warning">
            ⚠️ Cette action marquera <strong>{partenaire.nb_commissions} commission(s)</strong> comme payées et remettra le solde à <strong>0 DT</strong>.
          </div>
          <textarea
            className="af-modal-textarea"
            placeholder="Note optionnelle (virement, chèque, date...)"
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={3}
          />
          {error && <div className="af-modal-error">⚠️ {error}</div>}
        </div>
        <div className="af-modal-footer">
          <button className="af-btn-cancel" onClick={onClose}>Annuler</button>
          <button className="af-btn-pay" onClick={handlePay} disabled={loading}>
            {loading ? <span className="af-spin" /> : `✓ Confirmer le paiement de ${fmt(partenaire.solde_du)} DT`}
          </button>
        </div>
      </div>
    </div>
  );
}

function OngletCommissions() {
  const [soldes,   setSoldes]   = useState([]);
  const [commissions, setComm]  = useState([]);
  const [histo,    setHisto]    = useState([]);
  const [tab,      setTab]      = useState("soldes");  // soldes | commissions | histo
  const [statut,   setStatut]   = useState("");
  const [page,     setPage]     = useState(1);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [paying,   setPaying]   = useState(null);   // partenaire à payer

  const loadSoldes = useCallback(async () => {
    const res = await fetch(`${BASE}/finances/soldes-partenaires`, { headers: authHeaders() });
    const d   = await res.json();
    setSoldes(d.items || []);
  }, []);

  const loadCommissions = useCallback(async () => {
    const q = new URLSearchParams({ page, per_page: 20 });
    if (statut) q.set("statut", statut);
    const res = await fetch(`${BASE}/finances/commissions?${q}`, { headers: authHeaders() });
    const d   = await res.json();
    setComm(d.items || []); setTotal(d.total || 0);
  }, [page, statut]);

  const loadHisto = useCallback(async () => {
    const q = new URLSearchParams({ page, per_page: 20 });
    const res = await fetch(`${BASE}/finances/paiements?${q}`, { headers: authHeaders() });
    const d   = await res.json();
    setHisto(d.items || []); setTotal(d.total || 0);
  }, [page]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === "soldes")       await loadSoldes();
      else if (tab === "commissions") await loadCommissions();
      else await loadHisto();
    } finally { setLoading(false); }
  }, [tab, loadSoldes, loadCommissions, loadHisto]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [tab, statut]);

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="af-tab-content">
      {paying && (
        <ModalPayer
          partenaire={paying}
          onClose={() => setPaying(null)}
          onPaid={() => { setSoldes([]); load(); }}
        />
      )}

      {/* Sous-tabs */}
      <div className="af-subtabs">
        {[["soldes","💼 Soldes à payer"],["commissions","📊 Toutes les commissions"],["histo","📜 Historique paiements"]].map(([v,l]) => (
          <button key={v} className={`af-subtab ${tab===v?"on":""}`} onClick={() => setTab(v)}>{l}</button>
        ))}
      </div>

      {loading ? (
        <div className="af-loading"><span className="af-spin" />Chargement…</div>
      ) : tab === "soldes" ? (
        /* SOLDES */
        soldes.length === 0 ? (
          <div className="af-empty">✅ Aucun solde en attente — tous les partenaires sont à jour !</div>
        ) : (
          <div className="af-table-card">
            <table className="af-table">
              <thead>
                <tr><th>Partenaire</th><th>Entreprise</th><th>Commissions en attente</th><th>Montant dû</th><th>Action</th></tr>
              </thead>
              <tbody>
                {soldes.map((s) => (
                  <tr key={s.id_partenaire} className="af-tr">
                    <td>
                      <div className="af-person">
                        <div className="af-avatar">{s.partenaire_prenom[0]}{s.partenaire_nom[0]}</div>
                        <div>
                          <b>{s.partenaire_prenom} {s.partenaire_nom}</b>
                          <s>{s.partenaire_email}</s>
                        </div>
                      </div>
                    </td>
                    <td>{s.nom_entreprise}</td>
                    <td><span className="af-badge">{s.nb_commissions}</span></td>
                    <td><span className="af-amount-due">{fmt(s.solde_du)} DT</span></td>
                    <td>
                      <button className="af-btn-pay-sm" onClick={() => setPaying(s)}>
                        💸 Payer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : tab === "commissions" ? (
        /* COMMISSIONS */
        <div className="af-table-card">
          <div className="af-table-toolbar">
            <select className="af-select" value={statut} onChange={e => setStatut(e.target.value)}>
              <option value="">Tous les statuts</option>
              <option value="EN_ATTENTE">En attente</option>
              <option value="PAYEE">Payée</option>
            </select>
          </div>
          <table className="af-table">
            <thead>
              <tr><th>#Resa</th><th>Partenaire</th><th>Type</th><th>Total résa</th><th>Commission (10%)</th><th>Part partenaire</th><th>Statut</th><th>Date</th></tr>
            </thead>
            <tbody>
              {commissions.map((c) => (
                <tr key={c.id} className="af-tr">
                  <td><span className="af-resa-id">#{c.id_reservation}</span></td>
                  <td>
                    <div className="af-person-sm">
                      <b>{c.partenaire_prenom} {c.partenaire_nom}</b>
                    </div>
                  </td>
                  <td><span className={`af-type-chip ${c.type_resa}`}>{c.type_resa === "hotel" ? "🏨 Hôtel" : "✈️ Voyage"}</span></td>
                  <td>{fmt(c.montant_total_resa)} DT</td>
                  <td className="af-td-commission">{fmt(c.montant_commission)} DT</td>
                  <td><strong>{fmt(c.montant_partenaire)} DT</strong></td>
                  <td><span className={`af-statut-pill ${c.statut === "PAYEE" ? "payee" : "attente"}`}>{c.statut === "PAYEE" ? "✓ Payée" : "⏳ En attente"}</span></td>
                  <td className="af-date">{fmtDate(c.date_creation)}</td>
                </tr>
              ))}
              {commissions.length === 0 && (
                <tr><td colSpan={8} style={{textAlign:"center",padding:"30px",color:"#8A9BB0"}}>Aucune commission</td></tr>
              )}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="af-pagination">
              <button disabled={page===1} onClick={() => setPage(p=>p-1)}>← Préc.</button>
              <span>Page {page} / {totalPages}</span>
              <button disabled={page===totalPages} onClick={() => setPage(p=>p+1)}>Suiv. →</button>
            </div>
          )}
        </div>
      ) : (
        /* HISTORIQUE PAIEMENTS */
        <div className="af-table-card">
          <table className="af-table">
            <thead>
              <tr><th>Partenaire</th><th>Montant payé</th><th>Note</th><th>Date</th></tr>
            </thead>
            <tbody>
              {histo.map((h) => (
                <tr key={h.id} className="af-tr">
                  <td>
                    <div className="af-person-sm">
                      <b>{h.partenaire_prenom} {h.partenaire_nom}</b>
                    </div>
                  </td>
                  <td><span className="af-amount-paid">{fmt(h.montant)} DT</span></td>
                  <td>{h.note || <span style={{color:"#B0C4D8"}}>—</span>}</td>
                  <td className="af-date">{fmtDate(h.created_at)}</td>
                </tr>
              ))}
              {histo.length === 0 && (
                <tr><td colSpan={4} style={{textAlign:"center",padding:"30px",color:"#8A9BB0"}}>Aucun paiement enregistré</td></tr>
              )}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="af-pagination">
              <button disabled={page===1} onClick={() => setPage(p=>p-1)}>← Préc.</button>
              <span>Page {page} / {totalPages}</span>
              <button disabled={page===totalPages} onClick={() => setPage(p=>p+1)}>Suiv. →</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  ONGLET 3 — CLIENTS RENTABLES
// ═══════════════════════════════════════════════════════════
function OngletClients() {
  const [clients,  setClients]  = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${BASE}/finances/clients-rentables?limit=50`, { headers: authHeaders() });
        const d   = await res.json();
        setClients(d.items || []);
      } catch { setClients([]); }
      finally { setLoading(false); }
    })();
  }, []);

  const max = clients[0]?.total_depenses || 1;

  return (
    <div className="af-tab-content">
      {loading ? (
        <div className="af-loading"><span className="af-spin" />Chargement…</div>
      ) : (
        <div className="af-table-card">
          <div className="af-table-card-header">
            <h3>🏆 Classement clients par dépenses</h3>
            <span>{clients.length} clients analysés</span>
          </div>
          <table className="af-table">
            <thead>
              <tr><th>#</th><th>Client</th><th>Réservations</th><th>Total dépensé</th><th>Poids</th><th>Dernière résa</th></tr>
            </thead>
            <tbody>
              {clients.map((c, i) => (
                <tr key={c.id_client} className="af-tr">
                  <td>
                    <span className={`af-rank ${i<3?"top":""}`}>
                      {i===0?"🥇":i===1?"🥈":i===2?"🥉":`#${i+1}`}
                    </span>
                  </td>
                  <td>
                    <div className="af-person">
                      <div className="af-avatar" style={{background: i===0?"linear-gradient(135deg,#C4973A,#E6B84A)":i===1?"linear-gradient(135deg,#8A9BB0,#B0BEC8)":i===2?"linear-gradient(135deg,#C87941,#D4935B)":"linear-gradient(135deg,#1A3F63,#2B5F8E)"}}>
                        {c.prenom[0]}{c.nom[0]}
                      </div>
                      <div>
                        <b>{c.prenom} {c.nom}</b>
                        <s>{c.email}</s>
                      </div>
                    </div>
                  </td>
                  <td><span className="af-badge">{c.nb_reservations}</span></td>
                  <td><span className="af-amount-total">{fmt(c.total_depenses)} DT</span></td>
                  <td style={{width:"180px"}}>
                    <div className="af-progress-bar">
                      <div className="af-progress-fill" style={{width:`${(c.total_depenses/max)*100}%`}} />
                    </div>
                  </td>
                  <td className="af-date">{fmtDate(c.derniere_resa)}</td>
                </tr>
              ))}
              {clients.length === 0 && (
                <tr><td colSpan={6} style={{textAlign:"center",padding:"30px",color:"#8A9BB0"}}>Aucun client avec des réservations</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  ONGLET 4 — FACTURATION
// ═══════════════════════════════════════════════════════════
function OngletFacturation() {
  const [factures, setFactures] = useState([]);
  const [statut,   setStatut]   = useState("");
  const [page,     setPage]     = useState(1);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [dlLoading, setDlLoad]  = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ page, per_page: 20 });
      if (statut) q.set("statut", statut);
      const res = await fetch(`${BASE}/factures?${q}`, { headers: authHeaders() });
      const d   = await res.json();
      setFactures(d.items || []); setTotal(d.total || 0);
    } catch { setFactures([]); }
    finally { setLoading(false); }
  }, [page, statut]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [statut]);

  const downloadPdf = async (f) => {
    setDlLoad(f.id);
    try {
      const res = await fetch(`${BASE}/factures/${f.id}/pdf`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Erreur PDF");
      const blob = await res.blob();
      const a    = document.createElement("a");
      a.href     = URL.createObjectURL(blob);
      a.download = `facture_${f.numero}.pdf`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) { alert("Erreur : " + e.message); }
    finally { setDlLoad(null); }
  };

  const statutColor = { EMISE: "#2B5F8E", PAYEE: "#27AE60", ANNULEE: "#E74C3C", EN_RETARD: "#E67E22" };
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="af-tab-content">
      <div className="af-toolbar">
        <select className="af-select" value={statut} onChange={e => setStatut(e.target.value)}>
          <option value="">Tous les statuts</option>
          <option value="EMISE">Émise</option>
          <option value="PAYEE">Payée</option>
          <option value="ANNULEE">Annulée</option>
          <option value="EN_RETARD">En retard</option>
        </select>
        <span className="af-total-count">{total} facture(s)</span>
      </div>

      {loading ? (
        <div className="af-loading"><span className="af-spin" />Chargement…</div>
      ) : (
        <div className="af-table-card">
          <table className="af-table">
            <thead>
              <tr><th>N° Facture</th><th>Date</th><th>Montant TTC</th><th>Statut</th><th>PDF</th></tr>
            </thead>
            <tbody>
              {factures.map((f) => (
                <tr key={f.id} className="af-tr">
                  <td><strong>{f.numero}</strong></td>
                  <td className="af-date">{fmtDate(f.date_emission)}</td>
                  <td><strong>{fmt(f.total_ttc)} DT</strong></td>
                  <td>
                    <span className="af-statut-pill" style={{background:`${statutColor[f.statut]}18`,color:statutColor[f.statut],border:`1px solid ${statutColor[f.statut]}40`}}>
                      {f.statut}
                    </span>
                  </td>
                  <td>
                    <button className="af-btn-pdf" onClick={() => downloadPdf(f)} disabled={dlLoading === f.id}>
                      {dlLoading === f.id ? <span className="af-spin" /> : "⬇ PDF"}
                    </button>
                  </td>
                </tr>
              ))}
              {factures.length === 0 && (
                <tr><td colSpan={5} style={{textAlign:"center",padding:"30px",color:"#8A9BB0"}}>Aucune facture</td></tr>
              )}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="af-pagination">
              <button disabled={page===1} onClick={() => setPage(p=>p-1)}>← Préc.</button>
              <span>Page {page} / {totalPages}</span>
              <button disabled={page===totalPages} onClick={() => setPage(p=>p+1)}>Suiv. →</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  PAGE PRINCIPALE
// ═══════════════════════════════════════════════════════════
export default function AdminFinances() {
  const [tab,     setTab]     = useState("revenus");
  const [dash,    setDash]    = useState(null);

  useEffect(() => {
    fetch(`${BASE}/finances/dashboard`, { headers: authHeaders() })
      .then(r => r.json()).then(setDash).catch(() => {});
  }, []);

  const TABS = [
    { id:"revenus",      icon:"📈", label:"Revenus" },
    { id:"commissions",  icon:"🤝", label:"Commissions" },
    { id:"clients",      icon:"👑", label:"Clients" },
    { id:"facturation",  icon:"📄", label:"Facturation" },
  ];

  return (
    <div className="af-root">
      {/* Header */}
      <div className="af-top">
        <div>
          <h1>Gestion Financière</h1>
          <p>Revenus, commissions partenaires, analyse clients & facturation</p>
        </div>
      </div>

      {/* Dashboard KPIs globaux */}
      {dash && (
        <div className="af-dash-kpis">
          {[
            { icon:"💰", label:"Revenu mois", val:`${fmt(dash.revenu_total_mois)} DT`, sub:`${dash.nb_reservations_mois} résa`, color:"#1A3F63" },
            { icon:"📅", label:"Revenu année", val:`${fmt(dash.revenu_total_annee)} DT`, sub:`${dash.nb_reservations_annee} résa`, color:"#2B5F8E" },
            { icon:"⚡", label:"Commission mois", val:`${fmt(dash.commission_mois)} DT`, sub:"Part agence (10%)", color:"#27AE60" },
            { icon:"🏨", label:"Revenus Hôtels", val:`${fmt(dash.revenu_hotel_annee)} DT`, sub:"Année courante", color:"#C4973A" },
            { icon:"✈️", label:"Revenus Voyages", val:`${fmt(dash.revenu_voyage_annee)} DT`, sub:"Année courante", color:"#8A4A2B" },
            { icon:"💸", label:"Dû aux partenaires", val:`${fmt(dash.total_du_partenaires)} DT`, sub:`${dash.nb_partenaires_en_attente} partenaire(s)`, color:"#E74C3C" },
          ].map((k, i) => (
            <div key={i} className="af-kpi" style={{ "--acc": k.color }}>
              <span className="af-kpi-icon">{k.icon}</span>
              <div>
                <strong>{k.val}</strong>
                <label>{k.label}</label>
                <small>{k.sub}</small>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs navigation */}
      <div className="af-tabs-bar">
        {TABS.map((t) => (
          <button key={t.id} className={`af-tab ${tab===t.id?"active":""}`} onClick={() => setTab(t.id)}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* Contenu onglet actif */}
      {tab === "revenus"     && <OngletRevenus />}
      {tab === "commissions" && <OngletCommissions />}
      {tab === "clients"     && <OngletClients />}
      {tab === "facturation" && <OngletFacturation />}
    </div>
  );
}