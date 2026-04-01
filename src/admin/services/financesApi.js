/**
 * src/admin/services/financesApi.js
 * ====================================
 * Couche d'accès à l'API Finances — Admin.
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
  if (statut && statut.trim() !== "") q.set("statut_commission", statut);
  return get(`/finances/partenaires/${partId}/hotels/${hotelId}/reservations?${q}`);
};

// ── Soldes ───────────────────────────────────────────────
export const fetchSoldes = () => get("/finances/soldes-partenaires");

export const payerPartenaire = (id, note = "") =>
  post(`/finances/payer/${id}`, { note });

// ── Historique paiements ─────────────────────────────────
export const fetchPaiements = (page, perPage, { dateDebut, dateFin, montantMin, montantMax, search } = {}) => {
  const q = new URLSearchParams({ page, per_page: perPage });
  if (dateDebut)                               q.set("date_debut",   dateDebut);
  if (dateFin)                                 q.set("date_fin",     dateFin);
  if (montantMin !== "" && montantMin != null) q.set("montant_min",  montantMin);
  if (montantMax !== "" && montantMax != null) q.set("montant_max",  montantMax);
  if (search && search.trim())                 q.set("search",       search.trim());
  return get(`/finances/paiements?${q}`);
};

// ── Clients & Visiteurs ──────────────────────────────────
export const fetchClassementClients = (critere, limit) =>
  get(`/finances/classement-clients?critere=${critere}&limit=${limit}`);

// ── Demandes de retrait ─────────────────────────────── ✅ NOUVEAU
export const fetchDemandesRetrait = (page = 1, perPage = 20, { statut, idPartenaire } = {}) => {
  const q = new URLSearchParams({ page, per_page: perPage });
  if (statut)       q.set("statut",        statut);
  if (idPartenaire) q.set("id_partenaire", idPartenaire);
  return get(`/finances/demandes-retrait?${q}`);
};

export const validerDemande = (id, noteAdmin = "") =>
  post(`/finances/demandes-retrait/${id}/valider`, { note_admin: noteAdmin });

export const refuserDemande = (id, noteAdmin = "") =>
  post(`/finances/demandes-retrait/${id}/refuser`, { note_admin: noteAdmin });


// ── Factures paiements partenaires ────────────────────────
export const downloadFacturePaiement = async (paiementId) => {
  const res = await fetch(
    `${BASE}/finances/paiements/${paiementId}/pdf`,
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

export const renvoyerEmailPaiement = (paiementId) =>
  post(`/finances/paiements/${paiementId}/renvoyer-email`);