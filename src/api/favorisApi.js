/**
 * src/api/favorisApi.js
 * ─────────────────────
 * Client API pour la gestion des favoris.
 * Toutes les requêtes nécessitent un token JWT CLIENT.
 */

const BASE = "http://localhost:8000/api/v1";

function authHeaders() {
  const token = localStorage.getItem("access_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ── Toggle (ajouter / retirer) ─────────────────────────────
export async function toggleFavori({ id_hotel, id_voyage }) {
  const res = await fetch(`${BASE}/favoris/toggle`, {
    method:  "POST",
    headers: authHeaders(),
    body:    JSON.stringify({ id_hotel, id_voyage }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Erreur favoris");
  return data; // { favori: bool, message: string }
}

// ── Liste paginée ──────────────────────────────────────────
export async function listFavoris({ type = null, page = 1, per_page = 12 } = {}) {
  const params = new URLSearchParams({ page, per_page });
  if (type) params.set("type", type);
  const res = await fetch(`${BASE}/favoris?${params}`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Erreur favoris");
  return data; // { total, nb_hotels, nb_voyages, items }
}

// ── IDs en favori (pour badges) ────────────────────────────
export async function getFavoriIds() {
  const res = await fetch(`${BASE}/favoris/ids`, { headers: authHeaders() });
  if (!res.ok) return { hotel_ids: [], voyage_ids: [] };
  return await res.json(); // { hotel_ids: [...], voyage_ids: [...] }
}

// ── Statut d'un item ───────────────────────────────────────
export async function getFavoriStatus({ id_hotel, id_voyage }) {
  const params = new URLSearchParams();
  if (id_hotel)  params.set("id_hotel",  id_hotel);
  if (id_voyage) params.set("id_voyage", id_voyage);
  const res = await fetch(`${BASE}/favoris/status?${params}`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) return { favori: false };
  return data; // { favori: bool, id_hotel, id_voyage }
}