import { useState } from "react";
import "./DemandePartenaireModal.css";

const BASE = "http://localhost:8000/api/v1";

const TYPES = [
  { value: "HOTEL",   label: "Hôtel / Résidence" },
  { value: "AGENCE",  label: "Agence de voyages" },
  { value: "AUTRE",   label: "Autre établissement" },
];

const STEPS = ["Vos informations", "Votre entreprise", "Confirmation"];

const EMPTY = {
  nom: "", prenom: "", email: "", telephone: "",
  nom_entreprise: "", type_partenaire: "HOTEL",
  site_web: "", adresse: "", message: "",
};

export default function DemandePartenaireModal({ onClose }) {
  const [step,    setStep]    = useState(0);
  const [form,    setForm]    = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [success, setSuccess] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Validation par étape
  const canNext0 = form.nom.trim().length >= 2 &&
                   form.prenom.trim().length >= 2 &&
                   /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);

  const canNext1 = form.nom_entreprise.trim().length >= 2 &&
                   form.type_partenaire;

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE}/demandes-partenaire`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          site_web: form.site_web || undefined,
          adresse:  form.adresse  || undefined,
          message:  form.message  || undefined,
          telephone: form.telephone || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Une erreur est survenue");
      setSuccess(true);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dpm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="dpm-modal">

        {/* Header */}
        <div className="dpm-header">
          <div className="dpm-header-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div>
            <h2>Espace Partenaire</h2>
            <p>Rejoignez le réseau EasyVoyage</p>
          </div>
          <button className="dpm-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Stepper */}
        {step < 2 && (
          <div className="dpm-stepper">
            {STEPS.slice(0, 2).map((s, i) => (
              <div key={i} className={`dpm-step ${i === step ? "active" : i < step ? "done" : ""}`}>
                <div className="dpm-step-num">
                  {i < step ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  ) : i + 1}
                </div>
                <span>{s}</span>
              </div>
            ))}
            <div className="dpm-step-line" />
          </div>
        )}

        {/* Contenu */}
        <div className="dpm-body">

          {/* ── ÉTAPE 0 — Infos personnelles ── */}
          {step === 0 && (
            <div className="dpm-step-content">
              <p className="dpm-step-intro">
                Parlez-nous de vous pour que nous puissions personnaliser votre accompagnement.
              </p>
              <div className="dpm-row2">
                <Field label="Prénom *" value={form.prenom}
                  onChange={v => set("prenom", v)} placeholder="Mohamed" />
                <Field label="Nom *" value={form.nom}
                  onChange={v => set("nom", v)} placeholder="Ben Ali" />
              </div>
              <Field label="Email professionnel *" type="email" value={form.email}
                onChange={v => set("email", v)} placeholder="contact@votre-hotel.tn" />
              <Field label="Téléphone" value={form.telephone}
                onChange={v => set("telephone", v)} placeholder="+216 XX XXX XXX" />

              <div className="dpm-footer">
                <button className="dpm-btn-cancel" onClick={onClose}>Annuler</button>
                <button className="dpm-btn-next" disabled={!canNext0}
                  onClick={() => setStep(1)}>
                  Suivant
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* ── ÉTAPE 1 — Infos entreprise ── */}
          {step === 1 && (
            <div className="dpm-step-content">
              <p className="dpm-step-intro">
                Décrivez votre établissement pour qu'il soit correctement référencé sur la plateforme.
              </p>
              <Field label="Nom de l'établissement *" value={form.nom_entreprise}
                onChange={v => set("nom_entreprise", v)} placeholder="Hôtel Méditerranée" />

              <div className="dpm-field">
                <label>Type d'établissement *</label>
                <div className="dpm-type-grid">
                  {TYPES.map(t => (
                    <button key={t.value}
                      className={`dpm-type-btn ${form.type_partenaire === t.value ? "selected" : ""}`}
                      onClick={() => set("type_partenaire", t.value)}>
                      {t.value === "HOTEL"  && <span>🏨</span>}
                      {t.value === "AGENCE" && <span>✈️</span>}
                      {t.value === "AUTRE"  && <span>🏢</span>}
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="dpm-row2">
                <Field label="Site web" value={form.site_web}
                  onChange={v => set("site_web", v)} placeholder="https://www.votre-site.tn" />
                <Field label="Adresse" value={form.adresse}
                  onChange={v => set("adresse", v)} placeholder="Hammamet, Tunisie" />
              </div>

              <div className="dpm-field">
                <label>Message (optionnel)</label>
                <textarea
                  value={form.message}
                  onChange={e => set("message", e.target.value)}
                  placeholder="Présentez brièvement votre établissement, vos services, vos atouts..."
                  rows={3}
                />
              </div>

              {error && <div className="dpm-error">{error}</div>}

              <div className="dpm-footer">
                <button className="dpm-btn-back" onClick={() => { setStep(0); setError(null); }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                  </svg>
                  Retour
                </button>
                <button className="dpm-btn-next" disabled={!canNext1 || loading}
                  onClick={handleSubmit}>
                  {loading ? <span className="dpm-spin" /> : (
                    <>
                      Envoyer ma demande
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="22" y1="2" x2="11" y2="13"/>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ── ÉTAPE 2 — Confirmation ── */}
          {step === 2 && (
            <div className="dpm-success">
              <div className="dpm-success-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <h3>Demande envoyée !</h3>
              <p>
                Merci <strong>{form.prenom}</strong> ! Votre demande a bien été reçue.
                Notre équipe l'examinera dans les plus brefs délais et vous contactera
                à l'adresse <strong>{form.email}</strong>.
              </p>
              <div className="dpm-success-details">
                <div className="dpm-success-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  Traitement sous 24 à 48h ouvrées
                </div>
                <div className="dpm-success-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  Confirmation par email avec vos identifiants
                </div>
              </div>
              <button className="dpm-btn-close-success" onClick={onClose}>
                Fermer
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div className="dpm-field">
      <label>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}