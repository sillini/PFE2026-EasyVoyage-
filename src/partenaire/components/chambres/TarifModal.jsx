import { useState, useEffect } from "react";
import "../hotels/HotelModal.css";

export default function TarifModal({ tarif, typesReservation, onClose, onSave }) {
  const isEdit = !!tarif;
  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    prix: "",
    date_debut: today,
    date_fin: "",
    id_type_reservation: typesReservation[0]?.id || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (tarif) {
      setForm({
        prix: tarif.prix || "",
        date_debut: tarif.date_debut || today,
        date_fin: tarif.date_fin || "",
        id_type_reservation: tarif.id_type_reservation || typesReservation[0]?.id || "",
      });
    }
  }, [tarif]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({
      ...p,
      [name]: name === "prix" || name === "id_type_reservation"
        ? (value === "" ? "" : Number(value)) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.date_fin)                    { setError("La date de fin est obligatoire"); return; }
    if (form.date_fin < form.date_debut)   { setError("La date de fin doit être après la date de début"); return; }
    if (!form.prix || Number(form.prix) <= 0) { setError("Le prix doit être supérieur à 0"); return; }
    setLoading(true);
    try {
      await onSave({
        prix: Number(form.prix),
        date_debut: form.date_debut,
        date_fin: form.date_fin,
        id_type_reservation: Number(form.id_type_reservation),
      });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <div className="modal-header-left">
            <div className="modal-icon">💰</div>
            <div>
              <h2 className="modal-title">{isEdit ? "Modifier le tarif" : "Ajouter un tarif"}</h2>
              <p className="modal-subtitle">{isEdit ? "Modifier la période ou le prix" : "Nouvelle période tarifaire"}</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Type réservation */}
          <div className="field-group full">
            <label>Type de réservation <span className="required">*</span></label>
            <select name="id_type_reservation" value={form.id_type_reservation}
              onChange={handleChange} className="field-input" required>
              {typesReservation.length === 0
                ? <option value="">Aucun type disponible</option>
                : typesReservation.map((t) => <option key={t.id} value={t.id}>{t.nom}</option>)
              }
            </select>
          </div>

          {/* Prix */}
          <div className="field-group full">
            <label>Prix par nuit (TND) <span className="required">*</span></label>
            <div style={{ position: "relative" }}>
              <input type="number" name="prix" value={form.prix} onChange={handleChange}
                placeholder="150" min="0" step="0.01" required className="field-input"
                style={{ paddingRight: "90px" }}
              />
              <span style={{
                position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)",
                fontFamily: "'Lato', sans-serif", fontSize: "0.82rem",
                fontWeight: 600, color: "#C4973A", pointerEvents: "none",
              }}>TND / nuit</span>
            </div>
          </div>

          {/* Période */}
          <div className="two-cols">
            <div className="field-group">
              <label>Date de début <span className="required">*</span></label>
              <input type="date" name="date_debut" value={form.date_debut}
                onChange={handleChange} required className="field-input" />
            </div>
            <div className="field-group">
              <label>Date de fin <span className="required">*</span></label>
              <input type="date" name="date_fin" value={form.date_fin}
                onChange={handleChange} min={form.date_debut} required className="field-input" />
            </div>
          </div>

          {/* Aperçu simple — juste les infos utiles */}
          {form.prix && form.date_debut && form.date_fin && (
            <div style={{
              padding: "14px 18px",
              background: "linear-gradient(135deg, rgba(43,95,142,0.05), rgba(196,151,58,0.05))",
              border: "1px solid rgba(196,151,58,0.2)", borderRadius: "12px",
              display: "flex", alignItems: "center", gap: "16px",
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#C4973A" strokeWidth="1.8" style={{ width: 20, height: 20, flexShrink: 0 }}>
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <div>
                <div style={{ fontFamily: "'Lato', sans-serif", fontSize: "0.78rem", color: "#8A9BB0", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>
                  Période tarifaire
                </div>
                <div style={{ fontFamily: "'Lato', sans-serif", fontSize: "0.92rem", color: "#1C2E42", fontWeight: 600 }}>
                  {new Date(form.date_debut).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
                  <span style={{ color: "#C4973A", margin: "0 8px" }}>→</span>
                  {new Date(form.date_fin).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
                </div>
              </div>
              <div style={{ marginLeft: "auto", textAlign: "right" }}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.4rem", fontWeight: 700, color: "#1A3F63", lineHeight: 1 }}>
                  {Number(form.prix).toFixed(0)}
                </div>
                <div style={{ fontFamily: "'Lato', sans-serif", fontSize: "0.72rem", color: "#8A9BB0" }}>TND/nuit</div>
              </div>
            </div>
          )}

          {error && (
            <div className="modal-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? <span className="btn-spinner" /> : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  {isEdit ? "Enregistrer" : "Créer le tarif"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}