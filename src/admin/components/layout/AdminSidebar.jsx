import { useState, useEffect } from "react";
import "./AdminSidebar.css";

const MENU_TOP = [
  {
    id: "dashboard",
    label: "Tableau de bord",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="7" height="7" rx="1.5"/>
        <rect x="14" y="3" width="7" height="7" rx="1.5"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5"/>
      </svg>
    ),
  },
  {
    id: "reservations",
    label: "Réservations",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    id: "hotels",
    label: "Hôtels",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    id: "voyages",
    label: "Voyages",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
      </svg>
    ),
  },
  {
    id: "partenaires",
    label: "Partenaires",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    id: "demandes-partenaire",
    label: "Demandes partenaires",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <line x1="19" y1="8" x2="19" y2="14"/>
        <line x1="22" y1="11" x2="16" y2="11"/>
      </svg>
    ),
  },
  {
    id: "clients",
    label: "Clients",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="8" r="4"/>
        <path d="M20 21a8 8 0 1 0-16 0"/>
      </svg>
    ),
  },
];

const MENU_FINANCE = [
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
  {
    id: "promotions",
    label: "Promotions",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
        <line x1="7" y1="7" x2="7.01" y2="7"/>
      </svg>
    ),
  },
  {
    id: "factures",
    label: "Factures",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
  },
  {
    id: "fiscal",
    label: "Règles Fiscales",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
      </svg>
    ),
  },
];

const MENU_BOTTOM = [
  {
    id: "hotels-vedettes",
    label: "Mise en avant",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
  },
  {
    id: "hero-slides",
    label: "Hero Slides",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <path d="M8 21h8"/><path d="M12 17v4"/>
        <polyline points="2 10 7 6 11 9 16 5 22 10"/>
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
    badge: "Beta",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7H3a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
        <path d="M5 14v7"/><path d="M19 14v7"/>
        <path d="M5 17H3"/><path d="M21 17h-2"/>
        <circle cx="12" cy="11" r="1"/>
      </svg>
    ),
  },
];

/* ══════════════════════════════════════════════════════════
   Sous-items du groupe Marketing / Campagnes
   ← "video-campaigns" ajouté ici
══════════════════════════════════════════════════════════ */
const MARKETING_ITEMS = [
  {
    id: "marketing",
    label: "Facebook Management",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
      </svg>
    ),
  },
  {
    id: "catalogue",
    label: "Catalogues Email",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
        <polyline points="22,6 12,13 2,6"/>
      </svg>
    ),
  },
  // ── NOUVEAU ──────────────────────────────────────────
  {
    id: "video-campaigns",
    label: "Vidéo Campaigns",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15">
        <polygon points="23 7 16 12 23 17 23 7"/>
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
      </svg>
    ),
  },
];

const MARKETING_IDS = MARKETING_ITEMS.map(i => i.id);

