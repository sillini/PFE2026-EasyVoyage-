import { useState, useEffect, useCallback } from "react";
import "./AdminDemandesPartenaire.css";

const BASE = "http://localhost:8000/api/v1";
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
});

const STATUTS = [
  { value: "",            label: "Toutes",     dot: null },
  { value: "EN_ATTENTE",  label: "En attente", dot: "amber" },
  { value: "CONFIRMEE",   label: "Confirmées", dot: "green" },
  { value: "ANNULEE",     label: "Annulées",   dot: "red" },
];

const TYPES = {
  HOTEL:  { label: "Hôtel",  icon: "🏨", cls: "hotel" },
  AGENCE: { label: "Agence", icon: "✈️", cls: "agence" },
  AUTRE:  { label: "Autre",  icon: "🏢", cls: "autre" },
};

/* ── micro-composants ──────────────────────────────────── */
function StatutBadge({ statut }) {
  const MAP = {
    EN_ATTENTE: { label: "En attente", cls: "adm-badge-attente"   },
    CONFIRMEE:  { label: "Confirmée",  cls: "adm-badge-confirmee" },
    ANNULEE:    { label: "Annulée",    cls: "adm-badge-annulee"   },
  };
  const { label, cls } = MAP[statut] || { label: statut, cls: "" };
  return (
    <span className={`adm-badge ${cls}`}>
      <span className="adm-badge-dot" />
      {label}
    </span>
  );
}

function TypeTag({ type }) {
  const { label, icon, cls } = TYPES[type] || TYPES.AUTRE;
  return <span className={`adm-type-tag adm-type-${cls}`}>{icon} {label}</span>;
}

function Avatar({ prenom, nom }) {
  return (
    <div className="adm-avatar">
      {(prenom?.[0] || "").toUpperCase()}{(nom?.[0] || "").toUpperCase()}
    </div>
  );
}

