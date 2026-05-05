/**
 * src/partenaire/components/dashboard/DashHeader.jsx
 * ====================================================
 * Header du dashboard partenaire :
 *   eyebrow "ESPACE PARTENAIRE" + titre Cormorant
 *   "Bonjour {prenom} — voici votre activité aujourd'hui · MAJ à HH:mm"
 *   à droite : sélecteur d'année + bouton refresh
 */
export default function DashHeader({
  annee,
  onAnnee,
  anneesDisponibles,
  onRefresh,
  loading,
  lastUpdate,
  user,
}) {
  const heure = lastUpdate
    ? lastUpdate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    : null;

  const prenom = user?.prenom || "Partenaire";

  const annees =
    anneesDisponibles && anneesDisponibles.length
      ? anneesDisponibles
      : [new Date().getFullYear()];

  return (
    <header className="pd-header">
      <div className="pd-title-block">
        <div className="pd-eyebrow">
          <span className="pd-eyebrow-dot" />
          Espace partenaire
        </div>
        <h1 className="pd-title">Tableau de bord</h1>
        <p className="pd-desc">
          Bonjour {prenom} — voici votre activité aujourd'hui
          {heure && (
            <span className="pd-last-update">
              <span className="pd-last-dot" /> MAJ à {heure}
            </span>
          )}
        </p>
      </div>

      <div className="pd-header-actions">
        {/* Sélecteur d'année (graphique) */}
        <div
          className="pd-year-tabs"
          role="tablist"
          aria-label="Sélection de l'année"
        >
          {annees.map((y) => (
            <button
              key={y}
              role="tab"
              aria-selected={annee === y}
              className={`pd-year-btn ${annee === y ? "on" : ""}`}
              onClick={() => onAnnee(y)}
            >
              {y}
            </button>
          ))}
        </div>

        {/* Refresh */}
        <button
          className="pd-icon-btn"
          onClick={onRefresh}
          disabled={loading}
          title="Actualiser"
          aria-label="Actualiser le tableau de bord"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            width="14"
            height="14"
          >
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 .49-3.5" />
          </svg>
        </button>
      </div>
    </header>
  );
}