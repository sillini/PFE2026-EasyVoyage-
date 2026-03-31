/**
 * src/partenaire/pages/PartenaireFinances.jsx
 * =============================================
 * Page principale Finance — Espace Partenaire.
 * Orchestre les 4 onglets : Vue globale, Mes hôtels, Paiements reçus, Demande de retrait.
 */
import { useState, useEffect } from "react";
import TabVueGlobale      from "../components/finances/TabVueGlobale.jsx";
import TabMesHotels       from "../components/finances/TabMesHotels.jsx";
import TabPaiements       from "../components/finances/TabPaiements.jsx";
import TabDemandeRetrait  from "../components/finances/TabDemandeRetrait.jsx";
import { fetchPartDashboard } from "../services/financesPartenaireApi.js";
import "./PartenaireFinances.css";

const TABS = [
  { id: "globale",  label: "Vue globale",         icon: "◎" },
  { id: "hotels",   label: "Mes hôtels",           icon: "▦" },
  { id: "paiements",label: "Paiements reçus",      icon: "↓" },
  { id: "retrait",  label: "Demande de retrait",   icon: "⇥" },
];

export default function PartenaireFinances() {
  const [tab,  setTab]  = useState("globale");
  const [dash, setDash] = useState(null);
  const [loadingDash, setLoadingDash] = useState(true);

  useEffect(() => {
    setLoadingDash(true);
    fetchPartDashboard()
      .then(setDash)
      .catch(console.error)
      .finally(() => setLoadingDash(false));
  }, []);

  const fmt = (n) =>
    new Intl.NumberFormat("fr-TN", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n ?? 0);

  return (
    <div className="pf-page">

      {/* ── KPI Header ── */}
      <div className="pf-kpi-row">
        <div className="pf-kpi pf-kpi--blue">
          <span className="pf-kpi-label">Solde disponible</span>
          <span className="pf-kpi-value">
            {loadingDash ? "—" : `${fmt(dash?.solde_disponible)} DT`}
          </span>
          <span className="pf-kpi-sub">à retirer</span>
        </div>

        <div className="pf-kpi pf-kpi--teal">
          <span className="pf-kpi-label">Revenus ce mois</span>
          <span className="pf-kpi-value">
            {loadingDash ? "—" : `${fmt(dash?.revenu_mois)} DT`}
          </span>
          <span className={`pf-kpi-sub pf-kpi-evo ${(dash?.evolution_pct ?? 0) >= 0 ? "pos" : "neg"}`}>
            {loadingDash ? "" : `${(dash?.evolution_pct ?? 0) >= 0 ? "+" : ""}${dash?.evolution_pct ?? 0}% vs mois passé`}
          </span>
        </div>

        <div className="pf-kpi pf-kpi--purple">
          <span className="pf-kpi-label">Réservations ce mois</span>
          <span className="pf-kpi-value">
            {loadingDash ? "—" : (dash?.nb_reservations_mois ?? 0)}
          </span>
          <span className="pf-kpi-sub">clients + visiteurs</span>
        </div>

        <div className="pf-kpi pf-kpi--gold">
          <span className="pf-kpi-label">Revenus cette année</span>
          <span className="pf-kpi-value">
            {loadingDash ? "—" : `${fmt(dash?.revenu_annee)} DT`}
          </span>
          <span className="pf-kpi-sub">cumul annuel</span>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="pf-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`pf-tab${tab === t.id ? " pf-tab--on" : ""}`}
            onClick={() => setTab(t.id)}
          >
            <span className="pf-tab-icon">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Contenu ── */}
      <div className="pf-content">
        {tab === "globale"   && <TabVueGlobale dash={dash} loadingDash={loadingDash} />}
        {tab === "hotels"    && <TabMesHotels />}
        {tab === "paiements" && <TabPaiements />}
        {tab === "retrait"   && <TabDemandeRetrait solde={dash?.solde_disponible ?? 0} onSuccess={() => {
          fetchPartDashboard().then(setDash).catch(console.error);
        }} />}
      </div>
    </div>
  );
}