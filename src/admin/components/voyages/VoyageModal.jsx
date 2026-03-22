import { useState, useEffect } from "react";
import "./VoyageModal.css";

export default function VoyageModal({ voyage, onClose, onSave }) {
  const isEdit = !!voyage;
  const today  = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    titre: "", description: "", destination: "",
    duree: 1, prix_base: "", date_depart: today,
    date_retour: "", capacite_max: 10, actif: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  useEffect(() => {
    if (voyage) setForm({
      titre:        voyage.titre        || "",
      description:  voyage.description  || "",
      destination:  voyage.destination  || "",
      duree:        voyage.duree        || 1,
      prix_base:    voyage.prix_base    || "",
      date_depart:  voyage.date_depart  || today,
      date_retour:  voyage.date_retour  || "",
      capacite_max: voyage.capacite_max || 10,
      actif:        voyage.actif        ?? true,
    });
  }, [voyage]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(p => ({
      ...p,
      [name]: type === "checkbox" ? checked
            : ["duree","prix_base","capacite_max"].includes(name) ? (value === "" ? "" : Number(value))
            : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      if (!form.date_retour) throw new Error("La date de retour est obligatoire");
      if (form.date_retour <= form.date_depart) throw new Error("La date de retour doit être après la date de départ");
      await onSave({ ...form, prix_base: Number(form.prix_base) });
      onClose();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  // Calcul durée automatique depuis les dates
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...form, [name]: value };
    if (updated.date_depart && updated.date_retour) {
      const diff = Math.round(
        (new Date(updated.date_retour) - new Date(updated.date_depart)) / 86400000
      );
      if (diff > 0) updated.duree = diff;
    }
    setForm(updated);
  };

  return (
    <div className="vm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="vm-box">
        <div className="vm-top-bar" />

        <div className="vm-header">
          <div className="vm-header-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
          </div>
          <div>
            <h2>{isEdit ? "Modifier le voyage" : "Créer un voyage"}</h2>
            <p>{isEdit ? "Mettre à jour les informations" : "Ajouter un nouveau voyage à la plateforme"}</p>
          </div>
          <button className="vm-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="vm-form">

          {/* Titre */}
          <div className="vm-field">
            <label>Titre du voyage <span>*</span></label>
            <input name="titre" value={form.titre} onChange={handleChange}
              placeholder="Ex : Circuit Sahara & Oasis" required className="vm-input" />
          </div>

          {/* Destination */}
          <div className="vm-field">
            <label>Destination <span>*</span></label>
            <input name="destination" value={form.destination} onChange={handleChange}
              placeholder="Ex : Douz, Tunisie" required className="vm-input" />
          </div>

          {/* Dates */}
          <div className="vm-row">
            <div className="vm-field">
              <label>Date de départ <span>*</span></label>
              <input type="date" name="date_depart" value={form.date_depart}
                onChange={handleDateChange} required className="vm-input" />
            </div>
            <div className="vm-field">
              <label>Date de retour <span>*</span></label>
              <input type="date" name="date_retour" value={form.date_retour}
                min={form.date_depart}
                onChange={handleDateChange} required className="vm-input" />
            </div>
          </div>

          {/* Durée + Prix + Capacité */}
          <div className="vm-row three">
            <div className="vm-field">
              <label>Durée (jours)</label>
              <div className="vm-num-wrap">
                <input type="number" name="duree" value={form.duree}
                  onChange={handleChange} min="1" required className="vm-input" />
                <span className="vm-num-unit">jours</span>
              </div>
            </div>
            <div className="vm-field">
              <label>Prix de base <span>*</span></label>
              <div className="vm-num-wrap">
                <input type="number" name="prix_base" value={form.prix_base}
                  onChange={handleChange} min="0" step="0.01" placeholder="0"
                  required className="vm-input" />
                <span className="vm-num-unit">TND</span>
              </div>
            </div>
            <div className="vm-field">
              <label>Capacité max <span>*</span></label>
              <div className="vm-num-wrap">
                <input type="number" name="capacite_max" value={form.capacite_max}
                  onChange={handleChange} min="1" required className="vm-input" />
                <span className="vm-num-unit">pers.</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="vm-field">
            <label>Description</label>
            <textarea name="description" value={form.description} onChange={handleChange}
              placeholder="Décrivez ce voyage, ses points forts, le programme..."
              rows={3} className="vm-input vm-textarea" />
          </div>

          {/* Toggle actif */}
          {isEdit && (
            <div className="vm-toggle-row">
              <div className="vm-toggle-info">
                <span className="vm-toggle-label">Statut du voyage</span>
                <span className="vm-toggle-desc">Un voyage inactif n'est pas visible par les clients</span>
              </div>
              <div className={`vm-toggle ${form.actif ? "on" : ""}`}
                onClick={() => setForm(p => ({...p, actif: !p.actif}))}>
                <div className="vm-toggle-knob" />
              </div>
              <span className={`vm-toggle-status ${form.actif ? "actif" : "inactif"}`}>
                {form.actif ? "Actif" : "Inactif"}
              </span>
            </div>
          )}

          {/* Récap dates */}
          {form.date_depart && form.date_retour && form.date_retour > form.date_depart && (
            <div className="vm-recap">
              <div className="vm-recap-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <div>
                  <span className="vm-recap-label">Période</span>
                  <span className="vm-recap-val">
                    {new Date(form.date_depart).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric"})}
                    <span className="vm-recap-arrow"> → </span>
                    {new Date(form.date_retour).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric"})}
                  </span>
                </div>
              </div>
              <div className="vm-recap-sep" />
              <div className="vm-recap-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                <div>
                  <span className="vm-recap-label">Durée</span>
                  <span className="vm-recap-val">{form.duree} jour{form.duree > 1 ? "s" : ""}</span>
                </div>
              </div>
              <div className="vm-recap-sep" />
              <div className="vm-recap-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <line x1="12" y1="1" x2="12" y2="23"/>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
                <div>
                  <span className="vm-recap-label">Prix/pers.</span>
                  <span className="vm-recap-val" style={{color:"#C4973A"}}>
                    {Number(form.prix_base).toFixed(0)} TND
                  </span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="vm-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <div className="vm-actions">
            <button type="button" className="vm-btn-cancel" onClick={onClose}>Annuler</button>
            <button type="submit" className="vm-btn-save" disabled={loading}>
              {loading ? <span className="vm-spinner" /> : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  {isEdit ? "Enregistrer" : "Créer le voyage"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}