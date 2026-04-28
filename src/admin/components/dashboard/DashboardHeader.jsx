/**
 * src/admin/components/dashboard/DashboardHeader.jsx
 * ====================================================
 * Header du dashboard : eyebrow + titre Cormorant + actions à droite.
 *
 * ✅ Le sélecteur d'années n'affiche QUE les années qui contiennent
 *    au moins une réservation (provenant du hook useDashboard).
 *
 * @prop {number}   annee              — année sélectionnée
 * @prop {Function} onAnnee            — callback (annee:number) => void
 * @prop {Array}    anneesDisponibles  — liste des années avec données
 * @prop {Function} onRefresh          — callback recharge tout le dashboard
 * @prop {boolean}  loading            — désactive Actualiser pendant le fetch
 * @prop {Date}     lastUpdate         — pour afficher "MAJ à HH:mm"
 * @prop {object}   user               — pour afficher le prénom
 */
export default function DashboardHeader({
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

  const prenom = user?.prenom || "Admin";

  // Fallback si la liste n'est pas encore chargée
  const annees = (anneesDisponibles && anneesDisponibles.length)
    ? anneesDisponibles
    : [new Date().getFullYear()];

  return (
    <header className="ad-header">
      <div className="ad-title-block">
        <div className="ad-eyebrow">
          <span className="ad-eyebrow-dot" />
          Vue globale plateforme
        </div>
        <h1 className="ad-title">Tableau de bord</h1>
        <p className="ad-desc">
          Bonjour {prenom} — voici la situation aujourd'hui
          {heure && (
            <span className="ad-last-update">
              <span className="ad-last-dot" /> MAJ à {heure}
            </span>
          )}
        </p>
      </div>

      <div className="ad-header-actions">
        {/* Sélecteur d'année — affiche uniquement les années avec données */}
        <div className="ad-year-tabs" role="tablist" aria-label="Sélection de l'année">
          {annees.map((y) => (
            <button
              key={y}
              role="tab"
              aria-selected={annee === y}
              className={`ad-year-btn ${annee === y ? "on" : ""}`}
              onClick={() => onAnnee(y)}
            >
              {y}
            </button>
          ))}
        </div>

        {/* Bouton Actualiser */}
        <button
          className="ad-icon-btn"
          onClick={onRefresh}
          disabled={loading}
          title="Actualiser"
          aria-label="Actualiser le tableau de bord"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 .49-3.5" />
          </svg>
        </button>
      </div>
    </header>
  );
}