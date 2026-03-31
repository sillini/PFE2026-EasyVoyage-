/**
 * src/partenaire/services/financesPartenaireApi.js
 * ==================================================
 * Couche d'accès à l'API Finance — Espace Partenaire.
 * Toutes les routes pointent vers /finances-partenaire/...
 * Le JWT du partenaire connecté est envoyé automatiquement.
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
export const fetchPartDashboard = () =>
  get("/finances-partenaire/dashboard");

// ── Revenus mensuels (graphique) ─────────────────────────
export const fetchPartRevenus = (annee) =>
  get(`/finances-partenaire/revenus?annee=${annee}`);

// ── Mes hôtels ───────────────────────────────────────────
export const fetchPartHotels = () =>
  get("/finances-partenaire/mes-hotels");

// ── Réservations d'un hôtel (drill-down) ─────────────────
export const fetchPartReservations = (idHotel, page, perPage, statut, search) => {
  const q = new URLSearchParams({ page, per_page: perPage });
  if (statut && statut.trim()) q.set("statut", statut);
  if (search && search.trim()) q.set("search", search.trim());
  return get(`/finances-partenaire/mes-hotels/${idHotel}/reservations?${q}`);
};

// ── Paiements reçus ───────────────────────────────────────
export const fetchPartPaiements = (page, perPage) =>
  get(`/finances-partenaire/paiements?page=${page}&per_page=${perPage}`);

// ── Demande de retrait ────────────────────────────────────
export const postDemandeRetrait = (montant, note = "") =>
  post("/finances-partenaire/demande-retrait", { montant, note });