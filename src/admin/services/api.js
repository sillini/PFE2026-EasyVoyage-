/**
 * admin/services/api.js
 */

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

// ── Réservations ──────────────────────────────────────────
export const reservationsApi = {
  list: (params = {}) => {
    const q = new URLSearchParams({ page: 1, per_page: 20, ...params });
    return fetch(`${BASE}/reservations?${q}`, { headers: authHeaders() }).then(handleResponse);
  },
  get:     (id) => fetch(`${BASE}/reservations/${id}`, { headers: authHeaders() }).then(handleResponse),
  annuler: (id) => fetch(`${BASE}/reservations/${id}/annuler`, { method: "POST", headers: authHeaders() }).then(handleResponse),
};

// ── Utilisateurs ──────────────────────────────────────────
export const utilisateursApi = {
  list: (params = {}) => {
    const q = new URLSearchParams({ page: 1, per_page: 20, ...params });
    return fetch(`${BASE}/auth/utilisateurs?${q}`, { headers: authHeaders() }).then(handleResponse);
  },
};

// ── Hôtels ────────────────────────────────────────────────
export const hotelsAdminApi = {
  list: (params = {}) => {
    const q = new URLSearchParams({ page: 1, per_page: 100, actif_only: 0, ...params });
    return fetch(`${BASE}/hotels?${q}`, { headers: authHeaders() }).then(handleResponse);
  },
  get:            (id)           => fetch(`${BASE}/hotels/${id}`, { headers: authHeaders() }).then(handleResponse),
  create:         (data)         => fetch(`${BASE}/hotels`, { method: "POST", headers: authHeaders(), body: JSON.stringify(data) }).then(handleResponse),
  update:         (id, data)     => fetch(`${BASE}/hotels/${id}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify(data) }).then(handleResponse),
  toggle:         (id, actif)    => fetch(`${BASE}/hotels/${id}/toggle`, { method: "PATCH", headers: authHeaders(), body: JSON.stringify({ actif }) }).then(handleResponse),
  toggleFeatured: (id, mis_en_avant) => fetch(`${BASE}/hotels/admin/${id}/featured`, { method: "PATCH", headers: authHeaders(), body: JSON.stringify({ mis_en_avant }) }).then(handleResponse),
  delete:         (id)           => fetch(`${BASE}/hotels/${id}`, { method: "DELETE", headers: authHeaders() }).then(handleResponse),
};

// ── Villes vedettes ────────────────────────────────────────
export const villesVedettesApi = {
  list:   ()         => fetch(`${BASE}/hotels/admin/villes-vedettes`, { headers: authHeaders() }).then(handleResponse),
  create: (data)     => fetch(`${BASE}/hotels/admin/villes-vedettes`, { method: "POST", headers: authHeaders(), body: JSON.stringify(data) }).then(handleResponse),
  update: (id, data) => fetch(`${BASE}/hotels/admin/villes-vedettes/${id}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify(data) }).then(handleResponse),
  delete: (id)       => fetch(`${BASE}/hotels/admin/villes-vedettes/${id}`, { method: "DELETE", headers: authHeaders() }).then(handleResponse),
};

