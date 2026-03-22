import { useState } from "react";
import { partenairesApi } from "../../services/api";
import "./InvitationWizard.css";

const TYPE_OPTIONS = ["HOTEL", "AGENCE", "TRANSPORT", "RESTAURATION", "AUTRE"];

// ── Indicateur étapes ─────────────────────────────────────
function StepIndicator({ current }) {
  const steps = [
    { num: 1, label: "Email" },
    { num: 2, label: "Vérification" },
    { num: 3, label: "Profil" },
  ];
  return (
    <div className="iw-steps">
      {steps.map((s, i) => (
        <div key={s.num} className="iw-step-wrap">
          <div className={`iw-step ${current === s.num ? "active" : current > s.num ? "done" : ""}`}>
            {current > s.num ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            ) : s.num}
          </div>
          <span className={`iw-step-label ${current >= s.num ? "active" : ""}`}>{s.label}</span>
          {i < steps.length - 1 && (
            <div className={`iw-step-line ${current > s.num ? "done" : ""}`}/>
          )}
        </div>
      ))}
    </div>
  );
}

export default function InvitationWizard({ onClose, onSuccess }) {
  const [step, setStep]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  // Étape 1
  const [email, setEmail] = useState("");

  // Étape 2
  const [code, setCode]   = useState(["", "", "", "", "", ""]);

  // Étape 3
  const [form, setForm] = useState({
    nom: "", prenom: "", telephone: "",
    nom_entreprise: "", type_partenaire: "HOTEL",
  });

  const handleCodeChange = (val, idx) => {
    const next = [...code];
    next[idx] = val.replace(/\D/, "").slice(-1);
    setCode(next);
    if (val && idx < 5) {
      document.getElementById(`otp-${idx + 1}`)?.focus();
    }
  };

  const handleCodeKey = (e, idx) => {
    if (e.key === "Backspace" && !code[idx] && idx > 0) {
      document.getElementById(`otp-${idx - 1}`)?.focus();
    }
  };

  const handleCodePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(""));
      e.preventDefault();
    }
  };

  // Étape 1 — envoyer OTP
  const handleInvite = async () => {
    if (!email) return;
    setLoading(true); setError("");
    try {
      await partenairesApi.invite(email);
      setStep(2);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  // Étape 2 — vérifier OTP
  const handleVerify = async () => {
    const fullCode = code.join("");
    if (fullCode.length < 6) return;
    setLoading(true); setError("");
    try {
      const res = await partenairesApi.verifyCode(email, fullCode);
      if (!res.valid) { setError(res.message); return; }
      setStep(3);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  // Étape 3 — créer le compte
  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await partenairesApi.create({
        email, code: code.join(""), ...form,
      });
      onSuccess();
      onClose();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleResend = async () => {
    setLoading(true); setError(""); setCode(["","","","","",""]);
    try {
      await partenairesApi.invite(email);
      setError(""); // clear
      alert("Nouveau code envoyé !");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="iw-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="iw-box">
        <div className="iw-topbar"/>

        {/* Header */}
        <div className="iw-header">
          <div className="iw-header-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <line x1="19" y1="8" x2="19" y2="14"/>
              <line x1="22" y1="11" x2="16" y2="11"/>
            </svg>
          </div>
          <div className="iw-header-text">
            <h2>Inviter un partenaire</h2>
            <p>Processus sécurisé en 3 étapes avec vérification par email</p>
          </div>
          <button className="iw-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Indicateur étapes */}
        <div className="iw-steps-wrap">
          <StepIndicator current={step}/>
        </div>

        {/* ══ ÉTAPE 1 — EMAIL ══ */}
        {step === 1 && (
          <div className="iw-content">
            <div className="iw-step-hero">
              <div className="iw-step-hero-icon blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <h3>Saisir l'email du partenaire</h3>
              <p>Un code de vérification à 6 chiffres sera envoyé à cette adresse. Le partenaire devra vous communiquer ce code.</p>
            </div>

            <div className="iw-field">
              <label>Adresse email <span>*</span></label>
              <div className="iw-input-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <input
                  type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="partenaire@exemple.com"
                  onKeyDown={e => e.key === "Enter" && handleInvite()}
                  autoFocus
                />
              </div>
            </div>

            {error && <div className="iw-error"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{error}</div>}

            <div className="iw-actions">
              <button className="iw-btn-cancel" onClick={onClose}>Annuler</button>
              <button className="iw-btn-primary" onClick={handleInvite}
                disabled={loading || !email}>
                {loading ? <span className="iw-spin"/> : (
                  <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  Envoyer le code</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ══ ÉTAPE 2 — CODE OTP ══ */}
        {step === 2 && (
          <div className="iw-content">
            <div className="iw-step-hero">
              <div className="iw-step-hero-icon gold">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <h3>Vérification du code</h3>
              <p>Un code à 6 chiffres a été envoyé à <strong>{email}</strong>. Le partenaire doit vous le communiquer.</p>
            </div>

            <div className="iw-otp-wrap">
              {code.map((c, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  className={`iw-otp-input ${c ? "filled" : ""}`}
                  type="text" inputMode="numeric"
                  maxLength={1} value={c}
                  onChange={e => handleCodeChange(e.target.value, i)}
                  onKeyDown={e => handleCodeKey(e, i)}
                  onPaste={handleCodePaste}
                  autoFocus={i === 0}
                />
              ))}
            </div>

            <div className="iw-otp-info">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              Code valide pendant <strong>15 minutes</strong>
            </div>

            {error && <div className="iw-error"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{error}</div>}

            <div className="iw-actions">
              <button className="iw-btn-ghost" onClick={handleResend} disabled={loading}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="1 4 1 10 7 10"/>
                  <path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
                </svg>
                Renvoyer
              </button>
              <button className="iw-btn-cancel" onClick={() => setStep(1)}>Retour</button>
              <button className="iw-btn-primary" onClick={handleVerify}
                disabled={loading || code.join("").length < 6}>
                {loading ? <span className="iw-spin"/> : (
                  <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                  Vérifier</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ══ ÉTAPE 3 — PROFIL ══ */}
        {step === 3 && (
          <div className="iw-content">
            <div className="iw-step-hero">
              <div className="iw-step-hero-icon green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <h3>Informations du partenaire</h3>
              <p>Complétez le profil. Un email avec le mot de passe temporaire sera envoyé automatiquement.</p>
            </div>

            <form onSubmit={handleCreate} className="iw-form">
              <div className="iw-row">
                <div className="iw-field">
                  <label>Prénom <span>*</span></label>
                  <input className="iw-input" value={form.prenom}
                    onChange={e => setForm(p => ({...p, prenom: e.target.value}))}
                    placeholder="Prénom" required/>
                </div>
                <div className="iw-field">
                  <label>Nom <span>*</span></label>
                  <input className="iw-input" value={form.nom}
                    onChange={e => setForm(p => ({...p, nom: e.target.value}))}
                    placeholder="Nom de famille" required/>
                </div>
              </div>

              <div className="iw-field">
                <label>Email (confirme)</label>
                <div className="iw-input-readonly">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <span>{email}</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#27AE60" strokeWidth="2" className="iw-check">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
              </div>

              <div className="iw-row">
                <div className="iw-field">
                  <label>Téléphone</label>
                  <input className="iw-input" value={form.telephone}
                    onChange={e => setForm(p => ({...p, telephone: e.target.value}))}
                    placeholder="+216 XX XXX XXX"/>
                </div>
                <div className="iw-field">
                  <label>Type <span>*</span></label>
                  <select className="iw-input" value={form.type_partenaire}
                    onChange={e => setForm(p => ({...p, type_partenaire: e.target.value}))}>
                    {TYPE_OPTIONS.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="iw-field">
                <label>Nom de l'entreprise <span>*</span></label>
                <input className="iw-input" value={form.nom_entreprise}
                  onChange={e => setForm(p => ({...p, nom_entreprise: e.target.value}))}
                  placeholder="Ex : Hôtel Carthage Palace" required/>
              </div>

              <div className="iw-email-notice">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <div>
                  <span>Email de bienvenue automatique</span>
                  <p>Le partenaire recevra ses identifiants de connexion à <strong>{email}</strong></p>
                </div>
              </div>

              {error && <div className="iw-error"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{error}</div>}

              <div className="iw-actions">
                <button type="button" className="iw-btn-cancel" onClick={() => setStep(2)}>Retour</button>
                <button type="submit" className="iw-btn-success" disabled={loading}>
                  {loading ? <span className="iw-spin"/> : (
                    <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    Créer le compte</>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}