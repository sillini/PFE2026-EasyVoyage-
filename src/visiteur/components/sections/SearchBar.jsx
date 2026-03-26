import { useState, useRef, useEffect } from "react";
import "./SearchBar.css";

const VILLES = [
  "Toute la Tunisie","Tunis","Hammamet","Sousse","Monastir",
  "Djerba","Tabarka","Sfax","Tozeur","Mahdia","Nabeul","Bizerte",
  "Gabès","Kairouan","Zarzis","Kébili","Douz",
];

function todayStr() { return new Date().toISOString().split("T")[0]; }
function addDays(d, n) {
  const dt = new Date(d); dt.setDate(dt.getDate() + n);
  return dt.toISOString().split("T")[0];
}
function fmtShort(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric"});
}
function fmtDay(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("fr-FR",{weekday:"long",day:"2-digit",month:"long"});
}

// ── Dropdown générique ─────────────────────────────────
function Dropdown({ label, icon, value, children, align="left" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);
  return (
    <div className="sb-dd" ref={ref}>
      <button className={`sb-dd-trigger ${open?"open":""}`} onClick={() => setOpen(!open)} type="button">
        <div className="sb-dd-trigger-inner">
          <span className="sb-dd-label">{icon}{label}</span>
          <span className="sb-dd-value">{value}</span>
        </div>
        <svg className="sb-dd-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points={open?"18 15 12 9 6 15":"6 9 12 15 18 9"}/>
        </svg>
      </button>
      {open && (
        <div className={`sb-dd-panel ${align==="right"?"right":""}`}>
          {children}
        </div>
      )}
    </div>
  );
}

