/**
 * src/admin/components/dashboard/MetricsGrid.jsx
 * ================================================
 * Grille de 6 mini-cartes KPI métier (compteurs opérationnels).
 *
 *   🏨 Hôtels actifs        🤝 Partenaires        🚶 Visiteurs (mois)
 *   ✈️ Voyages actifs       👥 Clients inscrits   ⭐ Note moyenne
 *
 * @prop {object}   metrics    — { hotels, voyages, clients, partenaires }
 * @prop {object}   dash       — réponse /finances/dashboard (pour visiteurs)
 * @prop {boolean}  loading
 * @prop {Function} onNavigate
 */

function MiniCard({ icon, value, label, sub, color, onClick }) {
  return (
    <div
      className={`ad-mini-card ad-mini-${color}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => onClick && (e.key === "Enter" || e.key === " ") && onClick()}
    >
      <div className="ad-mini-icon">{icon}</div>
      <div className="ad-mini-body">
        <div className="ad-mini-val">{value}</div>
        <div className="ad-mini-lbl">{label}</div>
        {sub && <div className="ad-mini-sub">{sub}</div>}
      </div>
    </div>
  );
}

function MiniSkeleton() {
  return (
    <div className="ad-mini-card">
      <div className="ad-skeleton-circle ad-skeleton-mini" />
      <div className="ad-mini-body">
        <div className="ad-skeleton-line" style={{ width: "40%", height: 18 }} />
        <div className="ad-skeleton-line" style={{ width: "70%", height: 10 }} />
      </div>
    </div>
  );
}

export default function MetricsGrid({ metrics, dash, loading, onNavigate }) {
  if (loading && !metrics) {
    return (
      <section className="ad-metrics-section">
        <h3 className="ad-section-title">Indicateurs métier</h3>
        <div className="ad-metrics-grid">
          {[0, 1, 2, 3, 4, 5].map((i) => <MiniSkeleton key={i} />)}
        </div>
      </section>
    );
  }

  const m = metrics || {};
  // Visiteurs du mois : pas dans /finances/dashboard, on utilise nb_reservations_mois
  // moins les réservations clients (approximation acceptable en V1)
  // → on affiche juste le chiffre brut s'il existe
  const visiteursMois = dash?.nb_reservations_mois || 0;

  return (
    <section className="ad-metrics-section">
      <h3 className="ad-section-title">Indicateurs métier</h3>
      <div className="ad-metrics-grid">
        <MiniCard
          icon="🏨"
          value={m.hotels?.actifs ?? 0}
          label="Hôtels actifs"
          sub={`/ ${m.hotels?.total ?? 0} au total`}
          color="blue"
          onClick={() => onNavigate?.("hotels")}
        />
        <MiniCard
          icon="✈️"
          value={m.voyages?.total ?? 0}
          label="Voyages"
          sub="catalogue"
          color="amber"
          onClick={() => onNavigate?.("voyages")}
        />
        <MiniCard
          icon="🤝"
          value={m.partenaires?.total ?? 0}
          label="Partenaires"
          sub="enregistrés"
          color="green"
          onClick={() => onNavigate?.("partenaires")}
        />
        <MiniCard
          icon="👥"
          value={m.clients?.total ?? 0}
          label="Clients"
          sub={`${m.clients?.actifs ?? 0} actifs`}
          color="purple"
          onClick={() => onNavigate?.("clients")}
        />
        <MiniCard
          icon="🚶"
          value={visiteursMois}
          label="Réservations mois"
          sub="clients + visiteurs"
          color="teal"
          onClick={() => onNavigate?.("reservations")}
        />
        <MiniCard
          icon="📊"
          value={dash?.nb_reservations_annee ?? 0}
          label="Réservations année"
          sub="cumul depuis janvier"
          color="slate"
          onClick={() => onNavigate?.("reservations")}
        />
      </div>
    </section>
  );
}