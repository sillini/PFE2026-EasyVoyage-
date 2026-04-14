import "./AdminTopbar.css";

const PAGE_META = {
  // ── Gestion ──────────────────────────────────────────
  dashboard:             { title: "Tableau de bord",        subtitle: "Vue globale de la plateforme" },
  reservations:          { title: "Réservations",            subtitle: "Toutes les réservations de la plateforme" },
  hotels:                { title: "Hôtels",                  subtitle: "Gestion de tous les établissements" },
  voyages:               { title: "Voyages",                 subtitle: "Gestion des offres de voyages" },
  partenaires:           { title: "Partenaires",             subtitle: "Gestion des comptes partenaires" },
  "demandes-partenaire": { title: "Demandes partenaires",    subtitle: "Demandes d'inscription reçues depuis la landing page" },
  clients:               { title: "Clients",                 subtitle: "Gestion des comptes clients" },
  // ── Finance & Facturation ────────────────────────────
  finances:              { title: "Finances",                subtitle: "Revenus, commissions partenaires & facturation" },
  promotions:            { title: "Promotions",              subtitle: "Validation des promotions soumises par les partenaires" },
  factures:              { title: "Factures",                subtitle: "Historique et gestion des factures" },
  fiscal:                { title: "Règles Fiscales",         subtitle: "Configuration des taxes, TVA et droits de timbre" },
  // ── Marketing ────────────────────────────────────────
  marketing:             { title: "Marketing",               subtitle: "Validation et suivi des campagnes" },
  catalogue:             { title: "Catalogues Email",        subtitle: "Créez et envoyez des catalogues personnalisés à vos contacts" },
  // ── Configuration ────────────────────────────────────
  "hotels-vedettes":     { title: "Mise en avant",           subtitle: "Hôtels et villes affichés sur la page client" },
  "hero-slides":         { title: "Hero Slides",             subtitle: "Gestion du carousel de la page d'accueil" },
  support:               { title: "Support",                 subtitle: "Conversations avec les partenaires" },
  agent:                 { title: "Agent IA",                subtitle: "Assistant intelligent d'administration" },
};

export default function AdminTopbar({ activePage, user, onNavigate }) {
  const meta = PAGE_META[activePage] || {
    title:    activePage === "profil" ? "Mon Profil"   : "Tableau de bord",
    subtitle: activePage === "profil" ? "Gérer vos informations personnelles" : "Vue globale",
  };
  const { title, subtitle } = meta;
  const dateStr = new Date().toLocaleDateString("fr-FR", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <header className="adm-topbar">
      <div className="adm-topbar-left">
        <div className="adm-topbar-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          ADMIN
        </div>
        <div className="adm-topbar-titles">
          <h1 className="adm-topbar-title">{title}</h1>
          <p className="adm-topbar-subtitle">{subtitle}</p>
        </div>
      </div>

      <div className="adm-topbar-right">
        <span className="adm-topbar-date">{dateStr}</span>
        <div className="adm-topbar-divider" />
        <button className="adm-topbar-notif">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <span className="adm-notif-dot" />
        </button>
        <div
          className="adm-topbar-user"
          onClick={() => onNavigate && onNavigate("profil")}
          style={{ cursor: "pointer" }}
          title="Mon profil"
        >
          <div className={`adm-topbar-avatar ${activePage === "profil" ? "active" : ""}`}>
            {user?.prenom?.[0]}{user?.nom?.[0]}
          </div>
          <div className="adm-topbar-user-info">
            <span className="adm-topbar-name">{user?.prenom} {user?.nom}</span>
            <span className="adm-topbar-role">Administrateur</span>
          </div>
        </div>
      </div>
    </header>
  );
}