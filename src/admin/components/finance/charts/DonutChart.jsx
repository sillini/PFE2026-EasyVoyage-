/**
 * DonutChart — graphique en anneau SVG pour la répartition agence/partenaires.
 * Arc bleu = commission agence, arc doré = part partenaires.
 *
 * @prop {number} comm — montant commission agence
 * @prop {number} part — montant part partenaires
 */
export default function DonutChart({ comm, part }) {
  const total       = (comm + part) || 1;
  const pComm       = comm / total;
  const r           = 36;
  const cx          = 44;
  const cy          = 44;
  const circumference = 2 * Math.PI * r;
  const dashComm    = pComm * circumference;

  return (
    <svg viewBox="0 0 88 88" className="af2-donut-svg">
      {/* Fond doré = part partenaires */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--c-gold)" strokeWidth="14" />
      {/* Arc bleu = commission agence */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke="var(--c-blue)"
        strokeWidth="14"
        strokeDasharray={`${dashComm} ${circumference - dashComm}`}
        strokeDashoffset={circumference * 0.25}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <text x={cx} y={cy - 4}  textAnchor="middle" fontSize="9" fill="var(--c-text)" fontWeight="700">
        {Math.round(pComm * 100)}%
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize="7" fill="var(--c-muted)">
        Agence
      </text>
    </svg>
  );
}