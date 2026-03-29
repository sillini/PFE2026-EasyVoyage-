import { useState, useEffect } from "react";
import "./ChambreModal.css";

export default function ChambreModal({ chambre, typesChambres, onClose, onSave }) {
  const isEdit = !!chambre;
  const [form, setForm] = useState({
    capacite:        2,
    description:     "",
    id_type_chambre: typesChambres[0]?.id || "",
    nb_chambres:     1,
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (chambre) {
      setForm({
        capacite:        chambre.capacite        || 2,
        description:     chambre.description     || "",
        id_type_chambre: chambre.id_type_chambre || typesChambres[0]?.id || "",
        nb_chambres:     chambre.nb_chambres     || 1,
      });
    }
  }, [chambre]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(p => ({
      ...p,
      [name]: name === "id_type_chambre" ? Number(value) : value,
    }));
  };

  const setCapacite   = val => setForm(p => ({ ...p, capacite:    Math.max(1,   Math.min(20,  val)) }));
  const setNbChambres = val => setForm(p => ({ ...p, nb_chambres: Math.max(1,   Math.min(200, val)) }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await onSave({
        ...form,
        capacite:    Number(form.capacite),
        nb_chambres: Number(form.nb_chambres),
      });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedType = typesChambres.find(t => t.id === Number(form.id_type_chambre));

  return (
    <div className="cm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="cm-box">
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
            <h2>{isEdit ? "Modifier le type de chambre" : "Nouveau type de chambre"}</h2>
            <p>{isEdit ? "Mettre à jour les informations et le stock" : "Définir un type avec son stock total"}</p>
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
              </svg>
              Type de chambre <span className="cm-required">*</span>
            </label>
            <div className="cm-select-wrap">
              <select name="id_type_chambre" value={form.id_type_chambre}
                onChange={handleChange} className="cm-select" required>
                {typesChambres.length === 0
                  ? <option value="">Aucun type disponible</option>
                  : typesChambres.map(t => <option key={t.id} value={t.id}>{t.nom}</option>)
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

          {/* Nombre de chambres (stock) */}
          <div className="cm-field">
            <label className="cm-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
              {isEdit ? "Stock total de chambres" : "Nombre de chambres"} <span className="cm-required">*</span>
            </label>
            <p className="cm-field-hint" style={{ marginBottom: 8 }}>
              {isEdit
                ? "Stock total — la disponibilité se calcule automatiquement selon les réservations"
                : "Combien de chambres de ce type possédez-vous dans cet hôtel ?"
              }
            </p>
            <div className="cm-capacite">
              <button type="button" className="cm-cap-btn"
                onClick={() => setNbChambres(form.nb_chambres - 1)}
                disabled={form.nb_chambres <= 1}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
              <div className="cm-cap-display">
                <span className="cm-cap-num">{form.nb_chambres}</span>
                <span className="cm-cap-unit">chambre{form.nb_chambres > 1 ? "s" : ""}</span>
              </div>
              <button type="button" className="cm-cap-btn"
                onClick={() => setNbChambres(form.nb_chambres + 1)}
                disabled={form.nb_chambres >= 200}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
              {/* Aperçu visuel du stock */}
              <div className="cm-nb-preview">
                {Array.from({ length: Math.min(form.nb_chambres, 10) }).map((_, i) => (
                  <svg key={i} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                    style={{ width: 16, height: 16, color: "#1A3F63" }}>
                    <rect x="2" y="7" width="20" height="14" rx="2"/>
                    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                  </svg>
                ))}
                {form.nb_chambres > 10 && (
                  <span style={{ fontSize: "0.75rem", color: "#8A9BB0", fontWeight: 700 }}>
                    +{form.nb_chambres - 10}
                  </span>
                )}
              </div>
            </div>
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
              Capacité (personnes / chambre) <span className="cm-required">*</span>
            </label>
            <div className="cm-capacite">
              <button type="button" className="cm-cap-btn"
                onClick={() => setCapacite(form.capacite - 1)}
                disabled={form.capacite <= 1}>
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
                disabled={form.capacite >= 20}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
              <div className="cm-cap-icons">
                {Array.from({ length: Math.min(form.capacite, 6) }).map((_, i) => (
                  <svg key={i} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                ))}
                {form.capacite > 6 && <span className="cm-cap-more">+{form.capacite - 6}</span>}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="cm-field">
            <label className="cm-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <line x1="8" y1="6" x2="21" y2="6"/>
                <line x1="8" y1="12" x2="21" y2="12"/>
                <line x1="8" y1="18" x2="21" y2="18"/>
              </svg>
              Description
              <span className="cm-optional">optionnel</span>
            </label>
            <textarea name="description" value={form.description}
              onChange={handleChange} className="cm-textarea" rows={3}
              placeholder="Vue sur mer, balcon, climatisation, coffre-fort..." />
            <p className="cm-field-hint" style={{ textAlign: "right" }}>
              {form.description.length} caractères
            </p>
          </div>

          {/* Récap */}
          <div className="cm-recap">
            <div className="cm-recap-item">
              <span className="cm-recap-label">TYPE</span>
              <span className="cm-recap-val">{selectedType?.nom || "—"}</span>
            </div>
            <div className="cm-recap-item">
              <span className="cm-recap-label">STOCK</span>
              <span className="cm-recap-val">{form.nb_chambres} chambre{form.nb_chambres > 1 ? "s" : ""}</span>
            </div>
            <div className="cm-recap-item">
              <span className="cm-recap-label">CAPACITÉ</span>
              <span className="cm-recap-val">{form.capacite} pers.</span>
            </div>
          </div>

          {error && <p className="cm-error">{error}</p>}

          <div className="cm-actions">
            <button type="button" className="cm-btn-cancel" onClick={onClose} disabled={loading}>
              Annuler
            </button>
            <button type="submit" className="cm-btn-save" disabled={loading}>
              {loading ? <span className="cm-spin" /> : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
              {isEdit
                ? "Enregistrer"
                : `Créer — ${form.nb_chambres} chambre${form.nb_chambres > 1 ? "s" : ""} ${selectedType?.nom || ""}`
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}