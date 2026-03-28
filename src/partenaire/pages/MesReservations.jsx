/* ═══════════════════════════════════════════════════════════════
   src/partenaire/pages/MesReservations.jsx
   Page réservations côté partenaire :
     1. Vue liste des hôtels avec stats
     2. Vue réservations d'un hôtel (filtres + recherche + détail)
═══════════════════════════════════════════════════════════════ */
import { useState, useEffect, useCallback } from "react";
import "./MesReservations.css";

const BASE = "http://localhost:8000/api/v1";

function authHeaders() {
  const token = localStorage.getItem("access_token");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

async function apiFetch(url) {
  const res  = await fetch(url, { headers: authHeaders() });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }
  if (!res.ok) throw new Error(data.detail || `Erreur ${res.status}`);
  return data;
}

// ── Badges statut ─────────────────────────────────────────────
const STATUT_CONFIG = {
  CONFIRMEE:  { label: "Confirmée",  cls: "badge-confirmee"  },
  EN_ATTENTE: { label: "En attente", cls: "badge-attente"    },
  ANNULEE:    { label: "Annulée",    cls: "badge-annulee"    },
  TERMINEE:   { label: "Terminée",   cls: "badge-terminee"   },
};

function StatutBadge({ statut }) {
  const cfg = STATUT_CONFIG[statut] || { label: statut, cls: "badge-attente" };
  return <span className={`resa-badge ${cfg.cls}`}>{cfg.label}</span>;
}