// ── Voyages ───────────────────────────────────────────────
export const voyagesAdminApi = {
  list: (params = {}) => {
    const q = new URLSearchParams({ page: 1, per_page: 100, actif_only: 0, ...params });
    return fetch(`${BASE}/voyages?${q}`, { headers: authHeaders() }).then(handleResponse);
  },
  get:    (id)       => fetch(`${BASE}/voyages/${id}`, { headers: authHeaders() }).then(handleResponse),
  create: (data)     => fetch(`${BASE}/voyages`, { method: "POST", headers: authHeaders(), body: JSON.stringify(data) }).then(handleResponse),
  update: (id, data) => fetch(`${BASE}/voyages/${id}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify(data) }).then(handleResponse),
  delete: (id)       => fetch(`${BASE}/voyages/${id}`, { method: "DELETE", headers: authHeaders() }).then(handleResponse),
};

// ── Partenaires Admin ─────────────────────────────────────
export const partenairesApi = {
  invite: (email) =>
    fetch(`${BASE}/admin/partenaires/invite`, {
      method: "POST", headers: authHeaders(),
      body: JSON.stringify({ email }),
    }).then(handleResponse),

  verifyCode: (email, code) =>
    fetch(`${BASE}/admin/partenaires/verify-code`, {
      method: "POST", headers: authHeaders(),
      body: JSON.stringify({ email, code }),
    }).then(handleResponse),

  create: (data) =>
    fetch(`${BASE}/admin/partenaires/create`, {
      method: "POST", headers: authHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  list: (params = {}) => {
    const q = new URLSearchParams({ page: 1, per_page: 100, ...params });
    return fetch(`${BASE}/admin/partenaires?${q}`, { headers: authHeaders() }).then(handleResponse);
  },

  get: (id) =>
    fetch(`${BASE}/admin/partenaires/${id}`, { headers: authHeaders() }).then(handleResponse),

  toggle: (id, actif) =>
    fetch(`${BASE}/admin/partenaires/${id}/toggle`, {
      method: "PATCH", headers: authHeaders(),
      body: JSON.stringify({ actif }),
    }).then(handleResponse),
};

// ── Marketing ─────────────────────────────────────────────
export const marketingAdminApi = {
  list: (params = {}) => {
    const q = new URLSearchParams({ page: 1, per_page: 20, ...params });
    return fetch(`${BASE}/marketing?${q}`, { headers: authHeaders() }).then(handleResponse);
  },
  valider: (id, data) => fetch(`${BASE}/marketing/${id}/valider`, { method: "POST", headers: authHeaders(), body: JSON.stringify(data) }).then(handleResponse),
  activer: (id, data) => fetch(`${BASE}/marketing/${id}/activer`, { method: "POST", headers: authHeaders(), body: JSON.stringify(data) }).then(handleResponse),
};

// ── Factures ──────────────────────────────────────────────
export const facturesAdminApi = {
  list: (params = {}) => {
    const q = new URLSearchParams({ page: 1, per_page: 20, ...params });
    return fetch(`${BASE}/factures?${q}`, { headers: authHeaders() }).then(handleResponse);
  },
  get:            (id) => fetch(`${BASE}/factures/${id}`, { headers: authHeaders() }).then(handleResponse),
  telechargerPdf: (id) => fetch(`${BASE}/factures/${id}/pdf`, { headers: authHeaders() }),
};

// ── Finances ──────────────────────────────────────────────
export const financesAdminApi = {
  // ── Existants ───────────────────────────────────────────
  dashboard: () =>
    fetch(`${BASE}/finances/dashboard`, { headers: authHeaders() }).then(handleResponse),

  revenus: (params = {}) => {
    const q = new URLSearchParams(params);
    return fetch(`${BASE}/finances/revenus?${q}`, { headers: authHeaders() }).then(handleResponse);
  },

  commissions: (params = {}) => {
    const q = new URLSearchParams(params);
    return fetch(`${BASE}/finances/commissions?${q}`, { headers: authHeaders() }).then(handleResponse);
  },

  soldesPartenaires: () =>
    fetch(`${BASE}/finances/soldes-partenaires`, { headers: authHeaders() }).then(handleResponse),

  payer: (id_partenaire, note = "") =>
    fetch(`${BASE}/finances/payer/${id_partenaire}`, {
      method: "POST", headers: authHeaders(),
      body: JSON.stringify({ note }),
    }).then(handleResponse),

  paiements: (params = {}) => {
    const q = new URLSearchParams(params);
    return fetch(`${BASE}/finances/paiements?${q}`, { headers: authHeaders() }).then(handleResponse);
  },

  clientsRentables: (limit = 50) =>
    fetch(`${BASE}/finances/clients-rentables?limit=${limit}`, { headers: authHeaders() }).then(handleResponse),

  // ── Nouveaux : drill-down partenaires ────────────────────
  partenaires: (params = {}) => {
    const q = new URLSearchParams(params);
    return fetch(`${BASE}/finances/partenaires?${q}`, { headers: authHeaders() }).then(handleResponse);
  },

  hotelsPartenaire: (id_partenaire) =>
    fetch(`${BASE}/finances/partenaires/${id_partenaire}/hotels`, { headers: authHeaders() }).then(handleResponse),

  reservationsHotel: (id_partenaire, id_hotel, params = {}) => {
    const q = new URLSearchParams(params);
    return fetch(
      `${BASE}/finances/partenaires/${id_partenaire}/hotels/${id_hotel}/reservations?${q}`,
      { headers: authHeaders() }
    ).then(handleResponse);
  },

  // ── Nouveau : classement clients + visiteurs ─────────────
  classementClients: (params = {}) => {
    const q = new URLSearchParams(params);
    return fetch(`${BASE}/finances/classement-clients?${q}`, { headers: authHeaders() }).then(handleResponse);
  },
};

// ── Profil Admin ──────────────────────────────────────────
export const profilApi = {
  get: () => fetch(`${BASE}/auth/me`, { headers: authHeaders() }).then(handleResponse),

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

// ── Hero Slides Admin ─────────────────────────────────────
export const heroSlidesApi = {
  list: () =>
    fetch(`${BASE}/admin/hero-slides`, { headers: authHeaders() }).then(handleResponse),
  create: (data) =>
    fetch(`${BASE}/admin/hero-slides`, {
      method: "POST", headers: authHeaders(), body: JSON.stringify(data),
    }).then(handleResponse),
  update: (id, data) =>
    fetch(`${BASE}/admin/hero-slides/${id}`, {
      method: "PUT", headers: authHeaders(), body: JSON.stringify(data),
    }).then(handleResponse),
  toggle: (id, actif) =>
    fetch(`${BASE}/admin/hero-slides/${id}/toggle`, {
      method: "PATCH", headers: authHeaders(), body: JSON.stringify({ actif }),
    }).then(handleResponse),
  delete: (id) =>
    fetch(`${BASE}/admin/hero-slides/${id}`, {
      method: "DELETE", headers: authHeaders(),
    }).then(handleResponse),
};

// ── Support Admin ─────────────────────────────────────────
export const adminSupportApi = {

  createConversation: (data) =>
    fetch(`${BASE}/admin/support/conversations`, {
      method:  "POST",
      headers: authHeaders(),
      body:    JSON.stringify(data),
    }).then(handleResponse),

  listConversations: (statut = "") => {
    const q = statut ? `?statut=${statut}` : "";
    return fetch(`${BASE}/admin/support/conversations${q}`, {
      headers: authHeaders(),
    }).then(handleResponse);
  },

  getConversation: (id) =>
    fetch(`${BASE}/admin/support/conversations/${id}`, {
      headers: authHeaders(),
    }).then(handleResponse),

  acceptConversation: (id) =>
    fetch(`${BASE}/admin/support/conversations/${id}/accept`, {
      method:  "PATCH",
      headers: authHeaders(),
    }).then(handleResponse),

  closeConversation: (id) =>
    fetch(`${BASE}/admin/support/conversations/${id}/close`, {
      method:  "PATCH",
      headers: authHeaders(),
    }).then(handleResponse),

  sendMessage: (id, contenu) =>
    fetch(`${BASE}/admin/support/conversations/${id}/messages`, {
      method:  "POST",
      headers: authHeaders(),
      body:    JSON.stringify({ contenu }),
    }).then(handleResponse),

  getNotifications: () =>
    fetch(`${BASE}/support/notifications`, {
      headers: authHeaders(),
    }).then(handleResponse),

  markAllRead: () =>
    fetch(`${BASE}/support/notifications/read-all`, {
      method:  "PATCH",
      headers: authHeaders(),
    }).then(handleResponse),

  markRead: (id) =>
    fetch(`${BASE}/support/notifications/${id}/read`, {
      method:  "PATCH",
      headers: authHeaders(),
    }).then(handleResponse),
};




// ══════════════════════════════════════════════════════════
//  AJOUTER CE BLOC dans src/admin/services/api.js
//  (après les autres exports, ex: après marketingAdminApi)
// ══════════════════════════════════════════════════════════

// ── Promotions Admin ──────────────────────────────────────
export const promotionsAdminApi = {
  // Liste toutes les promos avec filtre optionnel par statut
  list: (params = {}) => {
    const q = new URLSearchParams({ page: 1, per_page: 50, ...params });
    // Supprimer les paramètres vides
    [...q.entries()].forEach(([k, v]) => { if (!v) q.delete(k); });
    return fetch(`${BASE}/promotions/admin/all?${q}`, { headers: authHeaders() })
      .then(handleResponse);
  },

  // Nombre de promotions PENDING
  pendingCount: () =>
    fetch(`${BASE}/promotions/admin/pending-count`, { headers: authHeaders() })
      .then(handleResponse),

  // Approuver ou refuser
  decision: (id, data) =>
    fetch(`${BASE}/promotions/admin/${id}/decision`, {
      method:  "POST",
      headers: authHeaders(),
      body:    JSON.stringify(data),
    }).then(handleResponse),

  // Activer / désactiver une promo approuvée
  toggle: (id, actif) =>
    fetch(`${BASE}/promotions/admin/${id}/toggle?actif=${actif}`, {
      method:  "PATCH",
      headers: authHeaders(),
    }).then(handleResponse),
};