function formatDate(dt) {
  if (!dt) return "—";
  return new Date(dt).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

/* ══════════════════════════════════════════════════════════
   MODAL DÉTAIL / TRAITEMENT
══════════════════════════════════════════════════════════ */
function DemandeDetailModal({ demande, onClose, onTraited, onConfirmer }) {
  const [action,  setAction]  = useState(null);
  const [note,    setNote]    = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const handleAnnuler = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${BASE}/admin/demandes-partenaire/${demande.id}/traiter`, {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ action: "ANNULER", note_admin: note || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Erreur serveur");
      onTraited(); onClose();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleConfirmer = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${BASE}/admin/demandes-partenaire/${demande.id}/traiter`, {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ action: "CONFIRMER", note_admin: note || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Erreur serveur");

      const otpRes = await fetch(`${BASE}/admin/partenaires/invite`, {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ email: demande.email }),
      });
      const otpData = await otpRes.json();
      if (!otpRes.ok) throw new Error(otpData.detail || "Erreur envoi OTP");

      onClose();
      onConfirmer(demande.email, {
        nom: demande.nom, prenom: demande.prenom,
        telephone: demande.telephone || "",
        nom_entreprise: demande.nom_entreprise,
        type_partenaire: demande.type_partenaire,
      });
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="adm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="adm-modal">

        {/* Modal header */}
        <div className="adm-modal-header">
          <div className="adm-modal-header-left">
            <Avatar prenom={demande.prenom} nom={demande.nom} />
            <div className="adm-modal-identity">
              <h3>{demande.prenom} {demande.nom}</h3>
              <p>{demande.nom_entreprise}</p>
            </div>
          </div>
          <div className="adm-modal-header-right">
            <StatutBadge statut={demande.statut} />
            <button className="adm-modal-close" onClick={onClose} aria-label="Fermer">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="adm-modal-body">

          {/* Infos personnelles */}
          <div className="adm-section">
            <div className="adm-section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="13" height="13">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              Informations personnelles
            </div>
            <div className="adm-info-grid">
              <div className="adm-info-item">
                <span>Prénom</span>
                <strong>{demande.prenom || "—"}</strong>
              </div>
              <div className="adm-info-item">
                <span>Nom</span>
                <strong>{demande.nom || "—"}</strong>
              </div>
              <div className="adm-info-item">
                <span>Email</span>
                <a href={`mailto:${demande.email}`}>{demande.email}</a>
              </div>
              <div className="adm-info-item">
                <span>Téléphone</span>
                <strong>{demande.telephone || "—"}</strong>
              </div>
              <div className="adm-info-item adm-full">
                <span>Demande reçue le</span>
                <strong>{formatDate(demande.created_at)}</strong>
              </div>
            </div>
          </div>

          {/* Établissement */}
          <div className="adm-section">
            <div className="adm-section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="13" height="13">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              Établissement
            </div>
            <div className="adm-info-grid">
              <div className="adm-info-item">
                <span>Nom de l'établissement</span>
                <strong>{demande.nom_entreprise || "—"}</strong>
              </div>
              <div className="adm-info-item">
                <span>Type d'établissement</span>
                <TypeTag type={demande.type_partenaire} />
              </div>
              {demande.adresse && (
                <div className="adm-info-item adm-full">
                  <span>Adresse</span>
                  <strong>{demande.adresse}</strong>
                </div>
              )}
              {demande.site_web && (
                <div className="adm-info-item adm-full">
                  <span>Site web</span>
                  <a href={demande.site_web} target="_blank" rel="noreferrer">{demande.site_web}</a>
                </div>
              )}
            </div>
          </div>

          {/* Message */}
          {demande.message && (
            <div className="adm-section">
              <div className="adm-section-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="13" height="13">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                Message du demandeur
              </div>
              <div className="adm-message-box">"{demande.message}"</div>
            </div>
          )}

          {/* Traitement EN_ATTENTE */}
          {demande.statut === "EN_ATTENTE" && (
            <div className="adm-section adm-traitement">
              <div className="adm-section-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="13" height="13">
                  <polyline points="9 11 12 14 22 4"/>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                </svg>
                Traitement de la demande
              </div>

              <div className="adm-action-row">
                <button
                  className={`adm-action-btn adm-confirm-btn ${action === "CONFIRMER" ? "selected" : ""}`}
                  onClick={() => setAction("CONFIRMER")}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Confirmer & inviter
                </button>
                <button
                  className={`adm-action-btn adm-cancel-btn ${action === "ANNULER" ? "selected" : ""}`}
                  onClick={() => setAction("ANNULER")}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                  Refuser la demande
                </button>
              </div>

              {action && (
                <div className="adm-action-form">
                  <div className="adm-field">
                    <label>Note interne <span className="adm-optional">(optionnel)</span></label>
                    <textarea
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      placeholder={action === "CONFIRMER" ? "Instructions particulières…" : "Raison du refus (non envoyée au demandeur)"}
                      rows={3}
                    />
                  </div>

                  {action === "CONFIRMER" && (
                    <div className="adm-info-notice">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      <p>Un code OTP sera envoyé à <strong>{demande.email}</strong>. Vous serez redirigé vers le wizard d'invitation avec les informations pré-remplies.</p>
                    </div>
                  )}

                  {error && (
                    <div className="adm-form-error">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                        <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                      </svg>
                      {error}
                    </div>
                  )}

                  <div className="adm-form-footer">
                    <button className="adm-btn-secondary" onClick={() => { setAction(null); setError(null); }}>
                      Annuler
                    </button>
                    <button
                      className={`adm-btn-primary ${action === "ANNULER" ? "danger" : ""}`}
                      onClick={action === "CONFIRMER" ? handleConfirmer : handleAnnuler}
                      disabled={loading}>
                      {loading
                        ? <span className="adm-spin" />
                        : action === "CONFIRMER"
                          ? <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13"><polyline points="20 6 9 17 4 12"/></svg>Confirmer & envoyer le code</>
                          : <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>Refuser la demande</>
                      }
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Déjà traité */}
          {demande.statut !== "EN_ATTENTE" && (
            <div className="adm-section">
              <div className="adm-section-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="13" height="13">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                Historique de traitement
              </div>
              <div className="adm-info-grid">
                <div className="adm-info-item">
                  <span>Traité le</span>
                  <strong>{formatDate(demande.traite_at)}</strong>
                </div>
                {demande.note_admin && (
                  <div className="adm-info-item adm-full">
                    <span>Note admin</span>
                    <strong>{demande.note_admin}</strong>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE PRINCIPALE
══════════════════════════════════════════════════════════ */
export default function AdminDemandesPartenaire({ onConfirmer }) {
  const [demandes,  setDemandes]  = useState([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [statut,    setStatut]    = useState("");
  const [search,    setSearch]    = useState("");
  const [page,      setPage]      = useState(1);
  const [selected,  setSelected]  = useState(null);
  const perPage = 15;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ page, per_page: perPage });
      if (statut) q.set("statut", statut);
      if (search) q.set("search", search);
      const res  = await fetch(`${BASE}/admin/demandes-partenaire?${q}`, { headers: authHeaders() });
      const data = await res.json();
      setDemandes(data.items || []);
      setTotal(data.total || 0);
    } catch { setDemandes([]); }
    finally { setLoading(false); }
  }, [statut, search, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const t = setTimeout(() => setPage(1), 400);
    return () => clearTimeout(t);
  }, [search]);

  const totalPages = Math.ceil(total / perPage);
  const countByStatut = {
    "":           total,
    EN_ATTENTE:   demandes.filter(d => d.statut === "EN_ATTENTE").length,
    CONFIRMEE:    demandes.filter(d => d.statut === "CONFIRMEE").length,
    ANNULEE:      demandes.filter(d => d.statut === "ANNULEE").length,
  };

  return (
    <div className="adm-page">

      {/* ── Header ─────────────────────────────────────── */}
      <header className="adm-page-header">
        <div className="adm-page-title-block">
          <div className="adm-page-eyebrow">
            <span className="adm-eyebrow-dot" />
            Gestion des candidatures
          </div>
          <h1 className="adm-page-title">Demandes Partenaires</h1>
          <p className="adm-page-desc">
            {total} demande{total !== 1 ? "s" : ""} reçue{total !== 1 ? "s" : ""} au total
          </p>
        </div>
      </header>

      {/* ── Toolbar ────────────────────────────────────── */}
      <div className="adm-toolbar">
        {/* Onglets statut */}
        <div className="adm-tabs">
          {STATUTS.map(s => (
            <button
              key={s.value}
              className={`adm-tab ${statut === s.value ? "adm-tab-active" : ""}`}
              onClick={() => { setStatut(s.value); setPage(1); }}>
              {s.dot && <span className={`adm-tab-dot adm-td-${s.dot}`} />}
              {s.label}
              <span className="adm-tab-count">
                {s.value === "" ? total : (demandes.filter(d => d.statut === s.value).length)}
              </span>
            </button>
          ))}
        </div>

        <div className="adm-toolbar-spacer" />

        {/* Recherche */}
        <label className="adm-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher nom, email, entreprise…"
          />
          {search && (
            <button className="adm-search-clear" onClick={() => setSearch("")} title="Effacer">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="10" height="10">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </label>

        {/* Compteur */}
        <div className="adm-result-pill">
          <span className="adm-rp-num">{demandes.length}</span>
          <span className="adm-rp-lbl">affiché{demandes.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────── */}
      <div className="adm-table-shell">
        {loading ? (
          <div className="adm-state">
            <div className="adm-loader">
              <div className="adm-loader-ring" />
              <div className="adm-loader-ring adm-lr2" />
            </div>
            <p>Chargement des demandes…</p>
          </div>
        ) : demandes.length === 0 ? (
          <div className="adm-state">
            <div className="adm-empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <h3>Aucune demande trouvée</h3>
            <p>{search ? `Aucun résultat pour "${search}"` : "Aucune demande dans cette catégorie"}</p>
          </div>
        ) : (
          <table className="adm-table">
            <thead>
              <tr>
                <th>Demandeur</th>
                <th>Établissement</th>
                <th>Type</th>
                <th>Date de demande</th>
                <th>Statut</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {demandes.map((d, i) => (
                <tr
                  key={d.id}
                  className={`adm-row ${d.statut === "EN_ATTENTE" ? "adm-row-pending" : ""}`}
                  onClick={() => setSelected(d)}
                  style={{ animationDelay: `${i * 0.04}s` }}>

                  <td>
                    <div className="adm-person">
                      <Avatar prenom={d.prenom} nom={d.nom} />
                      <div className="adm-person-info">
                        <span className="adm-person-name">{d.prenom} {d.nom}</span>
                        <span className="adm-person-email">{d.email}</span>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span className="adm-etablissement">{d.nom_entreprise}</span>
                  </td>

                  <td>
                    <TypeTag type={d.type_partenaire} />
                  </td>

                  <td>
                    <span className="adm-date">{formatDate(d.created_at)}</span>
                  </td>

                  <td>
                    <StatutBadge statut={d.statut} />
                  </td>

                  <td onClick={e => e.stopPropagation()}>
                    <button
                      className={`adm-action-btn-row ${d.statut === "EN_ATTENTE" ? "pending" : "view"}`}
                      onClick={() => setSelected(d)}>
                      {d.statut === "EN_ATTENTE" ? (
                        <>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                            <polyline points="9 11 12 14 22 4"/>
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                          </svg>
                          Traiter
                        </>
                      ) : (
                        <>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                          Détails
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Pagination ─────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="adm-pagination">
          <button
            className="adm-pg-btn"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Précédent
          </button>
          <div className="adm-pg-pages">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = i + 1;
              return (
                <button key={p} className={`adm-pg-num ${page === p ? "active" : ""}`}
                  onClick={() => setPage(p)}>{p}</button>
              );
            })}
          </div>
          <button
            className="adm-pg-btn"
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}>
            Suivant
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      )}

      {/* ── Modal ──────────────────────────────────────── */}
      {selected && (
        <DemandeDetailModal
          demande={selected}
          onClose={() => setSelected(null)}
          onTraited={() => { load(); setSelected(null); }}
          onConfirmer={(email, formData) => {
            setSelected(null);
            onConfirmer?.(email, formData);
          }}
        />
      )}
    </div>
  );
}