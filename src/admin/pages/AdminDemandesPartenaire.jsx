import { useState, useEffect, useCallback } from "react";
import "./AdminDemandesPartenaire.css";

const BASE = "http://localhost:8000/api/v1";
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
});

const STATUTS = [
  { value: "",            label: "Toutes",     color: "#5A7A99" },
  { value: "EN_ATTENTE",  label: "En attente", color: "#E67E22" },
  { value: "CONFIRMEE",   label: "Confirmées", color: "#27AE60" },
  { value: "ANNULEE",     label: "Annulées",   color: "#E74C3C" },
];

const TYPES = {
  HOTEL:  { label: "Hôtel",  icon: "🏨", color: "#2B5F8E" },
  AGENCE: { label: "Agence", icon: "✈️", color: "#8E44AD" },
  AUTRE:  { label: "Autre",  icon: "🏢", color: "#7F8C8D" },
};

function StatutBadge({ statut }) {
  const MAP = {
    EN_ATTENTE: { label: "En attente", cls: "badge-attente"   },
    CONFIRMEE:  { label: "Confirmée",  cls: "badge-confirmee" },
    ANNULEE:    { label: "Annulée",    cls: "badge-annulee"   },
  };
  const { label, cls } = MAP[statut] || { label: statut, cls: "" };
  return <span className={`adp-badge ${cls}`}>{label}</span>;
}

