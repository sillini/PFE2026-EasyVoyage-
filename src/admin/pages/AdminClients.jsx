import { useState, useEffect, useCallback } from "react";
import "./AdminClients.css";

const BASE = "http://localhost:8000/api/v1";
const auth = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
});

// ── Helpers ───────────────────────────────────────────────
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const fmtDatetime = (d) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
const nuits = (d1, d2) => Math.max(0, Math.round((new Date(d2) - new Date(d1)) / 86400000));

const STATUTS_RESA = {
  EN_ATTENTE: { label: "En attente", color: "#E67E22", bg: "#FFF3E0", border: "#FFB74D" },
  CONFIRMEE:  { label: "Confirmée",  color: "#27AE60", bg: "#E8F5E9", border: "#81C784" },
  ANNULEE:    { label: "Annulée",    color: "#E53935", bg: "#FFEBEE", border: "#EF9A9A" },
  TERMINEE:   { label: "Terminée",   color: "#1565C0", bg: "#E3F2FD", border: "#90CAF9" },
};

function PillResa({ statut }) {
  const s = STATUTS_RESA[statut] || { label: statut, color: "#8A9BB0", bg: "#F5F7FA", border: "#D8E4EF" };
  return <span className="ac-pill" style={{ color: s.color, background: s.bg, borderColor: s.border }}>{s.label}</span>;
}

