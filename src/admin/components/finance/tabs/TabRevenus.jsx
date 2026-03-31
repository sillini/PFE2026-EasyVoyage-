/**
 * TabRevenus — onglet Revenus.
 * Orchestre : KPIs dashboard, filtres période/année, graphique, tableau.
 *
 * @prop {object|null} dash — données dashboard (peut être null pendant le chargement initial)
 */
import { useState, useEffect, useCallback } from "react";
import RevenusKpis    from "../RevenusKpis.jsx";
import RevenusFilters from "../RevenusFilters.jsx";
import RevenusTable   from "../RevenusTable.jsx";
import Spinner        from "../ui/Spinner.jsx";
import { fetchRevenus } from "../../../services/financesApi.js";

export default function TabRevenus({ dash }) {
  const [periode, setPeriode] = useState("mois");
  const [annee,   setAnnee]   = useState(new Date().getFullYear());
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await fetchRevenus(periode, annee);
      setData(d);
    } finally {
      setLoading(false);
    }
  }, [periode, annee]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="af2-tab-content">
      <RevenusKpis dash={dash} />
      <RevenusFilters
        periode={periode}
        annee={annee}
        onPeriode={setPeriode}
        onAnnee={setAnnee}
      />
      {loading ? <Spinner /> : <RevenusTable data={data} />}
    </div>
  );
}