/**
 * hooks/useReservationsFilters.js
 * ================================
 * Hook qui centralise toute la logique de filtrage, tri et recherche
 * des réservations. Aucun composant n'a besoin de manipuler les données
 * brutes directement.
 *
 * Filtres disponibles :
 *   - search       : recherche globale (nom, email)
 *   - typeSource   : "client" | "visiteur" | ""
 *   - statut       : "EN_ATTENTE" | "PAYEE" | ""
 *   - dateDebut    : ISO string — filtre date_debut >= valeur
 *   - dateFin      : ISO string — filtre date_fin   <= valeur
 *   - montantMin   : number
 *   - montantMax   : number
 *   - sortCol      : "date_debut" | "montant_total" | "commission_agence" | "part_partenaire"
 *   - sortDir      : "asc" | "desc"
 *
 * Pagination locale (sur les données filtrées).
 */
import { useState, useMemo, useCallback } from "react";

const PER_PAGE = 15;

export const SORT_COLS = {
  date_debut:        (r) => r.date_debut        || "",
  montant_total:     (r) => r.montant_total      || 0,
  commission_agence: (r) => r.commission_agence  || 0,
  part_partenaire:   (r) => r.part_partenaire    || 0,
};

const DEFAULT_FILTERS = {
  search:     "",
  typeSource: "",
  statut:     "",
  dateDebut:  "",
  dateFin:    "",
  montantMin: "",
  montantMax: "",
  sortCol:    "date_debut",
  sortDir:    "desc",
};

export function useReservationsFilters(rawData = []) {
  const [filters, setFilters]   = useState(DEFAULT_FILTERS);
  const [page,    setPage]      = useState(1);

  // Mise à jour d'un seul filtre — remet la page à 1
  const setFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }, []);

  // Basculer le tri : même colonne → inverser direction, autre colonne → desc
  const toggleSort = useCallback((col) => {
    setFilters((prev) => ({
      ...prev,
      sortCol: col,
      sortDir: prev.sortCol === col && prev.sortDir === "desc" ? "asc" : "desc",
    }));
    setPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  }, []);

  // Compter les filtres actifs (hors tri)
  const activeFilterCount = useMemo(() => {
    const { sortCol, sortDir, ...rest } = filters;
    return Object.values(rest).filter(Boolean).length;
  }, [filters]);

  // ── Pipeline filtre → tri → pagination ──────────────────
  const filtered = useMemo(() => {
    let data = [...rawData];
    const { search, typeSource, statut, dateDebut, dateFin, montantMin, montantMax } = filters;

    if (search) {
      const q = search.toLowerCase().trim();
      data = data.filter((r) =>
        r.client_nom?.toLowerCase().includes(q) ||
        r.client_email?.toLowerCase().includes(q)
      );
    }

    if (typeSource) {
      data = data.filter((r) => r.type_source === typeSource);
    }

    if (statut) {
      data = data.filter((r) => r.statut_commission === statut);
    }

    if (dateDebut) {
      data = data.filter((r) => r.date_debut && r.date_debut >= dateDebut);
    }

    if (dateFin) {
      data = data.filter((r) => r.date_fin && r.date_fin <= dateFin);
    }

    if (montantMin !== "") {
      data = data.filter((r) => r.montant_total >= Number(montantMin));
    }

    if (montantMax !== "") {
      data = data.filter((r) => r.montant_total <= Number(montantMax));
    }

    return data;
  }, [rawData, filters]);

  const sorted = useMemo(() => {
    const { sortCol, sortDir } = filters;
    const keyFn = SORT_COLS[sortCol] || SORT_COLS.date_debut;
    return [...filtered].sort((a, b) => {
      const va = keyFn(a);
      const vb = keyFn(b);
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ?  1 : -1;
      return 0;
    });
  }, [filtered, filters.sortCol, filters.sortDir]);

  const totalPages   = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const safePage     = Math.min(page, totalPages);
  const paged        = sorted.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  return {
    filters,
    setFilter,
    toggleSort,
    resetFilters,
    activeFilterCount,
    page:       safePage,
    setPage,
    totalPages,
    totalFiltered: sorted.length,
    totalRaw:      rawData.length,
    rows:          paged,
  };
}