// src/admin/pages/video-campaigns/VCsidebar.jsx — v3
// CORRECTIONS :
//   - Filtre date : sélecteur date début/fin personnalisé
//   - Thumbnail : icône ▶ pour vidéos MP4
import { useState, useMemo } from "react";
import "./VCsidebar.css";
import { STATUT_CFG, TON_CFG } from "./constants";

export default function VCsidebar({ campaigns, loading, activeId, onSelect, onNew, onDelete }) {
  const [searchQ,      setSearchQ]      = useState("");
  const [filtreStatut, setFiltreStatut] = useState("");
  const [filtreTon,    setFiltreTon]    = useState("");
  const [dateDebut,    setDateDebut]    = useState("");
  const [dateFin,      setDateFin]      = useState("");
  const [showFilters,  setShowFilters]  = useState(false);

  const filtered = useMemo(() => {
    return campaigns.filter(c => {
      if (searchQ) {
        const q = searchQ.toLowerCase();
        if (!c.titre?.toLowerCase().includes(q) &&
            !c.destination?.toLowerCase().includes(q)) return false;
      }
      if (filtreStatut && c.statut !== filtreStatut) return false;
      if (filtreTon    && c.ton    !== filtreTon)    return false;
      if (dateDebut) {
        const created = new Date(c.created_at);
        if (created < new Date(dateDebut + "T00:00:00")) return false;
      }
      if (dateFin) {
        const created = new Date(c.created_at);
        if (created > new Date(dateFin + "T23:59:59")) return false;
      }
      return true;
    });
  }, [campaigns, searchQ, filtreStatut, filtreTon, dateDebut, dateFin]);

  const nbPrets   = campaigns.filter(c => c.statut === "PRET").length;
  const nbEnvoyes = campaigns.filter(c => c.statut === "ENVOYE").length;
  const hasFiltre = filtreStatut || filtreTon || dateDebut || dateFin;

  const resetFilters = () => {
    setFiltreStatut(""); setFiltreTon("");
    setDateDebut("");    setDateFin("");
  };

  return (
    <aside className="vcs-sidebar">
      {/* Header */}
      <div className="vcs-header">
        <div className="vcs-header-top">
          <div>
            <h2 className="vcs-title">Vidéo Campaigns</h2>
            <p className="vcs-count">
              {campaigns.length} campagne{campaigns.length !== 1 ? "s" : ""}
              {nbPrets   > 0 && <span className="vcs-count-badge vcs-count-badge--blue">{nbPrets} prêtes</span>}
              {nbEnvoyes > 0 && <span className="vcs-count-badge vcs-count-badge--green">{nbEnvoyes} envoyées</span>}
            </p>
          </div>
          <button className="vcs-btn-new" onClick={onNew}>+ Nouvelle</button>
        </div>

        {/* Recherche + bouton filtre */}
        <div className="vcs-search-row">
          <div className="vcs-search-wrap">
            <svg className="vcs-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input className="vcs-search" placeholder="Titre, destination..."
              value={searchQ} onChange={e => setSearchQ(e.target.value)} />
            {searchQ && <button className="vcs-search-clear" onClick={() => setSearchQ("")}>×</button>}
          </div>
          <button
            className={`vcs-filter-btn ${showFilters ? "vcs-filter-btn--active" : ""}`}
            onClick={() => setShowFilters(v => !v)}
            title="Filtres"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            {hasFiltre && <span className="vcs-filter-dot" />}
          </button>
        </div>

        {/* Panel filtres */}
        {showFilters && (
          <div className="vcs-filters">

            {/* Statut */}
            <div className="vcs-filter-group">
              <label className="vcs-filter-label">Statut</label>
              <div className="vcs-filter-pills">
                {[
                  { val: "",              label: "Tous" },
                  { val: "BROUILLON",     label: "Brouillon" },
                  { val: "EN_GENERATION", label: "En génération" },
                  { val: "PRET",          label: "Prêt" },
                  { val: "ENVOYE",        label: "Envoyé" },
                  { val: "ECHOUE",        label: "Échoué" },
                ].map(s => (
                  <button key={s.val}
                    className={`vcs-pill ${filtreStatut === s.val ? "vcs-pill--active" : ""}`}
                    onClick={() => setFiltreStatut(s.val)}>
                    {s.val && <span className="vcs-pill-dot" style={{ background: STATUT_CFG[s.val]?.dot }} />}
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Ton */}
            <div className="vcs-filter-group">
              <label className="vcs-filter-label">Ton</label>
              <div className="vcs-filter-pills">
                <button className={`vcs-pill ${filtreTon === "" ? "vcs-pill--active" : ""}`}
                  onClick={() => setFiltreTon("")}>Tous</button>
                {Object.entries(TON_CFG).map(([key, cfg]) => (
                  <button key={key}
                    className={`vcs-pill ${filtreTon === key ? "vcs-pill--active" : ""}`}
                    onClick={() => setFiltreTon(key)}>
                    {cfg.emoji} {cfg.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Période — sélecteur de dates personnalisé */}
            <div className="vcs-filter-group">
              <label className="vcs-filter-label">Période</label>
              <div className="vcs-date-range">
                <div className="vcs-date-field">
                  <label className="vcs-date-label">Du</label>
                  <input
                    type="date"
                    className="vcs-date-input"
                    value={dateDebut}
                    max={dateFin || undefined}
                    onChange={e => setDateDebut(e.target.value)}
                  />
                </div>
                <span className="vcs-date-sep">→</span>
                <div className="vcs-date-field">
                  <label className="vcs-date-label">Au</label>
                  <input
                    type="date"
                    className="vcs-date-input"
                    value={dateFin}
                    min={dateDebut || undefined}
                    onChange={e => setDateFin(e.target.value)}
                  />
                </div>
                {(dateDebut || dateFin) && (
                  <button className="vcs-date-clear"
                    onClick={() => { setDateDebut(""); setDateFin(""); }}
                    title="Effacer les dates">×</button>
                )}
              </div>
            </div>

            {hasFiltre && (
              <button className="vcs-filter-reset" onClick={resetFilters}>
                ✕ Réinitialiser les filtres
              </button>
            )}
          </div>
        )}

        {(hasFiltre || searchQ) && (
          <p className="vcs-filter-result">
            {filtered.length} résultat{filtered.length !== 1 ? "s" : ""}
            {filtered.length !== campaigns.length && ` sur ${campaigns.length}`}
          </p>
        )}
      </div>

      {/* Liste */}
      <div className="vcs-list">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="vcs-skeleton" style={{ animationDelay: `${i * 0.08}s` }} />
          ))
        ) : filtered.length === 0 ? (
          <div className="vcs-empty">
            <div className="vcs-empty__icon">{hasFiltre || searchQ ? "🔍" : "🎬"}</div>
            <p className="vcs-empty__title">
              {hasFiltre || searchQ ? "Aucun résultat" : "Aucune campagne"}
            </p>
            <p className="vcs-empty__sub">
              {hasFiltre || searchQ ? "Essayez d'autres filtres" : "Créez votre première campagne vidéo"}
            </p>
          </div>
        ) : (
          filtered.map(camp => (
            <VCcard key={camp.id} camp={camp} active={camp.id === activeId}
              onSelect={() => onSelect(camp)} onDelete={() => onDelete(camp.id)} />
          ))
        )}
      </div>
    </aside>
  );
}

function VCcard({ camp, active, onSelect, onDelete }) {
  const st  = STATUT_CFG[camp.statut] || STATUT_CFG.BROUILLON;
  const ton = TON_CFG[camp.ton]       || { emoji: "🎬", label: camp.ton };

  const fmtDate = iso => {
    if (!iso) return "—";
    const d = Math.floor((Date.now() - new Date(iso)) / 86400000);
    if (d === 0) return "Aujourd'hui";
    if (d === 1) return "Hier";
    return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  };

  // Détecter si thumbnail est une image statique ou une vidéo MP4
  const thumbUrl = camp.thumbnail_url || "";
  const isImg    = thumbUrl && !thumbUrl.includes(".mp4") && !thumbUrl.includes("replicate.delivery/pbxt");
  const hasVid   = !!camp.video_url_landscape;

  return (
    <div className={`vcs-card ${active ? "vcs-card--active" : ""}`} onClick={onSelect}>
      <div className="vcs-card__thumb">
        {isImg ? (
          <img src={thumbUrl} alt={camp.destination}
               onError={e => { e.target.style.display="none"; }} />
        ) : hasVid ? (
          <div className="vcs-card__thumb-video">
            <span className="vcs-card__thumb-play">▶</span>
          </div>
        ) : (
          <span className="vcs-card__thumb-icon">🎬</span>
        )}
        <span className="vcs-card__ton">{ton.emoji}</span>
      </div>

      <div className="vcs-card__body">
        <div className="vcs-card__top">
          <span className="vc-badge" style={{ background: st.bg, color: st.color }}>
            <span className={`vc-badge__dot ${["EN_GENERATION","EN_ENVOI"].includes(camp.statut) ? "vc-badge__dot--pulse" : ""}`}
              style={{ background: st.dot }} />
            {st.label}
          </span>
          <button className="vcs-card__delete"
            onClick={e => { e.stopPropagation(); onDelete(); }} title="Supprimer">×</button>
        </div>
        <p className="vcs-card__dest">{camp.destination}</p>
        <p className="vcs-card__titre">{camp.titre}</p>
        <div className="vcs-card__footer">
          <span className="vcs-card__ton-label">{ton.emoji} {ton.label}</span>
          <span className="vcs-card__date">{fmtDate(camp.created_at)}</span>
        </div>
        {camp.statut === "ENVOYE" && camp.nb_envoyes > 0 && (
          <div className="vcs-card__sent">
            ✓ {camp.nb_envoyes} envoyé{camp.nb_envoyes > 1 ? "s" : ""}
            {camp.nb_echecs > 0 && <span className="vcs-card__sent-err"> · {camp.nb_echecs} échecs</span>}
          </div>
        )}
      </div>
    </div>
  );
}