import { useState, useEffect } from "react";
import "./HotelModal.css";

const VILLES_TUNISIE = [
  "Tunis","Sfax","Sousse","Kairouan","Bizerte","Gabès",
  "Ariana","Gafsa","Monastir","Ben Arous","Kasserine","Médenine",
  "Nabeul","Tataouine","Béja","Jendouba","Mahdia","Siliana",
  "Zaghouan","Tozeur","Kébili","Le Kef","Sidi Bouzid","Hammamet",
  "Djerba","Tabarka","Zarzis","El Jadida","Douz","Nefta",
].sort();

export default function HotelModal({ hotel, onClose, onSave }) {
  const isEdit = !!hotel;
  const [form, setForm] = useState({
    nom: "", etoiles: 3, ville: "Tunis", adresse: "", description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  useEffect(() => {
    if (hotel) {
      // Détecter la ville depuis le champ ville (nouveau) ou pays/adresse (anciens)
      const villeDetectee = hotel.ville
        || VILLES_TUNISIE.find(v => hotel.pays?.includes(v) || hotel.adresse?.includes(v))
        || "Tunis";
      setForm({
        nom:         hotel.nom         || "",
        etoiles:     hotel.etoiles     || 3,
        ville:       villeDetectee,
        adresse:     hotel.adresse     || "",
        description: hotel.description || "",
      });
    }
  }, [hotel]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: name === "etoiles" ? Number(value) : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await onSave({
        nom:         form.nom,
        etoiles:     form.etoiles,
        ville:       form.ville,
        pays:        "Tunisie",          // toujours Tunisie
        adresse:     form.adresse,
        description: form.description,
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
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-left">
            <div className="modal-icon">🏨</div>
            <div>
              <h2 className="modal-title">{isEdit ? "Modifier l'hôtel" : "Ajouter un hôtel"}</h2>
              <p className="modal-subtitle">{isEdit ? "Mettre à jour les informations" : "Remplissez les informations"}</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">

          {/* Nom */}
          <div className="field-row">
            <div className="field-group full">
              <label>Nom de l'établissement <span className="required">*</span></label>
              <input name="nom" value={form.nom} onChange={handleChange}
                placeholder="Ex : Hôtel Carthage Palace" required className="field-input"/>
            </div>
          </div>

          {/* Ville + Étoiles */}
          <div className="field-row two-cols">
            <div className="field-group">
              <label>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                  style={{width:13,height:13,marginRight:5,verticalAlign:"middle",color:"#C4973A"}}>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                Ville <span className="required">*</span>
              </label>
              <select name="ville" value={form.ville} onChange={handleChange} className="field-input">
                {VILLES_TUNISIE.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div className="field-group">
              {/* Pays affiché en lecture seule */}
              <label>Pays</label>
              <div className="field-pays-readonly">
                <span>🇹🇳</span>
                <span>Tunisie</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="#27AE60" strokeWidth="2.5"
                  style={{width:14,height:14,marginLeft:"auto"}}>
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Classification */}
          <div className="field-row">
            <div className="field-group full">
              <label>Classification <span className="required">*</span></label>
              <div className="stars-select">
                {[1,2,3,4,5].map(n => (
                  <button key={n} type="button"
                    className={`star-btn ${form.etoiles >= n ? "active" : ""}`}
                    onClick={() => setForm(p => ({ ...p, etoiles: n }))}>★</button>
                ))}
                <span className="stars-label">{form.etoiles} étoile{form.etoiles > 1 ? "s" : ""}</span>
              </div>
            </div>
          </div>

          {/* Adresse */}
          <div className="field-row">
            <div className="field-group full">
              <label>Adresse complète <span className="required">*</span></label>
              <input name="adresse" value={form.adresse} onChange={handleChange}
                placeholder={`Ex : Avenue Habib Bourguiba, ${form.ville}`}
                required className="field-input"/>
            </div>
          </div>

          {/* Description */}
          <div className="field-row">
            <div className="field-group full">
              <label>Description</label>
              <textarea name="description" value={form.description} onChange={handleChange}
                placeholder="Décrivez votre établissement..." rows={3} className="field-input field-textarea"/>
            </div>
          </div>

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

          {/* Actions */}
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? <span className="btn-spinner"/> : (
                <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/></svg>
                  Enregistrer</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}