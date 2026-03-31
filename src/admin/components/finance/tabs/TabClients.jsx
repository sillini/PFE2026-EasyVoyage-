/**
 * TabClients — onglet Clients & Visiteurs (classement multi-critères).
 */
import { useState, useEffect, useCallback } from "react";
import Spinner from "../ui/Spinner.jsx";
import { fetchClassementClients } from "../../../services/financesApi.js";
import { fmt } from "../../../services/formatters.js";

const CRITERES = [
  { value: "depenses",        label: "Dépenses totales" },
  { value: "commissions",     label: "Commissions générées (hôtels)" },
  { value: "nb_hotel",        label: "Réservations hôtel" },
  { value: "nb_voyage",       label: "Réservations voyage" },
  { value: "nb_reservations", label: "Total réservations" },
];

const LIMITES = [20, 50, 100];

function getVal(x, critere) {
  switch (critere) {
    case "depenses":        return { display: `${fmt(x.total_depenses)} DT`,       raw: x.total_depenses };
    case "commissions":     return { display: `${fmt(x.commissions_generees)} DT`, raw: x.commissions_generees };
    case "nb_hotel":        return { display: x.nb_hotel,                          raw: x.nb_hotel };
    case "nb_voyage":       return { display: x.nb_voyage,                         raw: x.nb_voyage };
    default:                return { display: x.nb_reservations,                  raw: x.nb_reservations };
  }
}

export default function TabClients() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [critere, setCritere] = useState("depenses");
  const [limit,   setLimit]   = useState(50);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await fetchClassementClients(critere, limit);
      setItems(d.items || []);
    } finally { setLoading(false); }
  }, [critere, limit]);

  useEffect(() => { load(); }, [load]);

  const maxVal = Math.max(...items.map((x) => getVal(x, critere).raw), 1);

  return (
    <div className="af2-tab-content">
      <div className="af2-toolbar">
        <select
          className="af2-select"
          value={critere}
          onChange={(e) => setCritere(e.target.value)}
        >
          {CRITERES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <select
          className="af2-select"
          value={limit}
          onChange={(e) => setLimit(+e.target.value)}
        >
          {LIMITES.map((l) => (
            <option key={l} value={l}>Top {l}</option>
          ))}
        </select>
      </div>

      {loading ? <Spinner /> : (
        <div className="af2-clients-list">
          {items.length === 0 && (
            <div className="af2-empty-full">Aucune donnée</div>
          )}
          {items.map((x, i) => {
            const v   = getVal(x, critere);
            const pct = (v.raw / maxVal) * 100;
            return (
              <div key={i} className="af2-client-row">
                <div className="af2-client-rank">{i + 1}</div>
                <div className={`af2-client-badge ${x.type_source === "client" ? "badge-client" : "badge-visiteur"}`}>
                  {x.type_source === "client" ? "Client" : "Visiteur"}
                </div>
                <div className="af2-client-info">
                  <b>{x.nom}</b>
                  <small>{x.email}</small>
                </div>
                <div className="af2-client-bar-wrap">
                  <div className="af2-client-bar" style={{ width: `${pct}%` }} />
                </div>
                <div className="af2-client-val">{v.display}</div>
                <div className="af2-client-meta">
                  🏨 {x.nb_hotel}&nbsp;&nbsp;✈️ {x.nb_voyage}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}