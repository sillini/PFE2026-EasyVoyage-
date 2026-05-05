/**
 * src/partenaire/components/dashboard/DashKpisHero.jsx
 * ======================================================
 * 4 cartes KPI principales du dashboard partenaire.
 *
 *   💰 Revenus du mois        — clic → Finances
 *   📋 Réservations du mois   — clic → Réservations
 *   💳 Solde disponible       — clic → Finances (onglet retrait)
 *   🏨 Hôtels actifs           — clic → Mes Hôtels
 *
 * Chaque carte affiche un delta (↑ ↓ %) calculé depuis evolution_pct
 * (pour les revenus) ou par déduction.
 */

const fmt = (n) =>
  new Intl.NumberFormat("fr-TN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n ?? 0);

// ── Pill delta ────────────────────────────────────────────
function DeltaPill({ value }) {
  if (value === null || value === undefined) return null;
  const isPos = value >= 0;
  return (
    <span className={`pd-kpi-delta ${isPos ? "pd-delta-pos" : "pd-delta-neg"}`}>
      {isPos ? "↑" : "↓"} {Math.abs(value).toFixed(1)}%
    </span>
  );
}

// ── Carte KPI hero ────────────────────────────────────────
function KpiHero({ icon, label, value, sub, color, delta, onClick }) {
  return (
    <div
      className="pd-kpi-hero"
      style={{ "--pd-acc": color }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick?.()}
    >
      <div className="pd-kpi-hero-icon">{icon}</div>
      <div className="pd-kpi-hero-body">
        <div className="pd-kpi-hero-top">
          <span className="pd-kpi-hero-label">{label}</span>
          <DeltaPill value={delta} />
        </div>
        <div className="pd-kpi-hero-val">{value}</div>
        {sub && <div className="pd-kpi-hero-sub">{sub}</div>}
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────
function KpiSkeleton() {
  return (
    <div className="pd-kpi-hero">
      <div className="pd-skeleton-circle" />
      <div className="pd-kpi-hero-body" style={{ width: "100%" }}>
        <div className="pd-skeleton-line" style={{ width: "70%" }} />
        <div
          className="pd-skeleton-line"
          style={{ width: "50%", height: 24 }}
        />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
export default function DashKpisHero({
  dashboard,
  evolution,
  nbHotelsActifs,
  loading,
  onNavigate,
}) {
  if (loading && !dashboard) {
    return (
      <div className="pd-kpis-hero-grid">
        {[0, 1, 2, 3].map((i) => (
          <KpiSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!dashboard) return null;

  // Evolution revenus = fournie directement par l'API (vs M-1)
  const deltaRev = dashboard.evolution_pct ?? null;

  // Pour les réservations, on calcule depuis l'evolution si dispo
  let deltaResas = null;
  if (evolution?.mois_liste?.length >= 2) {
    const arr = evolution.mois_liste;
    const cur = arr[arr.length - 1]?.nb_resas ?? 0;
    const prev = arr[arr.length - 2]?.nb_resas ?? 0;
    if (prev > 0) {
      deltaResas = ((cur - prev) / prev) * 100;
    }
  }

  const { actifs = 0, total = 0 } = nbHotelsActifs || {};
  const tauxActifs = total > 0 ? Math.round((actifs / total) * 100) : 0;

  return (
    <div className="pd-kpis-hero-grid">
      <KpiHero
        icon="💰"
        label="Revenus du mois"
        value={`${fmt(dashboard.revenu_mois)} DT`}
        sub={`Mois précédent : ${fmt(dashboard.revenu_mois_precedent)} DT`}
        color="#1A3F63"
        delta={deltaRev}
        onClick={() => onNavigate?.("finances")}
      />
      <KpiHero
        icon="📋"
        label="Réservations du mois"
        value={dashboard.nb_reservations_mois ?? 0}
        sub="clients + visiteurs"
        color="#2B5F8E"
        delta={deltaResas}
        onClick={() => onNavigate?.("reservations")}
      />
      <KpiHero
        icon="💳"
        label="Solde disponible"
        value={`${fmt(dashboard.solde_disponible)} DT`}
        sub={
          dashboard.solde_disponible >= 50
            ? "✓ retirable"
            : "minimum 50 DT requis"
        }
        color="#C4973A"
        onClick={() => onNavigate?.("finances")}
      />
      <KpiHero
        icon="🏨"
        label="Hôtels actifs"
        value={`${actifs} / ${total}`}
        sub={total > 0 ? `${tauxActifs}% du portfolio` : "Aucun hôtel"}
        color="#27AE60"
        onClick={() => onNavigate?.("hotels")}
      />
    </div>
  );
}