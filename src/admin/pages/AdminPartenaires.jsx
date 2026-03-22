import { useState, useEffect } from "react";
import { partenairesApi } from "../services/api";
import InvitationWizard from "../components/partenaires/InvitationWizard";
import "./AdminPartenaires.css";

function fmt(d) {
  return new Date(d).toLocaleDateString("fr-FR", { day:"2-digit", month:"short", year:"numeric" });
}
function StatusBadge({ actif, statut }) {
  return <span className={`ap-badge ap-badge-${actif?"actif":"inactif"}`}><span className="ap-badge-dot"/>{actif?"Actif":(statut==="SUSPENDU"?"Suspendu":"Inactif")}</span>;
}
function TypeBadge({ type }) {
  const icons = { HOTEL:"🏨", AGENCE:"✈️", TRANSPORT:"🚌", RESTAURATION:"🍽️", AUTRE:"🤝" };
  return <span className="ap-type-badge">{icons[type]||"🤝"} {type}</span>;
}

// ── Card ──────────────────────────────────────────────────
function PartenaireCard({ partenaire, onToggle, onView }) {
  const [toggling, setToggling] = useState(false);
  const handleToggle = async (e) => {
    e.stopPropagation(); setToggling(true);
    try { await onToggle(partenaire.id, !partenaire.actif); } finally { setToggling(false); }
  };
  return (
    <div className="ap-card" onClick={() => onView(partenaire)}>
      <div className={`ap-card-bar ${partenaire.actif?"actif":"inactif"}`}/>
      <div className="ap-card-head">
        <div className="ap-card-avatar">{partenaire.prenom?.[0]}{partenaire.nom?.[0]}</div>
        <div className="ap-card-identity">
          <h3 className="ap-card-nom">{partenaire.prenom} {partenaire.nom}</h3>
          <span className="ap-card-email">{partenaire.email}</span>
        </div>
        <StatusBadge actif={partenaire.actif} statut={partenaire.statut}/>
      </div>
      <div className="ap-card-entreprise">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        <span>{partenaire.nom_entreprise}</span>
        <TypeBadge type={partenaire.type_partenaire}/>
      </div>
      <div className="ap-card-stats">
        <div className="ap-stat-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          <span className="ap-stat-num">{partenaire.hotels.length}</span>
          <span className="ap-stat-lbl">hôtel{partenaire.hotels.length!==1?"s":""}</span>
        </div>
        <div className="ap-stat-sep"/>
        <div className="ap-stat-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span className="ap-stat-date">{fmt(partenaire.date_inscription)}</span>
        </div>
      </div>
      {partenaire.hotels.length > 0 && (
        <div className="ap-hotels-preview">
          {partenaire.hotels.slice(0,3).map(h => (
            <div key={h.id} className="ap-hotel-chip">
              <span className={`ap-hotel-dot ${h.actif?"actif":"inactif"}`}/>
              {h.nom}<span className="ap-hotel-pays">{h.pays}</span>
            </div>
          ))}
          {partenaire.hotels.length>3&&<div className="ap-hotel-more">+{partenaire.hotels.length-3} autres</div>}
        </div>
      )}
      <div className="ap-card-footer" onClick={e=>e.stopPropagation()}>
        <button className="ap-footer-btn ap-btn-detail" onClick={()=>onView(partenaire)}>
          Voir le profil
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </button>
        <button className={`ap-footer-btn ap-btn-toggle ${partenaire.actif?"on":"off"}`} onClick={handleToggle} disabled={toggling}>
          {toggling ? <span className="ap-spin"/> : partenaire.actif
            ? <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>Suspendre</>
            : <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="9 11 12 14 22 4"/></svg>Activer</>}
        </button>
      </div>
    </div>
  );
}

