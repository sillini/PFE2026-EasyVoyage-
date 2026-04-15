// src/admin/pages/catalogue/CatalogueUI.jsx
import "./CatalogueUI.css";

const STATUT_CFG = {
  BROUILLON: { bg: "#F1F5F9", color: "#64748B", dot: "#94A3B8", label: "Brouillon" },
  PLANIFIE:  { bg: "#DBEAFE", color: "#3B82F6", dot: "#3B82F6", label: "Planifié"  },
  EN_COURS:  { bg: "#FEF3C7", color: "#F59E0B", dot: "#F59E0B", label: "En cours"  },
  ENVOYE:    { bg: "#D1FAE5", color: "#10B981", dot: "#10B981", label: "Envoyé"    },
  ECHOUE:    { bg: "#FEE2E2", color: "#EF4444", dot: "#EF4444", label: "Échoué"    },
};

export function StatutBadge({ statut, size = "sm" }) {
  const cfg = STATUT_CFG[statut] || STATUT_CFG.BROUILLON;
  return (
    <span
      className={`cui-badge cui-badge--${size}`}
      style={{ background: cfg.bg, color: cfg.color }}
    >
      <span
        className={`cui-badge__dot${statut === "EN_COURS" ? " cui-badge__dot--pulse" : ""}`}
        style={{ background: cfg.dot }}
      />
      {cfg.label}
    </span>
  );
}

export function StatCard({ label, value, color = "#0B1E33", sub }) {
  return (
    <div className="cui-stat-card">
      <div className="cui-stat-card__value" style={{ color }}>{value}</div>
      <div className="cui-stat-card__label">{label}</div>
      {sub && <div className="cui-stat-card__sub">{sub}</div>}
    </div>
  );
}

export function Avatar({ email, nom, size = 32 }) {
  const initials = (nom || email || "?").slice(0, 2).toUpperCase();
  const hue = (email || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div
      className="cui-avatar"
      style={{
        width:      size,
        height:     size,
        fontSize:   size * 0.35,
        background: `hsl(${hue}, 45%, 88%)`,
        color:      `hsl(${hue}, 45%, 35%)`,
      }}
    >
      {initials}
    </div>
  );
}

export function Spinner({ size = "md" }) {
  return <div className={`cui-spinner cui-spinner--${size}`} />;
}

export function SpinnerInline() {
  return <span className="cui-spinner-inline" />;
}