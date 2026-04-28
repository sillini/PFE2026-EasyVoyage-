import { useState, useEffect } from "react";
import { hotelsApi } from "../../services/api";
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

  // ── États IA ────────────────────────────────────────────
  const [aiLoading,  setAiLoading]  = useState(false);
  const [aiError,    setAiError]    = useState("");
  const [aiOriginal, setAiOriginal] = useState(null);   // description avant IA (pour "Annuler")

  useEffect(() => {
    if (hotel) {
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
    if (name === "description") setAiError("");
  };

  // ── Génération IA ───────────────────────────────────────
  const handleGenerateAI = async () => {
    setAiError("");

    if (!form.nom.trim()) {
      setAiError("Renseignez d'abord le nom de l'établissement");
      return;
    }
    if (!form.description.trim() || form.description.trim().length < 3) {
      setAiError("Écrivez d'abord quelques mots de description, l'IA se chargera de l'améliorer");
      return;
    }

    setAiLoading(true);
    try {
      const res = await hotelsApi.generateDescriptionAI({
        nom:               form.nom.trim(),
        ville:             form.ville,
        etoiles:           form.etoiles,
        adresse:           form.adresse.trim() || null,
        description_brute: form.description.trim(),
      });

      // Sauvegarder l'originale pour pouvoir annuler
      setAiOriginal(form.description);
      setForm(prev => ({ ...prev, description: res.description_amelioree }));
    } catch (err) {
      setAiError(err.message || "Impossible de générer la description");
    } finally {
      setAiLoading(false);
    }
  };

  const handleRevertAI = () => {
    if (aiOriginal !== null) {
      setForm(prev => ({ ...prev, description: aiOriginal }));
      setAiOriginal(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await onSave({
        nom:         form.nom,
        etoiles:     form.etoiles,
        ville:       form.ville,
        pays:        "Tunisie",
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

          {/* Ville + Pays */}
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

          {/* ──────────────────────────────────────────────
              Description + bouton IA
             ────────────────────────────────────────────── */}
          <div className="field-row">
            <div className="field-group full">
              <div className="desc-label-row">
                <label style={{margin:0}}>Description</label>

                <div className="ai-btn-group">
                  {aiOriginal !== null && !aiLoading && (
                    <button
                      type="button"
                      className="ai-revert-btn"
                      onClick={handleRevertAI}
                      title="Revenir à votre texte original"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                        <polyline points="1 4 1 10 7 10"/>
                        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
                      </svg>
                      Annuler IA
                    </button>
                  )}

                  <button
                    type="button"
                    className={`ai-generate-btn ${aiLoading ? "is-loading" : ""}`}
                    onClick={handleGenerateAI}
                    disabled={aiLoading}
                    title="Laissez Claude IA améliorer votre description"
                  >
                    {aiLoading ? (
                      <>
                        <span className="ai-spinner" />
                        Génération…
                      </>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                             strokeWidth="2" width="13" height="13">
                          <path d="M12 2l2.09 6.26L20 9l-5 4.87L16.18 20 12 16.77 7.82 20 9 13.87 4 9l5.91-.74L12 2z"/>
                        </svg>
                        {aiOriginal !== null ? "Régénérer avec IA" : "Améliorer avec IA"}
                      </>
                    )}
                  </button>
                </div>
              </div>

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Décrivez votre établissement en quelques mots, l'IA se chargera de l'enrichir..."
                rows={aiOriginal !== null ? 6 : 3}
                className={`field-input field-textarea ${aiOriginal !== null ? "ai-improved" : ""}`}
              />

              {/* Badge confirmation IA */}
              {aiOriginal !== null && !aiLoading && (
                <div className="ai-hint-box">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                    <path d="M12 2l2.09 6.26L20 9l-5 4.87L16.18 20 12 16.77 7.82 20 9 13.87 4 9l5.91-.74L12 2z"/>
                  </svg>
                  <span>
                    <strong>Description améliorée par l'IA.</strong>{" "}
                    Vous pouvez la modifier librement avant d'enregistrer.
                  </span>
                </div>
              )}

              {/* Erreur IA */}
              {aiError && (
                <div className="ai-error-box">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {aiError}
                </div>
              )}
            </div>
          </div>

          {/* Erreur globale */}
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
            <button type="submit" className="btn-save" disabled={loading || aiLoading}>
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