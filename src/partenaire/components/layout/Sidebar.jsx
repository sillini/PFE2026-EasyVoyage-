import { useState } from "react";
import "./Sidebar.css";

// ══════════════════════════════════════════════════════════
//  MENU réorganisé selon la logique métier :
//    1. Vue d'ensemble        → Tableau de bord
//    2. Gestion de l'offre    → Hôtels, Chambres, Promotions
//    3. Activité commerciale  → Réservations, Finances
//    4. Aide & outils         → Support, Agent IA
//  (Marketing supprimé)
// ══════════════════════════════════════════════════════════
const MENU_ITEMS = [
  // ── 1. Vue d'ensemble ─────────────────────────────────
  {
    id: "dashboard",
    label: "Tableau de bord",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },

  // ── 2. Gestion de l'offre (ce que le partenaire vend) ──
  {
    id: "hotels",
    label: "Mes Hôtels",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    id: "chambres",
    label: "Chambres & Tarifs",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M2 9V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4"/>
        <path d="M2 13v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6"/>
        <line x1="2" y1="9" x2="22" y2="9"/>
        <path d="M6 9v4M10 9v4M14 9v4M18 9v4"/>
      </svg>
    ),
  },
  {
    id: "promotions",
    label: "Mes Promotions",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
        <line x1="7" y1="7" x2="7.01" y2="7"/>
      </svg>
    ),
  },

  // ── 3. Activité commerciale (ce qui est vendu / revenus) ──
  {
    id: "reservations",
    label: "Réservations",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
        <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
      </svg>
    ),
  },
  {
    id: "finances",
    label: "Finances",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
  },

  // ── 4. Aide & outils ──────────────────────────────────
  {
    id: "support",
    label: "Support",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  {
    id: "agent",
    label: "Agent IA",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7H3a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
        <path d="M5 14v7"/><path d="M19 14v7"/>
        <path d="M5 17H3"/><path d="M21 17h-2"/>
        <circle cx="12" cy="11" r="1"/>
      </svg>
    ),
    badge: "Beta",
  },
];

export default function Sidebar({ activePage, onNavigate, user, onLogout, nbSupportNonLus = 0 }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <img src="/logo_final.png" alt="EasyVoyage" className="sidebar-logo-img" />
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">{!collapsed && "NAVIGATION"}</div>
        {MENU_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activePage === item.id ? "active" : ""}`}
            onClick={() => onNavigate(item.id)}
            title={collapsed ? item.label : ""}
          >
            <span className="nav-icon">{item.icon}</span>
            {!collapsed && (
              <span className="nav-label">{item.label}</span>
            )}
            {!collapsed && item.badge && (
              <span className="nav-badge">{item.badge}</span>
            )}
            {!collapsed && item.id === "support" && nbSupportNonLus > 0 && (
              <span className="nav-badge nav-badge-red">{nbSupportNonLus}</span>
            )}
            {activePage === item.id && <span className="nav-active-bar" />}
          </button>
        ))}
      </nav>

      {/* User & Logout */}
      <div className="sidebar-bottom">
        {!collapsed ? (
          // ─── Mode normal : carte utilisateur cliquable → profil ───
          <button
            type="button"
            className={`sidebar-user sidebar-user-clickable ${activePage === "profil" ? "active" : ""}`}
            onClick={() => onNavigate && onNavigate("profil")}
            title="Mon profil"
          >
            <div className="user-avatar">
              {user?.nom?.[0]}{user?.prenom?.[0]}
            </div>
            <div className="user-info">
              <span className="user-name">{user?.prenom} {user?.nom}</span>
              <span className="user-role">Partenaire</span>
            </div>
            <span className="sidebar-user-arrow" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </span>
          </button>
        ) : (
          // ─── Mode collapsed : avatar seul cliquable → profil ───
          <button
            type="button"
            className={`sidebar-user-collapsed ${activePage === "profil" ? "active" : ""}`}
            onClick={() => onNavigate && onNavigate("profil")}
            title="Mon profil"
          >
            <div className="user-avatar">
              {user?.nom?.[0]}{user?.prenom?.[0]}
            </div>
          </button>
        )}

        <button className="btn-logout" onClick={onLogout} title="Déconnexion">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>

      {/* Toggle */}
      <button className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          style={{ transform: collapsed ? "rotate(180deg)" : "rotate(0deg)", transition: "0.3s" }}>
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
    </aside>
  );
}