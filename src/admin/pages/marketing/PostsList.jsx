// ══════════════════════════════════════════════════════════
//  src/admin/pages/marketing/PostsList.jsx
//  REFONTE UI/UX COMPLÈTE — Design SaaS Premium
//  • Cards modernes avec image pleine largeur
//  • Filtres avancés (type, date, recherche, tri)
//  • Modal détail + aperçu Facebook réaliste
//  • Suppression de l'ID technique FB
// ══════════════════════════════════════════════════════════
import { useState, useMemo } from "react";
import { facebookInteractionsApi } from "../../services/facebookInteractionsApi";
import { fmt, STATUS_MAP, TYPE_LABEL, TYPE_CLS, normalizeStatut } from "./marketingUtils";
import InteractionsDashboard from "./InteractionsDashboard";

/* ── Constantes ── */
const STATUS_TABS = [
  { id: "all",       label: "Toutes"     },
  { id: "PUBLISHED", label: "Publiées"   },
  { id: "DRAFT",     label: "Brouillons" },
  { id: "HISTORY",   label: "Historique" },
  { id: "DASHBOARD", label: "📊 Statistiques" },   // ← changé
];

const TYPE_OPTIONS = [
  { value: "",          label: "Tous les types" },
  { value: "hotel",     label: "🏨 Hôtel" },
  { value: "voyage",    label: "✈️ Voyage" },
  { value: "promotion", label: "🎁 Promotion" },
  { value: "offre",     label: "⭐ Offre" },
];

const SORT_OPTIONS = [
  { value: "newest",     label: "Plus récentes" },
  { value: "oldest",     label: "Plus anciennes" },
  { value: "engagement", label: "Meilleur engagement" },
];

const HISTORY_STATUTS = ["PUBLISHED", "DELETED", "FAILED", "DISABLED"];

/* ── Formatage ── */
const fmtShort = (d) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) : "—";
const fmtFull = (d) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }) : "—";
const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : null;
const fmtNum = (n) => {
  if (!n) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return String(n);
};

/* ════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
   ════════════════════════════════════════════════════════ */
