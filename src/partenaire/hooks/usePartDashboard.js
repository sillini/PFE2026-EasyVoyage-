/**
 * src/partenaire/hooks/usePartDashboard.js
 * ==========================================
 * Hook unique qui orchestre tous les appels API du dashboard partenaire.
 *
 * ✅ CORRIGÉ :
 *   - Récupère le nombre total de chambres en interrogeant
 *     GET /hotels/{id}/chambres pour chaque hôtel actif
 *     (HotelResponse ne contient pas nb_chambres au niveau hôtel).
 *   - Calcule le taux d'occupation sur TOUTES les réservations du mois
 *     courant, pas uniquement les 8 récentes affichées.
 *   - Détection auto des années avec données.
 *
 * @param {number} annee — année sélectionnée pour les graphiques
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  fetchPartDashboard,
  fetchPartRevenusMensuels,
  fetchPartHotelsFinances,
  fetchPartHotelsCatalogue,
  fetchPartHotelsResaStats,
  fetchPartReservationsHotel,
  fetchPartPromotions,
} from "../services/dashboardPartenaireApi";

const NB_ANNEES_TO_CHECK = 5;
const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
});

/** Récupère les chambres d'un hôtel (avec nb_chambres par type). */
const fetchChambresHotel = (hotelId) =>
  fetch(`${BASE}/hotels/${hotelId}/chambres?per_page=100`, {
    headers: authHeaders(),
  }).then((r) => (r.ok ? r.json() : { items: [] }));

/** Récupère toutes les réservations d'un hôtel (jusqu'à 200). */
const fetchAllResasHotel = (hotelId) =>
  fetch(
    `${BASE}/reservations/partenaire/hotel/${hotelId}?page=1&per_page=200`,
    { headers: authHeaders() }
  ).then((r) => (r.ok ? r.json() : { items: [] }));

// ── Helper : nb jours dans le mois courant ───────────────────────
function nbJoursMoisCourant() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
}

// ── Helper : calcul nuits chevauchant le mois courant ────────────
function nuitsDansMoisCourant(date_debut, date_fin) {
  if (!date_debut || !date_fin) return 0;
  const now = new Date();
  const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);
  const finMois   = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  finMois.setHours(23, 59, 59, 999);

  const debutResa = new Date(date_debut);
  const finResa   = new Date(date_fin);

  // Intersection [debutResa, finResa] ∩ [debutMois, finMois]
  const start = debutResa > debutMois ? debutResa : debutMois;
  const end   = finResa   < finMois   ? finResa   : finMois;

  if (end <= start) return 0;
  return Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24)));
}

// ── Helper : la réponse /revenus a-t-elle au moins un mois > 0 ? ─
function hasData(revenusResp) {
  if (!revenusResp?.mois_liste?.length) return false;
  return revenusResp.mois_liste.some((m) => (m.revenu || 0) > 0);
}

const ok = (result, fallback = null) =>
  result.status === "fulfilled" ? result.value : fallback;

