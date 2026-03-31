/**
 * services/formatters.js
 * =======================
 * Fonctions de formatage partagées dans tout le module Finance.
 */

/** Formate un nombre en monnaie tunisienne (2 décimales) */
export const fmt = (n) =>
  Number(n || 0).toLocaleString("fr-TN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/** Formate une date ISO en date locale française */
export const fmtD = (d) =>
  d ? new Date(d).toLocaleDateString("fr-FR") : "—";

/** Formate un montant avec le suffixe "DT" */
export const fmtDT = (n) => `${fmt(n)} DT`;