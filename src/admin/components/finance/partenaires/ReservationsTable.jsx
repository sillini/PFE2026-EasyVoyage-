/**
 * ReservationsTable — tableau des réservations avec tri par colonne.
 *
 * @prop {Array}    rows      — lignes après filtrage/pagination
 * @prop {object}   sortState — { sortCol, sortDir }
 * @prop {Function} onSort    — (col: string) => void
 */
import Pill   from "../ui/Pill.jsx";
import { fmt, fmtD } from "../../../services/formatters.js";

const COLS = [
  { key: null,               label: "Source",            sortable: false },
  { key: null,               label: "Client / Visiteur", sortable: false },
  { key: null,               label: "Email",             sortable: false },
  { key: "date_debut",       label: "Période",           sortable: true  },
  { key: "montant_total",    label: "Total résa",        sortable: true  },
  { key: "commission_agence",label: "Commission agence", sortable: true  },
  { key: "part_partenaire",  label: "Part partenaire",   sortable: true  },
  { key: null,               label: "Taux",              sortable: false },
  { key: null,               label: "Statut",            sortable: false },
  { key: null,               label: "Date paiement",     sortable: false },
];

function SortIcon({ col, sortCol, sortDir }) {
  if (col !== sortCol) return <span className="rs-sort-neutral">⇅</span>;
  return <span className="rs-sort-active">{sortDir === "asc" ? "↑" : "↓"}</span>;
}

export default function ReservationsTable({ rows, sortState, onSort }) {
  const { sortCol, sortDir } = sortState;

  if (!rows || rows.length === 0) {
    return (
      <div className="rs-empty">
        <span>🔍</span>
        <p>Aucune réservation ne correspond aux filtres</p>
      </div>
    );
  }

  return (
    <div className="rs-table-wrap">
      <table className="af2-table rs-table">
        <thead>
          <tr>
            {COLS.map((col, i) => (
              <th
                key={i}
                className={col.sortable ? "rs-th-sortable" : ""}
                onClick={col.sortable ? () => onSort(col.key) : undefined}
              >
                {col.label}
                {col.sortable && (
                  <SortIcon col={col.key} sortCol={sortCol} sortDir={sortDir} />
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={i}
              className={`af2-tr${r.type_source === "visiteur" ? " rs-row-visiteur" : ""}`}
            >
              {/* Source */}
              <td>
                <span className={`af2-client-badge ${r.type_source === "client" ? "badge-client" : "badge-visiteur"}`}>
                  {r.type_source === "client" ? "Client" : "Visiteur"}
                </span>
              </td>

              {/* Nom */}
              <td>
                <div className="rs-person">
                  <div className="rs-avatar">
                    {(r.client_nom?.split(" ")[0]?.[0] || "?").toUpperCase()}
                    {(r.client_nom?.split(" ")[1]?.[0] || "").toUpperCase()}
                  </div>
                  <span className="rs-person-name">{r.client_nom}</span>
                </div>
              </td>

              {/* Email */}
              <td>
                {r.client_email
                  ? <a className="rs-email-link" href={`mailto:${r.client_email}`}>{r.client_email}</a>
                  : <span className="af2-muted">—</span>}
              </td>

              {/* Période */}
              <td>
                <div className="rs-periode">
                  <span>{fmtD(r.date_debut)}</span>
                  <span className="rs-arrow">→</span>
                  <span>{fmtD(r.date_fin)}</span>
                </div>
              </td>

              {/* Total */}
              <td><b className="rs-montant">{fmt(r.montant_total)} DT</b></td>

              {/* Commission */}
              <td className="af2-td-comm">{fmt(r.commission_agence)} DT</td>

              {/* Part */}
              <td>{fmt(r.part_partenaire)} DT</td>

              {/* Taux */}
              <td><span className="rs-taux">{r.taux_commission}%</span></td>

              {/* Statut */}
              <td><Pill statut={r.statut_commission} /></td>

              {/* Date paiement */}
              <td>
                {r.date_paiement
                  ? <span className="rs-paid-date">✓ {fmtD(r.date_paiement)}</span>
                  : <span className="af2-muted">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}