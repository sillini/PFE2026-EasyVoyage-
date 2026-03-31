/**
 * services/financesApi.js
 * ========================
 * Couche d'accès à l'API Finances.
 * Toutes les fonctions fetch sont ici — aucun composant n'appelle fetch directement.
 */

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
});

const get = (url) =>
  fetch(`${BASE}${url}`, { headers: authHeaders() }).then((r) => r.json());

const post = (url, body = {}) =>
  fetch(`${BASE}${url}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  }).then((r) => r.json());

// ── Dashboard ────────────────────────────────────────────
export const fetchDashboard = () => get("/finances/dashboard");

// ── Revenus ──────────────────────────────────────────────
export const fetchRevenus = (periode, annee) =>
  get(`/finances/revenus?periode=${periode}&annee=${annee}`);

// ── Partenaires ──────────────────────────────────────────
export const fetchPartenaires = (page, perPage, search) => {
  const q = new URLSearchParams({ page, per_page: perPage });
  if (search) q.set("search", search);
  return get(`/finances/partenaires?${q}`);
};

export const fetchHotelsPartenaire = (partId) =>
  get(`/finances/partenaires/${partId}/hotels`);

export const fetchReservationsHotel = (partId, hotelId, page, perPage, statut) => {
  const q = new URLSearchParams({ page, per_page: perPage });
  // statut_commission omis si vide — le backend rejette les strings vides
  if (statut && statut.trim() !== "") q.set("statut_commission", statut);
  return get(`/finances/partenaires/${partId}/hotels/${hotelId}/reservations?${q}`);
};

// ── Soldes ───────────────────────────────────────────────
export const fetchSoldes = () => get("/finances/soldes-partenaires");

export const payerPartenaire = (id, note = "") =>
  post(`/finances/payer/${id}`, { note });

// ── Historique ───────────────────────────────────────────
export const fetchPaiements = (page, perPage, { dateDebut, dateFin, montantMin, montantMax, search } = {}) => {
  const q = new URLSearchParams({ page, per_page: perPage });
  if (dateDebut)                          q.set("date_debut",   dateDebut);
  if (dateFin)                            q.set("date_fin",     dateFin);
  if (montantMin !== "" && montantMin != null) q.set("montant_min", montantMin);
  if (montantMax !== "" && montantMax != null) q.set("montant_max", montantMax);
  if (search && search.trim())            q.set("search",       search.trim());
  return get(`/finances/paiements?${q}`);
};

// ── Clients & Visiteurs ──────────────────────────────────
export const fetchClassementClients = (critere, limit) =>
  get(`/finances/classement-clients?critere=${critere}&limit=${limit}`);