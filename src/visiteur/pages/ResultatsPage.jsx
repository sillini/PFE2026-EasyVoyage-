import { useState, useEffect, useCallback, useRef } from "react";
import { hotelsPublicApi, voyagesPublicApi, fetchMainImage } from "../services/api";
import "./ResultatsPage.css";

// ══ Helpers ═══════════════════════════════════════════════
const VILLES = ["","Tunis","Hammamet","Sousse","Monastir","Djerba","Tabarka","Sfax","Tozeur","Mahdia","Nabeul","Bizerte","Gabès","Kairouan","Zarzis"];

function todayStr() { return new Date().toISOString().split("T")[0]; }
function addDays(d,n) { const dt=new Date(d); dt.setDate(dt.getDate()+n); return dt.toISOString().split("T")[0]; }
function fmtShort(d) { if(!d) return ""; try { return new Date(d).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric"}); } catch{return "";} }
function fmtLong(d)  { if(!d) return ""; try { return new Date(d).toLocaleDateString("fr-FR",{weekday:"short",day:"2-digit",month:"long"}); } catch{return "";} }

// ══ Dropdown générique ════════════════════════════════════
function Dropdown({ label, icon, value, children, align="left", className="" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const fn = e => { if(ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);
  return (
    <div className={`rp-dd ${className}`} ref={ref}>
      <button className={`rp-dd-btn ${open?"open":""}`} onClick={()=>setOpen(!open)} type="button">
        <div className="rp-dd-inner">
          <span className="rp-dd-label">{icon}{label}</span>
          <span className="rp-dd-val">{value}</span>
        </div>
        <svg className="rp-dd-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points={open?"18 15 12 9 6 15":"6 9 12 15 18 9"}/>
        </svg>
      </button>
      {open && (
        <div className={`rp-dd-panel ${align==="right"?"right":""}`}>
          {children}
        </div>
      )}
    </div>
  );
}

// ══ Mini calendrier ═══════════════════════════════════════
function MiniCal({ label, icon, value, onChange, min }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const fn = e => { if(ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);
  const days = [];
  const start = new Date(min || todayStr());
  for (let i=0; i<35; i++) {
    const d = new Date(start); d.setDate(start.getDate()+i);
    days.push(d.toISOString().split("T")[0]);
  }
  return (
    <div className="rp-dd" ref={ref} style={{flex:1}}>
      <button className={`rp-dd-btn ${open?"open":""}`} onClick={()=>setOpen(!open)} type="button">
        <div className="rp-dd-inner">
          <span className="rp-dd-label">{icon}{label}</span>
          <span className="rp-dd-val">{value ? fmtShort(value) : <em>Choisir</em>}</span>
        </div>
        <svg className="rp-dd-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points={open?"18 15 12 9 6 15":"6 9 12 15 18 9"}/>
        </svg>
      </button>
      {open && (
        <div className="rp-dd-panel rp-cal-panel">
          <div className="rp-cal-grid">
            {days.map(d => {
              const dt = new Date(d);
              const num = dt.getDate();
              const isFirst = num===1 || d===days[0];
              return (
                <button key={d}
                  className={`rp-cal-day ${d===value?"sel":""} ${d<(min||todayStr())?"dis":""}`}
                  onClick={()=>{ onChange(d); setOpen(false); }}
                  disabled={d<(min||todayStr())}>
                  {isFirst && <span className="rp-cal-m">{dt.toLocaleDateString("fr-FR",{month:"short"})}</span>}
                  {num}
                </button>
              );
            })}
          </div>
          {value && (
            <div className="rp-cal-picked">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              {fmtLong(value)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ══ Sidebar recherche + filtres ═══════════════════════════
function Sidebar({ params, cat, filtres, onSearch, onFiltres }) {
  const [ville,    setVille]    = useState(params?.ville||"");
  const [texte,    setTexte]    = useState(params?.texte||"");
  const [arrivee,  setArrivee]  = useState(params?.arrivee||todayStr());
  const [depart,   setDepart]   = useState(params?.depart||addDays(todayStr(),1));
  const [chambres, setChambres] = useState(params?.chambres||1);
  const [adultes,  setAdultes]  = useState(params?.adultes||2);
  const [enfants,  setEnfants]  = useState(params?.enfants||0);

  const handleArrivee = v => { setArrivee(v); setDepart(addDays(v,1)); };
  const doSearch = () => onSearch?.({...params, ville, texte, arrivee, depart, chambres, adultes, enfants});

  const occVal = `${chambres} ch · ${adultes} adulte${adultes>1?"s":""} · ${enfants} enfant${enfants>1?"s":""}`;

  function Counter({ val, set, min=0, label, sub }) {
    return (
      <div className="rp-occ-row">
        <div><div className="rp-occ-lbl">{label}</div>{sub&&<div className="rp-occ-sub">{sub}</div>}</div>
        <div className="rp-cnt">
          <button onClick={()=>set(Math.max(min,val-1))} disabled={val<=min}>−</button>
          <span>{val}</span>
          <button onClick={()=>set(val+1)}>+</button>
        </div>
      </div>
    );
  }

  return (
    <aside className="rp-sidebar">

      {/* ── Card Recherche ── */}
      <div className="rp-sb-card">
        <div className="rp-sb-head">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          Modifier la recherche
        </div>

        {/* Destination dropdown */}
        <Dropdown
          label="DESTINATION"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="10" r="3"/><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>}
          value={ville||"Toute la Tunisie"}
          className="rp-dd-full">
          <div className="rp-ville-list">
            <button className={`rp-ville-item ${!ville?"sel":""}`} onClick={()=>setVille("")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="10" r="3"/><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
              Toute la Tunisie
              {!ville && <svg className="rp-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
            </button>
            {VILLES.filter(v=>v).map(v => (
              <button key={v} className={`rp-ville-item ${v===ville?"sel":""}`} onClick={()=>setVille(v)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="10" r="3"/><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
                {v}
                {v===ville && <svg className="rp-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
              </button>
            ))}
          </div>
        </Dropdown>

        {/* Nom hôtel */}
        {cat==="hotels" && (
          <div className="rp-sb-textfield">
            <span className="rp-dd-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              NOM DE L'HÔTEL
            </span>
            <input value={texte} onChange={e=>setTexte(e.target.value)}
              placeholder="Ex : Marhaba, Barceló..." onKeyDown={e=>e.key==="Enter"&&doSearch()}/>
          </div>
        )}

        {/* Dates */}
        <div className="rp-sb-dates">
          <MiniCal
            label="ARRIVÉE"
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/></svg>}
            value={arrivee} onChange={handleArrivee} min={todayStr()}/>
          <MiniCal
            label="DÉPART"
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/></svg>}
            value={depart} onChange={setDepart} min={addDays(arrivee,1)}/>
        </div>

        {/* Occupation dropdown */}
        <Dropdown
          label="OCCUPATION"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
          value={occVal}
          className="rp-dd-full">
          <div className="rp-occ-panel">
            <Counter val={chambres} set={setChambres} min={1} label="Chambres"/>
            <Counter val={adultes}  set={setAdultes}  min={1} label="Adultes"/>
            <Counter val={enfants}  set={setEnfants}  min={0} label="Enfants" sub="Moins de 12 ans"/>
          </div>
        </Dropdown>

        <button className="rp-sb-btn" onClick={doSearch}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          Rechercher
        </button>
      </div>

      {/* ── Card Filtres ── */}
      <div className="rp-sb-card">
        <div className="rp-sb-head">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
          Filtrer les résultats
        </div>

        {cat==="hotels" && (
          <div className="rp-filtre-group">
            <div className="rp-filtre-title">Catégorie</div>
            {[5,4,3,2,1].map(n => (
              <label key={n} className="rp-filtre-row">
                <input type="checkbox"
                  checked={filtres.etoiles?.includes(n)||false}
                  onChange={e => {
                    const cur = filtres.etoiles||[];
                    onFiltres("etoiles", e.target.checked ? [...cur,n] : cur.filter(x=>x!==n));
                  }}/>
                <span className="rp-f-stars">{"★".repeat(n)}{"☆".repeat(5-n)}</span>
                <span className="rp-f-lbl">{n} étoile{n>1?"s":""}</span>
              </label>
            ))}
          </div>
        )}

        <div className="rp-filtre-group">
          <div className="rp-filtre-title">Note minimale</div>
          {[{v:4.5,l:"Excellent (4.5+)"},{v:4,l:"Très bien (4+)"},{v:3,l:"Bien (3+)"}].map(n=>(
            <label key={n.v} className="rp-filtre-row">
              <input type="radio" name="note_min"
                checked={filtres.note_min===n.v}
                onChange={()=>onFiltres("note_min", filtres.note_min===n.v?null:n.v)}/>
              <span className="rp-f-lbl">{n.l}</span>
            </label>
          ))}
        </div>

        {cat==="voyages" && (
          <div className="rp-filtre-group">
            <div className="rp-filtre-title">Budget / personne</div>
            {[{lbl:"Moins de 500 DT",max:500},{lbl:"500–1000 DT",min:500,max:1000},{lbl:"1000–2000 DT",min:1000,max:2000},{lbl:"Plus de 2000 DT",min:2000}].map(b=>(
              <label key={b.lbl} className="rp-filtre-row">
                <input type="radio" name="budget"
                  checked={filtres.budget?.lbl===b.lbl}
                  onChange={()=>onFiltres("budget", filtres.budget?.lbl===b.lbl?null:b)}/>
                <span className="rp-f-lbl">{b.lbl}</span>
              </label>
            ))}
          </div>
        )}

        <button className="rp-reset-btn" onClick={()=>onFiltres("reset")}>Réinitialiser les filtres</button>
      </div>
    </aside>
  );
}

// ══ Barre tri ══════════════════════════════════════════════
function TopBar({ cat, total, ville, tri, onTri }) {
  const tris = cat==="hotels"
    ? [{v:"note",l:"Recommandés"},{v:"etoiles",l:"Nombre d'étoiles"},{v:"nom",l:"Nom A→Z"}]
    : [{v:"prix",l:"Prix croissant"},{v:"prix_desc",l:"Prix décroissant"},{v:"date",l:"Date départ"}];
  return (
    <div className="rp-topbar">
      <div className="rp-topbar-left">
        <span className="rp-tb-count">{total}</span>
        <span className="rp-tb-txt">
          {cat==="hotels"?"établissement":"voyage"}{total>1?"s":""} à
          <strong> {ville||"Toute la Tunisie"}</strong>
        </span>
      </div>
      <div className="rp-topbar-tris">
        {tris.map(t=>(
          <button key={t.v} className={`rp-tri-btn ${tri===t.v?"on":""}`} onClick={()=>onTri(t.v)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
              <polyline points="3 6 4 7 6 5"/>
            </svg>
            {t.l}
          </button>
        ))}
      </div>
    </div>
  );
}

// ══ Cards ══════════════════════════════════════════════════
function HotelCard({ hotel, onDetail }) {
  const [img, setImg] = useState(null);
  const [ok, setOk] = useState(false);
  useEffect(()=>{ fetchMainImage("hotel",hotel.id).then(setImg); },[hotel.id]);
  return (
    <div className="rp-card" onClick={()=>onDetail(hotel)}>
      <div className="rp-card-img">
        {img ? <img src={img} alt={hotel.nom} onLoad={()=>setOk(true)} style={{opacity:ok?1:0}}/> :
          <div className="rp-card-ph"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>}
        {hotel.mis_en_avant && <div className="rp-badge gold">★ Sélection</div>}
      </div>
      <div className="rp-card-body">
        <div className="rp-card-top">
          <div className="rp-card-info">
            <div className="rp-card-stars">{"★".repeat(hotel.etoiles)}</div>
            <h3 className="rp-card-nom">{hotel.nom}</h3>
            <div className="rp-card-loc">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="10" r="3"/><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
              {hotel.ville||hotel.pays}
            </div>
          </div>
          {hotel.note_moyenne>0 && (
            <div className="rp-card-note">
              <span className="rp-note-n">{parseFloat(hotel.note_moyenne).toFixed(1)}</span>
              <div>
                <div className="rp-note-tag">{hotel.note_moyenne>=4.5?"Excellent":hotel.note_moyenne>=4?"Très bien":"Bien"}</div>
                <div className="rp-note-sub">sur 5</div>
              </div>
            </div>
          )}
        </div>
        {hotel.description && <p className="rp-card-desc">{hotel.description}</p>}
        <div className="rp-card-foot">
          <div className="rp-chips">
            {hotel.etoiles>=4&&<span className="rp-chip gold">Premium</span>}
            {hotel.mis_en_avant&&<span className="rp-chip blue">Recommandé</span>}
          </div>
          <button className="rp-cta">Voir les chambres →</button>
        </div>
      </div>
    </div>
  );
}

function VoyageCard({ voyage, onDetail }) {
  const [img, setImg] = useState(null);
  const [ok, setOk] = useState(false);
  useEffect(()=>{ fetchMainImage("voyage",voyage.id).then(setImg); },[voyage.id]);
  const fmt = d => d ? new Date(d).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric"}) : "";
  const dur = voyage.date_debut&&voyage.date_fin
    ? Math.round((new Date(voyage.date_fin)-new Date(voyage.date_debut))/(1000*60*60*24)) : null;
  return (
    <div className="rp-card" onClick={()=>onDetail(voyage)}>
      <div className="rp-card-img">
        {img ? <img src={img} alt={voyage.titre} onLoad={()=>setOk(true)} style={{opacity:ok?1:0}}/> :
          <div className="rp-card-ph"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5"><path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/></svg></div>}
        {dur&&<div className="rp-badge dark">{dur}J/{dur-1}N</div>}
        {voyage.prix_par_personne&&<div className="rp-prix-img">dès <strong>{parseFloat(voyage.prix_par_personne).toFixed(0)} DT</strong></div>}
      </div>
      <div className="rp-card-body">
        <div className="rp-card-top">
          <div className="rp-card-info">
            <h3 className="rp-card-nom">{voyage.titre}</h3>
            {voyage.destination&&<div className="rp-card-loc"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>{voyage.destination}</div>}
            {(voyage.date_debut||voyage.date_fin)&&<div className="rp-card-loc"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>{fmt(voyage.date_debut)}{voyage.date_fin&&` → ${fmt(voyage.date_fin)}`}</div>}
          </div>
          {voyage.prix_par_personne&&(
            <div className="rp-card-prix">
              <span className="rp-prix-lbl">par pers.</span>
              <span className="rp-prix-n">{parseFloat(voyage.prix_par_personne).toFixed(0)}</span>
              <span className="rp-prix-c">DT</span>
            </div>
          )}
        </div>
        {voyage.description&&<p className="rp-card-desc">{voyage.description}</p>}
        <div className="rp-card-foot">
          <div className="rp-chips">
            <span className="rp-chip blue">Tout compris</span>
            {dur&&<span className="rp-chip gray">{dur} jours</span>}
          </div>
          <button className="rp-cta">Réserver →</button>
        </div>
      </div>
    </div>
  );
}

// ══ PAGE ══════════════════════════════════════════════════
export default function ResultatsPage({ searchParams, onBack, onReserver }) {
  const cat = searchParams?.categorie||"hotels";
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total,   setTotal]   = useState(0);
  const [tri,     setTri]     = useState("note");
  const [filtres, setFiltres] = useState({etoiles:[],note_min:null,budget:null});
  const [params,  setParams]  = useState(searchParams);

  const load = useCallback(async(p,f)=>{
    setLoading(true);
    try {
      const q={per_page:20};
      if(p?.ville) q.ville=p.ville;
      if(p?.texte) q.nom=p.texte;
      if(f?.note_min) q.note_min=f.note_min;
      const data = cat==="hotels"
        ? await hotelsPublicApi.list(q)
        : await voyagesPublicApi.list({...q,...(p?.texte?{search:p.texte}:{})});
      let items=data?.items||[];
      if(cat==="hotels"&&f?.etoiles?.length) items=items.filter(h=>f.etoiles.includes(h.etoiles));
      if(cat==="voyages"&&f?.budget){const b=f.budget;items=items.filter(v=>{const px=parseFloat(v.prix_par_personne||0);return(!b.min||px>=b.min)&&(!b.max||px<=b.max);});}
      setResults(items); setTotal(data?.total||items.length);
    } catch{setResults([]);setTotal(0);}
    setLoading(false);
  },[cat]);

  useEffect(()=>{load(params,filtres);},[params,filtres]);

  const handleFiltres=(key,val)=>{
    if(key==="reset"){setFiltres({etoiles:[],note_min:null,budget:null});return;}
    setFiltres(prev=>({...prev,[key]:val}));
  };

  const sorted=[...results].sort((a,b)=>{
    if(tri==="note")      return (b.note_moyenne||0)-(a.note_moyenne||0);
    if(tri==="etoiles")   return (b.etoiles||0)-(a.etoiles||0);
    if(tri==="nom")       return (a.nom||"").localeCompare(b.nom||"");
    if(tri==="prix")      return (a.prix_par_personne||0)-(b.prix_par_personne||0);
    if(tri==="prix_desc") return (b.prix_par_personne||0)-(a.prix_par_personne||0);
    if(tri==="date")      return new Date(a.date_debut||0)-new Date(b.date_debut||0);
    return 0;
  });

  return (
    <div className="rp-root">
      <div className="rp-layout">

        <Sidebar params={params} cat={cat} filtres={filtres}
          onSearch={p=>setParams(p)} onFiltres={handleFiltres}/>

        <div className="rp-main">
          {/* Breadcrumb */}
          <div className="rp-bc">
            <button onClick={onBack} className="rp-back">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
              Accueil
            </button>
            <span>/</span><span>{cat==="hotels"?"Hôtels":"Voyages"}</span>
            {params?.ville&&<><span>/</span><span>{params.ville}</span></>}
          </div>

          <TopBar cat={cat} total={sorted.length} ville={params?.ville}
            tri={tri} onTri={setTri}/>

          {loading ? (
            <div className="rp-list">
              {Array(4).fill(0).map((_,i)=>(
                <div key={i} className="rp-skel">
                  <div className="rp-skel-img"/><div className="rp-skel-body">
                    <div className="rp-skel-l" style={{width:"55%",height:"18px"}}/>
                    <div className="rp-skel-l" style={{width:"35%",height:"12px"}}/>
                    <div className="rp-skel-l" style={{width:"75%",height:"12px"}}/>
                  </div>
                </div>
              ))}
            </div>
          ) : sorted.length===0 ? (
            <div className="rp-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.7"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <h3>Aucun résultat trouvé</h3>
              <p>Modifiez votre destination ou vos filtres</p>
              <button className="rp-reset-btn2" onClick={()=>{handleFiltres("reset");setParams({...params,ville:"",texte:""});}}>Réinitialiser</button>
            </div>
          ) : (
            <div className="rp-list">
              {sorted.map(item=>cat==="hotels"
                ?<HotelCard  key={item.id} hotel={item}  onDetail={onReserver}/>
                :<VoyageCard key={item.id} voyage={item} onDetail={onReserver}/>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}