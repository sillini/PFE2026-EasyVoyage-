/**
 * src/partenaire/components/finances/TabMesHotels.jsx
 * =====================================================
 * Onglet "Mes hôtels" avec drill-down :
 *   Niveau 1 : liste des hôtels du partenaire
 *   Niveau 2 : réservations (clients + visiteurs) de l'hôtel sélectionné
 */
import { useState, useEffect, useCallback } from "react";
import {
  fetchPartHotels,
  fetchPartReservations,
} from "../../services/financesPartenaireApi.js";

const fmt = (n) =>
  new Intl.NumberFormat("fr-TN", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n ?? 0);

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("fr-TN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const PER_PAGE = 15;

// ── Pill statut réservation ─────────────────────────────────────
function PillStatut({ statut }) {
  const map = {
    CONFIRMEE: ["pf-pill--paid",    "Confirmée"],
    TERMINEE:  ["pf-pill--paid",    "Terminée"],
    ANNULEE:   ["pf-pill--cancel",  "Annulée"],
  };
  const [cls, label] = map[statut] || ["pf-pill--wait", statut];
  return <span className={`pf-pill ${cls}`}>{label}</span>;
}

// ── Pill paiement commission ────────────────────────────────────
function PillPaiement({ statut }) {
  if (statut === "PAYEE") return <span className="pf-pill pf-pill--paid">Payé</span>;
  return <span className="pf-pill pf-pill--wait">En attente</span>;
}

// ── Pill source ─────────────────────────────────────────────────
function PillSource({ source }) {
  if (source === "client")
    return <span className="pf-pill pf-pill--client">Client</span>;
  return <span className="pf-pill pf-pill--visitor">Visiteur</span>;
}

// ── Niveau 1 : Liste hôtels ─────────────────────────────────────
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
    return <div className="pf-card"><div className="pf-empty">Aucun hôtel associé à votre compte.</div></div>;
  }

  return (
    <div className="pf-card">
      <div className="pf-card-header">
        <h3 className="pf-card-title">Mes hôtels</h3>
        <span style={{ fontSize: 12, color: "#7A8FA6" }}>{hotels.length} établissement(s)</span>
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
              <span className="pf-hotel-stat-val">{h.nb_resas_mois}</span>
              <span className="pf-hotel-stat-lbl">rés. ce mois</span>
            </div>
            <div className="pf-hotel-stat">
              <span className="pf-hotel-stat-val">{fmt(h.revenu_mois)} DT</span>
              <span className="pf-hotel-stat-lbl">revenu ce mois</span>
            </div>
            <div className="pf-hotel-stat">
              <span className="pf-hotel-stat-val" style={{ color: "#27AE60" }}>{fmt(h.solde_restant)} DT</span>
              <span className="pf-hotel-stat-lbl">solde restant</span>
            </div>
          </div>
          <span className="pf-hotel-arrow">›</span>
        </div>
      ))}
    </div>
  );
}

// ── Niveau 2 : Réservations d'un hôtel ─────────────────────────
function ReservationsHotel({ hotel, onBack }) {
  const [resas,   setResas]   = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [statut,  setStatut]  = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await fetchPartReservations(hotel.id_hotel, page, PER_PAGE, statut, search);
      setResas(d.items || []);
      setTotal(d.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [hotel.id_hotel, page, statut, search]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / PER_PAGE);

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
          <div style={{ fontSize: 20, fontWeight: 800, color: "#1A3F63" }}>{fmt(hotel.revenu_total)} DT</div>
        </div>
        <div className="pf-card" style={{ flex: 1, minWidth: 160, padding: "14px 18px", marginBottom: 0 }}>
          <div style={{ fontSize: 11, color: "#7A8FA6", marginBottom: 4 }}>Rés. totales</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#1A3F63" }}>{hotel.nb_resas_total}</div>
        </div>
        <div className="pf-card" style={{ flex: 1, minWidth: 160, padding: "14px 18px", marginBottom: 0 }}>
          <div style={{ fontSize: 11, color: "#7A8FA6", marginBottom: 4 }}>Solde restant</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#27AE60" }}>{fmt(hotel.solde_restant)} DT</div>
        </div>
      </div>

      {/* Filtres */}
      <div className="pf-card" style={{ marginBottom: 0 }}>
        <div className="pf-card-header">
          <h3 className="pf-card-title">Réservations — {hotel.hotel_nom}</h3>
          <div className="pf-toolbar">
            <input
              className="pf-search"
              placeholder="🔍 Nom ou email client…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
            <select
              className="pf-select"
              value={statut}
              onChange={(e) => { setStatut(e.target.value); setPage(1); }}
            >
              <option value="">Tous les statuts</option>
              <option value="CONFIRMEE">Confirmée</option>
              <option value="TERMINEE">Terminée</option>
              <option value="ANNULEE">Annulée</option>
            </select>
          </div>
        </div>

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
                  {resas.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="pf-empty">Aucune réservation trouvée.</td>
                    </tr>
                  ) : (
                    resas.map((r) => (
                      <tr key={`${r.source}-${r.id}`}>
                        <td><span className="pf-ref">{r.reference}</span></td>
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
                        <td style={{ textAlign: "right" }} className="pf-amt">{fmt(r.montant_total)} DT</td>
                        <td style={{ textAlign: "right" }} className="pf-amt-part">{fmt(r.part_partenaire)} DT</td>
                        <td><PillStatut statut={r.statut} /></td>
                        <td><PillPaiement statut={r.statut_paiement} /></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pf-pagination">
                <button disabled={page <= 1} onClick={() => setPage(page - 1)}>‹ Précédent</button>
                <span>Page {page} / {totalPages} — {total} résultat(s)</span>
                <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Suivant ›</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Export principal ────────────────────────────────────────────
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