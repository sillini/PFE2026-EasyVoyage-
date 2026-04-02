// ══════════════════════════════════════════════════════════
//  src/admin/pages/marketing/PostsList.jsx
//  Tabs : Publiées | Brouillons | Historique
// ══════════════════════════════════════════════════════════
import { fmt, STATUS_MAP, TYPE_LABEL, TYPE_CLS, normalizeStatut } from "./marketingUtils";

const FILTERS = [
  { id: "all",       label: "Toutes",       icon: "📋" },
  { id: "PUBLISHED", label: "Publiées",     icon: "✅" },
  { id: "DRAFT",     label: "Brouillons",   icon: "📝" },
  { id: "HISTORY",   label: "Historique",   icon: "📚" },
];

// HISTORY = toutes sauf DRAFT
const HISTORY_STATUTS = ["PUBLISHED", "DELETED", "FAILED", "DISABLED"];

export default function PostsList({ posts, filter, setFilter, onDelete, onNew, onEditDraft, onToggle }) {

  // Filtrage
  const filtered = (() => {
    if (filter === "all")     return posts;
    if (filter === "HISTORY") return posts.filter((p) => HISTORY_STATUTS.includes(normalizeStatut(p)));
    return posts.filter((p) => normalizeStatut(p) === filter);
  })();

  // Comptes pour les badges
  const counts = {
    all:       posts.length,
    PUBLISHED: posts.filter((p) => normalizeStatut(p) === "PUBLISHED").length,
    DRAFT:     posts.filter((p) => normalizeStatut(p) === "DRAFT").length,
    HISTORY:   posts.filter((p) => HISTORY_STATUTS.includes(normalizeStatut(p))).length,
  };

  return (
    <div>
      {/* Filtres */}
      <div className="mkt-filters">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            className={`mkt-filter-btn ${filter === f.id ? "active" : ""}`}
            onClick={() => setFilter(f.id)}
          >
            {f.icon} {f.label}
            {counts[f.id] > 0 && (
              <span className="mkt-filter-count">{counts[f.id]}</span>
            )}
          </button>
        ))}
      </div>

      {/* Liste vide */}
      {filtered.length === 0 ? (
        <div className="mkt-card mkt-empty">
          <div className="mkt-empty-icon">
            {filter === "DRAFT" ? "📝" : filter === "HISTORY" ? "📚" : "📭"}
          </div>
          <p className="mkt-empty-title">
            {filter === "DRAFT"     ? "Aucun brouillon"
            : filter === "HISTORY" ? "Aucun historique"
            : filter === "PUBLISHED" ? "Aucune publication publiée"
            : "Aucune publication"}
          </p>
          <p className="mkt-empty-sub">
            {filter === "DRAFT"
              ? "Créez une publication et sauvegardez-la en brouillon pour la compléter plus tard."
              : filter === "PUBLISHED"
              ? "Les publications publiées sur Facebook apparaîtront ici."
              : "Créez votre première publication Facebook avec l'IA"}
          </p>
          {filter !== "HISTORY" && (
            <button className="mkt-btn mkt-btn--primary" style={{ marginTop: 20 }} onClick={onNew}>
              + Nouvelle publication
            </button>
          )}
        </div>
      ) : (
        <div className="mkt-post-list">
          {filtered.map((p) => (
            <PostRow
              key={p.id}
              post={p}
              filter={filter}
              onDelete={onDelete}
              onEditDraft={onEditDraft}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Ligne d'une publication ── */
function PostRow({ post, filter, onDelete, onEditDraft, onToggle }) {
  const statut  = normalizeStatut(post);
  const st      = STATUS_MAP[statut] || { label: statut, cls: "sb-gray" };
  const typeKey = (post.type_contenu || post.type || "hotel").toLowerCase();
  const typeCls = TYPE_CLS[typeKey]   || "tb-gold";
  const typeLbl = TYPE_LABEL[typeKey] || typeKey;
  const imageUrl = post.image_url || post.images?.[0] || null;
  const isDraft    = statut === "DRAFT";
  const isPublished = statut === "PUBLISHED";
  const isDisabled  = statut === "DISABLED" || statut === "DELETED";

  return (
    <div className={`mkt-post-row ${isDisabled ? "mkt-post-row--disabled" : ""}`}>

      {/* Miniature */}
      <div className="mkt-post-thumb">
        {imageUrl
          ? <img src={imageUrl} alt="thumb" style={{ opacity: isDisabled ? 0.4 : 1 }} />
          : <span className="mkt-post-thumb-icon">{isDraft ? "📝" : "📸"}</span>}
      </div>

      {/* Corps */}
      <div className="mkt-post-body">
        <div className="mkt-post-meta">
          <span className={`mkt-type-badge ${typeCls}`}>{typeLbl}</span>
          <span className={`mkt-status-badge ${st.cls}`}>{st.label}</span>
          <span className="mkt-post-date">{fmt(post.created_at || post.createdAt)}</span>
          {post.published_at && (
            <span className="mkt-post-date" style={{ color: "var(--green)" }}>
              ✅ Publié le {fmt(post.published_at)}
            </span>
          )}
          {post.fb_post_id && (
            <span className="mkt-post-img-info" style={{ fontFamily: "monospace", fontSize: ".73rem" }}>
              FB: {post.fb_post_id.split("_")[1] || post.fb_post_id}
            </span>
          )}
        </div>

        <p className="mkt-post-text" style={{ opacity: isDisabled ? 0.5 : 1 }}>
          {post.message || <em style={{ color: "var(--t4)" }}>Aucun texte</em>}
        </p>

        {/* Lien Facebook */}
        {isPublished && post.fb_post_id && (
          <a
            href={`https://www.facebook.com/${post.fb_post_id}`}
            target="_blank" rel="noreferrer"
            className="mkt-post-fb-link"
          >
            <FbIcon /> Voir sur Facebook →
          </a>
        )}
      </div>

      {/* Actions */}
      <div className="mkt-post-actions">

        {/* Brouillon → bouton "Compléter" */}
        {isDraft && (
          <button
            className="mkt-action-btn mkt-action-btn--edit"
            onClick={() => onEditDraft(post)}
            title="Compléter et publier"
          >
            <EditIcon /> Compléter
          </button>
        )}

        {/* Historique → Désactiver/Réactiver sur Facebook */}
        {filter === "HISTORY" && isPublished && (
          <button
            className="mkt-action-btn mkt-action-btn--disable"
            onClick={() => onToggle(post, "disable")}
            title="Désactiver sur Facebook"
          >
            <PauseIcon /> Désactiver
          </button>
        )}
        {filter === "HISTORY" && isDisabled && (
          <button
            className="mkt-action-btn mkt-action-btn--enable"
            onClick={() => onToggle(post, "enable")}
            title="Réactiver sur Facebook"
          >
            <PlayIcon /> Réactiver
          </button>
        )}

        {/* Supprimer */}
        <button
          className="mkt-del-btn"
          onClick={() => onDelete(post.id)}
          title={filter === "HISTORY" ? "Supprimer de l'historique" : "Supprimer"}
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  );
}

/* ── Icônes ── */
function FbIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  );
}
function EditIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}
function PauseIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
    </svg>
  );
}
function PlayIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14H6L5 6"/>
      <path d="M10 11v6"/><path d="M14 11v6"/>
      <path d="M9 6V4h6v2"/>
    </svg>
  );
}