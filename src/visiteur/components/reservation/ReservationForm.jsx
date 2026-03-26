import { useState } from "react";
import "./ReservationForm.css";

export default function ReservationForm({ item, isClient, user, onClose, onNeedAuth }) {
  const [form, setForm] = useState({
    nom:       user?.nom     || "",
    prenom:    user?.prenom  || "",
    email:     user?.email   || "",
    telephone: user?.telephone || "",
    adultes:   2,
    enfants:   0,
    chambres:  1,
    message:   "",
  });
  const [step,    setStep]    = useState(1); // 1=infos, 2=confirmation
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const titre = item?.nom || item?.titre || "Cet établissement";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step === 1) { setStep(2); return; }
    setLoading(true);
    // Simulation envoi — à connecter avec l'API réservation
    await new Promise(r => setTimeout(r, 1200));
    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="rf-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
        <div className="rf-modal">
          <div className="rf-success">
            <div className="rf-success-icon">✅</div>
            <h2>Demande envoyée !</h2>
            <p>Votre demande de réservation pour <strong>{titre}</strong> a bien été reçue. Vous recevrez une confirmation par email.</p>
            {!isClient && (
              <div className="rf-create-account">
                <p>Créez un compte pour suivre vos réservations facilement</p>
                <button className="rf-btn-account" onClick={()=>{onClose();onNeedAuth();}}>
                  Créer mon compte gratuit
                </button>
              </div>
            )}
            <button className="rf-btn-close" onClick={onClose}>Fermer</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rf-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="rf-modal">
        {/* Header */}
        <div className="rf-header">
          <div>
            <h2 className="rf-title">Réserver</h2>
            <p className="rf-subtitle">{titre}</p>
          </div>
          <button className="rf-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Steps */}
        <div className="rf-steps">
          <div className={`rf-step ${step>=1?"on":""}`}>
            <span>1</span>Vos informations
          </div>
          <div className="rf-step-line"/>
          <div className={`rf-step ${step>=2?"on":""}`}>
            <span>2</span>Confirmation
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rf-body">
          {step === 1 && (
            <>
              {/* Infos personnelles — pré-remplies si client */}
              {isClient && (
                <div className="rf-client-notice">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Connecté en tant que <strong>{user.prenom} {user.nom}</strong> — vos informations sont pré-remplies
                </div>
              )}

              <div className="rf-row">
                <div className="rf-field">
                  <label>Prénom *</label>
                  <input value={form.prenom} onChange={e=>setForm({...form,prenom:e.target.value})} required/>
                </div>
                <div className="rf-field">
                  <label>Nom *</label>
                  <input value={form.nom} onChange={e=>setForm({...form,nom:e.target.value})} required/>
                </div>
              </div>
              <div className="rf-row">
                <div className="rf-field">
                  <label>Email *</label>
                  <input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/>
                </div>
                <div className="rf-field">
                  <label>Téléphone *</label>
                  <input value={form.telephone} onChange={e=>setForm({...form,telephone:e.target.value})} placeholder="+216 XX XXX XXX" required/>
                </div>
              </div>

              <div className="rf-divider">Occupation</div>
              <div className="rf-row rf-row-3">
                {[
                  { lbl:"Chambres", key:"chambres", min:1 },
                  { lbl:"Adultes",  key:"adultes",  min:1 },
                  { lbl:"Enfants",  key:"enfants",  min:0 },
                ].map(f=>(
                  <div key={f.key} className="rf-field">
                    <label>{f.lbl}</label>
                    <div className="rf-counter">
                      <button type="button" onClick={()=>setForm({...form,[f.key]:Math.max(f.min,form[f.key]-1)})}>−</button>
                      <span>{form[f.key]}</span>
                      <button type="button" onClick={()=>setForm({...form,[f.key]:form[f.key]+1})}>+</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rf-field">
                <label>Message (optionnel)</label>
                <textarea value={form.message} onChange={e=>setForm({...form,message:e.target.value})}
                  rows={3} placeholder="Demandes spéciales, préférences..."/>
              </div>

              {!isClient && (
                <div className="rf-auth-suggest">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <span>
                    <strong>Conseil :</strong> Créez un compte pour suivre vos réservations.
                    <button type="button" onClick={()=>{onClose();onNeedAuth();}}>S'inscrire gratuitement →</button>
                  </span>
                </div>
              )}
            </>
          )}

          {step === 2 && (
            <div className="rf-confirm">
              <h3>Récapitulatif de votre demande</h3>
              <div className="rf-recap">
                <div className="rf-recap-item"><span>Nom</span><strong>{form.prenom} {form.nom}</strong></div>
                <div className="rf-recap-item"><span>Email</span><strong>{form.email}</strong></div>
                <div className="rf-recap-item"><span>Téléphone</span><strong>{form.telephone}</strong></div>
                <div className="rf-recap-item"><span>Chambres</span><strong>{form.chambres}</strong></div>
                <div className="rf-recap-item"><span>Adultes</span><strong>{form.adultes}</strong></div>
                <div className="rf-recap-item"><span>Enfants</span><strong>{form.enfants}</strong></div>
                {form.message && <div className="rf-recap-item"><span>Message</span><strong>{form.message}</strong></div>}
              </div>
              <p className="rf-confirm-note">Un conseiller vous contactera pour finaliser la réservation.</p>
            </div>
          )}

          <div className="rf-footer">
            {step === 2 && (
              <button type="button" className="rf-btn-back" onClick={()=>setStep(1)}>← Retour</button>
            )}
            <button type="submit" className="rf-btn-submit" disabled={loading}>
              {loading ? <span className="rf-spin"/> : step===1 ? "Continuer →" : "Envoyer ma demande"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}