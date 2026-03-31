/**
 * RevenusFilters — barre de filtres période + année pour l'onglet Revenus.
 *
 * @prop {string}   periode     — "jour" | "mois" | "annee"
 * @prop {number}   annee       — année sélectionnée
 * @prop {Function} onPeriode   — (p: string) => void
 * @prop {Function} onAnnee     — (a: number) => void
 */
const PERIODES = [
  ["jour",  "Quotidien"],
  ["mois",  "Mensuel"],
  ["annee", "Annuel"],
];

const NB_ANNEES = 6;

export default function RevenusFilters({ periode, annee, onPeriode, onAnnee }) {
  const currentYear = new Date().getFullYear();
  const annees = Array.from({ length: NB_ANNEES }, (_, i) => currentYear - i);

  return (
    <div className="af2-toolbar">
      <div className="af2-period-tabs">
        {PERIODES.map(([v, l]) => (
          <button
            key={v}
            className={`af2-period-btn${periode === v ? " on" : ""}`}
            onClick={() => onPeriode(v)}
          >
            {l}
          </button>
        ))}
      </div>
      <select
        className="af2-select"
        value={annee}
        onChange={(e) => onAnnee(+e.target.value)}
      >
        {annees.map((a) => (
          <option key={a} value={a}>{a}</option>
        ))}
      </select>
    </div>
  );
}