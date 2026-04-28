/**
 * src/admin/components/dashboard/EvolutionChart.jsx
 * ===================================================
 * Graphique en barres empilées des revenus sur 12 mois.
 *
 *   Bleu (Sky #1A3F63) = Hôtels (clients + visiteurs)
 *   Or  (Gold #C4973A) = Voyages
 *
 * ✅ Le backend retourne déjà periode au format "Jan", "Fév", "Mar"...
 *    → on l'affiche tel quel (avant on essayait de splitter sur "-" → bug).
 *
 * @prop {object|null} data    — réponse /finances/revenus { evolution: [...] }
 * @prop {boolean}     loading
 */
import { fmt } from "../../services/formatters.js";
import { useState } from "react";

const HEIGHT  = 180;
const COL_W   = 44;
const PAD_TOP = 10;

export default function EvolutionChart({ data, loading }) {
  const [hover, setHover] = useState(null);

  if (loading && !data) {
    return (
      <div className="ad-chart-card">
        <ChartHeader />
        <div className="ad-chart-skeleton">
          <div className="ad-skeleton-line" style={{ width: "100%", height: 200 }} />
        </div>
      </div>
    );
  }

  const evolution = data?.evolution || [];

  // ✅ Détection : si TOUS les mois sont à 0, on affiche un empty state
  const totalGlobal = evolution.reduce(
    (s, d) => s + (d.revenu_hotel || 0) + (d.revenu_voyage || 0),
    0
  );

  if (!evolution.length || totalGlobal === 0) {
    return (
      <div className="ad-chart-card">
        <ChartHeader />
        <div className="ad-chart-empty">
          <div className="ad-empty-icon">📊</div>
          <p>Aucune donnée pour cette année</p>
          <small>Sélectionnez une autre année pour voir les revenus</small>
        </div>
      </div>
    );
  }

  // On garde tous les mois (l'API retourne déjà 12 max)
  const items = evolution.slice(-12);
  const max   = Math.max(...items.map((d) => (d.revenu_hotel || 0) + (d.revenu_voyage || 0)), 1);

  const svgW = items.length * COL_W + 20;
  const svgH = HEIGHT + 40;

  return (
    <div className="ad-chart-card">
      <ChartHeader />

      <div className="ad-chart-body">
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          className="ad-chart-svg"
          role="img"
          aria-label="Évolution mensuelle des revenus, hôtels et voyages"
        >
          {/* Lignes de grille horizontales */}
          {[0.25, 0.5, 0.75].map((p) => {
            const y = PAD_TOP + HEIGHT * (1 - p);
            return (
              <line
                key={p}
                x1="10"
                x2={svgW - 10}
                y1={y}
                y2={y}
                stroke="#E4EAF3"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
            );
          })}

          {/* Barres empilées */}
          {items.map((d, i) => {
            const total   = (d.revenu_hotel || 0) + (d.revenu_voyage || 0);
            const totalH  = (total / max) * HEIGHT;
            const hotelH  = ((d.revenu_hotel  || 0) / max) * HEIGHT;
            const voyageH = ((d.revenu_voyage || 0) / max) * HEIGHT;

            const x = i * COL_W + 14;
            const barW = COL_W - 14;
            const baseY = PAD_TOP + HEIGHT;

            const isHover = hover === i;
            const isEmpty = total === 0;

            return (
              <g
                key={i}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                style={{ cursor: "pointer" }}
              >
                {/* Hover overlay */}
                {isHover && (
                  <rect
                    x={x - 2}
                    y={PAD_TOP}
                    width={barW + 4}
                    height={HEIGHT}
                    fill="#1A3F63"
                    opacity={0.04}
                    rx="2"
                  />
                )}
                {/* Marqueur "vide" — petit point gris si 0 */}
                {isEmpty && (
                  <circle
                    cx={x + barW / 2}
                    cy={baseY - 2}
                    r="2"
                    fill="#D0DAE8"
                  />
                )}
                {/* Voyages (au-dessus) */}
                {voyageH > 0 && (
                  <rect
                    x={x}
                    y={baseY - totalH}
                    width={barW}
                    height={voyageH}
                    fill="#C4973A"
                    rx="2"
                    opacity={isHover ? 1 : 0.92}
                  />
                )}
                {/* Hôtels (en bas) */}
                {hotelH > 0 && (
                  <rect
                    x={x}
                    y={baseY - hotelH}
                    width={barW}
                    height={hotelH}
                    fill="#1A3F63"
                    rx="2"
                    opacity={isHover ? 1 : 0.92}
                  />
                )}
                {/* ✅ Label X = periode TELLE QU'ELLE — "Jan", "Fév", "Mar"… */}
                <text
                  x={x + barW / 2}
                  y={svgH - 12}
                  textAnchor="middle"
                  fontSize="10"
                  fill={isHover ? "#0F2235" : (isEmpty ? "#B0C4D8" : "#7A93AE")}
                  fontWeight={isHover ? 800 : 600}
                  fontFamily="'Lato', sans-serif"
                >
                  {d.periode}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        {hover !== null && items[hover] && (
          <div className="ad-chart-tooltip">
            <div className="ad-tooltip-period">{items[hover].periode}</div>
            <div className="ad-tooltip-row">
              <span className="ad-leg-dot" style={{ background: "#1A3F63" }} />
              Hôtels <strong>{fmt(items[hover].revenu_hotel)} DT</strong>
            </div>
            <div className="ad-tooltip-row">
              <span className="ad-leg-dot" style={{ background: "#C4973A" }} />
              Voyages <strong>{fmt(items[hover].revenu_voyage)} DT</strong>
            </div>
            <div className="ad-tooltip-total">
              Total <strong>{fmt(items[hover].revenu_total)} DT</strong>
            </div>
            <div className="ad-tooltip-sub">{items[hover].nb_reservations} réservation{items[hover].nb_reservations > 1 ? "s" : ""}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function ChartHeader() {
  return (
    <div className="ad-chart-head">
      <div>
        <h3 className="ad-card-title">Évolution des revenus</h3>
        <p className="ad-card-sub">Mois par mois — Hôtels et Voyages</p>
      </div>
      <div className="ad-chart-legend">
        <span className="ad-legend-item">
          <span className="ad-leg-dot" style={{ background: "#1A3F63" }} />
          Hôtels
        </span>
        <span className="ad-legend-item">
          <span className="ad-leg-dot" style={{ background: "#C4973A" }} />
          Voyages
        </span>
      </div>
    </div>
  );
}