function formatDate(dt) {
  if (!dt) return "—";
  return new Date(dt).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ═══════════════════════════════════════════════════════════
//  MODAL DÉTAIL / TRAITEMENT
// ═══════════════════════════════════════════════════════════
function DemandeDetailModal({ demande, onClose, onTraited, onConfirmer }) {
  const [action,  setAction]  = useState(null);
  const [note,    setNote]    = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  // Annuler via API
  const handleAnnuler = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(
        `${BASE}/admin/demandes-partenaire/${demande.id}/traiter`,
        {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ action: "ANNULER", note_admin: note || undefined }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Erreur serveur");
      onTraited(); onClose();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  // Confirmer → marquer confirmée + envoyer OTP + ouvrir wizard étape 2
  const handleConfirmer = async () => {
    setLoading(true); setError(null);
    try {
      // 1. Marquer la demande confirmée
      const res = await fetch(
        `${BASE}/admin/demandes-partenaire/${demande.id}/traiter`,
        {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ action: "CONFIRMER", note_admin: note || undefined }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Erreur serveur");

      // 2. Envoyer l'OTP à l'email du partenaire
      const otpRes = await fetch(`${BASE}/admin/partenaires/invite`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ email: demande.email }),
      });
      const otpData = await otpRes.json();
      if (!otpRes.ok) throw new Error(otpData.detail || "Erreur envoi OTP");

      // 3. Fermer ce modal → ouvrir wizard à l'étape 2
      onClose();
      onConfirmer(demande.email, {
        nom:             demande.nom,
        prenom:          demande.prenom,
        telephone:       demande.telephone || "",
        nom_entreprise:  demande.nom_entreprise,
        type_partenaire: demande.type_partenaire,
      });
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const typ = TYPES[demande.type_partenaire] || TYPES.AUTRE;

  return (
    <div className="adp-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="adp-detail-modal">

        <div className="adp-detail-header">
          <div className="adp-detail-avatar">{demande.prenom?.[0]}{demande.nom?.[0]}</div>
          <div>
            <h3>{demande.prenom} {demande.nom}</h3>
            <p>{demande.nom_entreprise}</p>
          </div>
          <div className="adp-detail-header-right">
            <StatutBadge statut={demande.statut} />
            <button className="adp-detail-close" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="adp-detail-body">

          <div className="adp-detail-section">
            <h4>Informations personnelles</h4>
            <div className="adp-detail-grid">
              <div className="adp-detail-item">
                <span>Email</span>
                <a href={`mailto:${demande.email}`}>{demande.email}</a>
              </div>
              {demande.telephone && (
                <div className="adp-detail-item">
                  <span>Téléphone</span>
                  <strong>{demande.telephone}</strong>
                </div>
              )}
              <div className="adp-detail-item">
                <span>Demande reçue</span>
                <strong>{formatDate(demande.created_at)}</strong>
              </div>
            </div>
          </div>

          <div className="adp-detail-section">
            <h4>Établissement</h4>
            <div className="adp-detail-grid">
              <div className="adp-detail-item">
                <span>Type</span>
                <strong>{typ.icon} {typ.label}</strong>
              </div>
              {demande.site_web && (
                <div className="adp-detail-item">
                  <span>Site web</span>
                  <a href={demande.site_web} target="_blank" rel="noreferrer">{demande.site_web}</a>
                </div>
              )}
              {demande.adresse && (
                <div className="adp-detail-item">
                  <span>Adresse</span>
                  <strong>{demande.adresse}</strong>
                </div>
              )}
            </div>
          </div>

          {demande.message && (
            <div className="adp-detail-section">
              <h4>Message du demandeur</h4>
              <div className="adp-detail-message">"{demande.message}"</div>
            </div>
          )}

          {/* Traitement (EN_ATTENTE seulement) */}
          {demande.statut === "EN_ATTENTE" && (
            <div className="adp-detail-section adp-traitement">
              <h4>Traitement de la demande</h4>

              <div className="adp-action-btns">
                <button
                  className={`adp-action-btn confirm ${action === "CONFIRMER" ? "selected" : ""}`}
                  onClick={() => setAction("CONFIRMER")}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Confirmer & inviter
                </button>
                <button
                  className={`adp-action-btn cancel ${action === "ANNULER" ? "selected" : ""}`}
                  onClick={() => setAction("ANNULER")}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                  Annuler la demande
                </button>
              </div>

              {action && (
                <>
                  <div className="adp-field">
                    <label>Note interne (optionnel)</label>
                    <textarea
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      placeholder={
                        action === "CONFIRMER"
                          ? "Instructions particulières..."
                          : "Raison du refus (non envoyée au demandeur)"
                      }
                      rows={3}
                    />
                  </div>

                  {action === "CONFIRMER" && (
                    <div className="adp-confirm-info">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      Un code OTP sera envoyé à <strong>{demande.email}</strong>.
                      Vous serez redirigé vers le wizard d'invitation à l'étape de
                      vérification avec les informations pré-remplies.
                    </div>
                  )}

                  {error && <div className="adp-error">{error}</div>}

                  <div className="adp-traitement-footer">
                    <button className="adp-btn-cancel" onClick={() => setAction(null)}>
                      Retour
                    </button>
                    <button
                      className={`adp-btn-confirm ${action === "ANNULER" ? "danger" : ""}`}
                      onClick={action === "CONFIRMER" ? handleConfirmer : handleAnnuler}
                      disabled={loading}>
                      {loading ? <span className="adp-spin" /> : (
                        action === "CONFIRMER"
                          ? "✓ Confirmer & envoyer le code"
                          : "✕ Annuler la demande"
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {demande.statut !== "EN_ATTENTE" && (
            <div className="adp-detail-section">
              <h4>Traitement</h4>
              <div className="adp-detail-grid">
                <div className="adp-detail-item">
                  <span>Traité le</span>
                  <strong>{formatDate(demande.traite_at)}</strong>
                </div>
                {demande.note_admin && (
                  <div className="adp-detail-item full">
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

// ═══════════════════════════════════════════════════════════
//  PAGE PRINCIPALE
// ═══════════════════════════════════════════════════════════
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
  const nbAttente  = demandes.filter(d => d.statut === "EN_ATTENTE").length;

  return (
    <div className="adp-page">

      <div className="adp-page-header">
        <div>
          <h2>Demandes Partenaires</h2>
          <p>{total} demande{total !== 1 ? "s" : ""} au total</p>
        </div>
        {nbAttente > 0 && (
          <div className="adp-alert-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {nbAttente} en attente
          </div>
        )}
      </div>

      <div className="adp-filters">
        <div className="adp-statut-tabs">
          {STATUTS.map(s => (
            <button key={s.value}
              className={`adp-tab ${statut === s.value ? "active" : ""}`}
              style={statut === s.value ? { borderColor: s.color, color: s.color } : {}}
              onClick={() => { setStatut(s.value); setPage(1); }}>
              {s.label}
            </button>
          ))}
        </div>
        <div className="adp-search-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            placeholder="Rechercher nom, email, entreprise..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="adp-table-wrap">
        {loading ? (
          <div className="adp-loading">
            <div className="adp-spin large" /><p>Chargement...</p>
          </div>
        ) : demandes.length === 0 ? (
          <div className="adp-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
            </svg>
            <p>Aucune demande trouvée</p>
          </div>
        ) : (
          <table className="adp-table">
            <thead>
              <tr>
                <th>#</th><th>Demandeur</th><th>Établissement</th>
                <th>Type</th><th>Date</th><th>Statut</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {demandes.map(d => {
                const typ = TYPES[d.type_partenaire] || TYPES.AUTRE;
                return (
                  <tr key={d.id} onClick={() => setSelected(d)} className="adp-row">
                    <td className="adp-id">#{d.id}</td>
                    <td>
                      <div className="adp-person">
                        <div className="adp-person-avatar">{d.prenom?.[0]}{d.nom?.[0]}</div>
                        <div>
                          <strong>{d.prenom} {d.nom}</strong>
                          <span>{d.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="adp-entreprise">{d.nom_entreprise}</td>
                    <td>
                      <span className="adp-type-chip"
                        style={{ background: `${typ.color}15`, color: typ.color }}>
                        {typ.icon} {typ.label}
                      </span>
                    </td>
                    <td className="adp-date">{formatDate(d.created_at)}</td>
                    <td><StatutBadge statut={d.statut} /></td>
                    <td>
                      <button className="adp-row-btn"
                        onClick={e => { e.stopPropagation(); setSelected(d); }}>
                        {d.statut === "EN_ATTENTE" ? "Traiter" : "Détails"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="adp-pagination">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Préc.</button>
          <span>Page {page} / {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Suiv. →</button>
        </div>
      )}

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