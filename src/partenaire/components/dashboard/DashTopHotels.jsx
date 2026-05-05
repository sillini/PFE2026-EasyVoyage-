/**
 * src/partenaire/components/dashboard/DashTopHotels.jsx
 * =======================================================
 * Top 5 hôtels du partenaire classés par revenu du mois.
 * Chaque ligne = rang + nom + ville/note + montant CA mois.
 * Les 3 premiers ont un médaillon coloré (or, argent, bronze).
 */

const fmt = (n) =>
  new Intl.NumberFormat("fr-TN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n ?? 0);

function HotelRow({ hotel, rank, onClick }) {
  return (
    <div
      className="pd-top-row"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick?.()}
    >
      <span className="pd-top-rank">{rank}</span>
      <div className="pd-top-info">
        <div className="pd-top-name">
          {hotel.hotel_nom || `Hôtel #${hotel.id_hotel}`}
        </div>
        <div className="pd-top-meta">
          <span>{hotel.hotel_ville || "—"}</span>
          {hotel.note_moyenne != null && (
            <>
              <span className="pd-resa-sep">·</span>
              <span className="pd-top-note">★ {hotel.note_moyenne.toFixed(1)}</span>
            </>
          )}
          {!hotel.hotel_actif && (
            <>
              <span className="pd-resa-sep">·</span>
              <span style={{ color: "var(--red)", fontWeight: 700 }}>inactif</span>
            </>
          )}
        </div>
      </div>
      <div className="pd-top-amount">
        <div>
          <span className="pd-top-amount-val">{fmt(hotel.revenu_mois)}</span>
          <span className="pd-top-amount-cur">DT</span>
        </div>
        <div className="pd-top-amount-sub">
          {hotel.nb_resas_mois ?? 0} résa
          {(hotel.nb_resas_mois ?? 0) > 1 ? "s" : ""} ce mois
        </div>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="pd-top-row">
      <div className="pd-skeleton-circle" style={{ width: 26, height: 26 }} />
      <div className="pd-top-info">
        <div className="pd-skeleton-line" style={{ width: "55%" }} />
        <div className="pd-skeleton-line" style={{ width: "35%", height: 10 }} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
export default function DashTopHotels({ hotels, loading, onNavigate }) {
  return (
    <section className="pd-card">
      <div className="pd-card-head">
        <div>
          <h3 className="pd-card-title">Top hôtels</h3>
          <p className="pd-card-sub">Par revenu du mois</p>
        </div>
        <button
          type="button"
          className="pd-link-all"
          onClick={() => onNavigate?.("hotels")}
        >
          Voir tout →
        </button>
      </div>

      <div className="pd-top-list">
        {loading && (!hotels || hotels.length === 0) ? (
          <>
            <SkeletonRow /><SkeletonRow /><SkeletonRow /><SkeletonRow />
          </>
        ) : !hotels || hotels.length === 0 ? (
          <div className="pd-empty">
            <div className="pd-empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            Aucun hôtel enregistré
          </div>
        ) : (
          hotels.map((h, i) => (
            <HotelRow
              key={h.id_hotel}
              hotel={h}
              rank={i + 1}
              onClick={() => onNavigate?.("hotels")}
            />
          ))
        )}
      </div>
    </section>
  );
}