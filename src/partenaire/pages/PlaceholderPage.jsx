import "./PlaceholderPage.css";

const PAGE_CONFIG = {
  dashboard: {
    icon: "📊",
    title: "Tableau de bord",
    desc: "Vue d'ensemble de votre activité : réservations, revenus, taux d'occupation.",
    color: "#2B5F8E",
  },
  hotels: {
    icon: "🏨",
    title: "Mes Hôtels",
    desc: "Gérez vos établissements, modifiez les informations et les photos.",
    color: "#C4973A",
  },
  chambres: {
    icon: "🛏️",
    title: "Chambres & Tarifs",
    desc: "Configurez vos types de chambres, capacités et grilles tarifaires saisonnières.",
    color: "#4A85B8",
  },
  marketing: {
    icon: "📣",
    title: "Marketing",
    desc: "Créez et suivez vos campagnes promotionnelles. Soumettez-les à validation.",
    color: "#D4A853",
  },
  agent: {
    icon: "🤖",
    title: "Agent IA",
    desc: "Votre assistant intelligent pour optimiser votre listing et répondre à vos questions.",
    color: "#2B5F8E",
  },
};

export default function PlaceholderPage({ page }) {
  const config = PAGE_CONFIG[page] || PAGE_CONFIG.dashboard;

  return (
    <div className="placeholder-page">
      <div className="placeholder-card" style={{ "--accent": config.color }}>
        <div className="placeholder-icon">{config.icon}</div>
        <h2 className="placeholder-title">{config.title}</h2>
        <p className="placeholder-desc">{config.desc}</p>
        <div className="placeholder-badge">
          <span className="badge-dot" />
          En cours de développement
        </div>
      </div>
    </div>
  );
}