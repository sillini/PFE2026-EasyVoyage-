/**
 * TablePartenaires — liste des partenaires avec KPIs financiers.
 */
import { fmt } from "../../../services/formatters.js";

export default function TablePartenaires({ partenaires, onDrill, onPay }) {
  return (
    <div className="af2-table-card">
      <table className="af2-table">
        <thead>
          <tr>
            <th>Partenaire</th><th>Entreprise</th><th>Revenu hôtels</th>
            <th>Commission agence</th><th>Part partenaire</th>
            <th>Payé</th><th>Solde restant</th><th>Réservations</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {partenaires.map((p) => (
            <tr key={p.id_partenaire} className="af2-tr">
              <td>
                <div className="af2-person">
                  <div className="af2-avatar">
                    {p.partenaire_prenom?.[0] || "?"}{p.partenaire_nom?.[0] || ""}
                  </div>
                  <div>
                    <b>{p.partenaire_prenom} {p.partenaire_nom}</b>
                    <br /><small>{p.partenaire_email}</small>
                  </div>
                </div>
              </td>
              <td>{p.nom_entreprise}</td>
              <td><b>{fmt(p.revenu_total)} DT</b></td>
              <td className="af2-td-comm">
                {fmt(p.commission_agence)} DT<br /><small>{p.commission_taux}%</small>
              </td>
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
                  <button className="af2-btn-drill" onClick={() => onDrill(p)} title="Voir hôtels">🏨</button>
                  {p.solde_restant > 0 && (
                    <button className="af2-btn-pay" onClick={() => onPay(p)} title="Payer">💸</button>
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
  );
}