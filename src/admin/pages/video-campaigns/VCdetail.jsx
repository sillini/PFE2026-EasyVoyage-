// src/admin/pages/video-campaigns/VCdetail.jsx — final
import { useState, useEffect, useRef, useMemo } from "react";
import "./VCdetail.css";
import { BASE, auth, STATUT_CFG, TON_CFG } from "./constants";

export default function VCdetail({ campaign, loading, onRefresh, onReload, onBack }) {
  const [activeTab,  setActiveTab]  = useState("contenu");
  const [generating, setGenerating] = useState({ contenu: false, video: false });
  const [showEnvoi,  setShowEnvoi]  = useState(false);
  const [error,      setError]      = useState("");
  const [success,    setSuccess]    = useState("");

  const pollRef = useRef(null);
  useEffect(() => {
    if (!campaign) return;
    if (["EN_GENERATION", "EN_ENVOI"].includes(campaign.statut))
      pollRef.current = setInterval(onRefresh, 4000);
    return () => clearInterval(pollRef.current);
  }, [campaign?.statut, onRefresh]);

  if (loading) return <VCskeleton />;
  if (!campaign) return null;

  const st  = STATUT_CFG[campaign.statut] || STATUT_CFG.BROUILLON;
  const ton = TON_CFG[campaign.ton]       || { emoji: "🎬", label: campaign.ton };

  const notify = (msg, isErr = false) => {
    if (isErr) setError(msg); else setSuccess(msg);
    setTimeout(() => { setError(""); setSuccess(""); }, 5000);
  };

  const handleGenererContenu = async () => {
    setGenerating(g => ({ ...g, contenu: true }));
    setError("");
    try {
      const r = await fetch(`${BASE}/video-campaigns/${campaign.id}/generer-contenu`, {
        method: "POST", headers: auth(),
      });
      if (!r.ok) throw new Error((await r.json()).detail || "Erreur Claude");
      await onRefresh();
      notify("✓ Contenu généré par Claude !");
      setActiveTab("contenu");
    } catch (e) { notify(e.message, true); }
    setGenerating(g => ({ ...g, contenu: false }));
  };

  const handleGenererVideo = async () => {
    setGenerating(g => ({ ...g, video: true }));
    setError("");
    try {
      const r = await fetch(`${BASE}/video-campaigns/${campaign.id}/generer-video`, {
        method: "POST", headers: auth(),
      });
      if (!r.ok) throw new Error((await r.json()).detail || "Erreur Replicate");
      await onRefresh();
      notify("⏳ Génération vidéo lancée (2-6 min)...");
      setActiveTab("video");
    } catch (e) { notify(e.message, true); }
    setGenerating(g => ({ ...g, video: false }));
  };

  const canGenContenu = ["BROUILLON", "ECHOUE"].includes(campaign.statut);
  const canGenVideo   = !!campaign.prompts_images?.length &&
                        !["EN_GENERATION", "EN_ENVOI"].includes(campaign.statut);
  const canEnvoyer    = campaign.statut === "PRET";
  const canRenvoyer   = ["ENVOYE", "ECHOUE"].includes(campaign.statut) &&
                        !!(campaign.video_url_landscape || campaign.video_url_portrait || campaign.video_url_square);
  const isGenerating  = campaign.statut === "EN_GENERATION";

  return (
    <div className="vcd-wrapper">
      <div className="vcd-topbar">
        <div className="vcd-topbar-left">
          <button className="vc-btn-ghost vcd-back" onClick={onBack}>←</button>
          <div>
            <div className="vcd-topbar-badges">
              <span className="vc-badge" style={{ background: st.bg, color: st.color }}>
                <span className={`vc-badge__dot ${isGenerating ? "vc-badge__dot--pulse" : ""}`}
                  style={{ background: st.dot }} />
                {st.label}
              </span>
              <span className="vcd-ton-badge">{ton.emoji} {ton.label}</span>
            </div>
            <h2 className="vcd-title">{campaign.titre}</h2>
            <p className="vcd-dest">📍 {campaign.destination}</p>
          </div>
        </div>
        <div className="vcd-actions">
          {canGenContenu && (
            <button className="vc-btn-primary" onClick={handleGenererContenu} disabled={generating.contenu}>
              {generating.contenu
                ? <><span className="vc-spinner" style={{width:14,height:14}}/> Claude...</>
                : "✨ Générer le contenu"}
            </button>
          )}
          {canGenVideo && (
            <button className="vc-btn-primary" onClick={handleGenererVideo}
              disabled={generating.video || isGenerating}>
              {generating.video || isGenerating
                ? <><span className="vc-spinner" style={{width:14,height:14}}/> Replicate...</>
                : "🎬 Générer la vidéo"}
            </button>
          )}
          {canEnvoyer && (
            <button className="vc-btn-gold" onClick={() => setShowEnvoi(true)}>
              📤 Envoyer par email
            </button>
          )}
          {canRenvoyer && (
            <button className="vc-btn-ghost vcd-resend-btn"
              onClick={() => setShowEnvoi(true)}
              title="Renvoyer à d'autres destinataires ou re-envoyer">
              🔄 Renvoyer
            </button>
          )}
        </div>
      </div>

      <VCpipeline campaign={campaign} />

      {error   && <div className="vcd-notif vcd-notif--err">{error}</div>}
      {success && <div className="vcd-notif vcd-notif--ok">{success}</div>}

      <div className="vcd-tabs">
        {[
          { id: "contenu", label: "📝 Contenu Claude", show: true },
          { id: "video",   label: "🎬 Vidéos",         show: true },
          { id: "email",   label: "📧 Aperçu Email",
            show: !!(campaign.sujet_email || campaign.video_url_landscape) },
          { id: "infos",   label: "ℹ️ Infos",           show: true },
        ].filter(t => t.show).map(t => (
          <button key={t.id}
            className={`vcd-tab ${activeTab === t.id ? "vcd-tab--active" : ""}`}
            onClick={() => setActiveTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="vcd-body">
        {activeTab === "contenu" && (
          <VCtabContenuEditable
            campaign={campaign}
            onSaved={async () => { await onRefresh(); notify("✓ Contenu sauvegardé !"); }}
            onError={msg => notify(msg, true)}
          />
        )}
        {activeTab === "video"  && <VCtabVideo  campaign={campaign} isGenerating={isGenerating} />}
        {activeTab === "email"  && <VCtabEmail  campaign={campaign} />}
        {activeTab === "infos"  && <VCtabInfos  campaign={campaign} />}
      </div>

      {showEnvoi && (
        <VCEnvoiModal
          campaign={campaign}
          isRenvoi={canRenvoyer}
          onClose={() => setShowEnvoi(false)}
          onSent={async () => {
            setShowEnvoi(false);
            await onRefresh(); await onReload();
            notify(canRenvoyer ? "✓ Campagne renvoyée !" : "✓ Campagne envoyée !");
          }}
        />
      )}
    </div>
  );
}

/* ── Contenu éditable ──────────────────────────────────────── */
function VCtabContenuEditable({ campaign, onSaved, onError }) {
  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [fields,  setFields]  = useState({
    sujet_email:           campaign.sujet_email           || "",
    description_marketing: campaign.description_marketing || "",
    cta_texte:             campaign.cta_texte             || "",
    hashtags:              campaign.hashtags              || "",
    script_video:          campaign.script_video          || "",
  });

  useEffect(() => {
    setFields({
      sujet_email:           campaign.sujet_email           || "",
      description_marketing: campaign.description_marketing || "",
      cta_texte:             campaign.cta_texte             || "",
      hashtags:              campaign.hashtags              || "",
      script_video:          campaign.script_video          || "",
    });
  }, [campaign.id, campaign.sujet_email, campaign.description_marketing]);

  const set = (k, v) => setFields(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const r = await fetch(`${BASE}/video-campaigns/${campaign.id}`, {
        method: "PATCH", headers: auth(), body: JSON.stringify(fields),
      });
      if (!r.ok) throw new Error((await r.json()).detail || "Erreur sauvegarde");
      setEditing(false);
      onSaved();
    } catch (e) { onError(e.message); }
    setSaving(false);
  };

  const cancelEdit = () => {
    setEditing(false);
    setFields({
      sujet_email:           campaign.sujet_email           || "",
      description_marketing: campaign.description_marketing || "",
      cta_texte:             campaign.cta_texte             || "",
      hashtags:              campaign.hashtags              || "",
      script_video:          campaign.script_video          || "",
    });
  };

  if (!campaign.script_video && !campaign.sujet_email) return (
    <div className="vcd-tab-body">
      <div className="vcd-placeholder">
        <div className="vcd-placeholder__icon">✨</div>
        <p className="vcd-placeholder__text">Contenu pas encore généré.</p>
        <p className="vcd-placeholder__sub">Cliquez sur "Générer le contenu" pour lancer Claude AI.</p>
      </div>
    </div>
  );

  return (
    <div className="vcd-tab-body">
      <div className="vcd-edit-bar">
        <span className="vcd-edit-bar__label">
          {editing ? "✏️ Mode édition actif" : "📋 Contenu généré par Claude AI"}
        </span>
        <div className="vcd-edit-bar__actions">
          {editing ? (
            <>
              <button className="vc-btn-ghost" onClick={cancelEdit}>Annuler</button>
              <button className="vc-btn-gold" onClick={handleSave} disabled={saving}>
                {saving
                  ? <><span className="vc-spinner" style={{width:13,height:13}}/> Sauvegarde...</>
                  : "💾 Sauvegarder"}
              </button>
            </>
          ) : (
            <button className="vc-btn-primary vcd-edit-btn" onClick={() => setEditing(true)}>
              ✏️ Modifier le contenu
            </button>
          )}
        </div>
      </div>

      <div className="vcd-two-col">
        <div className="vcd-col-left">

          <div className="vc-card">
            <div className="vc-card__header">
              <h3 className="vc-card__title">📧 Sujet email</h3>
              {editing && <span className="vcd-edit-hint">Éditable</span>}
            </div>
            <div className="vc-card__body">
              {editing
                ? <input className="vc-input vcd-edit-input" value={fields.sujet_email}
                    onChange={e => set("sujet_email", e.target.value)}
                    placeholder="Sujet accrocheur..." />
                : <p className="vcd-sujet">{campaign.sujet_email}</p>}
            </div>
          </div>

          <div className="vc-card">
            <div className="vc-card__header">
              <h3 className="vc-card__title">📋 Description marketing</h3>
              {editing && <span className="vcd-edit-hint">Éditable</span>}
            </div>
            <div className="vc-card__body">
              {editing
                ? <textarea className="vc-textarea vcd-edit-textarea" rows={5}
                    value={fields.description_marketing}
                    onChange={e => set("description_marketing", e.target.value)}
                    placeholder="Description marketing..." />
                : <p className="vcd-description">{campaign.description_marketing}</p>}
            </div>
          </div>

          <div className="vc-card">
            <div className="vc-card__header">
              <h3 className="vc-card__title">🔘 Bouton CTA</h3>
              {editing && <span className="vcd-edit-hint">Éditable</span>}
            </div>
            <div className="vc-card__body">
              {editing
                ? <input className="vc-input vcd-edit-input" value={fields.cta_texte}
                    maxLength={40} onChange={e => set("cta_texte", e.target.value)}
                    placeholder="Ex : Réserver maintenant" />
                : <div className="vcd-cta-row">
                    <button className="vcd-cta-preview">{campaign.cta_texte}</button>
                  </div>}
            </div>
          </div>

          <div className="vc-card">
            <div className="vc-card__header">
              <h3 className="vc-card__title"># Hashtags</h3>
              {editing && <span className="vcd-edit-hint">Éditable</span>}
            </div>
            <div className="vc-card__body">
              {editing
                ? <input className="vc-input vcd-edit-input" value={fields.hashtags}
                    onChange={e => set("hashtags", e.target.value)}
                    placeholder="#EasyVoyage #Tunisie ..." />
                : <div className="vcd-hashtags">
                    {(campaign.hashtags || "").split(" ").filter(Boolean).map((h, i) => (
                      <span key={i} className="vcd-hashtag">{h}</span>
                    ))}
                  </div>}
            </div>
          </div>
        </div>

        <div className="vcd-col-right">
          {(campaign.script_video || editing) && (
            <div className="vc-card vcd-script-card">
              <div className="vc-card__header">
                <h3 className="vc-card__title">🎬 Script vidéo</h3>
                {editing && <span className="vcd-edit-hint">Éditable</span>}
              </div>
              <div className="vc-card__body" style={{padding:0}}>
                {editing
                  ? <textarea className="vc-textarea vcd-edit-script" rows={12}
                      value={fields.script_video}
                      onChange={e => set("script_video", e.target.value)} />
                  : <pre className="vcd-script">{campaign.script_video}</pre>}
              </div>
            </div>
          )}

          {campaign.prompts_images?.length > 0 && (
            <div className="vc-card">
              <div className="vc-card__header">
                <h3 className="vc-card__title">🖼️ Prompt Replicate</h3>
                <span className="vcd-readonly-hint">Lecture seule</span>
              </div>
              <div className="vc-card__body">
                {campaign.prompts_images.map((p, i) => (
                  <div key={i} className="vcd-prompt">
                    <span className="vcd-prompt-num">#{i+1}</span>
                    <span className="vcd-prompt-text">{p}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Pipeline ──────────────────────────────────────────────── */
function VCpipeline({ campaign }) {
  const steps = [
    { id: "claude",    label: "Contenu Claude", icon: "✨",
      done: !!campaign.script_video,
      active: !campaign.script_video && campaign.statut === "BROUILLON" },
    { id: "replicate", label: "Vidéo",          icon: "🎬",
      done: !!campaign.video_url_landscape,
      active: campaign.statut === "EN_GENERATION",
      loading: campaign.statut === "EN_GENERATION" },
    { id: "envoi",     label: "Envoi Email",    icon: "📤",
      done: campaign.statut === "ENVOYE",
      active: campaign.statut === "PRET",
      loading: campaign.statut === "EN_ENVOI" },
  ];
  return (
    <div className="vcd-pipeline">
      {steps.map((step, i) => (
        <div key={step.id} className="vcd-pipeline__step-wrap">
          <div className={[
            "vcd-pipeline__step",
            step.done    && "vcd-pipeline__step--done",
            step.active  && "vcd-pipeline__step--active",
            step.loading && "vcd-pipeline__step--loading",
          ].filter(Boolean).join(" ")}>
            <div className="vcd-pipeline__icon">
              {step.loading
                ? <span className="vc-spinner" style={{width:16,height:16}}/>
                : step.icon}
            </div>
            <span className="vcd-pipeline__label">{step.label}</span>
            {step.done && <span className="vcd-pipeline__check">✓</span>}
          </div>
          {i < steps.length - 1 && (
            <div className={`vcd-pipeline__arrow ${steps[i+1].done || steps[i+1].active ? "vcd-pipeline__arrow--active" : ""}`}>→</div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Tab Vidéos ────────────────────────────────────────────── */
function VCtabVideo({ campaign, isGenerating }) {
  if (isGenerating) return (
    <div className="vcd-tab-body"><div className="vcd-placeholder">
      <div className="vcd-placeholder__icon"><span className="vc-spinner" style={{width:40,height:40}}/></div>
      <p className="vcd-placeholder__text">Génération en cours via minimax/video-01...</p>
      <p className="vcd-placeholder__sub">2 à 6 minutes. Actualisation automatique.</p>
    </div></div>
  );

  const seen = new Set();
  const urls = [
    { label: "🖥️ 16:9 — Email / Web",  url: campaign.video_url_landscape, key: "l" },
    { label: "📱 9:16 — Reels / Story", url: campaign.video_url_portrait,  key: "p" },
    { label: "⬜ 1:1 — Posts",          url: campaign.video_url_square,    key: "s" },
  ].filter(v => {
    if (!v.url || seen.has(v.url)) return false;
    seen.add(v.url); return true;
  });

  if (!urls.length) return (
    <div className="vcd-tab-body"><div className="vcd-placeholder">
      <div className="vcd-placeholder__icon">🎬</div>
      <p className="vcd-placeholder__text">Aucune vidéo générée.</p>
      <p className="vcd-placeholder__sub">
        {campaign.prompts_images?.length
          ? "Cliquez sur \"Générer la vidéo\"."
          : "Générez d'abord le contenu Claude."}
      </p>
    </div></div>
  );

  return (
    <div className="vcd-tab-body">
      <div className="vcd-video-grid">
        {urls.map(v => (
          <div key={v.key} className="vcd-video-card">
            <div className="vcd-video-card__label">{v.label}</div>
            <video controls muted loop playsInline
              className="vcd-video-player vcd-video-player--landscape" src={v.url}>
              Votre navigateur ne supporte pas la lecture vidéo.
            </video>
            <a href={v.url} target="_blank" rel="noreferrer" className="vcd-video-dl">
              ↓ Télécharger
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Tab Email ─────────────────────────────────────────────── */
function VCtabEmail({ campaign }) {
  // Construire le HTML avec concaténation (pas de template literal avec backticks)
  const html = useMemo(() => {
    const vid  = campaign.video_url_landscape || "";
    const cta  = campaign.cta_texte             || "Réserver maintenant";
    const desc = campaign.description_marketing || "Découvrez notre offre exclusive pour ce voyage inoubliable.";
    const dest = campaign.destination           || "";

    // Thumbnail Cloudinary auto : remplace .mp4 par .jpg avec frame à 1s
    const thumbUrl = vid && vid.includes("res.cloudinary.com")
      ? vid.replace("/video/upload/", "/video/upload/so_1,w_560,c_scale/").replace(".mp4", ".jpg")
      : "";

    // Gmail bloque <video> → image cliquable avec bouton play
    const videoSection = vid
      ? (thumbUrl
          ? '<div style="text-align:center;margin:0 0 20px;">'
              + '<a href="' + vid + '" target="_blank" style="display:inline-block;position:relative;max-width:560px;width:100%;">'
              + '<img src="' + thumbUrl + '" alt="▶ Voir la vidéo" width="560" style="width:100%;max-width:560px;border-radius:12px;display:block;border:0;" />'
              + '</a>'
              + '<p style="font-size:12px;color:#8A9BB0;margin:8px 0 0;">'
              + '▶ <a href="' + vid + '" target="_blank" style="color:#C4973A;font-weight:600;">Cliquer pour voir la vidéo</a>'
              + '</p></div>'
          : '<div style="text-align:center;margin:0 0 20px;">'
              + '<a href="' + vid + '" target="_blank" style="display:inline-block;background:#0F2235;color:#C4973A;text-decoration:none;padding:16px 40px;border-radius:10px;font-size:15px;font-weight:700;">▶ Voir la vidéo</a>'
              + '</div>'
        )
      : '<div style="text-align:center;margin:0 0 20px;">'
          + '<div style="background:linear-gradient(135deg,#0F2235,#1a3a5c);border-radius:10px;'
          + 'padding:40px 20px;max-width:500px;display:inline-block;width:100%;">'
          + '<div style="font-size:48px;margin-bottom:10px;">🎬</div>'
          + '<p style="color:rgba(255,255,255,0.7);font-size:13px;margin:0;">'
          + 'La vidéo apparaîtra ici après génération</p></div></div>';

    return '<!DOCTYPE html><html><body style="margin:0;background:#F0F4F8;font-family:Arial,sans-serif;">'
      + '<table width="100%"><tr><td align="center" style="padding:20px 16px;">'
      + '<table width="560" style="max-width:560px;">'

      // Header
      + '<tr><td style="background:#0F2235;padding:28px 40px;border-radius:12px 12px 0 0;text-align:center;">'
      + '<p style="color:#C4973A;font-size:10px;letter-spacing:3px;margin:0 0 8px;text-transform:uppercase;">'
      + 'Catalogues &amp; Offres Exclusives</p>'
      + '<h1 style="color:#ffffff;font-size:26px;font-weight:700;margin:0;font-family:Georgia,serif;">EasyVoyage</h1>'
      + '</td></tr>'

      // Destination
      + '<tr><td style="background:#C4973A;padding:16px 40px;text-align:center;">'
      + '<h2 style="color:#0F2235;font-size:20px;font-weight:700;margin:0;">' + dest + '</h2>'
      + '</td></tr>'

      // Corps
      + '<tr><td style="background:#ffffff;padding:32px 40px;">'
      + '<p style="color:#1C2E42;font-size:16px;margin:0 0 20px;">Bonjour <strong>Jean Dupont</strong>,</p>'
      + videoSection
      + '<p style="color:#4A5568;font-size:15px;line-height:1.7;margin:0 0 28px;">' + desc + '</p>'
      + '<div style="text-align:center;margin:28px 0;">'
      + '<a href="http://localhost:3000" style="display:inline-block;'
      + 'background:linear-gradient(135deg,#C4973A,#E8B84B);color:#0F2235;'
      + 'text-decoration:none;padding:14px 40px;border-radius:10px;font-weight:700;font-size:15px;">'
      + cta + '</a></div>'
      + '</td></tr>'

      // Footer
      + '<tr><td style="background:#F8FAFC;padding:20px 40px;text-align:center;'
      + 'border-top:1px solid #EEF2F7;border-radius:0 0 16px 16px;">'
      + '<p style="color:#B0BEC8;font-size:12px;margin:0;">'
      + 'EasyVoyage Tunisie — <a href="http://localhost:3000" style="color:#C4973A;">www.easyvoyage.tn</a></p>'
      + '<p style="color:#C8D0DA;font-size:11px;margin:6px 0 0;">'
      + 'Vous recevez cet email car vous êtes inscrit sur EasyVoyage.</p>'
      + '</td></tr>'

      + '</table></td></tr></table></body></html>';
  }, [
    campaign.video_url_landscape,
    campaign.cta_texte,
    campaign.description_marketing,
    campaign.destination,
  ]);

  const sujet = campaign.sujet_email || campaign.titre || "";
  const vid   = campaign.video_url_landscape || "";

  return (
    <div className="vcd-tab-body">
      <div className="vc-card vcd-preview-card">
        <div className="vc-card__header">
          <h3 className="vc-card__title">👁️ Aperçu de l'email</h3>
          <div className="vcd-preview-header-right">
            <span className="vcd-preview-note">Contact fictif : Jean Dupont</span>
            {!vid && (
              <span className="vcd-preview-badge">
                ⚠️ Sans vidéo — sera ajoutée après Replicate
              </span>
            )}
          </div>
        </div>

        {sujet && (
          <div className="vcd-preview-sujet">
            <span className="vcd-preview-sujet__label">Sujet :</span>
            <span className="vcd-preview-sujet__val">{sujet}</span>
          </div>
        )}

        <iframe
          className="vcd-preview-iframe"
          title="Aperçu email"
          srcDoc={html}
          sandbox="allow-same-origin"
        />
      </div>
    </div>
  );
}

/* ── Tab Infos enrichi ─────────────────────────────────────── */
function VCtabInfos({ campaign }) {
  const [destinataires, setDestinataires] = useState([]);
  const [loadingDest,   setLoadingDest]   = useState(false);
  const [showDest,      setShowDest]      = useState(false);
  const [searchDest,    setSearchDest]    = useState("");

  const fmtDate = iso => iso ? new Date(iso).toLocaleString("fr-FR") : "—";
  const seg     = campaign.segment || "tous";
  const nb      = campaign.nb_envoyes || 0;
  const segMap  = { tous: "Tous les contacts", client: "Clients", visiteur: "Visiteurs" };

  const formatsLabel = (campaign.formats || ["LANDSCAPE"])
    .map(f => ({ LANDSCAPE: "16:9 Email/Web", PORTRAIT: "9:16 Reels/Story", SQUARE: "1:1 Posts" }[f] || f))
    .join(" · ");

  const loadDestinataires = async (q = "") => {
    setLoadingDest(true);
    try {
      const url = `${BASE}/video-campaigns/${campaign.id}/destinataires`
        + (q ? `?search=${encodeURIComponent(q)}` : "");
      const r = await fetch(url, { headers: auth() });
      const d = await r.json();
      setDestinataires(d.items || []);
      setShowDest(true);
    } catch (e) { console.error(e); }
    setLoadingDest(false);
  };

  const handleSearch = (val) => {
    setSearchDest(val);
    // Debounce léger
    clearTimeout(window._destSearchTimer);
    window._destSearchTimer = setTimeout(() => loadDestinataires(val), 300);
  };

  const rows = [
    { label: "Destination", val: campaign.destination },
    { label: "Ton",         val: (TON_CFG[campaign.ton]?.emoji || "") + " " + (TON_CFG[campaign.ton]?.label || campaign.ton) },
    { label: "Formats",     val: formatsLabel },
    { label: "Segment",     val: segMap[seg] || seg, blue: true },
    { label: "Envois OK",   val: nb,                 green: nb > 0 },
    { label: "Envois KO",   val: campaign.nb_echecs || 0, red: (campaign.nb_echecs || 0) > 0 },
    { label: "Statut",      val: STATUT_CFG[campaign.statut]?.label || campaign.statut },
    { label: "Créée le",    val: fmtDate(campaign.created_at) },
    { label: "Envoyée le",  val: fmtDate(campaign.envoye_at) },
  ];

  return (
    <div className="vcd-tab-body">

      {/* Infos générales */}
      <div className="vc-card">
        <div className="vc-card__header">
          <h3 className="vc-card__title">ℹ️ Informations</h3>
        </div>
        <div className="vc-card__body vcd-infos-body">
          {rows.map(r => (
            <div key={r.label} className="vcd-info-row">
              <span className="vcd-info-label">{r.label}</span>
              <span className={[
                "vcd-info-val",
                r.blue  && "vcd-info-val--blue",
                r.green && "vcd-info-val--green",
                r.red   && "vcd-info-val--red",
              ].filter(Boolean).join(" ")}>
                {r.val}
              </span>
            </div>
          ))}
          {campaign.erreur && (
            <div className="vcd-error-box">
              <span className="vcd-error-title">⚠ Dernière erreur</span>
              <pre className="vcd-error-text">{campaign.erreur}</pre>
            </div>
          )}
        </div>
      </div>

      {/* Vidéos Cloudinary */}
      {(campaign.video_url_landscape || campaign.video_url_portrait || campaign.video_url_square) && (
        <div className="vc-card">
          <div className="vc-card__header">
            <h3 className="vc-card__title">☁️ Vidéos Cloudinary</h3>
            <span style={{fontSize:11,color:"#16A34A",fontWeight:600}}>
              Stockage permanent ✅
            </span>
          </div>
          <div className="vc-card__body vcd-infos-body">
            {[
              { label: "16:9 Email/Web",   url: campaign.video_url_landscape },
              { label: "9:16 Reels/Story", url: campaign.video_url_portrait },
              { label: "1:1 Posts",        url: campaign.video_url_square },
            ].filter(v => v.url).map(v => (
              <div key={v.label} className="vcd-info-row">
                <span className="vcd-info-label">{v.label}</span>
                <a href={v.url} target="_blank" rel="noreferrer"
                   className="vcd-info-val vcd-info-val--blue"
                   style={{fontSize:11, overflow:"hidden", textOverflow:"ellipsis",
                           whiteSpace:"nowrap", maxWidth:320, display:"block"}}>
                  {v.url.includes("cloudinary") ? "✅ " : "⚠️ "}
                  {v.url.split("/").pop()}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Destinataires */}
      {nb > 0 && (
        <div className="vc-card">
          <div className="vc-card__header">
            <h3 className="vc-card__title">
              👥 Destinataires
              <span className="vcd-dest-nb">{nb} unique{nb > 1 ? "s" : ""}</span>
            </h3>
            <button className="vc-btn-ghost" style={{fontSize:12,padding:"4px 12px"}}
              onClick={() => showDest ? setShowDest(false) : loadDestinataires(searchDest)}
              disabled={loadingDest}>
              {loadingDest ? "⏳" : showDest ? "Masquer" : "Voir les emails"}
            </button>
          </div>

          {showDest && (
            <div className="vc-card__body" style={{padding:"10px 16px 0"}}>
              {/* Barre de recherche */}
              <div className="vcd-dest-search">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  width="14" height="14" style={{flexShrink:0,color:"#94A3B8"}}>
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  className="vcd-dest-search-input"
                  placeholder="Rechercher par email, prénom, nom..."
                  value={searchDest}
                  onChange={e => handleSearch(e.target.value)}
                />
                {searchDest && (
                  <button className="vcd-dest-search-clear"
                    onClick={() => { setSearchDest(""); loadDestinataires(""); }}>
                    ×
                  </button>
                )}
              </div>
              <p className="vcd-dest-count">
                {destinataires.length} résultat{destinataires.length !== 1 ? "s" : ""}
                {searchDest && ` pour "${searchDest}"`}
              </p>
            </div>
          )}

          {showDest && (
            <div className="vcd-dest-list">
              {destinataires.length === 0 ? (
                <div className="vcd-dest-empty">
                  {searchDest ? `Aucun résultat pour "${searchDest}"` : "Aucun destinataire enregistré"}
                </div>
              ) : (
                destinataires.map((c, i) => (
                  <div key={c.email || i} className="vcd-dest-row">
                    <span className="vcd-dest-name">{c.prenom} {c.nom}</span>
                    <span className="vcd-dest-email">{c.email}</span>
                    <span className={"vcd-dest-type vcd-dest-type--" + (c.type || "tous")}>
                      {c.type || "tous"}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
}

/* ── Modal Envoi 2 étapes ──────────────────────────────────── */
function VCEnvoiModal({ campaign, onClose, onSent, isRenvoi = false }) {
  const [step,        setStep]        = useState(1);
  const [selMode,     setSelMode]     = useState("tous");
  const [contacts,    setContacts]    = useState([]);
  const [selCont,     setSelCont]     = useState(new Set());
  const [comptage,    setComptage]    = useState(null);
  const [loadingCtc,  setLoadingCtc]  = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [sending,     setSending]     = useState(false);
  const [search,      setSearch]      = useState("");
  const [page,        setPage]        = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);

  const seg = selMode === "all_clients" ? "client"
            : selMode === "all_visitors" ? "visiteur"
            : "tous";

  useEffect(() => {
    fetch(`${BASE}/video-campaigns/destinataires/compter?segment=${seg}`, { headers: auth() })
      .then(r => r.json()).then(d => setComptage(d)).catch(() => {});
  }, [selMode]);

  const loadContacts = async (p = 1, q = "") => {
    setLoadingCtc(true);
    try {
      let url = `${BASE}/contacts?page=${p}&per_page=20`;
      if (q) url += `&search=${encodeURIComponent(q)}`;
      const r = await fetch(url, { headers: auth() });
      const d = await r.json();
      setContacts(d.items || []);
      setTotalPages(Math.ceil((d.total || 0) / 20));
      setPage(p);
    } catch {}
    setLoadingCtc(false);
  };

  useEffect(() => { if (selMode === "manual") loadContacts(); }, [selMode]);

  const handleEnvoyer = async () => {
    setSending(true);
    try {
      const payload = selMode === "manual"
        ? { contact_ids: Array.from(selCont), nb_contacts: selCont.size,
            segment: "tous", scheduled_at: scheduledAt || null }
        : { segment: seg, nb_contacts: 500,
            contact_ids: null, scheduled_at: scheduledAt || null };

      const endpoint = isRenvoi ? "renvoyer" : "envoyer";
      const r = await fetch(`${BASE}/video-campaigns/${campaign.id}/${endpoint}`, {
        method: "POST", headers: auth(), body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error((await r.json()).detail || "Erreur envoi");
      onSent();
    } catch (e) { alert("Erreur : " + e.message); }
    setSending(false);
  };

  const MODES = [
    { key: "tous",         label: "👥 Tous les contacts",  desc: "clients + visiteurs" },
    { key: "all_clients",  label: "⭐ Tous les clients",    desc: "comptes inscrits" },
    { key: "all_visitors", label: "👤 Tous les visiteurs", desc: "sans compte" },
    { key: "manual",       label: "☑️ Sélection manuelle", desc: "choisissez un par un" },
  ];

  const destVal = selMode === "manual"
    ? selCont.size + " contact" + (selCont.size > 1 ? "s" : "") + " sélectionné" + (selCont.size > 1 ? "s" : "")
    : selMode === "all_clients"  ? "Tous les clients (" + (comptage?.total ?? "...") + ")"
    : selMode === "all_visitors" ? "Tous les visiteurs (" + (comptage?.total ?? "...") + ")"
    : "Tous les contacts (" + (comptage?.total ?? "...") + ")";

  return (
    <div className="vce-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="vce-modal">
        <div className="vce-header">
          <div className="vce-header-left">
            <h2 className="vce-title">
              {isRenvoi ? "🔄 Renvoyer la campagne" : "📤 Envoyer la campagne"}
            </h2>
            <p className="vce-subtitle">{campaign.titre}</p>
          </div>
          <div className="vce-steps">
            {[1, 2].map(s => (
              <div key={s} className="vce-step-item">
                <div className={`vce-step-circle ${step >= s ? "vce-step-circle--active" : ""}`}>{s}</div>
                <span className={`vce-step-label ${step === s ? "vce-step-label--active" : ""}`}>
                  {s === 1 ? "Destinataires" : "Récapitulatif"}
                </span>
                {s < 2 && <span className="vce-step-arrow">→</span>}
              </div>
            ))}
          </div>
          <button className="vce-close" onClick={onClose}>×</button>
        </div>

        {step === 1 && (
          <div className="vce-body">
            <div className="vce-modes">
              {MODES.map(m => (
                <button key={m.key}
                  className={`vce-mode-btn ${selMode === m.key ? "vce-mode-btn--active" : ""}`}
                  onClick={() => setSelMode(m.key)}>
                  <span className="vce-mode-label">{m.label}</span>
                  <span className="vce-mode-desc">{m.desc}</span>
                </button>
              ))}
            </div>

            {selMode !== "manual" && (
              <div className="vce-comptage">
                <span className="vce-comptage-nb">{comptage?.total ?? "..."}</span>
                <span> contacts seront ciblés</span>
              </div>
            )}

            {selMode === "manual" && (
              <div className="vce-contacts">
                <input className="vc-input" placeholder="🔍 Rechercher..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); loadContacts(1, e.target.value); }} />
                {loadingCtc
                  ? <div className="vce-loading">Chargement...</div>
                  : (
                    <div className="vce-contact-list">
                      {contacts.map(c => (
                        <label key={c.id} className="vce-contact-row">
                          <input type="checkbox" checked={selCont.has(c.id)}
                            onChange={() => setSelCont(prev => {
                              const s = new Set(prev);
                              s.has(c.id) ? s.delete(c.id) : s.add(c.id);
                              return s;
                            })} />
                          <span className="vce-contact-name">{c.prenom} {c.nom}</span>
                          <span className="vce-contact-email">{c.email}</span>
                          <span className={"vce-contact-type vce-contact-type--" + c.type}>{c.type}</span>
                        </label>
                      ))}
                    </div>
                  )}
                {totalPages > 1 && (
                  <div className="vce-pagination">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <button key={p}
                        className={"vce-page-btn" + (page === p ? " vce-page-btn--active" : "")}
                        onClick={() => loadContacts(p, search)}>{p}</button>
                    ))}
                  </div>
                )}
                <p className="vce-sel-count">
                  <strong>{selCont.size}</strong> contact{selCont.size !== 1 ? "s" : ""} sélectionné{selCont.size !== 1 ? "s" : ""}
                </p>
              </div>
            )}

            <div className="vce-footer">
              <button className="vc-btn-ghost" onClick={onClose}>Annuler</button>
              <button className="vc-btn-primary" onClick={() => setStep(2)}
                disabled={selMode === "manual" && selCont.size === 0}>
                Suivant →
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="vce-body">
            <div className="vce-recap">
              <h3 className="vce-recap-title">Récapitulatif</h3>
              {[
                { label: "Campagne",      val: campaign.titre },
                { label: "Destination",   val: campaign.destination },
                { label: "Destinataires", val: destVal, blue: true },
                { label: "Sujet email",   val: campaign.sujet_email || campaign.titre },
              ].map(r => (
                <div key={r.label} className="vce-recap-row">
                  <span className="vce-recap-label">{r.label}</span>
                  <span className={"vce-recap-val" + (r.blue ? " vce-recap-val--blue" : "")}>{r.val}</span>
                </div>
              ))}
              <div className="vce-schedule">
                <label className="vc-label">📅 Planification (optionnel)</label>
                <input type="datetime-local" className="vc-input"
                  value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
              </div>
            </div>
            <div className="vce-warning">⚠️ Cette action va envoyer des emails réels.</div>
            <div className="vce-footer">
              <button className="vc-btn-ghost" onClick={() => setStep(1)}>← Retour</button>
              <button className="vc-btn-gold" onClick={handleEnvoyer} disabled={sending}>
                {sending
                  ? <><span className="vc-spinner" style={{width:14,height:14}}/> Envoi...</>
                  : "✈️ Envoyer maintenant"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Skeleton ──────────────────────────────────────────────── */
function VCskeleton() {
  return (
    <div className="vcd-wrapper">
      <div className="vcd-skel-topbar"/>
      <div className="vcd-skel-pipeline"/>
      <div className="vcd-tab-body">
        {[0, 1, 2].map(i => (
          <div key={i} className="vcd-skel-card" style={{ animationDelay: `${i * 0.08}s` }}/>
        ))}
      </div>
    </div>
  );
}