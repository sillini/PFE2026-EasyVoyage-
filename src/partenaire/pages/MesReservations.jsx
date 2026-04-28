/* ═══════════════════════════════════════════════════════════════
   src/partenaire/pages/MesReservations.jsx
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

function fmt(dateStr) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch { return dateStr; }
}

/* ── Badges ─────────────────────────────────────────────── */
const STATUT_CFG = {
  CONFIRMEE:  { label:"Confirmée",  cls:"mr-badge-confirmee"  },
  EN_ATTENTE: { label:"En attente", cls:"mr-badge-attente"    },
  ANNULEE:    { label:"Annulée",    cls:"mr-badge-annulee"    },
  TERMINEE:   { label:"Terminée",   cls:"mr-badge-terminee"   },
};

function StatutBadge({ statut }) {
  const cfg = STATUT_CFG[statut] || { label:statut, cls:"mr-badge-attente" };
  return (
    <span className={`mr-badge ${cfg.cls}`}>
      <span className="mr-badge-dot" />
      {cfg.label}
    </span>
  );
}

function SourceBadge({ source }) {
  return (
    <span className={`mr-source mr-source-${source}`}>
      {source === "client"
        ? <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="11" height="11"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>Client</>
        : <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="11" height="11"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>Visiteur</>
      }
    </span>
  );
}

