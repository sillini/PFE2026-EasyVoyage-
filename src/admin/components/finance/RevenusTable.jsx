/**
 * RevenusTable — tableau d'évolution des revenus + graphique en barres.
 *
 * @prop {object} data — réponse /finances/revenus { evolution: RevenuPeriode[] }
 */
import BarChart from "./charts/BarChart.jsx";
import { fmt } from "../../services/formatters.js";

export default function RevenusTable({ data }) {
  if (!data?.evolution) return null;

  return (
    <>
      {/* Graphique */}
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

      {/* Tableau */}
      <div className="af2-table-card">
        <table className="af2-table">
          <thead>
            <tr>
              <th>Période</th>
              <th>Hôtels</th>
              <th>Voyages</th>
              <th>Total</th>
              <th>Commission agence (10% hôtels)</th>
              <th>Part partenaires</th>
              <th>Réservations</th>
            </tr>
          </thead>
          <tbody>
            {data.evolution.map((r, i) => (
              <tr key={i} className={r.revenu_total > 0 ? "af2-tr af2-tr-active" : "af2-tr"}>
                <td><b>{r.periode}</b></td>
                <td>{fmt(r.revenu_hotel)} DT</td>
                <td>{fmt(r.revenu_voyage)} DT</td>
                <td><b>{fmt(r.revenu_total)} DT</b></td>
                <td className="af2-td-comm">{fmt(r.commission_total)} DT</td>
                {/* Part partenaires = revenu_hotel − commission (voyages exclus) */}
                <td>{fmt(r.revenu_hotel - r.commission_total)} DT</td>
                <td>{r.nb_reservations}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}