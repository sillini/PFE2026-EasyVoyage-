// src/admin/pages/video-campaigns/constants.js

export const BASE = "http://localhost:8000/api/v1";

export const auth = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("access_token")}`,
});

export const STATUT_CFG = {
  BROUILLON:     { bg: "#F1F5F9", color: "#64748B", dot: "#94A3B8", label: "Brouillon"      },
  EN_GENERATION: { bg: "#FEF3C7", color: "#D97706", dot: "#D97706", label: "En génération"  },
  PRET:          { bg: "#DBEAFE", color: "#2563EB", dot: "#2563EB", label: "Prêt"            },
  EN_ENVOI:      { bg: "#EDE9FE", color: "#7C3AED", dot: "#7C3AED", label: "En envoi"        },
  ENVOYE:        { bg: "#DCFCE7", color: "#16A34A", dot: "#16A34A", label: "Envoyé"          },
  ECHOUE:        { bg: "#FEE2E2", color: "#DC2626", dot: "#DC2626", label: "Échoué"          },
};

export const TON_CFG = {
  LUXE:       { emoji: "✨", label: "Luxe",       color: "#C4973A" },
  AVENTURE:   { emoji: "🏔️", label: "Aventure",   color: "#16A34A" },
  FAMILLE:    { emoji: "👨‍👩‍👧", label: "Famille",    color: "#2563EB" },
  ROMANTIQUE: { emoji: "🌅", label: "Romantique", color: "#DB2777" },
  AFFAIRES:   { emoji: "💼", label: "Affaires",   color: "#64748B" },
};

export const FORMAT_CFG = {
  LANDSCAPE: { label: "16:9 — Email / Web",   icon: "🖥️"  },
  PORTRAIT:  { label: "9:16 — Reels / Story", icon: "📱"  },
  SQUARE:    { label: "1:1 — Posts",          icon: "⬜"  },
};

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
  gray:   "#64748B",
  grayL:  "#F1F5F9",
  border: "#E2E8F0",
  white:  "#FFFFFF",
  bg:     "#F8FAFC",
};