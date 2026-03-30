import { useState, useEffect, useRef } from "react";
import { heroSlidesApi } from "../services/api";
import "./AdminHeroSlides.css";

const CLOUD  = "dzfznxn0q";
const PRESET = "Image_Hotel";

async function uploadCloudinary(file) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, { method:"POST", body:fd });
  const d = await res.json();
  if (!d.secure_url) throw new Error("Upload échoué");
  return d.secure_url;
}

function fmt(d) {
  return new Date(d).toLocaleDateString("fr-FR", { day:"2-digit", month:"short", year:"numeric" });
}

/* ══════════════════════════════════════════════════════════
   MODAL SLIDE
══════════════════════════════════════════════════════════ */
function SlideModal({ slide, onClose, onSave }) {
  const isEdit = !!slide;
  const [form, setForm] = useState({
    titre:      slide?.titre      || "",
    sous_titre: slide?.sous_titre || "",
    tag:        slide?.tag        || "Offre Spéciale",
    image_url:  slide?.image_url  || "",
    ordre:      slide?.ordre      ?? 0,
    actif:      slide?.actif      ?? true,
  });
  const [uploading, setUploading] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");
  const [preview,   setPreview]   = useState(slide?.image_url || "");
  const fileRef = useRef();

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError("");
    try {
      setPreview(URL.createObjectURL(file));
      const url = await uploadCloudinary(file);
      set("image_url", url); setPreview(url);
    } catch(err) { setError(err.message); setPreview(""); }
    finally { setUploading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.image_url) { setError("Veuillez uploader une image"); return; }
    setSaving(true); setError("");
    try { await onSave({ ...form, ordre: Number(form.ordre) }); onClose(); }
    catch(err) { setError(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="hsm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="hsm-box">
        <div className="hsm-ridge" />
        <div className="hsm-header">
          <div className="hsm-header-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="2" y="3" width="20" height="14" rx="2"/>
              <path d="M8 21h8"/><path d="M12 17v4"/>
              <polyline points="2 10 7 6 11 9 16 5 22 10"/>
            </svg>
          </div>
          <div>
            <h2>{isEdit ? "Modifier le slide" : "Nouveau slide"}</h2>
            <p>{isEdit ? "Mettre à jour les informations" : "Ajouter un slide au carousel"}</p>
          </div>
          <button className="hsm-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="hsm-form">

          <div className="hsm-section-label">Image du slide</div>
          <div className={`hsm-upload ${preview?"has-preview":""}`} onClick={() => fileRef.current?.click()}>
            {preview ? (
              <>
                <img src={preview} alt="preview" className="hsm-preview"/>
                <div className="hsm-preview-overlay">
                  <span>Cliquer pour changer</span>
                </div>
              </>
            ) : (
              <div className="hsm-upload-empty">
                <div className="hsm-upload-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
                <span>Uploader une image</span>
                <p>Format recommandé : 1920×1080px — JPG, PNG, WebP</p>
              </div>
            )}
            {uploading && (
              <div className="hsm-upload-loading">
                <div className="hsm-spin"/>
                <span>Upload en cours…</span>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} hidden/>
          </div>

          <div className="hsm-section-label">Informations du slide</div>
          <div className="hsm-row">
            <div className="hsm-field">
              <label>Titre <span>*</span></label>
              <input value={form.titre} onChange={e => set("titre", e.target.value)}
                placeholder="Ex : Découvrez Djerba" required className="hsm-input"/>
            </div>
            <div className="hsm-field">
              <label>Badge / Tag</label>
              <input value={form.tag} onChange={e => set("tag", e.target.value)}
                placeholder="Ex : Offre Spéciale" className="hsm-input"/>
            </div>
          </div>

          <div className="hsm-field">
            <label>Sous-titre</label>
            <input value={form.sous_titre} onChange={e => set("sous_titre", e.target.value)}
              placeholder="Ex : Séjours inoubliables face à la Méditerranée" className="hsm-input"/>
          </div>

          <div className="hsm-row">
            <div className="hsm-field">
              <label>Ordre d'affichage</label>
              <div className="hsm-input-hint">
                <input type="number" min="0" value={form.ordre}
                  onChange={e => set("ordre", e.target.value)} className="hsm-input"/>
                <span>0 = en premier</span>
              </div>
            </div>
            <div className="hsm-field">
              <label>Statut</label>
              <div className="hsm-toggle-wrap">
                <button type="button"
                  className={`hsm-toggle ${form.actif?"on":"off"}`}
                  onClick={() => set("actif", !form.actif)}>
                  <span/>
                </button>
                <span className={`hsm-toggle-lbl ${form.actif?"on":"off"}`}>
                  {form.actif ? "● Actif" : "● Inactif"}
                </span>
              </div>
            </div>
          </div>

          {error && (
            <div className="hsm-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <div className="hsm-actions">
            <button type="button" className="hsm-btn-cancel" onClick={onClose}>Annuler</button>
            <button type="submit" className="hsm-btn-save" disabled={saving||uploading}>
              {saving ? <span className="hsm-spin"/> : (
                <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>{isEdit?"Enregistrer les modifications":"Créer le slide"}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PREVIEW SLIDER
══════════════════════════════════════════════════════════ */
function SliderPreview({ slides }) {
  const actifs = slides.filter(s => s.actif).sort((a,b) => a.ordre - b.ordre);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (actifs.length < 2) return;
    const t = setInterval(() => setIdx(i => (i+1) % actifs.length), 4000);
    return () => clearInterval(t);
  }, [actifs.length]);

  if (actifs.length === 0) {
    return (
      <div className="hsp-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" width="32" height="32">
          <rect x="2" y="3" width="20" height="14" rx="2"/>
          <polyline points="2 10 7 6 11 9 16 5 22 10"/>
        </svg>
        <p>Aucun slide actif — la page visiteur affiche les slides par défaut</p>
      </div>
    );
  }

  const slide = actifs[idx];

  return (
    <div className="hsp-root">
      <div className="hsp-header">
        <span className="hsp-label">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14">
            <circle cx="12" cy="12" r="10"/>
            <path d="M10 15l5-3-5-3v6z" fill="currentColor" stroke="none"/>
          </svg>
          Prévisualisation — {actifs.length} slide{actifs.length>1?"s":""} actif{actifs.length>1?"s":""}
        </span>
        <div className="hsp-dots">
          {actifs.map((_,i) => (
            <button key={i} className={`hsp-dot ${i===idx?"active":""}`} onClick={() => setIdx(i)}/>
          ))}
        </div>
      </div>
      <div className="hsp-frame">
        {actifs.map((s, i) => (
          <div key={s.id} className="hsp-slide"
            style={{ backgroundImage:`url(${s.image_url})`, opacity: i===idx?1:0, zIndex: i===idx?1:0 }}
          />
        ))}
        <div className="hsp-overlay"/>
        <div className="hsp-content" style={{ zIndex:2 }}>
          {slide.tag && <span className="hsp-tag">{slide.tag}</span>}
          <h3 className="hsp-titre">{slide.titre}</h3>
          {slide.sous_titre && <p className="hsp-sous">{slide.sous_titre}</p>}
        </div>
        <div className="hsp-counter">{idx+1}/{actifs.length}</div>
        {actifs.length > 1 && (
          <>
            <button className="hsp-arrow left" onClick={() => setIdx(i => (i-1+actifs.length)%actifs.length)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button className="hsp-arrow right" onClick={() => setIdx(i => (i+1)%actifs.length)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   CARD SLIDE
══════════════════════════════════════════════════════════ */
function SlideCard({ slide, onEdit, onDelete, onToggle, index }) {
  const [toggling, setToggling] = useState(false);
  const [confirm,  setConfirm]  = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleToggle = async (e) => {
    e.stopPropagation(); setToggling(true);
    try { await onToggle(slide.id, !slide.actif); } finally { setToggling(false); }
  };
  const handleDelete = async () => {
    setDeleting(true);
    try { await onDelete(slide.id); } finally { setDeleting(false); }
  };

  return (
    <div className={`hsc-card ${slide.actif?"":"hsc-inactif"}`}
      style={{ animationDelay:`${index*0.07}s` }}>

      {/* Image */}
      <div className="hsc-img-wrap">
        <img src={slide.image_url} alt={slide.titre}/>
        <div className="hsc-img-overlay">
          {slide.tag && <span className="hsc-tag">{slide.tag}</span>}
          <span className="hsc-ordre">Ordre #{slide.ordre}</span>
        </div>
        <div className={`hsc-status-bar ${slide.actif?"actif":"inactif"}`}/>
      </div>

      {/* Corps */}
      <div className="hsc-body">
        <div className="hsc-body-top">
          <h3 className="hsc-titre">{slide.titre}</h3>
          <span className={`hsc-badge ${slide.actif?"actif":"inactif"}`}>
            <span/>{slide.actif?"Actif":"Inactif"}
          </span>
        </div>
        {slide.sous_titre && <p className="hsc-sous">{slide.sous_titre}</p>}
        <div className="hsc-meta">
          <div className="hsc-meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="11" height="11">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Créé le {fmt(slide.created_at)}
          </div>
          {slide.updated_at !== slide.created_at && (
            <div className="hsc-meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="11" height="11">
                <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
              </svg>
              Modifié le {fmt(slide.updated_at)}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="hsc-footer">
        <button className="hsc-btn hsc-btn-edit" onClick={() => onEdit(slide)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Modifier
        </button>

        <button className={`hsc-btn ${slide.actif?"hsc-btn-deact":"hsc-btn-act"}`}
          onClick={handleToggle} disabled={toggling}>
          {toggling ? <span className="hsc-spin"/> : slide.actif ? (
            <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
              <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
            </svg>Désactiver</>
          ) : (
            <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
              <circle cx="12" cy="12" r="10"/><polyline points="9 11 12 14 22 4"/>
            </svg>Activer</>
          )}
        </button>

        <div className="hsc-del-zone" onClick={e => e.stopPropagation()}>
          {!confirm ? (
            <button className="hsc-btn hsc-btn-del" onClick={() => setConfirm(true)} title="Supprimer">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14H6L5 6"/>
                <path d="M10 11v6M14 11v6"/>
              </svg>
            </button>
          ) : (
            <div className="hsc-confirm">
              <span>Supprimer ?</span>
              <button className="hsc-confirm-yes" onClick={handleDelete} disabled={deleting}>
                {deleting ? "…" : "Oui"}
              </button>
              <button className="hsc-confirm-no" onClick={() => setConfirm(false)}>Non</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE PRINCIPALE
══════════════════════════════════════════════════════════ */
export default function AdminHeroSlides() {
  const [slides,       setSlides]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [modal,        setModal]        = useState(null);
  const [filterStatut, setFilterStatut] = useState("tous");
  const [search,       setSearch]       = useState("");
  const [showPreview,  setShowPreview]  = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true); setError("");
    try { const d = await heroSlidesApi.list(); setSlides(d.items || []); }
    catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleSave   = async (data) => {
    if (modal && modal !== "new") await heroSlidesApi.update(modal.id, data);
    else await heroSlidesApi.create(data);
    await load();
  };
  const handleToggle = async (id, actif) => { await heroSlidesApi.toggle(id, actif); await load(); };
  const handleDelete = async (id)         => { await heroSlidesApi.delete(id); await load(); };

  const actifs   = slides.filter(s => s.actif);
  const inactifs = slides.filter(s => !s.actif);

  const filtered = slides
    .filter(s => {
      if (filterStatut === "actif"   && !s.actif) return false;
      if (filterStatut === "inactif" &&  s.actif) return false;
      if (search && !s.titre.toLowerCase().includes(search.toLowerCase())
                 && !(s.sous_titre||"").toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a,b) => a.ordre - b.ordre);

  return (
    <div className="hs-page">

      {/* ── Header ──────────────────────────────────────── */}
      <header className="hs-page-header">
        <div className="hs-title-block">
          <div className="hs-eyebrow">
            <span className="hs-eyebrow-dot" />
            Carousel de la page d'accueil
          </div>
          <h1 className="hs-page-title">Hero Slides</h1>
          <p className="hs-page-desc">
            {actifs.length} slide{actifs.length>1?"s":""} actif{actifs.length>1?"s":""} sur {slides.length} au total
          </p>
        </div>
        <div className="hs-header-actions">
          <button className={`hs-btn-preview ${showPreview?"active":""}`}
            onClick={() => setShowPreview(!showPreview)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            {showPreview ? "Masquer" : "Prévisualiser"}
          </button>
          <button className="hs-btn-add" onClick={() => setModal("new")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Ajouter un slide
          </button>
        </div>
      </header>

      {/* ── KPI Cards ───────────────────────────────────── */}
      <div className="hs-kpi-grid">
        {[
          {
            color:"blue", val:slides.length, lbl:"Total", sub:"slides créés",
            icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="3" width="20" height="14" rx="2"/><polyline points="2 10 7 6 11 9 16 5 22 10"/></svg>
          },
          {
            color:"green", val:actifs.length, lbl:"Actifs", sub:"affichés sur le site",
            icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><polyline points="9 11 12 14 22 4"/></svg>
          },
          {
            color:"slate", val:inactifs.length, lbl:"Inactifs", sub:"masqués",
            icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          },
        ].map((k,i) => (
          <div key={i} className={`hs-kpi-card hs-kpi-${k.color}`}>
            <div className="hs-kpi-icon">{k.icon}</div>
            <div className="hs-kpi-body">
              <span className="hs-kpi-val">{k.val}</span>
              <span className="hs-kpi-lbl">{k.lbl}</span>
              <span className="hs-kpi-sub">{k.sub}</span>
            </div>
            <div className="hs-kpi-deco" />
          </div>
        ))}
      </div>

      {/* ── Prévisualisation ────────────────────────────── */}
      {showPreview && !loading && <SliderPreview slides={slides}/>}

      {/* ── Notice ──────────────────────────────────────── */}
      <div className="hs-notice">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        Les slides <strong>actifs</strong> s'affichent dans le <strong>Hero Slider</strong> de la page visiteur, triés par ordre croissant. L'ordre 0 s'affiche en premier.
      </div>

      {/* ── Toolbar ─────────────────────────────────────── */}
      <div className="hs-toolbar">
        <div className="hs-tabs">
          {[["tous","Tous",slides.length],["actif","Actifs",actifs.length],["inactif","Inactifs",inactifs.length]].map(([val,lbl,nb]) => (
            <button key={val} className={`hs-tab ${filterStatut===val?"active":""}`}
              onClick={() => setFilterStatut(val)}>
              <span className={`hs-tab-dot hs-td-${val}`}/>
              {lbl}
              <span className="hs-tab-count">{nb}</span>
            </button>
          ))}
        </div>
        <div className="hs-toolbar-spacer" />
        <label className="hs-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher un slide…"/>
          {search && (
            <button className="hs-search-clear" onClick={() => setSearch("")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="10" height="10">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </label>
        <div className="hs-result-pill">
          <span className="hs-rp-num">{filtered.length}</span>
          <span className="hs-rp-lbl">résultat{filtered.length>1?"s":""}</span>
        </div>
      </div>

      {/* ── États ───────────────────────────────────────── */}
      {loading && (
        <div className="hs-state-box">
          <div className="hs-loader"><div className="hs-loader-ring"/><div className="hs-loader-ring hs-lr2"/></div>
          <p>Chargement des slides…</p>
        </div>
      )}

      {error && (
        <div className="hs-error-bar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          {error}
          <button onClick={load}>Réessayer</button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="hs-state-box">
          <div className="hs-empty-icon">🖼️</div>
          <h3>{search?"Aucun résultat":"Aucun slide"}</h3>
          <p>{search?"Modifiez votre recherche":"Ajoutez votre premier slide hero"}</p>
          {!search && (
            <button className="hs-btn-add" onClick={() => setModal("new")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Ajouter un slide
            </button>
          )}
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="hs-grid">
          {filtered.map((s, i) => (
            <SlideCard key={s.id} slide={s} index={i}
              onEdit={s  => setModal(s)}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {modal && (
        <SlideModal
          slide={modal === "new" ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}