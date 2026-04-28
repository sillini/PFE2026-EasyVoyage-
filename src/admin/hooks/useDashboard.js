/**
 * src/admin/hooks/useDashboard.js
 * =================================
 * Hook React qui orchestre tous les appels du dashboard admin.
 *
 * Stratégie :
 *   - Fetchs en parallèle via Promise.allSettled
 *   - Polling séparé du centre d'alertes toutes les 60 secondes
 *   - Détection automatique des années qui contiennent des données
 *   - Refresh manuel via la fonction `refresh()`
 *
 * Expose :
 *   {
 *     loading, error, lastUpdate,
 *     dashboard, evolution, alerts,
 *     topHotels, topPartenaires, recentReservations, metrics,
 *     anneesDisponibles,   // ← nouvelles années avec données
 *     refresh()
 *   }
 */
import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchFinanceDashboard,
  fetchRevenusEvolution,
  fetchPendingPromotions,
  fetchPendingSupports,
  fetchPendingRetraits,
  fetchPendingDemandesPartenaire,
  fetchTopPartenaires,
  fetchTopHotels,
  fetchRecentReservations,
  fetchHotelsStats,
  fetchVoyagesStats,
  fetchClientsStats,
  fetchPartenairesStats,
} from "../services/dashboardApi.js";

const ALERTS_POLL_MS = 60_000;
const NB_ANNEES_TO_CHECK = 5; // teste les 5 dernières années

const ok = (result, fallback = null) =>
  result.status === "fulfilled" ? result.value : fallback;

/** Vérifie si une réponse /finances/revenus a au moins un mois > 0. */
function hasData(revenusResp) {
  if (!revenusResp?.evolution?.length) return false;
  return revenusResp.evolution.some(
    (m) => (m.revenu_hotel || 0) + (m.revenu_voyage || 0) > 0
  );
}

export function useDashboard(annee = new Date().getFullYear()) {
  const currentYear = new Date().getFullYear();

  const [state, setState] = useState({
    loading:    true,
    error:      null,
    lastUpdate: null,
    dashboard:  null,
    evolution:  null,
    alerts: {
      promos:   0,
      demandes: 0,
      supports: 0,
      retraits: 0,
    },
    topHotels:          [],
    topPartenaires:     [],
    recentReservations: [],
    metrics: {
      hotels:      { total: 0, actifs: 0 },
      voyages:     { total: 0 },
      clients:     { total: 0, actifs: 0 },
      partenaires: { total: 0 },
    },
    // ✅ Liste des années qui contiennent au moins un mois > 0
    //    Toujours inclure l'année courante pour que le sélecteur ne soit jamais vide
    anneesDisponibles: [currentYear],
  });

  const pollRef = useRef(null);

  // ── Détection des années avec données (1 fois au montage) ─
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const annees = [];
      for (let i = 0; i < NB_ANNEES_TO_CHECK; i++) {
        annees.push(currentYear - i);
      }
      const results = await Promise.allSettled(
        annees.map((a) => fetchRevenusEvolution(a))
      );
      const filled = annees.filter((a, idx) => hasData(ok(results[idx])));
      // L'année courante est TOUJOURS dans la liste (même vide)
      const list = filled.includes(currentYear) ? filled : [currentYear, ...filled];
      // Tri décroissant
      list.sort((a, b) => b - a);

      if (!cancelled) {
        setState((s) => ({ ...s, anneesDisponibles: list }));
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Charger les blocs principaux ────────────────────────
  const loadAll = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));

    const results = await Promise.allSettled([
      fetchFinanceDashboard(),
      fetchRevenusEvolution(annee),
      fetchPendingPromotions(),
      fetchPendingSupports(),
      fetchPendingRetraits(),
      fetchPendingDemandesPartenaire(),
      fetchTopPartenaires(5),
      fetchTopHotels(5),
      fetchRecentReservations(10),
      fetchHotelsStats(),
      fetchVoyagesStats(),
      fetchClientsStats(),
      fetchPartenairesStats(),
    ]);

    const [
      rDash, rEvol,
      rPromos, rSupports, rRetraits, rDemandes,
      rTopPart, rTopHot, rResas,
      rHotels, rVoyages, rClients, rPartenaires,
    ] = results;

    setState((s) => ({
      ...s,
      loading:    false,
      error:      null,
      lastUpdate: new Date(),
      dashboard:  ok(rDash),
      evolution:  ok(rEvol),
      alerts: {
        promos:   ok(rPromos,   { pending: 0 })?.pending || 0,
        demandes: ok(rDemandes, { total: 0 })?.total     || 0,
        supports: (ok(rSupports, { items: [] })?.items || []).length,
        retraits: ok(rRetraits, { total: 0 })?.total     || 0,
      },
      topHotels:          ok(rTopHot,  []),
      topPartenaires:     ok(rTopPart, { items: [] })?.items || [],
      recentReservations: ok(rResas,   { items: [] })?.items || [],
      metrics: {
        hotels:      ok(rHotels,      { total: 0, actifs: 0 }),
        voyages:     ok(rVoyages,     { total: 0 }),
        clients:     ok(rClients,     { total: 0, actifs: 0 }),
        partenaires: ok(rPartenaires, { total: 0 }),
      },
    }));
  }, [annee]);

  // ── Rafraîchir uniquement les alertes (polling) ─────────
  const refreshAlerts = useCallback(async () => {
    const results = await Promise.allSettled([
      fetchPendingPromotions(),
      fetchPendingSupports(),
      fetchPendingRetraits(),
      fetchPendingDemandesPartenaire(),
    ]);
    const [rPromos, rSupports, rRetraits, rDemandes] = results;
    setState((s) => ({
      ...s,
      alerts: {
        promos:   ok(rPromos,   { pending: 0 })?.pending || 0,
        demandes: ok(rDemandes, { total: 0 })?.total     || 0,
        supports: (ok(rSupports, { items: [] })?.items || []).length,
        retraits: ok(rRetraits, { total: 0 })?.total     || 0,
      },
    }));
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    pollRef.current = setInterval(refreshAlerts, ALERTS_POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [refreshAlerts]);

  return {
    ...state,
    refresh: loadAll,
  };
}