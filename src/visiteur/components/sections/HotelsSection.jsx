import { useState, useEffect } from "react";
import { hotelsPublicApi, fetchMainImage } from "../../services/api";
import "./HotelsSection.css";

const VILLES_FILTRE = ["Tous","Hammamet","Sousse","Djerba","Tabarka","Monastir","Tunis","Sfax","Tozeur"];

// ── Card hôtel ────────────────────────────────────────────
function HotelCard({ hotel, onReserver }) {
  const [img, setImg]         = useState(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    fetchMainImage("hotel", hotel.id).then(setImg);
  }, [hotel.id]);

  return (
    <div className="hc-card">
      {/* Image */}
      <div className="hc-img-wrap">
        {img ? (
          <img
            src={img} alt={hotel.nom}
            onLoad={() => setImgLoaded(true)}
            style={{ opacity: imgLoaded ? 1 : 0 }}
          />
        ) : (
          <div className="hc-no-img">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.7">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
        )}
        {/* Badges */}
        <div className="hc-stars">{"★".repeat(hotel.etoiles)}</div>
        {hotel.note_moyenne > 0 && (
          <div className="hc-note">
            <svg viewBox="0 0 24 24" fill="white"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            {parseFloat(hotel.note_moyenne).toFixed(1)}
          </div>
        )}
      </div>

      {/* Corps */}
      <div className="hc-body">
        <h3 className="hc-nom">{hotel.nom}</h3>
        <div className="hc-loc">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          {hotel.ville || hotel.pays}
        </div>
        {hotel.description && <p className="hc-desc">{hotel.description}</p>}
      </div>

      {/* Footer */}
      <div className="hc-footer">
        <button className="hc-btn" onClick={() => onReserver(hotel)}>
          Voir les offres
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12"/>
            <polyline points="12 5 19 12 12 19"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="hc-card hc-skeleton">
      <div className="hc-skel-img"/>
      <div className="hc-skel-body">
        <div className="hc-skel-line long"/>
        <div className="hc-skel-line short"/>
        <div className="hc-skel-line medium"/>
      </div>
    </div>
  );
}

// ── Section ───────────────────────────────────────────────
export default function HotelsSection({ onReserver, searchParams }) {
  const [hotels, setHotels]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtre, setFiltre]   = useState("Tous");

  useEffect(() => {
    load();
  }, [filtre]);

  // Appliquer les paramètres de recherche externes
  useEffect(() => {
    if (searchParams?.categorie === "hotels") {
      if (searchParams.ville) setFiltre(searchParams.ville);
    }
  }, [searchParams]);

  const load = async () => {
    setLoading(true);
    try {
      const params = { per_page: 8 };
      if (filtre !== "Tous") params.ville = filtre;
      const d = await hotelsPublicApi.list(params);
      setHotels(d.items || []);
    } catch { setHotels([]); }
    finally { setLoading(false); }
  };

  return (
    <section className="hs-root" id="hotels">
      <div className="hs-inner">
        {/* En-tête */}
        <div className="hs-header">
          <div>
            <span className="hs-tag">🏨 Hébergement</span>
            <h2 className="hs-title">Nos Meilleurs Hôtels en Tunisie</h2>
            <p className="hs-sub">Réservez votre séjour au meilleur prix garanti</p>
          </div>
        </div>

        {/* Filtres villes */}
        <div className="hs-filtres">
          {VILLES_FILTRE.map(v => (
            <button
              key={v}
              className={`hs-filtre-btn ${filtre === v ? "active" : ""}`}
              onClick={() => setFiltre(v)}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Grille */}
        <div className="hs-grid">
          {loading
            ? Array(6).fill(0).map((_, i) => <SkeletonCard key={i}/>)
            : hotels.length === 0
              ? <div className="hs-empty">Aucun hôtel disponible pour cette destination</div>
              : hotels.map(h => (
                  <HotelCard key={h.id} hotel={h} onReserver={onReserver}/>
                ))
          }
        </div>
      </div>
    </section>
  );
}