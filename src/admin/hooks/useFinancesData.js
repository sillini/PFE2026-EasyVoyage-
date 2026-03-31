/**
 * hooks/useFinancesData.js
 * =========================
 * Hook générique pour gérer loading/error/data sur un appel API.
 * Utilisé par tous les onglets du module Finance.
 */
import { useState, useCallback } from "react";

/**
 * @param {Function} fetcher — fonction async qui retourne les données
 * @returns {{ data, loading, error, reload }}
 */
export function useAsyncData(fetcher) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const load = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher(...args);
      setData(result);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [fetcher]);

  return { data, loading, error, reload: load };
}