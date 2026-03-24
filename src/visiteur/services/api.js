const BASE = "http://localhost:8000/api/v1";

async function get(url) {
  const res = await fetch(url);
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }
  if (!res.ok) throw new Error(data.detail || `Erreur ${res.status}`);
  return data;
}

// Hôtels mis en avant (landing)
export const hotelsPublicApi = {
  featured:    ()           => get(`${BASE}/hotels/featured`),
  byVille:     (ville)      => get(`${BASE}/hotels?ville=${encodeURIComponent(ville)}&actif_only=true&per_page=12`),
  list: (params={}) => {
    const { ville, ...rest } = params;
    const q = new URLSearchParams({ page: 1, per_page: 12, actif_only: "true", ...rest });
    if (ville) q.set("ville", ville);
    return get(`${BASE}/hotels?${q}`);
  },
  getImages:   (id)         => get(`${BASE}/hotels/${id}/images`),
};

// Villes vedettes
export const villesApi = {
  list: () => get(`${BASE}/hotels/villes-vedettes`),
};

// Voyages
export const voyagesPublicApi = {
  list:      (params={})  => { const q = new URLSearchParams({page:1,per_page:12,actif_only:"true",...params}); return get(`${BASE}/voyages?${q}`); },
  getImages: (id)         => get(`${BASE}/voyages/${id}/images`),
};

// Image principale helper
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