/**
 * src/admin/components/layout/NotificationsBell.jsx
 * ===================================================
 * Cloche de notifications dans la topbar admin.
 *
 *   - Badge rouge avec compteur non lues
 *   - Polling auto 30s
 *   - Animation pulse à l'arrivée d'une nouvelle notif
 *   - Click → marque lu + redirige selon le type
 *   - Bouton "Tout marquer lu"
 *   - ✨ NEW: Bouton "Voir toutes les notifications" (page dédiée)
 *   - ✨ NEW: Icônes complètes pour TOUS les types
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { adminSupportApi } from "../../services/api";
import "./NotificationsBell.css";

const POLL_MS = 30_000;

// ══════════════════════════════════════════════════════════
//  ROUTAGE selon le type de notification
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

// ══════════════════════════════════════════════════════════
//  ICÔNES COMPLÈTES par type
// ══════════════════════════════════════════════════════════
function iconForType(type) {
  // Support / Messages
  if (type?.includes("MESSAGE") || type?.includes("SUPPORT") || type?.includes("CONVERSATION")) {
    return {
      color: "blue",
      svg: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    };
  }
  // Promotions
  if (type?.includes("PROMOTION")) {
    return {
      color: "amber",
      svg: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
      ),
    };
  }
  // Retrait / paiement (FINANCE)
  if (type?.includes("RETRAIT") || type?.includes("PAIEMENT")) {
    return {
      color: "green",
      svg: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="1" x2="12" y2="23"/>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      ),
    };
  }
  // Demande partenaire
  if (type?.includes("PARTENAIRE")) {
    return {
      color: "purple",
      svg: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <line x1="19" y1="8" x2="19" y2="14"/>
          <line x1="22" y1="11" x2="16" y2="11"/>
        </svg>
      ),
    };
  }
  // Réservation
  if (type?.includes("RESERVATION")) {
    return {
      color: "teal",
      svg: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
        </svg>
      ),
    };
  }
  // Nouveau client
  if (type?.includes("CLIENT")) {
    return {
      color: "red",
      svg: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="8.5" cy="7" r="4"/>
          <line x1="20" y1="8" x2="20" y2="14"/>
          <line x1="23" y1="11" x2="17" y2="11"/>
        </svg>
      ),
    };
  }
  // Default
  return {
    color: "slate",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  };
}

// ══════════════════════════════════════════════════════════
//  Helper temps relatif
// ══════════════════════════════════════════════════════════
function timeAgo(d) {
  if (!d) return "";
  const diff = Date.now() - new Date(d);
  if (diff < 60000)    return "À l'instant";
  if (diff < 3600000)  return `${Math.floor(diff/60000)} min`;
  if (diff < 86400000) return `${Math.floor(diff/3600000)} h`;
  if (diff < 604800000) return `${Math.floor(diff/86400000)} j`;
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

// ══════════════════════════════════════════════════════════
//  COMPONENT
// ══════════════════════════════════════════════════════════
export default function NotificationsBell({ onNavigate }) {
  const [open,    setOpen]    = useState(false);
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [pulse,   setPulse]   = useState(false);
  const lastCountRef = useRef(0);
  const panelRef     = useRef(null);
  const buttonRef    = useRef(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminSupportApi.getNotifications();
      const list = data?.items || [];
      setItems(list);

      const nbNonLues = list.filter((n) => !n.lue).length;
      if (nbNonLues > lastCountRef.current && lastCountRef.current > 0) {
        setPulse(true);
        setTimeout(() => setPulse(false), 1600);
      }
      lastCountRef.current = nbNonLues;
    } catch (e) {
      console.error("Erreur chargement notifications :", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (
        panelRef.current  && !panelRef.current.contains(e.target) &&
        buttonRef.current && !buttonRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    const onEsc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown",   onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown",   onEsc);
    };
  }, [open]);

  const nbNonLues = items.filter((n) => !n.lue).length;
  const hasUnread = nbNonLues > 0;

  const handleClickItem = async (notif) => {
    if (!notif.lue) {
      setItems((prev) => prev.map((n) => (n.id === notif.id ? { ...n, lue: true } : n)));
      try { await adminSupportApi.markRead(notif.id); }
      catch (e) { console.error(e); }
    }
    const target = targetPageForType(notif.type);
    if (target && onNavigate) {
      onNavigate(target);
      setOpen(false);
    }
  };

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    setItems((prev) => prev.map((n) => ({ ...n, lue: true })));
    try { await adminSupportApi.markAllRead(); }
    catch (err) { console.error(err); load(); }
  };

  // ✨ NEW : ouvre la page dédiée Notifications
  const handleVoirToutes = () => {
    onNavigate?.("notifications");
    setOpen(false);
  };

  return (
    <div className="adm-nb-wrap">
      <button
        ref={buttonRef}
        className={`adm-nb-trigger ${open ? "adm-nb-trigger-open" : ""} ${pulse ? "adm-nb-pulse" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${hasUnread ? ` (${nbNonLues} non lue${nbNonLues > 1 ? "s" : ""})` : ""}`}
        aria-expanded={open}
        title="Notifications"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {hasUnread && (
          <span className="adm-nb-badge">
            {nbNonLues > 99 ? "99+" : nbNonLues}
          </span>
        )}
      </button>

      {open && (
        <div className="adm-nb-panel" ref={panelRef} role="dialog" aria-label="Notifications">
          <div className="adm-nb-head">
            <div>
              <h3 className="adm-nb-title">Notifications</h3>
              <p className="adm-nb-sub">
                {hasUnread
                  ? `${nbNonLues} non lue${nbNonLues > 1 ? "s" : ""}`
                  : items.length === 0 ? "Aucune notification" : "Tout est à jour"}
              </p>
            </div>
            {hasUnread && (
              <button
                type="button"
                className="adm-nb-mark-all"
                onClick={handleMarkAllRead}
              >
                Tout marquer lu
              </button>
            )}
          </div>

          <div className="adm-nb-list">
            {loading && items.length === 0 && (
              <div className="adm-nb-state">
                <span className="adm-nb-spin" />
                Chargement…
              </div>
            )}

            {!loading && items.length === 0 && (
              <div className="adm-nb-state adm-nb-empty">
                <div className="adm-nb-empty-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </div>
                <p>Pas encore de notification</p>
                <small>Les nouvelles activités apparaîtront ici</small>
              </div>
            )}

            {/* On affiche les 8 plus récentes dans la cloche */}
            {items.slice(0, 8).map((n) => {
              const ico = iconForType(n.type);
              return (
                <button
                  type="button"
                  key={n.id}
                  className={`adm-nb-item ${!n.lue ? "adm-nb-item-unread" : ""}`}
                  onClick={() => handleClickItem(n)}
                >
                  <div className={`adm-nb-icon adm-nb-ico-${ico.color}`}>
                    {ico.svg}
                  </div>
                  <div className="adm-nb-body">
                    <div className="adm-nb-titre">
                      {n.titre}
                      {!n.lue && <span className="adm-nb-dot-unread" />}
                    </div>
                    <div className="adm-nb-msg">{n.message}</div>
                    <div className="adm-nb-time">{timeAgo(n.created_at)}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {items.length > 0 && (
            <div className="adm-nb-foot">
              <button
                type="button"
                className="adm-nb-link"
                onClick={handleVoirToutes}
              >
                Voir toutes les notifications →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}