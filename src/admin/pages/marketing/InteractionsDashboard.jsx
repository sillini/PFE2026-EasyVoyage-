// ══════════════════════════════════════════════════════════
//  src/admin/pages/marketing/InteractionsDashboard.jsx
//  Statistiques Facebook — version améliorée
// ══════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import { facebookInteractionsApi } from "../../services/facebookInteractionsApi";
import "./InteractionsDashboard.css";

const fmtNum = (n) => {
  if (!n || n === 0) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return String(n);
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  }) : "—";

const fmtDateLong = (d) =>
  d ? new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric"
  }) : "—";

const TYPE_LABELS = {
  hotel:     { icon: "🏨", label: "Hôtel" },
  voyage:    { icon: "✈️", label: "Voyage" },
  promotion: { icon: "🎁", label: "Promotion" },
  offre:     { icon: "⭐", label: "Offre" },
};

export default function InteractionsDashboard({ toast }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error,   setError]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await facebookInteractionsApi.getDashboard();
      setData(res);
    } catch (err) {
      setError(err.message || "Impossible de charger les statistiques");
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSyncAll = async () => {
    setSyncing(true);
    try {
      const res = await facebookInteractionsApi.syncAll();
      toast?.(`✅ ${res.message}`, "success");
      await load();
    } catch (err) {
      toast?.(`Erreur sync : ${err.message}`, "error");
    }
    setSyncing(false);
  };

  /* ── Chargement ── */
  if (loading) return (
    <div className="ist-loading">
      <div className="ist-loading-orb">
        <div className="ist-orb-ring ist-orb-ring--1" />
        <div className="ist-orb-ring ist-orb-ring--2" />
        <span className="ist-orb-icon">📊</span>
      </div>
      <p>Chargement des statistiques…</p>
    </div>
  );

  /* ── Erreur ── */
  if (error) return (
    <div className="ist-error-state">
      <div className="ist-error-icon">⚠️</div>
      <p className="ist-error-title">Statistiques indisponibles</p>
      <p className="ist-error-sub">{error}</p>
      <p className="ist-error-hint">
        Vérifiez que le backend est démarré sur <code>localhost:8000</code>
      </p>
      <button className="ist-retry-btn" onClick={load}>🔄 Réessayer</button>
    </div>
  );

  const d   = data || {};
  const eng = (d.total_reactions || 0) + (d.total_comments || 0) + (d.total_shares || 0);
  const maxVal = Math.max(d.total_reactions || 0, d.total_comments || 0, d.total_shares || 0, 1);

  // Lien Facebook direct depuis le fb_post_id (format : pageId_postId)
  const fbLink = d.top_post_fb_id
    ? `https://www.facebook.com/${d.top_post_fb_id}`
    : null;

  const typeInfo = TYPE_LABELS[(d.top_post_type || "").toLowerCase()] || { icon: "📰", label: d.top_post_type || "Publication" };

  return (
    <div className="ist-root">

      {/* ── Header ── */}
      <div className="ist-header">
        <div>
          <div className="ist-eyebrow"><span className="ist-eyebrow-dot" /> Statistiques Facebook</div>
          <h2 className="ist-title">Performances de la page</h2>
          <p className="ist-subtitle">
            Interactions cumulées sur l'ensemble de vos publications
            {d.last_sync_at && (
              <span className="ist-sync-info"> · Sync {fmtDate(d.last_sync_at)}</span>
            )}
          </p>
        </div>
        <button
          className={`ist-sync-btn ${syncing ? "ist-sync-btn--busy" : ""}`}
          onClick={handleSyncAll}
          disabled={syncing}
        >
          {syncing ? <><span className="ist-spin" /> Synchronisation…</> : <>🔄 Tout synchroniser</>}
        </button>
      </div>

      {/* ── Métriques principales (3 grandes cartes) ── */}
      <div className="ist-main-metrics">
        <MetricCard
          icon="👍"
          label="Réactions"
          value={fmtNum(d.total_reactions || 0)}
          sub="j'aime, love, haha…"
          color="#1877F2"
          bgColor="rgba(24,119,242,.07)"
          borderColor="rgba(24,119,242,.2)"
          pct={Math.round(((d.total_reactions || 0) / maxVal) * 100)}
        />
        <MetricCard
          icon="💬"
          label="Commentaires"
          value={fmtNum(d.total_comments || 0)}
          sub="sur toutes les publications"
          color="#27AE60"
          bgColor="rgba(39,174,96,.07)"
          borderColor="rgba(39,174,96,.2)"
          pct={Math.round(((d.total_comments || 0) / maxVal) * 100)}
        />
        <MetricCard
          icon="🔁"
          label="Partages"
          value={fmtNum(d.total_shares || 0)}
          sub="amplification organique"
          color="#C4973A"
          bgColor="rgba(196,151,58,.07)"
          borderColor="rgba(196,151,58,.22)"
          pct={Math.round(((d.total_shares || 0) / maxVal) * 100)}
        />
      </div>

      {/* ── Répartition par type d'interaction ── */}
      {eng > 0 && (
        <div className="ist-breakdown-card">
          <p className="ist-block-title">Répartition des interactions</p>
          <div className="ist-breakdown-bars">
            <BreakdownBar icon="👍" label="Réactions"    val={d.total_reactions || 0} total={eng} color="#1877F2" />
            <BreakdownBar icon="💬" label="Commentaires" val={d.total_comments  || 0} total={eng} color="#27AE60" />
            <BreakdownBar icon="🔁" label="Partages"     val={d.total_shares    || 0} total={eng} color="#C4973A" />
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════ */}
      {/*  PUBLICATION LA PLUS PERFORMANTE — CARTE DÉTAILLÉE  */}
      {/* ══════════════════════════════════════════════════ */}
      {d.top_post_message && (
        <div className="ist-top-v2">

          {/* En-tête avec badge TOP */}
          <div className="ist-top-v2-header">
            <div className="ist-top-v2-badge">
              <span className="ist-top-v2-crown">🏆</span>
              <div>
                <span className="ist-top-v2-badge-label">TOP PERFORMANCE</span>
                <span className="ist-top-v2-badge-sub">Publication la plus engagée</span>
              </div>
            </div>
            {fbLink && (
              <a href={fbLink} target="_blank" rel="noopener noreferrer" className="ist-top-v2-fb-btn">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Voir sur Facebook
              </a>
            )}
          </div>

          {/* Corps 2 colonnes : image + contenu */}
          <div className="ist-top-v2-body">

            {/* Image preview */}
            {d.top_post_image_url ? (
              <div className="ist-top-v2-image">
                <img src={d.top_post_image_url} alt="Publication" onError={(e) => { e.target.style.display = 'none'; }} />
                <span className="ist-top-v2-type-chip">{typeInfo.icon} {typeInfo.label}</span>
              </div>
            ) : (
              <div className="ist-top-v2-image ist-top-v2-image--placeholder">
                <span>{typeInfo.icon}</span>
                <small>{typeInfo.label}</small>
              </div>
            )}

            {/* Contenu */}
            <div className="ist-top-v2-content">
              <div className="ist-top-v2-meta">
                {d.top_post_published_at && (
                  <span className="ist-top-v2-date">
                    📅 Publiée le {fmtDateLong(d.top_post_published_at)}
                  </span>
                )}
              </div>

              <p className="ist-top-v2-message">{d.top_post_message}</p>

              {/* Stats en ligne */}
              <div className="ist-top-v2-stats">
                <div className="ist-top-v2-stat ist-top-v2-stat--blue">
                  <span className="ist-top-v2-stat-icon">👍</span>
                  <div>
                    <span className="ist-top-v2-stat-val">{fmtNum(d.top_post_likes)}</span>
                    <span className="ist-top-v2-stat-lbl">Réactions</span>
                  </div>
                </div>
                <div className="ist-top-v2-stat ist-top-v2-stat--green">
                  <span className="ist-top-v2-stat-icon">💬</span>
                  <div>
                    <span className="ist-top-v2-stat-val">{fmtNum(d.top_post_comments)}</span>
                    <span className="ist-top-v2-stat-lbl">Commentaires</span>
                  </div>
                </div>
                <div className="ist-top-v2-stat ist-top-v2-stat--gold">
                  <span className="ist-top-v2-stat-icon">🔁</span>
                  <div>
                    <span className="ist-top-v2-stat-val">{fmtNum(d.top_post_shares)}</span>
                    <span className="ist-top-v2-stat-lbl">Partages</span>
                  </div>
                </div>
                <div className="ist-top-v2-stat ist-top-v2-stat--total">
                  <span className="ist-top-v2-stat-icon">🎯</span>
                  <div>
                    <span className="ist-top-v2-stat-val">{fmtNum(d.top_post_engagement)}</span>
                    <span className="ist-top-v2-stat-lbl">Total engagement</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Résumé publications ── */}
      <div className="ist-pub-summary">
        <PubPill icon="📰" label="Total" val={d.total_publications || 0} />
        <PubPill icon="✅" label="Publiées" val={d.published_count || 0} color="#27AE60" />
        <PubPill icon="📝" label="Brouillons" val={d.draft_count || 0} color="#7A93AE" />
      </div>
    </div>
  );
}

/* ── Sous-composants ── */

function MetricCard({ icon, label, value, sub, color, bgColor, borderColor, pct }) {
  return (
    <div className="ist-metric-card" style={{ "--mc": color, "--mc-bg": bgColor, "--mc-b": borderColor }}>
      <div className="ist-mc-header">
        <span className="ist-mc-icon" style={{ background: bgColor, border: `1px solid ${borderColor}` }}>{icon}</span>
        <span className="ist-mc-label">{label}</span>
      </div>
      <div className="ist-mc-value" style={{ color }}>{value}</div>
      <div className="ist-mc-sub">{sub}</div>
      <div className="ist-mc-bar-track">
        <div className="ist-mc-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function BreakdownBar({ icon, label, val, total, color }) {
  const pct = total > 0 ? Math.round((val / total) * 100) : 0;
  return (
    <div className="ist-bbar">
      <div className="ist-bbar-left">
        <span>{icon}</span>
        <span className="ist-bbar-label">{label}</span>
      </div>
      <div className="ist-bbar-track">
        <div className="ist-bbar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="ist-bbar-right">
        <span className="ist-bbar-val">{val}</span>
        <span className="ist-bbar-pct">{pct}%</span>
      </div>
    </div>
  );
}

function PubPill({ icon, label, val, color }) {
  return (
    <div className="ist-pub-pill">
      <span>{icon}</span>
      <span style={{ color: "#7A93AE" }}>{label} :</span>
      <strong style={{ color: color || "#0F2235" }}>{val}</strong>
    </div>
  );
}