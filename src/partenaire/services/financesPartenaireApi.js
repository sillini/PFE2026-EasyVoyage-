/**
 * src/partenaire/services/financesPartenaireApi.js
 * ==================================================
 * Couche d'accès à l'API Finance — Espace Partenaire.
 * Modification : fetchPartReservations accepte maintenant numeroFacture
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

export const fetchPartDashboard = () => get("/finances-partenaire/dashboard");
export const fetchPartRevenus   = (annee) => get(`/finances-partenaire/revenus?annee=${annee}`);
export const fetchPartHotels    = () => get("/finances-partenaire/mes-hotels");
export const fetchPartPaiements = (page = 1, perPage = 20) =>
  get(`/finances-partenaire/paiements?page=${page}&per_page=${perPage}`);
export const fetchMesDemandes   = (page = 1, perPage = 20) =>
  get(`/finances-partenaire/mes-demandes?page=${page}&per_page=${perPage}`);
export const postDemandeRetrait = (montant, note = "") =>
  post("/finances-partenaire/demande-retrait", { montant, note });

/**
 * Réservations d'un hôtel — avec recherche N° facture ajoutée.
 * @param {number} idHotel
 * @param {number} page
 * @param {number} perPage
 * @param {string} [statut]         - CONFIRMEE | TERMINEE | ANNULEE
 * @param {string} [search]         - nom ou email client
 * @param {string} [numeroFacture]  - N° facture (FAC-2026-…)
 */
export const fetchPartReservations = (
  idHotel, page, perPage,
  statut = "", search = "", numeroFacture = ""
) => {
  const q = new URLSearchParams({ page, per_page: perPage });
  if (statut        && statut.trim())        q.set("statut",          statut.trim());
  if (search        && search.trim())        q.set("search",          search.trim());
  if (numeroFacture && numeroFacture.trim()) q.set("numero_facture",  numeroFacture.trim());
  return get(`/finances-partenaire/mes-hotels/${idHotel}/reservations?${q}`);
};

// ── Télécharger facture PDF ───────────────────────────────
export const downloadFacturePdf = async (paiementId) => {
  const res = await fetch(
    `${BASE}/finances-partenaire/paiements/${paiementId}/pdf`,
    { headers: authHeaders() }
  );
  if (!res.ok) throw new Error("PDF indisponible");
  const blob = await res.blob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `facture_paiement_${paiementId}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
};