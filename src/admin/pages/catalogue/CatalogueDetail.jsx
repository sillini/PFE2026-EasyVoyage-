// src/admin/pages/catalogue/CatalogueDetail.jsx
import { useState } from "react";
import "./CatalogueDetail.css";
import { BASE, auth } from "./constants";
import { ago } from "./utils";
import { StatutBadge, StatCard, Spinner } from "./CatalogueUI";

export default function CatalogueDetail({ detailCat, loadingDetail, hotels, voyages, onEdit, onSendOpen, onReload }) {
  const [editMode,    setEditMode]    = useState(false);
  const [editForm,    setEditForm]    = useState({});
  const [saving,      setSaving]      = useState(false);
  const [previewHtml, setPreviewHtml] = useState(null);
  const [loadingPrev, setLoadingPrev] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [logs,        setLogs]        = useState([]);
  const [showLogs,    setShowLogs]    = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const startEdit = () => {
    setEditForm({
      titre:       detailCat.titre,
      sujet:       detailCat._sujet       || detailCat.titre,
      description: detailCat._desc        || "",
      hotel_ids:   detailCat.hotel_ids    || [],
      voyage_ids:  detailCat.voyage_ids   || [],
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
    } catch {}
    setLoadingLogs(false);
  };

  const toggleEditH = (id) => setEditForm(f => ({
    ...f, hotel_ids: f.hotel_ids.includes(id) ? f.hotel_ids.filter(x => x !== id) : [...f.hotel_ids, id],
  }));
  const toggleEditV = (id) => setEditForm(f => ({
    ...f, voyage_ids: f.voyage_ids.includes(id) ? f.voyage_ids.filter(x => x !== id) : [...f.voyage_ids, id],
  }));

  if (loadingDetail) return <div className="cat-loading-center"><Spinner size="lg" /></div>;
  if (!detailCat)    return null;

  const canEdit = detailCat.statut === "BROUILLON" || detailCat.statut === "ECHOUE";

  return (
    <div className="cat-detail">

      {/* ── Barre de titre ─────────────────────────── */}
      <div className="cat-detail__topbar">
        <div className="cat-detail__topbar-left">
          <div className="cat-detail__topbar-badges">
            <StatutBadge statut={detailCat.statut} size="lg" />
            {detailCat.scheduled_at && (
              <span className="cat-detail__topbar-scheduled">
                📅 {new Date(detailCat.scheduled_at).toLocaleString("fr-FR")}
              </span>
            )}
          </div>
          {editMode
            ? <input className="cat-input" value={editForm.titre}
                onChange={e => setEditForm(f => ({ ...f, titre: e.target.value }))}
                style={{ fontSize: 18, fontWeight: 800, padding: "6px 10px" }} />
            : <h2 className="cat-detail__topbar-title">{detailCat.titre}</h2>
          }
        </div>

        <div className="cat-detail__topbar-actions">
          {canEdit && !editMode && (
            <>
              <button className="cat-btn-ghost" onClick={handlePreview} disabled={loadingPrev}
                style={{ fontSize: 12, padding: "8px 14px" }}>
                {loadingPrev ? "⏳" : "👁"} Aperçu
              </button>
              <button className="cat-btn-ghost" onClick={startEdit}
                style={{ fontSize: 12, padding: "8px 14px" }}>
                ✏️ Modifier
              </button>
              <button className="cat-btn-gold" onClick={onSendOpen}
                style={{ fontSize: 12, padding: "8px 18px" }}>
                📧 Envoyer
              </button>
            </>
          )}
          {editMode && (
            <>
              <button className="cat-btn-ghost" onClick={() => setEditMode(false)}>Annuler</button>
              <button className="cat-btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? "Sauvegarde..." : "✓ Sauvegarder"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Corps 2 colonnes ──────────────────────── */}
      <div className="cat-detail__body">

        {/* Colonne gauche */}
        <div className="cat-detail__col-left">

          {/* Contenu email */}
          <div className="cat-detail-card">
            <p className="cat-detail-card__title">Contenu de l'email</p>
            {editMode ? (
              <div className="cat-detail__edit-fields">
                <div>
                  <label className="cat-detail__edit-label">Sujet email</label>
                  <input className="cat-input" value={editForm.sujet}
                    onChange={e => setEditForm(f => ({ ...f, sujet: e.target.value }))} />
                </div>
                <div>
                  <label className="cat-detail__edit-label">Description marketing</label>
                  <textarea className="cat-input cat-input--textarea" value={editForm.description}
                    onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} rows={5} />
                </div>
              </div>
            ) : (
              <>
                <div className="cat-detail__sujet-box">
                  <span className="cat-detail__sujet-icon">✉️</span>
                  {detailCat._sujet}
                </div>
                {detailCat._desc && <p className="cat-detail__description">{detailCat._desc}</p>}
              </>
            )}
          </div>

          {/* Hôtels inclus */}
          {(editMode || detailCat.hotels?.length > 0) && (
            <ItemsCard title="🏨 Hôtels inclus"
              items={editMode ? hotels : detailCat.hotels}
              selectedIds={editMode ? editForm.hotel_ids : null}
              onToggle={editMode ? toggleEditH : null}
            />
          )}

          {/* Voyages inclus */}
          {(editMode || detailCat.voyages?.length > 0) && (
            <ItemsCard title="✈️ Voyages inclus"
              items={editMode ? voyages : detailCat.voyages}
              selectedIds={editMode ? editForm.voyage_ids : null}
              onToggle={editMode ? toggleEditV : null}
              isVoyage
            />
          )}

          {/* Aperçu iframe */}
          {showPreview && previewHtml && (
            <div className="cat-detail__preview">
              <div className="cat-detail__preview-header">
                <span className="cat-detail__preview-title">👁 Aperçu de l'email</span>
                <button className="cat-btn-ghost" onClick={() => setShowPreview(false)}
                  style={{ padding: "4px 10px", fontSize: 11 }}>✕ Fermer</button>
              </div>
              <iframe srcDoc={previewHtml} sandbox="allow-same-origin" title="preview" />
            </div>
          )}

          {/* Logs */}
          {showLogs && (
            <div className="cat-detail__logs">
              <div className="cat-detail__logs-header">
                <span className="cat-detail__logs-title">📋 Historique des envois</span>
                <button className="cat-btn-ghost" onClick={() => setShowLogs(false)}
                  style={{ padding: "4px 10px", fontSize: 11 }}>✕</button>
              </div>
              <div className="cat-detail__logs-body">
                {logs.map(l => (
                  <div key={l.id} className="cat-detail__log-row">
                    <span className="cat-detail__log-icon">{l.statut === "sent" ? "✅" : l.statut === "failed" ? "❌" : "⏳"}</span>
                    <span className="cat-detail__log-email">{l.email}</span>
                    {l.nom && <span className="cat-detail__log-nom">{l.nom}</span>}
                    {l.opened_at && <span className="cat-detail__log-opened">Ouvert</span>}
                    {l.retry_count > 0 && <span className="cat-detail__log-retry">×{l.retry_count}</span>}
                    <span className="cat-detail__log-time">
                      {l.sent_at ? new Date(l.sent_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "—"}
                    </span>
                  </div>
                ))}
                {logs.length === 0 && <p className="cat-detail__logs-empty">Aucun log disponible</p>}
              </div>
            </div>
          )}
        </div>

        {/* Colonne droite */}
        <div className="cat-detail__col-right">

          {/* Stats */}
          {detailCat.logs_summary && (
            <div className="cat-detail-card">
              <p className="cat-detail-card__title">Statistiques</p>
              <div className="cat-detail__stats-grid">
                <StatCard label="Total"   value={detailCat.logs_summary.total} />
                <StatCard label="Envoyés" value={detailCat.logs_summary.envoyes} color="#16A34A" />
                <StatCard label="Échecs"  value={detailCat.logs_summary.echecs}  color="#DC2626" />
                <StatCard label="Ouverts" value={detailCat.logs_summary.ouverts} color="#2563EB"
                  sub={detailCat.logs_summary.envoyes > 0
                    ? `${Math.round(detailCat.logs_summary.ouverts / detailCat.logs_summary.envoyes * 100)}% taux`
                    : null}
                />
              </div>
            </div>
          )}

          {/* Infos */}
          <div className="cat-detail-card">
            <p className="cat-detail-card__title">Informations</p>
            {[
              { label: "Créé le",   value: new Date(detailCat.created_at).toLocaleDateString("fr-FR") },
              { label: "Envoyé le", value: detailCat.envoye_at ? new Date(detailCat.envoye_at).toLocaleDateString("fr-FR") : "—" },
              { label: "Hôtels",    value: `${(detailCat.hotel_ids || []).length} hôtel(s)` },
              { label: "Voyages",   value: `${(detailCat.voyage_ids || []).length} voyage(s)` },
            ].map(r => (
              <div key={r.label} className="cat-detail__info-row">
                <span className="cat-detail__info-label">{r.label}</span>
                <span className="cat-detail__info-value">{r.value}</span>
              </div>
            ))}
          </div>

          {/* Actions secondaires */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {detailCat.logs_summary?.total > 0 && !showLogs && (
              <button className="cat-btn-ghost" onClick={handleLoadLogs} disabled={loadingLogs}
                style={{ width: "100%", justifyContent: "center" }}>
                {loadingLogs ? "⏳ Chargement..." : `📋 Historique (${detailCat.logs_summary.total})`}
              </button>
            )}
            {detailCat.statut === "ENVOYE" && (
              <div className="cat-detail__status-sent">
                ✅ Envoyé à {detailCat.nb_envoyes} contact(s)<br />
                <span>{ago(detailCat.envoye_at)}</span>
              </div>
            )}
            {detailCat.statut === "EN_COURS" && (
              <div className="cat-detail__status-inprogress">
                <span className="cat-detail__inprogress-dot" />
                Envoi en cours...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sous-composant items (hôtels ou voyages) ──────────────
function ItemsCard({ title, items = [], selectedIds, onToggle, isVoyage = false }) {
  return (
    <div className="cat-detail-card">
      <p className="cat-detail-card__title">{title}</p>
      <div className="cat-detail__items-list">
        {items.map(item => {
          const id  = item.id;
          const sel = selectedIds ? selectedIds.includes(id) : true;
          if (selectedIds && !sel) return null;
          return (
            <div
              key={id}
              className={`cat-detail__item${onToggle ? " cat-detail__item--editable" : ""}${sel && onToggle ? " cat-detail__item--selected" : ""}`}
              onClick={onToggle ? () => onToggle(id) : undefined}
            >
              {item.image_url
                ? <img className="cat-detail__item-img" src={item.image_url} alt="" />
                : <div className="cat-detail__item-placeholder">{isVoyage ? "✈️" : "🏨"}</div>
              }
              <div className="cat-detail__item-body">
                <div className="cat-detail__item-name">{isVoyage ? item.titre : item.nom}</div>
                <div className="cat-detail__item-sub">
                  {isVoyage
                    ? `${item.destination} · ${item.duree}j · ${parseInt(item.prix_base)} DT`
                    : `${item.ville || ""}${item.etoiles ? ` · ${"★".repeat(item.etoiles)}` : ""}`
                  }
                </div>
              </div>
              {onToggle && <span className="cat-detail__item-toggle" style={{ color: sel ? "#C4973A" : "#CBD5E1" }}>{sel ? "✓" : "+"}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}