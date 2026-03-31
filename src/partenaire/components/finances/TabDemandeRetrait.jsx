/**
 * src/partenaire/components/finances/TabDemandeRetrait.jsx
 * =========================================================
 * Formulaire demande de retrait.
 */
import { useState } from "react";
import { postDemandeRetrait } from "../../services/financesPartenaireApi.js";

const fmtR = (n) =>
  new Intl.NumberFormat("fr-TN", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n ?? 0);

export default function TabDemandeRetrait({ solde, onSuccess }) {
  const [montant, setMontant] = useState("");
  const [note,    setNote]    = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error,   setError]   = useState(null);

  const handleSubmit = async () => {
    setError(null); setSuccess(null);
    const m = parseFloat(montant);
    if (!m || m <= 0) return setError("Veuillez saisir un montant valide.");
    if (m > solde)    return setError(`Montant supérieur au solde disponible (${fmtR(solde)} DT).`);
    setLoading(true);
    try {
      const res = await postDemandeRetrait(m, note);
      setSuccess(res.message || "Demande envoyée avec succès.");
      setMontant(""); setNote("");
      onSuccess?.();
    } catch (e) {
      setError(e.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pf-card pf-retrait-wrap" style={{ padding: "24px" }}>
      <h3 className="pf-card-title" style={{ marginBottom: 20 }}>Demande de retrait</h3>

      <div className="pf-retrait-solde">
        <span className="pf-retrait-solde-lbl">Solde disponible</span>
        <span className="pf-retrait-solde-val">{fmtR(solde)} DT</span>
      </div>

      {success && <div className="pf-alert-success">✓ {success}</div>}
      {error   && <div className="pf-alert-error">⚠ {error}</div>}

      <div className="pf-field">
        <label>Montant à retirer (DT) *</label>
        <input
          type="number" className="pf-input"
          placeholder={`Max. ${fmtR(solde)} DT`}
          value={montant} min={1} max={solde} step="0.01"
          onChange={(e) => setMontant(e.target.value)}
        />
      </div>

      <div className="pf-field">
        <label>Note (optionnelle)</label>
        <textarea
          className="pf-input" rows={3}
          placeholder="Ex : virement vers RIB TN59 0800…"
          value={note} onChange={(e) => setNote(e.target.value)}
          style={{ resize: "vertical" }}
        />
      </div>

      <div style={{ background: "#FFFBF0", borderLeft: "3px solid #C4973A", padding: "10px 14px", borderRadius: "0 8px 8px 0", fontSize: 12, color: "#7A8FA6", marginBottom: 16 }}>
        Votre demande sera traitée par l'administrateur dans les meilleurs délais.
      </div>

      <button
        className="pf-btn-submit"
        onClick={handleSubmit}
        disabled={loading || !montant || solde <= 0}
      >
        {loading ? "Envoi en cours…" : "Envoyer la demande de retrait"}
      </button>
    </div>
  );
}