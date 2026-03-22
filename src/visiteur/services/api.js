/**
 * visiteur/services/api.js
 * Appels API publics (sans authentification)
 */

const BASE = "http://localhost:8000/api/v1";

async function get(url) {
  const res = await fetch(url);
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }
  if (!res.ok) throw new Error(data.detail || `Erreur ${res.status}`);
  return data;
}

// ── Hôtels publics ────────────────────────────────────────
export const hotelsPublicApi = {
  list: (params = {}) => {
    const q = new URLSearchParams({ page: 1, per_page: 8, actif_only: "true", ...params });
    return get(`${BASE}/hotels?${q}`);
  },
  getImages: (id) => get(`${BASE}/hotels/${id}/images`),
};

// ── Voyages publics ───────────────────────────────────────
export const voyagesPublicApi = {
  list: (params = {}) => {
    const q = new URLSearchParams({ page: 1, per_page: 8, actif_only: "true", ...params });
    return get(`${BASE}/voyages?${q}`);
  },
  getImages: (id) => get(`${BASE}/voyages/${id}/images`),
};

// ── Helper image principale ───────────────────────────────
export async function fetchMainImage(type, id) {
  try {
    const res = type === "hotel"
      ? await hotelsPublicApi.getImages(id)
      : await voyagesPublicApi.getImages(id);
    const list = Array.isArray(res) ? res : res?.items || [];
    const main = list.find(i => i.type === "PRINCIPALE") || list[0];
    return main?.url || null;
  } catch { return null; }
}