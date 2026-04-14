// ══════════════════════════════════════════════════════════
//  src/partenaire/pages/MesPromotions.jsx
//  Page de gestion des promotions — Design Premium
// ══════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import { promotionsApi } from "../services/promotionsApi";
import { hotelsApi } from "../services/api";
import "./MesPromotions.css";

const TYPE_CONFIG = {
  STANDARD: {
    icon: "🎁",
    label: "Standard",
    color: "#C4973A",
    bg: "rgba(196, 151, 58, 0.08)",
    border: "rgba(196, 151, 58, 0.22)",
  },
  EARLY_BOOKING: {
    icon: "⏰",
    label: "Early Booking",
    color: "#27AE60",
    bg: "rgba(39, 174, 96, 0.08)",
    border: "rgba(39, 174, 96, 0.22)",
  },
  LAST_MINUTE: {
    icon: "⚡",
    label: "Last Minute",
    color: "#E74C3C",
    bg: "rgba(231, 76, 60, 0.08)",
    border: "rgba(231, 76, 60, 0.22)",
  },
};

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

export default function MesPromotions() {
  const [promos,    setPromos]    = useState([]);
  const [hotels,    setHotels]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editPromo, setEditPromo] = useState(null);
  const [filter,    setFilter]    = useState("all");
  const [search,    setSearch]    = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [promosData, hotelsData] = await Promise.all([
        promotionsApi.list(),
        hotelsApi.mesHotels({ per_page: 100 }),
      ]);
      setPromos(promosData?.items || []);
      setHotels(hotelsData?.items || []);
    } catch (e) {
      setError(e.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (formData, hotelId, promoId) => {
    if (promoId) await promotionsApi.update(promoId, formData);
    else          await promotionsApi.create(hotelId, formData);
    setShowModal(false);
    setEditPromo(null);
    await load();
  };

  const handleToggle = async (promo) => {
    try {
      await promotionsApi.toggle(promo.id, !promo.actif);
      await load();
    } catch (e) {
      alert("Erreur : " + e.message);
    }
  };

  const handleDelete = async (promo) => {
    if (!confirm(`Supprimer la promotion "${promo.titre}" ?`)) return;
    try {
      await promotionsApi.delete(promo.id);
      await load();
    } catch (e) {
      alert("Erreur : " + e.message);
    }
  };

  const filtered = promos
    .filter((p) => {
      if (filter === "active")   return p.est_valide_maintenant;
      if (filter === "inactive") return !p.est_valide_maintenant;
      return true;
    })
    .filter((p) => {
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        p.titre?.toLowerCase().includes(s) ||
        p.hotel?.nom?.toLowerCase().includes(s) ||
        p.description?.toLowerCase().includes(s)
      );
    });

  const nbActive = promos.filter((p) => p.est_valide_maintenant).length;
  const avgPct =
    promos.length > 0
      ? Math.round(promos.reduce((s, p) => s + (p.pourcentage || 0), 0) / promos.length)
      : 0;

  return (
    <div className="mp-root">
      {/* HEADER */}
      <header className="mp-header">
        <div className="mp-header-left">
          <div className="mp-eyebrow">
            <span className="mp-eyebrow-dot" />
            ESPACE PROMOTIONS
          </div>
          <h1 className="mp-title">
            Mes <em>Promotions</em>
          </h1>
          <p className="mp-subtitle">
            Créez et gérez des offres spéciales pour booster l'attractivité de vos hôtels
          </p>
        </div>
        <button
          className="mp-btn-add"
          onClick={() => { setEditPromo(null); setShowModal(true); }}
          disabled={hotels.length === 0}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nouvelle promotion
        </button>
      </header>

      {/* KPI GRID */}
      <section className="mp-kpi-grid">
        <KpiCard
          variant="gold"
          icon="🎁"
          value={promos.length}
          label="Total promotions"
          sub="toutes catégories"
        />
        <KpiCard
          variant="green"
          icon="✓"
          value={nbActive}
          label="Actives maintenant"
          sub="visibles côté visiteur"
          pulse={nbActive > 0}
        />
        <KpiCard
          variant="blue"
          icon="🏨"
          value={hotels.length}
          label="Hôtels disponibles"
          sub="dans votre portefeuille"
        />
        <KpiCard
          variant="purple"
          icon="%"
          value={`${avgPct}%`}
          label="Remise moyenne"
          sub="toutes promotions confondues"
        />
      </section>

      {/* TOOLBAR */}
      <section className="mp-toolbar">
        <div className="mp-filters">
          {[
            { id: "all",      label: "Toutes",    count: promos.length },
            { id: "active",   label: "Actives",   count: nbActive },
            { id: "inactive", label: "Inactives", count: promos.length - nbActive },
          ].map((f) => (
            <button
              key={f.id}
              className={`mp-filter ${filter === f.id ? "mp-filter--active" : ""}`}
              onClick={() => setFilter(f.id)}
            >
              <span>{f.label}</span>
              <span className="mp-filter-count">{f.count}</span>
            </button>
          ))}
        </div>

        <div className="mp-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une promotion…"
          />
          {search && (
            <button className="mp-search-clear" onClick={() => setSearch("")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="11" height="11">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </section>

      {/* STATES */}
      {loading && (
        <div className="mp-state">
          <div className="mp-loader">
            <div className="mp-loader-ring" />
            <div className="mp-loader-ring mp-lr2" />
          </div>
          <p>Chargement de vos promotions…</p>
        </div>
      )}

      {!loading && error && (
        <div className="mp-error">
          <span>⚠️ {error}</span>
          <button onClick={load}>Réessayer</button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="mp-empty">
          <div className="mp-empty-icon">🎁</div>
          <h3>
            {search
              ? "Aucun résultat"
              : filter === "active"
              ? "Aucune promotion active"
              : filter === "inactive"
              ? "Aucune promotion inactive"
              : "Aucune promotion créée"}
          </h3>
          <p>
            {search
              ? `Aucune promotion ne correspond à "${search}"`
              : filter === "all"
              ? "Créez votre première promotion pour attirer plus de clients"
              : "Changez de filtre pour voir d'autres promotions"}
          </p>
          {filter === "all" && !search && hotels.length > 0 && (
            <button
              className="mp-btn-add"
              onClick={() => { setEditPromo(null); setShowModal(true); }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Créer ma première promotion
            </button>
          )}
          {hotels.length === 0 && (
            <div className="mp-empty-hint">
              ⓘ Vous devez d'abord ajouter un hôtel dans <strong>"Mes Hôtels"</strong>
            </div>
          )}
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="mp-grid">
          {filtered.map((p, i) => (
            <PromoCard
              key={p.id}
              promo={p}
              index={i}
              onEdit={() => { setEditPromo(p); setShowModal(true); }}
              onToggle={() => handleToggle(p)}
              onDelete={() => handleDelete(p)}
            />
          ))}
        </div>
      )}

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
      <div className="mp-kpi-deco" />
    </div>
  );
}

// ══════════════════════════════════════════════════════════
function PromoCard({ promo, index, onEdit, onToggle, onDelete }) {
  const typeInfo  = TYPE_CONFIG[promo.type_promotion] || TYPE_CONFIG.STANDARD;
  const isActive  = promo.est_valide_maintenant;
  const isExpired = promo.date_fin && new Date(promo.date_fin) < new Date();

  return (
    <article
      className={`mp-card ${isActive ? "mp-card--active" : ""} ${isExpired ? "mp-card--expired" : ""}`}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className={`mp-card-ribbon ${isActive ? "on" : isExpired ? "exp" : "off"}`}>
        {isActive ? (<><span className="mp-card-ribbon-dot" /> EN COURS</>) : isExpired ? "EXPIRÉE" : "INACTIVE"}
      </div>

      <div className="mp-card-header">
        <div
          className="mp-card-type"
          style={{
            color: typeInfo.color,
            background: typeInfo.bg,
            borderColor: typeInfo.border,
          }}
        >
          <span className="mp-card-type-icon">{typeInfo.icon}</span>
          <span>{typeInfo.label}</span>
        </div>
      </div>

      <div className="mp-card-pct-wrap">
        <div
          className="mp-card-pct"
          style={{ background: `linear-gradient(135deg, ${typeInfo.color}, ${typeInfo.color}dd)` }}
        >
          <span className="mp-card-pct-minus">−</span>
          <span className="mp-card-pct-num">{Math.round(promo.pourcentage)}</span>
          <span className="mp-card-pct-pc">%</span>
        </div>
      </div>

      <h3 className="mp-card-title">{promo.titre}</h3>

      {promo.hotel && (
        <div className="mp-card-hotel">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span>{promo.hotel.nom}</span>
          {promo.hotel.ville && <span className="mp-card-hotel-sep">·</span>}
          {promo.hotel.ville && <span className="mp-card-hotel-ville">{promo.hotel.ville}</span>}
        </div>
      )}

      {promo.description && <p className="mp-card-desc">{promo.description}</p>}

      <div className="mp-card-period">
        <div className="mp-card-period-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
        <div className="mp-card-period-text">
          <span className="mp-card-period-label">Validité</span>
          <span className="mp-card-period-dates">
            {fmtDate(promo.date_debut)} → {fmtDate(promo.date_fin)}
          </span>
        </div>
        {isActive && promo.jours_restants !== null && promo.jours_restants !== undefined && (
          <div className="mp-card-remain">
            <strong>{promo.jours_restants}</strong>
            <span>j restants</span>
          </div>
        )}
      </div>

      {promo.type_promotion === "EARLY_BOOKING" && promo.jours_avant_min && (
        <div className="mp-card-condition" style={{ borderColor: typeInfo.border, background: typeInfo.bg }}>
          <span style={{ color: typeInfo.color }}>⏰</span>
          Réservation au moins <strong>{promo.jours_avant_min} jours</strong> à l'avance
        </div>
      )}
      {promo.type_promotion === "LAST_MINUTE" && promo.jours_avant_max && (
        <div className="mp-card-condition" style={{ borderColor: typeInfo.border, background: typeInfo.bg }}>
          <span style={{ color: typeInfo.color }}>⚡</span>
          Réservation maximum <strong>{promo.jours_avant_max} jours</strong> avant arrivée
        </div>
      )}

      <div className="mp-card-actions">
        <button className="mp-btn-ghost" onClick={onEdit}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Modifier
        </button>
        <button className={`mp-btn-toggle ${promo.actif ? "off" : "on"}`} onClick={onToggle}>
          {promo.actif ? (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                <circle cx="12" cy="12" r="10" />
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              </svg>
              Désactiver
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Activer
            </>
          )}
        </button>
        <button className="mp-btn-delete" onClick={onDelete} title="Supprimer">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
          </svg>
        </button>
      </div>
    </article>
  );
}

// ══════════════════════════════════════════════════════════
function PromoModal({ promo, hotels, onClose, onSave }) {
  const [form, setForm] = useState({
    titre:           promo?.titre           || "",
    description:     promo?.description     || "",
    pourcentage:     promo?.pourcentage     || 20,
    date_debut:      promo?.date_debut      || new Date().toISOString().split("T")[0],
    date_fin:        promo?.date_fin        || "",
    type_promotion:  promo?.type_promotion  || "STANDARD",
    jours_avant_min: promo?.jours_avant_min || "",
    jours_avant_max: promo?.jours_avant_max || "",
    actif:           promo?.actif ?? true,
    id_hotel:        promo?.id_hotel        || hotels[0]?.id || "",
  });
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!form.titre || !form.date_debut || !form.date_fin) {
      setErr("Remplissez tous les champs obligatoires");
      return;
    }
    if (new Date(form.date_fin) < new Date(form.date_debut)) {
      setErr("La date de fin doit être après la date de début");
      return;
    }
    setSaving(true);
    const payload = {
      titre:           form.titre,
      description:     form.description || null,
      pourcentage:     Number(form.pourcentage),
      date_debut:      form.date_debut,
      date_fin:        form.date_fin,
      type_promotion:  form.type_promotion,
      jours_avant_min: form.jours_avant_min ? Number(form.jours_avant_min) : null,
      jours_avant_max: form.jours_avant_max ? Number(form.jours_avant_max) : null,
      actif:           form.actif,
    };
    try {
      await onSave(payload, form.id_hotel, promo?.id);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mp-modal-overlay" onClick={onClose}>
      <div className="mp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mp-modal-header">
          <div className="mp-modal-header-content">
            <div className="mp-modal-eyebrow">
              <span className="mp-eyebrow-dot" />
              {promo ? "ÉDITION" : "NOUVELLE OFFRE"}
            </div>
            <h2>{promo ? "Modifier la promotion" : "Créer une promotion"}</h2>
            <p>
              {promo
                ? "Ajustez les paramètres de votre offre"
                : "Configurez une offre spéciale pour attirer plus de clients"}
            </p>
          </div>
          <button className="mp-modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mp-form">
          {/* Section 1 */}
          <div className="mp-form-section">
            <div className="mp-form-section-title">
              <span className="mp-form-section-num">01</span>
              Informations générales
            </div>

            {!promo && (
              <div className="mp-field">
                <label>Hôtel concerné *</label>
                <select
                  value={form.id_hotel}
                  onChange={(e) => set("id_hotel", Number(e.target.value))}
                  required
                >
                  {hotels.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.nom} {h.ville ? `— ${h.ville}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="mp-field">
              <label>Titre de la promotion *</label>
              <input
                type="text"
                value={form.titre}
                onChange={(e) => set("titre", e.target.value)}
                placeholder="Ex: Offre d'été exclusive"
                required
              />
            </div>

            <div className="mp-field">
              <label>Description (optionnelle)</label>
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={2}
                placeholder="Décrivez votre offre pour susciter l'intérêt..."
              />
            </div>
          </div>

          {/* Section 2 */}
          <div className="mp-form-section">
            <div className="mp-form-section-title">
              <span className="mp-form-section-num">02</span>
              Paramètres de la réduction
            </div>

            <div className="mp-field">
              <label>Pourcentage de réduction *</label>
              <div className="mp-field-pct">
                <input
                  type="number"
                  min="1"
                  max="99"
                  step="1"
                  value={form.pourcentage}
                  onChange={(e) => set("pourcentage", e.target.value)}
                  required
                />
                <span>%</span>
              </div>
            </div>

            <div className="mp-field">
              <label>Type de promotion *</label>
              <div className="mp-type-selector">
                {Object.entries(TYPE_CONFIG).map(([key, info]) => (
                  <button
                    type="button"
                    key={key}
                    className={`mp-type-btn ${form.type_promotion === key ? "on" : ""}`}
                    onClick={() => set("type_promotion", key)}
                    style={
                      form.type_promotion === key
                        ? { borderColor: info.color, background: info.bg, color: info.color }
                        : {}
                    }
                  >
                    <span className="mp-type-btn-icon">{info.icon}</span>
                    <span className="mp-type-btn-label">{info.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3 */}
          <div className="mp-form-section">
            <div className="mp-form-section-title">
              <span className="mp-form-section-num">03</span>
              Période de validité
            </div>

            <div className="mp-field-row">
              <div className="mp-field">
                <label>Date de début *</label>
                <input
                  type="date"
                  value={form.date_debut}
                  onChange={(e) => set("date_debut", e.target.value)}
                  required
                />
              </div>
              <div className="mp-field">
                <label>Date de fin *</label>
                <input
                  type="date"
                  value={form.date_fin}
                  onChange={(e) => set("date_fin", e.target.value)}
                  min={form.date_debut}
                  required
                />
              </div>
            </div>

            {form.type_promotion === "EARLY_BOOKING" && (
              <div className="mp-field">
                <label>Jours minimum avant arrivée</label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={form.jours_avant_min}
                  onChange={(e) => set("jours_avant_min", e.target.value)}
                  placeholder="Ex: 60"
                />
                <small>Le client doit réserver au moins X jours à l'avance</small>
              </div>
            )}

            {form.type_promotion === "LAST_MINUTE" && (
              <div className="mp-field">
                <label>Jours maximum avant arrivée</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={form.jours_avant_max}
                  onChange={(e) => set("jours_avant_max", e.target.value)}
                  placeholder="Ex: 7"
                />
                <small>La réservation doit être faite max X jours avant l'arrivée</small>
              </div>
            )}

            <label className="mp-field-toggle">
              <input
                type="checkbox"
                checked={form.actif}
                onChange={(e) => set("actif", e.target.checked)}
              />
              <span className="mp-toggle-slider" />
              <div>
                <strong>Promotion active dès maintenant</strong>
                <small>La promotion sera visible côté visiteur immédiatement</small>
              </div>
            </label>
          </div>

          {err && <div className="mp-form-error">⚠️ {err}</div>}

          <div className="mp-modal-actions">
            <button type="button" className="mp-btn-ghost-lg" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="mp-btn-primary" disabled={saving}>
              {saving ? (
                <><span className="mp-btn-spin" /> Enregistrement…</>
              ) : promo ? (
                "Enregistrer les modifications"
              ) : (
                "Créer la promotion"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}