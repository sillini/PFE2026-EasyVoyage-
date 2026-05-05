/**
 * src/partenaire/components/layout/NotificationsBell.jsx
 * ========================================================
 * Cloche de notifications dans la topbar partenaire.
 *
 *   - Badge avec compteur non lues
 *   - Polling auto 30s
 *   - Animation pulse à l'arrivée d'une nouvelle notif
 *   - Click → marque lu + redirige selon le type
 *   - Bouton "Tout marquer lu"
 *   - Bouton "Voir toutes les notifications"
 *
 * Inspirée de l'admin NotificationsBell mais avec préfixe `pb-`
 * (Partenaire Bell) et palette adaptée.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { notificationsApi } from "../../services/notificationsApi";
import "./NotificationsBell.css";

const POLL_MS = 30_000;

// ══════════════════════════════════════════════════════════
//  ROUTAGE par type de notification
// ══════════════════════════════════════════════════════════
function targetPageForType(type) {
  switch (type) {
    // Support / Messages
    case "NOUVEAU_MESSAGE":
    case "NOUVELLE_DEMANDE_SUPPORT":
    case "CONVERSATION_ACCEPTEE":
    case "CONVERSATION_FERMEE":
      return "support";

    // Promotions
    case "PROMOTION_APPROUVEE":
    case "PROMOTION_REFUSEE":
    case "NOUVELLE_PROMOTION":
      return "promotions";

    // Réservations
    case "NOUVELLE_RESERVATION_HOTEL":
    case "RESERVATION_ANNULEE":
    case "NOUVELLE_RESERVATION":
    case "NOUVELLE_RESERVATION_VISITEUR":
      return "reservations";

    // Finances
    case "PAIEMENT_RECU":
    case "RETRAIT_APPROUVE":
    case "RETRAIT_REFUSE":
    case "NOUVELLE_DEMANDE_RETRAIT":
      return "finances";

    // Hôtels
    case "HOTEL_MIS_EN_AVANT":
    case "NOUVEL_AVIS":
      return "hotels";

    default:
      return null;
  }
}

// ══════════════════════════════════════════════════════════
//  ICÔNES par type
// ══════════════════════════════════════════════════════════
function iconForType(type) {
  // Support / Messages
  if (type?.includes("MESSAGE") || type?.includes("SUPPORT") || type?.includes("CONVERSATION")) {
    return {
      color: "blue",
      svg: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
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
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
          <line x1="7" y1="7" x2="7.01" y2="7"/>
        </svg>
      ),
    };
  }
  // Paiements / Retraits / Finances
  if (type?.includes("PAIEMENT") || type?.includes("RETRAIT")) {
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
  // Réservations
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
  // Hôtels / Avis
  if (type?.includes("HOTEL") || type?.includes("AVIS")) {
    return {
      color: "purple",
      svg: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      ),
    };
  }
  // Default
  return {
    color: "slate",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    ),
  };
}

// ── Helper temps relatif ──────────────────────────────────
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
      const data = await notificationsApi.getNotifications();
      const list = data?.items || [];
      setItems(list);

      const nbNonLues = list.filter((n) => !n.lue).length;
      if (nbNonLues > lastCountRef.current && lastCountRef.current > 0) {
        setPulse(true);
        setTimeout(() => setPulse(false), 1600);
      }
      lastCountRef.current = nbNonLues;
    } catch (e) {
      console.error("Erreur chargement notifications partenaire :", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  // Fermeture au clic hors panel + Escape
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
      try { await notificationsApi.markRead(notif.id); } catch (e) { console.error(e); }
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
    try { await notificationsApi.markAllRead(); }
    catch (err) { console.error(err); load(); }
  };

  const handleVoirToutes = () => {
    onNavigate?.("notifications");
    setOpen(false);
  };

  return (
    <div className="pb-nb-wrap">
      <button
        ref={buttonRef}
        className={`pb-nb-trigger ${open ? "pb-nb-trigger-open" : ""} ${pulse ? "pb-nb-pulse" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${hasUnread ? ` (${nbNonLues} non lue${nbNonLues > 1 ? "s" : ""})` : ""}`}
        aria-expanded={open}
        title="Notifications"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {hasUnread && (
          <span className="pb-nb-badge">
            {nbNonLues > 99 ? "99+" : nbNonLues}
          </span>
        )}
      </button>

      {open && (
        <div className="pb-nb-panel" ref={panelRef} role="dialog" aria-label="Notifications">
          <div className="pb-nb-head">
            <div>
              <h3 className="pb-nb-title">Notifications</h3>
              <p className="pb-nb-sub">
                {hasUnread
                  ? `${nbNonLues} non lue${nbNonLues > 1 ? "s" : ""}`
                  : items.length === 0 ? "Aucune notification" : "Tout est à jour"}
              </p>
            </div>
            {hasUnread && (
              <button
                type="button"
                className="pb-nb-mark-all"
                onClick={handleMarkAllRead}
              >
                Tout marquer lu
              </button>
            )}
          </div>

          <div className="pb-nb-list">
            {loading && items.length === 0 && (
              <div className="pb-nb-state">
                <span className="pb-nb-spin"/>
                Chargement…
              </div>
            )}

            {!loading && items.length === 0 && (
              <div className="pb-nb-state pb-nb-empty">
                <div className="pb-nb-empty-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
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
                  className={`pb-nb-item ${!n.lue ? "pb-nb-item-unread" : ""}`}
                  onClick={() => handleClickItem(n)}
                >
                  <span className={`pb-nb-icon pb-nb-ico-${ico.color}`}>
                    {ico.svg}
                  </span>
                  <div className="pb-nb-body">
                    <div className="pb-nb-titre">
                      {n.titre}
                      {!n.lue && <span className="pb-nb-dot-unread"/>}
                    </div>
                    <p className="pb-nb-msg">{n.message}</p>
                    <span className="pb-nb-time">{timeAgo(n.created_at)}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {items.length > 0 && (
            <div className="pb-nb-foot">
              <button
                type="button"
                className="pb-nb-voir-toutes"
                onClick={handleVoirToutes}
              >
                Voir toutes les notifications
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/>
                </svg>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}