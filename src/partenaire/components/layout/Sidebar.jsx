import { useState } from "react";
import "./Sidebar.css";

const MENU_ITEMS = [
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
    id: "marketing",
    label: "Marketing",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
      </svg>
    ),
  },
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
        {!collapsed && (
          <div className="sidebar-user">
            <div className="user-avatar">
              {user?.nom?.[0]}{user?.prenom?.[0]}
            </div>
            <div className="user-info">
              <span className="user-name">{user?.prenom} {user?.nom}</span>
              <span className="user-role">Partenaire</span>
            </div>
          </div>
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