/* ══════════════════════════════════════════════════════════
   COMPOSANT
══════════════════════════════════════════════════════════ */
export default function AdminSidebar({ activePage, onNavigate, user, onLogout }) {
  const [collapsed,    setCollapsed]    = useState(false);
  const [mktOpen,      setMktOpen]      = useState(MARKETING_IDS.includes(activePage));
  const [pendingCount, setPendingCount] = useState(0);

  const isMarketingActive = MARKETING_IDS.includes(activePage);
  const isProfilActive    = activePage === "profil";

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const res = await fetch(
          "http://localhost:8000/api/v1/promotions/admin/pending-count",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.ok) {
          const data = await res.json();
          setPendingCount(data.pending ?? 0);
        }
      } catch {
        // silencieux
      }
    };
    fetchPending();
    const interval = setInterval(fetchPending, 60_000);
    return () => clearInterval(interval);
  }, []);

  const renderItem = (item) => {
    const showPendingBadge = item.id === "promotions" && pendingCount > 0;
    return (
      <button
        key={item.id}
        className={`adm-nav-item ${activePage === item.id ? "active" : ""}`}
        onClick={() => onNavigate(item.id)}
        title={collapsed ? item.label : ""}
      >
        <span className="adm-nav-icon" style={{ position: "relative" }}>
          {item.icon}
          {showPendingBadge && collapsed && (
            <span className="adm-nav-dot-badge" />
          )}
        </span>
        {!collapsed && (
          <>
            <span className="adm-nav-label">{item.label}</span>
            {showPendingBadge && (
              <span className="adm-pending-badge">{pendingCount}</span>
            )}
            {item.badge && !showPendingBadge && (
              <span className="adm-badge">{item.badge}</span>
            )}
          </>
        )}
        {activePage === item.id && <span className="adm-active-bar" />}
      </button>
    );
  };

  // ✅ NOUVEAU : handler navigation vers le profil admin
  const handleProfilClick = () => {
    onNavigate("profil");
  };

  return (
    <aside className={`adm-sidebar ${collapsed ? "collapsed" : ""}`}>

      {/* ── Logo ── */}
      <div className="adm-logo">
        <img src="/logo_final.png" alt="EasyVoyage" className="adm-logo-img" />
        {!collapsed && (
          <div className="adm-role-tag">
            <span className="adm-role-dot" />
            Administration
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="adm-nav">

        {!collapsed && <p className="adm-section-label">GESTION</p>}
        {MENU_TOP.map(renderItem)}

        {!collapsed && <p className="adm-section-label">FINANCE & FACTURATION</p>}
        {MENU_FINANCE.map(renderItem)}

        {!collapsed && <p className="adm-section-label">MARKETING</p>}
        <div className="adm-group">
          <button
            className={`adm-nav-item adm-nav-item--parent ${isMarketingActive ? "active" : ""}`}
            onClick={() => {
              if (collapsed) { setCollapsed(false); setMktOpen(true); }
              else { setMktOpen(v => !v); }
            }}
            title={collapsed ? "Campagnes" : ""}
          >
            <span className="adm-nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
              </svg>
            </span>
            {!collapsed && (
              <>
                <span className="adm-nav-label">Campagnes</span>
                <span className={`adm-chevron ${mktOpen ? "adm-chevron--open" : ""}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </span>
              </>
            )}
            {isMarketingActive && <span className="adm-active-bar" />}
          </button>

          {!collapsed && mktOpen && (
            <div className="adm-submenu">
              {MARKETING_ITEMS.map(item => (
                <button
                  key={item.id}
                  className={`adm-submenu-item ${activePage === item.id ? "active" : ""}`}
                  onClick={() => onNavigate(item.id)}
                >
                  <span className="adm-submenu-icon">{item.icon}</span>
                  <span className="adm-submenu-label">{item.label}</span>
                  {activePage === item.id && <span className="adm-submenu-bar" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {!collapsed && <p className="adm-section-label">CONFIGURATION</p>}
        {MENU_BOTTOM.map(renderItem)}

      </nav>

      {/* ── Utilisateur + Logout ── */}
      <div className="adm-bottom">
        {/* ✅ MODIFIÉ : la zone utilisateur est maintenant un bouton cliquable
             qui redirige vers la page "profil" */}
        {!collapsed && (
          <button
            type="button"
            className={`adm-user adm-user-clickable ${isProfilActive ? "active" : ""}`}
            onClick={handleProfilClick}
            title="Voir mon profil"
          >
            <div className="adm-avatar">
              {user?.prenom?.[0]}{user?.nom?.[0]}
            </div>
            <div className="adm-user-info">
              <span className="adm-user-name">{user?.prenom} {user?.nom}</span>
              <span className="adm-user-role">Administrateur</span>
            </div>
            {/* Petite flèche pour indiquer que c'est cliquable */}
            <span className="adm-user-arrow" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
                   width="14" height="14">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </span>
            {isProfilActive && <span className="adm-active-bar" />}
          </button>
        )}

        {/* En mode collapsed, l'avatar seul reste cliquable vers profil */}
        {collapsed && (
          <button
            type="button"
            className={`adm-user-collapsed ${isProfilActive ? "active" : ""}`}
            onClick={handleProfilClick}
            title={`Profil — ${user?.prenom || ""} ${user?.nom || ""}`.trim()}
          >
            <div className="adm-avatar">
              {user?.prenom?.[0]}{user?.nom?.[0]}
            </div>
            {isProfilActive && <span className="adm-active-bar" />}
          </button>
        )}

        <button className="adm-logout" onClick={onLogout} title="Déconnexion">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>

      {/* ── Toggle collapse ── */}
      <button className="adm-toggle" onClick={() => setCollapsed(!collapsed)}>
        <svg
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          style={{ transform: collapsed ? "rotate(180deg)" : "rotate(0deg)", transition: "0.3s" }}
        >
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>

    </aside>
  );
}