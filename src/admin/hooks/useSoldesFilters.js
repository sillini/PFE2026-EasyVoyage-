/**
 * hooks/useSoldesFilters.js
 * ==========================
 * Hook centralisant filtrage, tri et recherche des soldes partenaires.
 *
 * Filtres :
 *   search       — nom, prénom, email, entreprise
 *   montantMin   — solde_du >= montantMin
 *   montantMax   — solde_du <= montantMax
 *   nbCommMin    — nb_commissions >= nbCommMin
 *   nbCommMax    — nb_commissions <= nbCommMax
 *   sortCol      — "solde_du" | "nb_commissions" | "partenaire_nom" | "revenu_hotel"
 *   sortDir      — "asc" | "desc"
 */
import { useState, useMemo, useCallback } from "react";

const DEFAULT_FILTERS = {
  search:    "",
  montantMin: "",
  montantMax: "",
  nbCommMin:  "",
  nbCommMax:  "",
  sortCol:   "solde_du",
  sortDir:   "desc",
};

const SORT_KEYS = {
  solde_du:        (x) => x.solde_du,
  nb_commissions:  (x) => x.nb_commissions,
  partenaire_nom:  (x) => `${x.partenaire_nom} ${x.partenaire_prenom}`.toLowerCase(),
  revenu_hotel:    (x) => x.revenu_hotel || 0,
};

export function useSoldesFilters(rawData = []) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const setFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleSort = useCallback((col) => {
    setFilters((prev) => ({
      ...prev,
      sortCol: col,
      sortDir: prev.sortCol === col && prev.sortDir === "desc" ? "asc" : "desc",
    }));
  }, []);

  const resetFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const activeFilterCount = useMemo(() => {
    const { sortCol, sortDir, ...rest } = filters;
    return Object.values(rest).filter(Boolean).length;
  }, [filters]);

  const processed = useMemo(() => {
    const { search, montantMin, montantMax, nbCommMin, nbCommMax, sortCol, sortDir } = filters;
    let data = [...rawData];

    if (search) {
      const q = search.toLowerCase().trim();
      data = data.filter((s) =>
        s.partenaire_nom?.toLowerCase().includes(q)     ||
        s.partenaire_prenom?.toLowerCase().includes(q)  ||
        s.partenaire_email?.toLowerCase().includes(q)   ||
        s.nom_entreprise?.toLowerCase().includes(q)
      );
    }
    if (montantMin !== "") data = data.filter((s) => s.solde_du >= Number(montantMin));
    if (montantMax !== "") data = data.filter((s) => s.solde_du <= Number(montantMax));
    if (nbCommMin  !== "") data = data.filter((s) => s.nb_commissions >= Number(nbCommMin));
    if (nbCommMax  !== "") data = data.filter((s) => s.nb_commissions <= Number(nbCommMax));

    const keyFn = SORT_KEYS[sortCol] || SORT_KEYS.solde_du;
    data.sort((a, b) => {
      const va = keyFn(a), vb = keyFn(b);
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ?  1 : -1;
      return 0;
    });

    return data;
  }, [rawData, filters]);

  return { filters, setFilter, toggleSort, resetFilters, activeFilterCount, rows: processed };
}