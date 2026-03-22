import { useState, useEffect } from "react";

const BASE = "http://localhost:8000/api/v1";
function authHeaders() {
  return { "Content-Type":"application/json", Authorization:`Bearer ${localStorage.getItem("access_token")}` };
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
    const onKey = e => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setCurrent(c => (c+1) % images.length);
      if (e.key === "ArrowLeft")  setCurrent(c => (c-1+images.length) % images.length);
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
      <div className="ahd-lb-counter">{current+1} / {images.length}</div>

      {images.length > 1 && (
        <button className="ahd-lb-nav prev"
          onClick={e => { e.stopPropagation(); setCurrent(c => (c-1+images.length)%images.length); }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
      )}

      <div className="ahd-lb-img-wrap" onClick={e => e.stopPropagation()}>
        <img src={images[current].url} alt="" className="ahd-lb-img" />
        {images[current].type === "PRINCIPALE" && (
          <div className="ahd-lb-badge">⭐ Principale</div>
        )}
      </div>

      {images.length > 1 && (
        <button className="ahd-lb-nav next"
          onClick={e => { e.stopPropagation(); setCurrent(c => (c+1)%images.length); }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      )}

      <div className="ahd-lb-thumbs" onClick={e => e.stopPropagation()}>
        {images.map((img, i) => (
          <button key={img.id} className={`ahd-lb-thumb ${i===current?"active":""}`}
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
    <div style={{ display:"flex", gap:2 }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24"
          fill={i<=n?"#C4973A":"none"} stroke={i<=n?"#C4973A":"#DDE3EC"} strokeWidth="1.5">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </div>
  );
}

function StatusBadge({ dispo }) {
  return (
    <span className={`ahd-dispo-badge ${dispo?"dispo":"occupe"}`}>
      {dispo ? "✓ Disponible" : "✗ Occupée"}
    </span>
  );
}

export default function AdminHotelDetail({ hotelId, onBack }) {
  const [hotel, setHotel]       = useState(null);
  const [images, setImages]     = useState([]);
  const [chambres, setChambres] = useState([]);
  const [avis, setAvis]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState("info");

  // Lightbox
  const [lightboxIdx, setLightboxIdx] = useState(null);

  // Recherche chambres
  const [chambreSearch, setChambreSearch]   = useState("");
  const [chambreCapMin, setChambreCapMin]   = useState("");
  const [chambreType, setChambreType]       = useState("");

  // Disponibilité
  const today    = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now()+86400000).toISOString().split("T")[0];
  const [dateDebut, setDateDebut]     = useState(today);
  const [dateFin, setDateFin]         = useState(tomorrow);
  const [dispoResult, setDispoResult] = useState(null);
  const [dispoLoading, setDispoLoading] = useState(false);

  useEffect(() => { loadAll(); }, [hotelId]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [h, imgs, chs, av] = await Promise.all([
        fetchJson(`${BASE}/hotels/${hotelId}`),
        fetchJson(`${BASE}/hotels/${hotelId}/images`),
        fetchJson(`${BASE}/hotels/${hotelId}/chambres`),
        fetchJson(`${BASE}/hotels/${hotelId}/avis`),
      ]);
      setHotel(h);
      const imgList = Array.isArray(imgs) ? imgs : imgs?.items || [];
      setImages([...imgList.filter(i=>i.type==="PRINCIPALE"), ...imgList.filter(i=>i.type!=="PRINCIPALE")]);
      setChambres(Array.isArray(chs) ? chs : chs?.items || []);
      setAvis(Array.isArray(av) ? av : av?.items || []);
    } finally { setLoading(false); }
  };

  const checkDispo = async () => {
    if (!dateDebut || !dateFin || dateFin <= dateDebut) return;
    setDispoLoading(true);
    try {
      const q = new URLSearchParams({ date_debut: dateDebut, date_fin: dateFin });
      const data = await fetchJson(`${BASE}/hotels/${hotelId}/disponibilites?${q}`);
      setDispoResult(data);
    } finally { setDispoLoading(false); }
  };

  // Filtres chambres
  const typesUniques = [...new Set(chambres.map(c => c.type_chambre?.nom).filter(Boolean))];
  const chambresFiltrees = chambres.filter(c => {
    const matchSearch = !chambreSearch ||
      c.type_chambre?.nom?.toLowerCase().includes(chambreSearch.toLowerCase()) ||
      c.description?.toLowerCase().includes(chambreSearch.toLowerCase());
    const matchCap  = !chambreCapMin || c.capacite >= Number(chambreCapMin);
    const matchType = !chambreType   || c.type_chambre?.nom === chambreType;
    return matchSearch && matchCap && matchType;
  });

  const mainImg = images[0]?.url;

  if (loading) return (
    <div className="ahd-loading">
      <div className="ahd-spinner-lg"/>
      <p>Chargement de l'hôtel...</p>
    </div>
  );
  if (!hotel) return null;

  const TABS = [
    { id:"info",     label:"Informations",              icon:"🏨" },
    { id:"chambres", label:`Chambres (${chambres.length})`, icon:"🛏️" },
    { id:"dispo",    label:"Disponibilités",             icon:"📅" },
    { id:"avis",     label:`Avis (${avis.length})`,     icon:"⭐" },
  ];

  return (
    <div className="ahd-root">
      {lightboxIdx !== null && (
        <Lightbox images={images} startIndex={lightboxIdx} onClose={() => setLightboxIdx(null)} />
      )}

      <button className="ahd-back" onClick={onBack}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Retour aux hôtels
      </button>

      {/* Hero */}
      <div className="ahd-hero">
        <div className="ahd-hero-img" style={{ cursor: mainImg ? "zoom-in" : "default" }}
          onClick={() => mainImg && setLightboxIdx(0)}>
          {mainImg
            ? <img src={mainImg} alt={hotel.nom} />
            : <div className="ahd-hero-no-img"><span>🏨</span></div>}
          <div className="ahd-hero-overlay" />
          {mainImg && (
            <div className="ahd-hero-zoom-hint">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
              </svg>
              Cliquez pour agrandir
            </div>
          )}
          <div className="ahd-hero-info">
            <div className="ahd-hero-badges">
              <span className={`ahd-statut ${hotel.actif?"actif":"inactif"}`}>
                {hotel.actif ? "● Actif" : "● Inactif"}
              </span>
              <span className="ahd-etoiles-badge">{hotel.etoiles} ★</span>
              {images.length > 1 && (
                <span className="ahd-photos-count">{images.length} photos</span>
              )}
            </div>
            <h1 className="ahd-hero-nom">{hotel.nom}</h1>
            <div className="ahd-hero-loc">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              {hotel.ville ? `${hotel.ville}, Tunisie` : hotel.pays}
            </div>
          </div>
        </div>
        <div className="ahd-hero-stats">
          {[
            { num: hotel.note_moyenne > 0 ? hotel.note_moyenne.toFixed(1) : "—", lbl:"Note /5" },
            { num: images.length,   lbl:"Photos" },
            { num: chambres.length, lbl:"Chambres" },
            { num: avis.length,     lbl:"Avis" },
          ].map((s,i) => (
            <div key={i} className="ahd-stat">
              <span className="ahd-stat-num">{s.num}</span>
              <span className="ahd-stat-lbl">{s.lbl}</span>
              {i < 3 && <div className="ahd-stat-sep"/>}
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="ahd-tabs">
        {TABS.map(t => (
          <button key={t.id} className={`ahd-tab ${activeTab===t.id?"active":""}`}
            onClick={() => setActiveTab(t.id)}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      <div className="ahd-content">

        {/* ── INFORMATIONS ── */}
        {activeTab==="info" && (
          <div className="ahd-info-layout">

            {/* Ligne 1 : Détails + Partenaire côte à côte */}
            <div className="ahd-info-top">

              {/* Card Détails */}
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
                    { key:"Nom",            val: hotel.nom },
                    { key:"Ville",          val: hotel.ville || "—" },
                    { key:"Pays",           val: <span>🇹🇳 {hotel.pays}</span> },
                    { key:"Adresse",        val: hotel.adresse },
                    { key:"Classification", val: <Stars n={hotel.etoiles}/> },
                    { key:"Note moyenne",   val: hotel.note_moyenne > 0
                      ? <span className="ahd-note-gold">{hotel.note_moyenne.toFixed(1)} / 5 ★</span>
                      : <span className="ahd-no-note">Aucun avis</span> },
                    { key:"Statut",         val: <span className={`ahd-statut-inline ${hotel.actif?"actif":"inactif"}`}>
                        {hotel.actif ? "● Actif" : "● Inactif"}</span> },
                  ].map(row => (
                    <div key={row.key} className="ahd-info-row">
                      <span className="ahd-info-key">{row.key}</span>
                      <span className="ahd-info-val">{row.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Colonne droite : Partenaire + Description */}
              <div className="ahd-info-right-col">

                {/* Card Partenaire — compacte */}
                <div className="ahd-card ahd-part-compact-card">
                  <div className="ahd-part-compact-header">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                    </svg>
                    <span>Partenaire propriétaire</span>
                  </div>

                  {hotel.partenaire ? (
                    <div className="ahd-part-compact-body">
                      <div className="ahd-part-compact-avatar">
                        {hotel.partenaire.prenom?.[0]}{hotel.partenaire.nom?.[0]}
                      </div>
                      <div className="ahd-part-compact-info">
                        <span className="ahd-part-compact-nom">
                          {hotel.partenaire.prenom} {hotel.partenaire.nom}
                        </span>
                        <span className="ahd-part-compact-email">{hotel.partenaire.email}</span>
                        <div className="ahd-part-compact-meta">
                          <span className="ahd-part-compact-badge">Partenaire</span>
                          <span className="ahd-part-compact-id">#{hotel.partenaire.id}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="ahd-part-none">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/>
                      </svg>
                      <span>Aucun partenaire assigné</span>
                    </div>
                  )}
                </div>

                {/* Card Description */}
                {hotel.description && (
                  <div className="ahd-card ahd-card-desc-compact">
                    <h3 className="ahd-card-title">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/>
                        <line x1="21" y1="14" x2="3" y2="14"/><line x1="13" y1="18" x2="3" y2="18"/>
                      </svg>
                      Description
                    </h3>
                    <p className="ahd-desc">{hotel.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Ligne 2 : Photos pleine largeur */}
            {images.length > 0 && (
              <div className="ahd-card ahd-card-photos-full">
                <h3 className="ahd-card-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                  </svg>
                  Photos ({images.length})
                  <span className="ahd-photos-hint">Cliquez pour agrandir</span>
                </h3>
                <div className="ahd-photos-grid">
                  {images.map((img, i) => (
                    <div key={img.id} className="ahd-photo" onClick={() => setLightboxIdx(i)}>
                      <img src={img.url} alt="" loading="lazy" />
                      <div className="ahd-photo-overlay">
                        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                          <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
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

        {/* ── CHAMBRES ── */}
        {activeTab==="chambres" && (
          <div className="ahd-chambres-section">
            {/* Barre de recherche chambres */}
            <div className="ahd-ch-filters">
              <div className="ahd-ch-search">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input value={chambreSearch} onChange={e => setChambreSearch(e.target.value)}
                  placeholder="Rechercher une chambre..." />
                {chambreSearch && (
                  <button className="ahd-ch-clear" onClick={() => setChambreSearch("")}>✕</button>
                )}
              </div>

              <select className="ahd-ch-select" value={chambreType}
                onChange={e => setChambreType(e.target.value)}>
                <option value="">Tous les types</option>
                {typesUniques.map(t => <option key={t} value={t}>{t}</option>)}
              </select>

              <select className="ahd-ch-select" value={chambreCapMin}
                onChange={e => setChambreCapMin(e.target.value)}>
                <option value="">Capacité min.</option>
                {[1,2,3,4,5,6].map(n => (
                  <option key={n} value={n}>{n}+ personne{n>1?"s":""}</option>
                ))}
              </select>

              {(chambreSearch || chambreType || chambreCapMin) && (
                <button className="ahd-ch-reset"
                  onClick={() => { setChambreSearch(""); setChambreType(""); setChambreCapMin(""); }}>
                  Réinitialiser
                </button>
              )}

              <span className="ahd-ch-count">
                {chambresFiltrees.length} / {chambres.length} chambre{chambres.length>1?"s":""}
              </span>
            </div>

            {chambresFiltrees.length === 0 ? (
              <div className="ahd-empty"><span>🛏️</span><p>Aucune chambre ne correspond aux filtres</p></div>
            ) : (
              <div className="ahd-chambres-grid">
                {chambresFiltrees.map(ch => (
                  <div key={ch.id} className="ahd-chambre-card">
                    <div className="ahd-chambre-header">
                      <span className="ahd-chambre-type">{ch.type_chambre?.nom || "—"}</span>
                      <span className={`ahd-chambre-statut ${ch.actif?"actif":"inactif"}`}>
                        {ch.actif ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="ahd-chambre-body">
                      <div className="ahd-chambre-info">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                        {ch.capacite} personne{ch.capacite>1?"s":""}
                      </div>
                      {ch.description && <p className="ahd-chambre-desc">{ch.description}</p>}
                      {(ch.prix_min || ch.prix_max) && (
                        <div className="ahd-chambre-prix">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <line x1="12" y1="1" x2="12" y2="23"/>
                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                          </svg>
                          {ch.prix_min === ch.prix_max
                            ? `${ch.prix_min?.toFixed(0)} TND/nuit`
                            : `${ch.prix_min?.toFixed(0)} – ${ch.prix_max?.toFixed(0)} TND/nuit`}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── DISPONIBILITÉS ── */}
        {activeTab==="dispo" && (
          <div className="ahd-dispo-section">
            <div className="ahd-dispo-search">
              <div className="ahd-dispo-search-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <div>
                <h3>Vérifier les disponibilités</h3>
                <p>Statut de chaque chambre sur une période donnée</p>
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
                  {dispoLoading ? <span className="ahd-spinner-sm"/> : (
                    <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>Rechercher</>
                  )}
                </button>
              </div>
            </div>

            {dispoResult && (
              <>
                <div className="ahd-dispo-summary">
                  {[
                    { cls:"dispo",  num: dispoResult.chambres?.filter(c=>c.disponible).length,  lbl:"Disponible" },
                    { cls:"occupe", num: dispoResult.chambres?.filter(c=>!c.disponible).length, lbl:"Occupée" },
                    { cls:"total",  num: dispoResult.chambres?.length,                          lbl:"Total" },
                  ].map(s => (
                    <div key={s.cls} className={`ahd-dispo-sum-item ${s.cls}`}>
                      <span className="ahd-dispo-sum-num">{s.num}</span>
                      <span>{s.lbl}{s.num>1?"s":""}</span>
                    </div>
                  ))}
                </div>
                <div className="ahd-dispo-grid">
                  {dispoResult.chambres?.map(ch => (
                    <div key={ch.id} className={`ahd-dispo-card ${ch.disponible?"dispo":"occupe"}`}>
                      <div className={`ahd-dispo-bar ${ch.disponible?"dispo":"occupe"}`}/>
                      <div className="ahd-dispo-card-body">
                        <div className="ahd-dispo-card-header">
                          <span className="ahd-chambre-type">{ch.type_chambre?.nom||"—"}</span>
                          <StatusBadge dispo={ch.disponible}/>
                        </div>
                        <div className="ahd-chambre-info">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                          </svg>
                          {ch.capacite} pers.
                        </div>
                        {!ch.disponible && ch.occupations?.length > 0 && (
                          <div className="ahd-occupations">
                            {ch.occupations.map(o => (
                              <div key={o.id_reservation} className="ahd-occ">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                                  <line x1="3" y1="10" x2="21" y2="10"/>
                                </svg>
                                {new Date(o.date_debut).toLocaleDateString("fr-FR",{day:"2-digit",month:"short"})}
                                <span>→</span>
                                {new Date(o.date_fin).toLocaleDateString("fr-FR",{day:"2-digit",month:"short"})}
                                <span className="ahd-occ-ref">#{o.id_reservation}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            {!dispoResult && !dispoLoading && (
              <div className="ahd-empty"><span>📅</span><p>Sélectionnez une période pour voir les disponibilités</p></div>
            )}
          </div>
        )}

        {/* ── AVIS ── */}
        {activeTab==="avis" && (
          <div className="ahd-avis-list">
            {avis.length === 0 ? (
              <div className="ahd-empty"><span>💬</span><p>Aucun avis pour cet hôtel</p></div>
            ) : avis.map(a => (
              <div key={a.id} className="ahd-avis-card">
                <div className="ahd-avis-header">
                  <div className="ahd-avis-avatar">C{a.id_client}</div>
                  <div>
                    <span className="ahd-avis-client">Client #{a.id_client}</span>
                    <span className="ahd-avis-date">
                      {new Date(a.date).toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"})}
                    </span>
                  </div>
                  <div className="ahd-avis-note">★ {a.note}/5</div>
                </div>
                {a.commentaire && <p className="ahd-avis-comment">"{a.commentaire}"</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}