function SourceBadge({ source }) {
  return (
    <span className={`source-badge source-${source}`}>
      {source === "client" ? "👤 Client" : "🧳 Visiteur"}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MODAL DÉTAIL RÉSERVATION
// ═══════════════════════════════════════════════════════════════
function DetailModal({ resa, onClose }) {
  if (!resa) return null;

  const rows = [
    ["Type",          <SourceBadge source={resa.source} />],
    ["Statut",        <StatutBadge statut={resa.statut} />],
    ["N° Facture",    resa.numero_facture || "—"],
    ["N° Voucher",    resa.numero_voucher || "—"],
    ["Statut facture",resa.statut_facture || "—"],
    ["Client",        `${resa.client_prenom} ${resa.client_nom}`],
    ["Email",         resa.client_email],
    ["Téléphone",     resa.client_telephone || "—"],
    ["Chambre",       resa.chambre_nom || "—"],
    ["Adultes",       resa.nb_adultes],
    ["Enfants",       resa.nb_enfants],
    ["Arrivée",       fmt(resa.date_debut)],
    ["Départ",        fmt(resa.date_fin)],
    ["Durée",         `${resa.nb_nuits} nuit${resa.nb_nuits > 1 ? "s" : ""}`],
    ["Montant TTC",   <strong>{resa.total_ttc.toFixed(2)} DT</strong>],
    ["Méthode paiement", resa.methode_paiement || "—"],
    ["Réservé le",    resa.date_reservation],
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Détail de la réservation</h3>
            <p className="modal-sub">#{resa.id} · {resa.source === "client" ? "Compte client" : "Visiteur sans compte"}</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <table className="detail-table">
            <tbody>
              {rows.map(([label, val]) => (
                <tr key={label}>
                  <td className="dt-label">{label}</td>
                  <td className="dt-val">{val}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="modal-footer">
          <p className="modal-note">
            ℹ️ En tant que partenaire, vous ne pouvez pas annuler une réservation.
          </p>
          <button className="btn-secondary" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  );
}

function fmt(dateStr) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch { return dateStr; }
}

// ═══════════════════════════════════════════════════════════════
//  VUE 2 — RÉSERVATIONS D'UN HÔTEL
// ═══════════════════════════════════════════════════════════════
function HotelReservations({ hotel, onBack }) {
  const [data,          setData]          = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");
  const [search,        setSearch]        = useState("");
  const [searchFacture, setSearchFacture] = useState("");
  const [filterSource,  setFilterSource]  = useState("");   // "" | "client" | "visiteur"
  const [filterStatut,  setFilterStatut]  = useState("");
  const [selectedResa,  setSelectedResa]  = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filterSource)  params.append("source", filterSource);
      if (filterStatut)  params.append("statut", filterStatut);
      if (search)        params.append("search", search);
      if (searchFacture) params.append("numero_facture", searchFacture);

      const result = await apiFetch(
        `${BASE}/reservations/partenaire/hotel/${hotel.hotel_id}?${params}`
      );
      setData(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [hotel.hotel_id, filterSource, filterStatut, search, searchFacture]);

  useEffect(() => { load(); }, [load]);

  // Debounce recherche texte
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [debouncedFacture, setDebouncedFacture] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setSearch(debouncedSearch), 400);
    return () => clearTimeout(t);
  }, [debouncedSearch]);

  useEffect(() => {
    const t = setTimeout(() => setSearchFacture(debouncedFacture), 400);
    return () => clearTimeout(t);
  }, [debouncedFacture]);

  const items = data?.items || [];

  return (
    <div className="mr-page">
      {/* Header navigation */}
      <div className="mr-breadcrumb">
        <button className="btn-back" onClick={onBack}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Mes Hôtels
        </button>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-current">{hotel.hotel_nom}</span>
      </div>

      {/* Stats rapides */}
      {data && (
        <div className="resa-stats-bar">
          <div className="stat-pill stat-total">
            <span className="sp-num">{data.total}</span>
            <span className="sp-lbl">Total</span>
          </div>
          <div className="stat-pill stat-client">
            <span className="sp-num">{data.nb_clients}</span>
            <span className="sp-lbl">👤 Clients</span>
          </div>
          <div className="stat-pill stat-visiteur">
            <span className="sp-num">{data.nb_visiteurs}</span>
            <span className="sp-lbl">🧳 Visiteurs</span>
          </div>
        </div>
      )}

      {/* Barre de filtres */}
      <div className="filters-bar">
        {/* Recherche client */}
        <div className="filter-group">
          <label className="filter-label">Rechercher un client</label>
          <div className="search-input-wrap">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              className="filter-input"
              type="text"
              placeholder="Nom, prénom, email, téléphone…"
              value={debouncedSearch}
              onChange={e => setDebouncedSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Recherche facture/voucher */}
        <div className="filter-group">
          <label className="filter-label">N° Facture / Voucher</label>
          <div className="search-input-wrap">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <input
              className="filter-input"
              type="text"
              placeholder="FAC-2026-… ou VCH-…"
              value={debouncedFacture}
              onChange={e => setDebouncedFacture(e.target.value)}
            />
          </div>
        </div>

        {/* Filtre source */}
        <div className="filter-group">
          <label className="filter-label">Type de client</label>
          <select
            className="filter-select"
            value={filterSource}
            onChange={e => setFilterSource(e.target.value)}
          >
            <option value="">Tous</option>
            <option value="client">👤 Clients (avec compte)</option>
            <option value="visiteur">🧳 Visiteurs (sans compte)</option>
          </select>
        </div>

        {/* Filtre statut */}
        <div className="filter-group">
          <label className="filter-label">Statut</label>
          <select
            className="filter-select"
            value={filterStatut}
            onChange={e => setFilterStatut(e.target.value)}
          >
            <option value="">Tous les statuts</option>
            <option value="CONFIRMEE">Confirmée</option>
            <option value="EN_ATTENTE">En attente</option>
            <option value="TERMINEE">Terminée</option>
            <option value="ANNULEE">Annulée</option>
          </select>
        </div>

        {/* Reset */}
        {(debouncedSearch || debouncedFacture || filterSource || filterStatut) && (
          <button
            className="btn-reset"
            onClick={() => {
              setDebouncedSearch(""); setDebouncedFacture("");
              setFilterSource(""); setFilterStatut("");
            }}
          >
            ✕ Réinitialiser
          </button>
        )}
      </div>

      {/* Table réservations */}
      {loading ? (
        <div className="mr-loading">
          <div className="spinner" />
          <p>Chargement des réservations…</p>
        </div>
      ) : error ? (
        <div className="mr-error">
          <span>⚠️ {error}</span>
          <button onClick={load}>Réessayer</button>
        </div>
      ) : items.length === 0 ? (
        <div className="mr-empty">
          <div className="empty-icon">🔍</div>
          <p>Aucune réservation trouvée pour ces critères.</p>
        </div>
      ) : (
        <div className="resa-table-wrap">
          <table className="resa-table">
            <thead>
              <tr>
                <th>#ID</th>
                <th>Type</th>
                <th>Client</th>
                <th>Email</th>
                <th>Chambre</th>
                <th>Arrivée</th>
                <th>Départ</th>
                <th>Nuits</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Facture / Voucher</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(r => (
                <tr key={`${r.source}-${r.id}`} className="resa-row">
                  <td className="td-id">#{r.id}</td>
                  <td><SourceBadge source={r.source} /></td>
                  <td className="td-client">{r.client_prenom} {r.client_nom}</td>
                  <td className="td-email">{r.client_email}</td>
                  <td>{r.chambre_nom || "—"}</td>
                  <td>{fmt(r.date_debut)}</td>
                  <td>{fmt(r.date_fin)}</td>
                  <td className="td-center">{r.nb_nuits}</td>
                  <td className="td-montant">{r.total_ttc.toFixed(2)} DT</td>
                  <td><StatutBadge statut={r.statut} /></td>
                  <td className="td-ref">
                    {r.numero_facture ? (
                      <span className="ref-chip ref-facture">{r.numero_facture}</span>
                    ) : r.numero_voucher ? (
                      <span className="ref-chip ref-voucher">{r.numero_voucher}</span>
                    ) : "—"}
                  </td>
                  <td>
                    <button
                      className="btn-detail"
                      onClick={() => setSelectedResa(r)}
                      title="Voir le détail"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                      Détail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedResa && (
        <DetailModal resa={selectedResa} onClose={() => setSelectedResa(null)} />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  VUE 1 — LISTE DES HÔTELS
// ═══════════════════════════════════════════════════════════════
function HotelCard({ hotel, onClick }) {
  const hasImg = !!hotel.hotel_image;
  return (
    <div className="hotel-card" onClick={onClick}>
      <div className="hc-image">
        {hasImg ? (
          <img src={hotel.hotel_image} alt={hotel.hotel_nom} />
        ) : (
          <div className="hc-placeholder">🏨</div>
        )}
      </div>
      <div className="hc-body">
        <div className="hc-header">
          <h3 className="hc-nom">{hotel.hotel_nom}</h3>
          <span className="hc-ville">📍 {hotel.hotel_ville}</span>
        </div>
        <div className="hc-stats">
          <div className="hcs-item">
            <span className="hcs-num">{hotel.nb_reservations}</span>
            <span className="hcs-lbl">Réservations</span>
          </div>
          <div className="hcs-sep" />
          <div className="hcs-item">
            <span className="hcs-num">{hotel.nb_clients}</span>
            <span className="hcs-lbl">Clients</span>
          </div>
          <div className="hcs-sep" />
          <div className="hcs-item">
            <span className="hcs-num">{hotel.nb_visiteurs}</span>
            <span className="hcs-lbl">Visiteurs</span>
          </div>
          <div className="hcs-sep" />
          <div className="hcs-item hcs-ca">
            <span className="hcs-num">{hotel.ca_total.toFixed(0)} DT</span>
            <span className="hcs-lbl">CA Total</span>
          </div>
        </div>
        <div className="hc-footer">
          <span className="hc-voir">Voir les réservations →</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════
export default function MesReservations() {
  const [hotels,       setHotels]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [searchHotel,  setSearchHotel]  = useState("");
  const [selectedHotel,setSelectedHotel]= useState(null);  // hotel object

  const loadHotels = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch(`${BASE}/reservations/partenaire/mes-hotels`);
      setHotels(data.items || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadHotels(); }, [loadHotels]);

  // ── Vue détail hôtel ──────────────────────────────────────
  if (selectedHotel) {
    return (
      <HotelReservations
        hotel={selectedHotel}
        onBack={() => setSelectedHotel(null)}
      />
    );
  }

  // ── Vue liste hôtels ──────────────────────────────────────
  const filtered = hotels.filter(h =>
    h.hotel_nom.toLowerCase().includes(searchHotel.toLowerCase()) ||
    h.hotel_ville.toLowerCase().includes(searchHotel.toLowerCase())
  );

  return (
    <div className="mr-page">
      {/* En-tête */}
      <div className="mr-header">
        <div>
          <h1 className="mr-title">Réservations</h1>
          <p className="mr-subtitle">
            Consultez les réservations passées dans vos établissements
          </p>
        </div>
        <div className="search-input-wrap mr-search">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            className="filter-input"
            placeholder="Rechercher un hôtel…"
            value={searchHotel}
            onChange={e => setSearchHotel(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="mr-loading">
          <div className="spinner" />
          <p>Chargement de vos hôtels…</p>
        </div>
      ) : error ? (
        <div className="mr-error">
          <span>⚠️ {error}</span>
          <button onClick={loadHotels}>Réessayer</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="mr-empty">
          <div className="empty-icon">🏨</div>
          <p>Aucun hôtel trouvé.</p>
        </div>
      ) : (
        <div className="hotels-grid">
          {filtered.map(h => (
            <HotelCard
              key={h.hotel_id}
              hotel={h}
              onClick={() => setSelectedHotel(h)}
            />
          ))}
        </div>
      )}
    </div>
  );
}