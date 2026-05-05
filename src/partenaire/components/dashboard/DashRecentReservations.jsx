/**
 * src/partenaire/components/dashboard/DashRecentReservations.jsx
 * ================================================================
 * Feed des 8 dernières réservations (clients + visiteurs).
 *
 * Chaque ligne :
 *   icône source · client_nom · hôtel · dates · montant · statut
 */

const fmt = (n) =>
  new Intl.NumberFormat("fr-TN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n ?? 0);

const fmtDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
};

function ResaRow({ resa }) {
  const isClient = resa.source === "client";
  return (
    <div className="pd-resa-row">
      <span className={`pd-resa-source ${isClient ? "client" : "visiteur"}`}>
        {isClient ? "👤" : "🧳"}
      </span>
      <div className="pd-resa-info">
        <div className="pd-resa-name">
          {resa.client_nom || resa.client_prenom || "Client anonyme"}
        </div>
        <div className="pd-resa-meta">
          {resa.hotel_nom && (
            <>
              <span className="pd-resa-hotel-name">{resa.hotel_nom}</span>
              <span className="pd-resa-sep">·</span>
            </>
          )}
          <span>
            {fmtDate(resa.date_debut)} → {fmtDate(resa.date_fin)}
          </span>
          {resa.nb_nuits != null && (
            <>
              <span className="pd-resa-sep">·</span>
              <span>
                {resa.nb_nuits} nuit{resa.nb_nuits > 1 ? "s" : ""}
              </span>
            </>
          )}
        </div>
      </div>
      <span className="pd-resa-amount">
        {fmt(resa.montant_total ?? resa.total_ttc ?? resa.part_partenaire)} DT
      </span>
      <span className={`pd-resa-statut pd-statut--${resa.statut || "TERMINEE"}`}>
        {resa.statut === "CONFIRMEE"
          ? "Confirmée"
          : resa.statut === "EN_ATTENTE"
          ? "En attente"
          : resa.statut === "TERMINEE"
          ? "Terminée"
          : resa.statut === "ANNULEE"
          ? "Annulée"
          : resa.statut || "—"}
      </span>
    </div>
  );
}

function SkeletonResa() {
  return (
    <div className="pd-resa-row">
      <div className="pd-skeleton-circle" style={{ width: 32, height: 32 }} />
      <div className="pd-resa-info">
        <div className="pd-skeleton-line" style={{ width: "45%" }} />
        <div className="pd-skeleton-line" style={{ width: "65%", height: 10 }} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
export default function DashRecentReservations({
  reservations,
  loading,
  onNavigate,
}) {
  return (
    <section className="pd-card">
      <div className="pd-card-head">
        <div>
          <h3 className="pd-card-title">Réservations récentes</h3>
          <p className="pd-card-sub">
            Les {reservations?.length || 0} dernières réservations sur vos hôtels
          </p>
        </div>
        <button
          type="button"
          className="pd-link-all"
          onClick={() => onNavigate?.("reservations")}
        >
          Voir toutes →
        </button>
      </div>

      <div className="pd-resa-feed">
        {loading && (!reservations || reservations.length === 0) ? (
          <>
            <SkeletonResa />
            <SkeletonResa />
            <SkeletonResa />
            <SkeletonResa />
          </>
        ) : !reservations || reservations.length === 0 ? (
          <div className="pd-empty">
            <div className="pd-empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
              </svg>
            </div>
            Aucune réservation récente
          </div>
        ) : (
          reservations.map((r, i) => (
            <ResaRow key={`${r.source || "x"}-${r.id || i}`} resa={r} />
          ))
        )}
      </div>
    </section>
  );
}