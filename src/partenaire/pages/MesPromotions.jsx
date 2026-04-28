// ══════════════════════════════════════════════════════════
//  src/partenaire/pages/MesPromotions.jsx
//  Espace Partenaire — Gestion promotions avec workflow + IA description
// ══════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import { promotionsApi } from "../services/promotionsApi";
import { hotelsApi }     from "../services/api";
import "./MesPromotions.css";

// ── Config statuts ────────────────────────────────────────
const STATUT_CONFIG = {
  PENDING: {
    label: "En attente",
    icon: "⏳",
    color: "#D97706",
    bg: "rgba(217, 119, 6, 0.10)",
    border: "rgba(217, 119, 6, 0.28)",
    dot: "#D97706",
  },
  APPROVED: {
    label: "Approuvée",
    icon: "✅",
    color: "#059669",
    bg: "rgba(5, 150, 105, 0.10)",
    border: "rgba(5, 150, 105, 0.28)",
    dot: "#059669",
  },
  REJECTED: {
    label: "Refusée",
    icon: "❌",
    color: "#DC2626",
    bg: "rgba(220, 38, 38, 0.10)",
    border: "rgba(220, 38, 38, 0.28)",
    dot: "#DC2626",
  },
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// ══════════════════════════════════════════════════════════
//  COMPOSANT PRINCIPAL
// ══════════════════════════════════════════════════════════
export default function MesPromotions() {
  const [promos,    setPromos]    = useState([]);
  const [hotels,    setHotels]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [filter,    setFilter]    = useState("all");
  const [search,    setSearch]    = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editPromo, setEditPromo] = useState(null);
  const [toast,     setToast]     = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pData, hData] = await Promise.all([
        promotionsApi.list(),
        hotelsApi.mesHotels(),
      ]);
      setPromos(pData?.items || []);
      setHotels(hData?.items || hData || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Filtrage ─────────────────────────────────────────
  const filtered = promos.filter((p) => {
    if (filter === "pending"  && p.statut !== "PENDING")  return false;
    if (filter === "approved" && p.statut !== "APPROVED") return false;
    if (filter === "rejected" && p.statut !== "REJECTED") return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        p.titre?.toLowerCase().includes(q) ||
        p.hotel?.nom?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // ── KPI ───────────────────────────────────────────────
  const nbPending  = promos.filter(p => p.statut === "PENDING").length;
  const nbApproved = promos.filter(p => p.statut === "APPROVED").length;
  const nbRejected = promos.filter(p => p.statut === "REJECTED").length;
  const nbActive   = promos.filter(p => p.est_valide_maintenant).length;

  // ── Handlers ─────────────────────────────────────────
  const handleSave = async (hotelId, data, promoId) => {
    try {
      if (promoId) {
        await promotionsApi.update(promoId, data);
        showToast("Promotion modifiée — en attente de validation");
      } else {
        await promotionsApi.create(hotelId, data);
        showToast("Promotion soumise — en attente de validation par l'administrateur");
      }
      setShowModal(false);
      setEditPromo(null);
      load();
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  const handleDelete = async (promo) => {
    if (!confirm(`Supprimer la promotion « ${promo.titre} » ?`)) return;
    try {
      await promotionsApi.delete(promo.id);
      showToast("Promotion supprimée");
      load();
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  return (
    <div className="mp-root">
      {/* TOAST */}
      {toast && (
        <div className={`mp-toast mp-toast--${toast.type}`}>
          {toast.type === "success" ? "✓" : "✗"} {toast.msg}
        </div>
      )}

      {/* HEADER */}
      <header className="mp-header">
        <div className="mp-header-left">
          <div className="mp-eyebrow">
            <span className="mp-eyebrow-dot" />
            ESPACE PROMOTIONS
          </div>
          <h1 className="mp-title">Mes <em>Promotions</em></h1>
          <p className="mp-subtitle">
            Soumettez vos offres spéciales — elles seront visibles après validation par l'équipe
          </p>
        </div>
        <button
          className="mp-btn-add"
          onClick={() => { setEditPromo(null); setShowModal(true); }}
          disabled={hotels.length === 0}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nouvelle promotion
        </button>
      </header>

      {/* KPI GRID */}
      <section className="mp-kpi-grid">
        <KpiCard variant="blue"   icon="📋" value={promos.length}  label="Total soumises"      sub="toutes promotions" />
        <KpiCard variant="gold"   icon="⏳" value={nbPending}      label="En attente"          sub="validation admin" pulse={nbPending > 0} />
        <KpiCard variant="green"  icon="✅" value={nbApproved}     label="Approuvées"          sub={`${nbActive} actives`} />
        <KpiCard variant="red"    icon="❌" value={nbRejected}     label="Refusées"            sub="à corriger" />
      </section>

      {/* BANDEAU INFO WORKFLOW */}
      <div className="mp-workflow-info">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>
          Toute promotion soumise est d'abord vérifiée par notre équipe avant d'être publiée.
          Vous recevrez un email dès qu'une décision est prise.
        </span>
      </div>

      {/* TOOLBAR */}
      <section className="mp-toolbar">
        <div className="mp-filters">
          {[
            { id: "all",      label: "Toutes",      count: promos.length },
            { id: "pending",  label: "En attente",  count: nbPending,  dot: "#D97706" },
            { id: "approved", label: "Approuvées",  count: nbApproved, dot: "#059669" },
            { id: "rejected", label: "Refusées",    count: nbRejected, dot: "#DC2626" },
          ].map((f) => (
            <button
              key={f.id}
              className={`mp-filter ${filter === f.id ? "active" : ""}`}
              onClick={() => setFilter(f.id)}
            >
              {f.dot && <span className="mp-filter-dot" style={{ background: f.dot }} />}
              {f.label}
              <span className="mp-filter-count">{f.count}</span>
            </button>
          ))}
        </div>
        <div className="mp-search-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="mp-search"
            placeholder="Rechercher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </section>

      {/* CONTENU */}
      {loading && (
        <div className="mp-loading">
          <div className="mp-spinner" />
          <p>Chargement de vos promotions…</p>
        </div>
      )}

      {!loading && error && (
        <div className="mp-error">
          <span>⚠</span> {error}
          <button onClick={load}>Réessayer</button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="mp-empty">
          <div className="mp-empty-icon">🎁</div>
          <h3>Aucune promotion trouvée</h3>
          <p>
            {search
              ? `Aucune promotion ne correspond à "${search}"`
              : filter !== "all"
              ? "Aucune promotion dans cette catégorie"
              : "Soumettez votre première promotion pour attirer plus de clients"}
          </p>
          {filter === "all" && !search && hotels.length > 0 && (
            <button className="mp-btn-add" onClick={() => { setEditPromo(null); setShowModal(true); }}>
              Créer ma première promotion
            </button>
          )}
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="mp-grid">
          {filtered.map((p) => (
            <PromoCard
              key={p.id}
              promo={p}
              onEdit={() => { setEditPromo(p); setShowModal(true); }}
              onDelete={() => handleDelete(p)}
            />
          ))}
        </div>
      )}

      {/* MODAL CRÉATION / ÉDITION */}
      {showModal && (
        <PromoModal
          promo={editPromo}
          hotels={hotels}
          onClose={() => { setShowModal(false); setEditPromo(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  KPI Card
// ══════════════════════════════════════════════════════════
function KpiCard({ variant, icon, value, label, sub, pulse }) {
  return (
    <div className={`mp-kpi mp-kpi--${variant}`}>
      <div className="mp-kpi-icon">
        <span>{icon}</span>
        {pulse && <span className="mp-kpi-pulse" />}
      </div>
      <div className="mp-kpi-body">
        <div className="mp-kpi-value">{value}</div>
        <div className="mp-kpi-label">{label}</div>
        <div className="mp-kpi-sub">{sub}</div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  Badge Statut
// ══════════════════════════════════════════════════════════
function StatutBadge({ statut }) {
  const cfg = STATUT_CONFIG[statut] || STATUT_CONFIG.PENDING;
  return (
    <span
      className="mp-statut-badge"
      style={{
        color: cfg.color,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
      }}
    >
      <span className="mp-statut-dot" style={{ background: cfg.dot }} />
      {cfg.icon} {cfg.label}
    </span>
  );
}

// ══════════════════════════════════════════════════════════
//  Carte Promotion
// ══════════════════════════════════════════════════════════
function PromoCard({ promo, onEdit, onDelete }) {
  const isEditable = promo.statut === "PENDING" || promo.statut === "REJECTED";
  const isDeletable = promo.statut !== "APPROVED";
  const isActive = promo.est_valide_maintenant;

  return (
    <article className={`mp-card ${isActive ? "mp-card--active" : ""} mp-card--${promo.statut.toLowerCase()}`}>
      {/* Badge statut en haut à droite */}
      <div className="mp-card-statut">
        <StatutBadge statut={promo.statut} />
        {isActive && <span className="mp-badge-live">● EN LIGNE</span>}
      </div>

      {/* En-tête carte */}
      <div className="mp-card-head">
        <div className="mp-card-pct">-{Math.round(promo.pourcentage)}%</div>
        <div className="mp-card-info">
          <h3 className="mp-card-title">{promo.titre}</h3>
          <p className="mp-card-hotel">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            {promo.hotel?.nom || `Hôtel #${promo.id_hotel}`}
          </p>
        </div>
      </div>

      {/* Description */}
      {promo.description && (
        <p className="mp-card-desc">{promo.description}</p>
      )}

      {/* Dates */}
      <div className="mp-card-dates">
        <span>📅 Du {fmtDate(promo.date_debut)} au {fmtDate(promo.date_fin)}</span>
        {promo.jours_restants !== null && promo.jours_restants !== undefined && (
          <span className="mp-card-remaining">
            {promo.jours_restants > 0
              ? `${promo.jours_restants}j restants`
              : "Dernier jour !"}
          </span>
        )}
      </div>

      {/* Raison de refus */}
      {promo.statut === "REJECTED" && promo.raison_refus && (
        <div className="mp-card-refus">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span><strong>Motif :</strong> {promo.raison_refus}</span>
        </div>
      )}

      {/* Actions */}
      <div className="mp-card-actions">
        {isEditable && (
          <button className="mp-btn-ghost" onClick={onEdit}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            {promo.statut === "REJECTED" ? "Modifier & resoumettre" : "Modifier"}
          </button>
        )}
        {isDeletable && (
          <button className="mp-btn-delete" onClick={onDelete} title="Supprimer">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </button>
        )}
        {promo.statut === "APPROVED" && (
          <div className="mp-card-approved-info">
            ✅ Validée le {fmtDate(promo.date_decision)}
          </div>
        )}
      </div>
    </article>
  );
}

// ══════════════════════════════════════════════════════════
//  Modal Création / Édition (avec IA pour la description)
// ══════════════════════════════════════════════════════════
function PromoModal({ promo, hotels, onClose, onSave }) {
  const [form, setForm] = useState({
    hotel_id:    promo?.id_hotel    || (hotels[0]?.id ?? ""),
    titre:       promo?.titre       || "",
    description: promo?.description || "",
    pourcentage: promo?.pourcentage || "",
    date_debut:  promo?.date_debut  || "",
    date_fin:    promo?.date_fin    || "",
  });
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState(null);

  // ── États IA ───────────────────────────────────────────
  const [aiLoading,  setAiLoading]  = useState(false);
  const [aiError,    setAiError]    = useState("");
  const [aiOriginal, setAiOriginal] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Hôtel actuellement sélectionné (pour contexte IA)
  const selectedHotel = hotels.find(h => h.id === Number(form.hotel_id));

  // ── Génération IA ──────────────────────────────────────
  const handleGenerateAI = async () => {
    setAiError("");

    if (!form.titre.trim()) {
      setAiError("Renseignez d'abord le titre de la promotion");
      return;
    }
    if (!form.pourcentage || form.pourcentage <= 0 || form.pourcentage >= 100) {
      setAiError("Renseignez d'abord un pourcentage valide (1-99)");
      return;
    }
    if (!form.description.trim() || form.description.trim().length < 3) {
      setAiError("Écrivez d'abord quelques mots, l'IA se chargera de les enrichir");
      return;
    }

    setAiLoading(true);
    try {
      const res = await promotionsApi.generateDescriptionAI({
        titre:             form.titre.trim(),
        pourcentage:       parseFloat(form.pourcentage),
        date_debut:        form.date_debut || null,
        date_fin:          form.date_fin   || null,
        description_brute: form.description.trim(),
        hotel_nom:         selectedHotel?.nom     || null,
        hotel_ville:       selectedHotel?.ville   || null,
        hotel_etoiles:     selectedHotel?.etoiles || null,
      });

      setAiOriginal(form.description);
      setForm(f => ({ ...f, description: res.description_amelioree }));
    } catch (e) {
      setAiError(e.message || "Impossible de générer la description");
    } finally {
      setAiLoading(false);
    }
  };

  const handleRevertAI = () => {
    if (aiOriginal !== null) {
      setForm(f => ({ ...f, description: aiOriginal }));
      setAiOriginal(null);
    }
  };

  const handleSubmit = async () => {
    setErr(null);
    if (!form.titre.trim())                   return setErr("Le titre est obligatoire");
    if (!form.pourcentage || form.pourcentage <= 0 || form.pourcentage >= 100)
      return setErr("Le pourcentage doit être entre 1 et 99");
    if (!form.date_debut || !form.date_fin)   return setErr("Les dates sont obligatoires");
    if (form.date_fin < form.date_debut)       return setErr("La date de fin doit être après la date de début");
    if (!form.hotel_id)                        return setErr("Sélectionnez un hôtel");

    setSaving(true);
    try {
      const payload = {
        titre:       form.titre.trim(),
        description: form.description.trim() || null,
        pourcentage: parseFloat(form.pourcentage),
        date_debut:  form.date_debut,
        date_fin:    form.date_fin,
      };
      await onSave(form.hotel_id, payload, promo?.id || null);
    } catch (e) {
      setErr(e.message);
      setSaving(false);
    }
  };

  const isEdit = !!promo;
  const isResubmit = promo?.statut === "REJECTED";

  return (
    <div className="mp-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mp-modal">
        {/* Header */}
        <div className="mp-modal-header">
          <div className="mp-modal-header-content">
            <div className="mp-modal-eyebrow">
              <span className="mp-eyebrow-dot" />
              {isResubmit ? "RESOUMETTRE" : isEdit ? "MODIFIER" : "NOUVELLE PROMOTION"}
            </div>
            <h2>{isResubmit ? "Corriger & resoumettre" : isEdit ? "Modifier la promotion" : "Créer une promotion"}</h2>
            <p>
              {isResubmit
                ? "Modifiez votre promotion et resoumettez-la pour validation"
                : isEdit
                ? "Modifiez les informations de votre promotion"
                : "Remplissez le formulaire — l'équipe la validera avant publication"}
            </p>
          </div>
          <button className="mp-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="mp-form">
          {/* Hôtel */}
          <div className="mp-form-section">
            <div className="mp-form-section-title">
              <span className="mp-form-section-num">1</span>
              Hôtel concerné
            </div>
            <div className="mp-field">
              <label>Hôtel *</label>
              <select
                value={form.hotel_id}
                onChange={e => set("hotel_id", parseInt(e.target.value))}
                disabled={isEdit}
              >
                {hotels.map(h => (
                  <option key={h.id} value={h.id}>{h.nom}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Détails */}
          <div className="mp-form-section">
            <div className="mp-form-section-title">
              <span className="mp-form-section-num">2</span>
              Détails de la promotion
            </div>
            <div className="mp-field">
              <label>Titre *</label>
              <input
                type="text"
                placeholder="Ex : Offre d'été, Promotion spéciale…"
                value={form.titre}
                onChange={e => set("titre", e.target.value)}
                maxLength={200}
              />
            </div>

            {/* ──────────────────────────────────────────
                Description + bouton IA
               ────────────────────────────────────────── */}
            <div className="mp-field">
              <div className="mp-desc-label-row">
                <label style={{ marginBottom: 0 }}>Description (optionnelle)</label>

                <div className="mp-ai-btn-group">
                  {aiOriginal !== null && !aiLoading && (
                    <button
                      type="button"
                      className="mp-ai-revert-btn"
                      onClick={handleRevertAI}
                      title="Revenir à votre texte original"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                        <polyline points="1 4 1 10 7 10"/>
                        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
                      </svg>
                      Annuler IA
                    </button>
                  )}

                  <button
                    type="button"
                    className={`mp-ai-generate-btn ${aiLoading ? "is-loading" : ""}`}
                    onClick={handleGenerateAI}
                    disabled={aiLoading}
                    title="Laissez Claude IA améliorer votre description"
                  >
                    {aiLoading ? (
                      <>
                        <span className="mp-ai-spinner" />
                        Génération…
                      </>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                             strokeWidth="2" width="13" height="13">
                          <path d="M12 2l2.09 6.26L20 9l-5 4.87L16.18 20 12 16.77 7.82 20 9 13.87 4 9l5.91-.74L12 2z"/>
                        </svg>
                        {aiOriginal !== null ? "Régénérer" : "Améliorer avec IA"}
                      </>
                    )}
                  </button>
                </div>
              </div>

              <textarea
                className={aiOriginal !== null ? "mp-ai-improved" : ""}
                placeholder="Décrivez brièvement votre promotion…"
                value={form.description}
                onChange={e => {
                  set("description", e.target.value);
                  setAiError("");
                }}
                rows={aiOriginal !== null ? 5 : 3}
              />

              {/* Badge confirmation IA */}
              {aiOriginal !== null && !aiLoading && (
                <div className="mp-ai-hint-box">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                    <path d="M12 2l2.09 6.26L20 9l-5 4.87L16.18 20 12 16.77 7.82 20 9 13.87 4 9l5.91-.74L12 2z"/>
                  </svg>
                  <span>
                    <strong>Description améliorée par l'IA.</strong>{" "}
                    Vous pouvez la modifier librement avant de soumettre.
                  </span>
                </div>
              )}

              {/* Erreur IA */}
              {aiError && (
                <div className="mp-ai-error-box">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {aiError}
                </div>
              )}
            </div>

            <div className="mp-field">
              <label>Réduction (%) *</label>
              <div className="mp-field-pct">
                <input
                  type="number"
                  min="1"
                  max="99"
                  step="1"
                  placeholder="Ex : 20"
                  value={form.pourcentage}
                  onChange={e => set("pourcentage", e.target.value)}
                />
                <span className="mp-pct-symbol">%</span>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="mp-form-section">
            <div className="mp-form-section-title">
              <span className="mp-form-section-num">3</span>
              Période de validité
            </div>
            <div className="mp-field-row">
              <div className="mp-field">
                <label>Date de début *</label>
                <input type="date" value={form.date_debut} onChange={e => set("date_debut", e.target.value)} />
              </div>
              <div className="mp-field">
                <label>Date de fin *</label>
                <input type="date" value={form.date_fin} onChange={e => set("date_fin", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Erreur */}
          {err && (
            <div className="mp-form-error">
              <span>⚠</span> {err}
            </div>
          )}

          {/* Note workflow */}
          <div className="mp-form-note">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            Votre promotion sera soumise à validation. Vous serez notifié par email dès qu'une décision est prise.
          </div>

          {/* Actions */}
          <div className="mp-modal-actions">
            <button className="mp-btn-ghost-lg" onClick={onClose} disabled={saving || aiLoading}>
              Annuler
            </button>
            <button className="mp-btn-primary" onClick={handleSubmit} disabled={saving || aiLoading}>
              {saving ? <span className="mp-btn-spin" /> : null}
              {isResubmit ? "Resoumettre" : isEdit ? "Enregistrer" : "Soumettre la promotion"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}