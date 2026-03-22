import { useState, useEffect } from "react";
import { voyagesAdminApi } from "../services/api";
import VoyageModal        from "../components/voyages/VoyageModal";
import VoyageImageManager from "../components/voyages/VoyageImageManager";
import VoyageDetail       from "../components/voyages/VoyageDetail";
import "../components/voyages/VoyageModal.css";
import "../components/voyages/VoyageImageManager.css";
import "../components/voyages/VoyageDetail.css";
import "./AdminVoyages.css";

const BASE = "http://localhost:8000/api/v1";

async function fetchMainImage(voyageId) {
  try {
    const res = await fetch(`${BASE}/voyages/${voyageId}/images`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
    });
    const data = await res.json();
    const imgs = Array.isArray(data) ? data : data?.items || [];
    const p = imgs.find(i => i.type === "PRINCIPALE") || imgs[0];
    return p?.url || null;
  } catch { return null; }
}

function fmt(d) {
  return new Date(d).toLocaleDateString("fr-FR", { day:"2-digit", month:"short", year:"numeric" });
}

// Décoder l'id de l'admin connecté depuis le JWT
function getCurrentAdminId() {
  try {
    const token = localStorage.getItem("access_token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.user_id || payload.sub ? parseInt(payload.sub || payload.user_id) : null;
  } catch { return null; }
}

// ── Card voyage ───────────────────────────────────────────
function VoyageCard({ voyage, currentAdminId, onView, onEdit, onImages, onToggleActif }) {
  const [imgUrl, setImgUrl]       = useState(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [toggling, setToggling]   = useState(false);

  useEffect(() => { fetchMainImage(voyage.id).then(setImgUrl); }, [voyage.id]);

  const isCreator  = voyage.id_admin === currentAdminId;
  const isExpired  = new Date(voyage.date_retour) < new Date();
  const isOngoing  = new Date(voyage.date_depart) <= new Date() && new Date(voyage.date_retour) >= new Date();
  const statusLbl  = isExpired ? "Terminé" : isOngoing ? "En cours" : "À venir";
  const statusCls  = isExpired ? "expired" : isOngoing ? "ongoing" : "upcoming";

  const handleToggle = async (e) => {
    e.stopPropagation();
    setToggling(true);
    try { await onToggleActif(voyage); } finally { setToggling(false); }
  };

  return (
    <div className={`av-card ${!voyage.actif ? "av-card-inactive" : ""}`}>

      {/* Barre colorée top */}
      <div className={`av-card-bar ${voyage.actif ? "actif" : "inactif"}`}/>

      {/* Badge créateur */}
      {isCreator && (
        <div className="av-creator-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          Mon voyage
        </div>
      )}

      {/* Image */}
      <div className="av-card-img" onClick={() => onView(voyage)}>
        {imgUrl ? (
          <img src={imgUrl} alt={voyage.titre}
            onLoad={() => setImgLoaded(true)}
            style={{ opacity: imgLoaded ? 1 : 0, transition: "opacity 0.5s" }}/>
        ) : (
          <div className="av-card-no-img">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6z"/>
            </svg>
            <span>Aucune photo</span>
          </div>
        )}
        {/* Overlay hover */}
        <div className="av-card-img-overlay">
          <div className="av-card-img-view">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            Voir le détail
          </div>
        </div>
        <span className={`av-card-status ${statusCls}`}>{statusLbl}</span>
        {!voyage.actif && <div className="av-inactif-overlay"><span>Inactif</span></div>}
      </div>

      {/* Corps */}
      <div className="av-card-body">
        <h3 className="av-card-titre" onClick={() => onView(voyage)}>{voyage.titre}</h3>
        <div className="av-card-dest">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          {voyage.destination}
        </div>

        {/* Meta dates */}
        <div className="av-card-dates">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          {fmt(voyage.date_depart)} <span className="av-dates-arrow">→</span> {fmt(voyage.date_retour)}
        </div>

        {/* Pills */}
        <div className="av-card-pills">
          <span className="av-pill-item blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            {voyage.duree}j
          </span>
          <span className="av-pill-item blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
            </svg>
            {voyage.capacite_max}
          </span>
          <span className="av-pill-item gold">{Number(voyage.prix_base).toFixed(0)} TND</span>
        </div>

        {/* Admin créateur */}
        {voyage.admin && (
          <div className="av-card-admin">
            <div className="av-admin-avatar">
              {voyage.admin.prenom?.[0]}{voyage.admin.nom?.[0]}
            </div>
            <div className="av-admin-info">
              <span className="av-admin-name">{voyage.admin.prenom} {voyage.admin.nom}</span>
              {isCreator && <span className="av-admin-you">Vous</span>}
            </div>
          </div>
        )}

        {voyage.description && (
          <p className="av-card-desc">{voyage.description}</p>
        )}
      </div>

      {/* Footer actions */}
      <div className="av-card-footer">
        {/* Détail — tous */}
        <button className="av-footer-btn av-btn-view" onClick={() => onView(voyage)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          Détail
        </button>

        {/* Toggle actif — tous les admins */}
        <button
          className={`av-footer-btn av-btn-toggle ${voyage.actif ? "on" : "off"}`}
          onClick={handleToggle} disabled={toggling}
          title={voyage.actif ? "Désactiver" : "Activer"}
        >
          {toggling ? (
            <span className="av-toggle-spin"/>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {voyage.actif
                ? <><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></>
                : <><polyline points="20 6 9 17 4 12"/></>}
            </svg>
          )}
          {voyage.actif ? "Désactiver" : "Activer"}
        </button>

        {/* Photos + Modifier — seulement créateur */}
        {isCreator ? (
          <>
            <button className="av-footer-btn av-btn-photos" onClick={e => { e.stopPropagation(); onImages(voyage); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
              </svg>
              Photos
            </button>
            <button className="av-footer-btn av-btn-edit" onClick={e => { e.stopPropagation(); onEdit(voyage); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Modifier
            </button>
          </>
        ) : (
          <div className="av-footer-locked" title="Seul le créateur peut modifier ce voyage">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <span>Propriété de {voyage.admin?.prenom}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────
export default function AdminVoyages() {
  const [voyages, setVoyages]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [filterTab, setFilterTab]     = useState("actif");
  const [ownerFilter, setOwnerFilter] = useState("all"); // "all" | "mine"
  const [search, setSearch]           = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [destination, setDest]        = useState("");
  const [dateMin, setDateMin]         = useState("");
  const [dateMax, setDateMax]         = useState("");
  const [adminNom, setAdminNom]       = useState("");
  const [detailId, setDetailId]       = useState(null);
  const [modal, setModal]             = useState({ open:false, voyage:null });
  const [imgModal, setImgModal]       = useState(null);

  const currentAdminId = getCurrentAdminId();

  useEffect(() => { loadVoyages(); }, []);

  const loadVoyages = async () => {
    setLoading(true); setError("");
    try {
      const data = await voyagesAdminApi.list({ per_page: 100 });
      setVoyages(data.items || []);
    } catch(err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleSave = async (form) => {
    if (modal.voyage) await voyagesAdminApi.update(modal.voyage.id, form);
    else await voyagesAdminApi.create(form);
    await loadVoyages();
  };

  const handleToggleActif = async (v) => {
    await voyagesAdminApi.update(v.id, { actif: !v.actif });
    await loadVoyages();
  };

  if (detailId) {
    return <VoyageDetail voyageId={detailId} onBack={() => { setDetailId(null); loadVoyages(); }}/>;
  }

  const actifs   = voyages.filter(v => v.actif);
  const inactifs = voyages.filter(v => !v.actif);
  const mesVoyages = voyages.filter(v => v.id_admin === currentAdminId);
  const base     = filterTab === "actif" ? actifs : inactifs;
  const hasFilters = search || destination || dateMin || dateMax || adminNom;

  const filtered = base.filter(v => {
    if (ownerFilter === "mine" && v.id_admin !== currentAdminId) return false;
    const s = search.toLowerCase();
    if (search && !v.titre.toLowerCase().includes(s) && !v.destination.toLowerCase().includes(s)) return false;
    if (destination && !v.destination.toLowerCase().includes(destination.toLowerCase())) return false;
    if (dateMin && v.date_depart < dateMin) return false;
    if (dateMax && v.date_depart > dateMax) return false;
    if (adminNom) {
      const full = `${v.admin?.prenom || ""} ${v.admin?.nom || ""}`.toLowerCase();
      if (!full.includes(adminNom.toLowerCase())) return false;
    }
    return true;
  });

  const upcoming = actifs.filter(v => new Date(v.date_depart) > new Date()).length;
  const ongoing  = actifs.filter(v => new Date(v.date_depart) <= new Date() && new Date(v.date_retour) >= new Date()).length;

  return (
    <div className="av-page">

      {/* ── Header ── */}
      <div className="av-header">
        <div>
          <h1 className="av-title">Voyages</h1>
          <p className="av-subtitle">{voyages.length} voyage{voyages.length>1?"s":""} sur la plateforme</p>
        </div>
        <button className="av-btn-add" onClick={() => setModal({ open:true, voyage:null })}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Créer un voyage
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="av-stats">
        {[
          { emoji:"✈️", num:voyages.length,    lbl:"Total",    cls:"blue"  },
          { emoji:"✅", num:actifs.length,     lbl:"Actifs",   cls:"green" },
          { emoji:"🔄", num:ongoing,           lbl:"En cours", cls:"gold"  },
          { emoji:"📅", num:upcoming,          lbl:"À venir",  cls:"red"   },
        ].map((s,i) => (
          <div key={i} className="av-stat-card">
            <div className={`av-stat-icon ${s.cls}`}>{s.emoji}</div>
            <div><span className="av-stat-num">{s.num}</span><span className="av-stat-lbl">{s.lbl}</span></div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="av-toolbar">
        {/* Tabs Actifs/Inactifs */}
        <div className="av-tabs">
          <button className={`av-tab ${filterTab==="actif"?"active":""}`}
            onClick={() => setFilterTab("actif")}>
            <span className="av-tab-dot actif"/>Actifs
            <span className="av-tab-count">{actifs.length}</span>
          </button>
          <button className={`av-tab ${filterTab==="inactif"?"active":""}`}
            onClick={() => setFilterTab("inactif")}>
            <span className="av-tab-dot inactif"/>Inactifs
            <span className="av-tab-count">{inactifs.length}</span>
          </button>
        </div>

        {/* Séparateur */}
        <div className="av-toolbar-sep"/>

        {/* Tous / Mes voyages */}
        <div className="av-owner-tabs">
          <button className={`av-owner-btn ${ownerFilter==="all"?"active":""}`}
            onClick={() => setOwnerFilter("all")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Tous les voyages
          </button>
          <button className={`av-owner-btn ${ownerFilter==="mine"?"active":""}`}
            onClick={() => setOwnerFilter("mine")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Mes voyages
            <span className="av-owner-count">{mesVoyages.length}</span>
          </button>
        </div>

        {/* Recherche */}
        <div className="av-search-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Titre ou destination..."/>
          {search && <button className="av-clear" onClick={() => setSearch("")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>}
        </div>

        {/* Filtres avancés */}
        <button className={`av-filter-toggle ${showFilters||hasFilters?"active":""}`}
          onClick={() => setShowFilters(!showFilters)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="4" y1="6" x2="20" y2="6"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
            <line x1="11" y1="18" x2="13" y2="18"/>
          </svg>
          Filtres
          {hasFilters && <span className="av-filter-dot"/>}
        </button>

        <span className="av-count">{filtered.length} résultat{filtered.length>1?"s":""}</span>
      </div>

      {/* ── Filtres avancés panel ── */}
      {showFilters && (
        <div className="av-filters-panel">
          <div className="av-filters-grid">
            <div className="av-filter-field">
              <label>Destination</label>
              <input value={destination} onChange={e=>setDest(e.target.value)}
                placeholder="Ex: Tunis..." className="av-filter-input"/>
            </div>
            <div className="av-filter-field">
              <label>Date départ — du</label>
              <input type="date" value={dateMin} onChange={e=>setDateMin(e.target.value)} className="av-filter-input"/>
            </div>
            <div className="av-filter-field">
              <label>Date départ — au</label>
              <input type="date" value={dateMax} min={dateMin} onChange={e=>setDateMax(e.target.value)} className="av-filter-input"/>
            </div>
            <div className="av-filter-field">
              <label>Nom de l'admin</label>
              <input value={adminNom} onChange={e=>setAdminNom(e.target.value)}
                placeholder="Ex: Ahmed..." className="av-filter-input"/>
            </div>
          </div>
          {hasFilters && (
            <button className="av-reset-btn"
              onClick={() => { setSearch(""); setDest(""); setDateMin(""); setDateMax(""); setAdminNom(""); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="1 4 1 10 7 10"/>
                <path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
              </svg>
              Réinitialiser
            </button>
          )}
        </div>
      )}

      {/* ── États ── */}
      {loading && <div className="av-state"><div className="av-spinner"/><p>Chargement...</p></div>}
      {error && <div className="av-error">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>{error}
        <button onClick={loadVoyages}>Réessayer</button>
      </div>}

      {!loading && !error && filtered.length === 0 && (
        <div className="av-state">
          <span style={{fontSize:"2.8rem"}}>✈️</span>
          <h3>{hasFilters||ownerFilter==="mine" ? "Aucun résultat" : `Aucun voyage ${filterTab}`}</h3>
          <p>{ownerFilter==="mine" ? "Vous n'avez pas encore créé de voyage" : hasFilters ? "Modifiez vos filtres" : ""}</p>
        </div>
      )}

      {/* ── Grille ── */}
      {!loading && !error && filtered.length > 0 && (
        <div className="av-grid">
          {filtered.map(v => (
            <VoyageCard key={v.id} voyage={v}
              currentAdminId={currentAdminId}
              onView={v => setDetailId(v.id)}
              onEdit={v => setModal({ open:true, voyage:v })}
              onImages={v => setImgModal(v)}
              onToggleActif={handleToggleActif}
            />
          ))}
        </div>
      )}

      {modal.open && (
        <VoyageModal voyage={modal.voyage}
          onClose={() => setModal({ open:false, voyage:null })}
          onSave={handleSave}/>
      )}
      {imgModal && (
        <VoyageImageManager voyage={imgModal}
          onClose={() => { setImgModal(null); loadVoyages(); }}/>
      )}
    </div>
  );
}