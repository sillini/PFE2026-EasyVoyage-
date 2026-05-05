/**
 * src/partenaire/services/notificationsApi.js
 * =============================================
 * Couche d'accès API exclusive aux notifications du partenaire.
 *
 * Tous les endpoints utilisés EXISTENT déjà côté backend
 * (ils sont communs à admin & partenaire grâce à `get_current_user`).
 */

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
});

async function handleResponse(res) {
  if (res.status === 204) return true;
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

export const notificationsApi = {
  // ── Liste complète (jusqu'à 200 dernières) ────────────
  getNotifications: () =>
    fetch(`${BASE}/support/notifications`, { headers: authHeaders() })
      .then(handleResponse),

  // ── Compteur léger (pour polling sidebar/cloche) ──────
  unreadCount: () =>
    fetch(`${BASE}/support/notifications/unread-count`, { headers: authHeaders() })
      .then(handleResponse),

  // ── Marquer une notif lue ─────────────────────────────
  markRead: (id) =>
    fetch(`${BASE}/support/notifications/${id}/read`, {
      method:  "PATCH",
      headers: authHeaders(),
    }).then(handleResponse),

  // ── Tout marquer lu ───────────────────────────────────
  markAllRead: () =>
    fetch(`${BASE}/support/notifications/read-all`, {
      method:  "PATCH",
      headers: authHeaders(),
    }).then(handleResponse),

  // ── Supprimer une notif ───────────────────────────────
  deleteNotification: (id) =>
    fetch(`${BASE}/support/notifications/${id}`, {
      method:  "DELETE",
      headers: authHeaders(),
    }).then(handleResponse),

  // ── Vider toutes les notifs lues ──────────────────────
  deleteAllRead: () =>
    fetch(`${BASE}/support/notifications/read/all`, {
      method:  "DELETE",
      headers: authHeaders(),
    }).then(handleResponse),
};