import { useState, useEffect } from "react";
import { hotelsPublicApi, villesApi, fetchMainImage } from "../../services/api";
import "./HotelsSection.css";

// ── Card hôtel — toutes identiques ───────────────────────
function HotelCard({ hotel, onReserver }) {
  const [img,    setImg]    = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { fetchMainImage("hotel", hotel.id).then(setImg); }, [hotel.id]);

  return (
    <article className="hc-card" onClick={() => onReserver(hotel)} role="button" tabIndex={0}>

      {/* Image */}
      <div className="hc-img-wrap">
        {img ? (
          <img src={img} alt={hotel.nom} className="hc-img"
            onLoad={() => setLoaded(true)}
            style={{ opacity: loaded ? 1 : 0 }}/>
        ) : (
          <div className="hc-img-placeholder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
        )}
        <div className="hc-gradient"/>

        {/* Badges */}
        <div className="hc-badges-top">
          <div className="hc-stars-badge">{"★".repeat(hotel.etoiles)}</div>
          {hotel.note_moyenne > 0 && (
            <div className="hc-note-badge">
              <svg viewBox="0 0 24 24" fill="white"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              {parseFloat(hotel.note_moyenne).toFixed(1)}
            </div>
          )}
        </div>

        {hotel.mis_en_avant && (
          <div className="hc-featured-ribbon">
            <span>Sélection EasyVoyage</span>
          </div>
        )}
      </div>

      {/* Corps */}
      <div className="hc-body">
        <div className="hc-body-top">
          <div className="hc-body-left">
            <h3 className="hc-nom">{hotel.nom}</h3>
            <div className="hc-loc">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="10" r="3"/>
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              </svg>
              {hotel.ville || hotel.pays}
            </div>
          </div>
          <div className="hc-etoiles-sm">{"★".repeat(hotel.etoiles)}</div>
        </div>

        {hotel.description && <p className="hc-desc">{hotel.description}</p>}

        <div className="hc-cta">
          <span className="hc-cta-text">Voir les offres</span>
          <div className="hc-cta-arrow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </div>
        </div>
      </div>
    </article>
  );
}

function SkeletonCard() {
  return (
    <div className="hc-skeleton">
      <div className="hc-sk-img"/>
      <div className="hc-sk-body">
        <div className="hc-sk-line" style={{width:"65%", height:"16px"}}/>
        <div className="hc-sk-line" style={{width:"40%", height:"12px"}}/>
        <div className="hc-sk-line" style={{width:"55%", height:"12px"}}/>
      </div>
    </div>
  );
}

// ── Section ───────────────────────────────────────────────
export default function HotelsSection({ onReserver, searchParams }) {
  const [hotels,  setHotels]  = useState([]);
  const [villes,  setVilles]  = useState([]);
  const [filtre,  setFiltre]  = useState("tous");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Charger les villes — même si la migration n'est pas faite, on ignore l'erreur
    villesApi.list()
      .then(d => setVilles(Array.isArray(d) ? d.filter(v => v.actif) : []))
      .catch(() => setVilles([]));
  }, []);

  useEffect(() => { loadHotels(filtre); }, [filtre]);

  useEffect(() => {
    if (searchParams?.categorie === "hotels" && searchParams.ville) {
      setFiltre(searchParams.ville);
    }
  }, [searchParams]);

  const loadHotels = async (filtreActif) => {
    setLoading(true);
    let items = [];
    if (!filtreActif || filtreActif === "tous") {
      // 1. Hôtels mis en avant
      try { const r = await hotelsPublicApi.featured(); items = r?.items || []; } catch {}
      // 2. Fallback → tous hôtels actifs
      if (items.length === 0) {
        try { const r = await hotelsPublicApi.list({ per_page: 9 }); items = r?.items || []; } catch {}
      }
    } else {
      try {
        const r = await hotelsPublicApi.list({ ville: filtreActif, per_page: 9 });
        items = r?.items || [];
      } catch {}
    }
    setHotels(items);
    setLoading(false);
  };

  // Tabs : "Tous" + villes actives depuis l'admin
  const tabs = [{ id: "tous", label: "Tous" }, ...villes.map(v => ({ id: v.nom, label: v.nom }))];

  return (
    <section className="hs-root" id="hotels">
      <div className="hs-container">

        {/* En-tête */}
        <div className="hs-head">
          <div className="hs-head-left">
            <div className="hs-tag-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              <span>Hébergement</span>
            </div>
            <h2 className="hs-title">Nos Meilleurs Hôtels<br/><em>en Tunisie</em></h2>
            <p className="hs-subtitle">Réservez votre séjour au meilleur prix garanti — Sélection expertisée</p>
          </div>
          <div className="hs-head-deco">
            <div className="hs-deco-1"/>
            <div className="hs-deco-2"/>
          </div>
        </div>

        {/* Filtres villes */}
        {tabs.length > 1 && (
          <div className="hs-filters">
            {tabs.map(t => (
              <button key={t.id}
                className={`hs-chip ${filtre === t.id ? "hs-chip-on" : ""}`}
                onClick={() => {
                  setFiltre(t.id);
                  if (t.id === filtre) loadHotels(t.id); // re-déclenche si même valeur
                }}>
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Grille — toutes les cards identiques 3 colonnes */}
        {loading ? (
          <div className="hs-grid">
            {Array(6).fill(0).map((_,i) => <SkeletonCard key={i}/>)}
          </div>
        ) : hotels.length === 0 ? (
          <div className="hs-empty">
            <div className="hs-empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <h3>Aucun hôtel disponible</h3>
            <p>Aucun établissement pour cette destination pour le moment</p>
          </div>
        ) : (
          <div className="hs-grid">
            {hotels.map(h => (
              <HotelCard key={h.id} hotel={h} onReserver={onReserver}/>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}