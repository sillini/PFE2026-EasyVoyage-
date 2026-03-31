/**
 * src/partenaire/components/finances/TabVueGlobale.jsx
 * ======================================================
 * Onglet "Vue globale" : graphique revenus 12 mois + donut par hôtel.
 */
import { useState, useEffect } from "react";
import { fetchPartRevenus, fetchPartHotels } from "../../services/financesPartenaireApi.js";

const fmt = (n) =>
  new Intl.NumberFormat("fr-TN", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n ?? 0);

// ── Mini Bar Chart ─────────────────────────────────────────────
function BarChart({ data }) {
  const max = Math.max(...data.map((d) => d.revenu), 1);
  const now = new Date();
  const moisCourant = now.getMonth(); // 0-indexed

  return (
    <div className="pf-chart-container">
      <div className="pf-chart-bars">
        {data.map((d, i) => {
          const h = Math.max(4, Math.round((d.revenu / max) * 120));
          const isCurrent = i === moisCourant;
          return (
            <div key={d.mois} className="pf-bar-col" title={`${d.mois} : ${fmt(d.revenu)} DT (${d.nb_resas} rés.)`}>
              <div
                className={`pf-bar${isCurrent ? " pf-bar--current" : ""}`}
                style={{ height: h }}
              />
              <span className="pf-bar-lbl">{d.mois}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Donut SVG ──────────────────────────────────────────────────
function DonutHotels({ hotels }) {
  if (!hotels || hotels.length === 0) return null;

  const total = hotels.reduce((s, h) => s + (h.revenu_total || 0), 0);
  if (total === 0) return <p style={{ color: "#7A8FA6", textAlign: "center", padding: "20px" }}>Aucun revenu</p>;

  const COLORS = ["#1A3F63", "#2B5F8E", "#0F6E56", "#C4973A", "#6B21A8", "#BE123C"];
  const cx = 70, cy = 70, r = 55, stroke = 18;
  const circ = 2 * Math.PI * r;

  let cumul = 0;
  const arcs = hotels.slice(0, 6).map((h, i) => {
    const pct   = h.revenu_total / total;
    const arc   = { offset: circ * (1 - cumul), dash: circ * pct, color: COLORS[i % COLORS.length], nom: h.hotel_nom };
    cumul += pct;
    return arc;
  });

  return (
    <div className="pf-donut-wrap">
      <svg width="140" height="140" viewBox="0 0 140 140">
        {arcs.map((a, i) => (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={a.color}
            strokeWidth={stroke}
            strokeDasharray={`${a.dash} ${circ - a.dash}`}
            strokeDashoffset={a.offset}
            transform="rotate(-90 70 70)"
          />
        ))}
        <text x={cx} y={cy - 6}  textAnchor="middle" fontSize="18" fontWeight="800" fill="#1A3F63">
          {hotels.length}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="10" fill="#7A8FA6">
          hôtels
        </text>
      </svg>
      <div className="pf-donut-legend">
        {arcs.map((a, i) => (
          <div key={i} className="pf-donut-legend-item">
            <span className="pf-donut-dot" style={{ background: a.color }} />
            <span style={{ maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {a.nom}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Composant principal ────────────────────────────────────────
export default function TabVueGlobale({ dash, loadingDash }) {
  const annee = new Date().getFullYear();
  const [revenus, setRevenus] = useState(null);
  const [hotels,  setHotels]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchPartRevenus(annee), fetchPartHotels()])
      .then(([rv, ht]) => {
        setRevenus(rv);
        setHotels(ht.items || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="pf-spinner"><div className="pf-spin" /></div>;
  }

  const moisData = revenus?.mois_liste || [];

  return (
    <div>
      <div className="pf-grid-2">

        {/* Graphique revenus */}
        <div className="pf-card">
          <div className="pf-card-header">
            <h3 className="pf-card-title">Revenus mensuels {annee} (DT)</h3>
            <span style={{ fontSize: 12, color: "#7A8FA6" }}>clients + visiteurs</span>
          </div>
          {moisData.length > 0
            ? <BarChart data={moisData} />
            : <div className="pf-empty">Aucune donnée disponible</div>
          }
        </div>

        {/* Donut par hôtel */}
        <div className="pf-card">
          <div className="pf-card-header">
            <h3 className="pf-card-title">Répartition par hôtel</h3>
            <span style={{ fontSize: 12, color: "#7A8FA6" }}>revenus totaux</span>
          </div>
          {hotels.length > 0
            ? <DonutHotels hotels={hotels} />
            : <div className="pf-empty">Aucun hôtel actif</div>
          }
        </div>

      </div>

      {/* Tableau synthèse hôtels */}
      <div className="pf-card">
        <div className="pf-card-header">
          <h3 className="pf-card-title">Résumé par hôtel</h3>
        </div>
        <div className="pf-table-wrap">
          <table className="pf-table">
            <thead>
              <tr>
                <th>Hôtel</th>
                <th>Ville</th>
                <th style={{ textAlign: "right" }}>Rés. ce mois</th>
                <th style={{ textAlign: "right" }}>Revenu ce mois</th>
                <th style={{ textAlign: "right" }}>Revenu total</th>
                <th style={{ textAlign: "right" }}>Solde restant</th>
              </tr>
            </thead>
            <tbody>
              {hotels.length === 0 ? (
                <tr>
                  <td colSpan={6} className="pf-empty">Aucun hôtel</td>
                </tr>
              ) : (
                hotels.map((h) => (
                  <tr key={h.id_hotel}>
                    <td>
                      <div style={{ fontWeight: 700, color: "#1A3F63" }}>{h.hotel_nom}</div>
                      <div style={{ fontSize: 11, color: "#7A8FA6" }}>
                        {h.hotel_actif
                          ? <span className="pf-pill pf-pill--paid">Actif</span>
                          : <span className="pf-pill pf-pill--cancel">Inactif</span>
                        }
                      </div>
                    </td>
                    <td style={{ color: "#7A8FA6" }}>{h.hotel_ville}</td>
                    <td style={{ textAlign: "right" }}>{h.nb_resas_mois}</td>
                    <td style={{ textAlign: "right" }} className="pf-amt">{fmt(h.revenu_mois)} DT</td>
                    <td style={{ textAlign: "right" }} className="pf-amt">{fmt(h.revenu_total)} DT</td>
                    <td style={{ textAlign: "right" }} className="pf-amt-part">{fmt(h.solde_restant)} DT</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}