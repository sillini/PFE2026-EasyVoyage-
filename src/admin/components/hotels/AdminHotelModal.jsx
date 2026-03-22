import { useState, useEffect } from "react";
import "./AdminHotelModal.css";

const PAYS_LIST = [
  "Tunisie","France","Espagne","Italie","Maroc","Algérie",
  "Égypte","Turquie","Grèce","Portugal","Allemagne","Royaume-Uni",
  "Émirats Arabes Unis","Thaïlande","Maldives","Autre",
];

export default function AdminHotelModal({ hotel, onClose, onSave }) {
  const isEdit = !!hotel;
  const [form, setForm] = useState({ nom:"", etoiles:3, adresse:"", pays:"Tunisie", description:"", actif:true });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (hotel) setForm({
      nom: hotel.nom || "",
      etoiles: hotel.etoiles || 3,
      adresse: hotel.adresse || "",
      pays: hotel.pays || "Tunisie",
      description: hotel.description || "",
      actif: hotel.actif ?? true,
    });
  }, [hotel]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(p => ({ ...p, [name]: type === "checkbox" ? checked : name === "etoiles" ? Number(value) : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try { await onSave(form); onClose(); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="ahm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="ahm-box">
        <div className="ahm-top-bar" />

        <div className="ahm-header">
          <div className="ahm-header-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <div>
            <h2>{isEdit ? "Modifier l'hôtel" : "Ajouter un hôtel"}</h2>
            <p>{isEdit ? "Mettre à jour les informations" : "Créer un nouvel établissement"}</p>
          </div>
          <button className="ahm-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="ahm-form">

          <div className="ahm-field">
            <label>Nom de l'établissement <span>*</span></label>
            <input name="nom" value={form.nom} onChange={handleChange}
              placeholder="Ex : Hôtel El Mouradi" required className="ahm-input" />
          </div>

          <div className="ahm-row">
            <div className="ahm-field">
              <label>Pays <span>*</span></label>
              <select name="pays" value={form.pays} onChange={handleChange} className="ahm-input">
                {PAYS_LIST.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="ahm-field">
              <label>Classification <span>*</span></label>
              <div className="ahm-stars">
                {[1,2,3,4,5].map(n => (
                  <button key={n} type="button"
                    className={`ahm-star ${form.etoiles >= n ? "active" : ""}`}
                    onClick={() => setForm(p => ({...p, etoiles: n}))}>★</button>
                ))}
                <span>{form.etoiles} étoile{form.etoiles > 1 ? "s" : ""}</span>
              </div>
            </div>
          </div>

          <div className="ahm-field">
            <label>Adresse complète <span>*</span></label>
            <input name="adresse" value={form.adresse} onChange={handleChange}
              placeholder="Ex : Avenue Habib Bourguiba, Tunis, 1000"
              required className="ahm-input" />
          </div>

          <div className="ahm-field">
            <label>Description</label>
            <textarea name="description" value={form.description} onChange={handleChange}
              placeholder="Décrivez l'établissement..." rows={3} className="ahm-input ahm-textarea" />
          </div>

          {isEdit && (
            <div className="ahm-field ahm-toggle-field">
              <label className="ahm-toggle-label">
                <div className={`ahm-toggle ${form.actif ? "on" : ""}`}
                  onClick={() => setForm(p => ({...p, actif: !p.actif}))}>
                  <div className="ahm-toggle-knob" />
                </div>
                <span>Hôtel {form.actif ? "actif" : "inactif"}</span>
              </label>
            </div>
          )}

          {error && (
            <div className="ahm-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <div className="ahm-actions">
            <button type="button" className="ahm-btn-cancel" onClick={onClose}>Annuler</button>
            <button type="submit" className="ahm-btn-save" disabled={loading}>
              {loading ? <span className="ahm-spinner" /> : (
                <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                {isEdit ? "Enregistrer" : "Créer l'hôtel"}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}