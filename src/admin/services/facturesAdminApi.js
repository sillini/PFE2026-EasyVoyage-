/**
 * src/admin/services/facturesAdminApi.js
 * ========================================
 * Accès API — Page Admin Factures.
 */

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
});

const handleResponse = async (res) => {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Erreur ${res.status}`);
  }
  return res.json();
};

/** KPIs globaux (cartes en haut) */
export const fetchFacturesKpis = () =>
  fetch(`${BASE}/factures/admin/kpis`, { headers: authHeaders() })
    .then(handleResponse);

/** Liste paginée unifiée (clients + visiteurs + partenaires) */
export const fetchFacturesAdmin = ({
  type, statut, search, date_debut, date_fin,
  page = 1, per_page = 50,
} = {}) => {
  const q = new URLSearchParams({ page, per_page });
  if (type)       q.set("type",       type);
  if (statut)     q.set("statut",     statut);
  if (search?.trim()) q.set("search", search.trim());
  if (date_debut) q.set("date_debut", date_debut);
  if (date_fin)   q.set("date_fin",   date_fin);

  return fetch(`${BASE}/factures/admin?${q}`, { headers: authHeaders() })
    .then(handleResponse);
};

/** Détail enrichi d'une facture */
export const fetchFactureDetail = (id, type) =>
  fetch(`${BASE}/factures/admin/${id}/detail?type=${type}`, {
    headers: authHeaders(),
  }).then(handleResponse);

/** Télécharge le PDF et déclenche le téléchargement navigateur */
export const downloadFacturePdf = async (id, type, filename = `facture_${id}.pdf`) => {
  const res = await fetch(`${BASE}/factures/admin/${id}/pdf?type=${type}`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Erreur PDF ${res.status}`);
  }
  const blob = await res.blob();
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};