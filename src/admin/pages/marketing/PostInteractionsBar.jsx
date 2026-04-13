// ══════════════════════════════════════════════════════════
//  src/admin/pages/marketing/PostInteractionsBar.jsx
//  Barre d'interactions inline dans chaque PostRow
//  - Affiche : réactions 👍, commentaires 💬, partages 🔁
//  - Bouton "Actualiser" → appel backend → Graph API Facebook
//  - Gestion d'erreur détaillée (token expiré, permission, etc.)
// ══════════════════════════════════════════════════════════

import { useState } from "react";
import { facebookInteractionsApi } from "../../services/facebookInteractionsApi";

const fmt = (n) => {
  if (!n || n === 0) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + "k";
  return String(n);
};

const fmtSync = (d) =>
  d
    ? new Date(d).toLocaleString("fr-FR", {
        day: "2-digit", month: "2-digit",
        hour: "2-digit", minute: "2-digit",
      })
    : null;

export default function PostInteractionsBar({ post, onStatsUpdated }) {
  const [syncing,   setSyncing]   = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [liveStats, setLiveStats] = useState(null);

  const stats = liveStats || {
    reactions_count:  post.reactions_count  || post.likes_count || 0,
    comments_count:   post.comments_count   || 0,
    shares_count:     post.shares_count     || 0,
    reach_count:      post.reach_count      || 0,
    stats_updated_at: post.stats_updated_at || null,
  };

  const engagementTotal =
    (stats.reactions_count || 0) +
    (stats.comments_count  || 0) +
    (stats.shares_count    || 0);

  const handleSync = async (e) => {
    e.stopPropagation();
    if (!post.fb_post_id || syncing) return;
    setSyncing(true);
    setSyncError(null);
    try {
      const res = await facebookInteractionsApi.syncPost(post.id);
      if (res.synced) {
        setLiveStats({
          reactions_count:  res.reactions_count,
          comments_count:   res.comments_count,
          shares_count:     res.shares_count,
          reach_count:      res.reach_count,
          stats_updated_at: res.stats_updated_at,
        });
        onStatsUpdated?.(post.id, res);
      } else {
        setSyncError(res.error || "Erreur de synchronisation");
      }
    } catch (err) {
      setSyncError(err.message || "Erreur réseau");
    }
    setSyncing(false);
  };

  if (!post.fb_post_id && engagementTotal === 0) return null;

  return (
    <div className="pib-root">
      <div className="pib-main">
        <div className="pib-chips">
          <StatChip icon="👍" val={fmt(stats.reactions_count)} label="j'aime"   active={stats.reactions_count > 0} />
          <StatChip icon="💬" val={fmt(stats.comments_count)}  label="comm."    active={stats.comments_count  > 0} />
          <StatChip icon="🔁" val={fmt(stats.shares_count)}    label="partages" active={stats.shares_count    > 0} />
          {stats.reach_count > 0 && (
            <StatChip icon="👁️" val={fmt(stats.reach_count)} label="portée" />
          )}
          {engagementTotal > 0 && (
            <div className="pib-score">
              🎯 <strong>{fmt(engagementTotal)}</strong> interactions
            </div>
          )}
        </div>
        <div className="pib-actions">
          {stats.stats_updated_at && !syncError && (
            <span className="pib-sync-date">🕐 {fmtSync(stats.stats_updated_at)}</span>
          )}
          {post.fb_post_id && (
            <button
              className={`pib-sync-btn ${syncing ? "pib-sync-btn--loading" : ""}`}
              onClick={handleSync}
              disabled={syncing}
              title="Actualiser les statistiques depuis Facebook"
            >
              {syncing ? <><span className="mkt-spin" /> Sync…</> : <>🔄 Actualiser</>}
            </button>
          )}
        </div>
      </div>

      {syncError && (
        <div className="pib-error">
          <span>⚠️</span>
          <span className="pib-error-msg">{syncError}</span>
        </div>
      )}
    </div>
  );
}

function StatChip({ icon, val, label, active }) {
  return (
    <div className={`pib-chip ${active ? "pib-chip--active" : ""}`}>
      <span className="pib-chip-icon">{icon}</span>
      <span className="pib-chip-val">{val}</span>
      <span className="pib-chip-label">{label}</span>
    </div>
  );
}