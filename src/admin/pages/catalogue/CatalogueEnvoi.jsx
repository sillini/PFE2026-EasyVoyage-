// src/admin/pages/catalogue/CatalogueEnvoi.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import "./CatalogueEnvoi.css";
import { BASE, auth } from "./constants";
import { ago } from "./utils";
import { Avatar, Spinner, SpinnerInline } from "./CatalogueUI";

export default function CatalogueEnvoi({ detailCat, onClose, onSent }) {
  const [step,          setStep]          = useState(1);
  const [contacts,      setContacts]      = useState([]);
  const [contactsTotal, setContactsTotal] = useState(0);
  const [contactsPage,  setContactsPage]  = useState(1);
  const [loadingCtx,    setLoadingCtx]    = useState(false);
  const [ctxSearch,     setCtxSearch]     = useState("");
  const [ctxType,       setCtxType]       = useState("tous");
  const [selContacts,   setSelContacts]   = useState(new Set());
  const [selMode,       setSelMode]       = useState("manual");
  const [scheduledAt,   setScheduledAt]   = useState("");
  const [sending,       setSending]       = useState(false);
  const [comptage,      setComptage]      = useState(null);
  const searchRef = useRef(null);

  // ── Chargement contacts ───────────────────────────────
  const loadContacts = useCallback(async (page = 1, search = "", type = "tous") => {
    setLoadingCtx(true);
    try {
      const params = new URLSearchParams({ page, per_page: 20 });
      if (search) params.set("search", search);
      if (type !== "tous") params.set("type", type);
      const r = await fetch(`${BASE}/contacts?${params}`, { headers: auth() });
      const d = await r.json();
      setContacts(d.items || []);
      setContactsTotal(d.total || 0);
      setContactsPage(page);
    } catch (e) { console.error(e); }
    setLoadingCtx(false);
  }, []);

  useEffect(() => { loadContacts(1, "", "tous"); }, [loadContacts]);

  useEffect(() => {
    const t = setTimeout(() => loadContacts(1, ctxSearch, ctxType), 350);
    return () => clearTimeout(t);
  }, [ctxSearch, ctxType, loadContacts]);

  // Comptage live
  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`${BASE}/catalogues/destinataires/compter`, {
          method: "POST", headers: auth(),
          body: JSON.stringify({
            destinataires: ctxType === "tous" ? "tous" : ctxType,
            nb_contacts:   selMode === "manual" ? selContacts.size : 9999,
          }),
        });
        setComptage(await r.json());
      } catch {}
    }, 400);
    return () => clearTimeout(t);
  }, [ctxType, selContacts, selMode]);

  // ── Sélection rapide ──────────────────────────────────
  const handleSelMode = async (mode) => {
    setSelMode(mode);
    setSelContacts(new Set());
    if (mode === "manual") return;
    const type = mode === "all_clients" ? "client" : mode === "all_visitors" ? "visiteur" : "tous";
    setCtxType(type === "tous" ? "tous" : type);
    try {
      const params = new URLSearchParams({ page: 1, per_page: 500 });
      if (type !== "tous") params.set("type", type);
      const r = await fetch(`${BASE}/contacts?${params}`, { headers: auth() });
      const d = await r.json();
      setSelContacts(new Set((d.items || []).map(c => c.id)));
    } catch {}
  };

  const toggleContact = (id) => {
    setSelMode("manual");
    setSelContacts(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  // ── Envoi ─────────────────────────────────────────────
  const handleEnvoyer = async () => {
    if (selMode === "manual" && selContacts.size === 0)
      return alert("Sélectionnez au moins un contact");
    setSending(true);
    try {
      const payload = selMode === "manual"
        ? { contact_ids: Array.from(selContacts), tracking_enabled: true, scheduled_at: scheduledAt || null }
        : {
            destinataires:    selMode === "all_clients" ? "client" : selMode === "all_visitors" ? "visiteur" : "tous",
            nb_contacts:      500,
            contact_ids:      null,
            tracking_enabled: true,
            scheduled_at:     scheduledAt || null,
          };
      const r = await fetch(`${BASE}/catalogues/${detailCat.id}/envoyer`, {
        method: "POST", headers: auth(), body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error((await r.json()).detail || "Erreur envoi");
      onSent();
    } catch (e) { alert("Erreur : " + e.message); }
    setSending(false);
  };

  const MODES = [
    { key: "all",          label: "👥 Tous les contacts",  desc: "clients + visiteurs" },
    { key: "all_clients",  label: "👤 Tous les clients",    desc: "comptes inscrits" },
    { key: "all_visitors", label: "👁 Tous les visiteurs", desc: "réservations sans compte" },
    { key: "manual",       label: "☑️ Sélection manuelle", desc: "choisissez un par un" },
  ];

  return (
    <div className="cat-envoi">

      {/* ── Header ────────────────────────────────────── */}
      <div className="cat-envoi__header">
        <div className="cat-envoi__header-left">
          <h2 className="cat-envoi__header-title">📧 Envoyer le catalogue</h2>
          <p className="cat-envoi__header-sub">{detailCat.titre}</p>
        </div>
        <div className="cat-envoi__header-right">
          <div className="cat-envoi__steps">
            {[1, 2].map(s => (
              <div key={s} className="cat-envoi__step-item">
                <div className={`cat-envoi__step-circle cat-envoi__step-circle--${step >= s ? "active" : "inactive"}`}>{s}</div>
                <span className={`cat-envoi__step-label${step === s ? " cat-envoi__step-label--active" : ""}`}>
                  {s === 1 ? "Destinataires" : "Confirmation"}
                </span>
                {s < 2 && <span className="cat-envoi__step-arrow">→</span>}
              </div>
            ))}
          </div>
          <button className="cat-btn-ghost" onClick={onClose} style={{ padding: "7px 14px", fontSize: 12 }}>✕ Fermer</button>
        </div>
      </div>

      <div className="cat-envoi__body">

        {/* ══ ÉTAPE 1 ══════════════════════════════════ */}
        {step === 1 && (
          <div className="cat-envoi__step1">

            {/* Sélection rapide */}
            <div className="cat-envoi__quick-select">
              <p className="cat-envoi__quick-select-title">Sélection rapide</p>
              <div className="cat-envoi__quick-select-btns">
                {MODES.map(opt => (
                  <button
                    key={opt.key}
                    className={`cat-envoi__mode-btn${selMode === opt.key ? " cat-envoi__mode-btn--active" : ""}`}
                    onClick={() => handleSelMode(opt.key)}
                  >
                    {opt.label}
                    <span className="cat-envoi__mode-btn-desc">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Recherche + filtres */}
            <div className="cat-envoi__searchbar">
              <div className="cat-envoi__search-wrap">
                <span className="cat-envoi__search-icon">🔍</span>
                <input
                  ref={searchRef}
                  className="cat-envoi__search-input"
                  value={ctxSearch}
                  onChange={e => setCtxSearch(e.target.value)}
                  placeholder="Rechercher par email, nom, prénom..."
                />
              </div>
              <div className="cat-envoi__type-filters">
                {["tous", "client", "visiteur"].map(t => (
                  <button
                    key={t}
                    className={`cat-envoi__type-btn${ctxType === t ? " cat-envoi__type-btn--active" : ""}`}
                    onClick={() => { setCtxType(t); setContactsPage(1); }}
                  >
                    {t === "tous" ? "👥 Tous" : t === "client" ? "👤 Clients" : "👁 Visiteurs"}
                  </button>
                ))}
              </div>
            </div>

            {/* Liste contacts */}
            <div className="cat-envoi__contacts-list">
              {loadingCtx && (
                <div className="cat-envoi__contacts-loading">
                  <Spinner size="md" />
                  Chargement des contacts...
                </div>
              )}
              {!loadingCtx && contacts.map(c => {
                const sel = selContacts.has(c.id) || selMode !== "manual";
                return (
                  <div
                    key={c.id}
                    className={`cat-envoi__contact-row${sel ? " cat-envoi__contact-row--selected" : ""}`}
                    onClick={() => toggleContact(c.id)}
                  >
                    <div className={`cat-envoi__checkbox${sel ? " cat-envoi__checkbox--checked" : " cat-envoi__checkbox--empty"}`}>
                      {sel && "✓"}
                    </div>
                    <Avatar email={c.email} nom={`${c.prenom || ""} ${c.nom || ""}`.trim()} />
                    <div className="cat-envoi__contact-info">
                      <div className="cat-envoi__contact-name">
                        {`${c.prenom || ""} ${c.nom || ""}`.trim() || "—"}
                      </div>
                      <div className="cat-envoi__contact-email">{c.email}</div>
                    </div>
                    <span className={`cat-envoi__contact-badge cat-envoi__contact-badge--${c.type}`}>
                      {c.type}
                    </span>
                    <span className="cat-envoi__contact-date">{ago(c.created_at)}</span>
                  </div>
                );
              })}
              {!loadingCtx && contacts.length === 0 && (
                <div className="cat-envoi__contacts-empty">
                  <p className="cat-envoi__contacts-empty-icon">🔍</p>
                  <p className="cat-envoi__contacts-empty-title">Aucun contact trouvé</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {contactsTotal > 20 && (
              <div className="cat-envoi__pagination">
                {Array.from({ length: Math.min(8, Math.ceil(contactsTotal / 20)) }, (_, i) => i + 1).map(p => (
                  <button key={p}
                    className={`cat-envoi__page-btn${contactsPage === p ? " cat-envoi__page-btn--active" : ""}`}
                    onClick={() => loadContacts(p, ctxSearch, ctxType === "tous" ? "" : ctxType)}
                  >{p}</button>
                ))}
              </div>
            )}

            {/* Barre bas */}
            <div className="cat-envoi__step1-footer">
              <p className="cat-envoi__step1-counter">
                {selMode === "manual"
                  ? <><span className="cat-envoi__step1-counter-nb">{selContacts.size}</span> contact{selContacts.size > 1 ? "s" : ""} sélectionné{selContacts.size > 1 ? "s" : ""}</>
                  : <><span className="cat-envoi__step1-counter-nb">{comptage?.total ?? "..."}</span> contacts sélectionnés (mode auto)</>
                }
              </p>
              <button className="cat-btn-primary" onClick={() => setStep(2)}
                disabled={selMode === "manual" && selContacts.size === 0}
                style={{ opacity: (selMode === "manual" && selContacts.size === 0) ? 0.5 : 1 }}>
                Suivant →
              </button>
            </div>
          </div>
        )}

        {/* ══ ÉTAPE 2 ══════════════════════════════════ */}
        {step === 2 && (
          <div className="cat-envoi__step2">

            <div className="cat-envoi__recap-card">
              <h3 className="cat-envoi__recap-title">Récapitulatif de l'envoi</h3>

              {[
                { label: "Catalogue",    value: detailCat.titre },
                {
                  label: "Destinataires",
                  value: selMode === "manual"
                    ? `${selContacts.size} contact${selContacts.size > 1 ? "s" : ""} sélectionné${selContacts.size > 1 ? "s" : ""} manuellement`
                    : selMode === "all_clients"  ? "Tous les clients"
                    : selMode === "all_visitors" ? "Tous les visiteurs"
                    : `Tous les contacts (${comptage?.total ?? "..."})`,
                  blue: true,
                },
                { label: "Sujet email", value: detailCat._sujet || detailCat.titre },
              ].map(r => (
                <div key={r.label} className="cat-envoi__recap-row">
                  <span className="cat-envoi__recap-label">{r.label}</span>
                  <span className={`cat-envoi__recap-value${r.blue ? " cat-envoi__recap-value--blue" : ""}`}>
                    {r.value}
                  </span>
                </div>
              ))}

              <div className="cat-envoi__schedule">
                <label className="cat-envoi__schedule-label">
                  📅 Planification (optionnel — vide = envoi immédiat)
                </label>
                <input type="datetime-local" className="cat-input" value={scheduledAt}
                  onChange={e => setScheduledAt(e.target.value)} />
              </div>
            </div>

            <div className="cat-envoi__warning">
              ⚠️ Cette action va envoyer des emails réels à vos contacts. Vérifiez bien le récapitulatif avant de confirmer.
            </div>

            <div className="cat-envoi__confirm-actions">
              <button className="cat-btn-ghost" onClick={() => setStep(1)} style={{ flex: 1 }}>← Retour</button>
              <button className="cat-btn-gold" onClick={handleEnvoyer} disabled={sending}
                style={{ flex: 2, padding: "13px 20px", fontSize: 14 }}>
                {sending
                  ? <><SpinnerInline /> Envoi en cours...</>
                  : scheduledAt ? "📅 Planifier l'envoi" : "📧 Confirmer et envoyer"
                }
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}