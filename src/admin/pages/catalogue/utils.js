// src/admin/pages/catalogue/utils.js
// ─────────────────────────────────────────────────────────
// Fonctions utilitaires partagées — aucun import CSS
// ─────────────────────────────────────────────────────────

/** Parse le champ description_ia (JSON ou texte brut). */
export function parseIA(raw) {
  if (!raw) return {};
  try {
    const c = raw.replace(/```json|```/g, "").trim();
    return c.startsWith("{") ? JSON.parse(c) : { description: raw };
  } catch {
    return { description: raw };
  }
}

/** Affiche une date ISO sous forme lisible. */
export function ago(iso) {
  if (!iso) return "—";
  const d = Math.floor((Date.now() - new Date(iso)) / 86400000);
  if (d === 0) return "Aujourd'hui";
  if (d === 1) return "Hier";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

/** Génère une chaîne d'étoiles pleines/vides. */
export function stars(n) {
  return "★".repeat(n || 0) + "☆".repeat(5 - (n || 0));
}

/** Formate un nombre en prix DT. */
export function fmt(n, suffix = " DT") {
  return n != null ? `${Number(n).toFixed(0)}${suffix}` : "—";
}