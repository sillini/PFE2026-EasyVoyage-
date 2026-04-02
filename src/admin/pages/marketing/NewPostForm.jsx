// ══════════════════════════════════════════════════════════
//  src/admin/pages/marketing/NewPostForm.jsx
//
//  FLUX BROUILLON : saute directement à l'étape 2 (IA)
//  FLUX NOUVEAU   : commence à l'étape 1 (formulaire)
// ══════════════════════════════════════════════════════════
import { useState } from "react";
import { TYPES, generateWithClaude, publishToFacebook } from "./marketingUtils";
import ImageUploader from "./ImageUploader";
import AiResultBox   from "./AiResultBox";

const STEP_FORM     = "form";
const STEP_GENERATE = "generate"; // génération IA en cours (brouillon)
const STEP_PREVIEW  = "preview";

export default function NewPostForm({ onDone, toast, draft = null }) {
  const isDraftEdit = !!draft;

  // Préremplir avec les données du brouillon
  const [type,       setType]       = useState(draft?.type_contenu || "hotel");
  const [desc,       setDesc]       = useState(draft?.message      || "");
  const [urls,       setUrls]       = useState(
    draft?.image_url ? [draft.image_url] : [""]
  );
  const [ai,         setAi]         = useState(null);
  const [aiLoading,  setAiLoading]  = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Si c'est un brouillon → démarrer directement à GENERATE (IA)
  const [step, setStep] = useState(isDraftEdit ? STEP_GENERATE : STEP_FORM);

  const validUrls   = urls.filter((u) => u && u.trim() !== "" && u.startsWith("https://"));
  const canGenerate = desc.trim().length > 0 || validUrls.length > 0;

  // Lancer automatiquement la génération IA si on arrive sur STEP_GENERATE
  const [autoGenTriggered, setAutoGenTriggered] = useState(false);

  if (step === STEP_GENERATE && !autoGenTriggered && !aiLoading && !ai) {
    setAutoGenTriggered(true);
    // Lancer la génération automatiquement
    setTimeout(() => handleGenerate(), 100);
  }

  /* ── Générer avec Claude ── */
  async function handleGenerate() {
    if (!canGenerate) {
      // Si pas de contenu → revenir au formulaire
      setStep(STEP_FORM);
      return;
    }
    setAiLoading(true);
    setAi(null);
    try {
      const result = await generateWithClaude({
        description: desc,
        type,
        imageUrls:   validUrls,
      });
      setAi(result);
      setStep(STEP_PREVIEW);
    } catch (err) {
      toast(`Erreur Claude : ${err.message}`, "error");
      setStep(isDraftEdit ? STEP_FORM : STEP_FORM);
    }
    setAiLoading(false);
  }

  /* ── Publier sur Facebook ── */
  const handlePublish = async () => {
    if (!ai) return;
    const finalUrls    = urls.filter((u) => u && u.trim() !== "" && u.startsWith("https://"));
    const messageFinal = [ai.message, ai.hashtags, ai.cta].filter(Boolean).join("\n\n");

    setPublishing(true);
    try {
      const result = await publishToFacebook({
        message:       messageFinal,
        imageUrls:     finalUrls,
        scheduledTime: "",
      });

      const raw    = Array.isArray(result) ? result[0] : result;
      const postId = raw?.post_id || raw?.id || null;

      toast(postId ? "🎉 Publié sur Facebook avec succès !" : "✅ Publication envoyée !", "success");

      onDone({
        id:      draft?.id || Date.now(),
        type,
        message: messageFinal,
        images:  finalUrls,
        status:  "published",
        post_id: postId,
        draftId: draft?.id || null,
      });
    } catch (err) {
      toast(`Erreur publication : ${err.message}`, "error");
    }
    setPublishing(false);
  };

  /* ── Sauvegarder en brouillon ── */
  const handleDraft = () => {
    if (!desc.trim() && !validUrls.length) {
      toast("Ajoutez une description ou une image", "error");
      return;
    }
    onDone({
      id:      draft?.id || Date.now(),
      type,
      message: desc,
      images:  validUrls,
      status:  "draft",
      draftId: draft?.id || null,
    });
    toast("💾 Brouillon enregistré", "info");
  };

  /* ── Indicateur d'étape ── */
  const StepIndicator = () => (
    <div className="mkt-steps">
      <span className={`mkt-step ${step === STEP_FORM ? "active" : "done"}`}>1 Contenu</span>
      <span className="mkt-step-arrow">→</span>
      <span className={`mkt-step ${step === STEP_GENERATE || step === STEP_PREVIEW ? "active" : ""}`}>
        2 Validation IA
      </span>
      <span className="mkt-step-arrow">→</span>
      <span className="mkt-step">3 Publication</span>
    </div>
  );

  /* ══════════════════════════════════════════════════════
     STEP_GENERATE — Génération IA automatique (brouillon)
  ══════════════════════════════════════════════════════ */
  if (step === STEP_GENERATE) {
    return (
      <div className="mkt-card">
        <div className="mkt-card-header">
          <span className="mkt-card-icon">✦</span>
          <span className="mkt-card-title">✏️ Compléter le brouillon</span>
          <StepIndicator />
        </div>

        {/* Résumé du brouillon */}
        <div className="mkt-draft-summary">
          <div className="mkt-draft-summary-row">
            <span className="mkt-draft-summary-label">Type</span>
            <span className="mkt-draft-summary-value">
              {TYPES.find((t) => t.id === type)?.emoji} {TYPES.find((t) => t.id === type)?.label}
            </span>
          </div>
          {desc && (
            <div className="mkt-draft-summary-row">
              <span className="mkt-draft-summary-label">Description</span>
              <span className="mkt-draft-summary-value">{desc}</span>
            </div>
          )}
          {validUrls[0] && (
            <div className="mkt-draft-summary-row">
              <span className="mkt-draft-summary-label">Image</span>
              <div className="mkt-draft-thumb">
                <img src={validUrls[0]} alt="preview" />
              </div>
            </div>
          )}
          <button
            className="mkt-btn mkt-btn--ghost-sm"
            style={{ marginTop: 8 }}
            onClick={() => { setStep(STEP_FORM); setAutoGenTriggered(false); }}
          >
            ← Modifier le contenu
          </button>
        </div>

        {/* IA en cours */}
        <AiResultBox loading={true} result={null} onChange={setAi} />
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════
     STEP_PREVIEW — Valider le contenu IA et publier
  ══════════════════════════════════════════════════════ */
  if (step === STEP_PREVIEW) {
    return (
      <div className="mkt-card">
        <div className="mkt-card-header">
          <span className="mkt-card-icon">✦</span>
          <span className="mkt-card-title">
            {isDraftEdit ? "✏️ Valider et publier le brouillon" : "Valider et publier"}
          </span>
          <StepIndicator />
        </div>

        {/* Résumé images */}
        {validUrls.length > 0 && (
          <div className="mkt-preview-images-summary">
            <span className="mkt-label">
              📸 {validUrls.length} image{validUrls.length > 1 ? "s" : ""} à publier
            </span>
            <div className="mkt-previews">
              {validUrls.map((u, i) => (
                <div key={i} className="mkt-preview-item">
                  <img src={u} alt={`img-${i + 1}`} />
                  <span className="mkt-preview-n">{i + 1}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Résultat IA éditable */}
        <AiResultBox loading={false} result={ai} onChange={setAi} />

        {/* Actions */}
        <div className="mkt-form-actions">
          <button
            className="mkt-btn mkt-btn--ghost"
            type="button"
            onClick={() => {
              setStep(STEP_FORM);
              setAi(null);
              setAutoGenTriggered(false);
            }}
          >
            ← Modifier le contenu
          </button>
          <button
            className="mkt-btn mkt-btn--ghost"
            type="button"
            onClick={handleDraft}
          >
            💾 Garder en brouillon
          </button>
          <button
            className="mkt-btn mkt-btn--primary"
            type="button"
            onClick={handlePublish}
            disabled={publishing || !ai}
          >
            {publishing
              ? <><span className="mkt-spin" /> Publication en cours...</>
              : "🚀 Publier sur Facebook"}
          </button>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════
     STEP_FORM — Formulaire de contenu
  ══════════════════════════════════════════════════════ */
  return (
    <div className="mkt-card">
      <div className="mkt-card-header">
        <span className="mkt-card-icon">✦</span>
        <span className="mkt-card-title">
          {isDraftEdit ? "✏️ Modifier le brouillon" : "Nouvelle publication Facebook"}
        </span>
        <StepIndicator />
      </div>

      {isDraftEdit && (
        <div className="mkt-draft-edit-banner">
          ✏️ Modifiez le contenu puis cliquez sur "Générer avec l'IA" pour passer à la publication.
        </div>
      )}

      {/* Type */}
      <div className="mkt-field">
        <label className="mkt-label">Type de contenu</label>
        <div className="mkt-type-row">
          {TYPES.map((t) => (
            <button key={t.id} type="button"
              className={`mkt-type-btn ${type === t.id ? "active" : ""}`}
              onClick={() => setType(t.id)}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="mkt-field">
        <label className="mkt-label">
          Description <span className="mkt-opt">(l'IA l'utilisera)</span>
        </label>
        <textarea
          className="mkt-textarea" rows={4}
          placeholder="Ex: Chambre deluxe vue mer, -20% ce weekend..."
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
      </div>

      {/* Images */}
      <ImageUploader urls={urls} onChange={(newUrls) => setUrls(newUrls)} />

      {validUrls.length > 0 && (
        <div className="mkt-images-count-info">
          ✅ {validUrls.length} image{validUrls.length > 1 ? "s" : ""} prête{validUrls.length > 1 ? "s" : ""}
        </div>
      )}

      {/* Actions */}
      <div className="mkt-form-actions">
        {!isDraftEdit && (
          <button className="mkt-btn mkt-btn--ghost" type="button" onClick={handleDraft}>
            💾 Brouillon
          </button>
        )}
        {isDraftEdit && (
          <button className="mkt-btn mkt-btn--ghost" type="button" onClick={handleDraft}>
            💾 Sauvegarder les modifications
          </button>
        )}
        <button
          className="mkt-btn mkt-btn--primary" type="button"
          onClick={handleGenerate}
          disabled={!canGenerate || aiLoading}
        >
          {aiLoading
            ? <><span className="mkt-spin" /> Génération...</>
            : "✨ Générer avec l'IA →"}
        </button>
      </div>
    </div>
  );
}