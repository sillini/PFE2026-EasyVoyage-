/**
 * src/partenaire/components/dashboard/DashRevenueChart.jsx
 * ==========================================================
 * Graphique en barres des revenus mensuels (12 mois).
 *
 * Source : evolution.mois_liste = [{mois, annee, revenu, nb_resas}, ...]
 * Le mois courant est mis en évidence (gold).
 * Tooltip au hover affichant revenu + nb_resas.
 */

const fmt = (n) =>
  new Intl.NumberFormat("fr-TN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n ?? 0);

export default function DashRevenueChart({ evolution, annee, loading }) {
  const moisListe = evolution?.mois_liste || [];
  const totalAnnee = moisListe.reduce((s, m) => s + (m.revenu || 0), 0);

  // Mois courant index (0-based)
  const moisCourant = new Date().getMonth();
  const anneeCourante = new Date().getFullYear();
  const isCurrentYear = annee === anneeCourante;

  // Max pour normaliser les hauteurs
  const max = Math.max(...moisListe.map((m) => m.revenu || 0), 1);

  return (
    <section className="pd-card">
      <div className="pd-card-head">
        <div>
          <h3 className="pd-card-title">Évolution des revenus</h3>
          <p className="pd-card-sub">
            {moisListe.length > 0
              ? `${fmt(totalAnnee)} DT cumulés en ${annee}`
              : `Année ${annee}`}
          </p>
        </div>
      </div>

      {loading && moisListe.length === 0 ? (
        <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-3)" }}>
          <div
            className="pd-skeleton-line"
            style={{ width: "100%", height: 160 }}
          />
        </div>
      ) : moisListe.length === 0 ? (
        <div className="pd-empty">
          <div className="pd-empty-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              width="22"
              height="22"
            >
              <path d="M3 3v18h18" />
              <path d="M7 14l4-4 4 4 4-6" />
            </svg>
          </div>
          Aucune donnée pour cette année
        </div>
      ) : (
        <div className="pd-chart-bars">
          {moisListe.map((m, i) => {
            const isCurrent = isCurrentYear && i === moisCourant;
            const h = (m.revenu / max) * 100;
            return (
              <div
                key={i}
                className="pd-bar-col"
                title={`${m.mois} : ${fmt(m.revenu)} DT (${m.nb_resas} résa${
                  m.nb_resas > 1 ? "s" : ""
                })`}
              >
                <div className="pd-bar-tooltip">
                  {fmt(m.revenu)} DT · {m.nb_resas} résa
                  {m.nb_resas > 1 ? "s" : ""}
                </div>
                <div
                  className={`pd-bar ${isCurrent ? "pd-bar--current" : ""}`}
                  style={{ height: `${h}%` }}
                />
                <span className="pd-bar-lbl">{m.mois}</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}