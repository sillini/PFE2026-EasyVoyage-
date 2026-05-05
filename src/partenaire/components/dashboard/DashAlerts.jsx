/**
 * src/partenaire/components/dashboard/DashAlerts.jsx
 * ====================================================
 * Centre d'alertes : pills colorées affichant les éléments
 * nécessitant l'attention du partenaire.
 *
 *   🟡 Promotions en attente de validation
 *   🔴 Hôtels inactifs nécessitent attention
 *   🔵 Arrivées prévues aujourd'hui
 *   🟡 Solde retirable
 *
 * Si rien à signaler → message vert "Tout est à jour".
 */

const fmt = (n) =>
  new Intl.NumberFormat("fr-TN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n ?? 0);

function AlertPill({ count, label, variant, icon, onClick }) {
  if (!count) return null;
  return (
    <button
      type="button"
      className={`pd-alert-pill pd-alert--${variant}`}
      onClick={onClick}
    >
      <span className="pd-alert-icon">{icon ?? count}</span>
      <span>{label}</span>
      <span className="pd-alert-arrow">→</span>
    </button>
  );
}

export default function DashAlerts({ alerts, onNavigate }) {
  if (!alerts) return null;

  const {
    promosPending = 0,
    hotelsInactifs = 0,
    arriveesAujourdhui = 0,
    soldeRetirable = 0,
  } = alerts;

  const totalAlertes =
    promosPending + hotelsInactifs + arriveesAujourdhui + (soldeRetirable > 0 ? 1 : 0);

  if (totalAlertes === 0) {
    return (
      <div className="pd-alerts-empty">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          width="16"
          height="16"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
        Tout est à jour — aucune action requise pour le moment.
      </div>
    );
  }

  return (
    <div className="pd-alerts">
      <AlertPill
        count={promosPending}
        label={
          promosPending === 1
            ? "promotion en attente de validation"
            : "promotions en attente de validation"
        }
        variant="amber"
        onClick={() => onNavigate?.("promotions")}
      />
      <AlertPill
        count={hotelsInactifs}
        label={
          hotelsInactifs === 1
            ? "hôtel inactif à réviser"
            : "hôtels inactifs à réviser"
        }
        variant="red"
        onClick={() => onNavigate?.("hotels")}
      />
      <AlertPill
        count={arriveesAujourdhui}
        label={
          arriveesAujourdhui === 1
            ? "arrivée prévue aujourd'hui"
            : "arrivées prévues aujourd'hui"
        }
        variant="blue"
        onClick={() => onNavigate?.("reservations")}
      />
      {soldeRetirable > 0 && (
        <button
          type="button"
          className="pd-alert-pill pd-alert--gold"
          onClick={() => onNavigate?.("finances")}
        >
          <span className="pd-alert-icon">💳</span>
          <span>{fmt(soldeRetirable)} DT prêts à être retirés</span>
          <span className="pd-alert-arrow">→</span>
        </button>
      )}
    </div>
  );
}