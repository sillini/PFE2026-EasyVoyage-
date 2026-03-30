import { useState, useEffect } from "react";
import { hotelsAdminApi, villesVedettesApi } from "../services/api";
import "./AdminHotelsVedettes.css";

/* ══════════════════════════════════════════════════════════
   VILLES MANAGER
══════════════════════════════════════════════════════════ */
function VillesManager({ villes, onAdd, onToggle, onDelete }) {
  const [newVille, setNewVille] = useState("");
  const [adding,   setAdding]   = useState(false);

  const handleAdd = async () => {
    if (!newVille.trim()) return;
    setAdding(true);
    try { await onAdd(newVille.trim()); setNewVille(""); }
    finally { setAdding(false); }
  };

  const sorted = [...villes].sort((a, b) => a.ordre - b.ordre);

  return (
    <div className="ahv-panel">
      <div className="ahv-panel-header">
        <div className="ahv-panel-icon gold">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="10" r="3"/>
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
          </svg>
        </div>
        <div>
          <h3 className="ahv-panel-title">Villes en vedette</h3>
          <p className="ahv-panel-sub">Apparaissent comme filtres sur la page d'accueil</p>
        </div>
        {villes.length > 0 && (
          <span className="ahv-panel-badge gold">{villes.filter(v => v.actif).length} actives</span>
        )}
      </div>

      {/* Ajout */}
      <div className="ahv-add-row">
        <div className="ahv-add-input-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <circle cx="12" cy="10" r="3"/>
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
          </svg>
          <input
            value={newVille}
            onChange={e => setNewVille(e.target.value)}
            placeholder="Ex: Hammamet, Djerba…"
            className="ahv-add-input"
            onKeyDown={e => e.key === "Enter" && handleAdd()}
          />
        </div>
        <button className="ahv-btn-add" onClick={handleAdd} disabled={adding || !newVille.trim()}>
          {adding ? <span className="ahv-spin white" /> : (
            <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>Ajouter</>
          )}
        </button>
      </div>

      {/* Liste */}
      <div className="ahv-villes-list">
        {sorted.length === 0 ? (
          <div className="ahv-villes-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8" width="36" height="36">
              <circle cx="12" cy="10" r="3"/>
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
            </svg>
            <p>Aucune ville ajoutée</p>
          </div>
        ) : sorted.map(v => (
          <div key={v.id} className={`ahv-ville-row ${v.actif ? "" : "inactive"}`}>
            <div className="ahv-ville-drag">⋮⋮</div>
            <span className={`ahv-ville-dot ${v.actif ? "on" : "off"}`} />
            <span className="ahv-ville-nom">{v.nom}</span>
            <div className="ahv-ville-actions">
              <button
                className={`ahv-ville-toggle ${v.actif ? "suspend" : "activate"}`}
                onClick={() => onToggle(v.id, !v.actif)}>
                {v.actif ? "Désactiver" : "Activer"}
              </button>
              <button className="ahv-ville-del" onClick={() => onDelete(v.id)} title="Supprimer">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14H6L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Note */}
      <div className="ahv-notice">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p>L'onglet <strong>Tous</strong> affiche les hôtels marqués <strong>en vedette</strong>. Si aucun n'est sélectionné, tous les hôtels actifs s'affichent.</p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   CARD HÔTEL
══════════════════════════════════════════════════════════ */
function HotelCard({ hotel, onToggle, index }) {
  const [loading, setLoading] = useState(false);
  const isFeatured = hotel.mis_en_avant;

  const handleToggle = async () => {
    setLoading(true);
    try { await onToggle(hotel.id, !isFeatured); }
    finally { setLoading(false); }
  };

  return (
    <div
      className={`ahv-hotel-row ${isFeatured ? "featured" : ""}`}
      style={{ animationDelay: `${index * 0.04}s` }}>

      {isFeatured && <div className="ahv-hotel-featured-bar" />}

      <div className="ahv-hotel-stars">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={i < hotel.etoiles ? "star-on" : "star-off"}>★</span>
        ))}
      </div>

      <div className="ahv-hotel-info">
        <span className="ahv-hotel-nom">{hotel.nom}</span>
        <span className="ahv-hotel-loc">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="10" height="10">
            <circle cx="12" cy="10" r="3"/>
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
          </svg>
          {hotel.ville || hotel.pays}
        </span>
      </div>

      {isFeatured && (
        <span className="ahv-hotel-vedette-badge">
          <svg viewBox="0 0 24 24" fill="currentColor" width="10" height="10">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          En vedette
        </span>
      )}

      <button
        className={`ahv-hotel-btn ${isFeatured ? "remove" : "add"}`}
        onClick={handleToggle}
        disabled={loading}>
        {loading ? <span className="ahv-spin-sm" /> : isFeatured ? (
          <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>Retirer</>
        ) : (
          <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>Mettre en avant</>
        )}
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE PRINCIPALE
══════════════════════════════════════════════════════════ */
export default function AdminHotelsVedettes() {
  const [hotels,  setHotels]  = useState([]);
  const [villes,  setVilles]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [filterV, setFilterV] = useState("tous");
  const [error,   setError]   = useState("");

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
      setError("Impossible de charger les hôtels : " + (hotelRes.reason?.message || ""));
    }
    setVilles(villeRes.status === "fulfilled" && Array.isArray(villeRes.value) ? villeRes.value : []);
    setLoading(false);
  };

  const handleAddVille     = async (nom) => { await villesVedettesApi.create({ nom, ordre: villes.length, actif: true }); await loadAll(); };
  const handleToggleVille  = async (id, actif) => { await villesVedettesApi.update(id, { actif }); await loadAll(); };
  const handleDeleteVille  = async (id) => { await villesVedettesApi.delete(id); await loadAll(); };
  const handleToggleFeatured = async (id, val) => {
    await hotelsAdminApi.toggleFeatured(id, val);
    setHotels(prev => prev.map(h => h.id === id ? { ...h, mis_en_avant: val } : h));
  };

  const nbFeatured    = hotels.filter(h => h.mis_en_avant).length;
  const villesActives = villes.filter(v => v.actif).length;
  const villesList    = [...new Set(hotels.map(h => h.ville || h.pays).filter(Boolean))].sort();

  const filtered = hotels.filter(h => {
    if (filterV !== "tous" && (h.ville || h.pays) !== filterV) return false;
    if (search && !h.nom.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const sorted = [...filtered].sort((a, b) => (b.mis_en_avant ? 1 : 0) - (a.mis_en_avant ? 1 : 0));

  return (
    <div className="ahv-page">

      {/* ── Header ──────────────────────────────────────── */}
      <header className="ahv-page-header">
        <div className="ahv-page-title-block">
          <div className="ahv-page-eyebrow">
            <span className="ahv-eyebrow-dot" />
            Page d'accueil client
          </div>
          <h1 className="ahv-page-title">Mise en avant</h1>
          <p className="ahv-page-desc">Sélectionnez les hôtels et les villes affichés sur la page client</p>
        </div>
        <button className="ahv-btn-refresh" onClick={loadAll}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <polyline points="1 4 1 10 7 10"/>
            <path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
          </svg>
          Actualiser
        </button>
      </header>

      {/* ── KPI Cards ───────────────────────────────────── */}
      <div className="ahv-kpi-grid">
        {[
          {
            color: "blue", val: hotels.length, lbl: "Hôtels actifs", sub: "sur la plateforme",
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          },
          {
            color: "gold", val: nbFeatured, lbl: "En vedette", sub: "mis en avant",
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          },
          {
            color: "green", val: villesActives, lbl: "Villes affichées", sub: "filtres actifs",
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="10" r="3"/><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
          },
        ].map((k, i) => (
          <div key={i} className={`ahv-kpi-card ahv-kpi-${k.color}`}>
            <div className="ahv-kpi-icon">{k.icon}</div>
            <div className="ahv-kpi-body">
              <span className="ahv-kpi-val">{k.val}</span>
              <span className="ahv-kpi-lbl">{k.lbl}</span>
              <span className="ahv-kpi-sub">{k.sub}</span>
            </div>
            <div className="ahv-kpi-deco" />
          </div>
        ))}
      </div>

      {/* ── Bannière migration ──────────────────────────── */}
      {villes.length === 0 && hotels.length > 0 && (
        <div className="ahv-migration-banner">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <div>
            <strong>Migration SQL requise</strong>
            Exécutez <code>migration_hotels_featured.sql</code> dans pgAdmin pour activer les villes vedettes.
          </div>
        </div>
      )}

      {error && (
        <div className="ahv-error">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          {error}
          <button onClick={loadAll}>Réessayer</button>
        </div>
      )}

      {/* ── Body 2 colonnes ─────────────────────────────── */}
      <div className="ahv-body">

        {/* Colonne gauche — villes */}
        <div className="ahv-col-left">
          <VillesManager
            villes={villes}
            onAdd={handleAddVille}
            onToggle={handleToggleVille}
            onDelete={handleDeleteVille}
          />
        </div>

        {/* Colonne droite — hôtels */}
        <div className="ahv-col-right">
          <div className="ahv-panel">
            <div className="ahv-panel-header">
              <div className="ahv-panel-icon blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              </div>
              <div>
                <h3 className="ahv-panel-title">Hôtels mis en avant</h3>
                <p className="ahv-panel-sub">
                  <span className="ahv-featured-count">{nbFeatured}</span> hôtel{nbFeatured !== 1 ? "s" : ""} sélectionné{nbFeatured !== 1 ? "s" : ""} sur {hotels.length}
                </p>
              </div>
              {nbFeatured > 0 && (
                <span className="ahv-panel-badge blue">{nbFeatured} en vedette</span>
              )}
            </div>

            {/* Toolbar */}
            <div className="ahv-toolbar">
              <label className="ahv-search">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher un hôtel…"
                />
                {search && (
                  <button className="ahv-search-clear" onClick={() => setSearch("")}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="10" height="10">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                )}
              </label>

              <select className="ahv-ville-select" value={filterV} onChange={e => setFilterV(e.target.value)}>
                <option value="tous">Toutes les villes</option>
                {villesList.map(v => <option key={v} value={v}>{v}</option>)}
              </select>

              <div className="ahv-result-pill">
                <span className="ahv-rp-num">{sorted.length}</span>
                <span className="ahv-rp-lbl">hôtel{sorted.length !== 1 ? "s" : ""}</span>
              </div>
            </div>

            {/* Liste hôtels */}
            <div className="ahv-hotels-list">
              {loading ? (
                <div className="ahv-state-center">
                  <div className="ahv-loader">
                    <div className="ahv-loader-ring" />
                    <div className="ahv-loader-ring ahv-lr2" />
                  </div>
                  <p>Chargement…</p>
                </div>
              ) : sorted.length === 0 ? (
                <div className="ahv-state-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8" width="48" height="48">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                  <p>Aucun hôtel trouvé</p>
                </div>
              ) : sorted.map((h, i) => (
                <HotelCard key={h.id} hotel={h} onToggle={handleToggleFeatured} index={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}