export default function PostsList({ posts, filter, setFilter, onDelete, onNew, onEditDraft, onToggle, toast }) {
  const [search,      setSearch]      = useState("");
  const [typeFilter,  setTypeFilter]  = useState("");
  const [dateFrom,    setDateFrom]    = useState("");
  const [dateTo,      setDateTo]      = useState("");
  const [sortBy,      setSortBy]      = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [selected,    setSelected]    = useState(null);

  /* ── Filtrage ── */
  const baseList = useMemo(() => {
    if (filter === "PUBLISHED") return posts.filter(p => normalizeStatut(p) === "PUBLISHED");
    if (filter === "DRAFT")     return posts.filter(p => normalizeStatut(p) === "DRAFT");
    if (filter === "HISTORY")   return posts.filter(p => HISTORY_STATUTS.includes(normalizeStatut(p)));
    return posts;
  }, [posts, filter]);

  const filtered = useMemo(() => {
    let list = [...baseList];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => (p.message || "").toLowerCase().includes(q));
    }
    if (typeFilter) {
      list = list.filter(p => (p.type_contenu || p.type || "").toLowerCase() === typeFilter);
    }
    if (dateFrom) {
      list = list.filter(p => new Date(p.created_at || p.createdAt) >= new Date(dateFrom));
    }
    if (dateTo) {
      const end = new Date(dateTo); end.setHours(23, 59, 59);
      list = list.filter(p => new Date(p.created_at || p.createdAt) <= end);
    }
    list.sort((a, b) => {
      if (sortBy === "oldest")
        return new Date(a.created_at || a.createdAt) - new Date(b.created_at || b.createdAt);
      if (sortBy === "engagement") {
        const ea = (a.reactions_count||0) + (a.comments_count||0) + (a.shares_count||0);
        const eb = (b.reactions_count||0) + (b.comments_count||0) + (b.shares_count||0);
        return eb - ea;
      }
      return new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt);
    });
    return list;
  }, [baseList, search, typeFilter, dateFrom, dateTo, sortBy]);

  const counts = {
    all:       posts.length,
    PUBLISHED: posts.filter(p => normalizeStatut(p) === "PUBLISHED").length,
    DRAFT:     posts.filter(p => normalizeStatut(p) === "DRAFT").length,
    HISTORY:   posts.filter(p => HISTORY_STATUTS.includes(normalizeStatut(p))).length,
  };
  const hasFilters = !!(search || typeFilter || dateFrom || dateTo || sortBy !== "newest");
  const clearFilters = () => { setSearch(""); setTypeFilter(""); setDateFrom(""); setDateTo(""); setSortBy("newest"); };

  return (
    <div className="pl-root">

      {/* ── Onglets ── */}
      <div className="pl-tabs-bar">
        <div className="pl-tabs">
          {STATUS_TABS.map(t => (
            <button
              key={t.id}
              className={`pl-tab ${filter === t.id ? "pl-tab--active" : ""} ${t.id === "DASHBOARD" ? "pl-tab--dash" : ""}`}
              onClick={() => setFilter(t.id)}
            >
              {t.label}
              {counts[t.id] > 0 && (
                <span className="pl-tab-count">{counts[t.id]}</span>
              )}
            </button>
          ))}
        </div>

        {filter !== "DASHBOARD" && (
          <button
            className={`pl-filter-btn ${showFilters ? "pl-filter-btn--open" : ""} ${hasFilters ? "pl-filter-btn--active" : ""}`}
            onClick={() => setShowFilters(v => !v)}
          >
            <FilterIcon />
            Filtres
            {hasFilters && <span className="pl-filter-dot" />}
          </button>
        )}
      </div>

      {/* ── Panneau filtres ── */}
      {filter !== "DASHBOARD" && showFilters && (
        <div className="pl-filters">
          <div className="pl-filter-search">
            <SearchIcon />
            <input
              type="text"
              className="pl-filter-search-input"
              placeholder="Rechercher dans les publications…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="pl-filter-search-clear" onClick={() => setSearch("")}>✕</button>
            )}
          </div>

          <div className="pl-filter-row">
            <div className="pl-filter-item">
              <label>Type</label>
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="pl-filter-item">
              <label>Du</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div className="pl-filter-item">
              <label>Au</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
            <div className="pl-filter-item">
              <label>Trier par</label>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            {hasFilters && (
              <button className="pl-filter-clear" onClick={clearFilters}>✕ Effacer</button>
            )}
          </div>

          {hasFilters && (
            <div className="pl-filter-result-count">
              {filtered.length} publication{filtered.length !== 1 ? "s" : ""} trouvée{filtered.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      )}

      {/* ── Dashboard ── */}
      {filter === "DASHBOARD" ? (
        <InteractionsDashboard toast={toast} />
      ) : filtered.length === 0 ? (
        <div className="pl-empty">
          <div className="pl-empty-icon">
            {hasFilters ? "🔍" : filter === "DRAFT" ? "📝" : filter === "HISTORY" ? "📚" : "📭"}
          </div>
          <p className="pl-empty-title">
            {hasFilters ? "Aucun résultat pour ces filtres"
              : filter === "DRAFT" ? "Aucun brouillon"
              : filter === "HISTORY" ? "Aucun historique"
              : filter === "PUBLISHED" ? "Aucune publication publiée"
              : "Aucune publication"}
          </p>
          <p className="pl-empty-sub">
            {hasFilters ? "Modifiez ou effacez vos critères de recherche."
              : filter === "DRAFT" ? "Créez une publication et sauvegardez-la en brouillon."
              : filter === "PUBLISHED" ? "Les publications publiées sur Facebook apparaîtront ici."
              : "Créez votre première publication Facebook avec l'IA"}
          </p>
          {hasFilters ? (
            <button className="pl-btn-ghost" style={{ marginTop: 16 }} onClick={clearFilters}>Effacer les filtres</button>
          ) : filter !== "HISTORY" && (
            <button className="pl-btn-primary" style={{ marginTop: 20 }} onClick={onNew}>+ Nouvelle publication</button>
          )}
        </div>
      ) : (
        <div className="pl-grid">
          {filtered.map(p => (
            <PostCard
              key={p.id}
              post={p}
              filter={filter}
              onDelete={onDelete}
              onEditDraft={onEditDraft}
              onToggle={onToggle}
              onOpen={() => setSelected(p)}
            />
          ))}
        </div>
      )}

      {/* ── Modal ── */}
      {selected && (
        <PostModal
          post={selected}
          filter={filter}
          onClose={() => setSelected(null)}
          onDelete={(id) => { onDelete(id); setSelected(null); }}
          onEditDraft={(p) => { onEditDraft(p); setSelected(null); }}
          onToggle={onToggle}
        />
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   CARD PUBLICATION
   ════════════════════════════════════════════════════════ */
function PostCard({ post, filter, onDelete, onEditDraft, onToggle, onOpen }) {
  const [liveStats, setLiveStats] = useState(null);
  const merged   = liveStats ? { ...post, ...liveStats } : post;
  const statut   = normalizeStatut(post);
  const st       = STATUS_MAP[statut] || { label: statut, cls: "sb-gray" };
  const typeKey  = (post.type_contenu || post.type || "hotel").toLowerCase();
  const typeLbl  = TYPE_LABEL[typeKey] || typeKey;
  const imageUrl = post.image_url || post.images?.[0] || null;
  const isDraft  = statut === "DRAFT";
  const isPub    = statut === "PUBLISHED";
  const isDis    = statut === "DISABLED" || statut === "DELETED";
  const eng      = (merged.reactions_count||0) + (merged.comments_count||0) + (merged.shares_count||0);

  return (
    <article className={`pc-card ${isDis ? "pc-card--dim" : ""}`} onClick={onOpen}>
      {/* Image */}
      <div className="pc-img">
        {imageUrl ? (
          <img src={imageUrl} alt="" className="pc-img-el" style={{ opacity: isDis ? .45 : 1 }} />
        ) : (
          <div className="pc-img-ph">
            <span className="pc-img-ph-icon">{isDraft ? "📝" : "📸"}</span>
          </div>
        )}
        <div className="pc-badges">
          <span className={`pc-type-tag pc-type-${typeKey}`}>{typeLbl}</span>
        </div>
        <span className={`pc-status pc-status--${st.cls}`}>{st.label}</span>
        {eng > 0 && <div className="pc-eng-badge">🎯 {fmtNum(eng)}</div>}
      </div>

      {/* Corps */}
      <div className="pc-body">
        <div className="pc-meta">
          <span className="pc-date"><CalendarIcon /> {fmtShort(post.created_at || post.createdAt)}</span>
          {post.published_at && (
            <span className="pc-pub">✅ {fmtShort(post.published_at)}</span>
          )}
        </div>
        <p className="pc-text">{post.message || <em>Aucun texte</em>}</p>
        {(isPub || post.fb_post_id) && (
          <div className="pc-stats" onClick={e => e.stopPropagation()}>
            <Pill icon="👍" val={fmtNum(merged.reactions_count||0)} on={(merged.reactions_count||0)>0} />
            <Pill icon="💬" val={fmtNum(merged.comments_count ||0)} on={(merged.comments_count ||0)>0} />
            <Pill icon="🔁" val={fmtNum(merged.shares_count   ||0)} on={(merged.shares_count   ||0)>0} />
            <SyncMini postId={post.id} fbId={post.fb_post_id} onDone={r => setLiveStats(r)} />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pc-footer" onClick={e => e.stopPropagation()}>
        <div className="pc-footer-l">
          {isPub && post.fb_post_id && (
            <a href={`https://www.facebook.com/${post.fb_post_id}`} target="_blank" rel="noreferrer" className="pc-fb-link">
              <FbIcon /> Facebook
            </a>
          )}
        </div>
        <div className="pc-footer-r">
          {isDraft && (
            <button className="pc-act-btn pc-act--edit" onClick={() => onEditDraft(post)}>
              <EditIcon /> Compléter
            </button>
          )}
          {filter === "HISTORY" && isPub && (
            <button className="pc-act-btn pc-act--pause" onClick={() => onToggle(post, "disable")}>
              <PauseIcon />
            </button>
          )}
          {filter === "HISTORY" && isDis && (
            <button className="pc-act-btn pc-act--play" onClick={() => onToggle(post, "enable")}>
              <PlayIcon />
            </button>
          )}
          <button className="pc-act-btn pc-act--del" onClick={() => onDelete(post.id)}>
            <TrashIcon />
          </button>
        </div>
      </div>
    </article>
  );
}

function Pill({ icon, val, on }) {
  return (
    <span className={`pc-pill ${on ? "pc-pill--on" : ""}`}>
      {icon} <strong>{val}</strong>
    </span>
  );
}

function SyncMini({ postId, fbId, onDone }) {
  const [busy, setBusy] = useState(false);
  if (!fbId) return null;
  const run = async (e) => {
    e.stopPropagation();
    setBusy(true);
    try {
      const r = await facebookInteractionsApi.syncPost(postId);
      if (r.synced) onDone(r);
    } catch {}
    setBusy(false);
  };
  return (
    <button className={`pc-sync ${busy ? "pc-sync--busy" : ""}`} onClick={run} disabled={busy} title="Actualiser">
      {busy ? <span className="mkt-spin" style={{ width: 10, height: 10 }} /> : "🔄"}
    </button>
  );
}

/* ════════════════════════════════════════════════════════
   MODAL DÉTAIL
   ✅ FIX overlay : alignItems flex-start + overflowY auto
   → header toujours visible, jamais coupé en haut
   ════════════════════════════════════════════════════════ */
function PostModal({ post, filter, onClose, onDelete, onEditDraft, onToggle }) {
  const [liveStats, setLiveStats] = useState(null);
  const [syncBusy,  setSyncBusy]  = useState(false);
  const [syncErr,   setSyncErr]   = useState(null);

  const merged   = liveStats ? { ...post, ...liveStats } : post;
  const statut   = normalizeStatut(post);
  const st       = STATUS_MAP[statut] || { label: statut, cls: "sb-gray" };
  const typeKey  = (post.type_contenu || post.type || "hotel").toLowerCase();
  const typeLbl  = TYPE_LABEL[typeKey] || typeKey;
  const imageUrl = post.image_url || post.images?.[0] || null;
  const isPub    = statut === "PUBLISHED";
  const isDraft  = statut === "DRAFT";
  const isDis    = statut === "DISABLED" || statut === "DELETED";
  const eng      = (merged.reactions_count||0) + (merged.comments_count||0) + (merged.shares_count||0);

  const handleSync = async () => {
    if (!post.fb_post_id || syncBusy) return;
    setSyncBusy(true); setSyncErr(null);
    try {
      const r = await facebookInteractionsApi.syncPost(post.id);
      if (r.synced) setLiveStats(r);
      else setSyncErr(r.error);
    } catch (e) { setSyncErr(e.message); }
    setSyncBusy(false);
  };

  return (
    <div
      className="pm-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        /* ✅ FIX : top-aligné → header jamais coupé */
        alignItems: "flex-start",
        overflowY:  "auto",
        padding:    "24px 20px",
      }}
    >
      <div
        className="pm-dialog"
        style={{
          /* ✅ hauteur max = viewport - padding overlay */
          maxHeight:  "calc(100vh - 48px)",
          flexShrink: 0,
        }}
      >
        {/* ── Header ── */}
        <div className="pm-hd">
          <div className="pm-hd-left">
            <span className={`pc-type-tag pc-type-${typeKey}`}>{typeLbl}</span>
            <span className={`pm-status-chip pm-status-${st.cls}`}>{st.label}</span>
          </div>
          <button className="pm-close-btn" onClick={onClose}><CloseIcon /></button>
        </div>

        {/* ── Corps 2 colonnes ── */}
        <div className="pm-cols">

          {/* Col gauche */}
          <div className="pm-col-l">

            <div className="pm-block">
              <p className="pm-block-title">Informations</p>
              <div className="pm-info-list">
                <InfoLine label="Créée le"   value={fmtFull(post.created_at || post.createdAt)} />
                {post.published_at && <InfoLine label="Publiée le" value={fmtDateTime(post.published_at)} />}
                <InfoLine label="Type"   value={typeLbl} />
                <InfoLine label="Statut" value={st.label} />
              </div>
            </div>

            <div className="pm-block">
              <p className="pm-block-title">Contenu</p>
              <div className="pm-content-text">{post.message || <em>Aucun texte</em>}</div>
            </div>

            {(isPub || post.fb_post_id) && (
              <div className="pm-block">
                <div className="pm-block-hd">
                  <p className="pm-block-title" style={{ margin: 0 }}>Interactions</p>
                  {merged.stats_updated_at && (
                    <span className="pm-sync-time">
                      Sync {new Date(merged.stats_updated_at).toLocaleString("fr-FR", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" })}
                    </span>
                  )}
                </div>
                <div className="pm-stats-row">
                  <StatBox icon="👍" label="Réactions"    val={fmtNum(merged.reactions_count||0)} c="var(--azure)" />
                  <StatBox icon="💬" label="Commentaires" val={fmtNum(merged.comments_count ||0)} c="var(--green)" />
                  <StatBox icon="🔁" label="Partages"     val={fmtNum(merged.shares_count   ||0)} c="var(--gold)"  />
                  <StatBox icon="🎯" label="Total"        val={fmtNum(eng)}                       c="#9b59b6"      />
                </div>
                {post.fb_post_id && (
                  <div style={{ marginTop: 10 }}>
                    <button className="pm-sync-btn" onClick={handleSync} disabled={syncBusy}>
                      {syncBusy ? <><span className="mkt-spin" /> Sync…</> : "🔄 Actualiser les stats"}
                    </button>
                    {syncErr && <p className="pm-sync-err">⚠️ {syncErr}</p>}
                  </div>
                )}
              </div>
            )}

            <div className="pm-actions">
              {isDraft && (
                <button className="pm-act pm-act--primary" onClick={() => onEditDraft(post)}>
                  <EditIcon /> Compléter et publier
                </button>
              )}
              {isPub && post.fb_post_id && (
                <a href={`https://www.facebook.com/${post.fb_post_id}`} target="_blank" rel="noreferrer" className="pm-act pm-act--fb">
                  <FbIcon /> Voir sur Facebook
                </a>
              )}
              {filter === "HISTORY" && isPub && (
                <button className="pm-act pm-act--pause" onClick={() => onToggle(post, "disable")}>
                  <PauseIcon /> Désactiver
                </button>
              )}
              {filter === "HISTORY" && isDis && (
                <button className="pm-act pm-act--play" onClick={() => onToggle(post, "enable")}>
                  <PlayIcon /> Réactiver
                </button>
              )}
              <button className="pm-act pm-act--del" onClick={() => onDelete(post.id)}>
                <TrashIcon /> Supprimer
              </button>
            </div>
          </div>

          {/* Col droite — Facebook Preview */}
          <div className="pm-col-r">
            <p className="pm-block-title">Aperçu Facebook</p>
            <div className="fb-preview">
              <div className="fb-hd">
                <div className="fb-avatar"><FbIcon /></div>
                <div className="fb-hd-info">
                  <span className="fb-page">Votre Page Facebook</span>
                  <span className="fb-time">
                    {post.published_at ? fmtDateTime(post.published_at) : "À publier"} · 🌐
                  </span>
                </div>
                <span className="fb-more">···</span>
              </div>

              <div className="fb-text">{post.message || ""}</div>

              {imageUrl && (
                <div className="fb-img-wrap">
                  <img src={imageUrl} alt="" className="fb-img" />
                </div>
              )}

              <div className="fb-counts">
                <div className="fb-counts-l">
                  {eng > 0 ? (
                    <>
                      <span className="fb-emojis">👍 ❤️ 😮</span>
                      <span className="fb-count-txt">{fmtNum(merged.reactions_count||0)}</span>
                    </>
                  ) : (
                    <span className="fb-count-zero">Soyez le premier à réagir</span>
                  )}
                </div>
                <div className="fb-counts-r">
                  {(merged.comments_count||0) > 0 && (
                    <span className="fb-count-txt">{fmtNum(merged.comments_count)} commentaire{merged.comments_count > 1 ? "s" : ""}</span>
                  )}
                  {(merged.shares_count||0) > 0 && (
                    <span className="fb-count-txt">{fmtNum(merged.shares_count)} partage{merged.shares_count > 1 ? "s" : ""}</span>
                  )}
                </div>
              </div>

              <div className="fb-actions">
                <button className="fb-act-btn">👍 J'aime</button>
                <button className="fb-act-btn">💬 Commenter</button>
                <button className="fb-act-btn">↗️ Partager</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoLine({ label, value }) {
  return (
    <div className="pm-info-line">
      <span className="pm-info-lbl">{label}</span>
      <span className="pm-info-val">{value}</span>
    </div>
  );
}

function StatBox({ icon, label, val, c }) {
  return (
    <div className="pm-stat">
      <span className="pm-stat-ico">{icon}</span>
      <span className="pm-stat-num" style={{ color: c }}>{val}</span>
      <span className="pm-stat-lbl">{label}</span>
    </div>
  );
}

/* ── Icônes ── */
const FbIcon     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>;
const EditIcon   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const PauseIcon  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>;
const PlayIcon   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>;
const TrashIcon  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
const CloseIcon  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const FilterIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>;
const SearchIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const CalendarIcon = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;