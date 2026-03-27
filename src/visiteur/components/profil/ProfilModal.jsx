import { useState, useEffect, useCallback } from "react";
import "./ProfilModal.css";

const API = "http://localhost:8000/api/v1";

function authHeaders() {
  const t = localStorage.getItem("access_token");
  return { "Content-Type": "application/json", ...(t ? { Authorization: "Bearer " + t } : {}) };
}
async function apiFetch(url, opts = {}) {
  try {
    const res  = await fetch(url, { headers: authHeaders(), ...opts });
    const text = await res.text();
    let d; try { d = JSON.parse(text); } catch { d = { detail: text || `Erreur ${res.status}` }; }
    if (!res.ok) throw new Error(d.detail || `Erreur ${res.status}`);
    return d;
  } catch (e) {
    if (e.name === "TypeError" && e.message.includes("fetch"))
      throw new Error("Impossible de contacter le serveur.");
    throw e;
  }
}

// ── Helpers ────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtDateLong(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}
function nbNuits(d1, d2) {
  if (!d1 || !d2) return 0;
  return Math.max(0, Math.round((new Date(d2) - new Date(d1)) / 86400000));
}

// ── OTP 6 chiffres ─────────────────────────────────────────
function OTPInput({ value, onChange, accent = "blue" }) {
  const digits = value.padEnd(6, "").split("");
  const set = (val, i) => {
    const arr = value.padEnd(6, "").split("");
    arr[i] = val.replace(/\D/, "").slice(-1);
    onChange(arr.join("").replace(/\s/g, ""));
    if (val && i < 5) document.getElementById(`pm-otp-${i+1}`)?.focus();
  };
  const onKey = (e, i) => { if (e.key === "Backspace" && !digits[i] && i > 0) document.getElementById(`pm-otp-${i-1}`)?.focus(); };
  const onPaste = (e) => { const p = e.clipboardData.getData("text").replace(/\D/g,"").slice(0,6); if (p.length===6){onChange(p);e.preventDefault();} };
  return (
    <div className="pm-otp-wrap">
      {[0,1,2,3,4,5].map(i => (
        <input key={i} id={`pm-otp-${i}`}
          className={`pm-otp-box ${digits[i]?`filled ${accent}`:""}`}
          type="text" inputMode="numeric" maxLength={1} value={digits[i]||""}
          onChange={e=>set(e.target.value,i)} onKeyDown={e=>onKey(e,i)} onPaste={onPaste} autoFocus={i===0}/>
      ))}
    </div>
  );
}

// ── Force mdp ──────────────────────────────────────────────
function PwdStrength({ pwd }) {
  if (!pwd) return null;
  const s = [pwd.length>=8,/[A-Z]/.test(pwd),/[0-9]/.test(pwd),/[^A-Za-z0-9]/.test(pwd)].filter(Boolean).length;
  return (
    <div className="pm-strength">
      <div className="pm-strength-bars">{[1,2,3,4].map(n=><div key={n} className={`pm-sbar s${n} ${s>=n?"on":""}`}/>)}</div>
      <span>{["","Faible","Moyen","Bon","Fort"][s]}</span>
    </div>
  );
}

// ── Feedback message ───────────────────────────────────────
function Msg({ msg }) {
  if (!msg) return null;
  const ic = {
    success:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
    error:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
    info:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/></svg>,
  };
  return <div className={`pm-msg pm-msg-${msg.type}`}>{ic[msg.type]}{msg.text}</div>;
}

