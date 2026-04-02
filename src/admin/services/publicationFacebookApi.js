// ══════════════════════════════════════════════════════════
//  src/admin/services/publicationFacebookApi.js
//  API calls pour les publications Facebook et la config token
// ══════════════════════════════════════════════════════════

const BASE = "http://localhost:8000/api/v1";

function authHeaders() {
  const token = localStorage.getItem("access_token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function handleResponse(res) {
  if (res.status === 204) return null;
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }
  if (!res.ok) {
    const msg = data.detail
      ? (typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail))
      : `Erreur ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

/* ── Publications ── */
export const publicationFacebookApi = {

  /* Lister toutes les publications */
  list: (params = {}) => {
    const q = new URLSearchParams({ page: 1, per_page: 50, ...params });
    return fetch(`${BASE}/admin/facebook/publications?${q}`, {
      headers: authHeaders(),
    }).then(handleResponse);
  },

  /* Créer une publication */
  create: (data) =>
    fetch(`${BASE}/admin/facebook/publications`, {
      method:  "POST",
      headers: authHeaders(),
      body:    JSON.stringify(data),
    }).then(handleResponse),

  /* Modifier une publication */
  update: (id, data) =>
    fetch(`${BASE}/admin/facebook/publications/${id}`, {
      method:  "PUT",
      headers: authHeaders(),
      body:    JSON.stringify(data),
    }).then(handleResponse),

  /* Supprimer une publication */
  delete: (id, deleteFromFacebook = true) =>
    fetch(`${BASE}/admin/facebook/publications/${id}?delete_from_facebook=${deleteFromFacebook}`, {
      method:  "DELETE",
      headers: authHeaders(),
    }).then(handleResponse),

  /* Récupérer le détail */
  get: (id) =>
    fetch(`${BASE}/admin/facebook/publications/${id}`, {
      headers: authHeaders(),
    }).then(handleResponse),
};

/* ── Config Token Facebook ── */
export const facebookConfigApi = {

  /* Lire la config actuelle */
  get: () =>
    fetch(`${BASE}/admin/facebook/config`, {
      headers: authHeaders(),
    }).then(handleResponse),

  /* Sauvegarder le token */
  save: (data) =>
    fetch(`${BASE}/admin/facebook/config`, {
      method:  "PUT",
      headers: authHeaders(),
      body:    JSON.stringify(data),
    }).then(handleResponse),
};
/* ── Récupérer le token Facebook depuis la BDD ── */
export async function getFacebookToken() {
  try {
    const config = await facebookConfigApi.get();
    return {
      token:   config?.page_access_token || null,
      page_id: config?.page_id           || null,
    };
  } catch {
    return { token: null, page_id: null };
  }
}