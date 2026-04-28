// ══════════════════════════════════════════════════════════
//  src/partenaire/services/promotionsApi.js
//  Couche d'accès à l'API Promotions — Espace Partenaire
// ══════════════════════════════════════════════════════════

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
});

async function handleResponse(res) {
  if (res.status === 204) return true;
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }
  if (!res.ok) {
    const msg = data?.detail
      ? (typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail))
      : `Erreur ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

export const promotionsApi = {
  // ── Lister mes promotions ────────────────────────────
  list: (params = {}) => {
    const q = new URLSearchParams();
    if (params.hotel_id) q.set("hotel_id", params.hotel_id);
    if (params.statut)   q.set("statut",   params.statut);
    return fetch(`${BASE}/promotions/mes-promotions?${q}`, {
      headers: authHeaders(),
    }).then(handleResponse);
  },

  // ── Détail d'une promo ───────────────────────────────
  get: (id) =>
    fetch(`${BASE}/promotions/${id}`, { headers: authHeaders() })
      .then(handleResponse),

  // ── Créer une promo pour un hôtel ────────────────────
  create: (hotelId, data) =>
    fetch(`${BASE}/promotions/hotels/${hotelId}`, {
      method:  "POST",
      headers: authHeaders(),
      body:    JSON.stringify(data),
    }).then(handleResponse),

  // ── Modifier (uniquement si PENDING ou REJECTED) ─────
  update: (id, data) =>
    fetch(`${BASE}/promotions/${id}`, {
      method:  "PUT",
      headers: authHeaders(),
      body:    JSON.stringify(data),
    }).then(handleResponse),

  // ── Supprimer (uniquement si non APPROVED) ───────────
  delete: (id) =>
    fetch(`${BASE}/promotions/${id}`, {
      method:  "DELETE",
      headers: authHeaders(),
    }).then(handleResponse),

  // ✨ IA — Améliorer la description d'une promotion via Claude
  // Utilisé dans : PromoModal (MesPromotions.jsx)
  //
  // payload attendu :
  //   {
  //     titre: string,                // obligatoire
  //     pourcentage: number,          // obligatoire (1-99)
  //     date_debut?: string (YYYY-MM-DD),
  //     date_fin?: string (YYYY-MM-DD),
  //     description_brute: string,    // obligatoire
  //     hotel_nom?: string,
  //     hotel_ville?: string,
  //     hotel_etoiles?: number (1-5)
  //   }
  //
  // Retourne : { description_amelioree: string }
  generateDescriptionAI: (payload) =>
    fetch(`${BASE}/promotions/description/generate-ai`, {
      method:  "POST",
      headers: authHeaders(),
      body:    JSON.stringify(payload),
    }).then(handleResponse),
};