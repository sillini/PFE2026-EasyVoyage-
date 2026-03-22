import { useState, useEffect } from "react";
import { profilPartenaireApi } from "../services/api";
import "./PartenaireProfil.css";

// ── OTP Input ─────────────────────────────────────────────
function OTPInput({ value, onChange, color = "gold" }) {
  const digits = value.padEnd(6,"").split("");
  const set = (val, i) => {
    const arr = value.padEnd(6,"").split("");
    arr[i] = val.replace(/\D/,"").slice(-1);
    onChange(arr.join("").replace(/\s/g,""));
    if (val && i < 5) document.getElementById(`pp2-otp-${i+1}`)?.focus();
  };
  const onKey = (e,i) => {
    if (e.key==="Backspace" && !digits[i] && i>0)
      document.getElementById(`pp2-otp-${i-1}`)?.focus();
  };
  const onPaste = (e) => {
    const p = e.clipboardData.getData("text").replace(/\D/g,"").slice(0,6);
    if (p.length===6) { onChange(p); e.preventDefault(); }
  };
  return (
    <div className="pp2-otp-wrap">
      {[0,1,2,3,4,5].map(i => (
        <input key={i} id={`pp2-otp-${i}`}
          className={`pp2-otp-box ${digits[i]?`filled ${color}`:""}`}
          type="text" inputMode="numeric" maxLength={1} value={digits[i]||""}
          onChange={e=>set(e.target.value,i)}
          onKeyDown={e=>onKey(e,i)} onPaste={onPaste}
          autoFocus={i===0}
        />
      ))}
    </div>
  );
}

// ── Strength ──────────────────────────────────────────────
function PasswordStrength({ pwd }) {
  const checks = [pwd.length>=8,/[A-Z]/.test(pwd),/[0-9]/.test(pwd),/[^A-Za-z0-9]/.test(pwd)];
  const score  = checks.filter(Boolean).length;
  const labels = ["","Faible","Moyen","Bon","Fort"];
  if (!pwd) return null;
  return (
    <div className="pp2-strength-wrap">
      <div className="pp2-strength-bars">
        {[1,2,3,4].map(n=>(
          <div key={n} className={`pp2-str-bar s${n} ${score>=n?"on":""}`}/>
        ))}
      </div>
      <span className="pp2-strength-lbl">Force : <strong>{labels[score]}</strong></span>
    </div>
  );
}

// ── Message ───────────────────────────────────────────────
function Msg({ msg }) {
  if (!msg) return null;
  const icons = {
    success:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
    error:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
    info:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/></svg>,
  };
  return <div className={`pp2-msg pp2-msg-${msg.type}`}>{icons[msg.type]}{msg.text}</div>;
}

