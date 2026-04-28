/**
 * src/admin/components/dashboard/AlertsCenter.jsx
 * =================================================
 * Centre d'alertes : 4 pills colorées affichant les actions à traiter.
 *
 * Chaque pill est cliquable et redirige vers la page concernée
 * avec le filtre statut=EN_ATTENTE pré-appliqué.
 *
 * @prop {object}    alerts      — { promos, demandes, supports, retraits }
 * @prop {Function}  onNavigate  — (page:string) => void
 */

const PILLS = [
  {
    key:    "promos",
    label:  "promotion",
    plural: "promotions",
    sub:    "à valider",
    color:  "amber",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
    ),
    target: "promotions",
  },
  {
    key:    "demandes",
    label:  "demande",
    plural: "demandes",
    sub:    "partenaires",
    color:  "blue",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <line x1="20" y1="8" x2="20" y2="14" />
        <line x1="23" y1="11" x2="17" y2="11" />
      </svg>
    ),
    target: "demandes-partenaire",
  },
  {
    key:    "supports",
    label:  "support",
    plural: "supports",
    sub:    "en attente",
    color:  "red",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    target: "support",
  },
  {
    key:    "retraits",
    label:  "retrait",
    plural: "retraits",
    sub:    "à valider",
    color:  "purple",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    target: "finances",
  },
];

function format(value) {
  if (value > 99) return "99+";
  return value;
}

export default function AlertsCenter({ alerts, onNavigate }) {
  const total = (alerts?.promos || 0)
              + (alerts?.demandes || 0)
              + (alerts?.supports || 0)
              + (alerts?.retraits || 0);

  return (
    <section className="ad-alerts-card">
      <div className="ad-alerts-head">
        <div>
          <h3 className="ad-alerts-title">Centre d'alertes</h3>
          <p className="ad-alerts-sub">
            {total === 0
              ? "Aucune action en attente — tout est à jour"
              : `${total} action${total > 1 ? "s" : ""} à traiter`}
          </p>
        </div>
      </div>

      <div className="ad-alerts-grid">
        {PILLS.map((p) => {
          const count = alerts?.[p.key] || 0;
          const isEmpty = count === 0;
          return (
            <button
              key={p.key}
              type="button"
              className={`ad-alert-pill ad-alert-${p.color} ${isEmpty ? "ad-alert-empty" : ""}`}
              onClick={() => onNavigate?.(p.target)}
              disabled={isEmpty}
              aria-label={`${count} ${count > 1 ? p.plural : p.label} ${p.sub}`}
            >
              <span className="ad-alert-icon">{p.icon}</span>
              <span className="ad-alert-text">
                <span className="ad-alert-count">{format(count)}</span>
                <span className="ad-alert-label">
                  {count > 1 ? p.plural : p.label} <em>{p.sub}</em>
                </span>
              </span>
              {!isEmpty && (
                <svg className="ad-alert-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}