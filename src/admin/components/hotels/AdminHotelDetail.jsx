import { useState, useEffect } from "react";
import "./AdminHotelDetail.css";

const BASE = "http://localhost:8000/api/v1";

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
  };
}

async function fetchJson(url) {
  const r = await fetch(url, { headers: authHeaders() });
  const text = await r.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }
  if (!r.ok) {
    const msg = data?.detail
      ? (typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail))
      : `Erreur ${r.status}`;
    throw new Error(msg);
  }
  return data;
}

// ── Lightbox ──────────────────────────────────────────────
function Lightbox({ images, startIndex, onClose }) {
  const [current, setCurrent] = useState(startIndex);
  useEffect(() => {
    const onKey = e => {
      if (e.key === "Escape")     onClose();
      if (e.key === "ArrowRight") setCurrent(c => (c + 1) % images.length);
      if (e.key === "ArrowLeft")  setCurrent(c => (c - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [images.length, onClose]);

  return (
    <div className="ahd-lightbox" onClick={onClose}>
      <button className="ahd-lb-close" onClick={onClose}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
      <div className="ahd-lb-counter">{current + 1} / {images.length}</div>
      {images.length > 1 && (
        <button className="ahd-lb-nav prev"
          onClick={e => { e.stopPropagation(); setCurrent(c => (c - 1 + images.length) % images.length); }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
      )}
      <div className="ahd-lb-img-wrap" onClick={e => e.stopPropagation()}>
        <img src={images[current].url} alt="" className="ahd-lb-img" />
        {images[current].type === "PRINCIPALE" && <div className="ahd-lb-badge">⭐ Principale</div>}
      </div>
      {images.length > 1 && (
        <button className="ahd-lb-nav next"
          onClick={e => { e.stopPropagation(); setCurrent(c => (c + 1) % images.length); }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      )}
      <div className="ahd-lb-thumbs" onClick={e => e.stopPropagation()}>
        {images.map((img, i) => (
          <button key={img.id || i} className={`ahd-lb-thumb ${i === current ? "active" : ""}`}
            onClick={() => setCurrent(i)}>
            <img src={img.url} alt="" />
          </button>
        ))}
      </div>
    </div>
  );
}

function Stars({ n }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24"
          fill={i <= n ? "#C4973A" : "none"} stroke={i <= n ? "#C4973A" : "#DDE3EC"} strokeWidth="1.5">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </div>
  );
}

// ── Carte dispo par TYPE de chambre (logique stock) ───────
function TypeDispoCard({ chambre }) {
  const nbTotal        = chambre.nb_total       ?? 0;
  const nbDisponibles  = chambre.nb_disponibles ?? 0;
  const nbReservees    = chambre.nb_reservees   ?? (nbTotal - nbDisponibles);
  const pct            = nbTotal > 0 ? Math.round((nbDisponibles / nbTotal) * 100) : 0;
  const toutesOccupees = nbDisponibles === 0;
  const barColor       = pct === 0 ? "#E05252" : pct < 30 ? "#E07B25" : "#27AE60";

  const fmt = d => new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });

  return (
    <div className={`ahd-dispo-card ${chambre.disponible ? "dispo" : "occupe"}`}>
      <div className={`ahd-dispo-bar ${chambre.disponible ? "dispo" : "occupe"}`} />
      <div className="ahd-dispo-card-body">

        {/* En-tête */}
        <div className="ahd-dispo-card-header">
          <span className="ahd-chambre-type">
            {chambre.type_chambre?.nom || `Type #${chambre.chambre_id}`}
            {chambre.capacite ? ` — ${chambre.capacite} pers.` : ""}
          </span>
          <span className={`ahd-dispo-badge ${chambre.disponible ? "dispo" : "occupe"}`}>
            {chambre.disponible ? "✓" : "✗"} {nbDisponibles}/{nbTotal}
          </span>
        </div>

        {/* Barre de progression */}
        <div style={{ margin: "8px 0 4px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4,
            fontFamily: "'Lato',sans-serif" }}>
            <span style={{ fontSize: "1.2rem", fontWeight: 800, color: barColor,
              fontFamily: "'Cormorant Garamond',serif" }}>{nbDisponibles}</span>
            <span style={{ fontSize: "0.78rem", color: "#8A9BB0" }}>/ {nbTotal} disponibles</span>
          </div>
          <div style={{ height: 5, background: "#F0F4F8", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: barColor,
              borderRadius: 3, transition: "width 0.4s" }} />
          </div>
        </div>

        {/* Badge invisible visiteurs */}
        {toutesOccupees && (
          <div style={{ marginTop: 6, padding: "4px 8px",
            background: "rgba(224,82,82,0.08)", border: "1px solid rgba(224,82,82,0.2)",
            borderRadius: 6, fontFamily: "'Lato',sans-serif", fontSize: "0.72rem",
            fontWeight: 700, color: "#C0392B" }}>
            🚫 Invisible pour visiteurs
          </div>
        )}

        {chambre.prix_min != null && (
          <div className="ahd-chambre-prix" style={{ marginTop: 6 }}>
            {Number(chambre.prix_min).toFixed(0)} TND/nuit
          </div>
        )}

        {/* ── Réservations actives avec N° FACTURE ou VOUCHER ── */}
        {nbReservees > 0 && chambre.occupations?.length > 0 && (
          <div className="ahd-occupations" style={{ marginTop: 8 }}>
            <div style={{ fontFamily: "'Lato',sans-serif", fontSize: "0.72rem",
              fontWeight: 700, color: "#E05252", textTransform: "uppercase",
              letterSpacing: "0.3px", marginBottom: 6,
              display: "flex", alignItems: "center", gap: 5 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                style={{ width: 12, height: 12 }}>
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {nbReservees} réservation{nbReservees > 1 ? "s" : ""} active{nbReservees > 1 ? "s" : ""}
            </div>

            {chambre.occupations.map((o, i) => {
              const isVisiteur = o.source === "visiteur";
              return (
                <div key={i} className="ahd-occ">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="3" y="4" width="18" height="18" rx="2"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  {fmt(o.date_debut)}
                  <span>→</span>
                  {fmt(o.date_fin)}
                  {/* N° facture (client) ou N° voucher (visiteur) */}
                  {o.numero_ref && (
                    <span style={{
                      marginLeft: "auto",
                      fontFamily: "'Lato',sans-serif",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      padding: "2px 7px",
                      borderRadius: 10,
                      whiteSpace: "nowrap",
                      background: isVisiteur ? "rgba(43,95,142,0.08)"        : "rgba(196,151,58,0.1)",
                      border:     isVisiteur ? "1px solid rgba(43,95,142,0.2)" : "1px solid rgba(196,151,58,0.25)",
                      color:      isVisiteur ? "#2B5F8E"                      : "#9A6E10",
                    }}>
                      {isVisiteur ? "👤" : "🏷️"} {o.numero_ref}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ══════════════════════════════════════════════════════════
export default function AdminHotelDetail({ hotelId, onBack }) {
  const [hotel,       setHotel]       = useState(null);
  const [images,      setImages]      = useState([]);
  const [chambres,    setChambres]    = useState([]);
  const [avis,        setAvis]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [activeTab,   setActiveTab]   = useState("info");
  const [lightboxIdx, setLightboxIdx] = useState(null);

  const [chambreSearch, setChambreSearch] = useState("");
  const [chambreCapMin, setChambreCapMin] = useState("");
  const [chambreType,   setChambreType]   = useState("");

  const today    = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
  const [dateDebut,    setDateDebut]    = useState(today);
  const [dateFin,      setDateFin]      = useState(tomorrow);
  const [dispoResult,  setDispoResult]  = useState(null);
  const [dispoLoading, setDispoLoading] = useState(false);
  const [dispoError,   setDispoError]   = useState("");

  useEffect(() => { loadAll(); }, [hotelId]);

  const loadAll = async () => {
    setLoading(true); setError("");
    try {
      const h = await fetchJson(`${BASE}/hotels/${hotelId}`);
      setHotel(h);
      const [imgs, chs, av] = await Promise.all([
        fetchJson(`${BASE}/hotels/${hotelId}/images`).catch(() => ({ items: [] })),
        fetchJson(`${BASE}/hotels/${hotelId}/chambres`).catch(() => ({ items: [] })),
        fetchJson(`${BASE}/hotels/${hotelId}/avis`).catch(() => ({ items: [] })),
      ]);
      const imgList = Array.isArray(imgs) ? imgs : imgs?.items || [];
      setImages([
        ...imgList.filter(i => i.type === "PRINCIPALE"),
        ...imgList.filter(i => i.type !== "PRINCIPALE"),
      ]);
      setChambres(Array.isArray(chs) ? chs : chs?.items || []);
      setAvis(Array.isArray(av) ? av : av?.items || []);
    } catch (err) {
      setError(err.message || "Impossible de charger cet hôtel");
    } finally { setLoading(false); }
  };

  const checkDispo = async () => {
    if (!dateDebut || !dateFin || dateFin <= dateDebut) return;
    setDispoLoading(true); setDispoError("");
    try {
      const q = new URLSearchParams({ date_debut: dateDebut, date_fin: dateFin });
      const data = await fetchJson(`${BASE}/hotels/${hotelId}/disponibilites?${q}`);
      setDispoResult(data);
    } catch (err) {
      setDispoError(err.message || "Erreur lors de la vérification");
    } finally { setDispoLoading(false); }
  };

  const typesUniques = [...new Set(chambres.map(c => c.type_chambre?.nom).filter(Boolean))];
  const chambresFiltrees = chambres.filter(c => {
    const matchSearch = !chambreSearch ||
      c.type_chambre?.nom?.toLowerCase().includes(chambreSearch.toLowerCase()) ||
      c.description?.toLowerCase().includes(chambreSearch.toLowerCase());
    const matchCap  = !chambreCapMin || c.capacite >= Number(chambreCapMin);
    const matchType = !chambreType   || c.type_chambre?.nom === chambreType;
    return matchSearch && matchCap && matchType;
  });

  // Stats globales dispo — basées sur le stock
  const totalDispos    = dispoResult?.chambres?.reduce((s, c) => s + (c.nb_disponibles ?? 0), 0) ?? 0;
  const totalChambres  = dispoResult?.chambres?.reduce((s, c) => s + (c.nb_total ?? 0), 0) ?? 0;
  const totalReservees = totalChambres - totalDispos;

  const mainImg = images[0]?.url;

  if (loading) return (
    <div className="ahd-loading">
      <div className="ahd-spinner-lg" />
      <p>Chargement de l'hôtel...</p>
    </div>
  );
  if (error) return (
    <div className="ahd-loading">
      <svg viewBox="0 0 24 24" fill="none" stroke="#E05252" strokeWidth="1.5" width="48" height="48">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <p style={{ color: "#E05252", fontWeight: 600 }}>{error}</p>
      <button className="ahd-back" onClick={onBack} style={{ marginTop: 8 }}>← Retour</button>
    </div>
  );
  if (!hotel) return null;

  const TABS = [
    { id: "info",     label: "Informations",                  icon: "🏨" },
    { id: "chambres", label: `Chambres (${chambres.length})`, icon: "🛏️" },
    { id: "dispo",    label: "Disponibilités",                 icon: "📅" },
    { id: "avis",     label: `Avis (${avis.length})`,         icon: "⭐" },
  ];

  return (
    <div className="ahd-root">
      {lightboxIdx !== null && images.length > 0 && (
        <Lightbox images={images} startIndex={lightboxIdx} onClose={() => setLightboxIdx(null)} />
      )}

      <button className="ahd-back" onClick={onBack}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Retour aux hôtels
      </button>

      {/* ── Hero ── */}
      <div className="ahd-hero">
        <div className="ahd-hero-img"
          style={{ cursor: mainImg ? "zoom-in" : "default" }}
          onClick={() => mainImg && setLightboxIdx(0)}>
          {mainImg ? <img src={mainImg} alt={hotel.nom} /> : <div className="ahd-hero-no-img">🏨</div>}
          <div className="ahd-hero-overlay" />
          <div className="ahd-hero-info">
            <div className="ahd-hero-badges">
              <span className={`ahd-statut ${hotel.actif ? "actif" : "inactif"}`}>
                {hotel.actif ? "● Actif" : "● Inactif"}
              </span>
              <span className="ahd-etoiles-badge">
                {"★".repeat(hotel.etoiles)} {hotel.etoiles} étoile{hotel.etoiles > 1 ? "s" : ""}
              </span>
            </div>
            <h1 className="ahd-hero-nom">{hotel.nom}</h1>
            <div className="ahd-hero-loc">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              {hotel.ville ? `${hotel.ville}, ` : ""}{hotel.pays}
            </div>
          </div>
        </div>
        <div className="ahd-hero-stats">
          <div className="ahd-stat">
            <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.5rem", fontWeight: 700, color: "#C4973A" }}>
              {hotel.note_moyenne > 0 ? hotel.note_moyenne.toFixed(1) : "—"}
            </span>
            <span style={{ fontFamily: "'Lato',sans-serif", fontSize: "0.72rem", color: "#8A9BB0", textTransform: "uppercase", letterSpacing: "0.5px" }}>Note</span>
            <div className="ahd-stat-sep" />
          </div>
          <div className="ahd-stat">
            <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.5rem", fontWeight: 700, color: "#1A3F63" }}>
              {chambres.reduce((s, c) => s + (c.nb_chambres ?? 1), 0)}
            </span>
            <span style={{ fontFamily: "'Lato',sans-serif", fontSize: "0.72rem", color: "#8A9BB0", textTransform: "uppercase", letterSpacing: "0.5px" }}>Chambres</span>
            <div className="ahd-stat-sep" />
          </div>
          <div className="ahd-stat">
            <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.5rem", fontWeight: 700, color: "#1A3F63" }}>{images.length}</span>
            <span style={{ fontFamily: "'Lato',sans-serif", fontSize: "0.72rem", color: "#8A9BB0", textTransform: "uppercase", letterSpacing: "0.5px" }}>Photos</span>
          </div>
        </div>
      </div>

      {/* ── Onglets ── */}
      <div className="ahd-tabs">
        {TABS.map(t => (
          <button key={t.id} className={`ahd-tab ${activeTab === t.id ? "active" : ""}`}
            onClick={() => setActiveTab(t.id)}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      <div className="ahd-content">

        {/* ══ INFORMATIONS ══ */}
        {activeTab === "info" && (
          <div className="ahd-info-layout">
            <div className="ahd-info-top">
              <div className="ahd-card ahd-card-details">
                <h3 className="ahd-card-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  Informations générales
                </h3>
                <div className="ahd-info-list">
                  {[
                    { key: "Nom",            val: hotel.nom },
                    { key: "Ville",          val: hotel.ville || "—" },
                    { key: "Pays",           val: `🇹🇳 ${hotel.pays}` },
                    { key: "Adresse",        val: hotel.adresse || "—" },
                    { key: "Classification", val: <Stars n={hotel.etoiles} /> },
                    { key: "Note moyenne",   val: hotel.note_moyenne > 0
                        ? <span className="ahd-note-gold">{hotel.note_moyenne.toFixed(1)} / 5 ★</span>
                        : <span className="ahd-no-note">Aucun avis</span>
                    },
                    { key: "Statut", val: (
                        <span className={`ahd-statut-inline ${hotel.actif ? "actif" : "inactif"}`}>
                          {hotel.actif ? "● Actif" : "● Inactif"}
                        </span>
                    )},
                    { key: "Mis en avant", val: hotel.mis_en_avant ? "✅ Oui" : "Non" },
                  ].map(row => (
                    <div key={row.key} className="ahd-info-row">
                      <span className="ahd-info-key">{row.key}</span>
                      <span className="ahd-info-val">{row.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="ahd-info-right-col">
                <div className="ahd-card ahd-part-compact-card">
                  <div className="ahd-part-compact-header">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                    </svg>
                    Partenaire propriétaire
                  </div>
                  {hotel.partenaire ? (
                    <div className="ahd-part-compact-body">
                      <div className="ahd-part-compact-avatar">
                        {hotel.partenaire.prenom?.[0]}{hotel.partenaire.nom?.[0]}
                      </div>
                      <div className="ahd-part-compact-info">
                        <span className="ahd-part-compact-nom">{hotel.partenaire.prenom} {hotel.partenaire.nom}</span>
                        <span className="ahd-part-compact-email">{hotel.partenaire.email}</span>
                        <div className="ahd-part-compact-meta">
                          <span className="ahd-part-compact-badge">PARTENAIRE</span>
                          <span className="ahd-part-compact-id">#{hotel.partenaire.id}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="ahd-part-none">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                      </svg>
                      <span>Aucun partenaire associé</span>
                    </div>
                  )}
                </div>
                {hotel.description && (
                  <div className="ahd-card">
                    <h3 className="ahd-card-title">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <line x1="8" y1="6" x2="21" y2="6"/>
                        <line x1="8" y1="12" x2="21" y2="12"/>
                        <line x1="8" y1="18" x2="21" y2="18"/>
                        <line x1="3" y1="6" x2="3.01" y2="6"/>
                        <line x1="3" y1="12" x2="3.01" y2="12"/>
                        <line x1="3" y1="18" x2="3.01" y2="18"/>
                      </svg>
                      Description
                    </h3>
                    <p className="ahd-desc" style={{ padding: "0 22px 18px" }}>{hotel.description}</p>
                  </div>
                )}
              </div>
            </div>

            {images.length > 0 && (
              <div className="ahd-card">
                <h3 className="ahd-card-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  Photos ({images.length})
                </h3>
                <div className="ahd-photos-grid" style={{ padding: "0 16px 16px" }}>
                  {images.map((img, i) => (
                    <div key={img.id || i} className="ahd-photo" style={{ cursor: "zoom-in" }}
                      onClick={() => setLightboxIdx(i)}>
                      <img src={img.url} alt="" />
                      <div className="ahd-photo-overlay">
                        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" width="20" height="20">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      </div>
                      {img.type === "PRINCIPALE" && <span className="ahd-photo-badge">⭐ Principale</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ CHAMBRES ══ */}
        {activeTab === "chambres" && (
          <div className="ahd-chambres-section">
            <div className="ahd-ch-filters">
              <div className="ahd-ch-search">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input value={chambreSearch} onChange={e => setChambreSearch(e.target.value)}
                  placeholder="Rechercher une chambre..." />
                {chambreSearch && <button className="ahd-ch-clear" onClick={() => setChambreSearch("")}>✕</button>}
              </div>
              <select className="ahd-ch-select" value={chambreType} onChange={e => setChambreType(e.target.value)}>
                <option value="">Tous les types</option>
                {typesUniques.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select className="ahd-ch-select" value={chambreCapMin} onChange={e => setChambreCapMin(e.target.value)}>
                <option value="">Capacité min.</option>
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <option key={n} value={n}>{n}+ personne{n > 1 ? "s" : ""}</option>
                ))}
              </select>
              {(chambreSearch || chambreType || chambreCapMin) && (
                <button className="ahd-ch-reset"
                  onClick={() => { setChambreSearch(""); setChambreType(""); setChambreCapMin(""); }}>
                  Réinitialiser
                </button>
              )}
              <span className="ahd-ch-count">
                {chambresFiltrees.length} type{chambresFiltrees.length > 1 ? "s" : ""}
                {" · "}{chambresFiltrees.reduce((s, c) => s + (c.nb_chambres ?? 1), 0)} chambres
              </span>
            </div>

            {chambres.length === 0 ? (
              <div className="ahd-empty"><span>🛏️</span><p>Aucune chambre enregistrée</p></div>
            ) : chambresFiltrees.length === 0 ? (
              <div className="ahd-empty"><span>🔍</span><p>Aucune chambre ne correspond aux filtres</p></div>
            ) : (
              <div className="ahd-chambres-grid">
                {chambresFiltrees.map(ch => (
                  <div key={ch.id} className="ahd-chambre-card">
                    <div className="ahd-chambre-header">
                      <span className="ahd-chambre-type">{ch.type_chambre?.nom || "—"}</span>
                      <span className={`ahd-chambre-statut ${ch.actif ? "actif" : "inactif"}`}>
                        {ch.actif ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="ahd-chambre-body">
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6,
                        fontFamily: "'Lato',sans-serif", fontSize: "0.82rem" }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="#1A3F63" strokeWidth="1.8"
                          style={{ width: 14, height: 14 }}>
                          <rect x="3" y="3" width="7" height="7" rx="1"/>
                          <rect x="14" y="3" width="7" height="7" rx="1"/>
                          <rect x="3" y="14" width="7" height="7" rx="1"/>
                          <rect x="14" y="14" width="7" height="7" rx="1"/>
                        </svg>
                        <strong style={{ color: "#1A3F63" }}>{ch.nb_chambres ?? 1}</strong>
                        <span style={{ color: "#8A9BB0" }}>chambre{(ch.nb_chambres ?? 1) > 1 ? "s" : ""} au total</span>
                      </div>
                      <div className="ahd-chambre-info">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                          <circle cx="9" cy="7" r="4"/>
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                        {ch.capacite} personne{ch.capacite > 1 ? "s" : ""} / chambre
                      </div>
                      {ch.description && <p className="ahd-chambre-desc">{ch.description}</p>}
                      {ch.prix_min != null && (
                        <div className="ahd-chambre-prix">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <line x1="12" y1="1" x2="12" y2="23"/>
                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                          </svg>
                          {ch.prix_min === ch.prix_max
                            ? `${Number(ch.prix_min).toFixed(0)} TND/nuit`
                            : `${Number(ch.prix_min).toFixed(0)} – ${Number(ch.prix_max).toFixed(0)} TND/nuit`}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ DISPONIBILITÉS ══ */}
        {activeTab === "dispo" && (
          <div className="ahd-dispo-section">
            <div className="ahd-dispo-search">
              <div className="ahd-dispo-search-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <div>
                <h3>Vérifier les disponibilités</h3>
                <p>Stock disponible par type de chambre sur une période donnée</p>
              </div>
              <div className="ahd-dispo-fields">
                <div className="ahd-date-field">
                  <label>Arrivée</label>
                  <input type="date" value={dateDebut} min={today}
                    onChange={e => setDateDebut(e.target.value)} />
                </div>
                <span className="ahd-dispo-arrow">→</span>
                <div className="ahd-date-field">
                  <label>Départ</label>
                  <input type="date" value={dateFin} min={dateDebut}
                    onChange={e => setDateFin(e.target.value)} />
                </div>
                <button className="ahd-dispo-btn" onClick={checkDispo} disabled={dispoLoading}>
                  {dispoLoading ? <span className="ahd-spinner-sm" /> : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"/>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                      </svg>
                      Rechercher
                    </>
                  )}
                </button>
              </div>
            </div>

            {dispoError && (
              <div style={{ color: "#E05252", padding: "12px 16px",
                background: "rgba(224,82,82,0.08)", borderRadius: 10,
                fontFamily: "'Lato',sans-serif", fontSize: "0.88rem" }}>
                ⚠️ {dispoError}
              </div>
            )}

            {dispoResult && (
              <>
                {/* Stats — basées sur le STOCK, pas le nombre de types */}
                <div className="ahd-dispo-summary">
                  {[
                    { cls: "dispo",  num: totalDispos,    lbl: "Chambres dispo." },
                    { cls: "occupe", num: totalReservees, lbl: "Réservées" },
                    { cls: "total",  num: totalChambres,  lbl: "Total" },
                  ].map(s => (
                    <div key={s.cls} className={`ahd-dispo-sum-item ${s.cls}`}>
                      <span className="ahd-dispo-sum-num">{s.num}</span>
                      <span>{s.lbl}</span>
                    </div>
                  ))}
                </div>

                {/* Grille des types avec barre de progression et N° facture/voucher */}
                <div className="ahd-dispo-grid">
                  {dispoResult.chambres?.map(ch => (
                    <TypeDispoCard key={ch.chambre_id} chambre={ch} />
                  ))}
                </div>
              </>
            )}

            {!dispoResult && !dispoLoading && !dispoError && (
              <div className="ahd-empty">
                <span>📅</span>
                <p>Sélectionnez une période pour voir le stock disponible</p>
              </div>
            )}
          </div>
        )}

        {/* ══ AVIS ══ */}
        {activeTab === "avis" && (
          <div className="ahd-avis-list">
            {avis.length === 0 ? (
              <div className="ahd-empty"><span>⭐</span><p>Aucun avis pour cet hôtel</p></div>
            ) : (
              avis.map(a => (
                <div key={a.id} className="ahd-avis-card">
                  <div className="ahd-avis-header">
                    <div className="ahd-avis-avatar">
                      {(a.client?.prenom?.[0] || "?").toUpperCase()}
                    </div>
                    <div className="ahd-avis-meta">
                      <span className="ahd-avis-name">{a.client?.prenom || "Client"} {a.client?.nom || ""}</span>
                      <span className="ahd-avis-date">
                        {new Date(a.date || a.created_at).toLocaleDateString("fr-FR", {
                          day: "2-digit", month: "short", year: "numeric",
                        })}
                      </span>
                    </div>
                    <Stars n={a.note} />
                  </div>
                  {a.commentaire && <p className="ahd-avis-text">{a.commentaire}</p>}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}