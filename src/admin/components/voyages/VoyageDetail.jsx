import { useState, useEffect, useRef } from "react";
import "./VoyageDetail.css";

const BASE = "http://localhost:8000/api/v1";
function authHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("access_token")}` };
}
async function fetchJson(url) {
  const r = await fetch(url, { headers: authHeaders() });
  const t = await r.text();
  try { return JSON.parse(t); } catch { return {}; }
}

// ── Lightbox ──────────────────────────────────────────────
function Lightbox({ images, startIndex, onClose }) {
  const [current, setCurrent] = useState(startIndex);
  useEffect(() => {
    const h = e => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setCurrent(c => (c+1)%images.length);
      if (e.key === "ArrowLeft")  setCurrent(c => (c-1+images.length)%images.length);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [images.length, onClose]);

  return (
    <div className="vd-lb" onClick={onClose}>
      <button className="vd-lb-close" onClick={onClose}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
      <div className="vd-lb-counter">{current+1} / {images.length}</div>
      {images.length > 1 && <>
        <button className="vd-lb-nav prev" onClick={e=>{e.stopPropagation();setCurrent(c=>(c-1+images.length)%images.length);}}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <button className="vd-lb-nav next" onClick={e=>{e.stopPropagation();setCurrent(c=>(c+1)%images.length);}}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </>}
      <div className="vd-lb-img-wrap" onClick={e=>e.stopPropagation()}>
        <img key={current} src={images[current].url} alt="" className="vd-lb-img"/>
        {images[current].type==="PRINCIPALE" && <div className="vd-lb-badge">⭐ Principale</div>}
      </div>
      {images.length > 1 && (
        <div className="vd-lb-thumbs" onClick={e=>e.stopPropagation()}>
          {images.map((img,i) => (
            <button key={img.id} className={`vd-lb-thumb ${i===current?"active":""}`} onClick={()=>setCurrent(i)}>
              <img src={img.url} alt=""/>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function fmt(d, opts={day:"2-digit",month:"long",year:"numeric"}) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", opts);
}
function fmtShort(d) { return new Date(d).toLocaleDateString("fr-FR",{day:"2-digit",month:"short"}); }

export default function VoyageDetail({ voyageId, onBack }) {
  const [voyage, setVoyage]   = useState(null);
  const [images, setImages]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [lbIdx, setLbIdx]     = useState(null);
  const [activeTab, setActiveTab] = useState("apercu");

  useEffect(() => { loadAll(); }, [voyageId]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [v, imgs] = await Promise.all([
        fetchJson(`${BASE}/voyages/${voyageId}`),
        fetchJson(`${BASE}/voyages/${voyageId}/images`),
      ]);
      setVoyage(v);
      const list = Array.isArray(imgs) ? imgs : imgs?.items || [];
      setImages([...list.filter(i=>i.type==="PRINCIPALE"), ...list.filter(i=>i.type!=="PRINCIPALE")]);
    } finally { setLoading(false); }
  };

  if (loading) return (
    <div className="vd-loading">
      <div className="vd-loading-inner">
        <div className="vd-spinner-ring"/>
        <p>Chargement du voyage...</p>
      </div>
    </div>
  );
  if (!voyage) return null;

  const mainImg   = images[0]?.url;
  const isExpired = new Date(voyage.date_retour) < new Date();
  const isOngoing = new Date(voyage.date_depart) <= new Date() && new Date(voyage.date_retour) >= new Date();
  const statusLbl = isExpired ? "Terminé" : isOngoing ? "En cours" : "À venir";
  const statusCls = isExpired ? "expired" : isOngoing ? "ongoing" : "upcoming";

  const TABS = [
    { id:"apercu",  label:"Aperçu",        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> },
    { id:"photos",  label:`Photos (${images.length})`, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> },
    { id:"details", label:"Détails",        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> },
  ];

  return (
    <div className="vd-root">
      {lbIdx !== null && <Lightbox images={images} startIndex={lbIdx} onClose={()=>setLbIdx(null)}/>}

      {/* Breadcrumb + back */}
      <div className="vd-breadcrumb">
        <button className="vd-back" onClick={onBack}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Voyages
        </button>
        <span className="vd-breadcrumb-sep">/</span>
        <span className="vd-breadcrumb-current">{voyage.titre}</span>
      </div>

      {/* ══ HERO CINÉMATIQUE ══════════════════════════════ */}
      <div className="vd-hero-cinema">
        {/* Background image */}
        <div className="vd-hero-bg">
          {mainImg
            ? <img src={mainImg} alt="" className="vd-hero-bg-img"/>
            : <div className="vd-hero-bg-fallback"/>}
          <div className="vd-hero-bg-blur"/>
          <div className="vd-hero-bg-grad"/>
        </div>

        {/* Contenu héro */}
        <div className="vd-hero-body">
          {/* Gauche — infos */}
          <div className="vd-hero-left">
            <div className="vd-hero-tags">
              <span className={`vd-tag-status ${statusCls}`}>{statusLbl}</span>
              <span className={`vd-tag-actif ${voyage.actif?"actif":"inactif"}`}>
                <span className="vd-tag-dot"/>
                {voyage.actif ? "Actif" : "Inactif"}
              </span>
            </div>
            <h1 className="vd-hero-title">{voyage.titre}</h1>
            <div className="vd-hero-dest">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              {voyage.destination}
            </div>

            {/* Pills infos rapides */}
            <div className="vd-hero-pills">
              <div className="vd-pill">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span>{fmtShort(voyage.date_depart)} → {fmtShort(voyage.date_retour)}</span>
              </div>
              <div className="vd-pill">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                <span>{voyage.duree} jours</span>
              </div>
              <div className="vd-pill">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                </svg>
                <span>{voyage.capacite_max} pers. max</span>
              </div>
            </div>
          </div>

          {/* Droite — prix + admin */}
          <div className="vd-hero-right">
            {/* Prix */}
            <div className="vd-hero-prix-card">
              <span className="vd-hero-prix-label">Prix par personne</span>
              <div className="vd-hero-prix-val">
                <span className="vd-hero-prix-num">{Number(voyage.prix_base).toFixed(0)}</span>
                <span className="vd-hero-prix-unit">TND</span>
              </div>
              <span className="vd-hero-prix-sub">toutes taxes incluses</span>
            </div>

            {/* Admin créateur */}
            {voyage.admin && (
              <div className="vd-hero-admin-card">
                <div className="vd-hero-admin-avatar">
                  {voyage.admin.prenom?.[0]}{voyage.admin.nom?.[0]}
                </div>
                <div className="vd-hero-admin-info">
                  <span className="vd-hero-admin-label">Créé par</span>
                  <span className="vd-hero-admin-nom">{voyage.admin.prenom} {voyage.admin.nom}</span>
                  <span className="vd-hero-admin-email">{voyage.admin.email}</span>
                </div>
                <div className="vd-hero-admin-shield">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Image principale cliquable si disponible */}
        {mainImg && (
          <button className="vd-hero-zoom-btn" onClick={()=>setLbIdx(0)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
            Voir les photos ({images.length})
          </button>
        )}
      </div>

      {/* ══ ONGLETS ══════════════════════════════════════ */}
      <div className="vd-tabs-bar">
        {TABS.map(t => (
          <button key={t.id} className={`vd-tab ${activeTab===t.id?"active":""}`}
            onClick={()=>setActiveTab(t.id)}>
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ══ CONTENU ONGLETS ══════════════════════════════ */}

      {/* ── APERÇU ── */}
      {activeTab==="apercu" && (
        <div className="vd-apercu">
          {/* Description */}
          {voyage.description ? (
            <div className="vd-desc-card">
              <div className="vd-desc-deco"/>
              <div className="vd-desc-content">
                <h3>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/>
                    <line x1="21" y1="14" x2="3" y2="14"/><line x1="13" y1="18" x2="3" y2="18"/>
                  </svg>
                  Description du voyage
                </h3>
                <p>{voyage.description}</p>
              </div>
            </div>
          ) : (
            <div className="vd-no-desc">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/>
                <line x1="21" y1="14" x2="3" y2="14"/><line x1="13" y1="18" x2="3" y2="18"/>
              </svg>
              <p>Aucune description pour ce voyage</p>
            </div>
          )}

          {/* 4 KPIs */}
          <div className="vd-kpis">
            {[
              { icon:"📅", label:"Date de départ",  val: fmt(voyage.date_depart, {day:"numeric",month:"long",year:"numeric"}), accent:false },
              { icon:"🔄", label:"Date de retour",  val: fmt(voyage.date_retour, {day:"numeric",month:"long",year:"numeric"}), accent:false },
              { icon:"⏱️", label:"Durée totale",    val: `${voyage.duree} jours`, accent:false },
              { icon:"💰", label:"Prix / personne", val: `${Number(voyage.prix_base).toFixed(0)} TND`, accent:true },
            ].map((k,i) => (
              <div key={i} className={`vd-kpi ${k.accent?"accent":""}`}>
                <span className="vd-kpi-icon">{k.icon}</span>
                <span className="vd-kpi-label">{k.label}</span>
                <span className="vd-kpi-val">{k.val}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PHOTOS ── */}
      {activeTab==="photos" && (
        <div className="vd-photos-section">
          {images.length === 0 ? (
            <div className="vd-empty-photos">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
              </svg>
              <p>Aucune photo disponible pour ce voyage</p>
            </div>
          ) : (
            <>
              {/* Grande photo principale */}
              <div className="vd-photo-main" onClick={()=>setLbIdx(0)}>
                <img src={images[0].url} alt=""/>
                <div className="vd-photo-main-overlay">
                  <div className="vd-photo-main-center">
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                      <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
                    </svg>
                    <span>Agrandir</span>
                  </div>
                </div>
                <div className="vd-photo-main-badge">⭐ Photo principale</div>
              </div>

              {/* Grille secondaires */}
              {images.length > 1 && (
                <div className="vd-photos-grid-premium">
                  {images.slice(1).map((img,i) => (
                    <div key={img.id} className="vd-photo-thumb" onClick={()=>setLbIdx(i+1)}>
                      <img src={img.url} alt="" loading="lazy"/>
                      <div className="vd-photo-thumb-overlay">
                        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                      </div>
                      <span className="vd-photo-type-tag">{img.type}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── DÉTAILS ── */}
      {activeTab==="details" && (
        <div className="vd-details-section">
          {/* Fiche technique */}
          <div className="vd-details-card">
            <div className="vd-details-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              Fiche technique
            </div>
            <div className="vd-details-rows">
              {[
                { key:"Titre",          val: voyage.titre },
                { key:"Destination",    val: voyage.destination },
                { key:"Date de départ", val: fmt(voyage.date_depart) },
                { key:"Date de retour", val: fmt(voyage.date_retour) },
                { key:"Durée",          val: `${voyage.duree} jour${voyage.duree>1?"s":""}` },
                { key:"Capacité max",   val: `${voyage.capacite_max} personnes` },
                { key:"Prix de base",   val: `${Number(voyage.prix_base).toFixed(2)} TND / personne`, gold:true },
                { key:"Statut",         val: voyage.actif ? "Actif" : "Inactif", colored:true },
              ].map(row => (
                <div key={row.key} className="vd-detail-row">
                  <span className="vd-detail-key">{row.key}</span>
                  <span className={`vd-detail-val ${row.gold?"gold":""} ${row.colored?(voyage.actif?"green":"gray"):""}`}>
                    {row.val}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Admin + Historique */}
          <div className="vd-details-right">
            {/* Admin créateur pleine largeur */}
            <div className="vd-admin-full-card">
              <div className="vd-admin-full-header">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                Administrateur créateur
              </div>
              {voyage.admin ? (
                <div className="vd-admin-full-content">
                  <div className="vd-admin-full-avatar">
                    {voyage.admin.prenom?.[0]}{voyage.admin.nom?.[0]}
                  </div>
                  <div className="vd-admin-full-info">
                    <span className="vd-admin-full-nom">{voyage.admin.prenom} {voyage.admin.nom}</span>
                    <span className="vd-admin-full-email">{voyage.admin.email}</span>
                    <span className="vd-admin-full-id">ID #{voyage.admin.id}</span>
                  </div>
                  <span className="vd-admin-full-badge">ADMIN</span>
                </div>
              ) : (
                <div className="vd-admin-none">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/>
                  </svg>
                  <span>Non renseigné</span>
                </div>
              )}
            </div>

            {/* Historique */}
            <div className="vd-hist-card">
              <div className="vd-hist-header">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                Historique
              </div>
              <div className="vd-hist-timeline">
                <div className="vd-hist-item">
                  <div className="vd-hist-dot created"/>
                  <div>
                    <span className="vd-hist-label">Créé le</span>
                    <span className="vd-hist-date">{fmt(voyage.created_at)}</span>
                  </div>
                </div>
                <div className="vd-hist-line"/>
                <div className="vd-hist-item">
                  <div className="vd-hist-dot updated"/>
                  <div>
                    <span className="vd-hist-label">Dernière modification</span>
                    <span className="vd-hist-date">{fmt(voyage.updated_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}