export function usePartDashboard(annee) {
  const currentYear = new Date().getFullYear();

  // ── State principal ──────────────────────────────────────
  const [dashboard,        setDashboard]        = useState(null);
  const [evolution,        setEvolution]        = useState(null);
  const [hotelsFinances,   setHotelsFinances]   = useState([]);
  const [hotelsCatalogue,  setHotelsCatalogue]  = useState([]);
  const [hotelsResaStats,  setHotelsResaStats]  = useState([]);
  const [promotions,       setPromotions]       = useState([]);
  const [reservationsRecentes, setResasRecentes] = useState([]);

  // ✅ NOUVEAU : map { hotelId: nb_chambres_total } et toutes les résas du mois
  const [chambresParHotel,    setChambresParHotel]    = useState({});
  const [allResasMoisCourant, setAllResasMoisCourant] = useState([]);

  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const [anneesDisponibles, setAnneesDisponibles] = useState([currentYear]);

  // ── Détection des années avec données (1 fois au mount) ─
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const annees = [];
      for (let i = 0; i < NB_ANNEES_TO_CHECK; i++) {
        annees.push(currentYear - i);
      }
      const results = await Promise.allSettled(
        annees.map((a) => fetchPartRevenusMensuels(a))
      );
      const filled = annees.filter((a, idx) => hasData(ok(results[idx])));
      const list = filled.includes(currentYear) ? filled : [currentYear, ...filled];
      list.sort((a, b) => b - a);
      if (!cancelled) setAnneesDisponibles(list);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fetch principal ──────────────────────────────────────
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Phase 1 : 6 requêtes en parallèle
      const [
        dashRes,
        evoRes,
        hotelsFinRes,
        hotelsCatRes,
        hotelsResaRes,
        promosRes,
      ] = await Promise.all([
        fetchPartDashboard(),
        fetchPartRevenusMensuels(annee),
        fetchPartHotelsFinances(),
        fetchPartHotelsCatalogue(),
        fetchPartHotelsResaStats(),
        fetchPartPromotions(),
      ]);

      setDashboard(dashRes);
      setEvolution(evoRes);
      setHotelsFinances(hotelsFinRes?.items || []);
      const catalogueItems = hotelsCatRes?.items || [];
      setHotelsCatalogue(catalogueItems);
      setHotelsResaStats(hotelsResaRes?.items || []);
      setPromotions(promosRes?.items || promosRes || []);

      // ─────────────────────────────────────────────────────────
      // Phase 2a : pour CHAQUE hôtel actif, récupérer ses chambres
      // afin de calculer le total de chambres (stock).
      // ─────────────────────────────────────────────────────────
      const hotelsActifs = catalogueItems.filter((h) => h.actif);
      if (hotelsActifs.length) {
        const chambresResults = await Promise.allSettled(
          hotelsActifs.map((h) => fetchChambresHotel(h.id))
        );

        const chambresMap = {};
        hotelsActifs.forEach((h, idx) => {
          const r = chambresResults[idx];
          if (r.status === "fulfilled" && r.value?.items) {
            // Somme des nb_chambres de chaque type de chambre actif
            const total = r.value.items
              .filter((c) => c.actif !== false)
              .reduce((s, c) => s + (c.nb_chambres || 0), 0);
            chambresMap[h.id] = total;
          } else {
            chambresMap[h.id] = 0;
          }
        });
        setChambresParHotel(chambresMap);
      } else {
        setChambresParHotel({});
      }

      // ─────────────────────────────────────────────────────────
      // Phase 2b : pour les 5 hôtels avec le plus de CA, fetch
      // TOUTES leurs réservations afin de :
      //   - alimenter le feed récent (top 8 globalement)
      //   - calculer le taux d'occupation du mois courant
      // ─────────────────────────────────────────────────────────
      const topHotelIds = (hotelsFinRes?.items || [])
        .slice()
        .sort((a, b) => (b.revenu_total || 0) - (a.revenu_total || 0))
        .slice(0, 5)
        .map((h) => h.id_hotel);

      if (topHotelIds.length) {
        const resaResults = await Promise.allSettled(
          topHotelIds.map((id) => fetchAllResasHotel(id))
        );

        const allResas = [];
        resaResults.forEach((r) => {
          if (r.status === "fulfilled" && r.value?.items) {
            allResas.push(...r.value.items);
          }
        });

        // Tri par date_reservation desc pour le feed récent
        allResas.sort((a, b) => {
          const da = new Date(a.date_reservation || 0).getTime();
          const db = new Date(b.date_reservation || 0).getTime();
          return db - da;
        });
        setResasRecentes(allResas.slice(0, 8));

        // Filtrage : réservations qui chevauchent le mois courant
        // et qui ne sont pas annulées
        const moisResas = allResas.filter((r) => {
          if (r.statut === "ANNULEE") return false;
          if (!r.date_debut || !r.date_fin) return false;
          return nuitsDansMoisCourant(r.date_debut, r.date_fin) > 0;
        });
        setAllResasMoisCourant(moisResas);
      } else {
        setResasRecentes([]);
        setAllResasMoisCourant([]);
      }

      setLastUpdate(new Date());
    } catch (err) {
      console.error("[usePartDashboard]", err);
      setError(err.message || "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, [annee]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // ══════════════════════════════════════════════════════════
  //  VALEURS DÉRIVÉES
  // ══════════════════════════════════════════════════════════

  /** Note moyenne globale. */
  const noteGlobale = useMemo(() => {
    const avec = hotelsCatalogue.filter(
      (h) => h.note_moyenne != null && h.note_moyenne > 0
    );
    if (!avec.length) return null;
    const total = avec.reduce((s, h) => s + (h.note_moyenne || 0), 0);
    return total / avec.length;
  }, [hotelsCatalogue]);

  /** Nombre d'hôtels actifs / total. */
  const nbHotelsActifs = useMemo(() => {
    const actifs = hotelsCatalogue.filter((h) => h.actif).length;
    return { actifs, total: hotelsCatalogue.length };
  }, [hotelsCatalogue]);

  /** ✅ CORRIGÉ : Taux d'occupation calculé proprement.
   *  Capacité = Σ (nb_chambres_par_hotel × jours_du_mois)
   *  Nuits réservées = Σ nuits qui chevauchent le mois courant
   *                    sur TOUTES les réservations non annulées
   */
  const tauxOccupation = useMemo(() => {
    const totalChambres = Object.values(chambresParHotel).reduce(
      (s, n) => s + (n || 0),
      0
    );

    if (totalChambres === 0) {
      return null; // affichera "Aucune chambre enregistrée"
    }

    const jours = nbJoursMoisCourant();
    const capaciteMois = totalChambres * jours;

    const nuitsMois = allResasMoisCourant.reduce(
      (s, r) => s + nuitsDansMoisCourant(r.date_debut, r.date_fin),
      0
    );

    if (capaciteMois === 0) return null;
    const pct = Math.min(100, Math.round((nuitsMois / capaciteMois) * 100));
    return {
      pct,
      nuits: nuitsMois,
      capacite: capaciteMois,
      totalChambres,
    };
  }, [chambresParHotel, allResasMoisCourant]);

  /** Répartition clients / visiteurs. */
  const repartitionResas = useMemo(() => {
    const totalClients   = hotelsResaStats.reduce((s, h) => s + (h.nb_clients   || 0), 0);
    const totalVisiteurs = hotelsResaStats.reduce((s, h) => s + (h.nb_visiteurs || 0), 0);
    const total = totalClients + totalVisiteurs;
    return {
      clients:   totalClients,
      visiteurs: totalVisiteurs,
      total,
      pctClients:   total > 0 ? Math.round((totalClients   / total) * 100) : 0,
      pctVisiteurs: total > 0 ? Math.round((totalVisiteurs / total) * 100) : 0,
    };
  }, [hotelsResaStats]);

  /** Top 5 hôtels par revenu du mois. */
  const topHotels = useMemo(() => {
    const catalogueMap = Object.fromEntries(
      hotelsCatalogue.map((h) => [h.id, h])
    );
    return hotelsFinances
      .slice()
      .sort((a, b) => (b.revenu_mois || 0) - (a.revenu_mois || 0))
      .slice(0, 5)
      .map((h) => ({
        ...h,
        note_moyenne: catalogueMap[h.id_hotel]?.note_moyenne ?? null,
        etoiles:      catalogueMap[h.id_hotel]?.etoiles      ?? null,
      }));
  }, [hotelsFinances, hotelsCatalogue]);

  /** Promotions actives. */
  const promosActives = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return promotions.filter(
      (p) =>
        p.statut === "APPROVED" &&
        p.actif === true &&
        p.date_debut <= today &&
        p.date_fin >= today
    );
  }, [promotions]);

  /** Centre d'alertes. */
  const alerts = useMemo(() => {
    const promosPending  = promotions.filter((p) => p.statut === "PENDING").length;
    const hotelsInactifs = hotelsCatalogue.filter((h) => !h.actif).length;

    const today = new Date().toISOString().slice(0, 10);
    const arriveesAujourdhui = reservationsRecentes.filter(
      (r) => r.date_debut === today && r.statut === "CONFIRMEE"
    ).length;

    const soldeRetirable =
      dashboard?.solde_disponible && dashboard.solde_disponible >= 50
        ? dashboard.solde_disponible
        : 0;

    return {
      promosPending,
      hotelsInactifs,
      arriveesAujourdhui,
      soldeRetirable,
    };
  }, [promotions, hotelsCatalogue, reservationsRecentes, dashboard]);

  return {
    // Brut
    dashboard,
    evolution,
    hotelsFinances,
    hotelsCatalogue,
    hotelsResaStats,
    promotions,
    reservationsRecentes,
    // État
    loading,
    error,
    lastUpdate,
    refresh,
    anneesDisponibles,
    // Dérivé
    noteGlobale,
    nbHotelsActifs,
    tauxOccupation,
    repartitionResas,
    topHotels,
    promosActives,
    alerts,
  };
}