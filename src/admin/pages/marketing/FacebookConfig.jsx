// ══════════════════════════════════════════════════════════
//  src/admin/pages/marketing/FacebookConfig.jsx
//  Sauvegarde le token en BDD ET en localStorage (fallback)
// ══════════════════════════════════════════════════════════
import { useState } from "react";
import { facebookConfigApi } from "../../services/publicationFacebookApi";

export default function FacebookConfig({ config, onSaved, onBack, toast }) {
  const [token,     setToken]     = useState("");
  const [pageId,    setPageId]    = useState(config?.page_id   || "");
  const [pageName,  setPageName]  = useState(config?.page_name || "");
  const [saving,    setSaving]    = useState(false);
  const [showToken, setShowToken] = useState(false);

  const handleSave = async () => {
    if (!token.trim() && !config?.token_actif) {
      toast("Le token Facebook est requis", "error");
      return;
    }
    if (!pageId.trim()) {
      toast("Le Page ID est requis", "error");
      return;
    }

    setSaving(true);
    try {
      const saved = await facebookConfigApi.save({
        page_access_token: token.trim() || "__keep__", // backend garde l'ancien si vide
        page_id:           pageId.trim(),
        page_name:         pageName.trim() || undefined,
      });

      // ✅ Sauvegarder aussi en localStorage comme fallback
      if (token.trim()) {
        localStorage.setItem("fb_token", token.trim());
        console.log("✅ Token FB sauvegardé en localStorage");
      }
      localStorage.setItem("fb_page_id", pageId.trim());

      onSaved(saved);
    } catch (err) {
      toast(`Erreur : ${err.message}`, "error");
    }
    setSaving(false);
  };

  return (
    <div className="mkt-card">
      <div className="mkt-card-header">
        <button className="mkt-btn mkt-btn--ghost-sm" onClick={onBack} type="button">
          ← Retour
        </button>
        <span className="mkt-card-icon" style={{ marginLeft: 4 }}>⚙️</span>
        <span className="mkt-card-title">Configuration Facebook</span>
        {config?.token_actif && (
          <span className="mkt-config-badge mkt-config-badge--ok" style={{ marginLeft: "auto" }}>
            ● Token actif
          </span>
        )}
      </div>

      {/* Infos actuelles */}
      {config?.page_name && (
        <div className="mkt-config-info">
          <div className="mkt-config-info-row">
            <span className="mkt-config-info-label">Page connectée</span>
            <span className="mkt-config-info-value">{config.page_name}</span>
          </div>
          <div className="mkt-config-info-row">
            <span className="mkt-config-info-label">Page ID</span>
            <span className="mkt-config-info-value">{config.page_id}</span>
          </div>
          {config.token_expires_at && (
            <div className="mkt-config-info-row">
              <span className="mkt-config-info-label">Expire le</span>
              <span className="mkt-config-info-value" style={{
                color: new Date(config.token_expires_at) < new Date() ? "var(--red)" : "inherit"
              }}>
                {new Date(config.token_expires_at).toLocaleDateString("fr-FR", {
                  day: "2-digit", month: "long", year: "numeric",
                })}
                {new Date(config.token_expires_at) < new Date() && " ⚠️ Expiré !"}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Page ID */}
      <div className="mkt-field">
        <label className="mkt-label">
          Page ID Facebook <span style={{ color: "var(--red)" }}>*</span>
        </label>
        <input
          className="mkt-input" type="text"
          placeholder="Ex: 988622240995767"
          value={pageId}
          onChange={(e) => setPageId(e.target.value)}
        />
      </div>

      {/* Nom de la page */}
      <div className="mkt-field">
        <label className="mkt-label">Nom de la page</label>
        <input
          className="mkt-input" type="text"
          placeholder="Ex: Easy_Voyage"
          value={pageName}
          onChange={(e) => setPageName(e.target.value)}
        />
      </div>

      {/* Token */}
      <div className="mkt-field">
        <label className="mkt-label">
          {config?.token_actif
            ? "Nouveau token (laisser vide pour garder l'actuel)"
            : "Page Access Token *"}
        </label>
        <div style={{ position: "relative" }}>
          <input
            className="mkt-input"
            type={showToken ? "text" : "password"}
            placeholder="EAAOBesJd2wMBR..."
            value={token}
            onChange={(e) => setToken(e.target.value)}
            style={{ paddingRight: 80 }}
          />
          <button
            type="button"
            onClick={() => setShowToken(!showToken)}
            style={{
              position: "absolute", right: 10, top: "50%",
              transform: "translateY(-50%)",
              background: "none", border: "none",
              color: "var(--t3)", cursor: "pointer",
              fontSize: "0.78rem", fontFamily: "'Lato', sans-serif",
            }}
          >
            {showToken ? "Masquer" : "Afficher"}
          </button>
        </div>
        <p className="mkt-config-hint">
          Obtenez votre token sur{" "}
          <a href="https://developers.facebook.com/tools/explorer" target="_blank" rel="noreferrer">
            Meta Graph API Explorer
          </a>. Le token dure 60 jours.
        </p>
      </div>

      {/* Actions */}
      <div className="mkt-form-actions">
        <button className="mkt-btn mkt-btn--ghost" type="button" onClick={onBack}>
          ← Retour
        </button>
        <button className="mkt-btn mkt-btn--primary" onClick={handleSave} disabled={saving}>
          {saving ? <><span className="mkt-spin" /> Sauvegarde...</> : "💾 Sauvegarder"}
        </button>
      </div>
    </div>
  );
}