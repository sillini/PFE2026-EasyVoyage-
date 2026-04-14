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
    if (params.hotel_id)   q.set("hotel_id",   params.hotel_id);
    if (params.actif_only) q.set("actif_only", "true");
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

  // ── Modifier ─────────────────────────────────────────
  update: (id, data) =>
    fetch(`${BASE}/promotions/${id}`, {
      method:  "PUT",
      headers: authHeaders(),
      body:    JSON.stringify(data),
    }).then(handleResponse),

  // ── Activer / Désactiver ─────────────────────────────
  toggle: (id, actif) =>
    fetch(`${BASE}/promotions/${id}/toggle?actif=${actif}`, {
      method:  "PATCH",
      headers: authHeaders(),
    }).then(handleResponse),

  // ── Supprimer ────────────────────────────────────────
  delete: (id) =>
    fetch(`${BASE}/promotions/${id}`, {
      method:  "DELETE",
      headers: authHeaders(),
    }).then(async (res) => {
      if (!res.ok && res.status !== 204) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.detail || `Erreur ${res.status}`);
      }
      return true;
    }),
};