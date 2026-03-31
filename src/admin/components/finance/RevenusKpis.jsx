/**
 * RevenusKpis — grille de 6 cartes KPI + donut + stats rapides.
 * Affiché en haut de l'onglet Revenus.
 *
 * @prop {object} dash — réponse dashboard API
 */
import KpiCard    from "./ui/KpiCard.jsx";
import DonutChart from "./charts/DonutChart.jsx";
import { fmt }   from "../../services/formatters.js";

export default function RevenusKpis({ dash }) {
  if (!dash) return null;

  return (
    <>
      <div className="af2-kpis-grid">
        <KpiCard icon="💰" label="Revenu total (année)"         value={`${fmt(dash.revenu_total_annee)} DT`}     color="#1A3F63" />
        <KpiCard icon="🏨" label="Hôtels"                      value={`${fmt(dash.revenu_hotel_annee)} DT`}      color="#2B5F8E" />
        <KpiCard icon="✈️" label="Voyages"                      value={`${fmt(dash.revenu_voyage_annee)} DT`}     color="#C4973A" />
        <KpiCard icon="⚡" label="Commission agence (10% hôtels)" value={`${fmt(dash.commission_annee)} DT`}      color="#27AE60" />
        <KpiCard icon="🤝" label="Part partenaires"             value={`${fmt(dash.total_part_partenaires)} DT`}  color="#8E44AD" />
        <KpiCard
          icon="⏳"
          label="Soldes à payer"
          value={`${fmt(dash.total_du_partenaires)} DT`}
          sub={`${dash.nb_partenaires_en_attente} partenaire(s)`}
          color="#E74C3C"
        />
      </div>

      <div className="af2-donut-row">
        <div className="af2-donut-card">
          <DonutChart comm={dash.commission_annee} part={dash.total_part_partenaires} />
          <div className="af2-donut-legend">
            <div>
              <span className="af2-leg-dot" style={{ background: "var(--c-blue)" }} />
              Commission agence : <b>{fmt(dash.commission_annee)} DT</b>
            </div>
            <div>
              <span className="af2-leg-dot" style={{ background: "var(--c-gold)" }} />
              Part partenaires : <b>{fmt(dash.total_part_partenaires)} DT</b>
            </div>
          </div>
        </div>

        <div className="af2-donut-info">
          <div className="af2-info-row">
            <span>📅 Ce mois</span>
            <b>{fmt(dash.revenu_total_mois)} DT</b>
          </div>
          <div className="af2-info-row">
            <span>📋 Réservations (mois)</span>
            <b>{dash.nb_reservations_mois}</b>
          </div>
          <div className="af2-info-row">
            <span>📋 Réservations (année)</span>
            <b>{dash.nb_reservations_annee}</b>
          </div>
        </div>
      </div>
    </>
  );
}