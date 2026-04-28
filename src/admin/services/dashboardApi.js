/**
 * src/admin/services/dashboardApi.js
 * ====================================
 * Wrapper d'API exclusif au tableau de bord admin.
 *
 * Tous les endpoints utilisés EXISTENT déjà côté backend.
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

const get = (url) =>
  fetch(`${BASE}${url}`, { headers: authHeaders() }).then(handleResponse);

// ══════════════════════════════════════════════════════════
//  KPIs HERO + ÉVOLUTION
// ══════════════════════════════════════════════════════════

/** Dashboard global — revenus, commission, soldes (mois et année). */
export const fetchFinanceDashboard = () =>
  get("/finances/dashboard");

/** Évolution mensuelle des revenus pour une année donnée. */
export const fetchRevenusEvolution = (annee = new Date().getFullYear()) =>
  get(`/finances/revenus?periode=mois&annee=${annee}`);

// ══════════════════════════════════════════════════════════
//  CENTRE D'ALERTES
// ══════════════════════════════════════════════════════════

export const fetchPendingPromotions = () =>
  get("/promotions/admin/pending-count");

export const fetchPendingSupports = () =>
  get("/admin/support/conversations?statut=EN_ATTENTE");

export const fetchPendingRetraits = () =>
  get("/finances/demandes-retrait?statut=EN_ATTENTE&page=1&per_page=1");

export const fetchPendingDemandesPartenaire = () =>
  get("/admin/partenaires/demandes?statut=EN_ATTENTE&page=1&per_page=1");

// ══════════════════════════════════════════════════════════
//  TOP 5 HÔTELS / PARTENAIRES
// ══════════════════════════════════════════════════════════

export const fetchTopPartenaires = (limit = 5) =>
  get(`/finances/partenaires?page=1&per_page=${limit}`);

export const fetchTopHotels = async (limit = 5) => {
  const data = await get(`/finances/partenaires?page=1&per_page=10`);
  const allHotels = [];
  for (const part of data.items || []) {
    try {
      const hots = await get(`/finances/partenaires/${part.id_partenaire}/hotels`);
      for (const h of hots.items || []) {
        allHotels.push({
          ...h,
          partenaire_nom: `${part.partenaire_prenom} ${part.partenaire_nom}`,
        });
      }
    } catch (_) { /* ignore */ }
  }
  return allHotels
    .sort((a, b) => (b.revenu_total || 0) - (a.revenu_total || 0))
    .slice(0, limit);
};

// ══════════════════════════════════════════════════════════
//  ACTIVITÉ RÉCENTE
// ══════════════════════════════════════════════════════════

/**
 * Les N dernières réservations enrichies (clients + visiteurs fusionnés).
 *
 * Utilise l'endpoint /reservations/admin/enrichi qui retourne :
 *   { items: [{ client_nom, client_prenom, hotel_nom, hotel_ville,
 *               voyage_titre, voyage_destination, total_ttc,
 *               date_reservation, source, statut, ... }] }
 */
export const fetchRecentReservations = (limit = 10) =>
  get(`/reservations/admin/enrichi?page=1&per_page=${limit}`);

// ══════════════════════════════════════════════════════════
//  MINI-KPIs MÉTIER
// ══════════════════════════════════════════════════════════

export const fetchHotelsStats = async () => {
  const all   = await get("/hotels?page=1&per_page=1&actif_only=false");
  const actif = await get("/hotels?page=1&per_page=1&actif_only=true");
  return {
    total: all.total || 0,
    actifs: actif.total || 0,
  };
};

export const fetchVoyagesStats = async () => {
  const all = await get("/voyages?page=1&per_page=1&actif_only=0");
  return { total: all.total || 0 };
};

export const fetchClientsStats = async () => {
  const all   = await get("/admin/clients?page=1&per_page=1");
  const actif = await get("/admin/clients?page=1&per_page=1&actif=true");
  return {
    total: all.total || 0,
    actifs: actif.total || 0,
  };
};

export const fetchPartenairesStats = async () => {
  const all = await get("/admin/partenaires?page=1&per_page=1");
  return { total: all.total || 0 };
};