/**
 * FinanceHeader — en-tête de la page avec titre et 2 KPIs rapides.
 *
 * @prop {object|null} dash — données dashboard
 */
import { fmt } from "../../services/formatters.js";

export default function FinanceHeader({ dash }) {
  return (
    <div className="af2-header">
      <div>
        <h1 className="af2-title">Gestion Financière</h1>
        <p className="af2-subtitle">Revenus · Commissions (hôtels) · Partenaires · Facturation</p>
      </div>
      {dash && (
        <div className="af2-header-kpis">
          <div className="af2-header-kpi">
            <span className="af2-hkpi-icon">💰</span>
            <div>
              <b>{fmt(dash.revenu_total_annee)} DT</b>
              <small>Revenu année</small>
            </div>
          </div>
          <div className="af2-header-kpi af2-hkpi-warn">
            <span className="af2-hkpi-icon">⏳</span>
            <div>
              <b>{fmt(dash.total_du_partenaires)} DT</b>
              <small>À payer</small>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}