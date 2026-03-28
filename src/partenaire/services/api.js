// src/partenaire/services/api.js — VERSION CORRIGÉE
//
// CORRECTIONS :
//   ✅ hotelsApi.mesHotels() → GET /hotels/mes-hotels  (seulement hôtels du partenaire connecté)
//   ✅ hotelsApi.list()      → GET /hotels             (tous les hôtels, NE PAS utiliser côté partenaire)
//
// FICHIERS À MODIFIER côté partenaire :
//   MesHotels.jsx    : remplacer hotelsApi.list()  →  hotelsApi.mesHotels()
//   ChambresPage.jsx : remplacer hotelsApi.list()  →  hotelsApi.mesHotels()

const CLOUDINARY_CLOUD  = "dzfznxn0q";
const CLOUDINARY_PRESET = "Image_Hotel";

export async function uploadImageCloudinary(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_PRESET);
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`,
    { method: "POST", body: formData }
  );
  if (!res.ok) throw new Error("Échec de l'upload Cloudinary");
  const data = await res.json();
  return data.secure_url;
}

const BASE = "http://localhost:8000/api/v1";

function authHeaders() {
  const token = localStorage.getItem("access_token");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
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

// ── Hotels API ────────────────────────────────────────────
export const hotelsApi = {

  // ✅ ESPACE PARTENAIRE — uniquement ses propres hôtels (filtre par JWT)
  // Utiliser dans : MesHotels.jsx, ChambresPage.jsx
  mesHotels: (params = {}) => {
    const q = new URLSearchParams({ page: 1, per_page: 50, ...params });
    return fetch(`${BASE}/hotels/mes-hotels?${q}`, { headers: authHeaders() })
      .then(handleResponse);
  },

  // ⚠️  list() retourne TOUS les hôtels — NE PAS utiliser dans les pages partenaire
  list: (params = {}) => {
    const q = new URLSearchParams({ page: 1, per_page: 50, ...params });
    return fetch(`${BASE}/hotels?${q}`, { headers: authHeaders() })
      .then(handleResponse);
  },

  get: (id) =>
    fetch(`${BASE}/hotels/${id}`, { headers: authHeaders() }).then(handleResponse),

  create: (data) =>
    fetch(`${BASE}/hotels`, {
      method: "POST", headers: authHeaders(), body: JSON.stringify(data),
    }).then(handleResponse),

  update: (id, data) =>
    fetch(`${BASE}/hotels/${id}`, {
      method: "PUT", headers: authHeaders(), body: JSON.stringify(data),
    }).then(handleResponse),

  delete: (id) =>
    fetch(`${BASE}/hotels/${id}`, {
      method: "DELETE", headers: authHeaders(),
    }).then(handleResponse),

  listTypesChambre: () =>
    fetch(`${BASE}/hotels/types-chambre`, { headers: authHeaders() }).then(handleResponse),

  listTypesReservation: () =>
    fetch(`${BASE}/hotels/types-reservation`, { headers: authHeaders() }).then(handleResponse),

  getAvis: (id) =>
    fetch(`${BASE}/hotels/${id}/avis`, { headers: authHeaders() }).then(handleResponse),
};

// ── Disponibilités API ────────────────────────────────────
export const disponibiliteApi = {
  getHotelDisponibilites: (hotelId, dateDebut, dateFin) => {
    const q = new URLSearchParams({ date_debut: dateDebut, date_fin: dateFin });
    return fetch(`${BASE}/hotels/${hotelId}/disponibilites?${q}`, { headers: authHeaders() })
      .then(handleResponse);
  },
  getChambreDisponibilite: (hotelId, chambreId, dateDebut, dateFin) => {
    const q = new URLSearchParams({ date_debut: dateDebut, date_fin: dateFin });
    return fetch(`${BASE}/hotels/${hotelId}/chambres/${chambreId}/disponibilite?${q}`, { headers: authHeaders() })
      .then(handleResponse);
  },
};

// ── Chambres API ──────────────────────────────────────────
export const chambresApi = {
  list: (hotelId, params = {}) => {
    const q = new URLSearchParams(params);
    return fetch(`${BASE}/hotels/${hotelId}/chambres?${q}`, { headers: authHeaders() })
      .then(handleResponse);
  },
  get: (hotelId, chambreId) =>
    fetch(`${BASE}/hotels/${hotelId}/chambres/${chambreId}`, { headers: authHeaders() })
      .then(handleResponse),
  create: (hotelId, data) =>
    fetch(`${BASE}/hotels/${hotelId}/chambres`, {
      method: "POST", headers: authHeaders(), body: JSON.stringify(data),
    }).then(handleResponse),
  update: (hotelId, chambreId, data) =>
    fetch(`${BASE}/hotels/${hotelId}/chambres/${chambreId}`, {
      method: "PUT", headers: authHeaders(), body: JSON.stringify(data),
    }).then(handleResponse),
  delete: (hotelId, chambreId) =>
    fetch(`${BASE}/hotels/${hotelId}/chambres/${chambreId}`, {
      method: "DELETE", headers: authHeaders(),
    }).then(handleResponse),
};

// ── Tarifs API ────────────────────────────────────────────
export const tarifsApi = {
  list: (hotelId, chambreId) =>
    fetch(`${BASE}/hotels/${hotelId}/chambres/${chambreId}/tarifs`, { headers: authHeaders() })
      .then(handleResponse),
  create: (hotelId, chambreId, data) =>
    fetch(`${BASE}/hotels/${hotelId}/chambres/${chambreId}/tarifs`, {
      method: "POST", headers: authHeaders(), body: JSON.stringify(data),
    }).then(handleResponse),
  update: (hotelId, chambreId, tarifId, data) =>
    fetch(`${BASE}/hotels/${hotelId}/chambres/${chambreId}/tarifs/${tarifId}`, {
      method: "PUT", headers: authHeaders(), body: JSON.stringify(data),
    }).then(handleResponse),
  delete: (hotelId, chambreId, tarifId) =>
    fetch(`${BASE}/hotels/${hotelId}/chambres/${chambreId}/tarifs/${tarifId}`, {
      method: "DELETE", headers: authHeaders(),
    }).then(handleResponse),
};

// ── Images API ────────────────────────────────────────────
export const imagesApi = {
  list: (hotelId) =>
    fetch(`${BASE}/hotels/${hotelId}/images`, { headers: authHeaders() }).then(handleResponse),
  add: (hotelId, url, type = "GALERIE") =>
    fetch(`${BASE}/hotels/${hotelId}/images`, {
      method: "POST", headers: authHeaders(), body: JSON.stringify({ url, type }),
    }).then(handleResponse),
  updateType: (hotelId, imageId, type) =>
    fetch(`${BASE}/hotels/${hotelId}/images/${imageId}`, {
      method: "PATCH", headers: authHeaders(), body: JSON.stringify({ type }),
    }).then(handleResponse),
  delete: (hotelId, imageId) =>
    fetch(`${BASE}/hotels/${hotelId}/images/${imageId}`, {
      method: "DELETE", headers: authHeaders(),
    }).then(handleResponse),
};

// ── Profil Partenaire ─────────────────────────────────────
export const profilPartenaireApi = {
  get: () =>
    fetch(`${BASE}/auth/me`, { headers: authHeaders() }).then(handleResponse),
  update: (data) =>
    fetch(`${BASE}/auth/me`, {
      method: "PUT", headers: authHeaders(), body: JSON.stringify(data),
    }).then(handleResponse),
  requestEmailChange: (new_email) =>
    fetch(`${BASE}/auth/me/request-email-change`, {
      method: "POST", headers: authHeaders(), body: JSON.stringify({ new_email }),
    }).then(handleResponse),
  confirmEmailChange: (new_email, code) =>
    fetch(`${BASE}/auth/me/confirm-email-change`, {
      method: "POST", headers: authHeaders(), body: JSON.stringify({ new_email, code }),
    }).then(handleResponse),
  requestPasswordChange: () =>
    fetch(`${BASE}/auth/me/request-password-change`, {
      method: "POST", headers: authHeaders(),
    }).then(handleResponse),
  confirmPasswordChange: (code, new_password, confirm_password) =>
    fetch(`${BASE}/auth/me/confirm-password-change`, {
      method: "POST", headers: authHeaders(),
      body: JSON.stringify({ code, new_password, confirm_password }),
    }).then(handleResponse),
};

// ── Marketing API ─────────────────────────────────────────
export const marketingApi = {
  list: (params = {}) => {
    const q = new URLSearchParams({ page: 1, per_page: 20, ...params });
    return fetch(`${BASE}/marketing?${q}`, { headers: authHeaders() }).then(handleResponse);
  },
  get: (id) =>
    fetch(`${BASE}/marketing/${id}`, { headers: authHeaders() }).then(handleResponse),
  create: (data) =>
    fetch(`${BASE}/marketing`, {
      method: "POST", headers: authHeaders(), body: JSON.stringify(data),
    }).then(handleResponse),
  update: (id, data) =>
    fetch(`${BASE}/marketing/${id}`, {
      method: "PUT", headers: authHeaders(), body: JSON.stringify(data),
    }).then(handleResponse),
  delete: (id) =>
    fetch(`${BASE}/marketing/${id}`, {
      method: "DELETE", headers: authHeaders(),
    }).then(handleResponse),
};

// ── Support Chat ──────────────────────────────────────────
export const supportApi = {
  createConversation: (data) =>
    fetch(`${BASE}/partenaire/support/conversations`, {
      method: "POST", headers: authHeaders(), body: JSON.stringify(data),
    }).then(handleResponse),
  listConversations: () =>
    fetch(`${BASE}/partenaire/support/conversations`, { headers: authHeaders() })
      .then(handleResponse),
  getConversation: (id) =>
    fetch(`${BASE}/partenaire/support/conversations/${id}`, { headers: authHeaders() })
      .then(handleResponse),
  sendMessage: (id, contenu) =>
    fetch(`${BASE}/partenaire/support/conversations/${id}/messages`, {
      method: "POST", headers: authHeaders(), body: JSON.stringify({ contenu }),
    }).then(handleResponse),
  closeConversation: (id) =>
    fetch(`${BASE}/partenaire/support/conversations/${id}/close`, {
      method: "PATCH", headers: authHeaders(),
    }).then(handleResponse),
  getNotifications: () =>
    fetch(`${BASE}/support/notifications`, { headers: authHeaders() }).then(handleResponse),
  markAllRead: () =>
    fetch(`${BASE}/support/notifications/read-all`, {
      method: "PATCH", headers: authHeaders(),
    }).then(handleResponse),
  markRead: (id) =>
    fetch(`${BASE}/support/notifications/${id}/read`, {
      method: "PATCH", headers: authHeaders(),
    }).then(handleResponse),
};