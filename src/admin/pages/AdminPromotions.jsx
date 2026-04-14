// ══════════════════════════════════════════════════════════
//  src/admin/pages/AdminPromotions.jsx
//  Détail en modal overlay — plus de problème de scroll
// ══════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import { promotionsAdminApi } from "../services/api";
import "./AdminPromotions.css";

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const fmtFull = (d) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

const S = {
  PENDING:  { label: "En attente", color: "#D97706", bg: "rgba(217,119,6,.12)",  border: "rgba(217,119,6,.3)"  },
  APPROVED: { label: "Approuvée",  color: "#059669", bg: "rgba(5,150,105,.12)",  border: "rgba(5,150,105,.3)"  },
  REJECTED: { label: "Refusée",    color: "#DC2626", bg: "rgba(220,38,38,.12)",  border: "rgba(220,38,38,.3)"  },
};

// ══════════════════════════════════════════════════════════
export default function AdminPromotions() {
  const [promos,     setPromos]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState("PENDING");
  const [search,     setSearch]     = useState("");
  const [dateDebut,  setDateDebut]  = useState("");
  const [dateFin,    setDateFin]    = useState("");
  const [toast,      setToast]      = useState(null);
  const [detail,     setDetail]     = useState(null); // modal détail
  const [confirm,    setConfirm]    = useState(null); // { promo, action }
  const [raison,     setRaison]     = useState("");
  const [submitting, setSubmitting] = useState(false);

  const toast$ = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter)    params.statut     = filter;
      if (dateDebut) params.date_debut = dateDebut;
      if (dateFin)   params.date_fin   = dateFin;
      const data = await promotionsAdminApi.list(params);
      setPromos(data?.items || []);
    } catch (e) { toast$(e.message, "error"); }
    finally { setLoading(false); }
  }, [filter, dateDebut, dateFin]);

  useEffect(() => { load(); }, [load]);

  const filtered = promos.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.titre?.toLowerCase().includes(q) ||
      p.hotel?.nom?.toLowerCase().includes(q) ||
      `${p.partenaire?.prenom} ${p.partenaire?.nom}`.toLowerCase().includes(q) ||
      p.partenaire?.email?.toLowerCase().includes(q)
    );
  });

  const nbP = promos.filter(p => p.statut === "PENDING").length;
  const nbA = promos.filter(p => p.statut === "APPROVED").length;
  const nbR = promos.filter(p => p.statut === "REJECTED").length;

  const openConfirm = (promo, action) => {
    setConfirm({ promo, action });
    setRaison("");
    setDetail(null); // fermer le détail si ouvert
  };

  const handleDecision = async () => {
    if (!confirm) return;
    if (confirm.action === "reject" && !raison.trim()) {
      toast$("Veuillez indiquer une raison", "error"); return;
    }
    setSubmitting(true);
    try {
      await promotionsAdminApi.decision(confirm.promo.id, {
        action:       confirm.action === "approve" ? "APPROVED" : "REJECTED",
        raison_refus: confirm.action === "reject" ? raison.trim() : null,
      });
      toast$(confirm.action === "approve" ? "✅ Approuvée — partenaire notifié" : "❌ Refusée — partenaire notifié");
      setConfirm(null);
      load();
    } catch (e) { toast$(e.message, "error"); }
    finally { setSubmitting(false); }
  };

  const handleToggle = async (promo) => {
    try {
      await promotionsAdminApi.toggle(promo.id, !promo.actif);
      toast$(promo.actif ? "Désactivée" : "Activée");
      load();
    } catch (e) { toast$(e.message, "error"); }
  };

  return (
    <div className="ap-root">

      {/* Toast */}
      {toast && (
        <div className={`ap-toast ap-toast--${toast.type}`}>
          {toast.type === "success" ? "✓" : "✗"} {toast.msg}
        </div>
      )}

      {/* ── HEADER ───────────────────────────────────────── */}
      <header className="ap-header">
        <div>
          <div className="ap-eyebrow"><span className="ap-eyebrow-dot" />ADMINISTRATION</div>
          <h1 className="ap-title">Demandes de <em>Promotions</em></h1>
          <p className="ap-subtitle">Validez ou refusez les promotions soumises par les partenaires</p>
        </div>
        <div className="ap-kpis">
          {[
            { id: "PENDING",  v: nbP, lbl: "En attente", cls: "amber", pulse: nbP > 0 },
            { id: "APPROVED", v: nbA, lbl: "Approuvées",  cls: "green" },
            { id: "REJECTED", v: nbR, lbl: "Refusées",    cls: "red"   },
            { id: "",         v: promos.length, lbl: "Total", cls: "blue" },
          ].map(k => (
            <button key={k.id} className={`ap-kpi ap-kpi--${k.cls} ${filter === k.id ? "ap-kpi--on" : ""}`} onClick={() => setFilter(k.id)}>
              {k.pulse && <span className="ap-kpi-pulse" />}
              <span className="ap-kpi-v">{k.v}</span>
              <span className="ap-kpi-l">{k.lbl}</span>
            </button>
          ))}
        </div>
      </header>

      {/* ── TOOLBAR ──────────────────────────────────────── */}
      <div className="ap-toolbar">
        <div className="ap-filters">
          {[
            { id: "PENDING", label: "En attente" },
            { id: "APPROVED", label: "Approuvées" },
            { id: "REJECTED", label: "Refusées" },
            { id: "", label: "Toutes" },
          ].map(f => (
            <button key={f.id} className={`ap-fbtn ${filter === f.id ? "on" : ""}`} onClick={() => setFilter(f.id)}>
              {f.id === "PENDING" && nbP > 0 && <span className="ap-fbadge">{nbP}</span>}
              {f.label}
            </button>
          ))}
        </div>
        <div className="ap-dates">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13" style={{color:"#8A9BB0"}}>
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/>
            <line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/>
          </svg>
          <input type="date" className="ap-date" value={dateDebut} onChange={e=>setDateDebut(e.target.value)} />
          <span style={{color:"#B0BEC8",fontSize:"0.75rem"}}>—</span>
          <input type="date" className="ap-date" value={dateFin}   onChange={e=>setDateFin(e.target.value)}   />
          {(dateDebut||dateFin) && <button className="ap-date-x" onClick={()=>{setDateDebut("");setDateFin("");}}>✕</button>}
        </div>
        <div className="ap-searchbox">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input className="ap-search" placeholder="Hôtel, partenaire, titre…" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
      </div>

      {/* ── LISTE ────────────────────────────────────────── */}
      <div className="ap-list">
        {loading ? (
          <div className="ap-loading"><div className="ap-spin" /><p>Chargement…</p></div>
        ) : filtered.length === 0 ? (
          <div className="ap-empty">
            <div className="ap-empty-ico">📋</div>
            <h3>Aucune promotion trouvée</h3>
            <p>{search ? `Aucun résultat pour "${search}"` : "Aucune promotion dans cette catégorie"}</p>
          </div>
        ) : filtered.map(p => (
          <PromoRow
            key={p.id}
            promo={p}
            onDetail={() => setDetail(p)}
            onApprove={() => openConfirm(p, "approve")}
            onReject={() =>  openConfirm(p, "reject")}
            onToggle={() => handleToggle(p)}
          />
        ))}
      </div>

      {/* ── MODAL DÉTAIL ─────────────────────────────────── */}
      {detail && (
        <DetailModal
          promo={detail}
          onClose={() => setDetail(null)}
          onApprove={() => openConfirm(detail, "approve")}
          onReject={() =>  openConfirm(detail, "reject")}
          onToggle={() => { handleToggle(detail); setDetail(null); }}
        />
      )}

      {/* ── MODAL CONFIRMATION ───────────────────────────── */}
      {confirm && (
        <ConfirmModal
          promo={confirm.promo}
          action={confirm.action}
          raison={raison}
          onRaison={setRaison}
          onConfirm={handleDecision}
          onClose={() => setConfirm(null)}
          submitting={submitting}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  Ligne liste
// ══════════════════════════════════════════════════════════
function PromoRow({ promo, onDetail, onApprove, onReject, onToggle }) {
  const cfg = S[promo.statut] || S.PENDING;
  return (
    <div className={`ap-row ap-row--${promo.statut.toLowerCase()}`} onClick={onDetail}>
      {/* Barre colorée */}
      <div className="ap-row-bar" style={{ background: cfg.color }} />

      {/* Badge % */}
      <div className="ap-row-pct">-{Math.round(promo.pourcentage)}%</div>

      {/* Infos */}
      <div className="ap-row-info">
        <div className="ap-row-top">
          <span className="ap-row-titre">{promo.titre}</span>
          <span className="ap-chip" style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
            <i className="ap-dot" style={{ background: cfg.color }} />{cfg.label}
          </span>
        </div>
        <div className="ap-row-meta">
          <span>🏨 {promo.hotel?.nom || "—"}</span>
          <span>👤 {promo.partenaire ? `${promo.partenaire.prenom} ${promo.partenaire.nom}` : "—"}</span>
          <span>📅 {fmtDate(promo.date_debut)} → {fmtDate(promo.date_fin)}</span>
          <span style={{color:"#B0BEC8"}}>Soumis le {fmtDate(promo.created_at)}</span>
        </div>
      </div>

      {/* Boutons */}
      <div className="ap-row-btns" onClick={e => e.stopPropagation()}>
        {promo.statut === "PENDING" && (
          <>
            <button className="ap-btn ap-btn--green" onClick={onApprove} title="Approuver">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="13" height="13"><polyline points="20 6 9 17 4 12"/></svg>
              <span>Approuver</span>
            </button>
            <button className="ap-btn ap-btn--red" onClick={onReject} title="Refuser">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="13" height="13"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              <span>Refuser</span>
            </button>
          </>
        )}
        {promo.statut === "APPROVED" && (
          <button className={`ap-btn ${promo.actif ? "ap-btn--amber" : "ap-btn--green"}`} onClick={onToggle}>
            {promo.actif ? "⏸ Désactiver" : "▶ Activer"}
          </button>
        )}
        <button className="ap-btn ap-btn--ghost" onClick={onDetail}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <span>Détails</span>
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  Modal détail — plein écran centré avec scroll interne
// ══════════════════════════════════════════════════════════
function DetailModal({ promo, onClose, onApprove, onReject, onToggle }) {
  const cfg   = S[promo.statut] || S.PENDING;
  const isPend = promo.statut === "PENDING";
  const isAppr = promo.statut === "APPROVED";
  const isRej  = promo.statut === "REJECTED";

  return (
    <div className="ap-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="ap-detail">

        {/* Header coloré */}
        <div className="ap-detail-head">
          <div className="ap-detail-head-orb" />
          <div className="ap-detail-head-left">
            <div className="ap-detail-pct">-{Math.round(promo.pourcentage)}%</div>
            <div>
              <h2 className="ap-detail-titre">{promo.titre}</h2>
              <span className="ap-chip ap-chip--light">
                <i className="ap-dot" style={{ background: cfg.color }} />{cfg.label}
              </span>
            </div>
          </div>
          <button className="ap-detail-close" onClick={onClose}>✕</button>
        </div>

        {/* Corps scrollable */}
        <div className="ap-detail-body">

          {/* Description */}
          {promo.description && (
            <div className="ap-detail-section">
              <div className="ap-detail-section-lbl">Description</div>
              <p className="ap-detail-desc">{promo.description}</p>
            </div>
          )}

          {/* 2 colonnes : Hôtel + Partenaire */}
          <div className="ap-detail-cols">
            <div className="ap-detail-section">
              <div className="ap-detail-section-lbl">Hôtel</div>
              <div className="ap-detail-card">
                <span className="ap-detail-card-ico">🏨</span>
                <div>
                  <div className="ap-detail-card-title">{promo.hotel?.nom || "—"}</div>
                  {promo.hotel?.ville && <div className="ap-detail-card-sub">📍 {promo.hotel.ville}</div>}
                </div>
              </div>
            </div>

            <div className="ap-detail-section">
              <div className="ap-detail-section-lbl">Partenaire</div>
              <div className="ap-detail-card">
                <div className="ap-detail-avatar">
                  {promo.partenaire?.prenom?.[0]}{promo.partenaire?.nom?.[0]}
                </div>
                <div>
                  <div className="ap-detail-card-title">
                    {promo.partenaire ? `${promo.partenaire.prenom} ${promo.partenaire.nom}` : "—"}
                  </div>
                  <div className="ap-detail-card-sub">{promo.partenaire?.email || ""}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats : 4 cases */}
          <div className="ap-detail-section">
            <div className="ap-detail-section-lbl">Réduction & Période</div>
            <div className="ap-detail-stats">
              <div className="ap-detail-stat">
                <div className="ap-detail-stat-v" style={{ color: "#C4973A" }}>-{Math.round(promo.pourcentage)}%</div>
                <div className="ap-detail-stat-l">Réduction</div>
              </div>
              <div className="ap-detail-stat">
                <div className="ap-detail-stat-v">{fmtDate(promo.date_debut)}</div>
                <div className="ap-detail-stat-l">Date début</div>
              </div>
              <div className="ap-detail-stat">
                <div className="ap-detail-stat-v">{fmtDate(promo.date_fin)}</div>
                <div className="ap-detail-stat-l">Date fin</div>
              </div>
              <div className="ap-detail-stat">
                <div className="ap-detail-stat-v" style={{ color: promo.actif ? "#059669" : "#DC2626" }}>
                  {promo.actif ? "Active" : "Inactive"}
                </div>
                <div className="ap-detail-stat-l">Visibilité</div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="ap-detail-section">
            <div className="ap-detail-section-lbl">Historique</div>
            <div className="ap-detail-tl">
              <TlRow color="#C4973A" label="Soumise le" val={fmtFull(promo.created_at)} />
              {promo.date_decision && (
                <TlRow
                  color={isAppr ? "#059669" : "#DC2626"}
                  label={`${isAppr ? "Approuvée" : "Refusée"} le${promo.validateur ? ` · ${promo.validateur.prenom} ${promo.validateur.nom}` : ""}`}
                  val={fmtFull(promo.date_decision)}
                />
              )}
            </div>
          </div>

          {/* Motif refus */}
          {isRej && promo.raison_refus && (
            <div className="ap-detail-section">
              <div className="ap-detail-section-lbl">Motif du refus</div>
              <div className="ap-detail-refus">⚠️ {promo.raison_refus}</div>
            </div>
          )}
        </div>

        {/* Footer — TOUJOURS VISIBLE */}
        <div className="ap-detail-foot">
          <button className="ap-detail-cancel" onClick={onClose}>Fermer</button>
          {isPend && (
            <>
              <button className="ap-detail-btn ap-detail-btn--reject" onClick={onReject}>
                ❌ Refuser
              </button>
              <button className="ap-detail-btn ap-detail-btn--approve" onClick={onApprove}>
                ✅ Approuver
              </button>
            </>
          )}
          {isAppr && (
            <button className={`ap-detail-btn ${promo.actif ? "ap-detail-btn--deactivate" : "ap-detail-btn--activate"}`} onClick={onToggle}>
              {promo.actif ? "⏸ Désactiver" : "▶ Réactiver"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function TlRow({ color, label, val }) {
  return (
    <div className="ap-tl-row">
      <div className="ap-tl-dot" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
      <div>
        <div className="ap-tl-label">{label}</div>
        <div className="ap-tl-val">{val}</div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  Modal confirmation
// ══════════════════════════════════════════════════════════
function ConfirmModal({ promo, action, raison, onRaison, onConfirm, onClose, submitting }) {
  const ok = action === "approve";
  return (
    <div className="ap-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="ap-confirm-modal">
        <div className={`ap-confirm-bar ${ok ? "ap-confirm-bar--green" : "ap-confirm-bar--red"}`} />
        <div className="ap-confirm-head">
          <div className={`ap-confirm-ico ${ok ? "ap-confirm-ico--green" : "ap-confirm-ico--red"}`}>
            {ok
              ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="20" height="20"><polyline points="20 6 9 17 4 12"/></svg>
              : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="20" height="20"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            }
          </div>
          <div>
            <div className="ap-confirm-ttl">{ok ? "Approuver" : "Refuser"} la promotion</div>
            <div className="ap-confirm-sub">« {promo.titre} » — -{Math.round(promo.pourcentage)}%</div>
          </div>
          <button className="ap-confirm-x" onClick={onClose}>✕</button>
        </div>

        <div className="ap-confirm-body">
          {ok ? (
            <div className="ap-confirm-info">
              <div style={{ fontSize: "2rem", marginBottom: "10px" }}>✅</div>
              <p>La promotion sera <strong>immédiatement visible</strong> sur le site. Le partenaire sera notifié par email.</p>
              <div className="ap-confirm-recap">
                <div><span>Hôtel</span><b>{promo.hotel?.nom || "—"}</b></div>
                <div><span>Réduction</span><b>-{Math.round(promo.pourcentage)}%</b></div>
                <div><span>Période</span><b>{fmtDate(promo.date_debut)} → {fmtDate(promo.date_fin)}</b></div>
                <div><span>Partenaire</span><b>{promo.partenaire ? `${promo.partenaire.prenom} ${promo.partenaire.nom}` : "—"}</b></div>
              </div>
            </div>
          ) : (
            <>
              <p className="ap-confirm-note">Le partenaire recevra le motif par email et pourra modifier sa promotion.</p>
              <div className="ap-confirm-field">
                <label>Motif du refus <span style={{ color: "#DC2626" }}>*</span></label>
                <textarea placeholder="Ex : Pourcentage trop élevé, dates invalides…" value={raison} onChange={e => onRaison(e.target.value)} rows={4} maxLength={500} />
                <span className="ap-confirm-count">{raison.length}/500</span>
              </div>
            </>
          )}
        </div>

        <div className="ap-confirm-foot">
          <button className="ap-cfoot-cancel" onClick={onClose} disabled={submitting}>Annuler</button>
          <button
            className={`ap-cfoot-ok ${ok ? "ap-cfoot-ok--green" : "ap-cfoot-ok--red"}`}
            onClick={onConfirm}
            disabled={submitting || (!ok && !raison.trim())}
          >
            {submitting ? <span className="ap-spin-sm" /> : ok ? "✅ Confirmer l'approbation" : "❌ Confirmer le refus"}
          </button>
        </div>
      </div>
    </div>
  );
}