/**
 * TableHotels — liste des hôtels d'un partenaire avec KPIs financiers.
 */
import KpiCard from "../ui/KpiCard.jsx";
import { fmt } from "../../../services/formatters.js";

export default function TableHotels({ partenaire, hotels, onDrill }) {
  return (
    <div className="af2-table-card">
      <div className="af2-part-header">
        <div className="af2-part-avatar">
          {partenaire.partenaire_prenom[0]}{partenaire.partenaire_nom[0]}
        </div>
        <div>
          <h3>{partenaire.partenaire_prenom} {partenaire.partenaire_nom}</h3>
          <p>{partenaire.nom_entreprise} — Commission : {partenaire.commission_taux}%</p>
        </div>
        <div className="af2-part-kpis">
          <KpiCard small icon="💰" label="Revenu hôtels" value={`${fmt(partenaire.revenu_total)} DT`}      color="#1A3F63" />
          <KpiCard small icon="⚡" label="Agence"        value={`${fmt(partenaire.commission_agence)} DT`}  color="#27AE60" />
          <KpiCard small icon="🤝" label="Part"          value={`${fmt(partenaire.part_partenaire)} DT`}    color="#8E44AD" />
          <KpiCard small icon="⏳" label="Solde"         value={`${fmt(partenaire.solde_restant)} DT`}      color="#E74C3C" />
        </div>
      </div>
      <table className="af2-table">
        <thead>
          <tr>
            <th>Hôtel</th><th>Ville</th><th>Revenu hôtel</th>
            <th>Commission agence</th><th>Part partenaire</th>
            <th>Payé</th><th>Solde restant</th><th>Réservations</th><th>Détail</th>
          </tr>
        </thead>
        <tbody>
          {hotels.map((h) => (
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
              <td>
                <button className="af2-btn-drill" onClick={() => onDrill(h)}>📋</button>
              </td>
            </tr>
          ))}
          {hotels.length === 0 && (
            <tr><td colSpan={9} className="af2-empty-row">Aucun hôtel pour ce partenaire</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}