/**
 * src/admin/components/dashboard/TopHotelsList.jsx
 * ==================================================
 * Top 5 hôtels par CA généré.
 *
 * Au clic sur une ligne, dispatche un évent custom 'navigate-hotel-detail'
 * (déjà écouté par AdminPartenaires.jsx pour ouvrir AdminHotelDetail).
 *
 * @prop {Array}    items   — top hôtels { id_hotel, hotel_nom, hotel_ville,
 *                            revenu_total, nb_reservations, partenaire_nom }
 * @prop {boolean}  loading
 */
import { fmt } from "../../services/formatters.js";

const MEDAL_COLORS = ["#C4973A", "#A8B4C4", "#B98058", "#7A93AE", "#7A93AE"];

function MedalCircle({ rank }) {
  return (
    <div
      className="ad-medal"
      style={{ background: MEDAL_COLORS[rank - 1] || "#7A93AE" }}
    >
      {rank}
    </div>
  );
}

function HotelRow({ hotel, rank, onClick }) {
  return (
    <div
      className="ad-top-row"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
    >
      <MedalCircle rank={rank} />
      <div className="ad-top-info">
        <div className="ad-top-name">{hotel.hotel_nom || "—"}</div>
        <div className="ad-top-meta">
          {hotel.hotel_ville || "—"} · {hotel.nb_reservations || 0} réservation{hotel.nb_reservations > 1 ? "s" : ""}
        </div>
      </div>
      <div className="ad-top-amount">
        {fmt(hotel.revenu_total)} <span className="ad-top-cur">DT</span>
      </div>
    </div>
  );
}

function SkeletonRow({ rank }) {
  return (
    <div className="ad-top-row">
      <div className="ad-skeleton-circle ad-skeleton-medal" />
      <div className="ad-top-info">
        <div className="ad-skeleton-line" style={{ width: "60%" }} />
        <div className="ad-skeleton-line" style={{ width: "40%", height: 10 }} />
      </div>
    </div>
  );
}

export default function TopHotelsList({ items, loading }) {
  return (
    <section className="ad-top-card">
      <div className="ad-card-head">
        <div>
          <h3 className="ad-card-title">Top hôtels par CA</h3>
          <p className="ad-card-sub">5 premiers — toutes périodes</p>
        </div>
      </div>

      <div className="ad-top-list">
        {loading && (!items || items.length === 0) && (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        )}

        {!loading && (!items || items.length === 0) && (
          <div className="ad-empty">
            <p>Aucune réservation enregistrée pour le moment</p>
            <small>Les hôtels apparaîtront ici dès la 1ère réservation confirmée</small>
          </div>
        )}

        {items?.map((h, i) => (
          <HotelRow
            key={h.id_hotel || i}
            hotel={h}
            rank={i + 1}
            onClick={() => {
              window.dispatchEvent(
                new CustomEvent("navigate-hotel-detail", {
                  detail: { hotelId: h.id_hotel },
                })
              );
            }}
          />
        ))}
      </div>
    </section>
  );
}