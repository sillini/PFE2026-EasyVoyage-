// src/visiteur/components/auth/ForgotPasswordFlow.jsx
// =====================================================================
// Composant 3 étapes pour la réinitialisation du mot de passe.
// S'intègre dans AuthModal.jsx (panneau droit du modal d'authentification).
//
// Étapes :
//   0. Saisie de l'email
//   1. Saisie du code à 6 chiffres reçu par email
//   2. Saisie + confirmation du nouveau mot de passe
//   3. Succès → bouton retour vers connexion
//
// Utilise les classes CSS `am-*` existantes pour rester cohérent avec le
// design du modal. Les styles spécifiques sont dans ForgotPasswordFlow.css.
// =====================================================================
import { useState, useEffect, useRef } from "react";
import "./ForgotPasswordFlow.css";

const API = "http://localhost:8000/api/v1";

// ── Validation force du mot de passe (cohérent avec le backend) ──
function evalPasswordStrength(pwd) {
  let s = 0;
  if (pwd.length >= 8) s++;
  if (/[A-Z]/.test(pwd)) s++;
  if (/[0-9]/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  return s;
}

// ── Validation côté client (avant envoi) ──
function validateNewPassword(pwd) {
  if (pwd.length < 8)             return "Le mot de passe doit contenir au moins 8 caractères";
  if (!/[A-Z]/.test(pwd))         return "Le mot de passe doit contenir au moins une majuscule";
  if (!/[a-z]/.test(pwd))         return "Le mot de passe doit contenir au moins une minuscule";
  if (!/\d/.test(pwd))            return "Le mot de passe doit contenir au moins un chiffre";
  return null;
}

// ════════════════════════════════════════════════════════════════════
//  COMPOSANT PRINCIPAL
// ════════════════════════════════════════════════════════════════════
export default function ForgotPasswordFlow({ onBackToLogin, prefilledEmail = "" }) {
  // Étape courante : 0=email, 1=code, 2=nouveau mdp, 3=succès
  const [step, setStep] = useState(0);

  // Données saisies
  const [email,    setEmail]    = useState(prefilledEmail);
  const [code,     setCode]     = useState(["", "", "", "", "", ""]);
  const [newPwd,   setNewPwd]   = useState("");
  const [confPwd,  setConfPwd]  = useState("");
  const [showPwd,  setShowPwd]  = useState(false);

  // États UI
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [info,    setInfo]    = useState("");

  // Refs pour les inputs OTP
  const codeRefs = useRef([]);

  // Cooldown pour le bouton "Renvoyer le code"
  const [resendCooldown, setResendCooldown] = useState(0);
  useEffect(() => {
    if (resendCooldown > 0) {
      const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendCooldown]);

  // Auto-focus première case du code dès l'arrivée à l'étape 1
  useEffect(() => {
    if (step === 1) {
      setTimeout(() => codeRefs.current[0]?.focus(), 100);
    }
  }, [step]);

  // ──────────────────────────────────────────────────────
  //  ÉTAPE 1 — DEMANDER UN CODE
  // ──────────────────────────────────────────────────────
  const handleRequestCode = async (e) => {
    e?.preventDefault();
    setError("");
    setInfo("");

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setError("Veuillez saisir une adresse email valide");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/forgot-password/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Une erreur est survenue. Réessayez.");
        return;
      }

      // Succès : on passe à l'étape 1 (saisie du code)
      // Note : le backend renvoie le même message que l'email existe ou non
      setInfo(data.message || `Si un compte existe, un code a été envoyé à ${email}`);
      setStep(1);
      setResendCooldown(60); // 60s avant de pouvoir renvoyer
      setCode(["", "", "", "", "", ""]);
    } catch (err) {
      setError("Impossible de joindre le serveur. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  };

  // ──────────────────────────────────────────────────────
  //  ÉTAPE 2 — VÉRIFIER LE CODE
  // ──────────────────────────────────────────────────────
  const handleVerifyCode = async (e) => {
    e?.preventDefault();
    setError("");

    const codeStr = code.join("");
    if (codeStr.length !== 6 || !/^\d{6}$/.test(codeStr)) {
      setError("Veuillez saisir le code à 6 chiffres reçu par email");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/forgot-password/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: codeStr,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Erreur lors de la vérification");
        return;
      }

      if (!data.valid) {
        setError(data.message || "Code invalide ou expiré");
        return;
      }

      // Code valide → étape 2 (nouveau mot de passe)
      setStep(2);
      setInfo("");
    } catch (err) {
      setError("Impossible de joindre le serveur. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  };

  // ──────────────────────────────────────────────────────
  //  ÉTAPE 3 — RESET DU MOT DE PASSE
  // ──────────────────────────────────────────────────────
  const handleResetPassword = async (e) => {
    e?.preventDefault();
    setError("");

    // Validations client
    if (newPwd !== confPwd) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    const pwdError = validateNewPassword(newPwd);
    if (pwdError) {
      setError(pwdError);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/forgot-password/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: code.join(""),
          new_password: newPwd,
          confirm_password: confPwd,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        // Récupérer message d'erreur — Pydantic renvoie parfois un tableau
        let msg = data.detail || "Erreur lors de la réinitialisation";
        if (Array.isArray(msg)) {
          msg = msg.map(e => e.msg || JSON.stringify(e)).join(", ");
        }
        setError(msg);
        return;
      }

      // Succès final
      setStep(3);
    } catch (err) {
      setError("Impossible de joindre le serveur. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  };

  // ──────────────────────────────────────────────────────
  //  HANDLER : Code OTP — gestion intelligente des 6 cases
  // ──────────────────────────────────────────────────────
  const handleCodeChange = (idx, value) => {
    // N'accepte que les chiffres (1 par case)
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[idx] = digit;
    setCode(next);
    setError("");

    // Auto-focus la case suivante si on a saisi un chiffre
    if (digit && idx < 5) {
      codeRefs.current[idx + 1]?.focus();
    }

    // Auto-submit quand les 6 cases sont remplies
    if (idx === 5 && digit && next.every(c => c !== "")) {
      // Pas de submit auto — on laisse l'utilisateur cliquer pour éviter les pièges
    }
  };

  const handleCodeKeyDown = (idx, e) => {
    // Backspace sur case vide → revenir à la précédente
    if (e.key === "Backspace" && !code[idx] && idx > 0) {
      codeRefs.current[idx - 1]?.focus();
    }
    // Flèches gauche/droite
    if (e.key === "ArrowLeft" && idx > 0) {
      codeRefs.current[idx - 1]?.focus();
    }
    if (e.key === "ArrowRight" && idx < 5) {
      codeRefs.current[idx + 1]?.focus();
    }
  };

  const handleCodePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 0) return;
    const next = ["", "", "", "", "", ""];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setCode(next);
    // Focus la dernière case remplie ou la première vide
    const focusIdx = Math.min(pasted.length, 5);
    codeRefs.current[focusIdx]?.focus();
  };

  // ──────────────────────────────────────────────────────
  //  RESEND CODE
  // ──────────────────────────────────────────────────────
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setCode(["", "", "", "", "", ""]);
    await handleRequestCode();
  };

  // ──────────────────────────────────────────────────────
  //  Force du mot de passe (UI)
  // ──────────────────────────────────────────────────────
  const pwdStr     = evalPasswordStrength(newPwd);
  const strLabels  = ["", "Faible", "Moyen", "Bon", "Fort"];
  const strColors  = ["", "#E74C3C", "#F39C12", "#3498DB", "#27AE60"];

  // ════════════════════════════════════════════════════════════════
  //  RENDU
  // ════════════════════════════════════════════════════════════════
  return (
    <div className="am-form fp-container">

      {/* En-tête : titre + sous-titre selon étape */}
      <div className="fp-header">
        <button
          type="button"
          className="fp-back-link"
          onClick={() => {
            if (step === 0 || step === 3) {
              onBackToLogin?.();
            } else {
              setError("");
              setInfo("");
              setStep(s => Math.max(0, s - 1));
            }
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               width="14" height="14">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          {step === 0 || step === 3 ? "Retour à la connexion" : "Étape précédente"}
        </button>

        <h2 className="am-form-title">
          {step === 0 && "Mot de passe oublié ?"}
          {step === 1 && "Vérification du code"}
          {step === 2 && "Nouveau mot de passe"}
          {step === 3 && "Mot de passe réinitialisé ✓"}
        </h2>
        <p className="am-form-sub">
          {step === 0 && "Saisissez votre email pour recevoir un code de réinitialisation"}
          {step === 1 && (
            <>Code envoyé à <strong>{email}</strong></>
          )}
          {step === 2 && "Choisissez un nouveau mot de passe sécurisé"}
          {step === 3 && "Vous pouvez maintenant vous connecter avec votre nouveau mot de passe"}
        </p>
      </div>

      {/* Indicateur de progression (étapes 0-2) */}
      {step < 3 && (
        <div className="fp-progress">
          {[0, 1, 2].map(s => (
            <div
              key={s}
              className={`fp-progress-step ${
                s < step ? "done" : s === step ? "active" : ""
              }`}
            >
              <span className="fp-progress-dot">
                {s < step ? "✓" : s + 1}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ════ ÉTAPE 0 : EMAIL ════════════════════════════════════ */}
      {step === 0 && (
        <form onSubmit={handleRequestCode} className="fp-form">
          <div className="am-field">
            <label>Adresse email</label>
            <div className="am-input-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="votre@email.com"
                autoComplete="email"
                required
                autoFocus
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <div className="am-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <button type="submit" className="am-submit" disabled={loading || !email}>
            {loading ? <span className="am-spin"/> : "Envoyer le code"}
          </button>

          <p className="am-switch">
            <button type="button" onClick={onBackToLogin}>← Retour à la connexion</button>
          </p>
        </form>
      )}

      {/* ════ ÉTAPE 1 : CODE OTP ═════════════════════════════════ */}
      {step === 1 && (
        <form onSubmit={handleVerifyCode} className="fp-form">
          <div className="am-field">
            <label>Code de vérification</label>
            <div className="fp-otp-grid" onPaste={handleCodePaste}>
              {code.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (codeRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(idx, e.target.value)}
                  onKeyDown={(e) => handleCodeKeyDown(idx, e)}
                  className="fp-otp-input"
                  disabled={loading}
                  aria-label={`Chiffre ${idx + 1}`}
                />
              ))}
            </div>
            <p className="fp-help">
              Saisissez les 6 chiffres reçus par email. Le code expire dans 15 minutes.
            </p>
          </div>

          {info && !error && (
            <div className="fp-info">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="8.01"/>
                <line x1="12" y1="12" x2="12" y2="16"/>
              </svg>
              {info}
            </div>
          )}

          {error && (
            <div className="am-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="am-submit"
            disabled={loading || code.join("").length < 6}
          >
            {loading ? <span className="am-spin"/> : "Vérifier le code"}
          </button>

          <div className="fp-resend-row">
            <span>Vous n'avez pas reçu le code ?</span>
            <button
              type="button"
              className="fp-resend-btn"
              onClick={handleResend}
              disabled={loading || resendCooldown > 0}
            >
              {resendCooldown > 0
                ? `Renvoyer (${resendCooldown}s)`
                : "Renvoyer le code"}
            </button>
          </div>
        </form>
      )}

      {/* ════ ÉTAPE 2 : NOUVEAU MOT DE PASSE ═════════════════════ */}
      {step === 2 && (
        <form onSubmit={handleResetPassword} className="fp-form">
          <div className="am-field">
            <label>Nouveau mot de passe</label>
            <div className="am-input-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input
                type={showPwd ? "text" : "password"}
                value={newPwd}
                onChange={(e) => { setNewPwd(e.target.value); setError(""); }}
                placeholder="Min. 8 caractères, 1 majuscule, 1 chiffre"
                autoComplete="new-password"
                required
                minLength={8}
                disabled={loading}
                autoFocus
              />
              <button
                type="button"
                className="am-eye"
                onClick={() => setShowPwd(!showPwd)}
                tabIndex={-1}
              >
                {showPwd ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
            {newPwd && (
              <div className="am-pwstrength">
                <div className="am-pwbars">
                  {[1, 2, 3, 4].map(i => (
                    <div
                      key={i}
                      className="am-pwbar"
                      style={{ background: i <= pwdStr ? strColors[pwdStr] : "#E8EDF5" }}
                    />
                  ))}
                </div>
                <span style={{ color: strColors[pwdStr], fontSize: "0.72rem", fontWeight: 700 }}>
                  {strLabels[pwdStr]}
                </span>
              </div>
            )}
          </div>

          <div className="am-field">
            <label>Confirmer le mot de passe</label>
            <div className={`am-input-wrap ${
              confPwd && confPwd === newPwd ? "valid" :
              confPwd && confPwd !== newPwd ? "invalid" : ""
            }`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input
                type="password"
                value={confPwd}
                onChange={(e) => { setConfPwd(e.target.value); setError(""); }}
                placeholder="Répétez le mot de passe"
                autoComplete="new-password"
                required
                minLength={8}
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <div className="am-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="am-submit"
            disabled={loading || !newPwd || !confPwd || newPwd !== confPwd || pwdStr < 3}
          >
            {loading ? <span className="am-spin"/> : "Réinitialiser le mot de passe"}
          </button>
        </form>
      )}

      {/* ════ ÉTAPE 3 : SUCCÈS ═══════════════════════════════════ */}
      {step === 3 && (
        <div className="fp-success">
          <div className="fp-success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <p className="fp-success-text">
            Votre mot de passe a été modifié avec succès. <br/>
            Connectez-vous dès maintenant avec votre nouveau mot de passe.
          </p>
          <button
            type="button"
            className="am-submit"
            onClick={onBackToLogin}
          >
            Aller à la connexion
          </button>
        </div>
      )}
    </div>
  );
}