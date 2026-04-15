// src/admin/pages/video-campaigns/VCdetail.jsx
import { useState, useEffect, useRef } from "react";
import "./VCdetail.css";
import { BASE, auth, STATUT_CFG, TON_CFG, FORMAT_CFG } from "./constants";

export default function VCdetail({ campaign, loading, onRefresh, onReload, onBack }) {
  const [activeTab, setActiveTab] = useState("contenu");
  const [generating, setGenerating] = useState({ contenu: false, video: false, envoi: false });
  const [error,      setError]      = useState("");
  const [success,    setSuccess]    = useState("");
  const [nbContacts, setNbContacts] = useState(null);

  // Polling pour statut EN_GENERATION / EN_ENVOI
  const pollRef = useRef(null);
  useEffect(() => {
    if (!campaign) return;
    const shouldPoll = ["EN_GENERATION", "EN_ENVOI"].includes(campaign.statut);
    if (shouldPoll) {
      pollRef.current = setInterval(onRefresh, 4000);
    }
    return () => clearInterval(pollRef.current);
  }, [campaign?.statut, onRefresh]);

  // Compter les contacts du segment
  useEffect(() => {
    if (!campaign?.segment) return;
    fetch(`${BASE}/video-campaigns/destinataires/compter?segment=${campaign.segment}`, { headers: auth() })
      .then(r => r.json())
      .then(d => setNbContacts(d.total))
      .catch(() => {});
  }, [campaign?.segment]);

  if (loading) return <VCskeleton />;
  if (!campaign) return null;

  const st  = STATUT_CFG[campaign.statut] || STATUT_CFG.BROUILLON;
  const ton = TON_CFG[campaign.ton]       || { emoji: "🎬", label: campaign.ton };

  const notify = (msg, isErr = false) => {
    if (isErr) setError(msg); else setSuccess(msg);
    setTimeout(() => { setError(""); setSuccess(""); }, 4000);
  };

  // ── Action : Générer contenu Claude ──────────────────
  const handleGenererContenu = async () => {
    setGenerating(g => ({ ...g, contenu: true }));
    setError("");
    try {
      const r = await fetch(`${BASE}/video-campaigns/${campaign.id}/generer-contenu`, {
        method: "POST", headers: auth(),
      });
      if (!r.ok) { const d = await r.json(); throw new Error(d.detail || "Erreur Claude"); }
      await onRefresh();
      notify("✓ Contenu généré par Claude avec succès !");
      setActiveTab("contenu");
    } catch (e) { notify(e.message, true); }
    setGenerating(g => ({ ...g, contenu: false }));
  };

  // ── Action : Générer vidéo Replicate ─────────────────
  const handleGenererVideo = async () => {
    setGenerating(g => ({ ...g, video: true }));
    setError("");
    try {
      const r = await fetch(`${BASE}/video-campaigns/${campaign.id}/generer-video`, {
        method: "POST", headers: auth(),
      });
      if (!r.ok) { const d = await r.json(); throw new Error(d.detail || "Erreur Replicate"); }
      await onRefresh();
      notify("⏳ Génération vidéo lancée — polling en cours...");
      setActiveTab("video");
    } catch (e) { notify(e.message, true); }
    setGenerating(g => ({ ...g, video: false }));
  };

  // ── Action : Envoyer par email ────────────────────────
  const handleEnvoyer = async () => {
    if (!confirm(`Envoyer la campagne à ${nbContacts ?? "?"} contact(s) ?`)) return;
    setGenerating(g => ({ ...g, envoi: true }));
    setError("");
    try {
      const r = await fetch(`${BASE}/video-campaigns/${campaign.id}/envoyer`, {
        method: "POST",
        headers: auth(),
        body: JSON.stringify({
          segment:     campaign.segment || "tous",
          nb_contacts: 500,
        }),
      });
      if (!r.ok) { const d = await r.json(); throw new Error(d.detail || "Erreur envoi"); }
      await onRefresh();
      await onReload();
      notify("✓ Campagne envoyée avec succès !");
    } catch (e) { notify(e.message, true); }
    setGenerating(g => ({ ...g, envoi: false }));
  };

  const canGenContenu = ["BROUILLON", "ECHOUE"].includes(campaign.statut);
  const canGenVideo   = !!campaign.prompts_images && !["EN_GENERATION", "EN_ENVOI"].includes(campaign.statut);
  const canEnvoyer    = campaign.statut === "PRET";
  const isGenerating  = campaign.statut === "EN_GENERATION";
  const isEnvoying    = campaign.statut === "EN_ENVOI";

  return (
    <div className="vcd-wrapper">

      {/* ── Topbar ──────────────────────────────────── */}
      <div className="vcd-topbar">
        <div className="vcd-topbar-left">
          <button className="vc-btn-ghost vcd-back" onClick={onBack}>←</button>
          <div>
            <div className="vcd-topbar-badges">
              <span className="vc-badge" style={{ background: st.bg, color: st.color }}>
                <span
                  className={`vc-badge__dot ${isGenerating || isEnvoying ? "vc-badge__dot--pulse" : ""}`}
                  style={{ background: st.dot }}
                />
                {st.label}
              </span>
              <span className="vcd-ton-badge">
                {ton.emoji} {ton.label}
              </span>
            </div>
            <h2 className="vcd-title">{campaign.titre}</h2>
            <p className="vcd-dest">📍 {campaign.destination}</p>
          </div>
        </div>

        {/* Actions pipeline */}
        <div className="vcd-actions">
          {canGenContenu && (
            <button
              className="vc-btn-primary"
              onClick={handleGenererContenu}
              disabled={generating.contenu}
            >
              {generating.contenu
                ? <><span className="vc-spinner" style={{width:14,height:14}}/> Claude génère...</>
                : "✨ Générer le contenu"
              }
            </button>
          )}

          {canGenVideo && campaign.prompts_images && (
            <button
              className="vc-btn-primary"
              onClick={handleGenererVideo}
              disabled={generating.video || isGenerating}
            >
              {generating.video || isGenerating
                ? <><span className="vc-spinner" style={{width:14,height:14}}/> Replicate...</>
                : "🎬 Générer la vidéo"
              }
            </button>
          )}

          {canEnvoyer && (
            <button
              className="vc-btn-gold"
              onClick={handleEnvoyer}
              disabled={generating.envoi}
            >
              {generating.envoi
                ? <><span className="vc-spinner" style={{width:14,height:14}}/> Envoi...</>
                : `📤 Envoyer à ${nbContacts ?? "..."} contacts`
              }
            </button>
          )}
        </div>
      </div>

      {/* ── Pipeline steps ─────────────────────────── */}
      <VCpipeline campaign={campaign} />

      {/* ── Notifications ──────────────────────────── */}
      {error   && <div className="vcd-notif vcd-notif--err">{error}</div>}
      {success && <div className="vcd-notif vcd-notif--ok">{success}</div>}

      {/* ── Tabs ────────────────────────────────────── */}
      <div className="vcd-tabs">
        {[
          { id: "contenu", label: "📝 Contenu Claude",   show: true },
          { id: "video",   label: "🎬 Vidéos Replicate", show: true },
          { id: "email",   label: "📧 Aperçu Email",     show: !!campaign.video_url_landscape || !!campaign.thumbnail_url },
          { id: "infos",   label: "ℹ️ Infos",             show: true },
        ].filter(t => t.show).map(t => (
          <button
            key={t.id}
            className={`vcd-tab ${activeTab === t.id ? "vcd-tab--active" : ""}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Contenu ─────────────────────────────────── */}
      <div className="vcd-body">

        {activeTab === "contenu" && (
          <VCtabContenu campaign={campaign} />
        )}

        {activeTab === "video" && (
          <VCtabVideo campaign={campaign} isGenerating={isGenerating} />
        )}

        {activeTab === "email" && (
          <VCtabEmail campaign={campaign} />
        )}

        {activeTab === "infos" && (
          <VCtabInfos campaign={campaign} nbContacts={nbContacts} />
        )}

      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Pipeline visuel
────────────────────────────────────────────────────────── */
function VCpipeline({ campaign }) {
  const steps = [
    {
      id:    "claude",
      label: "Contenu Claude",
      icon:  "✨",
      done:  !!campaign.script_video,
      active: !campaign.script_video && campaign.statut === "BROUILLON",
    },
    {
      id:    "replicate",
      label: "Vidéo Replicate",
      icon:  "🎬",
      done:  !!campaign.video_url_landscape,
      active: campaign.statut === "EN_GENERATION",
      loading: campaign.statut === "EN_GENERATION",
    },
    {
      id:    "envoi",
      label: "Envoi Email",
      icon:  "📤",
      done:  campaign.statut === "ENVOYE",
      active: campaign.statut === "PRET",
      loading: campaign.statut === "EN_ENVOI",
    },
  ];

  return (
    <div className="vcd-pipeline">
      {steps.map((step, i) => (
        <div key={step.id} className="vcd-pipeline__step-wrap">
          <div className={`vcd-pipeline__step
            ${step.done    ? "vcd-pipeline__step--done"    : ""}
            ${step.active  ? "vcd-pipeline__step--active"  : ""}
            ${step.loading ? "vcd-pipeline__step--loading" : ""}
          `}>
            <div className="vcd-pipeline__icon">
              {step.loading ? <span className="vc-spinner" style={{width:16,height:16}}/> : step.icon}
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

/* ──────────────────────────────────────────────────────────
   Tab : Contenu Claude
────────────────────────────────────────────────────────── */
function VCtabContenu({ campaign }) {
  if (!campaign.script_video && !campaign.sujet_email) {
    return (
      <div className="vcd-placeholder">
        <div className="vcd-placeholder__icon">✨</div>
        <p className="vcd-placeholder__text">Le contenu n'a pas encore été généré.</p>
        <p className="vcd-placeholder__sub">Cliquez sur "Générer le contenu" pour lancer Claude AI.</p>
      </div>
    );
  }

  return (
    <div className="vcd-tab-body">
      <div className="vcd-two-col">
        {/* Colonne gauche */}
        <div className="vcd-col-left">

          {campaign.sujet_email && (
            <div className="vc-card">
              <div className="vc-card__header"><h3 className="vc-card__title">📧 Sujet email</h3></div>
              <div className="vc-card__body">
                <p className="vcd-sujet">{campaign.sujet_email}</p>
                {campaign.ab_variante_sujet && (
                  <div className="vcd-ab-box">
                    <span className="vcd-ab-tag">Variante B</span>
                    <p className="vcd-ab-text">{campaign.ab_variante_sujet}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {campaign.description_marketing && (
            <div className="vc-card">
              <div className="vc-card__header"><h3 className="vc-card__title">📋 Description marketing</h3></div>
              <div className="vc-card__body">
                <p className="vcd-description">{campaign.description_marketing}</p>
              </div>
            </div>
          )}

          {campaign.cta_texte && (
            <div className="vc-card">
              <div className="vc-card__header"><h3 className="vc-card__title">🔘 CTA</h3></div>
              <div className="vc-card__body vcd-cta-row">
                <button className="vcd-cta-preview">{campaign.cta_texte}</button>
                {campaign.ab_variante_cta && (
                  <>
                    <span className="vcd-ab-vs">vs</span>
                    <button className="vcd-cta-preview vcd-cta-preview--b">{campaign.ab_variante_cta}</button>
                  </>
                )}
              </div>
            </div>
          )}

          {campaign.hashtags && (
            <div className="vc-card">
              <div className="vc-card__header"><h3 className="vc-card__title"># Hashtags</h3></div>
              <div className="vc-card__body">
                <div className="vcd-hashtags">
                  {campaign.hashtags.split(" ").map((h, i) => (
                    <span key={i} className="vcd-hashtag">{h}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Colonne droite : Script */}
        <div className="vcd-col-right">
          {campaign.script_video && (
            <div className="vc-card vcd-script-card">
              <div className="vc-card__header"><h3 className="vc-card__title">🎬 Script vidéo</h3></div>
              <div className="vc-card__body">
                <pre className="vcd-script">{campaign.script_video}</pre>
              </div>
            </div>
          )}

          {campaign.prompts_images?.length > 0 && (
            <div className="vc-card">
              <div className="vc-card__header"><h3 className="vc-card__title">🖼️ Prompts Replicate</h3></div>
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

/* ──────────────────────────────────────────────────────────
   Tab : Vidéos Replicate
────────────────────────────────────────────────────────── */
function VCtabVideo({ campaign, isGenerating }) {
  if (isGenerating) {
    return (
      <div className="vcd-placeholder">
        <div className="vcd-placeholder__icon"><span className="vc-spinner" style={{width:40,height:40}}/></div>
        <p className="vcd-placeholder__text">Génération vidéo en cours...</p>
        <p className="vcd-placeholder__sub">Replicate génère vos médias. Cette opération peut prendre 1 à 5 minutes.</p>
      </div>
    );
  }

  const hasAny = campaign.video_url_landscape || campaign.video_url_portrait || campaign.video_url_square;

  if (!hasAny) {
    return (
      <div className="vcd-placeholder">
        <div className="vcd-placeholder__icon">🎬</div>
        <p className="vcd-placeholder__text">Aucune vidéo générée.</p>
        <p className="vcd-placeholder__sub">
          {campaign.prompts_images?.length
            ? "Cliquez sur \"Générer la vidéo\" pour lancer Replicate."
            : "Générez d'abord le contenu Claude pour obtenir les prompts images."
          }
        </p>
      </div>
    );
  }

  return (
    <div className="vcd-tab-body">
      <div className="vcd-video-grid">

        {campaign.thumbnail_url && (
          <div className="vcd-video-card">
            <div className="vcd-video-card__label">🖼️ Thumbnail</div>
            <img src={campaign.thumbnail_url} alt="thumbnail" className="vcd-video-thumb" />
          </div>
        )}

        {campaign.video_url_landscape && (
          <div className="vcd-video-card">
            <div className="vcd-video-card__label">🖥️ 16:9 — Email / Web</div>
            <video
              controls muted loop
              className="vcd-video-player vcd-video-player--landscape"
              poster={campaign.thumbnail_url}
            >
              <source src={campaign.video_url_landscape} type="video/mp4" />
            </video>
            <a href={campaign.video_url_landscape} target="_blank" rel="noreferrer" className="vcd-video-dl">
              ↓ Télécharger
            </a>
          </div>
        )}

        {campaign.video_url_portrait && (
          <div className="vcd-video-card">
            <div className="vcd-video-card__label">📱 9:16 — Reels / Story</div>
            <video
              controls muted loop
              className="vcd-video-player vcd-video-player--portrait"
              poster={campaign.thumbnail_url}
            >
              <source src={campaign.video_url_portrait} type="video/mp4" />
            </video>
            <a href={campaign.video_url_portrait} target="_blank" rel="noreferrer" className="vcd-video-dl">
              ↓ Télécharger
            </a>
          </div>
        )}

        {campaign.video_url_square && (
          <div className="vcd-video-card">
            <div className="vcd-video-card__label">⬜ 1:1 — Posts</div>
            <video
              controls muted loop
              className="vcd-video-player vcd-video-player--square"
              poster={campaign.thumbnail_url}
            >
              <source src={campaign.video_url_square} type="video/mp4" />
            </video>
            <a href={campaign.video_url_square} target="_blank" rel="noreferrer" className="vcd-video-dl">
              ↓ Télécharger
            </a>
          </div>
        )}

      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Tab : Aperçu Email
────────────────────────────────────────────────────────── */
function VCtabEmail({ campaign }) {
  const hasVideo = campaign.video_url_landscape || campaign.thumbnail_url;
  if (!hasVideo) return (
    <div className="vcd-placeholder">
      <div className="vcd-placeholder__icon">📧</div>
      <p className="vcd-placeholder__text">Aperçu disponible après la génération vidéo.</p>
    </div>
  );

  // Email HTML preview inline
  const thumbnail = campaign.thumbnail_url || "";
  const videoUrl  = campaign.video_url_landscape || "";
  const cta       = campaign.cta_texte || "Réserver maintenant";
  const desc      = campaign.description_marketing || "";

  const html = `<!DOCTYPE html>
<html><body style="margin:0;background:#F0F4F8;font-family:Arial,sans-serif;">
<table width="100%"><tr><td align="center" style="padding:20px 16px;">
<table width="560" style="max-width:560px;">
<tr><td style="background:#0F2235;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
  <p style="color:#C4973A;font-size:10px;letter-spacing:3px;margin:0 0 6px;text-transform:uppercase;">Catalogues & Offres Exclusives</p>
  <h1 style="color:#fff;font-size:22px;margin:0;">EasyVoyage</h1>
</td></tr>
<tr><td style="background:#C4973A;padding:14px;text-align:center;">
  <h2 style="color:#0F2235;font-size:17px;margin:0;">${campaign.destination}</h2>
</td></tr>
<tr><td style="background:#fff;padding:28px;">
  <p style="color:#1C2E42;font-size:15px;margin:0 0 16px;">Bonjour <strong>Jean Dupont</strong>,</p>
  ${videoUrl
    ? `<div style="text-align:center;margin:0 0 20px;"><video width="100%" style="border-radius:10px;" autoplay muted loop poster="${thumbnail}"><source src="${videoUrl}" type="video/mp4"><img src="${thumbnail}" style="width:100%;border-radius:10px;" alt="${campaign.destination}"></video></div>`
    : thumbnail ? `<div style="text-align:center;margin:0 0 20px;"><img src="${thumbnail}" style="width:100%;border-radius:10px;" alt="${campaign.destination}"></div>` : ""
  }
  <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 24px;">${desc}</p>
  <div style="text-align:center;"><a href="http://localhost:3000" style="display:inline-block;background:linear-gradient(135deg,#C4973A,#D4A853);color:#0F2235;text-decoration:none;padding:13px 36px;border-radius:9px;font-weight:700;font-size:14px;">${cta}</a></div>
</td></tr>
<tr><td style="background:#F8FAFC;padding:16px;text-align:center;border-top:1px solid #EEF2F7;border-radius:0 0 12px 12px;">
  <p style="color:#B0BEC8;font-size:11px;margin:0;">EasyVoyage Tunisie — www.easyvoyage.tn</p>
</td></tr>
</table></td></tr></table>
</body></html>`;

  return (
    <div className="vcd-tab-body">
      <div className="vc-card vcd-preview-card">
        <div className="vc-card__header">
          <h3 className="vc-card__title">👁️ Aperçu de l'email</h3>
          <span className="vcd-preview-note">Prévisualisation — contact fictif Jean Dupont</span>
        </div>
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

/* ──────────────────────────────────────────────────────────
   Tab : Infos
────────────────────────────────────────────────────────── */
function VCtabInfos({ campaign, nbContacts }) {
  const fmtDate = iso => iso ? new Date(iso).toLocaleString("fr-FR") : "—";
  const rows = [
    { label: "ID",            val: `#${campaign.id}` },
    { label: "Destination",   val: campaign.destination },
    { label: "Ton",           val: TON_CFG[campaign.ton]?.label || campaign.ton },
    { label: "Formats",       val: (campaign.formats || []).join(", ") || "—" },
    { label: "Segment",       val: campaign.segment },
    { label: "Destinataires", val: nbContacts != null ? `${nbContacts} contacts` : "Calcul en cours..." },
    { label: "A/B Testing",   val: campaign.ab_enabled ? "Activé" : "Désactivé" },
    { label: "Statut",        val: STATUT_CFG[campaign.statut]?.label || campaign.statut },
    { label: "Envois OK",     val: campaign.nb_envoyes || 0 },
    { label: "Envois KO",     val: campaign.nb_echecs  || 0 },
    { label: "Créée le",      val: fmtDate(campaign.created_at) },
    { label: "Envoyée le",    val: fmtDate(campaign.envoye_at)  },
  ];

  return (
    <div className="vcd-tab-body">
      <div className="vc-card">
        <div className="vc-card__header"><h3 className="vc-card__title">ℹ️ Informations de la campagne</h3></div>
        <div className="vc-card__body vcd-infos-body">
          {rows.map(r => (
            <div key={r.label} className="vcd-info-row">
              <span className="vcd-info-label">{r.label}</span>
              <span className="vcd-info-val">{r.val}</span>
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
    </div>
  );
}

/* ── Skeleton loading ───────────────────────────────────── */
function VCskeleton() {
  return (
    <div className="vcd-wrapper">
      <div className="vcd-skel-topbar" />
      <div className="vcd-skel-pipeline" />
      <div className="vcd-tab-body">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="vcd-skel-card" style={{ animationDelay: `${i * 0.08}s` }} />
        ))}
      </div>
    </div>
  );
}