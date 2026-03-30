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
  getHotel:    id => get(`${BASE}/hotels/${id}`),
  getImages:   id => get(`${BASE}/hotels/${id}/images`),

  // Toutes les chambres actives (sans filtre période) — contient nb_chambres
  getChambres: id => get(`${BASE}/hotels/${id}/chambres?per_page=50`),

  // ── Disponibilités publiques filtrées par période ET capacité ─────────────
  // capaciteMin = adultes + enfants → ne retourne que les chambres qui peuvent
  // accueillir le nombre de personnes demandé
  getChambresDisponibles: (id, dateDebut, dateFin, capaciteMin = null) => {
    const q = new URLSearchParams({ date_debut: dateDebut, date_fin: dateFin });
    if (capaciteMin && capaciteMin > 0) {
      q.set("capacite_min", String(capaciteMin));
    }
    return get(`${BASE}/hotels/${id}/disponibilites/public?${q}`);
  },

  getTarifs:  (hId, cId) => get(`${BASE}/hotels/${hId}/chambres/${cId}/tarifs?per_page=50`),
  getAvis:    id         => get(`${BASE}/hotels/${id}/avis?per_page=20&page=1`),
  postAvis:   (id, data) => post(`${BASE}/hotels/${id}/avis`, data),
};