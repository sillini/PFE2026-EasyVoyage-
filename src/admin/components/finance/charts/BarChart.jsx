/**
 * BarChart — graphique en barres SVG pour l'évolution des revenus.
 * Barre bleue = hôtels, barre dorée = voyages.
 *
 * @prop {Array}  data   — tableau de RevenuPeriode { revenu_hotel, revenu_voyage, revenu_total, periode }
 * @prop {number} [height=120] — hauteur des barres en pixels SVG
 */
export default function BarChart({ data, height = 120 }) {
  if (!data?.length) return null;

  const max = Math.max(...data.map((d) => d.revenu_total), 1);

  return (
    <svg
      viewBox={`0 0 ${data.length * 40} ${height + 20}`}
      className="af2-chart-svg"
    >
      {data.map((d, i) => {
        const hH = (d.revenu_hotel  / max) * height;
        const vH = (d.revenu_voyage / max) * height;
        const x  = i * 40 + 4;
        return (
          <g key={i}>
            <rect x={x}      y={height - hH} width={16} height={hH} fill="var(--c-blue)" rx="2" opacity="0.9" />
            <rect x={x + 17} y={height - vH} width={16} height={vH} fill="var(--c-gold)" rx="2" opacity="0.9" />
            <text x={x + 16} y={height + 14} textAnchor="middle" fontSize="8" fill="var(--c-muted)">
              {d.periode}
            </text>
          </g>
        );
      })}
    </svg>
  );
}