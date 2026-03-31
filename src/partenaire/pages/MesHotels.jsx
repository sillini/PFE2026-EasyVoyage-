import { useState, useEffect } from "react";
import { hotelsApi, imagesApi } from "../services/api";
import HotelModal    from "../components/hotels/HotelModal";
import ImageManager  from "../components/hotels/ImageManager";
import HotelDetail   from "./HotelDetail";
import "./MesHotels.css";

/* ── Étoiles ───────────────────────────────────────────── */
function StarRating({ count, size = "sm" }) {
  return (
    <div className={`mh-stars mh-stars-${size}`}>
      {[1,2,3,4,5].map(n => (
        <span key={n} className={n <= count ? "mh-star on" : "mh-star"}>★</span>
      ))}
    </div>
  );
}

/* ── Carte hôtel ────────────────────────────────────────── */
function HotelCard({ hotel, onEdit, onImages, onView, index }) {
  const mainImage =
    hotel.images?.find(i => i.type === "PRINCIPALE")?.url ||
    hotel.images?.[0]?.url || null;

  const nbPhotos = hotel.images?.length || 0;

  return (
    <div className="mh-card" style={{ animationDelay:`${index*0.08}s` }}>

      {/* Image */}
      <div className="mh-card-img" onClick={() => onView(hotel)}>
        {mainImage
          ? <img src={mainImage} alt={hotel.nom} loading="lazy" />
          : (
            <div className="mh-card-no-img">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.9" width="48" height="48">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              <p>Aucune photo</p>
            </div>
          )
        }
        {/* Overlay hover */}
        <div className="mh-card-img-overlay">
          <span className="mh-card-view-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            Voir les détails
          </span>
        </div>

        {/* Badges */}
        <div className="mh-card-stars-badge">
          <StarRating count={hotel.etoiles} />
        </div>
        {!hotel.actif && <div className="mh-inactive-tag">Inactif</div>}
        {nbPhotos > 0 && (
          <div className="mh-photos-count">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="11" height="11">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            {nbPhotos}
          </div>
        )}
      </div>

      {/* Corps */}
      <div className="mh-card-body" onClick={() => onView(hotel)}>
        <h3 className="mh-card-nom">{hotel.nom}</h3>
        <div className="mh-card-loc">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          {hotel.ville || hotel.pays}
        </div>
        {hotel.note_moyenne > 0 && (
          <div className="mh-card-note">
            <span className="mh-note-star">★</span>
            <span className="mh-note-val">{hotel.note_moyenne.toFixed(1)}</span>
            <span className="mh-note-max">/5</span>
          </div>
        )}
        {hotel.description && (
          <p className="mh-card-desc">{hotel.description}</p>
        )}
      </div>

      {/* Actions */}
      <div className="mh-card-footer">
        <button className="mh-btn-photos" onClick={() => onImages(hotel)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          Photos
          {nbPhotos > 0 && <span className="mh-btn-badge">{nbPhotos}</span>}
        </button>
        <button className="mh-btn-edit" onClick={() => onEdit(hotel)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Modifier
        </button>
      </div>
    </div>
  );
}

/* ── Page principale ────────────────────────────────────── */
export default function MesHotels() {
  const [hotels,          setHotels]          = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState("");
  const [showModal,       setShowModal]       = useState(false);
  const [editHotel,       setEditHotel]       = useState(null);
  const [imagesHotel,     setImagesHotel]     = useState(null);
  const [selectedHotelId, setSelectedHotelId] = useState(null);
  const [search,          setSearch]          = useState("");

  useEffect(() => { loadHotels(); }, []);

  const loadHotels = async () => {
    setLoading(true); setError("");
    try {
      const data = await hotelsApi.mesHotels({ actif_only: 0, per_page: 100 });
      const hotelsList = data?.items || [];
      const hotelsWithImages = await Promise.all(
        hotelsList.map(async hotel => {
          try {
            const imgData = await imagesApi.list(hotel.id);
            const images  = Array.isArray(imgData) ? imgData : imgData?.items || [];
            return { ...hotel, images };
          } catch {
            return { ...hotel, images: [] };
          }
        })
      );
      setHotels(hotelsWithImages);
    } catch (err) {
      setError(err.message || "Impossible de charger vos hôtels");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async form => {
    if (editHotel) await hotelsApi.update(editHotel.id, form);
    else           await hotelsApi.create(form);
    await loadHotels();
  };

  const openAdd    = ()    => { setEditHotel(null); setShowModal(true); };
  const openEdit   = hotel => { setEditHotel(hotel); setShowModal(true); };
  const openImages = hotel => setImagesHotel(hotel);
  const openDetail = hotel => setSelectedHotelId(hotel.id);

  if (selectedHotelId) {
    return (
      <HotelDetail
        hotelId={selectedHotelId}
        onBack={() => { setSelectedHotelId(null); loadHotels(); }}
      />
    );
  }

  const filtered = hotels.filter(h =>
    h.nom.toLowerCase().includes(search.toLowerCase()) ||
    (h.ville || h.pays || "").toLowerCase().includes(search.toLowerCase())
  );

  const nbActifs = hotels.filter(h => h.actif).length;

  return (
    <div className="mh-page">

      {/* ── Header ──────────────────────────────────────── */}
      <header className="mh-page-header">
        <div className="mh-title-block">
          <div className="mh-eyebrow">
            <span className="mh-eyebrow-dot" />
            Gestion de vos établissements
          </div>
          <h1 className="mh-page-title">Mes Hôtels</h1>
          <p className="mh-page-desc">
            {hotels.length} établissement{hotels.length !== 1 ? "s" : ""} enregistré{hotels.length !== 1 ? "s" : ""}
            {nbActifs < hotels.length && ` · ${nbActifs} actif${nbActifs !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button className="mh-btn-add" onClick={openAdd}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Ajouter un hôtel
        </button>
      </header>

      {/* ── KPI strip ───────────────────────────────────── */}
      {hotels.length > 0 && !loading && (
        <div className="mh-kpi-strip">
          {[
            {
              color:"blue", val:hotels.length, lbl:"Total", sub:"établissements",
              icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            },
            {
              color:"green", val:nbActifs, lbl:"Actifs", sub:"en ligne",
              icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><polyline points="9 11 12 14 22 4"/></svg>
            },
            {
              color:"gold", val:hotels.reduce((s,h) => s + (h.images?.length || 0), 0), lbl:"Photos", sub:"uploadées",
              icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            },
          ].map((k,i) => (
            <div key={i} className={`mh-kpi-card mh-kpi-${k.color}`}>
              <div className="mh-kpi-icon">{k.icon}</div>
              <div className="mh-kpi-body">
                <span className="mh-kpi-val">{k.val}</span>
                <span className="mh-kpi-lbl">{k.lbl}</span>
                <span className="mh-kpi-sub">{k.sub}</span>
              </div>
              <div className="mh-kpi-deco" />
            </div>
          ))}
        </div>
      )}

      {/* ── Toolbar ─────────────────────────────────────── */}
      <div className="mh-toolbar">
        <label className="mh-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou ville…"
          />
          {search && (
            <button className="mh-search-clear" onClick={() => setSearch("")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="10" height="10">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </label>
        {filtered.length > 0 && (
          <div className="mh-result-pill">
            <span className="mh-rp-num">{filtered.length}</span>
            <span className="mh-rp-lbl">hôtel{filtered.length !== 1 ? "s" : ""}</span>
          </div>
        )}
      </div>

      {/* ── États ───────────────────────────────────────── */}
      {loading && (
        <div className="mh-state-box">
          <div className="mh-loader"><div className="mh-loader-ring"/><div className="mh-loader-ring mh-lr2"/></div>
          <p>Chargement de vos hôtels…</p>
        </div>
      )}

      {!loading && error && (
        <div className="mh-error-bar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
          <button onClick={loadHotels}>Réessayer</button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="mh-state-box">
          <div className="mh-empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.7" width="64" height="64">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <h3>{search ? "Aucun résultat" : "Aucun hôtel enregistré"}</h3>
          <p>{search ? `Aucun hôtel ne correspond à "${search}"` : "Commencez par ajouter votre premier établissement"}</p>
          {!search && (
            <button className="mh-btn-add" onClick={openAdd}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Ajouter mon premier hôtel
            </button>
          )}
        </div>
      )}

      {/* ── Grille ──────────────────────────────────────── */}
      {!loading && !error && filtered.length > 0 && (
        <div className="mh-grid">
          {filtered.map((hotel, i) => (
            <HotelCard
              key={hotel.id}
              hotel={hotel}
              index={i}
              onEdit={openEdit}
              onImages={openImages}
              onView={openDetail}
            />
          ))}
        </div>
      )}

      {/* ── Modals ──────────────────────────────────────── */}
      {showModal && (
        <HotelModal
          hotel={editHotel}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
      {imagesHotel && (
        <ImageManager
          hotel={imagesHotel}
          onClose={() => { setImagesHotel(null); loadHotels(); }}
        />
      )}
    </div>
  );
}