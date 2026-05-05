/**
 * src/partenaire/components/dashboard/DashQuickActions.jsx
 * ==========================================================
 * 4 boutons d'actions rapides menant directement aux pages
 * de gestion. Chaque bouton est coloré selon sa thématique.
 */
export default function DashQuickActions({ onNavigate }) {
  const ACTIONS = [
    {
      id: "promotions",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
          <line x1="7" y1="7" x2="7.01" y2="7"/>
        </svg>
      ),
      label: "Créer une promotion",
      desc:  "Booster vos réservations",
      color: "#C4973A",
      page:  "promotions",
    },
    {
      id: "tarifs",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      ),
      label: "Modifier un tarif",
      desc:  "Ajuster votre grille",
      color: "#2B5F8E",
      page:  "chambres",
    },
    {
      id: "reservations",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      ),
      label: "Voir les réservations",
      desc:  "Suivi de votre activité",
      color: "#1A3F63",
      page:  "reservations",
    },
    {
      id: "hotels",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      ),
      label: "Gérer mes hôtels",
      desc:  "Photos, infos, services",
      color: "#27AE60",
      page:  "hotels",
    },
  ];

  return (
    <div className="pd-actions-grid">
      {ACTIONS.map((a) => (
        <button
          key={a.id}
          type="button"
          className="pd-action-btn"
          style={{ "--pd-act-color": a.color }}
          onClick={() => onNavigate?.(a.page)}
        >
          <span className="pd-action-icon">{a.icon}</span>
          <span className="pd-action-body">
            <span className="pd-action-label">{a.label}</span>
            <span className="pd-action-desc">{a.desc}</span>
          </span>
        </button>
      ))}
    </div>
  );
}