import "./Topbar.css";

const PAGE_TITLES = {
  dashboard:    { title: "Tableau de bord",    subtitle: "Vue d'ensemble de votre activité" },
  hotels:       { title: "Mes Hôtels",         subtitle: "Gérez vos établissements" },
  chambres:     { title: "Chambres & Tarifs",  subtitle: "Gérez vos chambres et grilles tarifaires" },
  reservations: { title: "Réservations",       subtitle: "Consultez les réservations de vos établissements" },
  finances:     { title: "Finances",           subtitle: "Vos revenus, réservations et demandes de retrait" },
  marketing:    { title: "Marketing",          subtitle: "Vos campagnes promotionnelles" },
  support:      { title: "Support",            subtitle: "Vos échanges avec l'équipe" },
  agent:        { title: "Agent IA",           subtitle: "Votre assistant intelligent" },
  profil:       { title: "Mon Profil",         subtitle: "Gérer vos informations personnelles" },
};

export default function Topbar({ activePage, user, onNavigate }) {
  const { title, subtitle } = PAGE_TITLES[activePage] || PAGE_TITLES.dashboard;
  const dateStr = new Date().toLocaleDateString("fr-FR", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1 className="topbar-title">{title}</h1>
        <p className="topbar-subtitle">{subtitle}</p>
      </div>
      <div className="topbar-right">
        <div className="topbar-date">{dateStr}</div>
        <div className="topbar-divider" />
        <button className="topbar-notif">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <span className="notif-dot" />
        </button>
        <div
          className={`topbar-user ${activePage === "profil" ? "active" : ""}`}
          onClick={() => onNavigate && onNavigate("profil")}
          style={{ cursor: "pointer" }}
          title="Mon profil"
        >
          <div className="topbar-avatar">
            {user?.prenom?.[0]}{user?.nom?.[0]}
          </div>
          <div className="topbar-user-info">
            <span className="topbar-user-name">{user?.prenom} {user?.nom}</span>
            <span className="topbar-user-role">Partenaire</span>
          </div>
        </div>
      </div>
    </header>
  );
}