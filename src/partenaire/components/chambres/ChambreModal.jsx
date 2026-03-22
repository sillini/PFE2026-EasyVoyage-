import { useState, useEffect } from "react";
import "./ChambreModal.css";

export default function ChambreModal({ chambre, typesChambres, onClose, onSave }) {
  const isEdit = !!chambre;
  const [form, setForm] = useState({
    capacite: 2,
    description: "",
    id_type_chambre: typesChambres[0]?.id || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (chambre) {
      setForm({
        capacite: chambre.capacite || 2,
        description: chambre.description || "",
        id_type_chambre: chambre.id_type_chambre || typesChambres[0]?.id || "",
      });
    }
  }, [chambre]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({
      ...p,
      [name]: name === "id_type_chambre" ? Number(value) : value,
    }));
  };

  const setCapacite = (val) =>
    setForm((p) => ({ ...p, capacite: Math.max(1, Math.min(20, val)) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onSave({ ...form, capacite: Number(form.capacite) });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedType = typesChambres.find((t) => t.id === Number(form.id_type_chambre));

  return (
    <div className="cm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="cm-box">
        {/* Barre décorative top */}
        <div className="cm-top-bar" />

        {/* Header */}
        <div className="cm-header">
          <div className="cm-header-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <div className="cm-header-text">
            <h2>{isEdit ? "Modifier la chambre" : "Nouvelle chambre"}</h2>
            <p>{isEdit ? "Mettre à jour les informations" : "Ajouter une chambre à cet hôtel"}</p>
          </div>
          <button className="cm-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="cm-form">

          {/* Type de chambre */}
          <div className="cm-field">
            <label className="cm-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="2" y="7" width="20" height="14" rx="2"/>
                <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                <line x1="12" y1="12" x2="12" y2="16"/>
                <line x1="10" y1="14" x2="14" y2="14"/>
              </svg>
              Type de chambre <span className="cm-required">*</span>
            </label>
            <div className="cm-select-wrap">
              <select
                name="id_type_chambre"
                value={form.id_type_chambre}
                onChange={handleChange}
                className="cm-select"
                required
              >
                {typesChambres.length === 0
                  ? <option value="">Aucun type disponible</option>
                  : typesChambres.map((t) => (
                      <option key={t.id} value={t.id}>{t.nom}</option>
                    ))
                }
              </select>
              <svg className="cm-select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
            {selectedType?.description && (
              <p className="cm-field-hint">{selectedType.description}</p>
            )}
          </div>

          {/* Capacité */}
          <div className="cm-field">
            <label className="cm-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              Capacité <span className="cm-required">*</span>
            </label>

            <div className="cm-capacite">
              <button type="button" className="cm-cap-btn"
                onClick={() => setCapacite(form.capacite - 1)}
                disabled={form.capacite <= 1}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>

              <div className="cm-cap-display">
                <span className="cm-cap-num">{form.capacite}</span>
                <span className="cm-cap-unit">personne{form.capacite > 1 ? "s" : ""}</span>
              </div>

              <button type="button" className="cm-cap-btn"
                onClick={() => setCapacite(form.capacite + 1)}
                disabled={form.capacite >= 20}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>

              {/* Icônes personnes */}
              <div className="cm-cap-icons">
                {Array.from({ length: Math.min(form.capacite, 6) }).map((_, i) => (
                  <svg key={i} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                ))}
                {form.capacite > 6 && (
                  <span className="cm-cap-more">+{form.capacite - 6}</span>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="cm-field">
            <label className="cm-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <line x1="17" y1="10" x2="3" y2="10"/>
                <line x1="21" y1="6" x2="3" y2="6"/>
                <line x1="21" y1="14" x2="3" y2="14"/>
                <line x1="13" y1="18" x2="3" y2="18"/>
              </svg>
              Description
              <span className="cm-optional">optionnel</span>
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Vue sur mer, balcon, climatisation, coffre-fort..."
              rows={3}
              className="cm-textarea"
            />
            <p className="cm-char-count">{form.description.length} caractères</p>
          </div>

          {/* Récap */}
          {selectedType && (
            <div className="cm-recap">
              <div className="cm-recap-item">
                <span className="cm-recap-label">Type</span>
                <span className="cm-recap-val">{selectedType.nom}</span>
              </div>
              <div className="cm-recap-sep" />
              <div className="cm-recap-item">
                <span className="cm-recap-label">Capacité</span>
                <span className="cm-recap-val">{form.capacite} pers.</span>
              </div>
            </div>
          )}

          {error && (
            <div className="cm-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <div className="cm-actions">
            <button type="button" className="cm-btn-cancel" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="cm-btn-save" disabled={loading}>
              {loading ? (
                <span className="cm-spinner" />
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  {isEdit ? "Enregistrer" : "Créer la chambre"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}