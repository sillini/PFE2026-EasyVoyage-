import { useState, useEffect, useRef } from "react";
import { RECAPTCHA_SITE_KEY } from "../config/auth";
import "./LoginPage.css";

// ══ reCAPTCHA v2 ══════════════════════════════════════════
function ReCaptcha({ onVerify }) {
  const ref = useRef();
  const widgetId = useRef(null);

  useEffect(() => {
    const render = () => {
      if (window.grecaptcha && ref.current && widgetId.current === null) {
        widgetId.current = window.grecaptcha.render(ref.current, {
          sitekey: RECAPTCHA_SITE_KEY,
          callback:           (tok) => onVerify(tok),
          "expired-callback": ()    => onVerify(null),
        });
      }
    };
    if (window.grecaptcha?.render) { render(); return; }
    if (!document.getElementById("rc-script")) {
      window._rcReady = render;
      const s = document.createElement("script");
      s.id  = "rc-script";
      s.src = "https://www.google.com/recaptcha/api.js?onload=_rcReady&render=explicit";
      s.async = true; s.defer = true;
      document.head.appendChild(s);
    } else { window._rcReady = render; }
    return () => { widgetId.current = null; };
  }, []);

  return <div ref={ref} className="login-recaptcha"/>;
}

export default function LoginPage({ onLogin }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [showPass, setShowPass] = useState(false);
  const [captcha, setCaptcha]   = useState(null);   // ← token reCAPTCHA

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!captcha) { setError("Veuillez valider le captcha"); return; }
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, captcha_token: captcha }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Identifiants incorrects");
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      localStorage.setItem("role", data.role);
      onLogin(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <div className="login-bg">
        <div className="bg-orb orb-1" />
        <div className="bg-orb orb-2" />
        <div className="bg-orb orb-3" />
        <div className="bg-grid" />
      </div>

      <div className="login-container">
        {/* Panneau gauche — branding */}
        <div className="login-brand">
          <div className="brand-content">
            <div className="brand-logo-wrap">
              <img src="/logo_final.png" alt="EasyVoyage" className="brand-logo" />
            </div>
            <h1 className="brand-tagline">
              Votre plateforme de<br /><span>gestion de voyages</span>
            </h1>
            <p className="brand-desc">
              Gérez vos hôtels, chambres, réservations et campagnes marketing depuis un seul endroit.
            </p>
            <div className="brand-stats">
              <div className="stat-item">
                <span className="stat-num">500+</span>
                <span className="stat-label">Partenaires</span>
              </div>
              <div className="stat-divider" />
              <div className="stat-item">
                <span className="stat-num">12k+</span>
                <span className="stat-label">Réservations</span>
              </div>
              <div className="stat-divider" />
              <div className="stat-item">
                <span className="stat-num">98%</span>
                <span className="stat-label">Satisfaction</span>
              </div>
            </div>
          </div>
        </div>

        {/* Panneau droit — formulaire */}
        <div className="login-form-panel">
          <div className="form-card">
            <div className="form-header">
              <div className="form-badge">Connexion sécurisée</div>
              <h2 className="form-title">Bienvenue</h2>
              <p className="form-subtitle">Identifiez-vous pour accéder à votre espace.</p>
            </div>

            <form onSubmit={handleSubmit} className="form-body">
              <div className="field-group">
                <label htmlFor="email">Adresse email</label>
                <div className="input-wrap">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="field-group">
                <label htmlFor="password">Mot de passe</label>
                <div className="input-wrap">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input
                    id="password"
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="toggle-pass"
                    onClick={() => setShowPass(!showPass)}
                  >
                    {showPass ? (
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
              </div>

              <div className="form-options">
                <label className="remember-me">
                  <input type="checkbox" />
                  <span>Se souvenir de moi</span>
                </label>
                <a href="#" className="forgot-link">Mot de passe oublié ?</a>
              </div>

              {/* ── reCAPTCHA ── */}
              <ReCaptcha onVerify={setCaptcha}/>

              {error && (
                <div className="form-error">
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
                className={`btn-login ${loading ? "loading" : ""}`}
                disabled={loading || !captcha}
              >
                {loading ? (
                  <span className="spinner" />
                ) : (
                  <>
                    <span>Se connecter</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                      <polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </>
                )}
              </button>
            </form>

            <div className="form-footer">
              <p>Pas encore partenaire ? <a href="#">Rejoignez-nous</a></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}