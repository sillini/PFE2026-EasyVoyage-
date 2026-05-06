import { useState, useEffect, useRef, useCallback } from "react";
import { GOOGLE_CLIENT_ID, RECAPTCHA_SITE_KEY, VERIMAIL_API_KEY } from "../../../config/auth";
import ForgotPasswordFlow from "./ForgotPasswordFlow";
import "./AuthModal.css";

const API = "http://localhost:8000/api/v1";

// ══ reCAPTCHA v2 ══════════════════════════════════════════
function ReCaptcha({ onVerify }) {
  const ref = useRef();
  const widgetId = useRef(null);

  useEffect(() => {
    const render = () => {
      if (window.grecaptcha && ref.current && widgetId.current === null) {
        widgetId.current = window.grecaptcha.render(ref.current, {
          sitekey: RECAPTCHA_SITE_KEY,
          callback:          (tok) => onVerify(tok),
          "expired-callback":()    => onVerify(null),
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

  return <div ref={ref} className="am-recaptcha"/>;
}

// ══ Google OAuth ══════════════════════════════════════════
function GoogleButton({ onGoogleLogin, label }) {
  const btnRef = useRef();

  const initGoogle = useCallback(() => {
    if (!window.google?.accounts?.id) return;
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (response) => {
        try {
          const res = await fetch(`${API}/auth/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ credential: response.credential }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.detail || "Erreur Google");
          localStorage.setItem("access_token",  data.access_token);
          localStorage.setItem("refresh_token", data.refresh_token);
          localStorage.setItem("role",          data.role);
          onGoogleLogin(data);
        } catch (e) {
          alert("Connexion Google échouée : " + e.message);
        }
      },
      ux_mode: "popup",
    });
    if (btnRef.current) {
      window.google.accounts.id.renderButton(btnRef.current, {
        theme: "outline", size: "large", width: "100%",
        text: label === "login" ? "signin_with" : "signup_with",
        logo_alignment: "left",
      });
    }
  }, [label, onGoogleLogin]);

  useEffect(() => {
    if (window.google?.accounts?.id) { initGoogle(); return; }
    if (!document.getElementById("gsi-script")) {
      const s = document.createElement("script");
      s.id  = "gsi-script";
      s.src = "https://accounts.google.com/gsi/client";
      s.async = true; s.defer = true;
      s.onload = initGoogle;
      document.head.appendChild(s);
    } else {
      const check = setInterval(() => {
        if (window.google?.accounts?.id) { clearInterval(check); initGoogle(); }
      }, 100);
      return () => clearInterval(check);
    }
  }, [initGoogle]);

  if (GOOGLE_CLIENT_ID.includes("VOTRE")) {
    return (
      <div className="am-google-config">
        <button className="am-google-btn am-google-disabled" type="button" disabled>
          <GoogleIcon/>
          {label === "login" ? "Continuer avec Google" : "S'inscrire avec Google"}
        </button>
        <div className="am-google-notice">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>Configurez <code>GOOGLE_CLIENT_ID</code> dans <code>src/config/auth.js</code></span>
        </div>
      </div>
    );
  }

  return <div ref={btnRef} className="am-google-rendered"/>;
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

// ══ Vérification email ════════════════════════════════════
const MAJOR_PROVIDERS = [
  "gmail.com","googlemail.com",
  "yahoo.com","yahoo.fr","yahoo.co.uk","yahoo.es","yahoo.de",
  "hotmail.com","hotmail.fr","hotmail.co.uk","hotmail.es","hotmail.de",
  "outlook.com","outlook.fr","outlook.es","outlook.de",
  "live.com","live.fr","live.co.uk","live.nl",
  "icloud.com","me.com","mac.com",
  "msn.com","protonmail.com","proton.me",
  "laposte.net","orange.fr","sfr.fr","free.fr","wanadoo.fr"
];

async function verifyEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) return { valid: false, reason: "Format d'email invalide" };

  const domain = email.split("@")[1]?.toLowerCase();

  const disposable = [
    "mailinator.com","guerrillamail.com","10minutemail.com","tempmail.com",
    "throwam.com","yopmail.com","trashmail.com","fakeinbox.com",
    "sharklasers.com","spam4.me","dispostable.com","mailnull.com"
  ];
  if (disposable.includes(domain)) return { valid: false, reason: "Emails temporaires non autorisés" };

  // Grands providers → pas de vérification SMTP (ils bloquent)
  if (MAJOR_PROVIDERS.includes(domain)) return { valid: true };

  // Autres domaines → Verimail
  try {
    const res = await fetch(
      `https://api.verimail.io/v3/verify?key=${VERIMAIL_API_KEY}&email=${encodeURIComponent(email)}`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (res.ok) {
      const d = await res.json();
      if (d.status === "deliverable") return { valid: true };
      if (d.status === "disposable")  return { valid: false, reason: "Emails temporaires non autorisés" };
      if (d.status === "hardbounce")  return { valid: false, reason: "Cette adresse email n'existe pas" };
      if (d.status === "softbounce")  return { valid: false, reason: "Email inaccessible" };
      return { valid: true };
    }
  } catch {}

  return { valid: true };
}

// ══ Formulaire connexion ══════════════════════════════════
function FormLogin({ onLogin, onSwitch, onForgotPassword }) {
  const [email,   setEmail]   = useState("");
  const [password,setPassword]= useState("");
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [captcha, setCaptcha] = useState(null);   // ← token reCAPTCHA

  const submit = async (e) => {
    e.preventDefault(); setError("");
    if (!captcha) { setError("Veuillez valider le captcha"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ email, password, captcha_token: captcha }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Identifiants incorrects");
      localStorage.setItem("access_token",  data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      localStorage.setItem("role",          data.role);
      onLogin(data);
    } catch(err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="am-form">
      <p className="am-form-sub">Accédez à votre espace personnel</p>
      <GoogleButton onGoogleLogin={onLogin} label="login"/>
      <div className="am-divider"><span>ou avec votre email</span></div>
      <form onSubmit={submit}>
        <div className="am-field">
          <label>Adresse email</label>
          <div className="am-input-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
              placeholder="votre@email.com" required autoComplete="email"/>
          </div>
        </div>
        <div className="am-field">
          <div className="am-field-row">
            <label>Mot de passe</label>
            <button
              type="button"
              className="am-forgot"
              onClick={() => onForgotPassword?.(email)}
            >
              Mot de passe oublié ?
            </button>
          </div>
          <div className="am-input-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <input type={showPw?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)}
              placeholder="••••••••" required autoComplete="current-password"/>
            <button type="button" className="am-eye" onClick={()=>setShowPw(!showPw)}>
              {showPw
                ?<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                :<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              }
            </button>
          </div>
        </div>

        <ReCaptcha onVerify={setCaptcha}/>

        {error && <div className="am-error"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{error}</div>}
        <button type="submit" className="am-submit" disabled={loading||!captcha}>
          {loading ? <span className="am-spin"/> : "Se connecter"}
        </button>
      </form>
      <p className="am-switch">Pas encore de compte ? <button type="button" onClick={onSwitch}>S'inscrire</button></p>
    </div>
  );
}

// ══ Formulaire inscription ════════════════════════════════
function FormRegister({ onLogin, onSwitch }) {
  const [nom,      setNom]      = useState("");
  const [prenom,   setPrenom]   = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [captcha,  setCaptcha]  = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [emailSt,  setEmailSt]  = useState(null);
  const emailTimer = useRef(null);

  const handleEmail = (v) => {
    setEmail(v); setEmailSt(null); setError("");
    clearTimeout(emailTimer.current);
    if (v.includes("@") && v.includes(".")) {
      setEmailSt("checking");
      emailTimer.current = setTimeout(async () => {
        // Vérifier d'abord si l'email existe déjà en BDD
        try {
          const chk = await fetch(`${API}/auth/check-email`, {
            method:"POST", headers:{"Content-Type":"application/json"},
            body: JSON.stringify({email: v}),
          });
          if (chk.ok) {
            const cd = await chk.json();
            if (cd.exists) {
              setEmailSt("error");
              setError("Un compte existe déjà avec cet email. Connectez-vous !");
              return;
            }
          }
        } catch {}
        // Puis vérifier avec Verimail
        const r = await verifyEmail(v);
        setEmailSt(r.valid ? "ok" : "error");
        if (!r.valid) setError(r.reason); else setError("");
      }, 900);
    }
  };

  const pwStr = () => {
    let s=0;
    if(password.length>=8)             s++;
    if(/[A-Z]/.test(password))         s++;
    if(/[0-9]/.test(password))         s++;
    if(/[^A-Za-z0-9]/.test(password))  s++;
    return s;
  };
  const str = pwStr();
  const strLabel = ["","Faible","Moyen","Bon","Fort"];
  const strColor = ["","#E74C3C","#F39C12","#3498DB","#27AE60"];

  const submit = async (e) => {
    e.preventDefault(); setError("");
    if (password !== confirm) { setError("Les mots de passe ne correspondent pas"); return; }
    if (emailSt === "error")  { setError("Adresse email invalide ou déjà utilisée"); return; }
    if (!captcha)             { setError("Veuillez valider le captcha"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/register/client`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ nom, prenom, email, password, password_confirm: confirm }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Gestion spécifique email déjà utilisé
        const msg = data.detail || "";
        if (msg.toLowerCase().includes("existe") || msg.toLowerCase().includes("email")) {
          setEmailSt("error");
          setError("Un compte existe déjà avec cet email. Connectez-vous !");
        } else {
          throw new Error(msg || "Erreur lors de l'inscription");
        }
        return;
      }
      // Auto-login
      const lr = await fetch(`${API}/auth/login`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({email, password}),
      });
      const ld = await lr.json();
      if (lr.ok) {
        localStorage.setItem("access_token",  ld.access_token);
        localStorage.setItem("refresh_token", ld.refresh_token);
        localStorage.setItem("role",          ld.role);
        onLogin(ld);
      } else { onSwitch(); }
    } catch(err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="am-form">
      <p className="am-form-sub">Créez votre compte gratuit</p>
      <GoogleButton onGoogleLogin={onLogin} label="register"/>
      <div className="am-divider"><span>ou avec votre email</span></div>
      <form onSubmit={submit}>
        <div className="am-row2">
          <div className="am-field">
            <label>Prénom</label>
            <div className="am-input-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>
              <input type="text" value={prenom} onChange={e=>setPrenom(e.target.value)} placeholder="Mohamed" required minLength={2}/>
            </div>
          </div>
          <div className="am-field">
            <label>Nom</label>
            <div className="am-input-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>
              <input type="text" value={nom} onChange={e=>setNom(e.target.value)} placeholder="Ben Ali" required minLength={2}/>
            </div>
          </div>
        </div>

        <div className="am-field">
          <label>
            Email
            {emailSt==="checking"&&<span className="am-estatus checking">⟳ Vérification...</span>}
            {emailSt==="ok"      &&<span className="am-estatus ok">✓ Email disponible</span>}
            {emailSt==="error"   &&<span className="am-estatus err">✗ Email invalide ou déjà utilisé</span>}
          </label>
          <div className={`am-input-wrap ${emailSt==="ok"?"valid":emailSt==="error"?"invalid":""}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            <input type="email" value={email} onChange={e=>handleEmail(e.target.value)}
              placeholder="votre@email.com" required autoComplete="email"/>
            {emailSt==="ok"    &&<svg className="am-valid-icon" viewBox="0 0 24 24" fill="none" stroke="#27AE60" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
            {emailSt==="error" &&<svg className="am-valid-icon" viewBox="0 0 24 24" fill="none" stroke="#E74C3C" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>}
          </div>
          {/* Lien vers connexion si email déjà utilisé */}
          {error.includes("Connectez-vous") && (
            <button type="button" className="am-already-exists" onClick={onSwitch}>
              → Se connecter avec cet email
            </button>
          )}
        </div>

        <div className="am-field">
          <label>Mot de passe</label>
          <div className="am-input-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <input type={showPw?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)}
              placeholder="Min. 8 caractères" required minLength={8} autoComplete="new-password"/>
            <button type="button" className="am-eye" onClick={()=>setShowPw(!showPw)}>
              {showPw
                ?<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                :<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              }
            </button>
          </div>
          {password && (
            <div className="am-pwstrength">
              <div className="am-pwbars">
                {[1,2,3,4].map(i=><div key={i} className="am-pwbar" style={{background:i<=str?strColor[str]:"#E8EDF5"}}/>)}
              </div>
              <span style={{color:strColor[str],fontSize:"0.72rem",fontWeight:700}}>{strLabel[str]}</span>
            </div>
          )}
        </div>

        <div className="am-field">
          <label>Confirmer le mot de passe</label>
          <div className={`am-input-wrap ${confirm&&confirm===password?"valid":confirm&&confirm!==password?"invalid":""}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)}
              placeholder="Répétez le mot de passe" required autoComplete="new-password"/>
          </div>
        </div>

        <ReCaptcha onVerify={setCaptcha}/>

        {error && !error.includes("Connectez-vous") && (
          <div className="am-error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </div>
        )}

        <button type="submit" className="am-submit" disabled={loading||!captcha||emailSt==="error"}>
          {loading ? <span className="am-spin"/> : "Créer mon compte"}
        </button>
      </form>
      <p className="am-switch">Déjà un compte ? <button type="button" onClick={onSwitch}>Se connecter</button></p>
    </div>
  );
}

// ══ MODAL ═════════════════════════════════════════════════
export default function AuthModal({ onClose, onLogin, defaultTab="login" }) {
  const [tab, setTab] = useState(defaultTab);
  // ✨ NEW : email préremplit le flow forgot password (saisi sur le formulaire de login)
  const [forgotEmail, setForgotEmail] = useState("");

  useEffect(() => {
    const fn = e => { if(e.key==="Escape") onClose(); };
    document.addEventListener("keydown", fn);
    // Bloquer le scroll pendant le modal
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", fn);
      // Restaurer exactement l'état précédent
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  // ✨ NEW : déclenchement du flow forgot password depuis FormLogin
  const handleForgotPassword = (email = "") => {
    setForgotEmail(email);
    setTab("forgot");
  };

  // ✨ NEW : retour vers le login depuis le flow forgot password
  const handleBackToLogin = () => {
    setTab("login");
    setForgotEmail("");
  };

  // ✨ NEW : titre du panneau gauche selon l'onglet
  const leftTitle =
    tab === "login"    ? "Bon retour !" :
    tab === "register" ? "Rejoignez-nous !" :
                         "Récupération sécurisée";

  // ✨ NEW : sous-titre du panneau gauche selon l'onglet
  const leftSub =
    tab === "login"    ? "Connectez-vous pour accéder à vos réservations et profiter de toutes nos offres exclusives." :
    tab === "register" ? "Créez votre compte et découvrez les meilleures offres de voyage en Tunisie." :
                         "Pas de panique ! En quelques étapes, retrouvez l'accès à votre compte EasyVoyage en toute sécurité.";

  // ✨ NEW : features du panneau gauche selon l'onglet
  const leftFeats = tab === "forgot"
    ? [
        {icon:"📧",txt:"Code envoyé par email"},
        {icon:"⏱",txt:"Validité 15 minutes"},
        {icon:"🔒",txt:"Connexion chiffrée"},
        {icon:"✓",txt:"Aucun appel téléphonique"},
      ]
    : [
        {icon:"🏨",txt:"Meilleurs hôtels de Tunisie"},
        {icon:"✈️",txt:"Voyages organisés tout compris"},
        {icon:"💳",txt:"Gestion facile de vos réservations"},
        {icon:"🔔",txt:"Offres exclusives en avant-première"},
      ];

  return (
    <div className="am-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="am-modal">
        <div className="am-left">
          <img src="/logo_final.png" alt="EasyVoyage" className="am-left-logo"/>
          <h2 className="am-left-title">{leftTitle}</h2>
          <p className="am-left-sub">{leftSub}</p>
          <div className="am-left-feats">
            {leftFeats.map(f=>(
              <div key={f.txt} className="am-feat">
                <span>{f.icon}</span><span>{f.txt}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="am-right">
          <button className="am-close" onClick={onClose} aria-label="Fermer">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>

          {/* ✨ Tabs masqués en mode forgot password */}
          {tab !== "forgot" && (
            <div className="am-tabs">
              <button className={`am-tab ${tab==="login"?"on":""}`} onClick={()=>setTab("login")}>Se connecter</button>
              <button className={`am-tab ${tab==="register"?"on":""}`} onClick={()=>setTab("register")}>S'inscrire</button>
              <div className="am-tab-ind" style={{left:tab==="login"?"3px":"calc(50% + 1px)",width:"calc(50% - 4px)"}}/>
            </div>
          )}

          <div className="am-scroll">
            {tab === "login" && (
              <FormLogin
                onLogin={onLogin}
                onSwitch={()=>setTab("register")}
                onForgotPassword={handleForgotPassword}
              />
            )}
            {tab === "register" && (
              <FormRegister
                onLogin={onLogin}
                onSwitch={()=>setTab("login")}
              />
            )}
            {tab === "forgot" && (
              <ForgotPasswordFlow
                onBackToLogin={handleBackToLogin}
                prefilledEmail={forgotEmail}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}