/**
 * src/partenaire/services/dashboardPartenaireApi.js
 * ===================================================
 * Couche d'accès API exclusive au tableau de bord partenaire.
 *
 * Tous les endpoints utilisés EXISTENT déjà côté backend — aucun ajout requis.
 *
 * Endpoints utilisés :
 *   GET /finances-partenaire/dashboard         → KPIs financiers
 *   GET /finances-partenaire/revenus?annee     → 12 mois revenus
 *   GET /finances-partenaire/mes-hotels        → hôtels + revenus financiers
 *   GET /hotels/mes-hotels                      → hôtels + note + nb_chambres
 *   GET /reservations/partenaire/mes-hotels    → stats clients/visiteurs par hôtel
 *   GET /reservations/partenaire/hotel/{id}    → détail réservations d'un hôtel
 *   GET /promotions/mes-promotions             → promotions du partenaire
 */

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
});

async function handleResponse(res) {
  if (res.status === 204) return null;
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

const get = (url) =>
  fetch(`${BASE}${url}`, { headers: authHeaders() }).then(handleResponse);

// ══════════════════════════════════════════════════════════
//  ENDPOINTS DASHBOARD
// ══════════════════════════════════════════════════════════

/** KPIs financiers : solde, revenu mois, évolution, nb_resas, revenu_année. */
export const fetchPartDashboard = () =>
  get("/finances-partenaire/dashboard");

/** Revenus mensuels d'une année (12 mois). */
export const fetchPartRevenusMensuels = (annee) =>
  get(`/finances-partenaire/revenus?annee=${annee}`);

/** Mes hôtels avec stats financières (revenu_mois, revenu_total, nb_resas). */
export const fetchPartHotelsFinances = () =>
  get("/finances-partenaire/mes-hotels");

/** Mes hôtels (catalogue : nom, ville, étoiles, note, nb_chambres, actif). */
export const fetchPartHotelsCatalogue = (params = {}) => {
  const q = new URLSearchParams({ page: 1, per_page: 100, ...params });
  return get(`/hotels/mes-hotels?${q}`);
};

/** Stats réservations par hôtel (nb_clients, nb_visiteurs, ca_total). */
export const fetchPartHotelsResaStats = () =>
  get("/reservations/partenaire/mes-hotels");

/** Réservations d'un hôtel (pour feed récent). */
export const fetchPartReservationsHotel = (hotelId, perPage = 5) =>
  get(`/reservations/partenaire/hotel/${hotelId}?page=1&per_page=${perPage}`);

/** Promotions du partenaire (toutes ou filtrées par statut). */
export const fetchPartPromotions = (statut = null) => {
  const q = new URLSearchParams();
  if (statut) q.set("statut", statut);
  return get(`/promotions/mes-promotions?${q}`);
};