// ── Détail ────────────────────────────────────────────────
function PartenaireDetail({ partenaire, onBack, onToggle, onViewHotel }) {
  const [toggling, setToggling] = useState(false);
  const handleToggle = async () => {
    setToggling(true);
    try { await onToggle(partenaire.id, !partenaire.actif); } finally { setToggling(false); }
  };
  return (
    <div className="ap-detail-root">
      <div className="ap-detail-back-bar">
        <button className="ap-back-btn" onClick={onBack}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Retour aux partenaires
        </button>
      </div>
      <div className="ap-detail-hero">
        <div className="ap-detail-hero-bg"/>
        <div className="ap-detail-hero-content">
          <div className="ap-detail-avatar">{partenaire.prenom?.[0]}{partenaire.nom?.[0]}</div>
          <div className="ap-detail-hero-info">
            <div className="ap-detail-tags">
              <StatusBadge actif={partenaire.actif} statut={partenaire.statut}/>
              <TypeBadge type={partenaire.type_partenaire}/>
            </div>
            <h1 className="ap-detail-nom">{partenaire.prenom} {partenaire.nom}</h1>
            <p className="ap-detail-entreprise">{partenaire.nom_entreprise}</p>
            <p className="ap-detail-email">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              {partenaire.email}
            </p>
          </div>
          <button className={`ap-hero-toggle-btn ${partenaire.actif?"suspend":"activate"}`} onClick={handleToggle} disabled={toggling}>
            {toggling ? <span className="ap-spin white"/> : partenaire.actif ? "Suspendre le compte" : "Activer le compte"}
          </button>
        </div>
        <div className="ap-detail-stats-bar">
          {[
            { num: partenaire.hotels.length, lbl: "Hôtels" },
            { num: `${partenaire.commission?.toFixed(1)}%`, lbl: "Commission" },
            { num: fmt(partenaire.date_inscription), lbl: "Membre depuis" },
          ].map((s,i) => (
            <div key={i} className="ap-detail-stat">
              <span className="ap-detail-stat-num">{s.num}</span>
              <span className="ap-detail-stat-lbl">{s.lbl}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="ap-detail-layout">
        <div className="ap-detail-card">
          <h3 className="ap-detail-card-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Informations
          </h3>
          {[
            ["Prénom", partenaire.prenom], ["Nom", partenaire.nom],
            ["Email", partenaire.email], ["Téléphone", partenaire.telephone||"—"],
            ["Entreprise", partenaire.nom_entreprise], ["Type", partenaire.type_partenaire],
            ["Commission", `${partenaire.commission?.toFixed(2)}%`],
            ["Statut", <StatusBadge key="s" actif={partenaire.actif} statut={partenaire.statut}/>],
            ["Membre depuis", fmt(partenaire.date_inscription)],
          ].map(([k,v]) => (
            <div key={k} className="ap-detail-row">
              <span className="ap-detail-key">{k}</span>
              <span className="ap-detail-val">{v}</span>
            </div>
          ))}
        </div>

        <div className="ap-detail-card ap-hotels-card">
          <h3 className="ap-detail-card-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            Hôtels ({partenaire.hotels.length})
          </h3>
          {partenaire.hotels.length===0 ? (
            <div className="ap-no-hotels">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              <p>Aucun hôtel associé</p>
            </div>
          ) : partenaire.hotels.map(h => (
            <div key={h.id} className="ap-hotel-row" onClick={()=>onViewHotel(h.id)}>
              <div className="ap-hotel-row-left">
                <div className={`ap-hotel-status-dot ${h.actif?"actif":"inactif"}`}/>
                <div>
                  <span className="ap-hotel-row-nom">{h.nom}</span>
                  <span className="ap-hotel-row-loc">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    {h.pays}
                  </span>
                </div>
              </div>
              <div className="ap-hotel-row-right">
                <span className="ap-hotel-etoiles">{"★".repeat(h.etoiles)}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ap-hotel-arrow"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
export default function AdminPartenaires() {
  const [partenaires, setPartenaires] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [filterTab, setFilterTab]     = useState("actif");
  const [search, setSearch]           = useState("");
  const [filterType, setFilterType]   = useState("");
  const [filterEnt, setFilterEnt]     = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [wizard, setWizard]           = useState(false);
  const [selectedId, setSelectedId]   = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true); setError("");
    try { const d = await partenairesApi.list({ per_page:100 }); setPartenaires(d.items||[]); }
    catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleToggle = async (id, actif) => {
    await partenairesApi.toggle(id, actif);
    await load();
  };

  const handleViewHotel = (hotelId) => {
    window.dispatchEvent(new CustomEvent("navigate-hotel-detail", { detail:{ hotelId } }));
  };

  if (selectedId) {
    const p = partenaires.find(x => x.id === selectedId);
    if (p) return (
      <PartenaireDetail partenaire={p}
        onBack={() => { setSelectedId(null); load(); }}
        onToggle={async (id, actif) => { await handleToggle(id, actif); }}
        onViewHotel={handleViewHotel}
      />
    );
  }

  const actifs   = partenaires.filter(p => p.actif);
  const inactifs = partenaires.filter(p => !p.actif);
  const base     = filterTab==="actif" ? actifs : inactifs;
  const hasFilters = search||filterType||filterEnt;

  const filtered = base.filter(p => {
    if (search) {
      const s = search.toLowerCase();
      if (!p.nom.toLowerCase().includes(s) && !p.prenom.toLowerCase().includes(s) &&
          !p.email.toLowerCase().includes(s) && !p.nom_entreprise.toLowerCase().includes(s)) return false;
    }
    if (filterType && p.type_partenaire !== filterType) return false;
    if (filterEnt && !p.nom_entreprise.toLowerCase().includes(filterEnt.toLowerCase())) return false;
    return true;
  });

  const totalHotels = partenaires.reduce((s,p) => s+p.hotels.length, 0);

  return (
    <div className="ap-page">
      <div className="ap-header">
        <div>
          <h1 className="ap-title">Partenaires</h1>
          <p className="ap-subtitle">{partenaires.length} partenaire{partenaires.length>1?"s":""} sur la plateforme</p>
        </div>
        <button className="ap-btn-add" onClick={() => setWizard(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
          Inviter un partenaire
        </button>
      </div>

      <div className="ap-stats">
        {[
          { icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, color:"blue",  num:partenaires.length, lbl:"Total" },
          { icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="20 6 9 17 4 12"/></svg>,                                                                                                                                                                           color:"green", num:actifs.length,       lbl:"Actifs" },
          { icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,                                                                                                 color:"red",   num:inactifs.length,     lbl:"Suspendus" },
          { icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,                                                                                                       color:"gold",  num:totalHotels,         lbl:"Hôtels gérés" },
        ].map((s,i) => (
          <div key={i} className="ap-stat-card">
            <div className={`ap-stat-icon ${s.color}`}>{s.icon}</div>
            <div><span className="ap-stat-num">{s.num}</span><span className="ap-stat-lbl">{s.lbl}</span></div>
          </div>
        ))}
      </div>

      <div className="ap-toolbar">
        <div className="ap-tabs">
          <button className={`ap-tab ${filterTab==="actif"?"active":""}`} onClick={()=>setFilterTab("actif")}>
            <span className="ap-tab-dot actif"/>Actifs<span className="ap-tab-count">{actifs.length}</span>
          </button>
          <button className={`ap-tab ${filterTab==="inactif"?"active":""}`} onClick={()=>setFilterTab("inactif")}>
            <span className="ap-tab-dot inactif"/>Suspendus<span className="ap-tab-count">{inactifs.length}</span>
          </button>
        </div>
        <div className="ap-toolbar-sep"/>
        <div className="ap-search-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Nom, email, entreprise..."/>
          {search && <button className="ap-clear" onClick={()=>setSearch("")}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>}
        </div>
       
        
        <span className="ap-count">{filtered.length} résultat{filtered.length>1?"s":""}</span>
      </div>

      {showFilters && (
        <div className="ap-filters-panel">
          <div className="ap-filter-field">
            <label>Nom d'entreprise</label>
            <input value={filterEnt} onChange={e=>setFilterEnt(e.target.value)} placeholder="Ex: Hôtel Carthage..." className="ap-filter-input"/>
          </div>
          {filterEnt && <button className="ap-reset-btn" onClick={()=>setFilterEnt("")}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>Réinitialiser</button>}
        </div>
      )}

      {loading && <div className="ap-state"><div className="ap-spinner"/><p>Chargement...</p></div>}
      {error && <div className="ap-error"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{error}<button onClick={load}>Réessayer</button></div>}

      {!loading && !error && filtered.length===0 && (
        <div className="ap-state">
          <span style={{fontSize:"2.8rem"}}>🤝</span>
          <h3>{hasFilters?"Aucun résultat":`Aucun partenaire ${filterTab==="actif"?"actif":"suspendu"}`}</h3>
          <p>{hasFilters?"Modifiez vos critères":"Invitez votre premier partenaire"}</p>
          {!hasFilters && <button className="ap-btn-add" onClick={()=>setWizard(true)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>Inviter</button>}
        </div>
      )}

      {!loading && !error && filtered.length>0 && (
        <div className="ap-grid">
          {filtered.map(p => <PartenaireCard key={p.id} partenaire={p} onToggle={handleToggle} onView={p=>setSelectedId(p.id)}/>)}
        </div>
      )}

      {wizard && <InvitationWizard onClose={()=>setWizard(false)} onSuccess={load}/>}
    </div>
  );
}