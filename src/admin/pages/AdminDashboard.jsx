/**
 * src/admin/pages/AdminDashboard.jsx
 * ====================================
 * Composant racine du tableau de bord admin EasyVoyage.
 *
 * Architecture en 7 zones (de haut en bas) :
 *   1. DashboardHeader        — eyebrow + titre + actions
 *   2. DashboardKpisHero      — 4 KPIs principaux
 *   3. AlertsCenter           — centre d'alertes (4 pills)
 *   4. EvolutionChart + RepartitionDonut  — charts row
 *   5. MetricsGrid            — 6 mini-KPIs métier
 *   6. TopHotelsList + TopPartenairesList — top 5 (2 colonnes)
 *   7. RecentActivityFeed     — dernières réservations
 *
 * @prop {Function} onNavigate — (page:string) => void
 * @prop {object}   user       — user connecté (pour le prénom)
 */
import { useState } from "react";
import { useDashboard }       from "../hooks/useDashboard.js";
import DashboardHeader        from "../components/dashboard/DashboardHeader.jsx";
import DashboardKpisHero      from "../components/dashboard/DashboardKpisHero.jsx";
import AlertsCenter           from "../components/dashboard/AlertsCenter.jsx";
import EvolutionChart         from "../components/dashboard/EvolutionChart.jsx";
import RepartitionDonut       from "../components/dashboard/RepartitionDonut.jsx";
import MetricsGrid            from "../components/dashboard/MetricsGrid.jsx";
import TopHotelsList          from "../components/dashboard/TopHotelsList.jsx";
import TopPartenairesList     from "../components/dashboard/TopPartenairesList.jsx";
import RecentActivityFeed     from "../components/dashboard/RecentActivityFeed.jsx";
import "./AdminDashboard.css";

export default function AdminDashboard({ onNavigate, user }) {
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const dash = useDashboard(annee);

  return (
    <div className="ad-page">

      {/* ── 1. Header ──────────────────────────────────── */}
      <DashboardHeader
        annee={annee}
        onAnnee={setAnnee}
        anneesDisponibles={dash.anneesDisponibles}
        onRefresh={dash.refresh}
        loading={dash.loading}
        lastUpdate={dash.lastUpdate}
        user={user}
      />

      {/* ── 2. KPIs Hero ───────────────────────────────── */}
      <DashboardKpisHero
        dash={dash.dashboard}
        evolution={dash.evolution}
        loading={dash.loading}
        onNavigate={onNavigate}
      />

      {/* ── 3. Centre d'alertes ────────────────────────── */}
      <AlertsCenter
        alerts={dash.alerts}
        onNavigate={onNavigate}
      />

      {/* ── 4. Charts row ──────────────────────────────── */}
      <div className="ad-charts-row">
        <EvolutionChart
          data={dash.evolution}
          loading={dash.loading}
        />
        <RepartitionDonut
          dash={dash.dashboard}
          evolution={dash.evolution}
          loading={dash.loading}
        />
      </div>

      {/* ── 5. Indicateurs métier ──────────────────────── */}
      <MetricsGrid
        metrics={dash.metrics}
        dash={dash.dashboard}
        loading={dash.loading}
        onNavigate={onNavigate}
      />

      {/* ── 6. Top 5 — 2 colonnes ──────────────────────── */}
      <div className="ad-tops-row">
        <TopHotelsList
          items={dash.topHotels}
          loading={dash.loading}
        />
        <TopPartenairesList
          items={dash.topPartenaires}
          loading={dash.loading}
          onNavigate={onNavigate}
        />
      </div>

      {/* ── 7. Activité récente ────────────────────────── */}
      <RecentActivityFeed
        items={dash.recentReservations}
        loading={dash.loading}
        onNavigate={onNavigate}
      />

    </div>
  );
}