// ══════════════════════════════════════════════════════════
//  MODAL DÉTAIL RÉSERVATION
// ══════════════════════════════════════════════════════════
function ResaDetailModal({ resa, onClose, onRefresh }) {
  const [confirming, setConfirming] = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [err,        setErr]        = useState(null);
  const n = nuits(resa.date_debut, resa.date_fin);
  const isVoyage = resa.type_resa === "voyage";

  const handleAnnuler = async () => {
    setLoading(true); setErr(null);
    try {
      const r = await fetch(`${BASE}/reservations/${resa.id}/annuler`, { method: "POST", headers: auth() });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Erreur");
      onRefresh(); onClose();
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="ac-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="ac-resa-modal">
        <div className={`ac-resa-band ${isVoyage ? "voyage" : "hotel"}`} />
        <div className="ac-resa-head">
          <div className={`ac-resa-icon ${isVoyage ? "voyage" : "hotel"}`}>
            {isVoyage
              ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            }
          </div>
          <div>
            <h3>{isVoyage ? resa.voyage_titre : resa.hotel_nom}</h3>
            <p>{isVoyage ? resa.voyage_destination : resa.hotel_ville}</p>
          </div>
          <div className="ac-resa-head-right">
            <PillResa statut={resa.statut} />
            <button className="ac-close-btn" onClick={onClose}>✕</button>
          </div>
        </div>
        <div className="ac-resa-body">
          <div className="ac-resa-section">
            <h4>Séjour</h4>
            <div className="ac-resa-grid">
              <div className="ac-resa-field"><span>Réservé le</span><strong>{resa.date_reservation}</strong></div>
              <div className="ac-resa-field"><span>Arrivée</span><strong>{fmtDate(resa.date_debut)}</strong></div>
              <div className="ac-resa-field"><span>Départ</span><strong>{fmtDate(resa.date_fin)}</strong></div>
              <div className="ac-resa-field"><span>Durée</span><strong>{n} nuit{n > 1 ? "s" : ""}</strong></div>
            </div>
            <div className="ac-resa-montant">
              <span>Montant total</span>
              <strong>{resa.total_ttc?.toFixed(2)} DT</strong>
            </div>
          </div>
          {resa.numero_facture && (
            <div className="ac-resa-section">
              <h4>Facture</h4>
              <div className="ac-resa-grid">
                <div className="ac-resa-field"><span>N° Facture</span><strong className="ac-mono">{resa.numero_facture}</strong></div>
                <div className="ac-resa-field"><span>Statut</span><strong>{resa.statut_facture || "—"}</strong></div>
              </div>
            </div>
          )}
          {(resa.statut === "EN_ATTENTE" || resa.statut === "CONFIRMEE") && (
            <div className="ac-danger-zone">
              {!confirming ? (
                <button className="ac-btn-annuler" onClick={() => setConfirming(true)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                  Annuler cette réservation
                </button>
              ) : (
                <div className="ac-confirm-cancel">
                  <p>Confirmer l'annulation de cette réservation ?</p>
                  {err && <span className="ac-err">{err}</span>}
                  <div className="ac-confirm-btns">
                    <button className="ac-btn-ghost" onClick={() => setConfirming(false)}>Retour</button>
                    <button className="ac-btn-confirm-cancel" onClick={handleAnnuler} disabled={loading}>
                      {loading ? <span className="ac-spin" /> : "Confirmer"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  VUE DÉTAIL CLIENT
// ══════════════════════════════════════════════════════════
function ClientDetail({ client, onBack, onToggle, onRefresh }) {
  const [reservations, setReservations] = useState([]);
  const [loadingResa,  setLoadingResa]  = useState(true);
  const [toggling,     setToggling]     = useState(false);
  const [resaDetail,   setResaDetail]   = useState(null);
  const [searchResa,   setSearchResa]   = useState("");
  const [filtStatut,   setFiltStatut]   = useState("");
  const [filtType,     setFiltType]     = useState("");

  useEffect(() => {
    loadResas();
  }, [client.id]);

  const loadResas = async () => {
    setLoadingResa(true);
    try {
      const r = await fetch(`${BASE}/admin/clients/${client.id}/reservations`, { headers: auth() });
      const d = await r.json();
      setReservations(d.items || []);
    } catch { setReservations([]); }
    finally { setLoadingResa(false); }
  };

  const handleToggle = async () => {
    setToggling(true);
    try { await onToggle(client.id, !client.actif); }
    finally { setToggling(false); }
  };

  // Filtrer réservations
  const filtered = reservations.filter(r => {
    if (filtStatut && r.statut !== filtStatut) return false;
    if (filtType   && r.type_resa !== filtType) return false;
    if (searchResa) {
      const q = searchResa.toLowerCase();
      const matchDest = (r.hotel_nom || r.voyage_titre || "").toLowerCase().includes(q);
      const matchDoc  = (r.numero_facture || "").toLowerCase().includes(q);
      if (!matchDest && !matchDoc) return false;
    }
    return true;
  });

  const totalDepense = reservations.reduce((s, r) => s + (r.total_ttc || 0), 0);

  return (
    <div className="ac-detail-view">

      {/* Breadcrumb */}
      <div className="ac-breadcrumb">
        <button onClick={onBack}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          Retour aux clients
        </button>
        <span>/</span>
        <span>{client.prenom} {client.nom}</span>
      </div>

      {/* Header client */}
      <div className="ac-client-header">
        <div className="ac-client-header-left">
          <div className={`ac-big-avatar ${client.actif ? "actif" : "inactif"}`}>
            {client.prenom?.[0]}{client.nom?.[0]}
          </div>
          <div>
            <div className="ac-client-header-name">
              <h2>{client.prenom} {client.nom}</h2>
              <span className={`ac-status-badge ${client.actif ? "actif" : "inactif"}`}>
                <span className="ac-status-dot" />
                {client.actif ? "Actif" : "Désactivé"}
              </span>
            </div>
            <p className="ac-client-email">{client.email}</p>
            {client.telephone && <p className="ac-client-tel">📞 {client.telephone}</p>}
          </div>
        </div>
        <div className="ac-client-header-right">
          <div className="ac-client-header-stats">
            <div className="ac-header-stat">
              <strong>{reservations.length}</strong>
              <span>réservations</span>
            </div>
            <div className="ac-header-stat-sep" />
            <div className="ac-header-stat">
              <strong>{totalDepense.toFixed(0)} DT</strong>
              <span>dépensés</span>
            </div>
            <div className="ac-header-stat-sep" />
            <div className="ac-header-stat">
              <strong>{fmtDate(client.date_inscription)}</strong>
              <span>inscrit le</span>
            </div>
          </div>
          <button
            className={`ac-toggle-btn ${client.actif ? "suspend" : "activate"}`}
            onClick={handleToggle}
            disabled={toggling}>
            {toggling ? <span className="ac-spin" /> : client.actif
              ? <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>Désactiver</>
              : <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="9 11 12 14 22 4"/></svg>Activer</>
            }
          </button>
        </div>
      </div>

      {/* Réservations */}
      <div className="ac-resas-section">
        <div className="ac-resas-title">
          <h3>Réservations</h3>
          <span className="ac-resas-count">{filtered.length} / {reservations.length}</span>
        </div>

        {/* Filtres réservations */}
        <div className="ac-resas-filters">
          <div className="ac-resa-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              value={searchResa}
              onChange={e => setSearchResa(e.target.value)}
              placeholder="Hôtel, voyage, n° facture..."
            />
            {searchResa && <button onClick={() => setSearchResa("")}>✕</button>}
          </div>
          <select className="ac-resa-select" value={filtStatut} onChange={e => setFiltStatut(e.target.value)}>
            <option value="">Tous statuts</option>
            <option value="EN_ATTENTE">En attente</option>
            <option value="CONFIRMEE">Confirmée</option>
            <option value="TERMINEE">Terminée</option>
            <option value="ANNULEE">Annulée</option>
          </select>
          <div className="ac-type-btns">
            {[{v:"",l:"Tous"},{v:"hotel",l:"🏨 Hôtels"},{v:"voyage",l:"✈️ Voyages"}].map(t => (
              <button key={t.v}
                className={`ac-type-btn ${filtType === t.v ? "active" : ""}`}
                onClick={() => setFiltType(t.v)}>
                {t.l}
              </button>
            ))}
          </div>
          {(searchResa || filtStatut || filtType) && (
            <button className="ac-reset-btn" onClick={() => { setSearchResa(""); setFiltStatut(""); setFiltType(""); }}>
              Réinitialiser
            </button>
          )}
        </div>

        {loadingResa ? (
          <div className="ac-loading"><div className="ac-spin-lg" /><p>Chargement...</p></div>
        ) : filtered.length === 0 ? (
          <div className="ac-empty-resa">
            <span>{reservations.length === 0 ? "📭" : "🔍"}</span>
            <p>{reservations.length === 0 ? "Aucune réservation pour ce client" : "Aucun résultat pour ces filtres"}</p>
          </div>
        ) : (
          <div className="ac-resas-table-shell">
            <table className="ac-resas-table">
              <thead>
                <tr>
                  <th>Destination</th>
                  <th>Période</th>
                  <th>Durée</th>
                  <th>Montant</th>
                  <th>Statut</th>
                  <th>Facture</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => {
                  const n = nuits(r.date_debut, r.date_fin);
                  const isV = r.type_resa === "voyage";
                  return (
                    <tr key={r.id} className="ac-resa-tr" onClick={() => setResaDetail(r)}>
                      <td>
                        <div className="ac-dest">
                          <span className={`ac-dest-bar ${isV ? "voyage" : "hotel"}`} />
                          <div>
                            <b>{isV ? r.voyage_titre : r.hotel_nom}</b>
                            <s>{isV ? r.voyage_destination : r.hotel_ville}</s>
                          </div>
                        </div>
                      </td>
                      <td className="ac-period">
                        <span>{fmtDate(r.date_debut)}</span>
                        <em>→</em>
                        <span>{fmtDate(r.date_fin)}</span>
                      </td>
                      <td className="ac-nuits">{n}n</td>
                      <td className="ac-ttc">{r.total_ttc?.toFixed(2)} DT</td>
                      <td><PillResa statut={r.statut} /></td>
                      <td className="ac-facture">{r.numero_facture || "—"}</td>
                      <td>
                        <button className="ac-btn-voir" onClick={e => { e.stopPropagation(); setResaDetail(r); }}>
                          Détails
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal détail réservation */}
      {resaDetail && (
        <ResaDetailModal
          resa={resaDetail}
          onClose={() => setResaDetail(null)}
          onRefresh={() => { loadResas(); setResaDetail(null); }}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  PAGE PRINCIPALE — Liste des clients
// ══════════════════════════════════════════════════════════
export default function AdminClients() {
  const [clients,   setClients]   = useState([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [err,       setErr]       = useState(null);
  const [search,    setSearch]    = useState("");
  const [filtActif, setFiltActif] = useState("");
  const [page,      setPage]      = useState(1);
  const [selected,  setSelected]  = useState(null); // client sélectionné

  const perPage = 20;

  const load = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const q = new URLSearchParams({ page, per_page: perPage });
      if (search.trim()) q.set("search", search.trim());
      if (filtActif)     q.set("actif",  filtActif);
      const r = await fetch(`${BASE}/admin/clients?${q}`, { headers: auth() });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Erreur");
      setClients(d.items || []);
      setTotal(d.total || 0);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, [page, search, filtActif]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [filtActif]);
  useEffect(() => { const t = setTimeout(() => setPage(1), 400); return () => clearTimeout(t); }, [search]);

  const handleToggle = async (id, actif) => {
    try {
      const r = await fetch(`${BASE}/admin/clients/${id}/toggle`, {
        method: "PATCH", headers: auth(),
        body: JSON.stringify({ actif }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Erreur");
      // Mettre à jour localement
      setClients(prev => prev.map(c => c.id === id ? { ...c, actif: d.actif } : c));
      if (selected?.id === id) setSelected(d);
    } catch (e) { alert(e.message); }
  };

  const totalPages = Math.ceil(total / perPage);
  const nbActifs   = clients.filter(c => c.actif).length;
  const nbInactifs = clients.filter(c => !c.actif).length;

  // Vue détail
  if (selected) {
    return (
      <ClientDetail
        client={selected}
        onBack={() => { setSelected(null); load(); }}
        onToggle={async (id, actif) => { await handleToggle(id, actif); }}
        onRefresh={load}
      />
    );
  }

  return (
    <div className="ac-root">

      {/* Header */}
      <div className="ac-top">
        <div>
          <h1>Clients</h1>
          <p>{total} client{total !== 1 ? "s" : ""} enregistrés</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="ac-kpis">
        {[
          { icon: "👥", val: total,     lbl: "Total",      accent: "#2B5F8E" },
          { icon: "✅", val: nbActifs,  lbl: "Actifs",     accent: "#27AE60" },
          { icon: "🚫", val: nbInactifs,lbl: "Désactivés", accent: "#E53935" },
        ].map((k, i) => (
          <div key={i} className="ac-kpi" style={{ "--acc": k.accent }}>
            <span>{k.icon}</span>
            <div><strong>{k.val}</strong><label>{k.lbl}</label></div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="ac-toolbar">
        <div className="ac-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Nom, prénom, email..."
          />
          {search && <button onClick={() => setSearch("")}>✕</button>}
        </div>
        <div className="ac-actif-tabs">
          {[
            { val: "",      lbl: "Tous"        },
            { val: "true",  lbl: "✅ Actifs"    },
            { val: "false", lbl: "🚫 Désactivés"},
          ].map(t => (
            <button key={t.val}
              className={`ac-actif-tab ${filtActif === t.val ? "active" : ""}`}
              onClick={() => setFiltActif(t.val)}>
              {t.lbl}
            </button>
          ))}
        </div>
      </div>

      {/* Contenu */}
      {loading ? (
        <div className="ac-state"><div className="ac-spin-lg" /><p>Chargement...</p></div>
      ) : err ? (
        <div className="ac-state error"><span>⚠️</span><p>{err}</p><button onClick={load}>Réessayer</button></div>
      ) : clients.length === 0 ? (
        <div className="ac-state"><span>👥</span><p>Aucun client trouvé</p></div>
      ) : (
        <div className="ac-table-shell">
          <table className="ac-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Téléphone</th>
                <th>Inscription</th>
                <th>Dernière connexion</th>
                <th>Réservations</th>
                <th>Total dépensé</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {clients.map(c => (
                <ClientRow
                  key={c.id}
                  client={c}
                  onView={() => setSelected(c)}
                  onToggle={handleToggle}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="ac-pagination">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Préc.</button>
          <span>Page {page} / {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Suiv. →</button>
        </div>
      )}
    </div>
  );
}

// ── Ligne tableau client ──────────────────────────────────
function ClientRow({ client, onView, onToggle }) {
  const [toggling, setToggling] = useState(false);

  const handleToggle = async (e) => {
    e.stopPropagation();
    setToggling(true);
    try { await onToggle(client.id, !client.actif); }
    finally { setToggling(false); }
  };

  return (
    <tr className="ac-tr" onClick={onView}>
      <td>
        <div className="ac-person">
          <div className={`ac-avatar ${client.actif ? "actif" : "inactif"}`}>
            {client.prenom?.[0]}{client.nom?.[0]}
          </div>
          <div>
            <b>{client.prenom} {client.nom}</b>
            <s>{client.email}</s>
          </div>
        </div>
      </td>
      <td className="ac-tel">{client.telephone || "—"}</td>
      <td className="ac-date">{fmtDate(client.date_inscription)}</td>
      <td className="ac-date">{fmtDatetime(client.derniere_connexion) || "Jamais"}</td>
      <td className="ac-nb-resa">
        <span className="ac-resa-badge">{client.nb_reservations}</span>
      </td>
      <td className="ac-depense">{client.total_depense?.toFixed(0)} DT</td>
      <td>
        <span className={`ac-actif-pill ${client.actif ? "actif" : "inactif"}`}>
          <span className="ac-dot" />
          {client.actif ? "Actif" : "Désactivé"}
        </span>
      </td>
      <td>
        <div className="ac-actions" onClick={e => e.stopPropagation()}>
          <button className="ac-btn-view" onClick={onView}>Voir</button>
          <button
            className={`ac-btn-toggle ${client.actif ? "suspend" : "activate"}`}
            onClick={handleToggle}
            disabled={toggling}>
            {toggling ? <span className="ac-spin-sm" /> : client.actif ? "Désactiver" : "Activer"}
          </button>
        </div>
      </td>
    </tr>
  );
}