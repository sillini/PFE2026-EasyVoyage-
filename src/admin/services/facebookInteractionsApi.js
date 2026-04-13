// src/admin/services/facebookInteractionsApi.js
// ══════════════════════════════════════════════════════════
//  API calls — Interactions & Dashboard Facebook
// ══════════════════════════════════════════════════════════

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

export const facebookInteractionsApi = {

  /** Synchroniser les stats d'une publication unique */
  syncPost: (pubId) =>
    fetch(`${BASE}/admin/facebook/publications/${pubId}/sync-stats`, {
      method: "POST",
      headers: authHeaders(),
    }).then(handleResponse),

  /** Synchroniser toutes les publications publiées */
  syncAll: () =>
    fetch(`${BASE}/admin/facebook/publications/sync-all-stats`, {
      method: "POST",
      headers: authHeaders(),
    }).then(handleResponse),

  /** Récupérer le dashboard global */
  getDashboard: () =>
    fetch(`${BASE}/admin/facebook/dashboard`, {
      headers: authHeaders(),
    }).then(handleResponse),
};