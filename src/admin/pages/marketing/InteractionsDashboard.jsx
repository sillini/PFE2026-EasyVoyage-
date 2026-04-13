// ══════════════════════════════════════════════════════════
//  src/admin/pages/marketing/InteractionsDashboard.jsx
//  RENOMMÉ → "Statistiques Facebook"
//  Design amélioré : métriques visuelles, barres de progression
//  Correction : erreur "Failed to fetch" gérée proprement
// ══════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import { facebookInteractionsApi } from "../../services/facebookInteractionsApi";

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
      // Gestion propre de l'erreur réseau
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

  // Valeur max pour les barres de progression relatives
  const maxVal = Math.max(d.total_reactions || 0, d.total_comments || 0, d.total_shares || 0, 1);

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

      {/* ── Ligne secondaire ── */}
      <div className="ist-secondary-metrics">
        <SecMetric icon="🎯" label="Engagement total" value={fmtNum(eng)} sub={`Taux : ${d.avg_engagement_rate ?? 0}%`} />
        <SecMetric icon="👁️" label="Portée organique" value={fmtNum(d.total_reach || 0)} sub="personnes atteintes" />
        <SecMetric icon="📣" label="Impressions" value={fmtNum(d.total_impressions || 0)} sub="affichages totaux" />
        <SecMetric icon="🖱️" label="Clics" value={fmtNum(d.total_clicks || 0)} sub="clics sur liens" />
      </div>

      {/* ── Répartition par type d'interaction ── */}
      {eng > 0 && (
        <div className="ist-breakdown-card">
          <p className="ist-block-title">Répartition des interactions</p>
          <div className="ist-breakdown-bars">
            <BreakdownBar
              icon="👍" label="Réactions"
              val={d.total_reactions || 0} total={eng}
              color="#1877F2"
            />
            <BreakdownBar
              icon="💬" label="Commentaires"
              val={d.total_comments || 0} total={eng}
              color="#27AE60"
            />
            <BreakdownBar
              icon="🔁" label="Partages"
              val={d.total_shares || 0} total={eng}
              color="#C4973A"
            />
          </div>
        </div>
      )}

      {/* ── Top publication ── */}
      {d.top_post_message && (
        <div className="ist-top-card">
          <div className="ist-top-header">
            <span className="ist-top-crown">🏆</span>
            <div>
              <p className="ist-top-label">Publication la plus performante</p>
              <span className="ist-top-score">{fmtNum(d.top_post_engagement)} interactions</span>
            </div>
          </div>
          <blockquote className="ist-top-quote">"{d.top_post_message}"</blockquote>
          <div className="ist-top-stats">
            <span>👍 {fmtNum(d.top_post_likes)} réactions</span>
            <span>·</span>
            <span>🎯 {fmtNum(d.top_post_engagement)} total</span>
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

function SecMetric({ icon, label, value, sub }) {
  return (
    <div className="ist-sec-metric">
      <span className="ist-sec-icon">{icon}</span>
      <div className="ist-sec-body">
        <span className="ist-sec-val">{value}</span>
        <span className="ist-sec-label">{label}</span>
        <span className="ist-sec-sub">{sub}</span>
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