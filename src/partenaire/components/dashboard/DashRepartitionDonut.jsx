/**
 * src/partenaire/components/dashboard/DashRepartitionDonut.jsx
 * ==============================================================
 * Donut SVG affichant la répartition des réservations
 * entre clients (inscrits) et visiteurs (sans compte).
 *
 * Le centre du donut affiche le nombre total de réservations.
 */

const fmt = (n) => new Intl.NumberFormat("fr-TN").format(n ?? 0);

// ── Donut SVG ─────────────────────────────────────────────
function Donut({ pctClients, pctVisiteurs, total }) {
  const size = 140;
  const stroke = 18;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  // Si rien, on affiche un cercle gris
  if (total === 0) {
    return (
      <svg
        className="pd-donut-svg"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#E4EAF3"
          strokeWidth={stroke}
        />
        <text
          x={cx}
          y={cy - 2}
          textAnchor="middle"
          dominantBaseline="middle"
          className="pd-donut-center-val"
        >
          0
        </text>
        <text
          x={cx}
          y={cy + 18}
          textAnchor="middle"
          dominantBaseline="middle"
          className="pd-donut-center-lbl"
        >
          réservations
        </text>
      </svg>
    );
  }

  // Longueur dash pour chaque arc
  const lenClients = (circumference * pctClients) / 100;
  const lenVisiteurs = (circumference * pctVisiteurs) / 100;
  // Décalage du second arc (commence là où finit le premier)
  const offsetVisiteurs = -lenClients;

  return (
    <svg
      className="pd-donut-svg"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
    >
      {/* Cercle de fond */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="#F0F4F8"
        strokeWidth={stroke}
      />
      {/* Arc clients */}
      {pctClients > 0 && (
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#2B5F8E"
          strokeWidth={stroke}
          strokeDasharray={`${lenClients} ${circumference - lenClients}`}
          strokeDashoffset="0"
          transform={`rotate(-90 ${cx} ${cy})`}
          strokeLinecap="butt"
        />
      )}
      {/* Arc visiteurs */}
      {pctVisiteurs > 0 && (
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#C4973A"
          strokeWidth={stroke}
          strokeDasharray={`${lenVisiteurs} ${circumference - lenVisiteurs}`}
          strokeDashoffset={offsetVisiteurs}
          transform={`rotate(-90 ${cx} ${cy})`}
          strokeLinecap="butt"
        />
      )}
      {/* Centre */}
      <text
        x={cx}
        y={cy - 4}
        textAnchor="middle"
        dominantBaseline="middle"
        className="pd-donut-center-val"
      >
        {fmt(total)}
      </text>
      <text
        x={cx}
        y={cy + 18}
        textAnchor="middle"
        dominantBaseline="middle"
        className="pd-donut-center-lbl"
      >
        réservations
      </text>
    </svg>
  );
}

// ══════════════════════════════════════════════════════════
export default function DashRepartitionDonut({ repartition, loading }) {
  if (loading && (!repartition || repartition.total === 0)) {
    return (
      <section className="pd-card">
        <div className="pd-card-head">
          <div>
            <h3 className="pd-card-title">Répartition</h3>
            <p className="pd-card-sub">Clients vs Visiteurs</p>
          </div>
        </div>
        <div
          className="pd-skeleton-line"
          style={{ width: "100%", height: 140 }}
        />
      </section>
    );
  }

  const {
    clients = 0,
    visiteurs = 0,
    total = 0,
    pctClients = 0,
    pctVisiteurs = 0,
  } = repartition || {};

  return (
    <section className="pd-card">
      <div className="pd-card-head">
        <div>
          <h3 className="pd-card-title">Répartition</h3>
          <p className="pd-card-sub">Clients vs Visiteurs (cumul)</p>
        </div>
      </div>

      <div className="pd-donut-wrap">
        <Donut
          pctClients={pctClients}
          pctVisiteurs={pctVisiteurs}
          total={total}
        />

        <div className="pd-donut-legend">
          <div className="pd-donut-leg-item">
            <span className="pd-donut-dot" style={{ background: "#2B5F8E" }} />
            <div className="pd-donut-leg-body">
              <div className="pd-donut-leg-lbl">👤 Clients inscrits</div>
              <div>
                <span className="pd-donut-leg-val">{fmt(clients)}</span>
                <span className="pd-donut-leg-pct">{pctClients}%</span>
              </div>
            </div>
          </div>

          <div className="pd-donut-leg-item">
            <span className="pd-donut-dot" style={{ background: "#C4973A" }} />
            <div className="pd-donut-leg-body">
              <div className="pd-donut-leg-lbl">🧳 Visiteurs sans compte</div>
              <div>
                <span className="pd-donut-leg-val">{fmt(visiteurs)}</span>
                <span className="pd-donut-leg-pct">{pctVisiteurs}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}