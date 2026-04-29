/**
 * src/admin/pages/AdminNotifications.jsx
 * ════════════════════════════════════════════════════════════
 * Page dédiée Notifications admin (à placer à côté d'AdminSupport).
 *
 * Fonctionnalités :
 *   ✓ Liste complète paginée
 *   ✓ Filtres par type (tous / support / promo / retrait / partenaire / réservation / client)
 *   ✓ Filtre par statut (toutes / non lues / lues)
 *   ✓ Marquer une notif lue (au clic) + redirection vers la page concernée
 *   ✓ Marquer tout lu / Vider les notifs lues
 *   ✓ Supprimer une notif
 *   ✓ Auto-refresh toutes les 30s
 *
 * Props :
 *   onNavigate(pageId)  — callback de navigation (passé par App.jsx)
 *
 * Utilise : adminSupportApi de src/admin/services/api.js
 * ════════════════════════════════════════════════════════════
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { adminSupportApi } from "../services/api";
import "./AdminNotifications.css";

const POLL_MS = 30_000;

// ══════════════════════════════════════════════════════════
//  CONFIG : catégories pour filtres
// ══════════════════════════════════════════════════════════
const CATEGORIES = [
  { id: "all",        label: "Toutes",       match: () => true },
  { id: "support",    label: "Support",      match: t => t?.includes("MESSAGE") || t?.includes("SUPPORT") || t?.includes("CONVERSATION") },
  { id: "promotion",  label: "Promotions",   match: t => t?.includes("PROMOTION") },
  { id: "retrait",    label: "Retraits",     match: t => t?.includes("RETRAIT") || t?.includes("PAIEMENT") },
  { id: "partenaire", label: "Partenaires",  match: t => t?.includes("PARTENAIRE") },
  { id: "reservation",label: "Réservations", match: t => t?.includes("RESERVATION") },
  { id: "client",     label: "Clients",      match: t => t === "NOUVEAU_CLIENT" },
];

// ══════════════════════════════════════════════════════════
//  Helpers (mêmes que NotificationsBell)
// ══════════════════════════════════════════════════════════
function targetPageForType(type) {
  switch (type) {
    case "NOUVEAU_MESSAGE":
    case "NOUVELLE_DEMANDE_SUPPORT":
    case "CONVERSATION_ACCEPTEE":
    case "CONVERSATION_FERMEE":
      return "support";
    case "NOUVELLE_PROMOTION":
    case "PROMOTION_PENDING":
      return "promotions";
    case "DEMANDE_RETRAIT":
    case "NOUVELLE_DEMANDE_RETRAIT":
      return "finances";
    case "DEMANDE_PARTENAIRE":
    case "NOUVELLE_DEMANDE_PARTENAIRE":
      return "demandes-partenaire";
    case "RESERVATION":
    case "NOUVELLE_RESERVATION":
    case "NOUVELLE_RESERVATION_VISITEUR":
      return "reservations";
    case "NOUVEAU_CLIENT":
      return "clients";
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
  if (type?.includes("RETRAIT") || type?.includes("PAIEMENT")) {
    return { color: "green", svg: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>) };
  }
  if (type?.includes("PARTENAIRE")) {
    return { color: "purple", svg: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>) };
  }
  if (type?.includes("RESERVATION")) {
    return { color: "teal", svg: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/></svg>) };
  }
  if (type?.includes("CLIENT")) {
    return { color: "red", svg: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>) };
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
export default function AdminNotifications({ onNavigate }) {
  const [items,    setItems]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [category, setCategory] = useState("all");
  const [statusF,  setStatusF]  = useState("all"); // all | unread | read
  const [search,   setSearch]   = useState("");

  // ── Chargement ──────────────────────────────────────────
  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await adminSupportApi.getNotifications();
      setItems(data?.items || []);
    } catch (e) {
      console.error(e);
      setError("Impossible de charger les notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  // ── Filtrage ────────────────────────────────────────────
  const filtered = useMemo(() => {
    const cat = CATEGORIES.find(c => c.id === category) || CATEGORIES[0];
    return items.filter(n => {
      // filtre catégorie
      if (!cat.match(n.type)) return false;
      // filtre statut
      if (statusF === "unread" && n.lue)  return false;
      if (statusF === "read"   && !n.lue) return false;
      // filtre recherche
      if (search.trim()) {
        const q = search.toLowerCase();
        const inTitre = (n.titre   || "").toLowerCase().includes(q);
        const inMsg   = (n.message || "").toLowerCase().includes(q);
        if (!inTitre && !inMsg) return false;
      }
      return true;
    });
  }, [items, category, statusF, search]);

  // ── Compteurs par catégorie (pour les badges des onglets) ──
  const countByCat = useMemo(() => {
    const map = {};
    CATEGORIES.forEach(c => {
      map[c.id] = items.filter(n => c.match(n.type) && !n.lue).length;
    });
    return map;
  }, [items]);

  const nbNonLuesTotal = items.filter(n => !n.lue).length;

  // ── Actions ─────────────────────────────────────────────
  const handleClickItem = async (notif) => {
    if (!notif.lue) {
      setItems(prev => prev.map(n => n.id === notif.id ? { ...n, lue: true } : n));
      try { await adminSupportApi.markRead(notif.id); } catch (e) { console.error(e); }
    }
    const target = targetPageForType(notif.type);
    if (target && onNavigate) onNavigate(target);
  };

  const handleMarkAllRead = async () => {
    setItems(prev => prev.map(n => ({ ...n, lue: true })));
    try { await adminSupportApi.markAllRead(); }
    catch (e) { console.error(e); load(); }
  };

  const handleDeleteAllRead = async () => {
    if (!window.confirm("Supprimer définitivement toutes les notifications lues ?")) return;
    try {
      await adminSupportApi.deleteAllRead();
      load();
    } catch (e) { console.error(e); setError("Erreur lors de la suppression"); }
  };

  const handleDeleteOne = async (e, notif) => {
    e.stopPropagation();
    setItems(prev => prev.filter(n => n.id !== notif.id));
    try { await adminSupportApi.deleteNotification(notif.id); }
    catch (err) { console.error(err); load(); }
  };

  // ══════════════════════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════════════════════
  return (
    <div className="adm-notif-page">

      {/* ── Header ───────────────────────────────────── */}
      <header className="adm-notif-header">
        <div className="adm-notif-header-left">
          <div className="adm-notif-header-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </div>
          <div>
            <h1>Notifications</h1>
            <p>
              {items.length} notification{items.length > 1 ? "s" : ""}
              {nbNonLuesTotal > 0 && (
                <> · <strong className="adm-notif-unread-pill">{nbNonLuesTotal} non lue{nbNonLuesTotal > 1 ? "s" : ""}</strong></>
              )}
            </p>
          </div>
        </div>

        <div className="adm-notif-header-actions">
          {nbNonLuesTotal > 0 && (
            <button className="adm-notif-btn adm-notif-btn-primary" onClick={handleMarkAllRead}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Tout marquer lu
            </button>
          )}
          {items.some(n => n.lue) && (
            <button className="adm-notif-btn adm-notif-btn-ghost" onClick={handleDeleteAllRead}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              </svg>
              Vider les lues
            </button>
          )}
        </div>
      </header>

      {/* ── Toolbar : recherche + statut ─────────────── */}
      <div className="adm-notif-toolbar">
        <div className="adm-notif-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Rechercher dans les notifications…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch("")} className="adm-notif-search-clear">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>

        <div className="adm-notif-status-tabs">
          {[
            { id: "all",    label: "Toutes" },
            { id: "unread", label: "Non lues" },
            { id: "read",   label: "Lues" },
          ].map(s => (
            <button
              key={s.id}
              className={`adm-notif-status-tab ${statusF === s.id ? "active" : ""}`}
              onClick={() => setStatusF(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Catégories (chips) ───────────────────────── */}
      <div className="adm-notif-cats">
        {CATEGORIES.map(c => {
          const count = countByCat[c.id] || 0;
          return (
            <button
              key={c.id}
              className={`adm-notif-cat ${category === c.id ? "active" : ""}`}
              onClick={() => setCategory(c.id)}
            >
              {c.label}
              {count > 0 && <span className="adm-notif-cat-badge">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* ── Liste ────────────────────────────────────── */}
      <div className="adm-notif-list">
        {error && <div className="adm-notif-error">{error}</div>}

        {loading && items.length === 0 && (
          <div className="adm-notif-state">
            <span className="adm-notif-spin" />
            Chargement des notifications…
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="adm-notif-empty">
            <div className="adm-notif-empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </div>
            <h3>
              {items.length === 0
                ? "Aucune notification"
                : "Aucun résultat"}
            </h3>
            <p>
              {items.length === 0
                ? "Les nouvelles activités de la plateforme apparaîtront ici"
                : "Essayez de modifier les filtres"}
            </p>
          </div>
        )}

        {filtered.map(n => {
          const ico = iconForType(n.type);
          const target = targetPageForType(n.type);
          return (
            <article
              key={n.id}
              className={`adm-notif-card ${!n.lue ? "unread" : ""}`}
              onClick={() => handleClickItem(n)}
            >
              <div className={`adm-notif-card-icon ico-${ico.color}`}>
                {ico.svg}
              </div>

              <div className="adm-notif-card-body">
                <div className="adm-notif-card-titre">
                  {n.titre}
                  {!n.lue && <span className="adm-notif-card-dot" />}
                </div>
                <p className="adm-notif-card-msg">{n.message}</p>
                <div className="adm-notif-card-foot">
                  <span className="adm-notif-card-time">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="11" height="11">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    {fmtDate(n.created_at)}
                  </span>
                  {target && (
                    <span className="adm-notif-card-cta">
                      Voir →
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                className="adm-notif-card-del"
                onClick={(e) => handleDeleteOne(e, n)}
                title="Supprimer"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}