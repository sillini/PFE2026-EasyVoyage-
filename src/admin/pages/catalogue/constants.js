// src/admin/pages/catalogue/constants.js
// ─────────────────────────────────────────────────────────
// Constantes partagées — palette, config statuts, BASE URL
// Pas de CSS ici — chaque composant importe son propre .css
// ─────────────────────────────────────────────────────────

export const BASE = "http://localhost:8000/api/v1";

export const auth = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("access_token")}`,
});

// ── Palette couleurs (utilisée dans les styles inline résiduels) ──
export const C = {
  navy:   "#0F2235",
  gold:   "#C4973A",
  goldL:  "#F5EDD6",
  green:  "#16A34A",
  greenL: "#DCFCE7",
  red:    "#DC2626",
  redL:   "#FEE2E2",
  blue:   "#2563EB",
  blueL:  "#DBEAFE",
  amber:  "#D97706",
  amberL: "#FEF3C7",
  gray:   "#64748B",
  grayL:  "#F1F5F9",
  border: "#E2E8F0",
  white:  "#FFFFFF",
  bg:     "#F8FAFC",
};

// ── Config statuts catalogue ──────────────────────────────
export const STATUT_CFG = {
  BROUILLON: { bg: "#F1F5F9", color: "#64748B", dot: "#94A3B8", label: "Brouillon" },
  PLANIFIE:  { bg: "#DBEAFE", color: "#2563EB", dot: "#2563EB", label: "Planifié"  },
  EN_COURS:  { bg: "#FEF3C7", color: "#D97706", dot: "#D97706", label: "En cours"  },
  ENVOYE:    { bg: "#DCFCE7", color: "#16A34A", dot: "#16A34A", label: "Envoyé"    },
  ECHOUE:    { bg: "#FEE2E2", color: "#DC2626", dot: "#DC2626", label: "Échoué"    },
};