// ══════════════════════════════════════════════════════════
export default function PartenaireProfil() {
  const [profil, setProfil]   = useState(null);
  const [loading, setLoading] = useState(true);

  // Infos perso
  const [nom, setNom]       = useState("");
  const [prenom, setPrenom] = useState("");
  const [tel, setTel]       = useState("");
  const [entreprise, setEnt] = useState("");
  const [savingInfo, setSI] = useState(false);
  const [infoMsg, setIM]    = useState(null);

  // Email
  const [emailStep, setES]    = useState(0);
  const [newEmail, setNE]     = useState("");
  const [emailCode, setEC]    = useState("");
  const [emailLoading, setEL] = useState(false);
  const [emailMsg, setEM]     = useState(null);

  // Mot de passe
  const [pwdStep, setPS]    = useState(0);
  const [pwdCode, setPC]    = useState("");
  const [newPwd, setNP]     = useState("");
  const [confPwd, setCF]    = useState("");
  const [showPwd, setSP]    = useState(false);
  const [pwdLoading, setPL] = useState(false);
  const [pwdMsg, setPM]     = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const d = await profilPartenaireApi.get();
      setProfil(d);
      setNom(d.nom||""); setPrenom(d.prenom||""); setTel(d.telephone||"");
      setEnt(d.nom_entreprise||"");
    } finally { setLoading(false); }
  };

  const handleSaveInfo = async (e) => {
    e.preventDefault(); setSI(true); setIM(null);
    try {
      const u = await profilPartenaireApi.update({ nom, prenom, telephone: tel, nom_entreprise: entreprise });
      setProfil(u); setIM({ type:"success", text:"Informations mises à jour ✓" });
      setTimeout(() => setIM(null), 3000);
    } catch(err) { setIM({ type:"error", text:err.message }); }
    finally { setSI(false); }
  };

  const handleRequestEmail = async (e) => {
    e.preventDefault(); setEL(true); setEM(null);
    try {
      await profilPartenaireApi.requestEmailChange(newEmail);
      setES(1); setEM({ type:"info", text:`Code envoyé à ${newEmail}` });
    } catch(err) { setEM({ type:"error", text:err.message }); }
    finally { setEL(false); }
  };

  const handleConfirmEmail = async () => {
    if (emailCode.length<6) return;
    setEL(true); setEM(null);
    try {
      const u = await profilPartenaireApi.confirmEmailChange(newEmail, emailCode);
      setProfil(u); setES(0); setNE(""); setEC("");
      setEM({ type:"success", text:"Email modifié avec succès ✓" });
      setTimeout(() => setEM(null), 4000);
    } catch(err) { setEM({ type:"error", text:err.message }); }
    finally { setEL(false); }
  };

  const handleRequestPwd = async () => {
    setPL(true); setPM(null);
    try {
      const r = await profilPartenaireApi.requestPasswordChange();
      setPS(1); setPM({ type:"info", text:r.message });
    } catch(err) { setPM({ type:"error", text:err.message }); }
    finally { setPL(false); }
  };

  const handleConfirmPwd = async (e) => {
    e.preventDefault();
    if (newPwd!==confPwd) { setPM({ type:"error", text:"Les mots de passe ne correspondent pas" }); return; }
    if (newPwd.length<8)  { setPM({ type:"error", text:"Minimum 8 caractères requis" }); return; }
    setPL(true); setPM(null);
    try {
      await profilPartenaireApi.confirmPasswordChange(pwdCode, newPwd, confPwd);
      setPS(0); setPC(""); setNP(""); setCF("");
      setPM({ type:"success", text:"Mot de passe modifié ✓" });
      setTimeout(() => setPM(null), 4000);
    } catch(err) { setPM({ type:"error", text:err.message }); }
    finally { setPL(false); }
  };

  if (loading) return (
    <div className="pp2-loading">
      <div className="pp2-spinner"/>
      <p>Chargement du profil...</p>
    </div>
  );

  const init = `${profil?.prenom?.[0]||""}${profil?.nom?.[0]||""}`.toUpperCase();
  const fmt  = (d,o) => d ? new Date(d).toLocaleDateString("fr-FR",o) : "—";
  const TYPE_ICONS = { HOTEL:"🏨", AGENCE:"✈️", TRANSPORT:"🚌", RESTAURATION:"🍽️", AUTRE:"🤝" };

  return (
    <div className="pp2-page">

      {/* ══ HERO ══════════════════════════════════════════ */}
      <div className="pp2-hero">
        <div className="pp2-hero-deco"><span/><span/><span/></div>
        <div className="pp2-hero-inner">

          {/* Avatar */}
          <div className="pp2-avatar-col">
            <div className="pp2-avatar-wrap">
              <div className="pp2-avatar">{init}</div>
              <div className="pp2-avatar-pulse"/>
            </div>
            <span className={`pp2-status-badge ${profil?.actif?"on":"off"}`}>
              <span/>{profil?.actif ? "Actif" : "Suspendu"}
            </span>
          </div>

          {/* Texte */}
          <div className="pp2-hero-text">
            <div className="pp2-hero-type">
              <span>{TYPE_ICONS[profil?.type_partenaire]||"🤝"}</span>
              {profil?.nom_entreprise || "Mon Entreprise"}
            </div>
            <h1 className="pp2-hero-nom">{profil?.prenom} {profil?.nom}</h1>
            <div className="pp2-hero-email">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              {profil?.email}
            </div>
            <div className="pp2-hero-tags">
              <span className="pp2-tag-type">{profil?.type_partenaire}</span>
              <span className={`pp2-tag-statut ${profil?.statut_partenaire?.toLowerCase()}`}>
                {profil?.statut_partenaire}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="pp2-hero-stats">
            {[
              { val: profil?.nom_entreprise || "—",                   lbl:"Entreprise" },
              { val: fmt(profil?.date_inscription,{day:"2-digit",month:"short",year:"numeric"}), lbl:"Membre depuis" },
              { val: `${profil?.commission?.toFixed(1)||"0"}%`,       lbl:"Commission" },
            ].map((s,i,arr) => (
              <>
                <div key={i} className="pp2-hero-stat">
                  <span className="pp2-hero-stat-val">{s.val}</span>
                  <span className="pp2-hero-stat-lbl">{s.lbl}</span>
                </div>
                {i<arr.length-1 && <div key={`sep${i}`} className="pp2-hero-stat-sep"/>}
              </>
            ))}
          </div>
        </div>
      </div>

      {/* ══ GRILLE ════════════════════════════════════════ */}
      <div className="pp2-content">
        <div className="pp2-grid">

          {/* ── Informations personnelles ── */}
          <div className="pp2-card">
            <div className="pp2-card-top blue"/>
            <div className="pp2-card-header">
              <div className="pp2-card-icon blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <div>
                <h3 className="pp2-card-title">Informations personnelles</h3>
                <p className="pp2-card-sub">Modifiables sans vérification</p>
              </div>
            </div>
            <div className="pp2-divider"/>
            <div className="pp2-card-body">
              <form onSubmit={handleSaveInfo} className="pp2-form">
                <div className="pp2-row">
                  <div className="pp2-field">
                    <label className="pp2-label">Prénom</label>
                    <div className="pp2-input-wrap">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      <input value={prenom} onChange={e=>setPrenom(e.target.value)} placeholder="Votre prénom"/>
                    </div>
                  </div>
                  <div className="pp2-field">
                    <label className="pp2-label">Nom</label>
                    <div className="pp2-input-wrap">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      <input value={nom} onChange={e=>setNom(e.target.value)} placeholder="Votre nom"/>
                    </div>
                  </div>
                </div>
                <div className="pp2-field">
                  <label className="pp2-label">Téléphone</label>
                  <div className="pp2-input-wrap">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6z"/></svg>
                    <input value={tel} onChange={e=>setTel(e.target.value)} placeholder="+216 XX XXX XXX"/>
                  </div>
                </div>
                <div className="pp2-field">
                  <label className="pp2-label">Nom de l'entreprise</label>
                  <div className="pp2-input-wrap">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    <input value={entreprise} onChange={e=>setEnt(e.target.value)} placeholder="Nom de votre entreprise"/>
                  </div>
                </div>
                <Msg msg={infoMsg}/>
                <button type="submit" className="pp2-btn pp2-btn-blue pp2-btn-full" disabled={savingInfo}>
                  {savingInfo ? <span className="pp2-spin"/> : (
                    <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>Enregistrer</>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* ── Infos entreprise (lecture seule) ── */}
          <div className="pp2-card">
            <div className="pp2-card-top gray"/>
            <div className="pp2-card-header">
              <div className="pp2-card-icon gray">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
              <div>
                <h3 className="pp2-card-title">Mon compte partenaire</h3>
                <p className="pp2-card-sub">Informations en lecture seule</p>
              </div>
            </div>
            <div className="pp2-divider"/>
            <div className="pp2-card-body">
              <div className="pp2-info-table">
                {[
                  { icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>, key:"Entreprise",       val:profil?.nom_entreprise||"—", cls:"blue" },
                  { icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,                                                                                                    key:"Type",             val:`${TYPE_ICONS[profil?.type_partenaire]||""} ${profil?.type_partenaire||"—"}` },
                  { icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,                                                                key:"Email",            val:profil?.email },
                  { icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,                                                        key:"Commission",       val:`${profil?.commission?.toFixed(2)||"0.00"}%`, cls:"gold" },
                  { icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,                                                                                                                         key:"Statut",           val:profil?.statut_partenaire||"—", cls:profil?.actif?"green":"red" },
                  { icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,                                                                                                      key:"Membre depuis",    val:fmt(profil?.date_inscription,{day:"numeric",month:"long",year:"numeric"}) },
                ].map(r => (
                  <div key={r.key} className="pp2-info-row">
                    <span className="pp2-info-key">{r.icon}{r.key}</span>
                    <span className={`pp2-info-val ${r.cls||""}`}>{r.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Changer email ── */}
          <div className="pp2-card">
            <div className="pp2-card-top gold"/>
            <div className="pp2-card-header">
              <div className="pp2-card-icon gold">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <div>
                <h3 className="pp2-card-title">Changer l'adresse email</h3>
                <p className="pp2-card-sub">Code OTP envoyé au nouvel email</p>
              </div>
            </div>
            <div className="pp2-divider"/>
            <div className="pp2-card-body">
              {emailStep===0 ? (
                <form onSubmit={handleRequestEmail} className="pp2-form">
                  <div className="pp2-field">
                    <label className="pp2-label">Email actuel</label>
                    <div className="pp2-input-readonly">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      <span>{profil?.email}</span>
                      <svg viewBox="0 0 24 24" fill="none" stroke="#27AE60" strokeWidth="2.5" className="pp2-check"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                  </div>
                  <div className="pp2-field">
                    <label className="pp2-label">Nouvel email</label>
                    <div className="pp2-input-wrap gold">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      <input type="email" value={newEmail} onChange={e=>setNE(e.target.value)} placeholder="nouveau@email.com" required/>
                    </div>
                  </div>
                  <div className="pp2-notice gold">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span>Le code sera envoyé au <strong>nouvel email</strong></span>
                  </div>
                  <Msg msg={emailMsg}/>
                  <button type="submit" className="pp2-btn pp2-btn-gold pp2-btn-full" disabled={emailLoading||!newEmail}>
                    {emailLoading ? <span className="pp2-spin"/> : (
                      <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>Envoyer le code</>
                    )}
                  </button>
                </form>
              ) : (
                <div className="pp2-form">
                  <div className="pp2-otp-section">
                    <div className="pp2-otp-icon gold">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                    <p>Code envoyé à <strong>{newEmail}</strong></p>
                    <span className="pp2-otp-timer">⏱ Valide 15 minutes</span>
                  </div>
                  <OTPInput value={emailCode} onChange={setEC} color="gold"/>
                  <Msg msg={emailMsg}/>
                  <div className="pp2-actions">
                    <button className="pp2-btn pp2-btn-ghost" onClick={()=>{setES(0);setEC("");setEM(null);}}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>Retour
                    </button>
                    <button className="pp2-btn pp2-btn-gold" style={{flex:1}} onClick={handleConfirmEmail} disabled={emailLoading||emailCode.length<6}>
                      {emailLoading ? <span className="pp2-spin"/> : (
                        <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>Confirmer</>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Changer mot de passe ── */}
          <div className="pp2-card">
            <div className="pp2-card-top red"/>
            <div className="pp2-card-header">
              <div className="pp2-card-icon red">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <div>
                <h3 className="pp2-card-title">Changer le mot de passe</h3>
                <p className="pp2-card-sub">Code OTP envoyé à votre email</p>
              </div>
            </div>
            <div className="pp2-divider"/>
            <div className="pp2-card-body">
              {pwdStep===0 ? (
                <div className="pp2-form">
                  <div className="pp2-pwd-intro">
                    <div className="pp2-pwd-intro-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    </div>
                    <div>
                      <span>Sécurité renforcée</span>
                      <p>Un code sera envoyé à <strong>{profil?.email}</strong></p>
                    </div>
                  </div>
                  <Msg msg={pwdMsg}/>
                  <button className="pp2-btn pp2-btn-red pp2-btn-full" onClick={handleRequestPwd} disabled={pwdLoading}>
                    {pwdLoading ? <span className="pp2-spin"/> : (
                      <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>Recevoir le code</>
                    )}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleConfirmPwd} className="pp2-form">
                  <div className="pp2-otp-section">
                    <div className="pp2-otp-icon red">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                    <p>Code envoyé à <strong>{profil?.email}</strong></p>
                    <span className="pp2-otp-timer">⏱ Valide 15 minutes</span>
                  </div>
                  <OTPInput value={pwdCode} onChange={setPC} color="red"/>
                  <div className="pp2-field">
                    <label className="pp2-label">Nouveau mot de passe</label>
                    <div className="pp2-input-wrap red">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      <input type={showPwd?"text":"password"} value={newPwd} onChange={e=>setNP(e.target.value)} placeholder="Minimum 8 caractères" required/>
                      <button type="button" className="pp2-eye" onClick={()=>setSP(!showPwd)}>
                        {showPwd
                          ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                          : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                      </button>
                    </div>
                    <PasswordStrength pwd={newPwd}/>
                  </div>
                  <div className="pp2-field">
                    <label className="pp2-label">Confirmer le mot de passe</label>
                    <div className="pp2-input-wrap red">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      <input type={showPwd?"text":"password"} value={confPwd} onChange={e=>setCF(e.target.value)} placeholder="Répéter le mot de passe" required/>
                      {confPwd && confPwd===newPwd && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="#27AE60" strokeWidth="2.5" style={{width:16,height:16,flexShrink:0}}><polyline points="20 6 9 17 4 12"/></svg>
                      )}
                    </div>
                  </div>
                  <Msg msg={pwdMsg}/>
                  <div className="pp2-actions">
                    <button type="button" className="pp2-btn pp2-btn-ghost" onClick={()=>{setPS(0);setPC("");setNP("");setCF("");setPM(null);}}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>Retour
                    </button>
                    <button type="submit" className="pp2-btn pp2-btn-red" style={{flex:1}} disabled={pwdLoading||pwdCode.length<6||!newPwd||!confPwd}>
                      {pwdLoading ? <span className="pp2-spin"/> : (
                        <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>Confirmer</>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}