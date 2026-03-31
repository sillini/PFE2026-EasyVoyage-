/**
 * TabSoldes — onglet Soldes à payer.
 *
 * AMÉLIORATIONS :
 *  - nb_commissions = clients EN_ATTENTE + visiteurs (les deux sources)
 *  - Recherche globale (nom, email, entreprise)
 *  - Filtres avancés (montant min/max, nb commissions min/max, tri)
 *  - Colonnes enrichies : revenu hôtel, commission agence, déjà payé,
 *    détail visiteurs/clients
 *  - Tri par colonne cliquable
 */
import { useState, useEffect, useCallback } from "react";
import KpiCard      from "../ui/KpiCard.jsx";
import PayModal     from "../ui/PayModal.jsx";
import Spinner      from "../ui/Spinner.jsx";
import SoldesControls from "./SoldesControls.jsx";
import { useSoldesFilters } from "../../../hooks/useSoldesFilters.js";
import { fetchSoldes, payerPartenaire } from "../../../services/financesApi.js";
import { fmt } from "../../../services/formatters.js";
import "./TabSoldes.css";

function SortIcon({ col, sortCol, sortDir }) {
  if (col !== sortCol) return <span className="sl-sort-neutral">⇅</span>;
  return <span className="sl-sort-active">{sortDir === "asc" ? "↑" : "↓"}</span>;
}

export default function TabSoldes() {
  const [rawData,    setRawData]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [paying,     setPaying]     = useState(null);
  const [payNote,    setPayNote]    = useState("");
  const [payLoading, setPayLoading] = useState(false);

  const {
    filters, setFilter, toggleSort, resetFilters, activeFilterCount, rows,
  } = useSoldesFilters(rawData);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await fetchSoldes();
      setRawData(d.items || []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openPay  = (s) => { setPaying(s); setPayNote(""); };
  const closePay = ()  => { setPaying(null); setPayNote(""); };

  const handleConfirmPay = async () => {
    if (!paying) return;
    setPayLoading(true);
    try {
      await payerPartenaire(paying.id_partenaire, payNote);
      closePay();
      load();
    } finally { setPayLoading(false); }
  };

  // KPIs calculés sur les données filtrées
  const totalDu       = rows.reduce((s, x) => s + x.solde_du, 0);
  const totalComm     = rows.reduce((s, x) => s + x.nb_commissions, 0);
  const totalVisiteurs= rows.reduce((s, x) => s + (x.nb_reservations_visiteurs || 0), 0);

  const SORT_COLS = [
    { key: "solde_du",       label: "Montant dû" },
    { key: "nb_commissions", label: "Commissions" },
    { key: "revenu_hotel",   label: "Revenu hôtel" },
  ];

  return (
    <div className="af2-tab-content">
      <PayModal
        partenaire={paying}
        note={payNote}
        loading={payLoading}
        onNoteChange={setPayNote}
        onConfirm={handleConfirmPay}
        onClose={closePay}
      />

      {/* ── KPIs ── */}
      <div className="af2-kpis-grid sl-kpis">
        <KpiCard icon="⏳" label="Total à payer (filtré)"    value={`${fmt(totalDu)} DT`}                   color="#E74C3C" />
        <KpiCard icon="🤝" label="Partenaires en attente"   value={rows.length}                             color="#C4973A" />
        <KpiCard icon="📋" label="Commissions en attente"   value={totalComm}                               color="#2B5F8E"
          sub={totalVisiteurs > 0 ? `dont ${totalVisiteurs} visiteur(s)` : undefined} />
      </div>

      {/* ── Contrôles recherche + filtres ── */}
      <SoldesControls
        filters={filters}
        setFilter={setFilter}
        resetFilters={resetFilters}
        activeFilterCount={activeFilterCount}
        total={rawData.length}
        filtered={rows.length}
      />

      {loading ? <Spinner /> : rows.length === 0 ? (
        <div className="af2-empty-full">
          {rawData.length === 0
            ? "✅ Tous les partenaires sont à jour !"
            : "🔍 Aucun partenaire ne correspond aux filtres"}
        </div>
      ) : (
        <div className="af2-table-card sl-table-wrap">
          <table className="af2-table">
            <thead>
              <tr>
                <th>Partenaire</th>
                <th>Entreprise</th>
                <th
                  className="sl-th-sort"
                  onClick={() => toggleSort("revenu_hotel")}
                  title="Trier par revenu hôtel"
                >
                  Revenu hôtel <SortIcon col="revenu_hotel" {...filters} />
                </th>
                <th>Commission agence</th>
                <th>Déjà payé</th>
                <th
                  className="sl-th-sort"
                  onClick={() => toggleSort("nb_commissions")}
                  title="Trier par nb commissions"
                >
                  Commissions en attente <SortIcon col="nb_commissions" {...filters} />
                </th>
                <th
                  className="sl-th-sort"
                  onClick={() => toggleSort("solde_du")}
                  title="Trier par montant dû"
                >
                  Montant dû <SortIcon col="solde_du" {...filters} />
                </th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id_partenaire} className="af2-tr">
                  {/* Partenaire */}
                  <td>
                    <div className="af2-person">
                      <div className="af2-avatar">
                        {s.partenaire_prenom?.[0] || "?"}{s.partenaire_nom?.[0] || ""}
                      </div>
                      <div>
                        <b>{s.partenaire_prenom} {s.partenaire_nom}</b>
                        <br /><small>{s.partenaire_email}</small>
                      </div>
                    </div>
                  </td>

                  {/* Entreprise */}
                  <td>{s.nom_entreprise}</td>

                  {/* Revenu hôtel */}
                  <td><b>{fmt(s.revenu_hotel || 0)} DT</b></td>

                  {/* Commission agence */}
                  <td className="af2-td-comm">{fmt(s.commission_agence || 0)} DT</td>

                  {/* Déjà payé */}
                  <td className="af2-td-paid">{fmt(s.montant_paye || 0)} DT</td>

                  {/* Commissions en attente avec détail clients/visiteurs */}
                  <td>
                    <div className="sl-comm-detail">
                      <span className="af2-badge-nb">{s.nb_commissions}</span>
                      {(s.nb_reservations_visiteurs || 0) > 0 && (
                        <div className="sl-comm-breakdown">
                          <span className="sl-comm-tag tag-client">
                            {s.nb_commissions - (s.nb_reservations_visiteurs || 0)} client{s.nb_commissions - (s.nb_reservations_visiteurs || 0) > 1 ? "s" : ""}
                          </span>
                          <span className="sl-comm-tag tag-visiteur">
                            {s.nb_reservations_visiteurs} visiteur{s.nb_reservations_visiteurs > 1 ? "s" : ""}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Montant dû */}
                  <td>
                    <span className="af2-amount-due">{fmt(s.solde_du)} DT</span>
                  </td>

                  {/* Action */}
                  <td>
                    <button className="af2-btn-pay-full" onClick={() => openPay(s)}>
                      💸 Payer {fmt(s.solde_du)} DT
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}