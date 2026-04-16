// src/admin/pages/video-campaigns/VCcreate.jsx — v4
// CORRECTION : A/B Testing supprimé
import { useState } from "react";
import "./VCcreate.css";
import { BASE, auth, TON_CFG, FORMAT_CFG } from "./constants";

export default function VCcreate({ voyages, onCreated, onCancel }) {
  const [form, setForm] = useState({
    titre:     "",
    voyage_id: "",
    ton:       "LUXE",
    formats:   ["LANDSCAPE"],
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleFormat = (fmt) =>
    setForm(f => ({
      ...f,
      formats: f.formats.includes(fmt)
        ? f.formats.filter(x => x !== fmt)
        : [...f.formats, fmt],
    }));

  const handleVoyageChange = (e) => {
    const id = e.target.value;
    const v  = voyages.find(v => String(v.id) === id);
    setForm(f => ({
      ...f,
      voyage_id: id,
      titre:     f.titre || (v ? `Campagne — ${v.titre}` : ""),
    }));
  };

  const handleSubmit = async () => {
    if (!form.titre.trim())        return setError("Le titre est obligatoire");
    if (!form.voyage_id)           return setError("Sélectionnez un voyage");
    if (form.formats.length === 0) return setError("Choisissez au moins un format vidéo");

    const voyage = voyages.find(v => String(v.id) === form.voyage_id);
    if (!voyage) return setError("Voyage introuvable");

    setSaving(true);
    setError("");
    try {
      const r = await fetch(`${BASE}/video-campaigns`, {
        method:  "POST",
        headers: auth(),
        body:    JSON.stringify({
          titre:       form.titre.trim(),
          destination: voyage.destination,
          voyage_id:   Number(form.voyage_id),
          hotel_id:    null,
          ton:         form.ton,
          formats:     form.formats,
          segment:     "tous",
          ab_enabled:  false,
        }),
      });
      if (!r.ok) throw new Error((await r.json()).detail || "Erreur création");
      onCreated(await r.json());
    } catch (e) {
      setError(e.message);
    }
    setSaving(false);
  };

  const selectedVoyage = voyages.find(v => String(v.id) === form.voyage_id);

  return (
    <div className="vcc-wrapper">
      <div className="vcc-topbar">
        <button className="vc-btn-ghost" onClick={onCancel}>← Retour</button>
        <h2 className="vcc-topbar-title">Nouvelle campagne vidéo</h2>
        <div className="vcc-topbar-actions">
          <button className="vc-btn-ghost" onClick={onCancel}>Annuler</button>
          <button className="vc-btn-gold" onClick={handleSubmit} disabled={saving}>
            {saving
              ? <><span className="vc-spinner" style={{width:14,height:14}}/>Création...</>
              : "✓ Créer la campagne"}
          </button>
        </div>
      </div>

      <div className="vcc-body">
        {error && <div className="vcc-error">⚠ {error}</div>}

        {/* Section 1 : Voyage */}
        <div className="vc-card vcc-section">
          <div className="vc-card__header">
            <h3 className="vc-card__title">✈️ Voyage à promouvoir</h3>
            <span className="vcc-section-note">Claude génère la description depuis les données réelles du voyage</span>
          </div>
          <div className="vc-card__body vcc-grid">
            <div className="vcc-field vcc-field--full">
              <label className="vc-label">Voyage *</label>
              <select className="vc-select" value={form.voyage_id} onChange={handleVoyageChange}>
                <option value="">— Choisir un voyage —</option>
                {voyages.filter(v => v.actif).map(v => {
                  const places = v.places_restantes ?? (v.capacite_max - (v.nb_inscrits || 0));
                  return (
                    <option key={v.id} value={v.id} disabled={places <= 0}>
                      {v.titre} — {v.destination} — {v.duree}j — {v.prix_base} DT
                      {places <= 0 ? " (Complet)" : places <= 5 ? ` (${places} places)` : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            {selectedVoyage && (
              <div className="vcc-voyage-preview vcc-field--full">
                <div className="vcc-voyage-preview__row">
                  <span>📍</span><strong>{selectedVoyage.destination}</strong>
                  <span className="vcc-voyage-preview__sep">·</span>
                  <span>{selectedVoyage.duree} jours</span>
                  <span className="vcc-voyage-preview__sep">·</span>
                  <span className="vcc-voyage-preview__price">{selectedVoyage.prix_base} DT/pers.</span>
                </div>
                {selectedVoyage.description && (
                  <p className="vcc-voyage-preview__desc">{selectedVoyage.description.slice(0, 120)}...</p>
                )}
                <p className="vcc-voyage-preview__hint">
                  💡 Claude utilise ces données réelles pour générer le contenu marketing
                </p>
              </div>
            )}

            <div className="vcc-field vcc-field--full">
              <label className="vc-label">Titre de la campagne *</label>
              <input className="vc-input"
                placeholder="Ex : Été 2026 — Djerba Luxe"
                value={form.titre}
                onChange={e => set("titre", e.target.value)} />
              <p className="vcc-hint">Pré-rempli automatiquement à la sélection du voyage</p>
            </div>
          </div>
        </div>

        {/* Section 2 : Ton */}
        <div className="vc-card vcc-section">
          <div className="vc-card__header">
            <h3 className="vc-card__title">🎨 Ton & Style</h3>
            <span className="vcc-section-note">Influence le style visuel et éditorial de la vidéo</span>
          </div>
          <div className="vc-card__body">
            <div className="vcc-ton-grid">
              {Object.entries(TON_CFG).map(([key, cfg]) => (
                <button key={key}
                  className={`vcc-ton-btn ${form.ton === key ? "vcc-ton-btn--active" : ""}`}
                  style={form.ton === key ? { borderColor: cfg.color, color: cfg.color } : {}}
                  onClick={() => set("ton", key)}>
                  <span className="vcc-ton-emoji">{cfg.emoji}</span>
                  <span className="vcc-ton-label">{cfg.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section 3 : Formats */}
        <div className="vc-card vcc-section">
          <div className="vc-card__header">
            <h3 className="vc-card__title">📐 Formats vidéo</h3>
            <span className="vcc-section-note">minimax/video-01 génère en 720p 25fps — une vidéo par format</span>
          </div>
          <div className="vc-card__body">
            <div className="vcc-format-grid">
              {Object.entries(FORMAT_CFG).map(([key, cfg]) => (
                <label key={key}
                  className={`vcc-format-btn ${form.formats.includes(key) ? "vcc-format-btn--active" : ""}`}>
                  <input type="checkbox"
                    checked={form.formats.includes(key)}
                    onChange={() => toggleFormat(key)}
                    style={{ display: "none" }} />
                  <span className="vcc-format-icon">{cfg.icon}</span>
                  <span className="vcc-format-label">{cfg.label}</span>
                  {form.formats.includes(key) && <span className="vcc-format-check">✓</span>}
                </label>
              ))}
            </div>
            <p className="vcc-hint" style={{marginTop:10}}>
              ⚠️ Chaque format génère une vidéo séparée — le temps de génération est multiplié
            </p>
          </div>
        </div>

        {/* Note finale */}
        <div className="vcc-footer-note">
          📤 Les destinataires et options avancées seront configurés lors de l'envoi
        </div>
      </div>
    </div>
  );
}