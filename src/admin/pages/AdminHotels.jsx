import { useState, useEffect } from "react";
import { hotelsAdminApi } from "../services/api";
import AdminHotelDetail from "../components/hotels/AdminHotelDetail";
import "../components/hotels/AdminHotelDetail.css";
import "./AdminHotels.css";

async function fetchMainImage(hotelId) {
  try {
    const res = await fetch(`http://localhost:8000/api/v1/hotels/${hotelId}/images`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
    });
    const data = await res.json();
    const imgs = Array.isArray(data) ? data : data?.items || [];
    const p = imgs.find(i => i.type === "PRINCIPALE") || imgs[0];
    return p?.url || null;
  } catch { return null; }
}

function StarsBadge({ n }) {
  return (
    <div className="ah-stars-badge">
      {[1,2,3,4,5].map(i => (
        <svg key={i} viewBox="0 0 24 24"
          fill={i<=n?"#C4973A":"none"} stroke={i<=n?"#C4973A":"rgba(255,255,255,0.3)"} strokeWidth="1.5">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </div>
  );
}

function HotelCard({ hotel, onView, onToggle }) {
  const [imgUrl, setImgUrl]       = useState(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [toggling, setToggling]   = useState(false);

  useEffect(() => { fetchMainImage(hotel.id).then(setImgUrl); }, [hotel.id]);

  const handleToggle = async (e) => {
    e.stopPropagation();
    setToggling(true);
    try { await onToggle(hotel); } finally { setToggling(false); }
  };

  return (
    <div className="ah-card" onClick={() => onView(hotel)}>
      <div className={`ah-card-bar ${hotel.actif ? "actif" : "inactif"}`}/>

      {/* Image */}
      <div className="ah-card-img">
        {imgUrl ? (
          <img src={imgUrl} alt={hotel.nom}
            onLoad={() => setImgLoaded(true)}
            style={{ opacity: imgLoaded ? 1 : 0, transition: "opacity 0.5s" }}/>
        ) : (
          <div className="ah-card-no-img">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span>Aucune photo</span>
          </div>
        )}
        {/* Overlay hover */}
        <div className="ah-card-img-overlay">
          <div className="ah-card-view-hint">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            Voir le détail
          </div>
        </div>
        <StarsBadge n={hotel.etoiles}/>
        {hotel.note_moyenne > 0 && (
          <div className="ah-card-note-badge">
            <svg viewBox="0 0 24 24" fill="white" stroke="none">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            {hotel.note_moyenne.toFixed(1)}
          </div>
        )}
        {!hotel.actif && (
          <div className="ah-inactif-overlay"><span>Inactif</span></div>
        )}
      </div>

      {/* Corps */}
      <div className="ah-card-body">
        <h3 className="ah-card-nom">{hotel.nom}</h3>
        <div className="ah-card-loc">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          {hotel.ville || hotel.pays}
        </div>
        {hotel.adresse && <p className="ah-card-adresse">{hotel.adresse}</p>}

        {/* Partenaire */}
        {hotel.partenaire ? (
          <div className="ah-card-partenaire">
            <div className="ah-part-avatar">
              {hotel.partenaire.prenom?.[0]}{hotel.partenaire.nom?.[0]}
            </div>
            <div className="ah-part-info">
              <span className="ah-part-name">{hotel.partenaire.prenom} {hotel.partenaire.nom}</span>
              <span className="ah-part-email">{hotel.partenaire.email}</span>
            </div>
          </div>
        ) : (
          <div className="ah-card-no-partenaire">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
            </svg>
            <span>Partenaire non assigné</span>
          </div>
        )}

        {hotel.description && <p className="ah-card-desc">{hotel.description}</p>}
      </div>

      {/* Footer */}
      <div className="ah-card-footer" onClick={e => e.stopPropagation()}>
        <button className="ah-footer-btn ah-btn-detail" onClick={() => onView(hotel)}>
          Voir le détail
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
          </svg>
        </button>
        <button
          className={`ah-footer-btn ah-btn-toggle ${hotel.actif ? "on" : "off"}`}
          onClick={handleToggle} disabled={toggling}
          title={hotel.actif ? "Désactiver cet hôtel" : "Activer cet hôtel"}>
          {toggling ? <span className="ah-toggle-spin"/> : (
            hotel.actif ? (
              <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
              </svg>Désactiver</>
            ) : (
              <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><polyline points="9 11 12 14 22 4"/>
              </svg>Activer</>
            )
          )}
        </button>
      </div>
    </div>
  );
}

export default function AdminHotels() {
  const [hotels, setHotels]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [filterTab, setFilterTab] = useState("actif");
  const [filterEtoiles, setFilterEtoiles] = useState(0);
  const [search, setSearch]       = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [partNom, setPartNom]     = useState("");
  const [partEmail, setPartEmail] = useState("");
  const [detailId, setDetailId]   = useState(null);

  useEffect(() => { loadHotels(); }, []);

  const loadHotels = async () => {
    setLoading(true); setError("");
    try {
      const data = await hotelsAdminApi.list({ per_page: 100 });
      setHotels(data.items || []);
    } catch(err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleToggle = async (hotel) => {
    await hotelsAdminApi.toggle(hotel.id, !hotel.actif);
    await loadHotels();
  };

  if (detailId) {
    return <AdminHotelDetail hotelId={detailId} onBack={() => { setDetailId(null); loadHotels(); }}/>;
  }

  const actifs   = hotels.filter(h => h.actif);
  const inactifs = hotels.filter(h => !h.actif);
  const base     = filterTab === "actif" ? actifs : inactifs;
  const hasFilters = search || partNom || partEmail || filterEtoiles > 0;
  const pays     = [...new Set(hotels.map(h => h.ville || h.pays))].length;

  const filtered = base.filter(h => {
    if (filterEtoiles > 0 && h.etoiles !== filterEtoiles) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!h.nom.toLowerCase().includes(s) && !h.ville?.toLowerCase()?.includes(s) || h.pays?.toLowerCase()?.includes(s)) return false;
    }
    if (partNom) {
      const full = `${h.partenaire?.prenom||""} ${h.partenaire?.nom||""}`.toLowerCase();
      if (!full.includes(partNom.toLowerCase())) return false;
    }
    if (partEmail && !(h.partenaire?.email||"").toLowerCase().includes(partEmail.toLowerCase())) return false;
    return true;
  });

  const noteMoy = hotels.filter(h => h.note_moyenne > 0);
  const moyGlob = noteMoy.length
    ? (noteMoy.reduce((s,h) => s + h.note_moyenne, 0) / noteMoy.length).toFixed(1)
    : "—";

  return (
    <div className="ah-page">

      {/* Header */}
      <div className="ah-header">
        <div>
          <h1 className="ah-title">Hôtels</h1>
          <p className="ah-subtitle">{hotels.length} établissement{hotels.length>1?"s":""} sur la plateforme</p>
        </div>
      </div>

      {/* Stats */}
      <div className="ah-stats-row">
        {[
          { icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>, color:"blue",  num:hotels.length,    lbl:"Total" },
          { icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="20 6 9 17 4 12"/></svg>,                                                                                                                                                     color:"green", num:actifs.length,    lbl:"Actifs" },
          { icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,                                                                           color:"red",   num:inactifs.length,  lbl:"Inactifs" },
          { icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,      color:"gold",  num:pays,             lbl:"Villes" },
        ].map((s,i) => (
          <div key={i} className="ah-stat-card">
            <div className={`ah-stat-icon-wrap ${s.color}`}>{s.icon}</div>
            <div className="ah-stat-info">
              <span className="ah-stat-num">{s.num}</span>
              <span className="ah-stat-lbl">{s.lbl}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="ah-toolbar">
        {/* Tabs */}
        <div className="ah-tabs">
          <button className={`ah-tab ${filterTab==="actif"?"active":""}`} onClick={() => setFilterTab("actif")}>
            <span className="ah-tab-dot actif"/>Actifs<span className="ah-tab-count">{actifs.length}</span>
          </button>
          <button className={`ah-tab ${filterTab==="inactif"?"active":""}`} onClick={() => setFilterTab("inactif")}>
            <span className="ah-tab-dot inactif"/>Inactifs<span className="ah-tab-count">{inactifs.length}</span>
          </button>
        </div>

        <div className="ah-toolbar-sep"/>

        {/* Recherche */}
        <div className="ah-search-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nom ou ville..."/>
          {search && <button className="ah-clear" onClick={() => setSearch("")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>}
        </div>

        {/* Filtre étoiles */}
        <div className="ah-star-filter">
          <button className={`ah-star-btn ${filterEtoiles===0?"active":""}`} onClick={() => setFilterEtoiles(0)}>Toutes</button>
          {[1,2,3,4,5].map(n => (
            <button key={n} className={`ah-star-btn ${filterEtoiles===n?"active":""}`}
              onClick={() => setFilterEtoiles(filterEtoiles===n ? 0 : n)}>{n}★</button>
          ))}
        </div>

        {/* Filtres partenaire */}
        <button className={`ah-filter-toggle ${showFilters||partNom||partEmail?"active":""}`}
          onClick={() => setShowFilters(!showFilters)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          Partenaire
          {(partNom||partEmail) && <span className="ah-filter-dot"/>}
        </button>

        <span className="ah-count">{filtered.length} résultat{filtered.length>1?"s":""}</span>
      </div>

      {/* Filtres partenaire panel */}
      {showFilters && (
        <div className="ah-filters-panel">
          <div className="ah-filters-grid">
            <div className="ah-filter-field">
              <label>Nom / Prénom du partenaire</label>
              <input value={partNom} onChange={e=>setPartNom(e.target.value)}
                placeholder="Ex: Ahmed Sillini" className="ah-filter-input"/>
            </div>
            <div className="ah-filter-field">
              <label>Email du partenaire</label>
              <input value={partEmail} onChange={e=>setPartEmail(e.target.value)}
                placeholder="Ex: contact@hotel.tn" className="ah-filter-input"/>
            </div>
          </div>
          {(partNom||partEmail) && (
            <button className="ah-reset-btn" onClick={() => { setPartNom(""); setPartEmail(""); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="1 4 1 10 7 10"/>
                <path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
              </svg>
              Réinitialiser
            </button>
          )}
        </div>
      )}

      {/* États */}
      {loading && <div className="ah-state"><div className="ah-spinner"/><p>Chargement...</p></div>}
      {error && <div className="ah-error-bar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>{error}<button onClick={loadHotels}>Réessayer</button>
      </div>}

      {!loading && !error && filtered.length === 0 && (
        <div className="ah-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="#DDE3EC" strokeWidth="0.6">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <h3>{hasFilters ? "Aucun résultat" : `Aucun hôtel ${filterTab}`}</h3>
          <p>{hasFilters ? "Modifiez vos critères de recherche" : ""}</p>
        </div>
      )}

      {/* Grille */}
      {!loading && !error && filtered.length > 0 && (
        <div className="ah-grid">
          {filtered.map(h => (
            <HotelCard key={h.id} hotel={h}
              onView={h => setDetailId(h.id)}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}