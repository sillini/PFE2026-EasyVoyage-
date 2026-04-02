// ══════════════════════════════════════════════════════════
//  src/admin/pages/AdminMarketing.jsx
//  Nouvelle architecture :
//    Publiées | Brouillons | Historique
//    - Brouillon → compléter et publier
//    - Historique → désactiver/réactiver/supprimer de l'historique
// ══════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from "react";
import { publicationFacebookApi, facebookConfigApi } from "../services/publicationFacebookApi";
import { loadPosts, savePosts, normalizeStatut } from "./marketing/marketingUtils";
import MarketingKpis  from "./marketing/MarketingKpis";
import NewPostForm    from "./marketing/NewPostForm";
import PostsList      from "./marketing/PostsList";
import FacebookConfig from "./marketing/FacebookConfig";
import "./AdminMarketing.css";

export default function AdminMarketing() {
  const [view,        setView]        = useState("list");  // list | new | config
  const [editDraft,   setEditDraft]   = useState(null);    // brouillon en cours d'édition
  const [posts,       setPosts]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState("all");
  const [notif,       setNotif]       = useState(null);
  const [fbConfig,    setFbConfig]    = useState(null);

  /* ── Toast ── */
  const toast = useCallback((msg, type = "success") => {
    setNotif({ msg, type });
    setTimeout(() => setNotif(null), 3500);
  }, []);

  /* ── Charger publications ── */
  const loadPublications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await publicationFacebookApi.list({ per_page: 100 });
      setPosts(data?.items || []);
    } catch {
      setPosts(loadPosts());
    }
    setLoading(false);
  }, []);

  /* ── Charger config FB ── */
  const loadConfig = useCallback(async () => {
    try { setFbConfig(await facebookConfigApi.get()); } catch {}
  }, []);

  useEffect(() => { loadPublications(); loadConfig(); }, [loadPublications, loadConfig]);

  /* ── Créer ou mettre à jour une publication ── */
  const onDone = useCallback(async (post) => {
    try {
      const payload = {
        message:      post.message,
        type_contenu: (post.type || "hotel").toLowerCase(),
        image_url:    post.images?.[0] || null,
        statut:       (post.status || "published").toUpperCase(),
        fb_post_id:   post.post_id || null,
        published_at: post.status === "published" ? new Date().toISOString() : null,
      };

      if (post.draftId) {
        // Mettre à jour le brouillon existant
        await publicationFacebookApi.update(post.draftId, payload);
      } else {
        // Créer une nouvelle publication
        await publicationFacebookApi.create(payload);
      }

      await loadPublications();
      setView("list");
      setEditDraft(null);

      toast(
        post.status === "draft"     ? "💾 Brouillon enregistré"
        : post.status === "published" ? "🎉 Publié sur Facebook !"
        : "✅ Publication enregistrée",
        "success"
      );
    } catch (err) {
      // Fallback localStorage
      const updated = [post, ...loadPosts()];
      savePosts(updated);
      setPosts(updated);
      setView("list");
      setEditDraft(null);
      toast(`Enregistré localement (${err.message})`, "info");
    }
  }, [loadPublications]);

  /* ── Ouvrir un brouillon en édition ── */
  const onEditDraft = useCallback((draft) => {
    setEditDraft(draft);
    setView("new");
  }, []);

  /* ── Désactiver / Réactiver sur Facebook ── */
  const onToggle = useCallback(async (post, action) => {
    const statut = normalizeStatut(post);

    if (action === "disable" && statut === "PUBLISHED") {
      // Supprimer de Facebook mais garder en historique avec statut DELETED
      if (!window.confirm("Désactiver cette publication sur Facebook ? Elle restera dans l'historique.")) return;
      try {
        // Supprimer sur Facebook via l'API
        await publicationFacebookApi.delete(post.id, true); // delete_from_facebook=true
        // Mais on veut garder en BDD → on recrée avec statut DELETED
        await publicationFacebookApi.create({
          message:      post.message,
          type_contenu: (post.type_contenu || "hotel").toLowerCase(),
          image_url:    post.image_url || null,
          statut:       "DELETED",
          fb_post_id:   null,
          published_at: post.published_at,
        });
        await loadPublications();
        toast("⏸ Publication désactivée sur Facebook (gardée dans l'historique)", "info");
      } catch (err) {
        toast(`Erreur : ${err.message}`, "error");
      }
    }

    if (action === "enable") {
      // Republier sur Facebook
      if (!window.confirm("Republier cette publication sur Facebook ?")) return;
      try {
        const imageUrls = post.image_url ? [post.image_url] : [];

        // ✅ Utiliser publishToFacebook qui récupère le token automatiquement depuis la BDD
        const { publishToFacebook } = await import("./marketing/marketingUtils");
        const result = await publishToFacebook({
          message:       post.message,
          imageUrls,
          scheduledTime: "",
        });

        const raw    = Array.isArray(result) ? result[0] : result;
        const postId = raw?.post_id || raw?.id || null;

        // Mettre à jour le statut en BDD
        await publicationFacebookApi.update(post.id, {
          statut:       "PUBLISHED",
          fb_post_id:   postId,
          published_at: new Date().toISOString(),
        });

        await loadPublications();
        toast("▶ Publication réactivée sur Facebook !", "success");
      } catch (err) {
        toast(`Erreur réactivation : ${err.message}`, "error");
      }
    }
  }, [loadPublications]);

  /* ── Supprimer de l'historique (BDD seulement) ── */
  const onDelete = useCallback(async (id) => {
    if (!window.confirm("Supprimer cette publication de l'historique ? (ne supprime pas Facebook)")) return;
    try {
      await publicationFacebookApi.delete(id, false); // delete_from_facebook=false
      await loadPublications();
      toast("🗑️ Supprimé de l'historique", "success");
    } catch (err) {
      toast(`Erreur : ${err.message}`, "error");
    }
  }, [loadPublications]);

  /* ── Stats (sans DELETED dans publiées) ── */
  const stats = {
    total:     posts.length,
    published: posts.filter((p) => normalizeStatut(p) === "PUBLISHED").length,
    scheduled: 0, // supprimé
    draft:     posts.filter((p) => normalizeStatut(p) === "DRAFT").length,
  };

  return (
    <div className="mkt-page">

      {/* Toast */}
      {notif && <div className={`mkt-toast mkt-toast--${notif.type}`}>{notif.msg}</div>}

      {/* Header */}
      <div className="mkt-page-header">
        <div>
          <div className="mkt-eyebrow"><span className="mkt-eyebrow-dot" /> Publications Facebook</div>
          <h1 className="mkt-page-title">Marketing Social</h1>
          <p className="mkt-page-desc">Publiez et planifiez vos contenus avec assistance IA</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            className="mkt-btn mkt-btn--outline"
            onClick={() => setView(view === "config" ? "list" : "config")}
          >
            ⚙️ Config Facebook
          </button>
          <button
            className={view === "new" ? "mkt-btn mkt-btn--outline" : "mkt-btn mkt-btn--primary"}
            onClick={() => {
              if (view === "new") { setView("list"); setEditDraft(null); }
              else { setEditDraft(null); setView("new"); }
            }}
          >
            {view === "new" ? "← Retour" : "+ Nouvelle publication"}
          </button>
        </div>
      </div>

      {/* Alerte config manquante */}
      {!fbConfig?.token_actif && (
        <div className="mkt-config-warning">
          ⚠️ Token Facebook non configuré —{" "}
          <button className="mkt-config-warning-link" onClick={() => setView("config")}>
            Configurer maintenant
          </button>
        </div>
      )}

      {/* KPIs */}
      <MarketingKpis stats={stats} />

      {/* Vues */}
      {view === "config" && (
        <FacebookConfig
          config={fbConfig}
          onSaved={(cfg) => { setFbConfig(cfg); setView("list"); toast("✅ Token sauvegardé !"); }}
          onBack={() => setView("list")}
          toast={toast}
        />
      )}

      {view === "new" && (
        <NewPostForm
          onDone={onDone}
          toast={toast}
          draft={editDraft} // ← null pour nouvelle, objet pour édition brouillon
        />
      )}

      {view === "list" && (
        loading ? (
          <div className="mkt-card" style={{ textAlign: "center", padding: 40 }}>
            <span className="mkt-spin" style={{ width: 24, height: 24 }} /> Chargement...
          </div>
        ) : (
          <PostsList
            posts={posts}
            filter={filter}
            setFilter={setFilter}
            onDelete={onDelete}
            onNew={() => { setEditDraft(null); setView("new"); }}
            onEditDraft={onEditDraft}
            onToggle={onToggle}
          />
        )
      )}
    </div>
  );
}