/* ══════════════════════════════════════════════════════════
   MODAL DÉTAIL RÉSERVATION
══════════════════════════════════════════════════════════ */
function DetailModal({ resa, onClose }) {
  if (!resa) return null;

  const rows = [
    ["Type",            <SourceBadge source={resa.source} />],
    ["Statut",          <StatutBadge statut={resa.statut} />],
    ["N° Facture",      resa.numero_facture || "—"],
    ["N° Voucher",      resa.numero_voucher || "—"],
    ["Statut facture",  resa.statut_facture || "—"],
    ["Client",          `${resa.client_prenom} ${resa.client_nom}`],
    ["Email",           resa.client_email],
    ["Téléphone",       resa.client_telephone || "—"],
    ["Chambre",         resa.chambre_nom || "—"],
    ["Adultes",         resa.nb_adultes],
    ["Enfants",         resa.nb_enfants],
    ["Arrivée",         fmt(resa.date_debut)],
    ["Départ",          fmt(resa.date_fin)],
    ["Durée",           `${resa.nb_nuits} nuit${resa.nb_nuits > 1 ? "s" : ""}`],
    ["Montant TTC",     <strong className="mr-prix-strong">{resa.total_ttc.toFixed(2)} DT</strong>],
    ["Paiement",        resa.methode_paiement || "—"],
    ["Réservé le",      resa.date_reservation],
  ];

  return (
    <div className="mr-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mr-modal">
        <div className="mr-modal-ridge" />
        <div className="mr-modal-head">
          <div className="mr-modal-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <div>
            <h3>Détail de la réservation</h3>
            <p>#{resa.id} · {resa.source === "client" ? "Compte client" : "Visiteur sans compte"}</p>
          </div>
          <button className="mr-modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="mr-modal-body">
          {/* Montant mis en avant */}
          <div className="mr-modal-montant">
            <span>Montant total TTC</span>
            <strong>{resa.total_ttc.toFixed(2)} DT</strong>
          </div>

          <div className="mr-detail-grid">
            {rows.filter(([l]) => l !== "Montant TTC").map(([label, val]) => (
              <div key={label} className="mr-detail-row">
                <span className="mr-dl">{label}</span>
                <span className="mr-dv">{val}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mr-modal-foot">
          <p className="mr-modal-note">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="13" height="13">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            En tant que partenaire, vous ne pouvez pas annuler une réservation.
          </p>
          <button className="mr-btn-ghost" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   VUE RÉSERVATIONS D'UN HÔTEL
══════════════════════════════════════════════════════════ */
function HotelReservations({ hotel, onBack }) {
  const [data,          setData]          = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");
  const [search,        setSearch]        = useState("");
  const [searchFacture, setSearchFacture] = useState("");
  const [filterSource,  setFilterSource]  = useState("");
  const [filterStatut,  setFilterStatut]  = useState("");
  const [dateDebut,     setDateDebut]     = useState("");   // ← NOUVEAU
  const [dateFin,       setDateFin]       = useState("");   // ← NOUVEAU
  const [selectedResa,  setSelectedResa]  = useState(null);

  const [dSearch,  setDSearch]  = useState("");
  const [dFacture, setDFacture] = useState("");

  useEffect(() => { const t = setTimeout(() => setSearch(dSearch), 400); return () => clearTimeout(t); }, [dSearch]);
  useEffect(() => { const t = setTimeout(() => setSearchFacture(dFacture), 400); return () => clearTimeout(t); }, [dFacture]);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams();
      if (filterSource)  params.append("source", filterSource);
      if (filterStatut)  params.append("statut", filterStatut);
      if (search)        params.append("search", search);
      if (searchFacture) params.append("numero_facture", searchFacture);
      const result = await apiFetch(`${BASE}/reservations/partenaire/hotel/${hotel.hotel_id}?${params}`);
      setData(result);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [hotel.hotel_id, filterSource, filterStatut, search, searchFacture]);

  useEffect(() => { load(); }, [load]);

  // ── Filtrage par date côté client ──────────────────────
  // La réservation est retenue si son intervalle [date_debut, date_fin] chevauche
  // la fenêtre [dateDebut, dateFin] sélectionnée par le partenaire.
  const allItems = data?.items || [];
  const items = allItems.filter(r => {
    if (dateDebut && r.date_fin   < dateDebut) return false;  // se termine avant le début du filtre
    if (dateFin   && r.date_debut > dateFin)   return false;  // commence après la fin du filtre
    return true;
  });

  const hasFilters = dSearch || dFacture || filterSource || filterStatut || dateDebut || dateFin;

  return (
    <div className="mr-page">

      {/* Breadcrumb */}
      <div className="mr-breadcrumb">
        <button className="mr-back-btn" onClick={onBack}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Réservations
        </button>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="11" height="11" className="mr-bc-sep">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
        <span className="mr-bc-current">{hotel.hotel_nom}</span>
      </div>

      {/* Stats rapides */}
      {data && (
        <div className="mr-stats-strip">
          {[
            { val:data.total,       lbl:"Total",    color:"blue",  icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
            { val:data.nb_clients,  lbl:"Clients",  color:"sky",   icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
            { val:data.nb_visiteurs,lbl:"Visiteurs", color:"gold",  icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/></svg> },
          ].map((s,i) => (
            <div key={i} className={`mr-stat-card mr-sc-${s.color}`}>
              <div className="mr-sc-icon">{s.icon}</div>
              <div className="mr-sc-body">
                <span className="mr-sc-val">{s.val}</span>
                <span className="mr-sc-lbl">{s.lbl}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar filtres */}
      <div className="mr-toolbar">
        <label className="mr-filter-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input placeholder="Nom, prénom, email, téléphone…"
            value={dSearch} onChange={e => setDSearch(e.target.value)} />
          {dSearch && (
            <button className="mr-filter-clear" onClick={() => setDSearch("")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="9" height="9">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </label>

        <label className="mr-filter-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <input placeholder="FAC-2026-… ou VCH-…"
            value={dFacture} onChange={e => setDFacture(e.target.value)} />
        </label>

        <select className="mr-filter-select" value={filterSource} onChange={e => setFilterSource(e.target.value)}>
          <option value="">Tous les types</option>
          <option value="client">👤 Clients</option>
          <option value="visiteur">🧳 Visiteurs</option>
        </select>

        <select className="mr-filter-select" value={filterStatut} onChange={e => setFilterStatut(e.target.value)}>
          <option value="">Tous les statuts</option>
          <option value="CONFIRMEE">Confirmée</option>
          <option value="EN_ATTENTE">En attente</option>
          <option value="TERMINEE">Terminée</option>
          <option value="ANNULEE">Annulée</option>
        </select>

        {/* ── NOUVEAU : Filtre par date (Arrivée / Départ) ── */}
        <div className="mr-filter-dates">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13" className="mr-filter-dates-ico">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <input
            type="date"
            className="mr-filter-date"
            value={dateDebut}
            onChange={e => setDateDebut(e.target.value)}
            title="Arrivée à partir du"
          />
          <span className="mr-filter-dates-sep">→</span>
          <input
            type="date"
            className="mr-filter-date"
            value={dateFin}
            onChange={e => setDateFin(e.target.value)}
            title="Départ jusqu'au"
          />
        </div>

        {hasFilters && (
          <button
            className="mr-btn-reset"
            onClick={() => {
              setDSearch(""); setDFacture("");
              setFilterSource(""); setFilterStatut("");
              setDateDebut(""); setDateFin("");
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
              <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
            </svg>
            Réinitialiser
          </button>
        )}

        <div className="mr-result-pill">
          <span className="mr-rp-num">{items.length}</span>
          <span className="mr-rp-lbl">résultat{items.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Contenu */}
      {loading ? (
        <div className="mr-state-box">
          <div className="mr-loader"><div className="mr-ring"/><div className="mr-ring mr-ring2"/></div>
          <p>Chargement des réservations…</p>
        </div>
      ) : error ? (
        <div className="mr-error-bar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
          <button onClick={load}>Réessayer</button>
        </div>
      ) : items.length === 0 ? (
        <div className="mr-state-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8" width="56" height="56">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <h3>Aucune réservation trouvée</h3>
          <p>Modifiez vos critères de recherche</p>
        </div>
      ) : (
        <div className="mr-table-shell">
          <table className="mr-table">
            <thead>
              <tr>
                {/* ❌ Colonne #ID supprimée */}
                <th>Type</th>
                <th>Client</th>
                <th>Email</th>
                <th>Chambre</th>
                <th>Arrivée</th>
                <th>Départ</th>
                <th>Nuits</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Référence</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((r, i) => (
                <tr key={`${r.source}-${r.id}`} className="mr-tr"
                  style={{ animationDelay:`${i*0.03}s` }}
                  onClick={() => setSelectedResa(r)}>
                  {/* ❌ Cellule #ID supprimée */}
                  <td><SourceBadge source={r.source} /></td>
                  <td className="mr-td-client">{r.client_prenom} {r.client_nom}</td>
                  <td className="mr-td-email">{r.client_email}</td>
                  <td className="mr-td-chambre">{r.chambre_nom || "—"}</td>
                  <td className="mr-td-date">{fmt(r.date_debut)}</td>
                  <td className="mr-td-date">{fmt(r.date_fin)}</td>
                  <td className="mr-td-nuits">
                    <span className="mr-nuits-badge">{r.nb_nuits}n</span>
                  </td>
                  <td className="mr-td-montant">{r.total_ttc.toFixed(2)} DT</td>
                  <td><StatutBadge statut={r.statut} /></td>
                  <td onClick={e => e.stopPropagation()}>
                    {r.numero_facture
                      ? <span className="mr-ref-chip mr-ref-fac">{r.numero_facture}</span>
                      : r.numero_voucher
                        ? <span className="mr-ref-chip mr-ref-vch">{r.numero_voucher}</span>
                        : <span className="mr-td-none">—</span>
                    }
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    <button className="mr-btn-detail" onClick={() => setSelectedResa(r)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
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

/* ══════════════════════════════════════════════════════════
   CARTE HÔTEL
══════════════════════════════════════════════════════════ */
function HotelCard({ hotel, onClick, index }) {
  return (
    <div className="mr-hotel-card" style={{ animationDelay:`${index*0.08}s` }} onClick={onClick}>
      {/* Image */}
      <div className="mr-hcard-img">
        {hotel.hotel_image
          ? <img src={hotel.hotel_image} alt={hotel.hotel_nom} />
          : (
            <div className="mr-hcard-no-img">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.9" width="48" height="48">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
          )
        }
        <div className="mr-hcard-img-overlay">
          <span className="mr-hcard-voir">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            Voir les réservations
          </span>
        </div>
        {hotel.nb_reservations > 0 && (
          <div className="mr-hcard-count-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="10" height="10">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            {hotel.nb_reservations}
          </div>
        )}
      </div>

      {/* Corps */}
      <div className="mr-hcard-body">
        <div className="mr-hcard-header">
          <h3 className="mr-hcard-nom">{hotel.hotel_nom}</h3>
          <p className="mr-hcard-ville">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="11" height="11">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            {hotel.hotel_ville}
          </p>
        </div>

        {/* KPI strip */}
        <div className="mr-hcard-kpis">
          <div className="mr-hkpi">
            <span className="mr-hkpi-val">{hotel.nb_reservations}</span>
            <span className="mr-hkpi-lbl">Réservations</span>
          </div>
          <div className="mr-hkpi-sep" />
          <div className="mr-hkpi mr-hkpi-blue">
            <span className="mr-hkpi-val">{hotel.nb_clients}</span>
            <span className="mr-hkpi-lbl">Clients</span>
          </div>
          <div className="mr-hkpi-sep" />
          <div className="mr-hkpi mr-hkpi-amber">
            <span className="mr-hkpi-val">{hotel.nb_visiteurs}</span>
            <span className="mr-hkpi-lbl">Visiteurs</span>
          </div>
          <div className="mr-hkpi-sep" />
          <div className="mr-hkpi mr-hkpi-gold">
            <span className="mr-hkpi-val">{hotel.ca_total.toFixed(0)}</span>
            <span className="mr-hkpi-lbl">DT CA</span>
          </div>
        </div>

        <div className="mr-hcard-footer">
          <span className="mr-hcard-cta">
            Voir les réservations
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE PRINCIPALE
══════════════════════════════════════════════════════════ */
export default function MesReservations() {
  const [hotels,        setHotels]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");
  const [searchHotel,   setSearchHotel]   = useState("");
  const [selectedHotel, setSelectedHotel] = useState(null);

  const loadHotels = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const data = await apiFetch(`${BASE}/reservations/partenaire/mes-hotels`);
      setHotels(data.items || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadHotels(); }, [loadHotels]);

  if (selectedHotel) {
    return <HotelReservations hotel={selectedHotel} onBack={() => setSelectedHotel(null)} />;
  }

  const filtered = hotels.filter(h =>
    h.hotel_nom.toLowerCase().includes(searchHotel.toLowerCase()) ||
    h.hotel_ville.toLowerCase().includes(searchHotel.toLowerCase())
  );

  const totalResas = hotels.reduce((s,h) => s + h.nb_reservations, 0);
  const totalCA    = hotels.reduce((s,h) => s + h.ca_total, 0);

  return (
    <div className="mr-page">

      {/* ── Header ──────────────────────────────────────── */}
      <header className="mr-page-header">
        <div className="mr-title-block">
          <div className="mr-eyebrow">
            <span className="mr-eyebrow-dot" />
            Suivi de l'activité
          </div>
          <h1 className="mr-page-title">Réservations</h1>
          <p className="mr-page-desc">Consultez les réservations passées dans vos établissements</p>
        </div>
        <label className="mr-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input value={searchHotel} onChange={e => setSearchHotel(e.target.value)} placeholder="Rechercher un hôtel…" />
          {searchHotel && (
            <button className="mr-filter-clear" onClick={() => setSearchHotel("")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="9" height="9">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </label>
      </header>

      {/* ── KPI globaux ─────────────────────────────────── */}
      {!loading && hotels.length > 0 && (
        <div className="mr-kpi-strip">
          {[
            { color:"blue",  val:hotels.length,  lbl:"Hôtels",       sub:"établissements", icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
            { color:"green", val:totalResas,      lbl:"Réservations",  sub:"au total",       icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
            { color:"gold",  val:`${totalCA.toFixed(0)} DT`, lbl:"CA Total", sub:"tous hôtels", icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
          ].map((k,i) => (
            <div key={i} className={`mr-kpi-card mr-kpi-${k.color}`}>
              <div className="mr-kpi-icon">{k.icon}</div>
              <div className="mr-kpi-body">
                <span className="mr-kpi-val">{k.val}</span>
                <span className="mr-kpi-lbl">{k.lbl}</span>
                <span className="mr-kpi-sub">{k.sub}</span>
              </div>
              <div className="mr-kpi-deco" />
            </div>
          ))}
        </div>
      )}

      {/* ── Contenu ─────────────────────────────────────── */}
      {loading ? (
        <div className="mr-state-box">
          <div className="mr-loader"><div className="mr-ring"/><div className="mr-ring mr-ring2"/></div>
          <p>Chargement de vos hôtels…</p>
        </div>
      ) : error ? (
        <div className="mr-error-bar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
          <button onClick={loadHotels}>Réessayer</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="mr-state-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8" width="56" height="56">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <h3>Aucun hôtel trouvé</h3>
          <p>{searchHotel ? `Aucun hôtel ne correspond à "${searchHotel}"` : "Vous n'avez pas encore d'hôtel enregistré"}</p>
        </div>
      ) : (
        <div className="mr-hotels-grid">
          {filtered.map((h, i) => (
            <HotelCard key={h.hotel_id} hotel={h} index={i} onClick={() => setSelectedHotel(h)} />
          ))}
        </div>
      )}
    </div>
  );
}