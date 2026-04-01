import { useState, useEffect } from "react";
import FinanceHeader     from "../components/finance/FinanceHeader.jsx";
import FinanceTabs       from "../components/finance/FinanceTabs.jsx";
import TabRevenus        from "../components/finance/tabs/TabRevenus.jsx";
import TabPartenaires    from "../components/finance/tabs/TabPartenaires.jsx";
import TabSoldes         from "../components/finance/tabs/TabSoldes.jsx";
import TabDemandes       from "../components/finance/tabs/TabDemandes.jsx";
import TabHistorique     from "../components/finance/tabs/TabHistorique.jsx";
import TabClients        from "../components/finance/tabs/TabClients.jsx";
import { fetchDashboard, fetchDemandesRetrait } from "../services/financesApi.js";
import "../components/finance/AdminFinances.css";

export default function AdminFinances() {
  const [tab,        setTab]        = useState("revenus");
  const [dash,       setDash]       = useState(null);
  const [nbDemandes, setNbDemandes] = useState(0);

  useEffect(() => {
    fetchDashboard().then(setDash).catch(console.error);
    // Compte les demandes EN_ATTENTE pour le badge
    fetchDemandesRetrait(1, 1, { statut: "EN_ATTENTE" })
      .then((d) => setNbDemandes(d.total || 0))
      .catch(console.error);
  }, []);

  const reloadBadge = () => {
    fetchDemandesRetrait(1, 1, { statut: "EN_ATTENTE" })
      .then((d) => setNbDemandes(d.total || 0))
      .catch(console.error);
  };

  return (
    <div className="af2-page">
      <FinanceHeader dash={dash} />
      <FinanceTabs activeTab={tab} onChange={setTab} dash={dash} nbDemandes={nbDemandes} />

      {tab === "revenus"     && <TabRevenus     dash={dash} />}
      {tab === "partenaires" && <TabPartenaires />}
      {tab === "soldes"      && <TabSoldes />}
      {tab === "demandes"    && <TabDemandes onAction={reloadBadge} />}
      {tab === "historique"  && <TabHistorique />}
      {tab === "clients"     && <TabClients />}
    </div>
  );
}