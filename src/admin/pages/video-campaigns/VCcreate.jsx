// src/admin/pages/video-campaigns/VCcreate.jsx
// MISE À JOUR : voyages uniquement, hotel_id retiré
import { useState } from "react";
import "./VCcreate.css";
import { BASE, auth, TON_CFG, FORMAT_CFG } from "./constants";

export default function VCcreate({ voyages, onCreated, onCancel }) {
  const [form, setForm] = useState({
    titre:      "",
    voyage_id:  "",
    ton:        "LUXE",
    formats:    ["LANDSCAPE"],
    segment:    "tous",
    ab_enabled: false,
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleFormat = (fmt) => {
    setForm(f => ({
      ...f,
      formats: f.formats.includes(fmt)
        ? f.formats.filter(x => x !== fmt)
        : [...f.formats, fmt],
    }));
  };

  // Quand un voyage est choisi → pré-remplir titre + destination automatiquement
  const handleVoyageChange = (e) => {
    const id = e.target.value;
    set("voyage_id", id);
    if (id) {
      const v = voyages.find(v => String(v.id) === id);
      if (v) {
        setForm(f => ({
          ...f,
          voyage_id:   id,
          titre:       f.titre || `Campagne — ${v.titre}`,
          destination: v.destination,
        }));
      }
    }
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
      const body = {
        titre:       form.titre.trim(),
        destination: voyage.destination,   // destination réelle du voyage
        voyage_id:   Number(form.voyage_id),
        hotel_id:    null,
        ton:         form.ton,
        formats:     form.formats,
        segment:     form.segment,
        ab_enabled:  form.ab_enabled,
      };
      const r = await fetch(`${BASE}/video-campaigns`, {
        method: "POST", headers: auth(), body: JSON.stringify(body),
      });
      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.detail || "Erreur création");
      }
      onCreated(await r.json());
    } catch (e) {
      setError(e.message);
    }
    setSaving(false);
  };

  return (
    <div className="vcc-wrapper">
      {/* ── Topbar ────────────────────────────────────── */}
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

      {/* ── Corps ─────────────────────────────────────── */}
      <div className="vcc-body">

        {error && <div className="vcc-error">⚠ {error}</div>}

        {/* Section 1 : Voyage */}
        <div className="vc-card vcc-section">
          <div className="vc-card__header">
            <h3 className="vc-card__title">✈️ Voyage à promouvoir</h3>
            <span className="vcc-section-note">
              Claude générera la description automatiquement depuis les données du voyage
            </span>
          </div>
          <div className="vc-card__body vcc-grid">

            {/* Sélection voyage */}
            <div className="vcc-field vcc-field--full">
              <label className="vc-label">Voyage *</label>
              <select
                className="vc-select"
                value={form.voyage_id}
                onChange={handleVoyageChange}
              >
                <option value="">— Choisir un voyage —</option>
                {voyages
                  .filter(v => v.actif)
                  .map(v => {
                    const places = v.places_restantes ?? (v.capacite_max - (v.nb_inscrits || 0));
                    const complet = places <= 0;
                    return (
                      <option key={v.id} value={v.id} disabled={complet}>
                        {v.titre} — {v.destination} — {v.duree}j — {v.prix_base} DT
                        {complet ? " (Complet)" : places <= 5 ? ` (${places} places)` : ""}
                      </option>
                    );
                  })}
              </select>
            </div>

            {/* Aperçu voyage sélectionné */}
            {form.voyage_id && (() => {
              const v = voyages.find(vv => String(vv.id) === form.voyage_id);
              if (!v) return null;
              const places = v.places_restantes ?? (v.capacite_max - (v.nb_inscrits || 0));
              return (
                <div className="vcc-voyage-preview vcc-field--full">
                  <div className="vcc-voyage-preview__row">
                    <span>📍</span>
                    <strong>{v.destination}</strong>
                    <span className="vcc-voyage-preview__sep">·</span>
                    <span>{v.duree} jours</span>
                    <span className="vcc-voyage-preview__sep">·</span>
                    <span className="vcc-voyage-preview__price">{v.prix_base} DT/pers.</span>
                    {places <= 5 && places > 0 && (
                      <>
                        <span className="vcc-voyage-preview__sep">·</span>
                        <span className="vcc-voyage-preview__urgent">⚠ {places} place(s) restante(s)</span>
                      </>
                    )}
                  </div>
                  {v.description && (
                    <p className="vcc-voyage-preview__desc">{v.description.slice(0, 120)}...</p>
                  )}
                  <p className="vcc-voyage-preview__hint">
                    💡 Claude utilisera ces données réelles pour générer le contenu marketing
                  </p>
                </div>
              );
            })()}

            {/* Titre campagne */}
            <div className="vcc-field vcc-field--full">
              <label className="vc-label">Titre de la campagne *</label>
              <input
                className="vc-input"
                placeholder="Ex : Été 2026 — Djerba Luxe"
                value={form.titre}
                onChange={e => set("titre", e.target.value)}
              />
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
                <button
                  key={key}
                  className={`vcc-ton-btn ${form.ton === key ? "vcc-ton-btn--active" : ""}`}
                  style={form.ton === key ? { borderColor: cfg.color, color: cfg.color } : {}}
                  onClick={() => set("ton", key)}
                >
                  <span className="vcc-ton-emoji">{cfg.emoji}</span>
                  <span className="vcc-ton-label">{cfg.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section 3 : Formats vidéo */}
        <div className="vc-card vcc-section">
          <div className="vc-card__header">
            <h3 className="vc-card__title">📐 Formats vidéo</h3>
            <span className="vcc-section-note">minimax/video-01 génère en 720p 25fps</span>
          </div>
          <div className="vc-card__body">
            <div className="vcc-format-grid">
              {Object.entries(FORMAT_CFG).map(([key, cfg]) => (
                <label
                  key={key}
                  className={`vcc-format-btn ${form.formats.includes(key) ? "vcc-format-btn--active" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={form.formats.includes(key)}
                    onChange={() => toggleFormat(key)}
                    style={{ display: "none" }}
                  />
                  <span className="vcc-format-icon">{cfg.icon}</span>
                  <span className="vcc-format-label">{cfg.label}</span>
                  {form.formats.includes(key) && (
                    <span className="vcc-format-check">✓</span>
                  )}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Section 4 : Segment + A/B */}
        <div className="vc-card vcc-section">
          <div className="vc-card__header">
            <h3 className="vc-card__title">📤 Destinataires</h3>
          </div>
          <div className="vc-card__body">
            <div className="vcc-segment-grid">
              {[
                { val: "tous",     label: "Tous",      sub: "clients + visiteurs", icon: "👥" },
                { val: "client",   label: "Clients",   sub: "comptes enregistrés", icon: "⭐" },
                { val: "visiteur", label: "Visiteurs", sub: "non-clients",          icon: "👤" },
              ].map(s => (
                <button
                  key={s.val}
                  className={`vcc-seg-btn ${form.segment === s.val ? "vcc-seg-btn--active" : ""}`}
                  onClick={() => set("segment", s.val)}
                >
                  <span className="vcc-seg-icon">{s.icon}</span>
                  <span className="vcc-seg-label">{s.label}</span>
                  <span className="vcc-seg-sub">{s.sub}</span>
                </button>
              ))}
            </div>

            <label className="vcc-ab-toggle">
              <input
                type="checkbox"
                checked={form.ab_enabled}
                onChange={e => set("ab_enabled", e.target.checked)}
              />
              <span className="vcc-ab-check">{form.ab_enabled ? "✓" : ""}</span>
              <div>
                <span className="vcc-ab-label">Activer le A/B Testing</span>
                <span className="vcc-ab-sub">Claude génère 2 variantes de sujet et CTA</span>
              </div>
            </label>
          </div>
        </div>

      </div>
    </div>
  );
}