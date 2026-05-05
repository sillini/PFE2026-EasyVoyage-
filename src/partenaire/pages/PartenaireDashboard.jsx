/**
 * src/partenaire/pages/PartenaireDashboard.jsx
 * ==============================================
 * Composant racine du tableau de bord partenaire EasyVoyage.
 *
 * Architecture en 7 zones (de haut en bas) :
 *   1. DashHeader              — eyebrow + titre + sélecteur année + refresh
 *   2. DashKpisHero            — 4 KPIs principaux (revenus, résas, solde, hôtels)
 *   3. DashAlerts              — centre d'alertes (4 pills)
 *   4. DashRevenueChart + DashRepartitionDonut — charts row
 *   5. DashTauxOccupation      — taux d'occupation avec gauge
 *   6. DashQuickActions        — 4 actions rapides
 *   7. DashTopHotels + DashActivePromos — top 5 + promos actives
 *   8. DashRecentReservations  — feed des dernières réservations
 *
 * @prop {Function} onNavigate — (page:string) => void
 * @prop {object}   user       — user connecté (pour le prénom)
 */
import { useState } from "react";
import { usePartDashboard }  from "../hooks/usePartDashboard.js";
import DashHeader              from "../components/dashboard/DashHeader.jsx";
import DashKpisHero            from "../components/dashboard/DashKpisHero.jsx";
import DashAlerts              from "../components/dashboard/DashAlerts.jsx";
import DashRevenueChart        from "../components/dashboard/DashRevenueChart.jsx";
import DashRepartitionDonut    from "../components/dashboard/DashRepartitionDonut.jsx";
import DashTauxOccupation      from "../components/dashboard/DashTauxOccupation.jsx";
import DashQuickActions        from "../components/dashboard/DashQuickActions.jsx";
import DashTopHotels           from "../components/dashboard/DashTopHotels.jsx";
import DashActivePromos        from "../components/dashboard/DashActivePromos.jsx";
import DashRecentReservations  from "../components/dashboard/DashRecentReservations.jsx";
import "./PartenaireDashboard.css";

export default function PartenaireDashboard({ onNavigate, user }) {
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const dash = usePartDashboard(annee);

  return (
    <div className="pd-page">

      {/* ── 1. Header ──────────────────────────────────── */}
      <DashHeader
        annee={annee}
        onAnnee={setAnnee}
        anneesDisponibles={dash.anneesDisponibles}
        onRefresh={dash.refresh}
        loading={dash.loading}
        lastUpdate={dash.lastUpdate}
        user={user}
      />

      {/* ── 2. KPIs Hero ───────────────────────────────── */}
      <DashKpisHero
        dashboard={dash.dashboard}
        evolution={dash.evolution}
        nbHotelsActifs={dash.nbHotelsActifs}
        loading={dash.loading}
        onNavigate={onNavigate}
      />

      {/* ── 3. Centre d'alertes ────────────────────────── */}
      <DashAlerts
        alerts={dash.alerts}
        onNavigate={onNavigate}
      />

      {/* ── 4. Charts row ──────────────────────────────── */}
      <div className="pd-charts-row">
        <DashRevenueChart
          evolution={dash.evolution}
          annee={annee}
          loading={dash.loading}
        />
        <DashRepartitionDonut
          repartition={dash.repartitionResas}
          loading={dash.loading}
        />
      </div>

      {/* ── 5. Taux d'occupation ───────────────────────── */}
      <DashTauxOccupation
        taux={dash.tauxOccupation}
        noteGlobale={dash.noteGlobale}
        nbHotelsActifs={dash.nbHotelsActifs}
        loading={dash.loading}
      />

      {/* ── 6. Quick Actions ───────────────────────────── */}
      <DashQuickActions onNavigate={onNavigate} />

      {/* ── 7. Top hôtels + Promos actives ─────────────── */}
      <div className="pd-cols-row">
        <DashTopHotels
          hotels={dash.topHotels}
          loading={dash.loading}
          onNavigate={onNavigate}
        />
        <DashActivePromos
          promos={dash.promosActives}
          totalPromos={dash.promotions?.length || 0}
          loading={dash.loading}
          onNavigate={onNavigate}
        />
      </div>

      {/* ── 8. Réservations récentes ───────────────────── */}
      <DashRecentReservations
        reservations={dash.reservationsRecentes}
        loading={dash.loading}
        onNavigate={onNavigate}
      />

      {/* ── Erreur globale ─────────────────────────────── */}
      {dash.error && (
        <div className="pd-error-banner">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{dash.error}</span>
          <button onClick={dash.refresh} className="pd-error-retry">Réessayer</button>
        </div>
      )}
    </div>
  );
}