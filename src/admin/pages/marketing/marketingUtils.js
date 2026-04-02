// ══════════════════════════════════════════════════════════
//  src/admin/pages/marketing/marketingUtils.js
// ══════════════════════════════════════════════════════════

export const N8N_GENERATE  = "http://localhost:5678/webhook/generate-content";
export const N8N_PUBLISH   = "http://localhost:5678/webhook/facebook-publish";
export const CLOUDINARY_CLOUD  = "dzfznxn0q";
export const CLOUDINARY_PRESET = "Image_Hotel";

export const TYPES = [
  { id: "hotel",     label: "Hôtel",         emoji: "🏨" },
  { id: "voyage",    label: "Voyage",         emoji: "✈️" },
  { id: "promotion", label: "Promotion",      emoji: "🏷️" },
  { id: "offre",     label: "Offre spéciale", emoji: "💎" },
];

export function normalizeStatut(p) {
  return (p.statut || p.status || "DRAFT").toUpperCase();
}

export const STATUS_MAP = {
  PUBLISHED: { label: "● Publié",     cls: "sb-green"  },
  DRAFT:     { label: "○ Brouillon",  cls: "sb-gray"   },
  FAILED:    { label: "✕ Échoué",     cls: "sb-red"    },
  DELETED:   { label: "🗑 Supprimé",  cls: "sb-orange" },
  DISABLED:  { label: "⏸ Désactivé", cls: "sb-gray"   },
};

export const TYPE_LABEL = {
  hotel:     "🏨 Hôtel",
  voyage:    "✈️ Voyage",
  promotion: "🏷️ Promotion",
  offre:     "💎 Offre spéciale",
};

export const TYPE_CLS = {
  hotel:     "tb-gold",
  voyage:    "tb-blue",
  promotion: "tb-green",
  offre:     "tb-red",
};

export function fmt(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

/* ── Upload Cloudinary ── */
export async function uploadToCloudinary(file) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", CLOUDINARY_PRESET);
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`,
    { method: "POST", body: fd }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || "Échec Cloudinary");
  }
  const data = await res.json();
  if (!data.secure_url) throw new Error("URL non retournée");
  return data.secure_url;
}

/* ── Extraire valeur réponse n8n ── */
function extractValue(raw, key) {
  if (!raw) return "";
  const obj = Array.isArray(raw) ? raw[0] : raw;
  if (!obj) return "";
  const val = obj[key];
  if (!val) return "";
  const s = String(val).trim();
  if (s.startsWith("{{") || s.startsWith("=") || s.includes("$json")) return "";
  return s;
}

/* ── Générer avec Claude via n8n ── */
export async function generateWithClaude({ description, type, imageUrls }) {
  const validImages = imageUrls.filter((u) => u.startsWith("https://"));
  const payload = { description: description || "", type: type || "hotel" };
  validImages.forEach((url, i) => { payload[`image_url_${i + 1}`] = url; });

  const res = await fetch(N8N_GENERATE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Erreur n8n (${res.status})`);

  const raw      = await res.json();
  const message  = extractValue(raw, "message") || extractValue(raw, "message_ameliore");
  const hashtags = extractValue(raw, "hashtags");
  const cta      = extractValue(raw, "cta");

  if (!message && !hashtags && !cta)
    throw new Error("Réponse vide — vérifiez le node Respond to Webhook dans n8n");

  return {
    message:  message  || description || "",
    hashtags: hashtags || "#hotel #tunisie",
    cta:      cta      || "Réservez maintenant !",
  };
}

/* ══════════════════════════════════════════════════════════
   Récupérer token + page_id depuis le backend
   Endpoint dédié : GET /admin/facebook/config/token
   ✅ Retourne le token complet (page_access_token)
   ✅ Fallback sur localStorage si endpoint indisponible
══════════════════════════════════════════════════════════ */
async function getFbCredentials() {
  const BASE       = "http://localhost:8000/api/v1";
  const authToken  = localStorage.getItem("access_token");

  try {
    // ✅ Endpoint dédié qui retourne le token complet
    const res = await fetch(`${BASE}/admin/facebook/config/token`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (res.ok) {
      const data = await res.json();
      const fb_token   = data.page_access_token || null;
      const fb_page_id = data.page_id           || null;

      // Mettre en cache dans localStorage pour fallback
      if (fb_token)   localStorage.setItem("fb_token",   fb_token);
      if (fb_page_id) localStorage.setItem("fb_page_id", fb_page_id);

      console.log("✅ Credentials FB chargées depuis le backend :", {
        page_id:      fb_page_id,
        token_present: !!fb_token,
      });

      return { fb_token, fb_page_id };
    }

    // Si l'endpoint échoue → fallback localStorage
    console.warn("⚠️ Endpoint /config/token indisponible — fallback localStorage");
    return {
      fb_token:   localStorage.getItem("fb_token")   || null,
      fb_page_id: localStorage.getItem("fb_page_id") || null,
    };

  } catch (err) {
    console.error("Erreur récupération credentials FB :", err);
    // Fallback localStorage
    return {
      fb_token:   localStorage.getItem("fb_token")   || null,
      fb_page_id: localStorage.getItem("fb_page_id") || null,
    };
  }
}

/* ── Publier sur Facebook via n8n ── */
export async function publishToFacebook({ message, imageUrls, scheduledTime }) {
  // ✅ Token et page_id depuis le backend (automatique)
  const { fb_token, fb_page_id } = await getFbCredentials();

  if (!fb_token) {
    throw new Error("Token Facebook non configuré — allez dans ⚙️ Config Facebook");
  }
  if (!fb_page_id) {
    throw new Error("Page ID Facebook non configuré — allez dans ⚙️ Config Facebook");
  }

  const payload = {
    message,
    scheduled_time: scheduledTime || "",
    fb_token,    // ← lu depuis la BDD automatiquement
    fb_page_id,  // ← lu depuis la BDD automatiquement
  };

  imageUrls
    .filter((u) => u.startsWith("https://"))
    .forEach((url, i) => { payload[`image_url_${i + 1}`] = url; });

  console.log("📤 Payload envoyé à n8n :", {
    ...payload,
    fb_token: payload.fb_token ? "***" : null, // masquer dans logs
  });

  const res = await fetch(N8N_PUBLISH, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`Erreur publication n8n (${res.status})`);
  return await res.json();
}

/* ── localStorage fallback ── */
export function loadPosts() {
  try { return JSON.parse(localStorage.getItem("hsm_posts") || "[]"); }
  catch { return []; }
}
export function savePosts(posts) {
  localStorage.setItem("hsm_posts", JSON.stringify(posts));
}