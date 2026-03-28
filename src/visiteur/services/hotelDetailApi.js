// src/visiteur/services/hotelDetailApi.js
const BASE = "http://localhost:8000/api/v1";

function authHeaders() {
  const t = localStorage.getItem("access_token");
  return { "Content-Type": "application/json", ...(t ? { Authorization: "Bearer " + t } : {}) };
}

async function get(url) {
  const res  = await fetch(url, { headers: authHeaders() });
  const text = await res.text();
  let d; try { d = JSON.parse(text); } catch { d = {}; }
  if (!res.ok) throw new Error(d.detail || "Erreur " + res.status);
  return d;
}

async function post(url, body) {
  const res  = await fetch(url, { method: "POST", headers: authHeaders(), body: JSON.stringify(body) });
  const text = await res.text();
  let d; try { d = JSON.parse(text); } catch { d = {}; }
  if (!res.ok) {
    if (res.status === 401) throw new Error("Connectez-vous avec un compte client pour laisser un avis.");
    if (res.status === 403) throw new Error("Seuls les clients peuvent laisser un avis.");
    if (res.status === 409) throw new Error("Vous avez déjà laissé un avis pour cet hôtel.");
    throw new Error(d.detail || "Erreur " + res.status);
  }
  return d;
}

export const hotelDetailApi = {
  getHotel:    id         => get(`${BASE}/hotels/${id}`),
  getImages:   id         => get(`${BASE}/hotels/${id}/images`),
  getChambres: id         => get(`${BASE}/hotels/${id}/chambres?per_page=50`),
  getTarifs:   (hId, cId) => get(`${BASE}/hotels/${hId}/chambres/${cId}/tarifs?per_page=50`),
  getAvis:     id         => get(`${BASE}/hotels/${id}/avis?per_page=20&page=1`),
  postAvis:    (id, data) => post(`${BASE}/hotels/${id}/avis`, data),
};