// ══════════════════════════════════════════════════════════════════
//  ONGLET : MON PROFIL
// ══════════════════════════════════════════════════════════════════
function TabProfil({ user, onUpdate }) {
  const [form, setForm]     = useState({ nom:user?.nom||"", prenom:user?.prenom||"", telephone:user?.telephone||"" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg]       = useState(null);

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setMsg(null);
    try {
      const u = await apiFetch(`${API}/auth/me`, { method:"PUT", body:JSON.stringify(form) });
      onUpdate(u);
      setMsg({ type:"success", text:"Profil mis à jour avec succès ✓" });
      setTimeout(()=>setMsg(null), 3500);
    } catch(err) { setMsg({ type:"error", text:err.message }); }
    finally { setSaving(false); }
  };

  return (
    <div className="pm-tab-content">
      {/* Card infos perso */}
      <div className="pm-card">
        <div className="pm-card-stripe blue"/>
        <div className="pm-card-hd">
          <div className="pm-card-ico blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div><h3>Informations personnelles</h3><p>Nom, prénom et téléphone</p></div>
        </div>
        <div className="pm-sep"/>
        <form onSubmit={handleSave} className="pm-card-body">
          <div className="pm-grid2">
            <div className="pm-field">
              <label>Prénom</label>
              <div className="pm-inp">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <input value={form.prenom} onChange={e=>setForm({...form,prenom:e.target.value})} placeholder="Votre prénom"/>
              </div>
            </div>
            <div className="pm-field">
              <label>Nom de famille</label>
              <div className="pm-inp">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <input value={form.nom} onChange={e=>setForm({...form,nom:e.target.value})} placeholder="Votre nom"/>
              </div>
            </div>
          </div>
          <div className="pm-field">
            <label>Adresse email <span className="pm-badge-ro">Non modifiable ici</span></label>
            <div className="pm-inp disabled">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              <input value={user?.email||""} disabled/>
            </div>
            <span className="pm-hint">→ Onglet Sécurité pour modifier l'email</span>
          </div>
          <div className="pm-field">
            <label>Numéro de téléphone</label>
            <div className="pm-inp">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.11 12 19.79 19.79 0 0 1 1.04 3.38 2 2 0 0 1 3 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6z"/></svg>
              <input value={form.telephone} onChange={e=>setForm({...form,telephone:e.target.value})} placeholder="+216 XX XXX XXX"/>
            </div>
          </div>
          <Msg msg={msg}/>
          <button type="submit" className="pm-btn pm-btn-blue" disabled={saving}>
            {saving?<><span className="pm-spin"/>Enregistrement…</>:<><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>Enregistrer les modifications</>}
          </button>
        </form>
      </div>

      {/* Card infos compte */}
      <div className="pm-card">
        <div className="pm-card-stripe gold"/>
        <div className="pm-card-hd">
          <div className="pm-card-ico gold">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div><h3>Informations du compte</h3><p>Données système en lecture seule</p></div>
        </div>
        <div className="pm-sep"/>
        <div className="pm-card-body">
          <div className="pm-info-table">
            {[
              ["Rôle",               <span className="pm-role-badge">CLIENT</span>],
              ["Membre depuis",      fmtDateLong(user?.date_inscription)],
              ["Dernière connexion", fmtDateLong(user?.derniere_connexion)],
              ["Statut du compte",   user?.actif
                ? <span className="pm-status-on">● Actif</span>
                : <span className="pm-status-off">● Inactif</span>],
            ].map(([k,v])=>(
              <div key={k} className="pm-info-row">
                <span className="pm-info-k">{k}</span>
                <span className="pm-info-v">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  ONGLET : SÉCURITÉ
// ══════════════════════════════════════════════════════════════════
function TabSecurite({ user, onUpdate }) {
  // Email
  const [eStep, setES] = useState(0);
  const [nEmail, setNE] = useState("");
  const [eCode,  setEC] = useState("");
  const [eLoad,  setEL] = useState(false);
  const [eMsg,   setEM] = useState(null);
  // Mot de passe
  const [pStep, setPS] = useState(0);
  const [pCode, setPC] = useState("");
  const [nPwd,  setNP] = useState("");
  const [cPwd,  setCP] = useState("");
  const [show,  setSH] = useState(false);
  const [pLoad, setPL] = useState(false);
  const [pMsg,  setPM] = useState(null);

  const reqEmail = async (e) => {
    e.preventDefault(); setEL(true); setEM(null);
    try {
      const d = await apiFetch(`${API}/auth/me/request-email-change`,{method:"POST",body:JSON.stringify({new_email:nEmail})});
      setES(1); setEM({type:"info",text:d.message||`Code envoyé à ${nEmail}`});
    } catch(err){setEM({type:"error",text:err.message});} finally{setEL(false);}
  };
  const confEmail = async () => {
    if(eCode.length<6) return; setEL(true); setEM(null);
    try {
      const u = await apiFetch(`${API}/auth/me/confirm-email-change`,{method:"POST",body:JSON.stringify({new_email:nEmail,code:eCode})});
      onUpdate(u); setEM({type:"success",text:"Email modifié ✓"}); setES(0); setNE(""); setEC("");
    } catch(err){setEM({type:"error",text:err.message});} finally{setEL(false);}
  };
  const reqPwd = async () => {
    setPL(true); setPM(null);
    try {
      const d = await apiFetch(`${API}/auth/me/request-password-change`,{method:"POST"});
      setPS(1); setPM({type:"info",text:d.message||`Code envoyé à ${user?.email}`});
    } catch(err){setPM({type:"error",text:err.message});} finally{setPL(false);}
  };
  const confPwd = async (e) => {
    e.preventDefault();
    if(nPwd!==cPwd){setPM({type:"error",text:"Mots de passe différents"});return;}
    if(nPwd.length<8){setPM({type:"error",text:"Minimum 8 caractères"});return;}
    setPL(true); setPM(null);
    try {
      await apiFetch(`${API}/auth/me/confirm-password-change`,{method:"POST",body:JSON.stringify({code:pCode,new_password:nPwd,confirm_password:cPwd})});
      setPM({type:"success",text:"Mot de passe modifié ✓"}); setPS(0); setPC(""); setNP(""); setCP("");
    } catch(err){setPM({type:"error",text:err.message});} finally{setPL(false);}
  };

  return (
    <div className="pm-tab-content">
      {/* Email */}
      <div className="pm-card">
        <div className="pm-card-stripe gold"/>
        <div className="pm-card-hd">
          <div className="pm-card-ico gold">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          </div>
          <div><h3>Changer l'adresse email</h3><p>Code OTP envoyé au <em>nouvel</em> email via Brevo</p></div>
        </div>
        <div className="pm-sep"/>
        <div className="pm-card-body">
          <div className="pm-curr-email">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            Email actuel : <strong>{user?.email}</strong>
          </div>
          {eStep===0?(
            <form onSubmit={reqEmail} className="pm-form">
              <div className="pm-field"><label>Nouvel email</label>
                <div className="pm-inp"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  <input type="email" value={nEmail} onChange={e=>setNE(e.target.value)} placeholder="nouveau@email.com" required/></div>
              </div>
              <Msg msg={eMsg}/>
              <button type="submit" className="pm-btn pm-btn-gold" disabled={eLoad||!nEmail}>
                {eLoad?<><span className="pm-spin"/>Envoi…</>:<><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>Envoyer le code de vérification</>}
              </button>
            </form>
          ):(
            <div className="pm-form">
              <div className="pm-otp-info"><div className="pm-otp-icon gold"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>
                <p>Code envoyé à <strong>{nEmail}</strong></p><span>⏱ Valide 15 minutes</span>
              </div>
              <OTPInput value={eCode} onChange={setEC} accent="gold"/>
              <Msg msg={eMsg}/>
              <div className="pm-row-btns">
                <button className="pm-btn pm-btn-ghost" onClick={()=>{setES(0);setEC("");setEM(null);}}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>Retour</button>
                <button className="pm-btn pm-btn-gold pm-flex" onClick={confEmail} disabled={eLoad||eCode.length<6}>
                  {eLoad?<><span className="pm-spin"/>…</>:<><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>Confirmer</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mot de passe */}
      <div className="pm-card">
        <div className="pm-card-stripe red"/>
        <div className="pm-card-hd">
          <div className="pm-card-ico red">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <div><h3>Changer le mot de passe</h3><p>Code OTP envoyé à votre email actuel</p></div>
        </div>
        <div className="pm-sep"/>
        <div className="pm-card-body">
          {pStep===0?(
            <div className="pm-form">
              <div className="pm-security-notice">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <div><strong>Sécurité renforcée</strong><p>Un code OTP sera envoyé à <em>{user?.email}</em> avant de modifier le mot de passe</p></div>
              </div>
              <Msg msg={pMsg}/>
              <button className="pm-btn pm-btn-red pm-full" onClick={reqPwd} disabled={pLoad}>
                {pLoad?<><span className="pm-spin"/>Envoi…</>:<><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>Recevoir le code par email</>}
              </button>
            </div>
          ):(
            <form onSubmit={confPwd} className="pm-form">
              <div className="pm-otp-info"><div className="pm-otp-icon red"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>
                <p>Code envoyé à <strong>{user?.email}</strong></p><span>⏱ Valide 15 minutes</span>
              </div>
              <OTPInput value={pCode} onChange={setPC} accent="red"/>
              <div className="pm-field"><label>Nouveau mot de passe</label>
                <div className="pm-inp">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <input type={show?"text":"password"} value={nPwd} onChange={e=>setNP(e.target.value)} placeholder="Min. 8 caractères" required/>
                  <button type="button" className="pm-eye" onClick={()=>setSH(!show)}>{show?<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}</button>
                </div>
                <PwdStrength pwd={nPwd}/>
              </div>
              <div className="pm-field"><label>Confirmer le mot de passe</label>
                <div className={`pm-inp ${cPwd&&cPwd!==nPwd?"error":""}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <input type="password" value={cPwd} onChange={e=>setCP(e.target.value)} placeholder="Répéter le mot de passe" required/>
                </div>
                {cPwd&&cPwd!==nPwd&&<span className="pm-err-text">Les mots de passe ne correspondent pas</span>}
              </div>
              <Msg msg={pMsg}/>
              <div className="pm-row-btns">
                <button type="button" className="pm-btn pm-btn-ghost" onClick={()=>{setPS(0);setPC("");setNP("");setCP("");setPM(null);}}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>Retour</button>
                <button type="submit" className="pm-btn pm-btn-red pm-flex" disabled={pLoad||pCode.length<6||!nPwd||nPwd!==cPwd}>
                  {pLoad?<><span className="pm-spin"/>…</>:<><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>Confirmer le changement</>}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  ONGLET : MES RÉSERVATIONS — complet
// ══════════════════════════════════════════════════════════════════
const STATUT_CFG = {
  EN_ATTENTE: { label:"En attente",  cls:"pending",   icon:"⏳" },
  CONFIRMEE:  { label:"Confirmée",   cls:"confirmed", icon:"✅" },
  ANNULEE:    { label:"Annulée",     cls:"cancelled", icon:"❌" },
  TERMINEE:   { label:"Terminée",    cls:"done",      icon:"🏁" },
};

function ReservationCard({ resa, onAnnuler, onPdf }) {
  const [expanded, setExpanded]   = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [downloading, setDL]      = useState(false);
  const s   = STATUT_CFG[resa.statut] || { label:resa.statut, cls:"pending", icon:"❓" };
  const isV = !!resa.id_voyage;
  const nuits = nbNuits(resa.date_debut, resa.date_fin);
  const canCancel = resa.statut === "EN_ATTENTE" || resa.statut === "CONFIRMEE";

  const handleCancel = async () => {
    if (!window.confirm("Confirmer l'annulation de cette réservation ?")) return;
    setCancelling(true);
    try { await onAnnuler(resa.id); }
    finally { setCancelling(false); }
  };

  const handlePdf = async () => {
    setDL(true);
    try { await onPdf(resa.id, resa.numero_facture); }
    finally { setDL(false); }
  };

  return (
    <div className={`pm-resa-card ${expanded?"expanded":""}`}>
      {/* Ligne principale */}
      <div className="pm-resa-main" onClick={()=>setExpanded(!expanded)}>
        <div className="pm-resa-type-ico">
          {isV
            ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/></svg>
            : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}
        </div>

        <div className="pm-resa-summary">
          <div className="pm-resa-top-row">
            <span className="pm-resa-id">#{resa.id}</span>
            <span className="pm-resa-type-label">{isV?"Voyage organisé":"Hôtel"}</span>
          </div>
          <div className="pm-resa-dates-row">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            {fmtDate(resa.date_debut)} → {fmtDate(resa.date_fin)}
            <span className="pm-resa-nuits">{isV?`${nuits}j`:`${nuits} nuit${nuits>1?"s":""}`}</span>
          </div>
        </div>

        <div className="pm-resa-right-col">
          <span className={`pm-statut-badge ${s.cls}`}>{s.icon} {s.label}</span>
          <span className="pm-resa-montant">{parseFloat(resa.total_ttc).toFixed(2)} DT</span>
        </div>

        <button className="pm-resa-chevron" onClick={e=>{e.stopPropagation();setExpanded(!expanded);}}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points={expanded?"18 15 12 9 6 15":"6 9 12 15 18 9"}/>
          </svg>
        </button>
      </div>

      {/* Détails expandés */}
      {expanded && (
        <div className="pm-resa-details">
          <div className="pm-resa-detail-grid">
            <div className="pm-detail-item">
              <span className="pm-detail-k">Référence</span>
              <span className="pm-detail-v pm-mono">#{resa.id}</span>
            </div>
            <div className="pm-detail-item">
              <span className="pm-detail-k">Type</span>
              <span className="pm-detail-v">{isV?"Voyage organisé":"Séjour hôtel"}</span>
            </div>
            <div className="pm-detail-item">
              <span className="pm-detail-k">Date d'arrivée</span>
              <span className="pm-detail-v">{fmtDate(resa.date_debut)}</span>
            </div>
            <div className="pm-detail-item">
              <span className="pm-detail-k">Date de départ</span>
              <span className="pm-detail-v">{fmtDate(resa.date_fin)}</span>
            </div>
            <div className="pm-detail-item">
              <span className="pm-detail-k">Durée</span>
              <span className="pm-detail-v">{isV?`${nuits} jour${nuits>1?"s":""}`:`${nuits} nuit${nuits>1?"s":""}`}</span>
            </div>
            <div className="pm-detail-item">
              <span className="pm-detail-k">Montant total</span>
              <span className="pm-detail-v pm-gold-text">{parseFloat(resa.total_ttc).toFixed(2)} DT</span>
            </div>
            {resa.numero_facture && (
              <div className="pm-detail-item">
                <span className="pm-detail-k">N° Facture</span>
                <span className="pm-detail-v pm-mono">{resa.numero_facture}</span>
              </div>
            )}
            {resa.statut_facture && (
              <div className="pm-detail-item">
                <span className="pm-detail-k">Statut facture</span>
                <span className="pm-detail-v">{resa.statut_facture}</span>
              </div>
            )}
            {!isV && resa.lignes_chambres?.map((lc, i) => (
              <div key={i} className="pm-detail-item span2">
                <span className="pm-detail-k">Chambre #{lc.id_chambre}</span>
                <span className="pm-detail-v">{lc.nb_adultes} adulte{lc.nb_adultes>1?"s":""}{lc.nb_enfants>0?`, ${lc.nb_enfants} enfant${lc.nb_enfants>1?"s":""}`:""}  · {parseFloat(lc.prix_unitaire).toFixed(2)} DT/nuit</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="pm-resa-actions">
            {resa.numero_facture && (
              <button className="pm-resa-btn pm-resa-btn-pdf" onClick={handlePdf} disabled={downloading}>
                {downloading?<><span className="pm-spin"/>Téléchargement…</>:<><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>Télécharger le voucher PDF</>}
              </button>
            )}
            {canCancel && (
              <button className="pm-resa-btn pm-resa-btn-cancel" onClick={handleCancel} disabled={cancelling}>
                {cancelling?<><span className="pm-spin pm-spin-red"/>Annulation…</>:<><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>Annuler la réservation</>}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TabReservations() {
  const [reservations, setReservations] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [filter,   setFilter]   = useState("all");
  const [page,     setPage]     = useState(1);
  const [total,    setTotal]    = useState(0);
  const PER_PAGE = 10;

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const statutParam = filter!=="all" ? `&statut=${filter}` : "";
      const d = await apiFetch(`${API}/reservations/mes-reservations?page=${page}&per_page=${PER_PAGE}${statutParam}`);
      setReservations(d?.items || []);
      setTotal(d?.total || 0);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }, [filter, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [filter]);

  const handleAnnuler = async (id) => {
    try {
      await apiFetch(`${API}/reservations/${id}/annuler`, { method:"POST" });
      load(); // Recharger
    } catch(e) { alert("Erreur : " + e.message); }
  };

  const handlePdf = async (id, numFacture) => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API}/reservations/${id}/voucher-pdf`, {
        headers: { Authorization:`Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Erreur téléchargement PDF");
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `voucher-${numFacture||id}.pdf`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch(e) { alert("Erreur PDF : " + e.message); }
  };

  const FILTERS = [
    { key:"all",        label:"Toutes" },
    { key:"EN_ATTENTE", label:"En attente" },
    { key:"CONFIRMEE",  label:"Confirmées" },
    { key:"ANNULEE",    label:"Annulées" },
    { key:"TERMINEE",   label:"Terminées" },
  ];

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div className="pm-tab-content">
      {/* Filtres */}
      <div className="pm-resa-filters">
        {FILTERS.map(f => (
          <button key={f.key} className={`pm-filter-btn ${filter===f.key?"on":""}`}
            onClick={()=>setFilter(f.key)}>
            {f.label}
          </button>
        ))}
        <span className="pm-resa-count">{total} réservation{total>1?"s":""}</span>
      </div>

      {loading ? (
        <div className="pm-loading-box">
          <div className="pm-spinner"/>
          <p>Chargement de vos réservations…</p>
        </div>
      ) : error ? (
        <div className="pm-error-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <p>{error}</p>
          <button onClick={load} className="pm-retry-btn">Réessayer</button>
        </div>
      ) : reservations.length === 0 ? (
        <div className="pm-empty-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.7">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
          </svg>
          <h4>{filter==="all"?"Aucune réservation pour l'instant":`Aucune réservation ${FILTERS.find(f=>f.key===filter)?.label.toLowerCase()}`}</h4>
          <p>Vos réservations d'hôtels et voyages apparaîtront ici.</p>
        </div>
      ) : (
        <>
          <div className="pm-resa-list">
            {reservations.map(r => (
              <ReservationCard key={r.id} resa={r} onAnnuler={handleAnnuler} onPdf={handlePdf}/>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="pm-pagination">
              <button disabled={page<=1} onClick={()=>setPage(p=>p-1)} className="pm-pg-btn">←</button>
              <span>Page {page} / {totalPages}</span>
              <button disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)} className="pm-pg-btn">→</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  MODAL PRINCIPAL
// ══════════════════════════════════════════════════════════════════
export default function ProfilModal({ user: init, onClose, onLogout }) {
  const [user, setUser] = useState(init);
  const [tab,  setTab]  = useState("profil");
  const initiales = ((user?.prenom?.[0]||"")+(user?.nom?.[0]||"")).toUpperCase();

  const TABS = [
    { id:"profil",       label:"Mon profil",   icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg> },
    { id:"securite",     label:"Sécurité",     icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
    { id:"reservations", label:"Réservations", icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
  ];

  return (
    <div className="pm-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="pm-modal">

        {/* Hero header */}
        <div className="pm-hero">
          <div className="pm-hero-orb"/>
          <div className="pm-hero-orb2"/>
          <div className="pm-hero-inner">
            <div className="pm-avatar">{initiales}</div>
            <div className="pm-hero-text">
              <h2>{user?.prenom} {user?.nom}</h2>
              <p>{user?.email}</p>
            </div>
            <button className="pm-x" onClick={onClose} aria-label="Fermer">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation onglets */}
        <div className="pm-nav">
          {TABS.map(t => (
            <button key={t.id} className={`pm-nav-btn ${tab===t.id?"on":""}`} onClick={()=>setTab(t.id)}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* Contenu */}
        <div className="pm-content">
          {tab==="profil"       && <TabProfil       user={user} onUpdate={setUser}/>}
          {tab==="securite"     && <TabSecurite     user={user} onUpdate={setUser}/>}
          {tab==="reservations" && <TabReservations/>}
        </div>

        {/* Footer */}
        <div className="pm-footer">
          <button className="pm-logout-btn" onClick={onLogout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Se déconnecter
          </button>
        </div>

      </div>
    </div>
  );
}