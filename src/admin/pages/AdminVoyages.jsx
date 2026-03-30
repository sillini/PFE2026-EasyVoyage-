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
    const res  = await fetch(`${BASE}/voyages/${voyageId}/images`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
    });
    const data = await res.json();
    const imgs = Array.isArray(data) ? data : data?.items || [];
    const p    = imgs.find(i => i.type === "PRINCIPALE") || imgs[0];
    return p?.url || null;
  } catch { return null; }
}

function fmt(d) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function getCurrentAdminId() {
  try {
    const token   = localStorage.getItem("access_token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.user_id || (payload.sub ? parseInt(payload.sub) : null);
  } catch { return null; }
}

// ── Mini jauge de remplissage ─────────────────────────────
function MiniJauge({ nbInscrits, capaciteMax }) {
  const pct   = capaciteMax > 0 ? Math.min(100, Math.round((nbInscrits / capaciteMax) * 100)) : 0;
  const color = pct >= 90 ? "#ef4444" : pct >= 70 ? "#f59e0b" : "#22c55e";
  return (
    <div className="av-mini-jauge">
      <div className="av-mini-jauge-bar-bg">
        <div className="av-mini-jauge-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="av-mini-jauge-txt" style={{ color }}>
        {nbInscrits}/{capaciteMax}
      </span>
    </div>
  );
}

// ── Card voyage ───────────────────────────────────────────
function VoyageCard({ voyage, currentAdminId, onView, onEdit, onImages, onToggleActif }) {
  const [imgUrl,    setImgUrl]    = useState(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [toggling,  setToggling]  = useState(false);

  useEffect(() => { fetchMainImage(voyage.id).then(setImgUrl); }, [voyage.id]);

  const isCreator = voyage.id_admin === currentAdminId;
  const isExpired = new Date(voyage.date_retour) < new Date();
  const isOngoing = new Date(voyage.date_depart) <= new Date() && new Date(voyage.date_retour) >= new Date();
  const statusLbl = isExpired ? "Terminé" : isOngoing ? "En cours" : "À venir";
  const statusCls = isExpired ? "expired"  : isOngoing ? "ongoing" : "upcoming";

  // ── Calcul places restantes ──────────────────────────────
  const nbInscrits      = voyage.nb_inscrits || 0;
  const placesRestantes = typeof voyage.places_restantes === "number"
    ? voyage.places_restantes
    : Math.max(0, voyage.capacite_max - nbInscrits);
  const isComplet = placesRestantes === 0;

  const handleToggle = async (e) => {
    e.stopPropagation();
    setToggling(true);
    try { await onToggleActif(voyage); } finally { setToggling(false); }
  };

  return (
    <div className={`av-card ${!voyage.actif ? "av-card-inactive" : ""}`}>

      {/* Barre colorée top */}
      <div className={`av-card-bar ${voyage.actif ? "actif" : "inactif"}`} />

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
            style={{ opacity: imgLoaded ? 1 : 0, transition: "opacity .5s" }} />
        ) : (
          <div className="av-card-no-img">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6z"/>
            </svg>
            <span>Aucune photo</span>
          </div>
        )}
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
        {/* Badge complet sur l'image */}
        {isComplet && voyage.actif && (
          <div className="av-complet-badge">Complet</div>
        )}
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

        <div className="av-card-dates">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          {fmt(voyage.date_depart)} <span className="av-dates-arrow">→</span> {fmt(voyage.date_retour)}
        </div>

        {/* Jauge de remplissage */}
        <MiniJauge nbInscrits={nbInscrits} capaciteMax={voyage.capacite_max} />

        {/* Badge places restantes */}
        <div className={`av-places-badge ${isComplet ? "complet" : placesRestantes <= 3 ? "warning" : ""}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          {isComplet
            ? "Complet"
            : `${placesRestantes} place${placesRestantes > 1 ? "s" : ""} restante${placesRestantes > 1 ? "s" : ""}`}
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
            <span>Propriété de {voyage.admin.prenom}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="av-card-footer">
        <button className="av-footer-btn av-btn-view" onClick={() => onView(voyage)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          Détail
        </button>
        <button className="av-footer-btn av-btn-edit" onClick={e => { e.stopPropagation(); onEdit(voyage); }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Modifier
        </button>
        <button className="av-footer-btn av-btn-photos" onClick={e => { e.stopPropagation(); onImages(voyage); }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          Photos
        </button>
        <button
          className={`av-footer-btn av-btn-toggle ${voyage.actif ? "" : "off"}`}
          onClick={handleToggle}
          disabled={toggling}
          title={voyage.actif ? "Désactiver" : "Activer"}>
          {toggling
            ? <span className="av-toggle-spin" />
            : voyage.actif
              ? <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18.36 6.64A9 9 0 0 1 20.77 15"/><path d="M6.16 6.16a9 9 0 1 0 12.68 12.68"/><line x1="2" y1="2" x2="22" y2="22"/></svg>Désactiver</>
              : <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>Activer</>}
        </button>
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────
export default function AdminVoyages() {
  const [voyages,     setVoyages]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [filterTab,   setFilterTab]   = useState("actif");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [search,      setSearch]      = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [destination, setDest]        = useState("");
  const [dateMin,     setDateMin]     = useState("");
  const [dateMax,     setDateMax]     = useState("");
  const [adminNom,    setAdminNom]    = useState("");
  const [detailId,    setDetailId]    = useState(null);
  const [modal,       setModal]       = useState({ open: false, voyage: null });
  const [imgModal,    setImgModal]    = useState(null);

  const currentAdminId = getCurrentAdminId();

  useEffect(() => { loadVoyages(); }, []);

  const loadVoyages = async () => {
    setLoading(true); setError("");
    try {
      const data = await voyagesAdminApi.list({ per_page: 100, actif_only: "false" });
      setVoyages(data.items || []);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleSave = async (form) => {
    if (modal.voyage) await voyagesAdminApi.update(modal.voyage.id, form);
    else              await voyagesAdminApi.create(form);
    await loadVoyages();
  };

  const handleToggleActif = async (v) => {
    await voyagesAdminApi.update(v.id, { actif: !v.actif });
    await loadVoyages();
  };

  if (detailId) {
    return <VoyageDetail voyageId={detailId} onBack={() => { setDetailId(null); loadVoyages(); }} />;
  }

  const actifs   = voyages.filter(v => v.actif);
  const inactifs = voyages.filter(v => !v.actif);
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

  const upcoming          = actifs.filter(v => new Date(v.date_depart) > new Date()).length;
  const ongoing           = actifs.filter(v => new Date(v.date_depart) <= new Date() && new Date(v.date_retour) >= new Date()).length;
  const totalInscrits     = actifs.reduce((acc, v) => acc + (v.nb_inscrits || 0), 0);
  const totalPlacesDispos = actifs.reduce((acc, v) => acc + Math.max(0, v.capacite_max - (v.nb_inscrits || 0)), 0);

  return (
    <div className="av-page">

      {/* Header */}
      <div className="av-header">
        <div>
          <h1 className="av-title">Voyages</h1>
          <p className="av-subtitle">{voyages.length} voyage{voyages.length > 1 ? "s" : ""} sur la plateforme</p>
        </div>
        <button className="av-btn-add" onClick={() => setModal({ open: true, voyage: null })}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Créer un voyage
        </button>
      </div>

      {/* Stats — 6 cartes dont 2 nouvelles (inscrits / places dispos) */}
      <div className="av-stats">
        {[
          { emoji: "✈️",  num: voyages.length,    lbl: "Total",              cls: "blue"  },
          { emoji: "✅",  num: actifs.length,     lbl: "Actifs",             cls: "green" },
          { emoji: "🔄",  num: ongoing,           lbl: "En cours",           cls: "gold"  },
          { emoji: "📅",  num: upcoming,          lbl: "À venir",            cls: "red"   },
          { emoji: "👥",  num: totalInscrits,     lbl: "Total inscrits",     cls: "blue"  },
          { emoji: "🟢",  num: totalPlacesDispos, lbl: "Places disponibles", cls: "green" },
        ].map((s, i) => (
          <div key={i} className="av-stat-card">
            <div className={`av-stat-icon ${s.cls}`}>{s.emoji}</div>
            <div>
              <span className="av-stat-num">{s.num}</span>
              <span className="av-stat-lbl">{s.lbl}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="av-toolbar">
        {/* Tabs Actifs / Inactifs */}
        <div className="av-tabs">
          <button className={`av-tab ${filterTab === "actif" ? "active" : ""}`}
            onClick={() => setFilterTab("actif")}>
            <span className="av-tab-dot actif" />Actifs
            <span className="av-tab-count">{actifs.length}</span>
          </button>
          <button className={`av-tab ${filterTab === "inactif" ? "active" : ""}`}
            onClick={() => setFilterTab("inactif")}>
            <span className="av-tab-dot inactif" />Inactifs
            <span className="av-tab-count">{inactifs.length}</span>
          </button>
        </div>

        <div className="av-toolbar-right">
          {/* Recherche */}
          <div className="av-search-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un voyage..." />
            {search && (
              <button className="av-clear" onClick={() => setSearch("")}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>

          {/* Tous / Mes voyages */}
          <div className="av-owner-tabs">
            <button className={`av-owner-btn ${ownerFilter === "all" ? "active" : ""}`} onClick={() => setOwnerFilter("all")}>Tous</button>
            <button className={`av-owner-btn ${ownerFilter === "mine" ? "active" : ""}`} onClick={() => setOwnerFilter("mine")}>Mes voyages</button>
          </div>

          {/* Filtres */}
          <button className={`av-filter-toggle ${showFilters ? "active" : ""}`} onClick={() => setShowFilters(!showFilters)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="12" y1="18" x2="12" y2="18"/>
            </svg>
            Filtres
            {hasFilters && <span className="av-filter-dot" />}
          </button>

          <span className="av-count">{filtered.length} résultat{filtered.length > 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Panneau filtres */}
      {showFilters && (
        <div className="av-filters-panel">
          <div className="av-filters-grid">
            <div className="av-filter-field">
              <label>Destination</label>
              <input className="av-filter-input" value={destination} onChange={e => setDest(e.target.value)} placeholder="Ex: Douz, Tunis…" />
            </div>
            <div className="av-filter-field">
              <label>Départ après</label>
              <input className="av-filter-input" type="date" value={dateMin} onChange={e => setDateMin(e.target.value)} />
            </div>
            <div className="av-filter-field">
              <label>Départ avant</label>
              <input className="av-filter-input" type="date" value={dateMax} onChange={e => setDateMax(e.target.value)} />
            </div>
            <div className="av-filter-field">
              <label>Admin créateur</label>
              <input className="av-filter-input" value={adminNom} onChange={e => setAdminNom(e.target.value)} placeholder="Nom ou prénom…" />
            </div>
          </div>
          {hasFilters && (
            <button className="av-reset-btn" onClick={() => { setDest(""); setDateMin(""); setDateMax(""); setAdminNom(""); setSearch(""); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
              </svg>
              Réinitialiser les filtres
            </button>
          )}
        </div>
      )}

      {/* Contenu */}
      {loading ? (
        <div className="av-state">
          <div className="av-spinner" />
          <p>Chargement des voyages...</p>
        </div>
      ) : error ? (
        <div className="av-error">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
          <button onClick={loadVoyages}>Réessayer</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="av-state">
          <span style={{ fontSize: "3rem" }}>🧳</span>
          <h3>{hasFilters ? "Aucun résultat" : "Aucun voyage"}</h3>
          <p>{hasFilters ? "Aucun voyage ne correspond à vos filtres." : "Aucun voyage dans cette catégorie."}</p>
          {hasFilters && (
            <button className="av-reset-btn" onClick={() => { setDest(""); setDateMin(""); setDateMax(""); setAdminNom(""); setSearch(""); }}>
              Effacer les filtres
            </button>
          )}
        </div>
      ) : (
        <div className="av-grid">
          {filtered.map(v => (
            <VoyageCard
              key={v.id}
              voyage={v}
              currentAdminId={currentAdminId}
              onView={voy => setDetailId(voy.id)}
              onEdit={voy => setModal({ open: true, voyage: voy })}
              onImages={voy => setImgModal(voy)}
              onToggleActif={handleToggleActif}
            />
          ))}
        </div>
      )}

      {/* Modales */}
      {modal.open && (
        <VoyageModal
          voyage={modal.voyage}
          onClose={() => setModal({ open: false, voyage: null })}
          onSave={async (form) => { await handleSave(form); setModal({ open: false, voyage: null }); }}
        />
      )}
      {imgModal && (
        <VoyageImageManager
          voyage={imgModal}
          onClose={() => { setImgModal(null); loadVoyages(); }}
        />
      )}
    </div>
  );
}