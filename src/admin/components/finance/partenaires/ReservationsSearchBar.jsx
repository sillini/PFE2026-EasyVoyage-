/**
 * ReservationsSearchBar — barre de recherche globale.
 * Recherche en temps réel sur nom et email.
 *
 * @prop {string}   value    — valeur courante
 * @prop {Function} onChange — (val: string) => void
 * @prop {number}   total    — nb total de résultats affichés
 * @prop {number}   filtered — nb après filtrage
 */
export default function ReservationsSearchBar({ value, onChange, total, filtered }) {
  return (
    <div className="rs-searchbar">
      <div className="rs-search-input-wrap">
        <svg className="rs-search-icon" viewBox="0 0 20 20" fill="none">
          <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.8"/>
          <path d="M15 15l-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
        <input
          className="rs-search-input"
          type="text"
          placeholder="Rechercher par nom ou email…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
        />
        {value && (
          <button className="rs-search-clear" onClick={() => onChange("")} title="Effacer">
            ✕
          </button>
        )}
      </div>

      {(total > 0 || value) && (
        <span className="rs-search-count">
          {filtered !== total
            ? <><b>{filtered}</b> / {total} résultat{total > 1 ? "s" : ""}</>
            : <>{total} résultat{total > 1 ? "s" : ""}</>}
        </span>
      )}
    </div>
  );
}