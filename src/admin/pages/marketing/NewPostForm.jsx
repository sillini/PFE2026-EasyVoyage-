// ══════════════════════════════════════════════════════════
//  src/admin/pages/marketing/NewPostForm.jsx
//  REFONTE UI/UX COMPLÈTE — Design SaaS Premium
// ══════════════════════════════════════════════════════════
import { useState } from "react";
import { TYPES, generateWithClaude, publishToFacebook } from "./marketingUtils";
import ImageUploader from "./ImageUploader";
import "./NewPostForm.css";

const STEP_FORM     = "form";
const STEP_GENERATE = "generate";
const STEP_PREVIEW  = "preview";

export default function NewPostForm({ onDone, toast, draft = null }) {
  const isDraftEdit = !!draft;

  const [type,          setType]          = useState(draft?.type_contenu || "hotel");
  const [desc,          setDesc]          = useState(draft?.message      || "");
  const [urls,          setUrls]          = useState(draft?.image_url ? [draft.image_url] : [""]);
  const [ai,            setAi]            = useState(null);
  const [aiLoading,     setAiLoading]     = useState(false);
  const [publishing,    setPublishing]    = useState(false);
  const [step,          setStep]          = useState(isDraftEdit ? STEP_GENERATE : STEP_FORM);
  const [autoTriggered, setAutoTriggered] = useState(false);

  const validUrls   = urls.filter(u => u && u.trim() !== "" && u.startsWith("https://"));
  const canGenerate = desc.trim().length > 0 || validUrls.length > 0;

  if (step === STEP_GENERATE && !autoTriggered && !aiLoading && !ai) {
    setAutoTriggered(true);
    setTimeout(() => handleGenerate(), 100);
  }

  async function handleGenerate() {
    if (!canGenerate) { setStep(STEP_FORM); return; }
    setAiLoading(true); setAi(null);
    try {
      const result = await generateWithClaude({ description: desc, type, imageUrls: validUrls });
      setAi(result);
      setStep(STEP_PREVIEW);
    } catch (err) {
      toast(`Erreur Claude : ${err.message}`, "error");
      setStep(STEP_FORM);
    }
    setAiLoading(false);
  }

  const handlePublish = async () => {
    if (!ai) return;
    const finalUrls    = urls.filter(u => u && u.trim() !== "" && u.startsWith("https://"));
    const messageFinal = [ai.message, ai.hashtags, ai.cta].filter(Boolean).join("\n\n");
    setPublishing(true);
    try {
      const result = await publishToFacebook({ message: messageFinal, imageUrls: finalUrls, scheduledTime: "" });
      const raw    = Array.isArray(result) ? result[0] : result;
      const postId = raw?.post_id || raw?.id || null;
      toast(postId ? "🎉 Publié sur Facebook avec succès !" : "✅ Publication envoyée !", "success");
      onDone({ id: draft?.id || Date.now(), type, message: messageFinal, images: finalUrls, status: "published", post_id: postId, draftId: draft?.id || null });
    } catch (err) { toast(`Erreur publication : ${err.message}`, "error"); }
    setPublishing(false);
  };

  const handleDraft = () => {
    if (!desc.trim() && !validUrls.length) { toast("Ajoutez une description ou une image", "error"); return; }
    onDone({ id: draft?.id || Date.now(), type, message: desc, images: validUrls, status: "draft", draftId: draft?.id || null });
  };

  const goBack = () => { setStep(STEP_FORM); setAi(null); setAutoTriggered(false); };

  const STEPS_DEF = [
    { id: STEP_FORM,     n: 1, label: "Contenu"       },
    { id: STEP_GENERATE, n: 2, label: "Génération IA" },
    { id: STEP_PREVIEW,  n: 3, label: "Publication"   },
  ];

  /* ════════════════ STEP 1 ════════════════ */
  if (step === STEP_FORM) return (
    <div className="npf-root">
      <div className="npf-header">
        <div>
          <div className="npf-eyebrow"><span className="npf-eyebrow-dot" />{isDraftEdit ? "Modifier le brouillon" : "Nouvelle publication"}</div>
          <h2 className="npf-title">{isDraftEdit ? "✏️ Compléter le contenu" : "Créer une publication Facebook"}</h2>
        </div>
        <StepBar steps={STEPS_DEF} currentIdx={0} />
      </div>

      {isDraftEdit && (
        <div className="npf-draft-banner">
          ✏️ Modifiez le contenu puis cliquez sur <strong>Générer avec l'IA</strong> pour passer à la validation.
        </div>
      )}

      <div className="npf-body">
        {/* TYPE */}
        <div className="npf-section">
          <label className="npf-section-label"><TypeIcon /> Type de contenu</label>
          <div className="npf-type-grid">
            {TYPES.map(t => (
              <button key={t.id} type="button"
                className={`npf-type-btn ${type === t.id ? "npf-type-btn--active" : ""} npf-type-${t.id}`}
                onClick={() => setType(t.id)}
              >
                <span className="npf-type-emoji">{t.emoji}</span>
                <span className="npf-type-label">{t.label}</span>
                {type === t.id && <span className="npf-type-check">✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* DESCRIPTION */}
        <div className="npf-section">
          <label className="npf-section-label">
            <AiIcon /> Description <span className="npf-optional">(l'IA l'utilisera comme base)</span>
          </label>
          <div className="npf-textarea-wrap">
            <textarea
              className="npf-textarea" rows={4}
              placeholder="Ex: Chambre deluxe vue mer, -20% ce weekend — l'IA va créer un post engageant à partir de ça..."
              value={desc} onChange={e => setDesc(e.target.value)}
            />
            <div className="npf-textarea-count">{desc.length} car.</div>
          </div>
        </div>

        {/* IMAGES */}
        <div className="npf-section">
          <label className="npf-section-label">
            <ImageIcon /> Images Cloudinary
            {validUrls.length > 0 && <span className="npf-img-count">{validUrls.length} prête{validUrls.length > 1 ? "s" : ""}</span>}
          </label>
          <ImageUploader urls={urls} onChange={setUrls} />
        
        </div>
      </div>

      <div className="npf-footer">
        <button className="npf-btn npf-btn--ghost" onClick={handleDraft}>
          <DraftIcon /> {isDraftEdit ? "Sauvegarder" : "Brouillon"}
        </button>
        <button className="npf-btn npf-btn--ai" onClick={() => setStep(STEP_GENERATE)} disabled={!canGenerate}>
          <span className="npf-ai-sparkle">✨</span> Générer avec l'IA <span className="npf-btn-arrow">→</span>
        </button>
      </div>
    </div>
  );

  /* ════════════════ STEP 2 ════════════════ */
  if (step === STEP_GENERATE) return (
    <div className="npf-root">
      <div className="npf-header">
        <div>
          <div className="npf-eyebrow"><span className="npf-eyebrow-dot" /> Génération en cours</div>
          <h2 className="npf-title">✨ L'IA rédige votre publication…</h2>
        </div>
        <StepBar steps={STEPS_DEF} currentIdx={1} />
      </div>
      <div className="npf-body">
        <div className="npf-summary-card">
          <div className="npf-summary-header">
            <span className="npf-summary-icon">📋</span>
            <span className="npf-summary-title">Contenu fourni à l'IA</span>
            <button className="npf-btn-link" onClick={goBack}>← Modifier</button>
          </div>
          <div className="npf-summary-body">
            <SummaryRow label="Type" value={`${TYPES.find(t => t.id === type)?.emoji} ${TYPES.find(t => t.id === type)?.label}`} />
            {desc && <SummaryRow label="Description" value={desc} />}
            {validUrls[0] && (
              <div className="npf-summary-row">
                <span className="npf-summary-label">Image</span>
                <div className="npf-summary-thumb">
                  <img src={validUrls[0]} alt="preview" />
                  {validUrls.length > 1 && <span className="npf-summary-thumb-more">+{validUrls.length - 1}</span>}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="npf-ai-loading">
          <div className="npf-ai-loading-orb">
            <div className="npf-ai-orb-ring npf-ai-orb-ring--1" />
            <div className="npf-ai-orb-ring npf-ai-orb-ring--2" />
            <div className="npf-ai-orb-ring npf-ai-orb-ring--3" />
            <span className="npf-ai-orb-icon">✦</span>
          </div>
          <p className="npf-ai-loading-title">Claude analyse votre contenu</p>
          <p className="npf-ai-loading-sub">Rédaction optimisée pour Facebook en cours…</p>
          <div className="npf-ai-dots"><span /><span /><span /></div>
        </div>
      </div>
    </div>
  );

  /* ════════════════ STEP 3 ════════════════ */
  if (step === STEP_PREVIEW && ai) {
    const message  = ai.message  || "";
    const hashtags = ai.hashtags || "";
    const cta      = ai.cta      || "";
    const fullText = [message, hashtags, cta].filter(Boolean).join("\n\n");

    return (
      <div className="npf-root">
        <div className="npf-header">
          <div>
            <div className="npf-eyebrow"><span className="npf-eyebrow-dot" /> Validation & Publication</div>
            <h2 className="npf-title">{isDraftEdit ? "✅ Valider et publier le brouillon" : "✅ Valider le contenu généré"}</h2>
          </div>
          <StepBar steps={STEPS_DEF} currentIdx={2} />
        </div>

        <div className="npf-preview-cols">
          {/* Col gauche */}
          <div className="npf-edit-col">
            <div className="npf-ai-success-banner">
              <span>✦</span>
              <span>Contenu généré — modifiez librement avant de publier</span>
              <span className="npf-ai-hint-badge">✏️ Tout est éditable</span>
            </div>

            {validUrls.length > 0 && (
              <div className="npf-field">
                <p className="npf-field-label">📸 Images ({validUrls.length})</p>
                <div className="npf-img-previews">
                  {validUrls.map((u, i) => (
                    <div key={i} className="npf-img-preview">
                      <img src={u} alt={`img-${i + 1}`} />
                      <span className="npf-img-preview-n">{i + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="npf-field">
              <label className="npf-field-label">Message de la publication</label>
              <textarea className="npf-edit-textarea" rows={6}
                value={message} onChange={e => setAi({ ...ai, message: e.target.value })} />
            </div>

            <div className="npf-field">
              <label className="npf-field-label">Hashtags</label>
              <input className="npf-edit-input" type="text" value={hashtags}
                onChange={e => setAi({ ...ai, hashtags: e.target.value })} placeholder="#hotel #tunisie..." />
              {hashtags && (
                <div className="npf-hashtag-pills">
                  {hashtags.split(/\s+/).filter(h => h.startsWith("#")).map((h, i) => (
                    <span key={i} className="npf-hashtag-pill">{h}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="npf-field">
              <label className="npf-field-label">Call to action</label>
              <input className="npf-edit-input" type="text" value={cta}
                onChange={e => setAi({ ...ai, cta: e.target.value })} placeholder="Ex: Réservez maintenant…" />
            </div>
          </div>

          {/* Col droite — Aperçu Facebook */}
          <div className="npf-preview-col">
            <p className="npf-field-label" style={{ marginBottom: 14 }}>Aperçu Facebook</p>
            <div className="npf-fb-preview">
              <div className="npf-fb-hd">
                <div className="npf-fb-avatar">EV</div>
                <div className="npf-fb-hd-info">
                  <span className="npf-fb-page">EasyVoyage</span>
                  <span className="npf-fb-time">À l'instant · 🌐</span>
                </div>
                <span className="npf-fb-more">···</span>
              </div>
              <div className="npf-fb-text">{fullText}</div>
              {validUrls[0] && (
                <div className="npf-fb-img-wrap">
                  <img src={validUrls[0]} alt="" className="npf-fb-img" />
                  {validUrls.length > 1 && (
                    <div className="npf-fb-img-more">+{validUrls.length - 1} photo{validUrls.length - 1 > 1 ? "s" : ""}</div>
                  )}
                </div>
              )}
              <div className="npf-fb-reactions">
                <span className="npf-fb-reaction-zero">Soyez le premier à réagir</span>
              </div>
              <div className="npf-fb-actions">
                <button className="npf-fb-act">👍 J'aime</button>
                <button className="npf-fb-act">💬 Commenter</button>
                <button className="npf-fb-act">↗️ Partager</button>
              </div>
            </div>
          </div>
        </div>

        <div className="npf-footer npf-footer--preview">
          <button className="npf-btn npf-btn--ghost" onClick={goBack}>← Modifier le contenu</button>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="npf-btn npf-btn--draft" onClick={handleDraft}>
              <DraftIcon /> Garder en brouillon
            </button>
            <button className="npf-btn npf-btn--publish" onClick={handlePublish} disabled={publishing || !ai}>
              {publishing ? <><span className="npf-spin" /> Publication…</> : <><FbIcon /> Publier sur Facebook</>}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function StepBar({ steps, currentIdx }) {
  return (
    <div className="npf-stepbar">
      {steps.map((s, i) => (
        <div key={s.id} className="npf-step-item">
          <div className={`npf-step-node ${i < currentIdx ? "npf-step-done" : i === currentIdx ? "npf-step-active" : "npf-step-todo"}`}>
            {i < currentIdx ? "✓" : s.n}
          </div>
          <span className={`npf-step-lbl ${i === currentIdx ? "npf-step-lbl--active" : ""}`}>{s.label}</span>
          {i < steps.length - 1 && <div className={`npf-step-line ${i < currentIdx ? "npf-step-line--done" : ""}`} />}
        </div>
      ))}
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="npf-summary-row">
      <span className="npf-summary-label">{label}</span>
      <span className="npf-summary-value">{value}</span>
    </div>
  );
}

const TypeIcon  = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
const AiIcon    = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const ImageIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>;
const DraftIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
const FbIcon    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>;