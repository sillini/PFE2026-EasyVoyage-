// src/admin/pages/video-campaigns/VCsidebar.jsx
import "./VCsidebar.css";
import { STATUT_CFG, TON_CFG } from "./constants";

export default function VCsidebar({ campaigns, loading, activeId, onSelect, onNew, onDelete }) {
  const total    = campaigns.length;
  const nbPrets  = campaigns.filter(c => c.statut === "PRET").length;
  const nbEnvoyés= campaigns.filter(c => c.statut === "ENVOYE").length;

  return (
    <aside className="vcs-sidebar">
      {/* ── Header ────────────────────────────────────── */}
      <div className="vcs-header">
        <div className="vcs-header-top">
          <div>
            <h2 className="vcs-title">Vidéo Campaigns</h2>
            <p className="vcs-count">
              {total} campagne{total !== 1 ? "s" : ""}
              {nbPrets  > 0 && <span className="vcs-count-badge vcs-count-badge--blue">{nbPrets} prêtes</span>}
              {nbEnvoyés > 0 && <span className="vcs-count-badge vcs-count-badge--green">{nbEnvoyés} envoyées</span>}
            </p>
          </div>
          <button className="vcs-btn-new" onClick={onNew}>
            <span>+</span> Nouvelle
          </button>
        </div>
      </div>

      {/* ── Liste ─────────────────────────────────────── */}
      <div className="vcs-list">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="vcs-skeleton" style={{ animationDelay: `${i * 0.08}s` }} />
          ))
        ) : campaigns.length === 0 ? (
          <div className="vcs-empty">
            <div className="vcs-empty__icon">🎬</div>
            <p className="vcs-empty__title">Aucune campagne</p>
            <p className="vcs-empty__sub">Créez votre première campagne vidéo</p>
          </div>
        ) : (
          campaigns.map(camp => (
            <VCcard
              key={camp.id}
              camp={camp}
              active={camp.id === activeId}
              onSelect={() => onSelect(camp)}
              onDelete={() => onDelete(camp.id)}
            />
          ))
        )}
      </div>
    </aside>
  );
}

function VCcard({ camp, active, onSelect, onDelete }) {
  const st  = STATUT_CFG[camp.statut] || STATUT_CFG.BROUILLON;
  const ton = TON_CFG[camp.ton]       || { emoji: "🎬", label: camp.ton };

  const fmtDate = (iso) => {
    if (!iso) return "—";
    const d = Math.floor((Date.now() - new Date(iso)) / 86400000);
    if (d === 0) return "Aujourd'hui";
    if (d === 1) return "Hier";
    return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  };

  return (
    <div className={`vcs-card ${active ? "vcs-card--active" : ""}`} onClick={onSelect}>
      {/* Thumbnail ou placeholder */}
      <div className="vcs-card__thumb">
        {camp.thumbnail_url
          ? <img src={camp.thumbnail_url} alt={camp.destination} />
          : <span className="vcs-card__thumb-icon">🎬</span>
        }
        <span className="vcs-card__ton">{ton.emoji}</span>
      </div>

      {/* Infos */}
      <div className="vcs-card__body">
        <div className="vcs-card__top">
          <span
            className="vc-badge"
            style={{ background: st.bg, color: st.color }}
          >
            <span
              className={`vc-badge__dot ${camp.statut === "EN_GENERATION" || camp.statut === "EN_ENVOI" ? "vc-badge__dot--pulse" : ""}`}
              style={{ background: st.dot }}
            />
            {st.label}
          </span>
          <button
            className="vcs-card__delete"
            onClick={e => { e.stopPropagation(); onDelete(); }}
            title="Supprimer"
          >×</button>
        </div>

        <p className="vcs-card__dest">{camp.destination}</p>
        <p className="vcs-card__titre">{camp.titre}</p>

        <div className="vcs-card__footer">
          <span className="vcs-card__ton-label">{ton.label}</span>
          <span className="vcs-card__date">{fmtDate(camp.created_at)}</span>
        </div>

        {/* Barre de progression envoi */}
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