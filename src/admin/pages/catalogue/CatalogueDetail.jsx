// src/admin/pages/catalogue/CatalogueDetail.jsx
import { useState } from "react";
import "./CatalogueDetail.css";
import { BASE, auth } from "./constants";
import { ago } from "./utils";

const STATUT_CFG = {
  BROUILLON: { color: "#64748B", bg: "#F1F5F9", dot: "#94A3B8", label: "Brouillon", icon: "○" },
  PLANIFIE:  { color: "#3B82F6", bg: "#DBEAFE", dot: "#3B82F6", label: "Planifié",  icon: "⏰" },
  EN_COURS:  { color: "#F59E0B", bg: "#FEF3C7", dot: "#F59E0B", label: "En cours",  icon: "⚡" },
  ENVOYE:    { color: "#10B981", bg: "#D1FAE5", dot: "#10B981", label: "Envoyé",    icon: "✓" },
  ECHOUE:    { color: "#EF4444", bg: "#FEE2E2", dot: "#EF4444", label: "Échoué",    icon: "✗" },
};

function StatutBadge({ statut, size = "md" }) {
  const cfg = STATUT_CFG[statut] || STATUT_CFG.BROUILLON;
  return (
    <span className={`cd-badge cd-badge--${size}`} style={{ color: cfg.color, background: cfg.bg }}>
      <span className="cd-badge__dot" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

function StatRing({ label, value, total, color }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const r = 22, circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div className="cd-ring-card">
      <div className="cd-ring-wrap">
        <svg width="60" height="60" viewBox="0 0 60 60">
          <circle cx="30" cy="30" r={r} fill="none" stroke="#F1F5F9" strokeWidth="5" />
          <circle cx="30" cy="30" r={r} fill="none" stroke={color} strokeWidth="5"
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeLinecap="round"
            transform="rotate(-90 30 30)"
            style={{ transition: "stroke-dasharray .6s ease" }}
          />
        </svg>
        <span className="cd-ring-pct" style={{ color }}>{pct}%</span>
      </div>
      <div className="cd-ring-info">
        <span className="cd-ring-val" style={{ color }}>{value}</span>
        <span className="cd-ring-lbl">{label}</span>
      </div>
    </div>
  );
}

export default function CatalogueDetail({
  detailCat, loadingDetail, hotels, voyages,
  onEdit, onSendOpen, onReload
}) {
  const [editMode,    setEditMode]    = useState(false);
  const [editForm,    setEditForm]    = useState({});
  const [saving,      setSaving]      = useState(false);
  const [previewHtml, setPreviewHtml] = useState(null);
  const [loadingPrev, setLoadingPrev] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [logs,        setLogs]        = useState([]);
  const [showLogs,    setShowLogs]    = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [activeTab,   setActiveTab]   = useState("contenu");

  const startEdit = () => {
    setEditForm({
      titre:       detailCat.titre,
      sujet:       detailCat._sujet    || detailCat.titre,
      description: detailCat._desc     || "",
      hotel_ids:   detailCat.hotel_ids || [],
      voyage_ids:  detailCat.voyage_ids|| [],
    });
    setEditMode(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`${BASE}/catalogues/${detailCat.id}`, {
        method: "PUT", headers: auth(),
        body: JSON.stringify({
          titre:          editForm.titre,
          description_ia: JSON.stringify({ titre: editForm.titre, sujet: editForm.sujet, description: editForm.description }),
          hotel_ids:      editForm.hotel_ids,
          voyage_ids:     editForm.voyage_ids,
        }),
      });
      setEditMode(false);
      onEdit(detailCat);
      onReload();
    } catch (e) { alert("Erreur : " + e.message); }
    setSaving(false);
  };

  const handlePreview = async () => {
    setLoadingPrev(true);
    try {
      const r = await fetch(`${BASE}/catalogues/${detailCat.id}/preview`, { headers: auth() });
      const d = await r.json();
      setPreviewHtml(d.html);
      setShowPreview(true);
    } catch { alert("Erreur prévisualisation"); }
    setLoadingPrev(false);
  };

  const handleLoadLogs = async () => {
    setLoadingLogs(true);
    try {
      const r = await fetch(`${BASE}/catalogues/${detailCat.id}/logs`, { headers: auth() });
      setLogs(await r.json());
      setShowLogs(true);
      setActiveTab("logs");
    } catch {}
    setLoadingLogs(false);
  };

  const toggleEditH = id => setEditForm(f => ({
    ...f, hotel_ids: f.hotel_ids.includes(id) ? f.hotel_ids.filter(x => x !== id) : [...f.hotel_ids, id],
  }));
  const toggleEditV = id => setEditForm(f => ({
    ...f, voyage_ids: f.voyage_ids.includes(id) ? f.voyage_ids.filter(x => x !== id) : [...f.voyage_ids, id],
  }));

  // ── Loading ──────────────────────────────────────────
  if (loadingDetail) {
    return (
      <div className="cd-loading">
        <div className="cd-loading__spinner" />
        <p>Chargement du catalogue...</p>
      </div>
    );
  }

  if (!detailCat) return null;

  const ls = detailCat.logs_summary || {};
  const canSend = ["BROUILLON", "ECHOUE", "ENVOYE"].includes(detailCat.statut);
  const canEdit = ["BROUILLON", "ECHOUE"].includes(detailCat.statut);

  return (
    <div className="cd-root">

      {/* ════════════════ HEADER ════════════════ */}
      <div className="cd-header">
        <div className="cd-header__left">
          {editMode ? (
            <input
              className="cd-title-input"
              value={editForm.titre}
              onChange={e => setEditForm(f => ({ ...f, titre: e.target.value }))}
            />
          ) : (
            <h1 className="cd-header__title">{detailCat.titre}</h1>
          )}
          <div className="cd-header__meta">
            <StatutBadge statut={detailCat.statut} />
            <span className="cd-header__sep">·</span>
            <span className="cd-header__date">Créé {ago(detailCat.created_at)}</span>
            {detailCat.envoye_at && (
              <>
                <span className="cd-header__sep">·</span>
                <span className="cd-header__date">Envoyé {ago(detailCat.envoye_at)}</span>
              </>
            )}
          </div>
        </div>

        <div className="cd-header__actions">
          {editMode ? (
            <>
              <button className="cd-btn cd-btn--ghost" onClick={() => setEditMode(false)}>Annuler</button>
              <button className="cd-btn cd-btn--primary" onClick={handleSave} disabled={saving}>
                {saving ? <span className="cd-spinner-sm" /> : null}
                {saving ? "Sauvegarde..." : "✓ Sauvegarder"}
              </button>
            </>
          ) : (
            <>
              <button className="cd-btn cd-btn--ghost" onClick={handlePreview} disabled={loadingPrev}>
                {loadingPrev ? <span className="cd-spinner-sm" /> : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
                Aperçu
              </button>
              {canEdit && (
                <button className="cd-btn cd-btn--ghost" onClick={startEdit}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Modifier
                </button>
              )}
              {canSend && (
                <button className="cd-btn cd-btn--send" onClick={onSendOpen}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  Envoyer
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ════════════════ KPI STRIP ════════════════ */}
      {ls.total > 0 && (
        <div className="cd-kpi-strip">
          <div className="cd-kpi">
            <div className="cd-kpi__icon" style={{ background: "#D1FAE5", color: "#10B981" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div>
              <div className="cd-kpi__val">{ls.envoyes || 0}</div>
              <div className="cd-kpi__lbl">Envoyés</div>
            </div>
          </div>
          <div className="cd-kpi-sep" />
          <div className="cd-kpi">
            <div className="cd-kpi__icon" style={{ background: "#FEE2E2", color: "#EF4444" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </div>
            <div>
              <div className="cd-kpi__val">{ls.echecs || 0}</div>
              <div className="cd-kpi__lbl">Échecs</div>
            </div>
          </div>
          <div className="cd-kpi-sep" />
          <div className="cd-kpi">
            <div className="cd-kpi__icon" style={{ background: "#DBEAFE", color: "#3B82F6" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </div>
            <div>
              <div className="cd-kpi__val">{ls.ouverts || 0}</div>
              <div className="cd-kpi__lbl">Ouvertures</div>
            </div>
          </div>
          <div className="cd-kpi-sep" />
          {/* Ring taux ouverture */}
          <div className="cd-kpi">
            <div className="cd-kpi__icon" style={{ background: "#F9F1E2", color: "#C4973A" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            </div>
            <div>
              <div className="cd-kpi__val">
                {ls.envoyes > 0 ? `${Math.round(((ls.ouverts || 0) / ls.envoyes) * 100)}%` : "—"}
              </div>
              <div className="cd-kpi__lbl">Taux ouverture</div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ TABS ════════════════ */}
      <div className="cd-tabs">
        {[
          { key: "contenu", label: "Contenu email" },
          { key: "items",   label: `Hôtels & Voyages (${(detailCat.hotels?.length || 0) + (detailCat.voyages?.length || 0)})` },
          { key: "infos",   label: "Informations" },
          ...(ls.total > 0 ? [{ key: "logs", label: `Historique (${ls.total})` }] : []),
        ].map(t => (
          <button
            key={t.key}
            className={`cd-tab${activeTab === t.key ? " cd-tab--active" : ""}`}
            onClick={() => { setActiveTab(t.key); if (t.key === "logs" && !showLogs) handleLoadLogs(); }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ════════════════ BODY ════════════════ */}
      <div className="cd-body">

        {/* ── TAB: Contenu email ── */}
        {activeTab === "contenu" && (
          <div className="cd-section" key="contenu">
            {/* Sujet */}
            <div className="cd-content-card">
              <div className="cd-content-card__header">
                <span className="cd-content-card__label">Sujet de l'email</span>
                <span className="cd-content-card__badge">Objet</span>
              </div>
              {editMode ? (
                <input
                  className="cd-input"
                  value={editForm.sujet}
                  onChange={e => setEditForm(f => ({ ...f, sujet: e.target.value }))}
                  placeholder="Sujet accrocheur..."
                />
              ) : (
                <div className="cd-sujet-display">
                  <div className="cd-sujet-display__icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  </div>
                  <span className="cd-sujet-display__text">{detailCat._sujet || detailCat.titre}</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="cd-content-card">
              <div className="cd-content-card__header">
                <span className="cd-content-card__label">Description marketing</span>
                <span className="cd-content-card__badge cd-content-card__badge--ai">✨ Claude AI</span>
              </div>
              {editMode ? (
                <textarea
                  className="cd-input cd-input--textarea"
                  value={editForm.description}
                  onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                  rows={6}
                  placeholder="Description du catalogue..."
                />
              ) : (
                detailCat._desc ? (
                  <p className="cd-desc-text">{detailCat._desc}</p>
                ) : (
                  <div className="cd-desc-empty">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    Aucune description générée
                  </div>
                )
              )}
            </div>

            {/* Aperçu iframe */}
            {showPreview && previewHtml && (
              <div className="cd-preview-box">
                <div className="cd-preview-box__header">
                  <div className="cd-preview-box__title">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    Aperçu de l'email
                  </div>
                  <button className="cd-preview-box__close" onClick={() => setShowPreview(false)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    Fermer
                  </button>
                </div>
                <iframe srcDoc={previewHtml} sandbox="allow-same-origin" title="preview" className="cd-preview-box__iframe" />
              </div>
            )}
          </div>
        )}

        {/* ── TAB: Hôtels & Voyages ── */}
        {activeTab === "items" && (
          <div className="cd-section" key="items">
            {/* Hôtels */}
            {(editMode ? hotels : detailCat.hotels)?.length > 0 && (
              <div className="cd-items-section">
                <div className="cd-items-section__header">
                  <span className="cd-items-section__title">🏨 Hôtels inclus</span>
                  <span className="cd-items-section__count">
                    {editMode ? editForm.hotel_ids.length : detailCat.hotels?.length} sélectionné{(editMode ? editForm.hotel_ids.length : detailCat.hotels?.length) > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="cd-items-grid">
                  {(editMode ? hotels : detailCat.hotels).map(item => {
                    const sel = editMode ? editForm.hotel_ids.includes(item.id) : true;
                    if (!editMode && !sel) return null;
                    return (
                      <div
                        key={item.id}
                        className={`cd-item-card${editMode ? " cd-item-card--editable" : ""}${editMode && sel ? " cd-item-card--selected" : ""}${editMode && !sel ? " cd-item-card--unselected" : ""}`}
                        onClick={editMode ? () => toggleEditH(item.id) : undefined}
                      >
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.nom} className="cd-item-card__img" />
                        ) : (
                          <div className="cd-item-card__img-placeholder">🏨</div>
                        )}
                        <div className="cd-item-card__info">
                          <p className="cd-item-card__name">{item.nom}</p>
                          <p className="cd-item-card__sub">
                            {item.ville && <span>{item.ville}</span>}
                            {item.etoiles > 0 && <span>{"★".repeat(item.etoiles)}</span>}
                          </p>
                          {item.promotion_active && (
                            <span className="cd-item-card__promo">🔥 -{Math.round(item.promotion_pourcentage)}%</span>
                          )}
                        </div>
                        {editMode && (
                          <div className={`cd-item-card__check${sel ? " cd-item-card__check--on" : ""}`}>
                            {sel && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Voyages */}
            {(editMode ? voyages : detailCat.voyages)?.length > 0 && (
              <div className="cd-items-section">
                <div className="cd-items-section__header">
                  <span className="cd-items-section__title">✈️ Voyages inclus</span>
                  <span className="cd-items-section__count">
                    {editMode ? editForm.voyage_ids.length : detailCat.voyages?.length} sélectionné{(editMode ? editForm.voyage_ids.length : detailCat.voyages?.length) > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="cd-items-grid">
                  {(editMode ? voyages : detailCat.voyages).map(item => {
                    const sel = editMode ? editForm.voyage_ids.includes(item.id) : true;
                    if (!editMode && !sel) return null;
                    return (
                      <div
                        key={item.id}
                        className={`cd-item-card${editMode ? " cd-item-card--editable" : ""}${editMode && sel ? " cd-item-card--selected" : ""}${editMode && !sel ? " cd-item-card--unselected" : ""}`}
                        onClick={editMode ? () => toggleEditV(item.id) : undefined}
                      >
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.titre} className="cd-item-card__img" />
                        ) : (
                          <div className="cd-item-card__img-placeholder">✈️</div>
                        )}
                        <div className="cd-item-card__info">
                          <p className="cd-item-card__name">{item.titre}</p>
                          <p className="cd-item-card__sub">
                            {item.destination && <span>{item.destination}</span>}
                            {item.duree > 0 && <span>{item.duree}j</span>}
                            {item.prix_base > 0 && <span>{Math.round(item.prix_base)} DT</span>}
                          </p>
                        </div>
                        {editMode && (
                          <div className={`cd-item-card__check${sel ? " cd-item-card__check--on" : ""}`}>
                            {sel && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: Informations ── */}
        {activeTab === "infos" && (
          <div className="cd-section cd-infos-grid" key="infos">
            {/* Statistiques circulaires */}
            {ls.total > 0 && (
              <div className="cd-info-card">
                <h3 className="cd-info-card__title">Performance d'envoi</h3>
                <div className="cd-rings-row">
                  <StatRing label="Envoyés"    value={ls.envoyes || 0} total={ls.total} color="#10B981" />
                  <StatRing label="Ouvertures" value={ls.ouverts || 0} total={ls.envoyes || 1} color="#3B82F6" />
                  <StatRing label="Échecs"     value={ls.echecs  || 0} total={ls.total} color="#EF4444" />
                </div>
              </div>
            )}

            {/* Détails */}
            <div className="cd-info-card">
              <h3 className="cd-info-card__title">Détails du catalogue</h3>
              <div className="cd-info-rows">
                {[
                  { icon: "🗓", label: "Créé le",          val: new Date(detailCat.created_at).toLocaleDateString("fr-FR", { day:"2-digit", month:"long", year:"numeric" }) },
                  { icon: "📤", label: "Envoyé le",         val: detailCat.envoye_at ? new Date(detailCat.envoye_at).toLocaleDateString("fr-FR", { day:"2-digit", month:"long", year:"numeric" }) : "—" },
                  { icon: "🏨", label: "Hôtels",            val: `${(detailCat.hotel_ids || []).length} hôtel(s)` },
                  { icon: "✈️", label: "Voyages",           val: `${(detailCat.voyage_ids || []).length} voyage(s)` },
                  { icon: "👥", label: "Destinataires",     val: detailCat.destinataires || "tous" },
                  { icon: "📊", label: "Total envois",      val: `${detailCat.nb_envoyes || 0} emails` },
                  { icon: "👁", label: "Suivi ouvertures",  val: detailCat.tracking_enabled ? "Activé" : "Désactivé" },
                ].map(r => (
                  <div key={r.label} className="cd-info-row">
                    <span className="cd-info-row__icon">{r.icon}</span>
                    <span className="cd-info-row__label">{r.label}</span>
                    <span className="cd-info-row__val">{r.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: Historique logs ── */}
        {activeTab === "logs" && (
          <div className="cd-section" key="logs">
            {loadingLogs ? (
              <div className="cd-loading">
                <div className="cd-loading__spinner" />
                <p>Chargement de l'historique...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="cd-logs-empty">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                <p>Aucun envoi enregistré</p>
              </div>
            ) : (
              <div className="cd-logs-table-wrap">
                <table className="cd-logs-table">
                  <thead>
                    <tr>
                      <th>Statut</th>
                      <th>Email</th>
                      <th>Nom</th>
                      <th>Ouverture</th>
                      <th>Date envoi</th>
                      <th>Tentatives</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(l => (
                      <tr key={l.id}>
                        <td>
                          <span className={`cd-log-status cd-log-status--${l.statut}`}>
                            {l.statut === "sent" ? "✓ Envoyé" : l.statut === "failed" ? "✗ Échoué" : "⏳ En attente"}
                          </span>
                        </td>
                        <td className="cd-log-email">{l.email}</td>
                        <td className="cd-log-nom">{l.nom || "—"}</td>
                        <td>
                          {l.opened_at ? (
                            <span className="cd-log-opened">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                              Ouvert
                            </span>
                          ) : <span className="cd-log-not-opened">—</span>}
                        </td>
                        <td className="cd-log-date">
                          {l.sent_at ? new Date(l.sent_at).toLocaleString("fr-FR", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" }) : "—"}
                        </td>
                        <td>
                          {l.retry_count > 0 ? (
                            <span className="cd-log-retry">×{l.retry_count}</span>
                          ) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}