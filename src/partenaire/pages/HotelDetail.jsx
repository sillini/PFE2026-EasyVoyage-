import { useState, useEffect } from "react";
import { hotelsApi, imagesApi } from "../services/api";
import "./HotelDetail.css";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

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

// ══════════════════════════════════════════════════════════
//  ClassifBar — barre de classification positif/neutre/négatif
// ══════════════════════════════════════════════════════════
function ClassifBar({ label, count, pct, color, icon }) {
  return (
    <div className="ai-classif-row">
      <div className="ai-classif-left">
        <span>{icon}</span>
        <span className="ai-classif-lbl">{label}</span>
      </div>
      <div className="ai-classif-track">
        <div className="ai-classif-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="ai-classif-count">{count} ({pct}%)</span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  AIReportCard — rapport d'analyse IA
// ══════════════════════════════════════════════════════════
function AIReportCard({ report, onClose }) {
  if (!report) return null;

  const scoreColor =
    report.score_satisfaction >= 75 ? "#27AE60" :
    report.score_satisfaction >= 50 ? "#C4973A" :
    "#C0392B";

  const sentimentEmoji = {
    "positif": "😊",
    "neutre":  "😐",
    "négatif": "😞",
    "negatif": "😞",
  }[report.sentiment_dominant?.toLowerCase()] || "📊";

  const total = report.classification.positif + report.classification.neutre + report.classification.negatif;
  const pct = (n) => total > 0 ? Math.round((n / total) * 100) : 0;

  return (
    <div className="ai-report">
      {/* Header */}
      <div className="ai-report-header">
        <div className="ai-report-badge">
          <span className="ai-report-icon">✨</span>
          <div>
            <span className="ai-report-label">ANALYSE IA — CLAUDE</span>
            <span className="ai-report-sub">Rapport généré à partir de {report.nb_avis} avis</span>
          </div>
        </div>
        <button className="ai-report-close" onClick={onClose} title="Fermer">✕</button>
      </div>

      {/* Hero : score circulaire + sentiment */}
      <div className="ai-report-hero">
        <div className="ai-score-circle">
          <svg viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" fill="none" stroke="#EEF2F8" strokeWidth="10"/>
            <circle
              cx="60" cy="60" r="52" fill="none"
              stroke={scoreColor} strokeWidth="10" strokeLinecap="round"
              strokeDasharray={`${(report.score_satisfaction / 100) * 326.7} 326.7`}
              transform="rotate(-90 60 60)"
            />
          </svg>
          <div className="ai-score-inner">
            <span className="ai-score-val" style={{ color: scoreColor }}>
              {report.score_satisfaction}
            </span>
            <span className="ai-score-lbl">/100</span>
          </div>
        </div>

        <div className="ai-hero-details">
          <div className="ai-sentiment">
            <span className="ai-sentiment-emoji">{sentimentEmoji}</span>
            <div>
              <span className="ai-sentiment-lbl">Sentiment dominant</span>
              <span className="ai-sentiment-val">{report.sentiment_dominant}</span>
            </div>
          </div>
          <div className="ai-note-info">
            ⭐ Note moyenne : <strong>{report.note_moyenne} / 5</strong>
          </div>
        </div>
      </div>

      {/* Résumé global */}
      <div className="ai-section">
        <h4 className="ai-section-title">📝 Résumé global</h4>
        <p className="ai-resume">{report.resume_global}</p>
      </div>

      {/* Classification */}
      <div className="ai-section">
        <h4 className="ai-section-title">📊 Classification des avis</h4>
        <div className="ai-classif-bars">
          <ClassifBar label="Positifs" count={report.classification.positif} pct={pct(report.classification.positif)} color="#27AE60" icon="👍" />
          <ClassifBar label="Neutres"  count={report.classification.neutre}  pct={pct(report.classification.neutre)}  color="#C4973A" icon="😐" />
          <ClassifBar label="Négatifs" count={report.classification.negatif} pct={pct(report.classification.negatif)} color="#C0392B" icon="👎" />
        </div>
      </div>

      {/* Grid positifs / négatifs */}
      <div className="ai-pn-grid">
        <div className="ai-pn-card ai-pn-positive">
          <h4 className="ai-section-title">✅ Points forts</h4>
          {report.points_positifs.length === 0 ? (
            <p className="ai-empty-list">Aucun point fort identifié</p>
          ) : (
            <ul className="ai-pn-list">
              {report.points_positifs.map((p, i) => (
                <li key={i}><span className="ai-check">+</span>{p}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="ai-pn-card ai-pn-negative">
          <h4 className="ai-section-title">⚠️ Points à améliorer</h4>
          {report.points_negatifs.length === 0 ? (
            <p className="ai-empty-list">Aucun point négatif identifié 🎉</p>
          ) : (
            <ul className="ai-pn-list">
              {report.points_negatifs.map((p, i) => (
                <li key={i}><span className="ai-cross">−</span>{p}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Recommandations */}
      <div className="ai-section ai-reco-section">
        <h4 className="ai-section-title">💡 Recommandations pour vous</h4>
        <div className="ai-reco-list">
          {report.recommandations.map((r, i) => (
            <div key={i} className="ai-reco-item">
              <span className="ai-reco-num">{i + 1}</span>
              <span>{r}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="ai-report-footer">
        <span>🤖 Généré par Claude AI · Analyse basée sur {report.nb_avis} avis clients</span>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// Page principale
// ══════════════════════════════════════════════════════════
export default function HotelDetail({ hotelId, onBack }) {
  const [hotel,   setHotel]   = useState(null);
  const [images,  setImages]  = useState([]);
  const [avis,    setAvis]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  // ── États IA ───────────────────────────────────────────
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError,   setAiError]   = useState("");
  const [aiReport,  setAiReport]  = useState(null);

  useEffect(() => { loadAll(); }, [hotelId]);

  const loadAll = async () => {
    setLoading(true);
    setError("");
    try {
      const hotelData = await hotelsApi.get(hotelId);
      setHotel(hotelData);

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
      setError(err.message || "Impossible de charger les détails de l'hôtel");
    } finally {
      setLoading(false);
    }
  };

  // ── Génération du rapport IA ───────────────────────────
  const handleGenerateAIReport = async () => {
    setAiError("");
    setAiLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${BASE}/hotels/partenaire/${hotelId}/avis/analyse-ia`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
      });
      const text = await res.text();
      let data;
      try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }
      if (!res.ok) {
        const msg = data?.detail
          ? (typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail))
          : `Erreur ${res.status}`;
        throw new Error(msg);
      }
      setAiReport(data);
      // Auto-scroll vers le rapport après génération
      setTimeout(() => {
        document.querySelector(".ai-report")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    } catch (e) {
      setAiError(e.message || "Impossible de générer le rapport");
    } finally {
      setAiLoading(false);
    }
  };

  const handleCloseReport = () => {
    setAiReport(null);
    setAiError("");
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
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <div>
                <span className="quick-label">Statut</span>
                <span className={`quick-value ${hotel.actif ? "status-actif" : "status-inactif"}`}>
                  {hotel.actif ? "Actif" : "Inactif"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Colonne droite — Infos */}
        <div className="detail-right">
          {/* Header */}
          <div className="detail-head">
            <div className="detail-head-top">
              <h1 className="detail-nom">{hotel.nom}</h1>
              <Stars count={hotel.etoiles} />
            </div>

            {/* Note moyenne */}
            <div className="detail-note-block">
              <div className="note-badge-big">
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
            <div className="avis-section-header">
              <h3 className="section-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                Avis clients
                {avis.length > 0 && (
                  <span className="avis-count-badge">{avis.length}</span>
                )}
              </h3>

              {/* ── Bouton IA — visible uniquement si avis disponibles ── */}
              {avis.length > 0 && (
                <button
                  type="button"
                  className={`ai-generate-btn ${aiLoading ? "is-loading" : ""}`}
                  onClick={handleGenerateAIReport}
                  disabled={aiLoading}
                  title="Analyser tous les avis avec Claude IA"
                >
                  {aiLoading ? (
                    <>
                      <span className="ai-spinner" />
                      Analyse en cours…
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                           strokeWidth="2" width="14" height="14">
                        <path d="M12 2l2.09 6.26L20 9l-5 4.87L16.18 20 12 16.77 7.82 20 9 13.87 4 9l5.91-.74L12 2z"/>
                      </svg>
                      {aiReport ? "Régénérer le rapport IA" : "Générer un rapport IA"}
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Erreur IA */}
            {aiError && (
              <div className="ai-error-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {aiError}
              </div>
            )}

            {/* Rapport IA */}
            {aiReport && (
              <AIReportCard report={aiReport} onClose={handleCloseReport} />
            )}

            {/* Liste d'avis */}
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