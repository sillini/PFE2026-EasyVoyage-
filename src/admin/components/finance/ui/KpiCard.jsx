/**
 * KpiCard — carte de statistique avec icône, valeur, label et sous-label optionnel.
 *
 * @prop {string}  icon   — emoji ou caractère
 * @prop {string}  label  — libellé affiché sous la valeur
 * @prop {string}  value  — valeur principale formatée
 * @prop {string}  [sub]  — sous-texte optionnel (affiché en rouge)
 * @prop {string}  [color] — couleur de la bordure gauche (CSS hex)
 * @prop {boolean} [small] — variante compacte pour les en-têtes de drill-down
 */
export default function KpiCard({ icon, label, value, sub, color, small }) {
  return (
    <div
      className={`af2-kpi${small ? " af2-kpi-sm" : ""}`}
      style={{ "--acc": color }}
    >
      <div className="af2-kpi-icon">{icon}</div>
      <div className="af2-kpi-body">
        <div className="af2-kpi-val">{value}</div>
        <div className="af2-kpi-label">{label}</div>
        {sub && <div className="af2-kpi-sub">{sub}</div>}
      </div>
    </div>
  );
}