/**
 * PayModal — modale de confirmation de paiement partenaire.
 *
 * @prop {object}   partenaire   — { partenaire_nom, partenaire_prenom, solde_du, nb_commissions, id_partenaire }
 * @prop {string}   note         — texte de la note
 * @prop {boolean}  loading      — état de chargement
 * @prop {Function} onNoteChange — (value: string) => void
 * @prop {Function} onConfirm    — () => void
 * @prop {Function} onClose      — () => void
 */
import { fmt } from "../../../services/formatters.js";

export default function PayModal({ partenaire, note, loading, onNoteChange, onConfirm, onClose }) {
  if (!partenaire) return null;
  return (
    <div className="af2-modal-overlay" onClick={onClose}>
      <div className="af2-modal" onClick={(e) => e.stopPropagation()}>
        <div className="af2-modal-head">
          <h3>💸 Payer {partenaire.partenaire_prenom} {partenaire.partenaire_nom}</h3>
          <button onClick={onClose}>✕</button>
        </div>
        <div className="af2-modal-body">
          <div className="af2-modal-amount">
            <span>Montant à payer</span>
            <strong>{fmt(partenaire.solde_du ?? partenaire.solde_restant)} DT</strong>
          </div>
          <p className="af2-modal-warn">
            ⚠️ Cette action marquera <b>{partenaire.nb_commissions} commission(s)</b> comme payées.
          </p>
          <textarea
            className="af2-textarea"
            placeholder="Note optionnelle…"
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            rows={2}
          />
        </div>
        <div className="af2-modal-foot">
          <button className="af2-btn-cancel" onClick={onClose}>Annuler</button>
          <button className="af2-btn-confirm" onClick={onConfirm} disabled={loading}>
            {loading
              ? <span className="af2-spin" />
              : `✓ Confirmer ${fmt(partenaire.solde_du ?? partenaire.solde_restant)} DT`}
          </button>
        </div>
      </div>
    </div>
  );
}