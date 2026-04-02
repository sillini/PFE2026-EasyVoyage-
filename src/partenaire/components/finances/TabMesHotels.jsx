/**
 * src/partenaire/components/finances/TabMesHotels.jsx
 * =====================================================
 * Onglet "Mes hôtels" avec drill-down :
 *   Niveau 1 : liste des hôtels du partenaire
 *   Niveau 2 : réservations (clients + visiteurs) de l'hôtel sélectionné
 *
 * Modifications vs version originale :
 *   - Champ "Référence" affiche N° facture pour clients ET visiteurs
 *   - Ajout recherche par N° facture (envoyée au backend)
 *   - Ajout filtre plage de dates (côté frontend)
 */
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  fetchPartHotels,
  fetchPartReservations,
} from "../../services/financesPartenaireApi.js";

const fmt = (n) =>
  new Intl.NumberFormat("fr-TN", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n ?? 0);

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("fr-TN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const PER_PAGE = 50;

// ── Pills (classes CSS existantes) ───────────────────────
function PillStatut({ statut }) {
  const map = {
    CONFIRMEE: ["pf-pill--paid",   "Confirmée"],
    TERMINEE:  ["pf-pill--paid",   "Terminée"],
    ANNULEE:   ["pf-pill--cancel", "Annulée"],
  };
  const [cls, label] = map[statut] || ["pf-pill--wait", statut];
  return <span className={`pf-pill ${cls}`}>{label}</span>;
}

function PillPaiement({ statut }) {
  if (statut === "PAYEE") return <span className="pf-pill pf-pill--paid">Payé</span>;
  return <span className="pf-pill pf-pill--wait">En attente</span>;
}

function PillSource({ source }) {
  if (source === "client")
    return <span className="pf-pill pf-pill--client">Client</span>;
  return <span className="pf-pill pf-pill--visitor">Visiteur</span>;
}

// ── Niveau 1 : Liste hôtels ───────────────────────────────
function ListeHotels({ onSelect }) {
  const [hotels,  setHotels]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPartHotels()
      .then((d) => setHotels(d.items || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="pf-spinner"><div className="pf-spin" /></div>;

  if (hotels.length === 0) {
    return (
      <div className="pf-card">
        <div className="pf-empty">Aucun hôtel associé à votre compte.</div>
      </div>
    );
  }

  return (
    <div className="pf-card">
      <div className="pf-card-header">
        <h3 className="pf-card-title">Mes hôtels</h3>
        <span style={{ fontSize: 12, color: "#7A8FA6" }}>
          {hotels.length} établissement(s)
        </span>
      </div>
      {hotels.map((h) => (
        <div key={h.id_hotel} className="pf-hotel-row" onClick={() => onSelect(h)}>
          <div className="pf-hotel-avatar">
            {h.hotel_nom.slice(0, 2).toUpperCase()}
          </div>
          <div className="pf-hotel-info">
            <p className="pf-hotel-name">{h.hotel_nom}</p>
            <p className="pf-hotel-ville">{h.hotel_ville}</p>
          </div>
          <div className="pf-hotel-stats">
            <div className="pf-hotel-stat">
              <span className="pf-hotel-stat-val">{h.nb_resas_total}</span>
              <span className="pf-hotel-stat-lbl">réservations</span>
            </div>
            <div className="pf-hotel-stat">
              <span className="pf-hotel-stat-val">{h.nb_resas_mois}</span>
              <span className="pf-hotel-stat-lbl">ce mois</span>
            </div>
            <div className="pf-hotel-stat">
              <span className="pf-hotel-stat-val">{fmt(h.revenu_mois)} DT</span>
              <span className="pf-hotel-stat-lbl">revenu ce mois</span>
            </div>
            <div className="pf-hotel-stat">
              <span className="pf-hotel-stat-val" style={{ color: "#27AE60" }}>
                {fmt(h.solde_restant)} DT
              </span>
              <span className="pf-hotel-stat-lbl">solde restant</span>
            </div>
          </div>
          <span className="pf-hotel-arrow">›</span>
        </div>
      ))}
    </div>
  );
}

// ── Niveau 2 : Réservations d'un hôtel ───────────────────
function ReservationsHotel({ hotel, onBack }) {
  const [resas,   setResas]   = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);

  // Filtres backend
  const [search,         setSearch]         = useState("");
  const [statut,         setStatut]         = useState("");
  const [searchFacture,  setSearchFacture]  = useState(""); // valeur debounced → backend
  const [dFacture,       setDFacture]       = useState(""); // valeur saisie

  // Filtres date côté frontend
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin,   setDateFin]   = useState("");

  const searchRef  = useRef(null);
  const factureRef = useRef(null);
  const debRef     = useRef(null);

  // Debounce recherche N° facture
  useEffect(() => {
    clearTimeout(debRef.current);
    debRef.current = setTimeout(() => setSearchFacture(dFacture), 350);
    return () => clearTimeout(debRef.current);
  }, [dFacture]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await fetchPartReservations(
        hotel.id_hotel, 1, 200, statut, search, searchFacture
      );
      setResas(d.items || []);
      setTotal(d.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [hotel.id_hotel, statut, search, searchFacture]);

  useEffect(() => { load(); }, [load]);

  // Filtre date côté frontend
  const filtered = useMemo(() => {
    let items = resas;
    if (dateDebut) items = items.filter((r) => (r.date_debut || "") >= dateDebut);
    if (dateFin)   items = items.filter((r) => (r.date_fin   || "") <= dateFin);
    return items;
  }, [resas, dateDebut, dateFin]);

  const hasFilters = search || statut || dFacture || dateDebut || dateFin;

  const onReset = () => {
    setSearch(""); setStatut(""); setDFacture(""); setDateDebut(""); setDateFin("");
    if (searchRef.current)  searchRef.current.value  = "";
    if (factureRef.current) factureRef.current.value = "";
  };

  return (
    <div>
      {/* Breadcrumb */}
      <div className="pf-breadcrumb">
        <button className="pf-bc-btn" onClick={onBack}>Mes hôtels</button>
        <span className="pf-bc-sep">›</span>
        <span className="pf-bc-curr">{hotel.hotel_nom}</span>
      </div>

      {/* Résumé hôtel */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <div className="pf-card" style={{ flex: 1, minWidth: 160, padding: "14px 18px", marginBottom: 0 }}>
          <div style={{ fontSize: 11, color: "#7A8FA6", marginBottom: 4 }}>Revenu total</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#1A3F63" }}>
            {fmt(hotel.revenu_total)} DT
          </div>
        </div>
        <div className="pf-card" style={{ flex: 1, minWidth: 160, padding: "14px 18px", marginBottom: 0 }}>
          <div style={{ fontSize: 11, color: "#7A8FA6", marginBottom: 4 }}>Rés. totales</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#1A3F63" }}>
            {hotel.nb_resas_total}
          </div>
        </div>
        <div className="pf-card" style={{ flex: 1, minWidth: 160, padding: "14px 18px", marginBottom: 0 }}>
          <div style={{ fontSize: 11, color: "#7A8FA6", marginBottom: 4 }}>Solde restant</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#27AE60" }}>
            {fmt(hotel.solde_restant)} DT
          </div>
        </div>
      </div>

      {/* Card principale avec tableau */}
      <div className="pf-card" style={{ marginBottom: 0 }}>

        {/* Header + toolbar */}
        <div className="pf-card-header" style={{ flexDirection: "column", alignItems: "flex-start", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", flexWrap: "wrap", gap: 8 }}>
            <h3 className="pf-card-title">
              Réservations — {hotel.hotel_nom}
            </h3>
            {!loading && (
              <span style={{ fontSize: 12, color: "#7A8FA6" }}>
                {filtered.length !== total
                  ? `${filtered.length} / ${total} résultat(s)`
                  : `${total} résultat(s)`}
              </span>
            )}
          </div>

          {/* Ligne 1 : recherche nom + N° facture + statut */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", flexWrap: "wrap" }}>
            {/* Recherche nom/email */}
            <input
              ref={searchRef}
              className="pf-search"
              placeholder="Nom ou email client…"
              style={{ minWidth: 160, flex: 1 }}
              onChange={(e) => setSearch(e.target.value)}
            />

            {/* Recherche N° facture */}
            <div style={{
              display: "flex", alignItems: "center", gap: 7,
              background: "#fff", border: "1.5px solid #DDE5EE",
              borderRadius: 8, padding: "7px 12px", flex: 1, minWidth: 180,
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7A8FA6" strokeWidth="2" style={{ flexShrink: 0 }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="8" y1="13" x2="16" y2="13"/>
              </svg>
              <input
                ref={factureRef}
                type="text"
                placeholder="N° Facture (FAC-2026-…)"
                onChange={(e) => setDFacture(e.target.value)}
                style={{
                  border: "none", outline: "none", background: "transparent",
                  fontSize: 13, color: "#1C2B3A", width: "100%", fontFamily: "inherit",
                }}
              />
            </div>

            {/* Statut */}
            <select
              className="pf-select"
              value={statut}
              onChange={(e) => setStatut(e.target.value)}
            >
              <option value="">Tous les statuts</option>
              <option value="CONFIRMEE">Confirmée</option>
              <option value="TERMINEE">Terminée</option>
              <option value="ANNULEE">Annulée</option>
            </select>
          </div>

          {/* Ligne 2 : filtre par dates */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "#7A8FA6", flexShrink: 0 }}>Date séjour :</span>
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              title="Date arrivée minimum"
              style={{
                border: "1.5px solid #DDE5EE", borderRadius: 8,
                padding: "7px 10px", fontSize: 12, color: "#1C2B3A",
                background: "#fff", outline: "none", fontFamily: "inherit", cursor: "pointer",
              }}
            />
            <span style={{ fontSize: 12, color: "#7A8FA6" }}>→</span>
            <input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              title="Date départ maximum"
              style={{
                border: "1.5px solid #DDE5EE", borderRadius: 8,
                padding: "7px 10px", fontSize: 12, color: "#1C2B3A",
                background: "#fff", outline: "none", fontFamily: "inherit", cursor: "pointer",
              }}
            />
            {hasFilters && (
              <button
                onClick={onReset}
                style={{
                  padding: "7px 12px", background: "#FEE2E2", color: "#991B1B",
                  border: "1px solid #FECACA", borderRadius: 8,
                  fontSize: 11, fontWeight: 700, cursor: "pointer",
                  fontFamily: "inherit", whiteSpace: "nowrap",
                }}
              >
                ✕ Réinitialiser
              </button>
            )}
          </div>
        </div>

        {/* Tableau */}
        {loading ? (
          <div className="pf-spinner"><div className="pf-spin" /></div>
        ) : (
          <>
            <div className="pf-table-wrap">
              <table className="pf-table">
                <thead>
                  <tr>
                    <th>Référence</th>
                    <th>Source</th>
                    <th>Client / Visiteur</th>
                    <th>Séjour</th>
                    <th style={{ textAlign: "right" }}>Montant</th>
                    <th style={{ textAlign: "right" }}>Ma part (90%)</th>
                    <th>Statut rés.</th>
                    <th>Paiement</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="pf-empty">
                        {hasFilters
                          ? "Aucune réservation ne correspond aux critères."
                          : "Aucune réservation trouvée."}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((r) => (
                      <tr key={`${r.source}-${r.id}`}>
                        <td>
                          <span className="pf-ref">{r.reference}</span>
                        </td>
                        <td><PillSource source={r.source} /></td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{r.client_nom}</div>
                          <div style={{ fontSize: 11, color: "#7A8FA6" }}>{r.client_email}</div>
                        </td>
                        <td>
                          <div style={{ fontSize: 12 }}>
                            {fmtDate(r.date_debut)} → {fmtDate(r.date_fin)}
                          </div>
                          <div style={{ fontSize: 11, color: "#7A8FA6" }}>{r.nb_nuits} nuit(s)</div>
                        </td>
                        <td style={{ textAlign: "right" }} className="pf-amt">
                          {fmt(r.montant_total)} DT
                        </td>
                        <td style={{ textAlign: "right" }} className="pf-amt-part">
                          {fmt(r.part_partenaire)} DT
                        </td>
                        <td><PillStatut statut={r.statut} /></td>
                        <td><PillPaiement statut={r.statut_paiement} /></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Export principal ──────────────────────────────────────
export default function TabMesHotels() {
  const [selectedHotel, setSelectedHotel] = useState(null);

  if (selectedHotel) {
    return (
      <ReservationsHotel
        hotel={selectedHotel}
        onBack={() => setSelectedHotel(null)}
      />
    );
  }

  return <ListeHotels onSelect={setSelectedHotel} />;
}