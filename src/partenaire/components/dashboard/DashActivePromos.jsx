/**
 * src/partenaire/components/dashboard/DashActivePromos.jsx
 * ==========================================================
 * Liste des promotions actuellement actives :
 *   APPROVED + actif=true + dans la période [date_debut, date_fin].
 *
 * Chaque ligne = badge -X% + titre + hôtel + jours restants.
 * Le badge "Dernier jour !" devient rouge si jours_restants <= 0.
 */

// ── Calcule jours restants jusqu'à date_fin ──────────────
function joursRestants(dateFin) {
  if (!dateFin) return null;
  const fin = new Date(dateFin);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  fin.setHours(0, 0, 0, 0);
  const ms = fin - today;
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
}

function PromoRow({ promo, onClick }) {
  const jrs = joursRestants(promo.date_fin);
  const urgent = jrs !== null && jrs <= 1;
  return (
    <div
      className="pd-promo-row"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick?.()}
    >
      <span className="pd-promo-pct">-{Math.round(promo.pourcentage)}%</span>
      <div className="pd-promo-info">
        <div className="pd-promo-title">{promo.titre}</div>
        <div className="pd-promo-hotel">
          🏨 {promo.hotel?.nom || `Hôtel #${promo.id_hotel}`}
        </div>
      </div>
      <span className={`pd-promo-days ${urgent ? "urgent" : ""}`}>
        {jrs === null
          ? "—"
          : jrs === 0
          ? "Dernier jour !"
          : jrs === 1
          ? "1 j restant"
          : `${jrs} j restants`}
      </span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
export default function DashActivePromos({
  promos,
  totalPromos,
  loading,
  onNavigate,
}) {
  return (
    <section className="pd-card">
      <div className="pd-card-head">
        <div>
          <h3 className="pd-card-title">Promotions actives</h3>
          <p className="pd-card-sub">
            {promos?.length || 0} promotion{(promos?.length || 0) > 1 ? "s" : ""}{" "}
            en ligne · {totalPromos || 0} au total
          </p>
        </div>
        <button
          type="button"
          className="pd-link-all"
          onClick={() => onNavigate?.("promotions")}
        >
          Gérer →
        </button>
      </div>

      <div className="pd-promo-list">
        {loading && (!promos || promos.length === 0) ? (
          <>
            <div className="pd-skeleton-line" style={{ height: 60 }} />
            <div className="pd-skeleton-line" style={{ height: 60 }} />
          </>
        ) : !promos || promos.length === 0 ? (
          <div className="pd-empty">
            <div className="pd-empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                <line x1="7" y1="7" x2="7.01" y2="7"/>
              </svg>
            </div>
            Aucune promotion active
            <div style={{ marginTop: 12 }}>
              <button
                type="button"
                className="pd-link-all"
                onClick={() => onNavigate?.("promotions")}
                style={{ fontSize: "0.85rem" }}
              >
                + Créer une promotion
              </button>
            </div>
          </div>
        ) : (
          promos.slice(0, 5).map((p) => (
            <PromoRow
              key={p.id}
              promo={p}
              onClick={() => onNavigate?.("promotions")}
            />
          ))
        )}
      </div>
    </section>
  );
}