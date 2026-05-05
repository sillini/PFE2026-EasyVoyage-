/**
 * src/partenaire/pages/PartenaireNotifications.jsx
 * ════════════════════════════════════════════════════════════
 * Page dédiée Notifications partenaire.
 *
 * Fonctionnalités :
 *   ✓ Liste complète paginée
 *   ✓ Filtres par catégorie (toutes / promo / résa / paiement / support / hôtel)
 *   ✓ Filtre par statut (toutes / non lues / lues)
 *   ✓ Recherche texte
 *   ✓ Marquer une notif lue (au clic) + redirection vers la page concernée
 *   ✓ Marquer tout lu / Vider les notifs lues
 *   ✓ Supprimer une notif
 *   ✓ Auto-refresh toutes les 30s
 *
 * Props :
 *   onNavigate(pageId)  — callback de navigation (passé par App.jsx)
 *
 * Préfixe CSS : pn- (Partenaire Notifications)
 * ════════════════════════════════════════════════════════════
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { notificationsApi } from "../services/notificationsApi";
import "./PartenaireNotifications.css";

const POLL_MS = 30_000;

// ══════════════════════════════════════════════════════════
//  CATÉGORIES (filtres)
// ══════════════════════════════════════════════════════════
const CATEGORIES = [
  { id: "all",         label: "Toutes",       match: () => true },
  { id: "reservation", label: "Réservations", match: t => t?.includes("RESERVATION") },
  { id: "promotion",   label: "Promotions",   match: t => t?.includes("PROMOTION") },
  { id: "paiement",    label: "Paiements",    match: t => t?.includes("PAIEMENT") || t?.includes("RETRAIT") },
  { id: "support",     label: "Support",      match: t => t?.includes("MESSAGE") || t?.includes("SUPPORT") || t?.includes("CONVERSATION") },
  { id: "hotel",       label: "Hôtels",       match: t => t?.includes("HOTEL") || t?.includes("AVIS") },
];

// ══════════════════════════════════════════════════════════
//  Helpers
// ══════════════════════════════════════════════════════════
function targetPageForType(type) {
  switch (type) {
    case "NOUVEAU_MESSAGE":
    case "NOUVELLE_DEMANDE_SUPPORT":
    case "CONVERSATION_ACCEPTEE":
    case "CONVERSATION_FERMEE":
      return "support";
    case "PROMOTION_APPROUVEE":
    case "PROMOTION_REFUSEE":
    case "NOUVELLE_PROMOTION":
      return "promotions";
    case "NOUVELLE_RESERVATION_HOTEL":
    case "RESERVATION_ANNULEE":
    case "NOUVELLE_RESERVATION":
    case "NOUVELLE_RESERVATION_VISITEUR":
      return "reservations";
    case "PAIEMENT_RECU":
    case "RETRAIT_APPROUVE":
    case "RETRAIT_REFUSE":
    case "NOUVELLE_DEMANDE_RETRAIT":
      return "finances";
    case "HOTEL_MIS_EN_AVANT":
    case "NOUVEL_AVIS":
      return "hotels";
    default:
      return null;
  }
}

function iconForType(type) {
  if (type?.includes("MESSAGE") || type?.includes("SUPPORT") || type?.includes("CONVERSATION")) {
    return { color: "blue", svg: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>) };
  }
  if (type?.includes("PROMOTION")) {
    return { color: "amber", svg: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>) };
  }
  if (type?.includes("PAIEMENT") || type?.includes("RETRAIT")) {
    return { color: "green", svg: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>) };
  }
  if (type?.includes("RESERVATION")) {
    return { color: "teal", svg: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/></svg>) };
  }
  if (type?.includes("HOTEL") || type?.includes("AVIS")) {
    return { color: "purple", svg: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>) };
  }
  return { color: "slate", svg: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>) };
}

function fmtDate(d) {
  if (!d) return "";
  const date = new Date(d);
  const diff = Date.now() - date;
  if (diff < 60000)    return "À l'instant";
  if (diff < 3600000)  return `il y a ${Math.floor(diff/60000)} min`;
  if (diff < 86400000) return `il y a ${Math.floor(diff/3600000)} h`;
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ══════════════════════════════════════════════════════════
//  COMPONENT
// ══════════════════════════════════════════════════════════
export default function PartenaireNotifications({ onNavigate }) {
  const [items,    setItems]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [category, setCategory] = useState("all");
  const [statusF,  setStatusF]  = useState("all"); // all | unread | read
  const [search,   setSearch]   = useState("");

  // ── Charger les notifs ──────────────────────────────────
  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await notificationsApi.getNotifications();
      setItems(data?.items || []);
    } catch (e) {
      console.error(e);
      setError(e.message || "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  // ── Filtres + recherche (mémoïsés) ──────────────────────
  const filtered = useMemo(() => {
    const cat = CATEGORIES.find(c => c.id === category) || CATEGORIES[0];
    const q = search.trim().toLowerCase();
    return items.filter(n => {
      if (!cat.match(n.type)) return false;
      if (statusF === "unread" && n.lue)  return false;
      if (statusF === "read"   && !n.lue) return false;
      if (q) {
        const txt = `${n.titre} ${n.message}`.toLowerCase();
        if (!txt.includes(q)) return false;
      }
      return true;
    });
  }, [items, category, statusF, search]);

  // Compteurs par catégorie
  const counts = useMemo(() => {
    const acc = {};
    CATEGORIES.forEach(c => {
      acc[c.id] = items.filter(n => c.match(n.type)).length;
    });
    return acc;
  }, [items]);

  const nbNonLuesTotal = items.filter(n => !n.lue).length;
  const nbLues         = items.filter(n =>  n.lue).length;
  const hasUnread      = nbNonLuesTotal > 0;

  // ── Actions ─────────────────────────────────────────────
  const handleClickItem = async (notif) => {
    if (!notif.lue) {
      setItems(prev => prev.map(n => n.id === notif.id ? { ...n, lue: true } : n));
      try { await notificationsApi.markRead(notif.id); } catch (e) { console.error(e); }
    }
    const target = targetPageForType(notif.type);
    if (target && onNavigate) onNavigate(target);
  };

  const handleMarkAllRead = async () => {
    setItems(prev => prev.map(n => ({ ...n, lue: true })));
    try { await notificationsApi.markAllRead(); }
    catch (e) { console.error(e); load(); }
  };

  const handleDeleteAllRead = async () => {
    if (!window.confirm("Supprimer définitivement toutes les notifications lues ?")) return;
    try {
      await notificationsApi.deleteAllRead();
      load();
    } catch (e) { console.error(e); setError("Erreur lors de la suppression"); }
  };

  const handleDeleteOne = async (e, notif) => {
    e.stopPropagation();
    setItems(prev => prev.filter(n => n.id !== notif.id));
    try { await notificationsApi.deleteNotification(notif.id); }
    catch (err) { console.error(err); load(); }
  };

  // ══════════════════════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════════════════════
  return (
    <div className="pn-page">

      {/* ── Header ─────────────────────────────────────── */}
      <header className="pn-header">
        <div className="pn-header-left">
          <div className="pn-header-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </div>
          <div>
            <div className="pn-eyebrow">
              <span className="pn-eyebrow-dot"/>
              Espace partenaire
            </div>
            <h1 className="pn-title">Notifications</h1>
            <p className="pn-desc">
              {items.length} notification{items.length > 1 ? "s" : ""}
              {hasUnread && (
                <> · <strong className="pn-unread-pill">{nbNonLuesTotal} non lue{nbNonLuesTotal > 1 ? "s" : ""}</strong></>
              )}
            </p>
          </div>
        </div>

        <div className="pn-header-actions">
          {hasUnread && (
            <button className="pn-btn-secondary" onClick={handleMarkAllRead}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Tout marquer lu
            </button>
          )}
          {nbLues > 0 && (
            <button className="pn-btn-danger" onClick={handleDeleteAllRead}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/>
              </svg>
              Vider les lues ({nbLues})
            </button>
          )}
          <button className="pn-icon-btn" onClick={load} disabled={loading} title="Actualiser">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <polyline points="1 4 1 10 7 10"/>
              <path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
            </svg>
          </button>
        </div>
      </header>

      {/* ── Toolbar : filtres ──────────────────────────── */}
      <div className="pn-toolbar">
        {/* Catégories */}
        <div className="pn-cat-tabs" role="tablist">
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              role="tab"
              aria-selected={category === c.id}
              className={`pn-cat-tab ${category === c.id ? "on" : ""}`}
              onClick={() => setCategory(c.id)}
            >
              {c.label}
              {counts[c.id] > 0 && (
                <span className="pn-cat-count">{counts[c.id]}</span>
              )}
            </button>
          ))}
        </div>

        {/* Statut + recherche */}
        <div className="pn-toolbar-right">
          <div className="pn-status-tabs">
            {[
              { id: "all",    label: "Toutes" },
              { id: "unread", label: "Non lues" },
              { id: "read",   label: "Lues" },
            ].map(s => (
              <button
                key={s.id}
                className={`pn-status-tab ${statusF === s.id ? "on" : ""}`}
                onClick={() => setStatusF(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>

          <label className="pn-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Rechercher…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="pn-search-clear" onClick={() => setSearch("")}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="11" height="11">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </label>
        </div>
      </div>

      {/* ── Body : liste ──────────────────────────────── */}
      <div className="pn-body">
        {loading && items.length === 0 ? (
          <div className="pn-state">
            <span className="pn-spin"/>
            <p>Chargement des notifications…</p>
          </div>
        ) : error ? (
          <div className="pn-state pn-state-error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p>{error}</p>
            <button onClick={load} className="pn-btn-secondary">Réessayer</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="pn-state pn-state-empty">
            <div className="pn-empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="42" height="42">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </div>
            <h3>{search || statusF !== "all" || category !== "all" ? "Aucun résultat" : "Pas encore de notification"}</h3>
            <p>
              {search || statusF !== "all" || category !== "all"
                ? "Essayez d'ajuster vos filtres ou votre recherche."
                : "Les nouvelles activités sur vos hôtels apparaîtront ici."}
            </p>
          </div>
        ) : (
          <ul className="pn-list">
            {filtered.map(n => {
              const ico = iconForType(n.type);
              return (
                <li
                  key={n.id}
                  className={`pn-item ${!n.lue ? "pn-item-unread" : ""}`}
                  onClick={() => handleClickItem(n)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => (e.key === "Enter" || e.key === " ") && handleClickItem(n)}
                >
                  <span className={`pn-item-icon pn-ico-${ico.color}`}>
                    {ico.svg}
                  </span>
                  <div className="pn-item-body">
                    <div className="pn-item-head">
                      <h4 className="pn-item-titre">
                        {n.titre}
                        {!n.lue && <span className="pn-dot-unread"/>}
                      </h4>
                      <span className="pn-item-time">{fmtDate(n.created_at)}</span>
                    </div>
                    <p className="pn-item-msg">{n.message}</p>
                  </div>
                  <button
                    className="pn-item-delete"
                    onClick={e => handleDeleteOne(e, n)}
                    title="Supprimer cette notification"
                    aria-label="Supprimer cette notification"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}