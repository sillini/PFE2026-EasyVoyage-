/**
 * src/admin/components/admins/AdminInvitationWizard.jsx
 * ════════════════════════════════════════════════════════════
 * Wizard d'invitation d'un nouvel administrateur — 3 étapes
 *
 *   1. Saisir email du futur admin → envoie OTP
 *   2. Saisir le code OTP reçu → vérification
 *   3. Compléter le profil (nom/prénom/téléphone) → création
 *
 * Reproduit fidèlement le flux InvitationWizard.jsx des partenaires,
 * mais SANS les champs entreprise / type partenaire.
 *
 * Réservé aux Super Admins (déjà filtré côté backend ET sidebar).
 * ════════════════════════════════════════════════════════════
 */
import { useState } from "react";
import { adminsApi } from "../../services/api";
import "./AdminInvitationWizard.css";

// ══════════════════════════════════════════════════════════
//  Indicateur d'étapes
// ══════════════════════════════════════════════════════════
function StepIndicator({ current }) {
  const steps = [
    { num: 1, label: "Email" },
    { num: 2, label: "Code" },
    { num: 3, label: "Profil" },
  ];
  return (
    <div className="aiw-steps">
      {steps.map((s, i) => (
        <div key={s.num} className="aiw-step-wrap">
          <div className={`aiw-step-circle ${
            current === s.num ? "active" : current > s.num ? "done" : ""
          }`}>
            {current > s.num ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            ) : s.num}
          </div>
          <span className={`aiw-step-label ${current >= s.num ? "active" : ""}`}>
            {s.label}
          </span>
          {i < steps.length - 1 && (
            <div className={`aiw-step-line ${current > s.num ? "done" : ""}`}/>
          )}
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  COMPONENT PRINCIPAL
// ══════════════════════════════════════════════════════════
export default function AdminInvitationWizard({ onClose, onSuccess }) {
  const [step,    setStep]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  // Étape 1
  const [email, setEmail] = useState("");

  // Étape 2
  const [code, setCode] = useState(["", "", "", "", "", ""]);

  // Étape 3
  const [form, setForm] = useState({
    nom:       "",
    prenom:    "",
    telephone: "",
  });

  // ── Handlers OTP ─────────────────────────────────────────
  const handleCodeChange = (val, idx) => {
    const next = [...code];
    next[idx] = val.replace(/\D/, "").slice(-1);
    setCode(next);
    if (val && idx < 5) document.getElementById(`aiw-otp-${idx + 1}`)?.focus();
  };

  const handleCodeKey = (e, idx) => {
    if (e.key === "Backspace" && !code[idx] && idx > 0) {
      document.getElementById(`aiw-otp-${idx - 1}`)?.focus();
    }
  };

  const handleCodePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(""));
      e.preventDefault();
    }
  };

  // ── Étape 1 : envoyer OTP ─────────────────────────────────
  const handleInvite = async () => {
    if (!email) return;
    setLoading(true); setError("");
    try {
      await adminsApi.invite(email);
      setStep(2);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  // ── Étape 2 : vérifier OTP ────────────────────────────────
  const handleVerify = async () => {
    const fullCode = code.join("");
    if (fullCode.length < 6) return;
    setLoading(true); setError("");
    try {
      const res = await adminsApi.verifyCode(email, fullCode);
      if (!res.valid) { setError(res.message); return; }
      setStep(3);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  // ── Étape 3 : créer le compte ─────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await adminsApi.create({
        email,
        code: code.join(""),
        ...form,
      });
      onSuccess?.();
      onClose();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  // ── Renvoyer le code ──────────────────────────────────────
  const handleResend = async () => {
    setLoading(true); setError(""); setCode(["","","","","",""]);
    try {
      await adminsApi.invite(email);
      // Pas d'alert — le toast/feedback peut être ajouté plus tard
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="aiw-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="aiw-box">
        <div className="aiw-topbar"/>

        {/* ── Header ─────────────────────────────────────── */}
        <div className="aiw-header">
          <div className="aiw-header-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div className="aiw-header-text">
            <h2>Inviter un administrateur</h2>
            <p>Création sécurisée en 3 étapes avec vérification par email</p>
          </div>
          <button className="aiw-close" onClick={onClose} aria-label="Fermer">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Steps indicator */}
        <div className="aiw-steps-wrap">
          <StepIndicator current={step}/>
        </div>

        {/* ══ ÉTAPE 1 — EMAIL ══════════════════════════════ */}
        {step === 1 && (
          <div className="aiw-content">
            <div className="aiw-step-hero">
              <div className="aiw-step-hero-icon blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <h3>Saisir l'email du futur administrateur</h3>
              <p>Un code de vérification à 6 chiffres lui sera envoyé par email.</p>
            </div>

            <div className="aiw-field">
              <label>Adresse email <span>*</span></label>
              <div className="aiw-input-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@easyvoyage.tn"
                  onKeyDown={e => e.key === "Enter" && handleInvite()}
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <div className="aiw-error">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            <div className="aiw-actions">
              <button className="aiw-btn-cancel" onClick={onClose}>Annuler</button>
              <button
                className="aiw-btn-primary"
                onClick={handleInvite}
                disabled={loading || !email}
              >
                {loading ? <span className="aiw-spin"/> : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="22" y1="2" x2="11" y2="13"/>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                    Envoyer le code
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ══ ÉTAPE 2 — CODE OTP ═══════════════════════════ */}
        {step === 2 && (
          <div className="aiw-content">
            <div className="aiw-step-hero">
              <div className="aiw-step-hero-icon gold">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <h3>Vérification du code</h3>
              <p>Un code à 6 chiffres a été envoyé à <strong>{email}</strong>.<br/>
              L'administrateur doit vous le communiquer.</p>
            </div>

            <div className="aiw-otp-wrap">
              {code.map((c, i) => (
                <input
                  key={i}
                  id={`aiw-otp-${i}`}
                  className={`aiw-otp-input ${c ? "filled" : ""}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={c}
                  onChange={e => handleCodeChange(e.target.value, i)}
                  onKeyDown={e => handleCodeKey(e, i)}
                  onPaste={handleCodePaste}
                  autoFocus={i === 0}
                />
              ))}
            </div>

            <div className="aiw-otp-info">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              Code valide pendant <strong>15 minutes</strong>
            </div>

            {error && (
              <div className="aiw-error">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            <div className="aiw-actions">
              <button className="aiw-btn-ghost" onClick={handleResend} disabled={loading}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="1 4 1 10 7 10"/>
                  <path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
                </svg>
                Renvoyer
              </button>
              <button className="aiw-btn-cancel" onClick={() => setStep(1)}>Retour</button>
              <button
                className="aiw-btn-primary"
                onClick={handleVerify}
                disabled={loading || code.join("").length < 6}
              >
                {loading ? <span className="aiw-spin"/> : (
                  <>
                    Vérifier
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ══ ÉTAPE 3 — PROFIL ═══════════════════════════════ */}
        {step === 3 && (
          <form className="aiw-content" onSubmit={handleCreate}>
            <div className="aiw-step-hero">
              <div className="aiw-step-hero-icon green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <h3>Compléter le profil</h3>
              <p>Le mot de passe sera généré automatiquement et envoyé à <strong>{email}</strong>.</p>
            </div>

            <div className="aiw-form-grid">
              <div className="aiw-field">
                <label>Prénom <span>*</span></label>
                <input
                  type="text"
                  value={form.prenom}
                  onChange={e => setForm({ ...form, prenom: e.target.value })}
                  placeholder="Ex: Jean"
                  required
                />
              </div>
              <div className="aiw-field">
                <label>Nom <span>*</span></label>
                <input
                  type="text"
                  value={form.nom}
                  onChange={e => setForm({ ...form, nom: e.target.value })}
                  placeholder="Ex: Dupont"
                  required
                />
              </div>
              <div className="aiw-field aiw-field-full">
                <label>Téléphone</label>
                <input
                  type="tel"
                  value={form.telephone}
                  onChange={e => setForm({ ...form, telephone: e.target.value })}
                  placeholder="+216 XX XXX XXX"
                />
              </div>
            </div>

            <div className="aiw-info-card">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              <div>
                <strong>Compte administrateur standard</strong>
                <p>Le nouvel admin pourra accéder aux mêmes fonctionnalités que vous, sauf la gestion des autres administrateurs (réservée aux Super Admins).</p>
              </div>
            </div>

            {error && (
              <div className="aiw-error">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            <div className="aiw-actions">
              <button type="button" className="aiw-btn-cancel" onClick={() => setStep(2)}>
                Retour
              </button>
              <button
                type="submit"
                className="aiw-btn-primary"
                disabled={loading || !form.nom || !form.prenom}
              >
                {loading ? <span className="aiw-spin"/> : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Créer l'administrateur
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}