// ── Sélecteur de date ──────────────────────────────────
function DatePicker({ label, icon, value, onChange, min }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  // Générer 30 jours à partir du min
  const days = [];
  const start = new Date(min || todayStr());
  for (let i = 0; i < 42; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i);
    days.push(d.toISOString().split("T")[0]);
  }

  const months = {};
  days.forEach(d => {
    const m = new Date(d).toLocaleDateString("fr-FR",{month:"long",year:"numeric"});
    if (!months[m]) months[m] = [];
    months[m].push(d);
  });

  return (
    <div className="sb-dd" ref={ref}>
      <button className={`sb-dd-trigger ${open?"open":""}`} onClick={() => setOpen(!open)} type="button">
        <div className="sb-dd-trigger-inner">
          <span className="sb-dd-label">{icon}{label}</span>
          <span className="sb-dd-value">{value ? fmtShort(value) : <em>Sélectionner</em>}</span>
        </div>
        <svg className="sb-dd-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points={open?"18 15 12 9 6 15":"6 9 12 15 18 9"}/>
        </svg>
      </button>
      {open && (
        <div className="sb-dd-panel sb-date-panel">
          <div className="sb-cal-grid">
            {days.map(d => {
              const dt = new Date(d);
              const isSelected = d === value;
              const dayNum = dt.getDate();
              const isFirst = dayNum === 1 || d === days[0];
              const monthLabel = isFirst ? dt.toLocaleDateString("fr-FR",{month:"short"}) : "";
              return (
                <button key={d}
                  className={`sb-cal-day ${isSelected?"sel":""} ${d < (min||todayStr())?"disabled":""}`}
                  onClick={() => { onChange(d); setOpen(false); }}
                  disabled={d < (min||todayStr())}>
                  {monthLabel && <span className="sb-cal-month">{monthLabel}</span>}
                  {dayNum}
                </button>
              );
            })}
          </div>
          {value && (
            <div className="sb-cal-selected">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              {fmtDay(value)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── SearchBar principale ───────────────────────────────
export default function SearchBar({ onSearch }) {
  const today = todayStr();
  const [cat,      setCat]      = useState("hotels");
  const [ville,    setVille]    = useState("Toute la Tunisie");
  const [texte,    setTexte]    = useState("");
  const [arrivee,  setArrivee]  = useState(today);
  const [depart,   setDepart]   = useState(addDays(today, 1));
  const [nuits,    setNuits]    = useState(1);
  const [chambres, setChambres] = useState(1);
  const [adultes,  setAdultes]  = useState(2);
  const [enfants,  setEnfants]  = useState(0);

  const handleArrivee = (v) => { setArrivee(v); setDepart(addDays(v, nuits)); };
  const handleDepart  = (v) => {
    setDepart(v);
    const diff = Math.round((new Date(v)-new Date(arrivee))/86400000);
    if (diff>0) setNuits(diff);
  };
  const handleNuits = (n) => { const v=Math.max(1,n); setNuits(v); setDepart(addDays(arrivee,v)); };

  const doSearch = () => onSearch?.({
    categorie:cat, ville:ville==="Toute la Tunisie"?"":ville,
    texte, arrivee, depart, nuits, chambres, adultes, enfants
  });

  const occVal = `${chambres} ch. · ${adultes} adulte${adultes>1?"s":""} · ${enfants} enfant${enfants>1?"s":""}`;

  return (
    <div className="sb-root">
      {/* Onglets */}
      <div className="sb-tabs">
        <button className={`sb-tab ${cat==="hotels"?"on":""}`} onClick={()=>setCat("hotels")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Hôtels en Tunisie
        </button>
        <button className={`sb-tab ${cat==="voyages"?"on":""}`} onClick={()=>setCat("voyages")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/>
          </svg>
          Voyages organisés
        </button>
      </div>

      {/* Barre */}
      <div className="sb-bar">

        {/* Destination */}
        <Dropdown
          label="DESTINATION"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="10" r="3"/><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>}
          value={ville}>
          <div className="sb-ville-list">
            {VILLES.map(v => (
              <button key={v} className={`sb-ville-item ${v===ville?"sel":""}`}
                onClick={() => setVille(v)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="10" r="3"/><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                </svg>
                {v}
                {v===ville && <svg className="sb-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
              </button>
            ))}
          </div>
        </Dropdown>

        <div className="sb-sep"/>

        {/* Nom */}
        <div className="sb-field-text">
          <span className="sb-dd-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            {cat==="hotels"?"NOM DE L'HÔTEL":"NOM DU VOYAGE"}
          </span>
          <input value={texte} onChange={e=>setTexte(e.target.value)}
            placeholder={cat==="hotels"?"Ex : Barceló, Marhaba...":"Ex : Circuit Sahara..."}
            className="sb-text-input"
            onKeyDown={e=>e.key==="Enter"&&doSearch()}/>
        </div>

        <div className="sb-sep"/>

        {/* Arrivée */}
        <DatePicker
          label="ARRIVÉE"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/></svg>}
          value={arrivee} onChange={handleArrivee} min={today}/>

        <div className="sb-sep"/>

        {/* Départ */}
        <DatePicker
          label="DÉPART"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/></svg>}
          value={depart} onChange={handleDepart} min={addDays(arrivee,1)}/>

        <div className="sb-sep"/>

        {/* Nuitées */}
        <div className="sb-field-nuits">
          <span className="sb-dd-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 3H3v7a6 6 0 0 0 12 0V3"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
            NUITÉES
          </span>
          <div className="sb-counter">
            <button onClick={()=>handleNuits(nuits-1)} disabled={nuits<=1}>−</button>
            <span>{nuits}</span>
            <button onClick={()=>handleNuits(nuits+1)}>+</button>
          </div>
        </div>

        <div className="sb-sep"/>

        {/* Occupation */}
        <Dropdown
          label="OCCUPATION"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
          value={occVal}
          align="right">
          <div className="sb-occ-panel">
            {[
              {lbl:"Chambres", val:chambres, set:setChambres, min:1},
              {lbl:"Adultes",  val:adultes,  set:setAdultes,  min:1},
              {lbl:"Enfants",  val:enfants,  set:setEnfants,  min:0},
            ].map(r => (
              <div key={r.lbl} className="sb-occ-row">
                <div>
                  <div className="sb-occ-lbl">{r.lbl}</div>
                  {r.lbl==="Enfants" && <div className="sb-occ-sub">Moins de 12 ans</div>}
                </div>
                <div className="sb-counter">
                  <button onClick={()=>r.set(Math.max(r.min,r.val-1))} disabled={r.val<=r.min}>−</button>
                  <span>{r.val}</span>
                  <button onClick={()=>r.set(r.val+1)}>+</button>
                </div>
              </div>
            ))}
          </div>
        </Dropdown>

        {/* Bouton */}
        <button className="sb-btn" onClick={doSearch}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          Rechercher
        </button>
      </div>
    </div>
  );
}