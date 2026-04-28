/**
 * src/admin/components/dashboard/RepartitionDonut.jsx
 * =====================================================
 * Donut SVG : répartition CA Hôtels vs Voyages sur l'année sélectionnée.
 *
 * ⚠️ Calcule les totaux depuis `evolution[]` (qui DÉPEND de l'année),
 *    et non depuis `dash.revenu_hotel_annee` (qui est figé sur l'année courante).
 *
 * @prop {object|null} dash      — réponse /finances/dashboard (pour stats latérales)
 * @prop {object|null} evolution — réponse /finances/revenus (dépend de l'année)
 * @prop {boolean}     loading
 */
import { fmt } from "../../services/formatters.js";

const SIZE   = 140;
const RADIUS = 56;
const STROKE = 22;
const CX     = SIZE / 2;
const CY     = SIZE / 2;
const CIRC   = 2 * Math.PI * RADIUS;

export default function RepartitionDonut({ dash, evolution, loading }) {
  if (loading && !evolution) {
    return (
      <div className="ad-donut-card">
        <div className="ad-card-head">
          <h3 className="ad-card-title">Répartition CA</h3>
          <p className="ad-card-sub">Hôtels vs Voyages</p>
        </div>
        <div className="ad-skeleton-donut" />
      </div>
    );
  }

  // ✅ Source : on AGRÈGE evolution[] pour avoir les totaux de l'année sélectionnée
  const evol = evolution?.evolution || [];
  const hotel  = evol.reduce((s, e) => s + (e.revenu_hotel  || 0), 0);
  const voyage = evol.reduce((s, e) => s + (e.revenu_voyage || 0), 0);
  const total  = hotel + voyage;

  // Comptage des réservations sur cette année (pour la stat latérale)
  const nbResasAnnee = evol.reduce((s, e) => s + (e.nb_reservations || 0), 0);

  const pHotel   = total > 0 ? hotel / total : 1;
  const pctHotel = Math.round(pHotel * 100);
  const dashHotel = pHotel * CIRC;

  return (
    <div className="ad-donut-card">
      <div className="ad-card-head">
        <h3 className="ad-card-title">Répartition CA</h3>
        <p className="ad-card-sub">Hôtels vs Voyages — Année</p>
      </div>

      <div className="ad-donut-body">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="ad-donut-svg"
          role="img"
          aria-label={`Hôtels ${pctHotel}%, Voyages ${100 - pctHotel}%`}
        >
          {/* Fond Or (Voyages) */}
          <circle cx={CX} cy={CY} r={RADIUS} fill="none" stroke="#C4973A" strokeWidth={STROKE} />
          {/* Arc Bleu (Hôtels) */}
          <circle
            cx={CX}
            cy={CY}
            r={RADIUS}
            fill="none"
            stroke="#1A3F63"
            strokeWidth={STROKE}
            strokeDasharray={`${dashHotel} ${CIRC - dashHotel}`}
            strokeDashoffset={CIRC * 0.25}
            transform={`rotate(-90 ${CX} ${CY})`}
            strokeLinecap="butt"
          />
          {/* Texte central — typo claire (Lato weight 800, pas serif) */}
          <text
            x={CX}
            y={CY - 2}
            textAnchor="middle"
            fontSize="22"
            fontWeight="800"
            fill="#0F2235"
            fontFamily="'Lato', sans-serif"
          >
            {pctHotel}%
          </text>
          <text
            x={CX}
            y={CY + 16}
            textAnchor="middle"
            fontSize="10"
            fill="#7A93AE"
            fontWeight="600"
            fontFamily="'Lato', sans-serif"
          >
            Hôtels
          </text>
        </svg>

        <div className="ad-donut-legend">
          <div className="ad-legend-row">
            <span className="ad-leg-dot" style={{ background: "#1A3F63" }} />
            <span className="ad-legend-lbl">Hôtels</span>
            <strong className="ad-legend-val">{fmt(hotel)} DT</strong>
          </div>
          <div className="ad-legend-row">
            <span className="ad-leg-dot" style={{ background: "#C4973A" }} />
            <span className="ad-legend-lbl">Voyages</span>
            <strong className="ad-legend-val">{fmt(voyage)} DT</strong>
          </div>
        </div>
      </div>

      {/* Stats rapides (provenant du dashboard global → mois courant uniquement) */}
      {dash && (
        <div className="ad-donut-stats">
          <div className="ad-stat-row">
            <span className="ad-stat-lbl">📅 Ce mois</span>
            <strong className="ad-stat-val">{fmt(dash.revenu_total_mois)} DT</strong>
          </div>
          <div className="ad-stat-row">
            <span className="ad-stat-lbl">📋 Réservations (mois)</span>
            <strong className="ad-stat-val">{dash.nb_reservations_mois || 0}</strong>
          </div>
          <div className="ad-stat-row">
            <span className="ad-stat-lbl">📋 Réservations (année)</span>
            <strong className="ad-stat-val">{nbResasAnnee}</strong>
          </div>
        </div>
      )}
    </div>
  );
}