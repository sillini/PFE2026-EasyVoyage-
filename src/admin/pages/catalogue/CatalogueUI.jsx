// src/admin/pages/catalogue/CatalogueUI.jsx
import "./CatalogueUI.css";
import { STATUT_CFG } from "./constants";

// ── StatutBadge ───────────────────────────────────────────
export function StatutBadge({ statut, size = "sm" }) {
  const cfg = STATUT_CFG[statut] || STATUT_CFG.BROUILLON;
  return (
    <span
      className={`cat-statut-badge cat-statut-badge--${size}`}
      style={{ background: cfg.bg, color: cfg.color }}
    >
      <span
        className={`cat-statut-dot${statut === "EN_COURS" ? " cat-statut-dot--pulse" : ""}`}
        style={{ background: cfg.dot }}
      />
      {cfg.label}
    </span>
  );
}

// ── StatCard ──────────────────────────────────────────────
export function StatCard({ label, value, color = "#0F2235", sub }) {
  return (
    <div className="cat-stat-card">
      <div className="cat-stat-card__value" style={{ color }}>{value}</div>
      <div className="cat-stat-card__label">{label}</div>
      {sub && <div className="cat-stat-card__sub">{sub}</div>}
    </div>
  );
}

// ── Avatar ────────────────────────────────────────────────
export function Avatar({ email, nom, size = 32 }) {
  const initials = (nom || email || "?").slice(0, 2).toUpperCase();
  const hue = (email || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div
      className="cat-avatar"
      style={{
        width:      size,
        height:     size,
        fontSize:   size * 0.35,
        background: `hsl(${hue}, 55%, 88%)`,
        color:      `hsl(${hue}, 55%, 35%)`,
      }}
    >
      {initials}
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────
export function Spinner({ size = "md" }) {
  return <div className={`cat-spinner cat-spinner--${size}`} />;
}

// ── SpinnerInline (dans un bouton) ────────────────────────
export function SpinnerInline() {
  return <span className="cat-spinner cat-spinner--inline" />;
}