/**
 * TabPartenaires — onglet Partenaires avec drill-down 3 niveaux.
 *
 * Niveau 1 : liste des partenaires
 * Niveau 2 : hôtels d'un partenaire
 * Niveau 3 : réservations d'un hôtel (filtrage/tri/pagination côté frontend)
 *
 * CHANGEMENTS vs ancienne version :
 *  - filtreComm supprimé — géré localement dans TableReservations/useReservationsFilters
 *  - loadReservations charge toutes les réservations d'un coup (per_page=500)
 *    afin que les filtres frontend soient complets et instantanés
 *  - Pagination retirée du niveau "reservations" (gérée dans TableReservations)
 *  - Toolbar simplifiée : plus de select statut au niveau reservations
 */
import { useState, useEffect, useCallback } from "react";
import Breadcrumb        from "../ui/Breadcrumb.jsx";
import Pagination        from "../ui/Pagination.jsx";
import PayModal          from "../ui/PayModal.jsx";
import Spinner           from "../ui/Spinner.jsx";
import TablePartenaires  from "../partenaires/TablePartenaires.jsx";
import TableHotels       from "../partenaires/TableHotels.jsx";
import TableReservations from "../partenaires/TableReservations.jsx";
import {
  fetchPartenaires,
  fetchHotelsPartenaire,
  fetchReservationsHotel,
  payerPartenaire,
} from "../../../services/financesApi.js";

const PER = 15;

export default function TabPartenaires() {
  // ── Navigation drill-down ─────────────────────────────
  const [view,     setView]    = useState("partenaires"); // "partenaires" | "hotels" | "reservations"
  const [selPart,  setSelPart] = useState(null);
  const [selHotel, setSelHotel]= useState(null);

  // ── Données ───────────────────────────────────────────
  const [partenaires,  setPart]  = useState([]);
  const [hotels,       setHotels]= useState([]);
  const [reservations, setResas] = useState([]);  // données brutes, filtrage côté frontend

  // ── Contrôles liste partenaires ───────────────────────
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);
  const [total,   setTotal]   = useState(0);
  const [search,  setSearch]  = useState("");

  // ── Paiement ──────────────────────────────────────────
  const [paying,     setPaying]    = useState(null);
  const [payNote,    setPayNote]   = useState("");
  const [payLoading, setPayLoading]= useState(false);

  // ── Chargements ───────────────────────────────────────

  const loadPartenaires = useCallback(async () => {
    setLoading(true);
    try {
      const d = await fetchPartenaires(page, PER, search);
      setPart(d.items || []);
      setTotal(d.total || 0);
    } finally { setLoading(false); }
  }, [page, search]);

  const loadHotels = useCallback(async (partId) => {
    setLoading(true);
    try {
      const d = await fetchHotelsPartenaire(partId);
      setHotels(d.items || []);
    } finally { setLoading(false); }
  }, []);

  const loadReservations = useCallback(async (partId, hotelId) => {
    setLoading(true);
    try {
      // Charge toutes les réservations (clients + visiteurs) sans filtre backend.
      // Le filtrage, le tri et la pagination sont entièrement gérés
      // côté frontend dans useReservationsFilters (TableReservations).
      const d = await fetchReservationsHotel(partId, hotelId, 1, 500, "");
      setResas(d.items || []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (view === "partenaires") loadPartenaires();
    else if (view === "hotels"       && selPart)             loadHotels(selPart.id_partenaire);
    else if (view === "reservations" && selPart && selHotel) loadReservations(selPart.id_partenaire, selHotel.id_hotel);
  }, [view, loadPartenaires, loadHotels, loadReservations, selPart, selHotel]);

  // ── Navigation ────────────────────────────────────────
  const goHotels = (part)  => { setSelPart(part);  setPage(1); setView("hotels"); };
  const goResas  = (hotel) => { setSelHotel(hotel); setPage(1); setView("reservations"); };

  const backToPartenaires = () => {
    setView("partenaires");
    setSelPart(null);
    setSelHotel(null);
    setPage(1);
  };

  const backToHotels = () => {
    setView("hotels");
    setSelHotel(null);
    setPage(1);
  };

  // ── Paiement ──────────────────────────────────────────
  const openPay  = (part) => { setPaying(part); setPayNote(""); };
  const closePay = ()     => { setPaying(null); setPayNote(""); };

  const handleConfirmPay = async () => {
    if (!paying) return;
    setPayLoading(true);
    try {
      await payerPartenaire(paying.id_partenaire, payNote);
      closePay();
      loadPartenaires();
    } finally { setPayLoading(false); }
  };

  // ── Breadcrumb ────────────────────────────────────────
  const crumbs = [
    { label: "Partenaires", onClick: view !== "partenaires" ? backToPartenaires : null },
  ];
  if (selPart)  crumbs.push({ label: selPart.nom_entreprise, onClick: view === "reservations" ? backToHotels : null });
  if (selHotel) crumbs.push({ label: selHotel.hotel_nom });

  const totalPages = Math.ceil(total / PER);

  return (
    <div className="af2-tab-content">
      <PayModal
        partenaire={paying}
        note={payNote}
        loading={payLoading}
        onNoteChange={setPayNote}
        onConfirm={handleConfirmPay}
        onClose={closePay}
      />

      <Breadcrumb crumbs={crumbs} />

      {/* Toolbar contextuelle — uniquement pour la liste partenaires */}
      {view === "partenaires" && (
        <div className="af2-toolbar">
          <input
            className="af2-search"
            placeholder="🔍 Rechercher partenaire…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      )}

      {loading ? <Spinner /> : (
        <>
          {/* ── Niveau 1 : Partenaires ── */}
          {view === "partenaires" && (
            <>
              <TablePartenaires
                partenaires={partenaires}
                onDrill={goHotels}
                onPay={openPay}
              />
              {/* Pagination uniquement pour la liste paginée côté backend */}
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </>
          )}

          {/* ── Niveau 2 : Hôtels ── */}
          {view === "hotels" && selPart && (
            <TableHotels
              partenaire={selPart}
              hotels={hotels}
              onDrill={goResas}
            />
          )}

          {/* ── Niveau 3 : Réservations ── */}
          {/* Pagination gérée en interne par TableReservations/useReservationsFilters */}
          {view === "reservations" && selHotel && (
            <TableReservations
              hotel={selHotel}
              reservations={reservations}
            />
          )}
        </>
      )}
    </div>
  );
}