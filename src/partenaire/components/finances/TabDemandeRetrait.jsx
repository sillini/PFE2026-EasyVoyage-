/**
 * src/partenaire/components/finances/TabDemandeRetrait.jsx
 * =========================================================
 * Onglet Demandes de retrait — partenaire.
 *
 * Deux sections :
 *   1. Formulaire pour soumettre une nouvelle demande
 *   2. Historique de toutes ses demandes (EN_ATTENTE / APPROUVEE / REFUSEE)
 */
import { useState, useEffect, useCallback } from "react";
import { postDemandeRetrait, fetchMesDemandes } from "../../services/financesPartenaireApi.js";

const fmt = (n) =>
  new Intl.NumberFormat("fr-TN", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n ?? 0);

const fmtDT = (d) =>
  d
    ? new Date(d).toLocaleDateString("fr-TN", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

// ── Badge statut ──────────────────────────────────────────────
function BadgeStatut({ statut }) {
  const map = {
    EN_ATTENTE: { label: "En attente",  bg: "#FFF3CD", color: "#856404" },
    APPROUVEE:  { label: "Approuvée",   bg: "#D4EDDA", color: "#155724" },
    REFUSEE:    { label: "Refusée",     bg: "#FEE2E2", color: "#991B1B" },
  };
  const s = map[statut] || { label: statut, bg: "#EEE", color: "#333" };
  return (
    <span style={{
      display: "inline-block", padding: "3px 10px", borderRadius: 99,
      fontSize: 11, fontWeight: 700, background: s.bg, color: s.color,
    }}>
      {s.label}
    </span>
  );
}

// ── Historique des demandes ───────────────────────────────────
const PER = 10;

function HistoriqueDemandes({ refreshKey }) {
  const [items,   setItems]   = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await fetchMesDemandes(page, PER);
      setItems(d.items || []);
      setTotal(d.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page]);

  // recharge quand une nouvelle demande est soumise (refreshKey change)
  useEffect(() => { load(); }, [load, refreshKey]);

  const totalPages = Math.ceil(total / PER);

  return (
    <div className="pf-card" style={{ marginTop: 20 }}>
      <div className="pf-card-header">
        <h3 className="pf-card-title">Historique de mes demandes</h3>
        {total > 0 && (
          <span style={{ fontSize: 13, color: "#7A8FA6" }}>{total} demande(s)</span>
        )}
      </div>

      {loading ? (
        <div className="pf-spinner"><div className="pf-spin" /></div>
      ) : items.length === 0 ? (
        <div className="pf-empty" style={{ padding: 32 }}>
          Aucune demande de retrait pour le moment.
        </div>
      ) : (
        <>
          <div className="pf-table-wrap">
            <table className="pf-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th style={{ textAlign: "right" }}>Montant</th>
                  <th>Note</th>
                  <th>Statut</th>
                  <th>Réponse admin</th>
                </tr>
              </thead>
              <tbody>
                {items.map((d, i) => (
                  <tr key={d.id}>
                    <td style={{ color: "#7A8FA6", fontSize: 12 }}>
                      {(page - 1) * PER + i + 1}
                    </td>
                    <td style={{ fontSize: 13 }}>{fmtDT(d.created_at)}</td>
                    <td style={{ textAlign: "right" }}>
                      <span className="pf-amt">{fmt(d.montant)} DT</span>
                    </td>
                    <td style={{ fontSize: 12, color: "#7A8FA6", maxWidth: 180 }}>
                      {d.note || <span style={{ fontStyle: "italic" }}>—</span>}
                    </td>
                    <td><BadgeStatut statut={d.statut} /></td>
                    <td style={{ fontSize: 12, color: "#7A8FA6", maxWidth: 220 }}>
                      {d.statut === "REFUSEE" && d.note_admin ? (
                        <span style={{ color: "#991B1B" }}>⚠ {d.note_admin}</span>
                      ) : d.statut === "APPROUVEE" ? (
                        <span style={{ color: "#155724" }}>✓ Paiement effectué</span>
                      ) : (
                        <span style={{ fontStyle: "italic" }}>En cours de traitement…</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pf-pagination">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)}>‹ Précédent</button>
              <span>Page {page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Suivant ›</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Formulaire nouvelle demande ───────────────────────────────
export default function TabDemandeRetrait({ solde, onSuccess }) {
  const [montant,    setMontant]    = useState("");
  const [note,       setNote]       = useState("");
  const [loading,    setLoading]    = useState(false);
  const [success,    setSuccess]    = useState(null);
  const [error,      setError]      = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);
    const m = parseFloat(montant);
    if (!m || m <= 0)  return setError("Veuillez saisir un montant valide.");
    if (m > solde)     return setError(`Montant supérieur au solde disponible (${fmt(solde)} DT).`);

    setLoading(true);
    try {
      const res = await postDemandeRetrait(m, note);
      if (res.success === false) {
        setError(res.message || "Demande refusée par le serveur.");
      } else {
        setSuccess(res.message || "Demande envoyée avec succès.");
        setMontant("");
        setNote("");
        setRefreshKey((k) => k + 1); // recharge l'historique
        onSuccess?.();               // recharge le dashboard (solde)
      }
    } catch (e) {
      setError(e.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ── Formulaire ── */}
      <div className="pf-card pf-retrait-wrap" style={{ padding: 24 }}>
        <h3 className="pf-card-title" style={{ marginBottom: 20 }}>
          Nouvelle demande de retrait
        </h3>

        {/* Solde dispo */}
        <div className="pf-retrait-solde">
          <span className="pf-retrait-solde-lbl">Solde disponible</span>
          <span className="pf-retrait-solde-val">{fmt(solde)} DT</span>
        </div>

        {solde <= 0 && (
          <div className="pf-alert-info" style={{ marginBottom: 16 }}>
            ℹ Votre solde disponible est de 0 DT. Aucune demande ne peut être soumise.
          </div>
        )}

        {success && (
          <div className="pf-alert-success" style={{ marginBottom: 16 }}>✓ {success}</div>
        )}
        {error && (
          <div className="pf-alert-error" style={{ marginBottom: 16 }}>⚠ {error}</div>
        )}

        <div className="pf-field">
          <label>Montant à retirer (DT) *</label>
          <input
            type="number"
            className="pf-input"
            placeholder={`Max. ${fmt(solde)} DT`}
            value={montant}
            min={1}
            max={solde}
            step="0.01"
            onChange={(e) => setMontant(e.target.value)}
            disabled={solde <= 0}
          />
        </div>

        <div className="pf-field">
          <label>Note (optionnelle)</label>
          <textarea
            className="pf-input"
            rows={3}
            placeholder="Ex : virement vers RIB TN59 0800…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            style={{ resize: "vertical" }}
            disabled={solde <= 0}
          />
        </div>

        <div style={{
          background: "#FFFBF0", borderLeft: "3px solid #C4973A",
          padding: "10px 14px", borderRadius: "0 8px 8px 0",
          fontSize: 12, color: "#7A8FA6", marginBottom: 20,
        }}>
          Votre demande sera examinée par l'administrateur. Vous serez notifié du résultat
          dans cet historique (approuvée ou refusée).
        </div>

        <button
          className="pf-btn-submit"
          onClick={handleSubmit}
          disabled={loading || !montant || solde <= 0}
        >
          {loading ? "Envoi en cours…" : "Envoyer la demande de retrait"}
        </button>
      </div>

      {/* ── Historique ── */}
      <HistoriqueDemandes refreshKey={refreshKey} />
    </>
  );
}