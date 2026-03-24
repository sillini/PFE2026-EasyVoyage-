import { useState, useEffect } from "react";
import { hotelsAdminApi, villesVedettesApi } from "../services/api";
import "./AdminHotelsVedettes.css";

// ══ Section villes vedettes ═══════════════════════════════
function VillesManager({ villes, onAdd, onToggle, onDelete, onReorder }) {
  const [newVille, setNewVille] = useState("");
  const [adding,   setAdding]   = useState(false);

  const handleAdd = async () => {
    if (!newVille.trim()) return;
    setAdding(true);
    try { await onAdd(newVille.trim()); setNewVille(""); }
    finally { setAdding(false); }
  };

  return (
    <div className="ahv-card">
      <div className="ahv-card-top gold"/>
      <div className="ahv-card-header">
        <div className="ahv-card-icon gold">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="10" r="3"/>
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
          </svg>
        </div>
        <div>
          <h3 className="ahv-card-title">Villes en vedette</h3>
          <p className="ahv-card-sub">Ces villes apparaissent comme filtres sur la page d'accueil</p>
        </div>
      </div>
      <div className="ahv-divider"/>

      {/* Ajout ville */}
      <div className="ahv-add-row">
        <input value={newVille} onChange={e => setNewVille(e.target.value)}
          placeholder="Ex : Hammamet, Djerba..." className="ahv-input"
          onKeyDown={e => e.key === "Enter" && handleAdd()}/>
        <button className="ahv-btn-add" onClick={handleAdd} disabled={adding || !newVille.trim()}>
          {adding ? <span className="ahv-spin"/> : (
            <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>Ajouter</>
          )}
        </button>
      </div>

      {/* Liste villes */}
      <div className="ahv-villes-list">
        {villes.length === 0 ? (
          <div className="ahv-empty-small">Aucune ville ajoutée</div>
        ) : villes.sort((a,b) => a.ordre - b.ordre).map(v => (
          <div key={v.id} className={`ahv-ville-item ${v.actif ? "" : "inactif"}`}>
            <div className="ahv-ville-drag">⋮⋮</div>
            <span className="ahv-ville-nom">{v.nom}</span>
            <div className={`ahv-dot ${v.actif ? "green" : "gray"}`}/>
            <div className="ahv-ville-actions">
              <button className={`ahv-toggle-btn ${v.actif ? "on" : "off"}`}
                onClick={() => onToggle(v.id, !v.actif)}>
                {v.actif ? "Désactiver" : "Activer"}
              </button>
              <button className="ahv-del-btn" onClick={() => onDelete(v.id)} title="Supprimer">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14H6L5 6"/>
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══ Card hôtel mis en avant ═══════════════════════════════
function HotelFeaturedCard({ hotel, onToggle }) {
  const [loading, setLoading] = useState(false);
  const isFeatured = hotel.mis_en_avant;

  const handleToggle = async () => {
    setLoading(true);
    try { await onToggle(hotel.id, !isFeatured); }
    finally { setLoading(false); }
  };

  return (
    <div className={`ahv-hotel-card ${isFeatured ? "featured" : ""}`}>
      <div className="ahv-hotel-main">
        <div className="ahv-hotel-stars">{"★".repeat(hotel.etoiles)}</div>
        <div className="ahv-hotel-info">
          <span className="ahv-hotel-nom">{hotel.nom}</span>
          <span className="ahv-hotel-ville">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="10" r="3"/>
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
            </svg>
            {hotel.ville || hotel.pays}
          </span>
        </div>
        {isFeatured && <div className="ahv-hotel-badge">★ En vedette</div>}
      </div>
      <button
        className={`ahv-hotel-toggle ${isFeatured ? "remove" : "add"}`}
        onClick={handleToggle} disabled={loading}>
        {loading ? <span className="ahv-spin-sm"/> : isFeatured ? (
          <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>Retirer</>
        ) : (
          <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>Mettre en avant</>
        )}
      </button>
    </div>
  );
}

// ══ PAGE PRINCIPALE ═══════════════════════════════════════
export default function AdminHotelsVedettes() {
  const [hotels,   setHotels]   = useState([]);
  const [villes,   setVilles]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [filterV,  setFilterV]  = useState("tous");
  const [error,    setError]    = useState("");

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true); setError("");
    const [hotelRes, villeRes] = await Promise.allSettled([
      hotelsAdminApi.list({}),
      villesVedettesApi.list(),
    ]);
    if (hotelRes.status === "fulfilled") {
      setHotels(hotelRes.value?.items || []);
    } else {
      setError("Impossible de charger les hotels : " + (hotelRes.reason?.message || ""));
    }
    setVilles(villeRes.status === "fulfilled" && Array.isArray(villeRes.value) ? villeRes.value : []);
    setLoading(false);
  };

  // Villes
  const handleAddVille = async (nom) => {
    const ordre = villes.length;
    await villesVedettesApi.create({ nom, ordre, actif: true });
    await loadAll();
  };
  const handleToggleVille = async (id, actif) => {
    await villesVedettesApi.update(id, { actif });
    await loadAll();
  };
  const handleDeleteVille = async (id) => {
    await villesVedettesApi.delete(id);
    await loadAll();
  };

  // Hôtels
  const handleToggleFeatured = async (id, val) => {
    await hotelsAdminApi.toggleFeatured(id, val);
    setHotels(prev => prev.map(h => h.id === id ? { ...h, mis_en_avant: val } : h));
  };

  const nbFeatured = hotels.filter(h => h.mis_en_avant).length;
  const villesActives = villes.filter(v => v.actif).length;

  // Filtres
  const villesList = [...new Set(hotels.map(h => h.ville || h.pays).filter(Boolean))].sort();
  const filtered = hotels.filter(h => {
    if (filterV !== "tous" && (h.ville || h.pays) !== filterV) return false;
    if (search && !h.nom.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const featuredFirst = [...filtered].sort((a,b) => (b.mis_en_avant?1:0) - (a.mis_en_avant?1:0));

  return (
    <div className="ahv-page">

      {/* Header */}
      <div className="ahv-header">
        <div>
          <h1 className="ahv-title">Gestion Page d'accueil</h1>
          <p className="ahv-sub">Sélectionnez les hôtels et les villes qui s'affichent sur la page client</p>
        </div>
        <button className="ahv-btn-refresh" onClick={loadAll} title="Actualiser">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="1 4 1 10 7 10"/>
            <path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
          </svg>
          Actualiser
        </button>
      </div>

      {/* Stats */}
      <div className="ahv-stats">
        {[
          { n:hotels.length,  l:"Hôtels actifs",    c:"blue",  i:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
          { n:nbFeatured,     l:"En vedette",        c:"gold",  i:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
          { n:villesActives,  l:"Villes affichées",  c:"green", i:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="10" r="3"/><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg> },
        ].map(s => (
          <div key={s.l} className={`ahv-stat ahv-stat-${s.c}`}>
            <div className={`ahv-stat-icon ahv-si-${s.c}`}>{s.i}</div>
            <div>
              <span className="ahv-stat-n">{s.n}</span>
              <span className="ahv-stat-l">{s.l}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Bannière migration SQL manquante */}
      {villes.length === 0 && hotels.length > 0 && (
        <div className="ahv-migration-banner">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <div>
            <strong>Migration SQL requise</strong> — Exécutez <code>migration_hotels_featured.sql</code> dans pgAdmin pour activer les villes vedettes et la mise en avant.
          </div>
        </div>
      )}
      {error && <div className="ahv-error">{error}<button onClick={loadAll}>Réessayer</button></div>}

      <div className="ahv-body">

        {/* Colonne gauche — villes */}
        <div className="ahv-col-left">
          <VillesManager
            villes={villes}
            onAdd={handleAddVille}
            onToggle={handleToggleVille}
            onDelete={handleDeleteVille}
          />

          {/* Notice */}
          <div className="ahv-notice">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p>L'onglet <strong>Tous</strong> affiche les hôtels marqués <strong>en vedette</strong>. Si aucun n'est sélectionné, tous les hôtels actifs s'affichent.</p>
          </div>
        </div>

        {/* Colonne droite — hôtels */}
        <div className="ahv-col-right">
          <div className="ahv-card">
            <div className="ahv-card-top blue"/>
            <div className="ahv-card-header">
              <div className="ahv-card-icon blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              </div>
              <div>
                <h3 className="ahv-card-title">Hôtels mis en avant</h3>
                <p className="ahv-card-sub">{nbFeatured} hôtel{nbFeatured>1?"s":""} sélectionné{nbFeatured>1?"s":""} sur {hotels.length}</p>
              </div>
            </div>
            <div className="ahv-divider"/>

            {/* Toolbar filtres */}
            <div className="ahv-toolbar">
              <div className="ahv-search">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher un hôtel..." className="ahv-search-input"/>
                {search && <button className="ahv-search-clear" onClick={() => setSearch("")}>✕</button>}
              </div>
              <select className="ahv-ville-select" value={filterV} onChange={e => setFilterV(e.target.value)}>
                <option value="tous">Toutes les villes</option>
                {villesList.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>

            {/* Liste hôtels */}
            <div className="ahv-hotels-list">
              {loading ? (
                <div className="ahv-loading"><div className="ahv-spinner"/></div>
              ) : featuredFirst.length === 0 ? (
                <div className="ahv-empty-small">Aucun hôtel trouvé</div>
              ) : (
                featuredFirst.map(h => (
                  <HotelFeaturedCard key={h.id} hotel={h} onToggle={handleToggleFeatured}/>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}