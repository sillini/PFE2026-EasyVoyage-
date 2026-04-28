/**
 * src/admin/components/dashboard/DashboardKpisHero.jsx
 * ======================================================
 * 4 cartes KPI principales du dashboard.
 *
 *   💰 Revenu total (mois) — clic → AdminFinances
 *   📋 Réservations (mois) — clic → AdminReservations
 *   ⚡ Commission agence    — clic → AdminFinances onglet Commissions
 *   ⏳ Soldes à payer       — clic → AdminFinances onglet Soldes
 *
 * Chaque carte calcule un delta vs période précédente (mois M-1)
 * à partir des données evolution[] reçues en prop.
 *
 * @prop {object|null} dash      — réponse /finances/dashboard
 * @prop {object|null} evolution — réponse /finances/revenus (avec evolution[])
 * @prop {boolean}     loading   — état de chargement
 * @prop {Function}    onNavigate — (page:string) => void
 */
import { fmt } from "../../services/formatters.js";

// ── Calcul du delta % entre 2 périodes ────────────────────
function deltaPct(current, previous) {
  if (!previous || previous === 0) return null;
  const d = ((current - previous) / previous) * 100;
  return Math.round(d);
}

// ── Récupère [actuel, précédent] pour une métrique sur evolution[] ──
function lastTwo(evolution, key) {
  if (!evolution?.evolution?.length) return [null, null];
  const arr = evolution.evolution;
  // L'API retourne ordre chronologique → 2 derniers = mois courant + précédent
  const cur  = arr[arr.length - 1]?.[key] || 0;
  const prev = arr[arr.length - 2]?.[key] || 0;
  return [cur, prev];
}

// ── Pill delta ────────────────────────────────────────────
function DeltaPill({ value }) {
  if (value === null || value === undefined) return null;
  const isPos = value >= 0;
  return (
    <span className={`ad-kpi-delta ${isPos ? "ad-delta-pos" : "ad-delta-neg"}`}>
      {isPos ? "↑" : "↓"} {Math.abs(value)}%
    </span>
  );
}

// ── Carte KPI hero ────────────────────────────────────────
function KpiHero({ icon, label, value, sub, color, delta, onClick }) {
  return (
    <div
      className="ad-kpi-hero"
      style={{ "--ad-acc": color }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick?.()}
    >
      <div className="ad-kpi-hero-icon">{icon}</div>
      <div className="ad-kpi-hero-body">
        <div className="ad-kpi-hero-top">
          <span className="ad-kpi-hero-label">{label}</span>
          <DeltaPill value={delta} />
        </div>
        <div className="ad-kpi-hero-val">{value}</div>
        {sub && <div className="ad-kpi-hero-sub">{sub}</div>}
      </div>
      <div className="ad-kpi-hero-deco" />
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────
function KpiSkeleton() {
  return (
    <div className="ad-kpi-hero ad-kpi-skeleton">
      <div className="ad-skeleton-circle" />
      <div className="ad-kpi-hero-body">
        <div className="ad-skeleton-line" style={{ width: "70%" }} />
        <div className="ad-skeleton-line" style={{ width: "50%", height: 24 }} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
export default function DashboardKpisHero({ dash, evolution, loading, onNavigate }) {
  if (loading && !dash) {
    return (
      <div className="ad-kpis-hero-grid">
        {[0, 1, 2, 3].map((i) => <KpiSkeleton key={i} />)}
      </div>
    );
  }

  if (!dash) return null;

  // Calcul des deltas mois courant vs précédent
  const [revHotelCur, revHotelPrev]   = lastTwo(evolution, "revenu_hotel");
  const [revVoyageCur, revVoyagePrev] = lastTwo(evolution, "revenu_voyage");
  const [nbResaCur, nbResaPrev]       = lastTwo(evolution, "nb_reservations");
  const [commCur, commPrev]           = lastTwo(evolution, "commission_total");

  const deltaRev  = deltaPct(revHotelCur + revVoyageCur, revHotelPrev + revVoyagePrev);
  const deltaResa = deltaPct(nbResaCur, nbResaPrev);
  const deltaComm = deltaPct(commCur, commPrev);

  return (
    <div className="ad-kpis-hero-grid">
      <KpiHero
        icon="💰"
        label="Revenu total (mois)"
        value={`${fmt(dash.revenu_total_mois)} DT`}
        color="#1A3F63"
        delta={deltaRev}
        onClick={() => onNavigate?.("finances")}
      />
      <KpiHero
        icon="📋"
        label="Réservations (mois)"
        value={dash.nb_reservations_mois}
        color="#2B5F8E"
        delta={deltaResa}
        onClick={() => onNavigate?.("reservations")}
      />
      <KpiHero
        icon="⚡"
        label="Commission agence (mois)"
        value={`${fmt(dash.commission_mois)} DT`}
        sub="10% sur revenus hôtels"
        color="#27AE60"
        delta={deltaComm}
        onClick={() => onNavigate?.("finances")}
      />
      <KpiHero
        icon="⏳"
        label="Soldes à payer"
        value={`${fmt(dash.total_du_partenaires)} DT`}
        sub={`${dash.nb_partenaires_en_attente || 0} partenaire${dash.nb_partenaires_en_attente > 1 ? "s" : ""}`}
        color="#E74C3C"
        onClick={() => onNavigate?.("finances")}
      />
    </div>
  );
}