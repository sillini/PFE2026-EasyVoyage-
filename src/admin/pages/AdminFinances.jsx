/**
 * AdminFinances.jsx — Page principale du module Finance.
 *
 * Rôle unique : charger le dashboard et orchestrer les onglets.
 * Tout le rendu détaillé est délégué aux composants dans components/finance/.
 *
 * Architecture :
 *   pages/AdminFinances.jsx          ← cette page (orchestrateur)
 *   components/finance/
 *     FinanceHeader.jsx              ← titre + KPIs rapides en-tête
 *     FinanceTabs.jsx                ← barre d'onglets
 *     RevenusKpis.jsx                ← grille KPIs + donut
 *     RevenusFilters.jsx             ← filtres période / année
 *     RevenusTable.jsx               ← graphique + tableau revenus
 *     FinanceHeader.jsx
 *     charts/BarChart.jsx
 *     charts/DonutChart.jsx
 *     partenaires/TablePartenaires.jsx
 *     partenaires/TableHotels.jsx
 *     partenaires/TableReservations.jsx
 *     tabs/TabRevenus.jsx
 *     tabs/TabPartenaires.jsx
 *     tabs/TabSoldes.jsx
 *     tabs/TabHistorique.jsx
 *     tabs/TabClients.jsx
 *     ui/KpiCard.jsx
 *     ui/Pill.jsx
 *     ui/Spinner.jsx
 *     ui/Breadcrumb.jsx
 *     ui/Pagination.jsx
 *     ui/PayModal.jsx
 *   services/financesApi.js          ← tous les appels fetch
 *   services/formatters.js           ← fmt, fmtD, fmtDT
 */
import { useState, useEffect } from "react";

import FinanceHeader  from "../components/finance/FinanceHeader.jsx";
import FinanceTabs    from "../components/finance/FinanceTabs.jsx";
import TabRevenus     from "../components/finance/tabs/TabRevenus.jsx";
import TabPartenaires from "../components/finance/tabs/TabPartenaires.jsx";
import TabSoldes      from "../components/finance/tabs/TabSoldes.jsx";
import TabHistorique  from "../components/finance/tabs/TabHistorique.jsx";
import TabClients     from "../components/finance/tabs/TabClients.jsx";

import { fetchDashboard } from "../services/financesApi.js";
import "../components/finance/AdminFinances.css";

export default function AdminFinances() {
  const [tab,  setTab]  = useState("revenus");
  const [dash, setDash] = useState(null);

  useEffect(() => {
    fetchDashboard().then(setDash).catch(console.error);
  }, []);

  return (
    <div className="af2-page">
      <FinanceHeader dash={dash} />
      <FinanceTabs activeTab={tab} onChange={setTab} dash={dash} />

      {tab === "revenus"     && <TabRevenus     dash={dash} />}
      {tab === "partenaires" && <TabPartenaires />}
      {tab === "soldes"      && <TabSoldes      />}
      {tab === "historique"  && <TabHistorique  />}
      {tab === "clients"     && <TabClients     />}
    </div>
  );
}