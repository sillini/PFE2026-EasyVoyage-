/**
 * TableReservations — composant principal du drill-down hôtel (niveau 3).
 *
 * Orchestre :
 *   ReservationsSearchBar  — recherche en temps réel
 *   ReservationsFilters    — filtres avancés (source, statut, période, montant)
 *   ReservationsTable      — tableau avec tri par colonne
 *   Pagination             — navigation entre pages
 *
 * Toute la logique de filtrage/tri/pagination est isolée dans
 * useReservationsFilters — ce composant ne fait qu'orchestrer.
 *
 * @prop {object} hotel        — HotelFinanceDetail
 * @prop {Array}  reservations — ReservationFinanceItem[] (données brutes du backend)
 */
import "./ReservationsTable.css";
import KpiCard                 from "../ui/KpiCard.jsx";
import Pagination              from "../ui/Pagination.jsx";
import ReservationsSearchBar   from "./ReservationsSearchBar.jsx";
import ReservationsFilters     from "./ReservationsFilters.jsx";
import ReservationsTable       from "./ReservationsTable.jsx";
import { useReservationsFilters } from "../../../hooks/useReservationsFilters.js";
import { fmt } from "../../../services/formatters.js";

export default function TableReservations({ hotel, reservations }) {
  const {
    filters,
    setFilter,
    toggleSort,
    resetFilters,
    activeFilterCount,
    page,
    setPage,
    totalPages,
    totalFiltered,
    totalRaw,
    rows,
  } = useReservationsFilters(reservations);

  // Résumé financier des lignes filtrées
  const summaryFiltered = rows.length > 0 || totalFiltered > 0
    ? reservations
        .filter((r) => {
          // réappliquer le filtre source et statut sur le total filtré pour le résumé
          if (filters.typeSource && r.type_source !== filters.typeSource) return false;
          if (filters.statut     && r.statut_commission !== filters.statut) return false;
          return true;
        })
    : [];

  return (
    <div className="af2-table-card rs-container">
      {/* ── En-tête hôtel ── */}
      <div className="af2-hotel-header">
        <h3>🏨 {hotel.hotel_nom}
          {hotel.hotel_ville && hotel.hotel_ville !== "—" && (
            <span className="rs-ville"> — {hotel.hotel_ville}</span>
          )}
        </h3>
        <div className="af2-part-kpis">
          <KpiCard small icon="💰" label="Revenu"  value={`${fmt(hotel.revenu_total)} DT`}      color="#1A3F63" />
          <KpiCard small icon="⚡" label="Agence"  value={`${fmt(hotel.commission_agence)} DT`}  color="#27AE60" />
          <KpiCard small icon="⏳" label="Solde"   value={`${fmt(hotel.solde_restant)} DT`}      color="#E74C3C" />
          <KpiCard small icon="📋" label="Résas"   value={totalRaw}                              color="#2B5F8E" />
        </div>
      </div>

      {/* ── Barre de contrôle ── */}
      <div className="rs-control-bar">
        <ReservationsSearchBar
          value={filters.search}
          onChange={(v) => setFilter("search", v)}
          total={totalRaw}
          filtered={totalFiltered}
        />
        <ReservationsFilters
          filters={filters}
          setFilter={setFilter}
          resetFilters={resetFilters}
          activeFilterCount={activeFilterCount}
        />
      </div>

      {/* ── Résumé actif si filtres appliqués ── */}
      {activeFilterCount > 0 || filters.search ? (
        <div className="rs-summary-bar">
          <span className="rs-summary-text">
            <b>{totalFiltered}</b> réservation{totalFiltered > 1 ? "s" : ""} sur {totalRaw}
            {totalFiltered > 0 && (
              <> — Total filtré :
                <b> {fmt(reservations
                  .filter(r =>
                    (!filters.typeSource || r.type_source === filters.typeSource) &&
                    (!filters.statut     || r.statut_commission === filters.statut) &&
                    (!filters.search     || r.client_nom?.toLowerCase().includes(filters.search.toLowerCase()) || r.client_email?.toLowerCase().includes(filters.search.toLowerCase())) &&
                    (!filters.dateDebut  || r.date_debut >= filters.dateDebut) &&
                    (!filters.dateFin    || r.date_fin   <= filters.dateFin) &&
                    (filters.montantMin === "" || r.montant_total >= Number(filters.montantMin)) &&
                    (filters.montantMax === "" || r.montant_total <= Number(filters.montantMax))
                  )
                  .reduce((s, r) => s + (r.montant_total || 0), 0)
                )} DT</b>
              </>
            )}
          </span>
        </div>
      ) : null}

      {/* ── Tableau ── */}
      <ReservationsTable
        rows={rows}
        sortState={{ sortCol: filters.sortCol, sortDir: filters.sortDir }}
        onSort={toggleSort}
      />

      {/* ── Pagination ── */}
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}