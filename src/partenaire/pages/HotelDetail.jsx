import { useState, useEffect } from "react";
import { hotelsApi, imagesApi } from "../services/api";
import "./HotelDetail.css";

// ── Carousel d'images ─────────────────────────────────────
function ImageCarousel({ images }) {
  const [current, setCurrent] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="carousel-empty">
        <span>🏨</span>
        <p>Aucune photo disponible</p>
      </div>
    );
  }

  const prev = () => setCurrent((c) => (c - 1 + images.length) % images.length);
  const next = () => setCurrent((c) => (c + 1) % images.length);

  return (
    <div className="carousel">
      <div className="carousel-main">
        <img
          key={current}
          src={images[current].url}
          alt={`Photo ${current + 1}`}
          className="carousel-img"
        />
        <div className="carousel-overlay" />
        <div className="carousel-badge">
          {images[current].type === "PRINCIPALE" ? "⭐ Principale" : images[current].type}
        </div>
        <div className="carousel-counter">
          {current + 1} / {images.length}
        </div>
        {images.length > 1 && (
          <>
            <button className="carousel-btn prev" onClick={prev}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <button className="carousel-btn next" onClick={next}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="carousel-thumbs">
          {images.map((img, i) => (
            <button
              key={img.id || i}
              className={`thumb ${i === current ? "active" : ""}`}
              onClick={() => setCurrent(i)}
            >
              <img src={img.url} alt={`thumb ${i + 1}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Étoiles ───────────────────────────────────────────────
function Stars({ count, size = "md" }) {
  return (
    <div className={`stars stars-${size}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= count ? "star filled" : "star"}>★</span>
      ))}
    </div>
  );
}

// ── Carte avis ────────────────────────────────────────────
function AvisCard({ avis }) {
  const dateStr = avis.date || avis.created_at;
  return (
    <div className="avis-card">
      <div className="avis-header">
        <div className="avis-avatar">
          {avis.client?.prenom?.[0] || avis.id_client?.toString().slice(-2) || "?"}
        </div>
        <div className="avis-meta">
          <span className="avis-client">
            {avis.client ? `${avis.client.prenom} ${avis.client.nom}` : `Client #${avis.id_client}`}
          </span>
          <span className="avis-date">
            {dateStr ? new Date(dateStr).toLocaleDateString("fr-FR", {
              day: "numeric", month: "long", year: "numeric",
            }) : "—"}
          </span>
        </div>
        <div className="avis-note-badge">
          <span>★</span> {avis.note}/5
        </div>
      </div>
      {avis.commentaire && (
        <p className="avis-commentaire">"{avis.commentaire}"</p>
      )}
    </div>
  );
}

// ── Page principale ───────────────────────────────────────
export default function HotelDetail({ hotelId, onBack }) {
  const [hotel,   setHotel]   = useState(null);
  const [images,  setImages]  = useState([]);
  const [avis,    setAvis]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => { loadAll(); }, [hotelId]);

  const loadAll = async () => {
    setLoading(true);
    setError("");
    try {
      // ✅ D'abord charger l'hôtel seul — c'est le plus important
      const hotelData = await hotelsApi.get(hotelId);
      setHotel(hotelData);

      // ✅ Ensuite charger images et avis indépendamment
      // allSettled : même si l'un échoue, l'autre s'affiche quand même
      const [imgResult, avisResult] = await Promise.allSettled([
        imagesApi.list(hotelId),
        hotelsApi.getAvis(hotelId),
      ]);

      if (imgResult.status === "fulfilled") {
        const imgData = imgResult.value;
        const imgs    = Array.isArray(imgData) ? imgData : imgData?.items || [];
        setImages([
          ...imgs.filter(i => i.type === "PRINCIPALE"),
          ...imgs.filter(i => i.type !== "PRINCIPALE"),
        ]);
      }

      if (avisResult.status === "fulfilled") {
        const avisData = avisResult.value;
        setAvis(Array.isArray(avisData) ? avisData : avisData?.items || []);
      }

    } catch (err) {
      // Seul hotelsApi.get() peut déclencher cette erreur
      setError(err.message || "Impossible de charger les détails de l'hôtel");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="detail-loading">
      <div className="loading-spinner" />
      <p>Chargement de l'hôtel...</p>
    </div>
  );

  if (error) return (
    <div className="detail-error">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
        width="40" height="40" style={{ color: "#E05252" }}>
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <p>{error}</p>
      <button onClick={onBack}>← Retour</button>
    </div>
  );

  if (!hotel) return null;

  const noteGlobale = hotel.note_moyenne || 0;

  return (
    <div className="hotel-detail">
      {/* Bouton retour */}
      <button className="detail-back" onClick={onBack}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Retour à mes hôtels
      </button>

      <div className="detail-layout">
        {/* Colonne gauche — Carousel */}
        <div className="detail-left">
          <ImageCarousel images={images} />

          {/* Infos rapides */}
          <div className="detail-quick-info">
            <div className="quick-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <div>
                <span className="quick-label">Adresse</span>
                <span className="quick-value">{hotel.adresse || "—"}</span>
              </div>
            </div>
            <div className="quick-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <div>
                <span className="quick-label">Ville</span>
                <span className="quick-value">{hotel.ville || "—"}</span>
              </div>
            </div>
            <div className="quick-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              <div>
                <span className="quick-label">Pays</span>
                <span className="quick-value">🇹🇳 {hotel.pays}</span>
              </div>
            </div>
            <div className="quick-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <div>
                <span className="quick-label">Statut</span>
                <span className={`quick-value status-${hotel.actif ? "actif" : "inactif"}`}>
                  {hotel.actif ? "Actif" : "Inactif"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Colonne droite — Détails */}
        <div className="detail-right">
          {/* Header hôtel */}
          <div className="detail-header">
            <div className="detail-title-row">
              <h1 className="detail-nom">{hotel.nom}</h1>
              <Stars count={hotel.etoiles} size="lg" />
            </div>

            {/* Note globale */}
            <div className="detail-note-global">
              <div className="note-circle">
                <span className="note-num">
                  {noteGlobale > 0 ? noteGlobale.toFixed(1) : "—"}
                </span>
                <span className="note-max">/5</span>
              </div>
              <div className="note-details">
                <div className="note-stars-row">
                  <Stars count={Math.round(noteGlobale)} size="sm" />
                </div>
                <span className="note-count">
                  {avis.length} avis client{avis.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          {hotel.description && (
            <div className="detail-section">
              <h3 className="section-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
                Description
              </h3>
              <p className="detail-desc">{hotel.description}</p>
            </div>
          )}

          {/* Stats */}
          <div className="detail-stats">
            <div className="stat-box">
              <span className="stat-icon">🖼️</span>
              <span className="stat-num">{images.length}</span>
              <span className="stat-lbl">Photos</span>
            </div>
            <div className="stat-box">
              <span className="stat-icon">💬</span>
              <span className="stat-num">{avis.length}</span>
              <span className="stat-lbl">Avis</span>
            </div>
            <div className="stat-box">
              <span className="stat-icon">⭐</span>
              <span className="stat-num">{hotel.etoiles}</span>
              <span className="stat-lbl">Étoiles</span>
            </div>
            <div className="stat-box">
              <span className="stat-icon">📊</span>
              <span className="stat-num">
                {noteGlobale > 0 ? noteGlobale.toFixed(1) : "—"}
              </span>
              <span className="stat-lbl">Note moy.</span>
            </div>
          </div>

          {/* Avis */}
          <div className="detail-section">
            <h3 className="section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              Avis clients
              {avis.length > 0 && (
                <span className="avis-count-badge">{avis.length}</span>
              )}
            </h3>
            {avis.length === 0 ? (
              <div className="no-avis">
                <span>💬</span>
                <p>Aucun avis pour cet hôtel pour l'instant</p>
              </div>
            ) : (
              <div className="avis-list">
                {avis.map(a => <AvisCard key={a.id} avis={a} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}