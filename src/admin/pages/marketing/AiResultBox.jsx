// ══════════════════════════════════════════════════════════
//  src/admin/pages/marketing/AiResultBox.jsx
// ══════════════════════════════════════════════════════════

// Nettoyer une valeur — supprimer les expressions n8n non résolues
function clean(val) {
  if (!val) return "";
  const s = String(val).trim();
  // Si la valeur ressemble à une expression n8n non résolue → retourner vide
  if (s.startsWith("{{") || s.startsWith("=")) return "";
  return s;
}

export default function AiResultBox({ loading, result, onChange }) {
  if (!loading && !result) return null;

  // Valeurs nettoyées
  const message  = clean(result?.message);
  const hashtags = clean(result?.hashtags);
  const cta      = clean(result?.cta);

  // Si toutes les valeurs sont vides après nettoyage → afficher erreur
  const isEmpty = !message && !hashtags && !cta;

  return (
    <div className="mkt-ai-box">

      {/* Header */}
      <div className="mkt-ai-head">
        <span className="mkt-ai-badge">
          {loading
            ? <><span className="mkt-spin" /> Claude analyse et génère le contenu...</>
            : isEmpty
            ? "⚠️ Erreur de réception — réessayez"
            : "✦ Contenu généré — modifiez si nécessaire avant de publier"}
        </span>
        {result && !isEmpty && (
          <span className="mkt-ai-hint">✏️ Tout est modifiable</span>
        )}
      </div>

      {/* Erreur si vide */}
      {result && isEmpty && !loading && (
        <div className="mkt-ai-error">
          La réponse de n8n est vide ou mal formatée.
          Vérifiez le node "Respond to Webhook" → choisir <strong>First Incoming Item</strong>.
        </div>
      )}

      {/* Contenu généré */}
      {result && !isEmpty && (
        <>
          {/* Message */}
          <div className="mkt-ai-field-label">Message de la publication</div>
          <textarea
            className="mkt-ai-textarea"
            rows={5}
            value={message}
            onChange={(e) => onChange({ ...result, message: e.target.value })}
            placeholder="Message de la publication..."
          />

          {/* Hashtags */}
          <div className="mkt-ai-field-label">Hashtags</div>
          <input
            className="mkt-input mkt-ai-input"
            type="text"
            value={hashtags}
            onChange={(e) => onChange({ ...result, hashtags: e.target.value })}
            placeholder="#hotel #tunisie..."
          />
          {hashtags && (
            <div className="mkt-ai-tags">
              {hashtags
                .split(" ")
                .filter((h) => h.startsWith("#"))
                .map((h, i) => (
                  <span key={i} className="mkt-hashtag">{h}</span>
                ))}
            </div>
          )}

          {/* CTA */}
          <div className="mkt-ai-field-label">Call to action</div>
          <input
            className="mkt-input mkt-ai-input"
            type="text"
            value={cta}
            onChange={(e) => onChange({ ...result, cta: e.target.value })}
            placeholder="Ex: Réservez maintenant..."
          />

          {/* Aperçu Facebook */}
          <div className="mkt-ai-preview-label">Aperçu du post final</div>
          <div className="mkt-ai-preview">
            <div className="mkt-ai-preview-fb-header">
              <div className="mkt-ai-preview-avatar">EV</div>
              <div>
                <div className="mkt-ai-preview-name">EasyVoyage</div>
                <div className="mkt-ai-preview-sub">À l'instant · 🌐</div>
              </div>
            </div>
            <div className="mkt-ai-preview-text">
              {[message, hashtags, cta].filter(Boolean).join("\n\n")}
            </div>
          </div>
        </>
      )}
    </div>
  );
}