import { useState, useEffect } from "react";
import { hotelsApi, imagesApi } from "../services/api";
import HotelModal    from "../components/hotels/HotelModal";
import ImageManager  from "../components/hotels/ImageManager";
import HotelDetail   from "./HotelDetail";
import "./MesHotels.css";

// ── Étoiles ───────────────────────────────────────────────
function StarRating({ count }) {
  return (
    <div className="star-rating">
      {[1,2,3,4,5].map(n => (
        <span key={n} className={n <= count ? "star filled" : "star"}>★</span>
      ))}
    </div>
  );
}

// ── Carte hôtel ───────────────────────────────────────────
function HotelCard({ hotel, onEdit, onImages, onView }) {
  const mainImage =
    hotel.images?.find(i => i.type === "PRINCIPALE")?.url ||
    hotel.images?.[0]?.url || null;

  return (
    <div className="hotel-card">
      <div className="hotel-card-image" onClick={() => onView(hotel)} style={{ cursor: "pointer" }}>
        {mainImage
          ? <img src={mainImage} alt={hotel.nom} loading="lazy" />
          : <div className="hotel-card-no-img"><span>🏨</span><p>Aucune photo</p></div>
        }
        <div className="hotel-card-badge"><StarRating count={hotel.etoiles} /></div>
        {!hotel.actif && <div className="hotel-inactive-tag">Inactif</div>}
      </div>

      <div className="hotel-card-body" onClick={() => onView(hotel)} style={{ cursor: "pointer" }}>
        <h3 className="hotel-card-nom">{hotel.nom}</h3>
        <div className="hotel-card-location">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          {hotel.ville || hotel.pays}
        </div>
        {hotel.note_moyenne > 0 && (
          <div className="hotel-card-note">
            <span className="note-star">★</span>
            <span className="note-val">{hotel.note_moyenne.toFixed(1)}</span>
            <span className="note-label">/5</span>
          </div>
        )}
        {hotel.description && <p className="hotel-card-desc">{hotel.description}</p>}
      </div>

      <div className="hotel-card-actions">
        <button className="btn-action btn-images" onClick={() => onImages(hotel)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          Photos
        </button>
        <button className="btn-action btn-edit" onClick={() => onEdit(hotel)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Modifier
        </button>
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────
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
    setLoading(true);
    setError("");
    try {
      // ✅ CORRECTION : mesHotels() → GET /hotels/mes-hotels
      // Filtre par JWT → retourne UNIQUEMENT les hôtels du partenaire connecté
      // ❌ AVANT : hotelsApi.list() → GET /hotels → retourne TOUS les hôtels
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

  return (
    <div className="hotels-page">
      {/* Header */}
      <div className="hotels-header">
        <div className="hotels-header-left">
          <h1 className="hotels-title">Mes Hôtels</h1>
          <p className="hotels-subtitle">
            {hotels.length} établissement{hotels.length !== 1 ? "s" : ""} enregistré{hotels.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button className="btn-add-hotel" onClick={openAdd}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Ajouter un hôtel
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="hotels-search-bar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par nom ou ville..."
        />
        {search && (
          <button onClick={() => setSearch("")} className="search-clear">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>

      {/* États */}
      {loading && (
        <div className="hotels-loading">
          <div className="loading-spinner" />
          <p>Chargement de vos hôtels...</p>
        </div>
      )}

      {!loading && error && (
        <div className="hotels-error">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
          <button onClick={loadHotels}>Réessayer</button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="hotels-empty">
          <div className="empty-icon">🏨</div>
          <h3>{search ? "Aucun résultat" : "Aucun hôtel enregistré"}</h3>
          <p>
            {search
              ? `Aucun hôtel ne correspond à "${search}"`
              : "Commencez par ajouter votre premier établissement"}
          </p>
          {!search && (
            <button className="btn-add-hotel" onClick={openAdd}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Ajouter mon premier hôtel
            </button>
          )}
        </div>
      )}

      {/* Grille */}
      {!loading && !error && filtered.length > 0 && (
        <div className="hotels-grid">
          {filtered.map(hotel => (
            <HotelCard
              key={hotel.id}
              hotel={hotel}
              onEdit={openEdit}
              onImages={openImages}
              onView={openDetail}
            />
          ))}
        </div>
      )}

      {/* Modals */}
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