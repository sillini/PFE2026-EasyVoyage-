import { useState, useEffect, useRef, useCallback } from "react";
import { supportApi } from "../services/api";
import "./PartenaireSupportPage.css";

// ══════════════════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════════════════
function fmtDate(d) {
  if (!d) return "";
  const date = new Date(d);
  const now  = new Date();
  const diff  = now - date;
  if (diff < 60000)  return "À l'instant";
  if (diff < 3600000) return `Il y a ${Math.floor(diff/60000)} min`;
  if (diff < 86400000) return `Il y a ${Math.floor(diff/3600000)} h`;
  return date.toLocaleDateString("fr-FR", { day:"2-digit", month:"short", year:"numeric" });
}

function fmtTime(d) {
  if (!d) return "";
  return new Date(d).toLocaleTimeString("fr-FR", { hour:"2-digit", minute:"2-digit" });
}

function StatusBadge({ statut }) {
  const map = {
    EN_ATTENTE: { label:"En attente", cls:"waiting" },
    ACCEPTEE:   { label:"En cours",   cls:"active"  },
    FERMEE:     { label:"Fermée",     cls:"closed"  },
  };
  const { label, cls } = map[statut] || { label: statut, cls:"waiting" };
  return <span className={`sp-status-badge sp-badge-${cls}`}><span/>{label}</span>;
}

// ══════════════════════════════════════════════════════════
//  MODAL NOUVELLE CONVERSATION
// ══════════════════════════════════════════════════════════
function NewConvModal({ onClose, onCreate }) {
  const [sujet,   setSujet]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sujet.trim()) { setError("Veuillez saisir un sujet"); return; }
    setLoading(true); setError("");
    try { await onCreate(sujet.trim()); onClose(); }
    catch(err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="sp-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sp-modal">
        <div className="sp-modal-top"/>
        <div className="sp-modal-header">
          <div className="sp-modal-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div>
            <h2>Nouvelle demande de support</h2>
            <p>Un administrateur sera notifié et vous répondra rapidement</p>
          </div>
          <button className="sp-modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="sp-modal-form">
          <div className="sp-field">
            <label>Sujet de la demande <span>*</span></label>
            <input
              value={sujet} onChange={e => setSujet(e.target.value)}
              placeholder="Ex : Problème avec ma fiche hôtel, Demande de modification..."
              className="sp-input" autoFocus
            />
            <span className="sp-field-hint">Soyez précis pour recevoir une aide adaptée</span>
          </div>
          {error && (
            <div className="sp-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}
          <div className="sp-modal-actions">
            <button type="button" className="sp-btn-cancel" onClick={onClose}>Annuler</button>
            <button type="submit" className="sp-btn-primary" disabled={loading}>
              {loading ? <span className="sp-spin"/> : (
                <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/>
                </svg>Envoyer la demande</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  LISTE CONVERSATIONS
// ══════════════════════════════════════════════════════════
function ConvList({ conversations, activeId, onSelect }) {
  if (conversations.length === 0) {
    return (
      <div className="sp-list-empty">
        <div className="sp-empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <p>Aucune conversation</p>
        <span>Créez votre première demande de support</span>
      </div>
    );
  }

  return (
    <div className="sp-list">
      {conversations.map(c => (
        <button
          key={c.id}
          className={`sp-conv-item ${c.id === activeId ? "active" : ""} ${c.nb_non_lus > 0 ? "has-unread" : ""}`}
          onClick={() => onSelect(c)}
        >
          <div className="sp-conv-item-top">
            <span className="sp-conv-sujet">{c.sujet}</span>
            {c.nb_non_lus > 0 && (
              <span className="sp-unread-badge">{c.nb_non_lus}</span>
            )}
          </div>
          <div className="sp-conv-item-mid">
            <StatusBadge statut={c.statut}/>
            {c.admin && (
              <span className="sp-conv-admin">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                {c.admin.prenom} {c.admin.nom}
              </span>
            )}
          </div>
          {c.messages?.length > 0 && (
            <p className="sp-conv-last-msg">
              {c.messages[c.messages.length-1]?.contenu?.slice(0, 50) || ""}
              {c.messages[c.messages.length-1]?.contenu?.length > 50 ? "..." : ""}
            </p>
          )}
          <span className="sp-conv-date">{fmtDate(c.updated_at)}</span>
        </button>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  CHAT VIEW
// ══════════════════════════════════════════════════════════
function ChatView({ conversation, currentUserId, onSend, onClose, onRefresh }) {
  const [texte,   setTexte]   = useState("");
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const bottomRef = useRef(null);
  const textaRef  = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation.messages]);

  const handleSend = async () => {
    if (!texte.trim() || sending) return;
    setSending(true);
    try { await onSend(texte.trim()); setTexte(""); textaRef.current?.focus(); }
    finally { setSending(false); }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleClose = async () => {
    setClosing(true);
    try { await onClose(conversation.id); setConfirmClose(false); }
    finally { setClosing(false); }
  };

  const isFermee  = conversation.statut === "FERMEE";
  const isAttente = conversation.statut === "EN_ATTENTE";
  const msgs = [...(conversation.messages || [])].sort((a,b) => new Date(a.created_at) - new Date(b.created_at));

  // Grouper les messages par date
  const grouped = [];
  let lastDay = "";
  msgs.forEach(m => {
    const day = new Date(m.created_at).toLocaleDateString("fr-FR", { day:"2-digit", month:"long", year:"numeric" });
    if (day !== lastDay) { grouped.push({ type:"day", label: day }); lastDay = day; }
    grouped.push({ type:"msg", data: m });
  });

  return (
    <div className="sp-chat">
      {/* Header chat */}
      <div className="sp-chat-header">
        <div className="sp-chat-info">
          <div className="sp-chat-avatar">
            {conversation.admin
              ? `${conversation.admin.prenom[0]}${conversation.admin.nom[0]}`
              : "?"
            }
          </div>
          <div>
            <h3 className="sp-chat-sujet">{conversation.sujet}</h3>
            <div className="sp-chat-meta">
              <StatusBadge statut={conversation.statut}/>
              {conversation.admin
                ? <span className="sp-chat-with">avec {conversation.admin.prenom} {conversation.admin.nom}</span>
                : <span className="sp-chat-waiting">En attente d'un administrateur...</span>
              }
            </div>
          </div>
        </div>
        <div className="sp-chat-actions">
          <button className="sp-btn-refresh" onClick={onRefresh} title="Actualiser">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="1 4 1 10 7 10"/>
              <path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
            </svg>
          </button>
          {!isFermee && (
            !confirmClose ? (
              <button className="sp-btn-close-conv" onClick={() => setConfirmClose(true)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                Fermer
              </button>
            ) : (
              <div className="sp-confirm-close">
                <span>Fermer définitivement ?</span>
                <button className="sp-confirm-yes" onClick={handleClose} disabled={closing}>
                  {closing ? "..." : "Oui"}
                </button>
                <button className="sp-confirm-no" onClick={() => setConfirmClose(false)}>Non</button>
              </div>
            )
          )}
        </div>
      </div>

      {/* Zone messages */}
      <div className="sp-messages">
        {/* Banner attente */}
        {isAttente && (
          <div className="sp-waiting-banner">
            <div className="sp-waiting-pulse"/>
            <div>
              <strong>Demande envoyée — En attente d'un administrateur</strong>
              <p>Un membre de notre équipe va accepter votre conversation et vous répondre très prochainement.</p>
            </div>
          </div>
        )}

        {/* Messages groupés */}
        {grouped.length === 0 ? (
          <div className="sp-no-messages">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <p>Aucun message pour l'instant</p>
            {!isAttente && <span>Envoyez votre premier message</span>}
          </div>
        ) : (
          grouped.map((item, i) => {
            if (item.type === "day") {
              return (
                <div key={`day-${i}`} className="sp-day-separator">
                  <span>{item.label}</span>
                </div>
              );
            }
            const m   = item.data;
            const isMe = m.id_expediteur === currentUserId;
            const isAdmin = m.expediteur?.role === "ADMIN";
            return (
              <div key={m.id} className={`sp-msg ${isMe ? "sp-msg-me" : "sp-msg-other"}`}>
                {!isMe && (
                  <div className={`sp-msg-avatar ${isAdmin ? "admin" : ""}`}>
                    {m.expediteur
                      ? `${m.expediteur.prenom?.[0] || ""}${m.expediteur.nom?.[0] || ""}`
                      : "?"
                    }
                  </div>
                )}
                <div className="sp-msg-wrap">
                  {!isMe && (
                    <span className="sp-msg-sender">
                      {m.expediteur?.prenom} {m.expediteur?.nom}
                      {isAdmin && <span className="sp-admin-label">Admin</span>}
                    </span>
                  )}
                  <div className={`sp-msg-bubble ${isMe ? "me" : isAdmin ? "admin" : "other"}`}>
                    {m.contenu}
                  </div>
                  <span className="sp-msg-time">{fmtTime(m.created_at)}</span>
                </div>
                {isMe && <div className="sp-msg-spacer"/>}
              </div>
            );
          })
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Zone saisie */}
      {!isFermee ? (
        isAttente ? (
          <div className="sp-input-disabled">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            En attente d'acceptation — vous pourrez envoyer des messages ensuite
          </div>
        ) : (
          <div className="sp-composer">
            <textarea
              ref={textaRef}
              className="sp-composer-input"
              placeholder="Tapez votre message... (Entrée pour envoyer, Maj+Entrée pour aller à la ligne)"
              value={texte}
              onChange={e => setTexte(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <button
              className={`sp-composer-send ${texte.trim() ? "ready" : ""}`}
              onClick={handleSend}
              disabled={!texte.trim() || sending}
            >
              {sending ? (
                <span className="sp-spin"/>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/>
                </svg>
              )}
            </button>
          </div>
        )
      ) : (
        <div className="sp-closed-banner">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="9 11 12 14 22 4"/>
          </svg>
          Cette conversation est fermée
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  PAGE PRINCIPALE
// ══════════════════════════════════════════════════════════
export default function PartenaireSupportPage({ currentUserId }) {
  const [conversations, setConversations] = useState([]);
  const [activeConv,    setActiveConv]    = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");
  const [showNewModal,  setShowNewModal]  = useState(false);
  const [filterStatut,  setFilter]        = useState("tous");

  const load = useCallback(async () => {
    try {
      const d = await supportApi.listConversations();
      setConversations(d.items || []);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Poll toutes les 30s si une conv est ouverte
  useEffect(() => {
    if (!activeConv) return;
    const t = setInterval(() => refreshActive(), 30000);
    return () => clearInterval(t);
  }, [activeConv?.id]);

  const refreshActive = async () => {
    if (!activeConv) return;
    try {
      const d = await supportApi.getConversation(activeConv.id);
      setActiveConv(d);
      setConversations(prev => prev.map(c => c.id === d.id ? d : c));
    } catch {}
  };

  const handleSelect = async (conv) => {
    try {
      const d = await supportApi.getConversation(conv.id);
      setActiveConv(d);
      setConversations(prev => prev.map(c => c.id === d.id ? d : c));
    } catch {}
  };

  const handleCreate = async (sujet) => {
    const d = await supportApi.createConversation({ sujet });
    setConversations(prev => [d, ...prev]);
    setActiveConv(d);
  };

  const handleSend = async (contenu) => {
    if (!activeConv) return;
    const msg = await supportApi.sendMessage(activeConv.id, contenu);
    setActiveConv(prev => ({
      ...prev,
      messages: [...(prev.messages || []), msg],
    }));
    // Refresh liste
    load();
  };

  const handleClose = async (id) => {
    const d = await supportApi.closeConversation(id);
    setActiveConv(d);
    setConversations(prev => prev.map(c => c.id === id ? d : c));
  };

  const filtered = conversations.filter(c => {
    if (filterStatut === "en_attente") return c.statut === "EN_ATTENTE";
    if (filterStatut === "actives")    return c.statut === "ACCEPTEE";
    if (filterStatut === "fermees")    return c.statut === "FERMEE";
    return true;
  });

  const nbEnAttente = conversations.filter(c => c.statut === "EN_ATTENTE").length;
  const nbActives   = conversations.filter(c => c.statut === "ACCEPTEE").length;
  const nbNonLus    = conversations.reduce((acc, c) => acc + (c.nb_non_lus || 0), 0);

  return (
    <div className="sp-page">
      {/* Header */}
      <div className="sp-page-header">
        <div>
          <h1 className="sp-page-title">Support</h1>
          <p className="sp-page-sub">
            {nbActives > 0
              ? `${nbActives} conversation${nbActives>1?"s":""} en cours`
              : "Contactez notre équipe d'administration"
            }
            {nbNonLus > 0 && <span className="sp-header-unread"> · {nbNonLus} non lu{nbNonLus>1?"s":""}</span>}
          </p>
        </div>
        <button className="sp-btn-new" onClick={() => setShowNewModal(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nouvelle demande
        </button>
      </div>

      {/* Stats */}
      <div className="sp-stats">
        {[
          { num:conversations.length, lbl:"Total",      cls:"blue"  },
          { num:nbEnAttente,           lbl:"En attente", cls:"gold"  },
          { num:nbActives,             lbl:"En cours",   cls:"green" },
          { num:conversations.filter(c=>c.statut==="FERMEE").length, lbl:"Fermées", cls:"gray" },
        ].map(s => (
          <div key={s.lbl} className={`sp-stat sp-stat-${s.cls}`}>
            <span className="sp-stat-num">{s.num}</span>
            <span className="sp-stat-lbl">{s.lbl}</span>
          </div>
        ))}
      </div>

      {/* Corps */}
      <div className="sp-body">
        {/* Panel gauche */}
        <div className="sp-panel-left">
          {/* Filtres */}
          <div className="sp-filter-tabs">
            {[
              ["tous",       "Tous",       conversations.length],
              ["en_attente", "En attente", nbEnAttente],
              ["actives",    "En cours",   nbActives],
              ["fermees",    "Fermées",    conversations.filter(c=>c.statut==="FERMEE").length],
            ].map(([val, lbl, nb]) => (
              <button key={val}
                className={`sp-filter-tab ${filterStatut===val?"active":""}`}
                onClick={() => setFilter(val)}>
                {lbl} <span>{nb}</span>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="sp-loading"><div className="sp-spinner"/></div>
          ) : error ? (
            <div className="sp-error-state">
              <p>{error}</p>
              <button onClick={load}>Réessayer</button>
            </div>
          ) : (
            <ConvList
              conversations={filtered}
              activeId={activeConv?.id}
              onSelect={handleSelect}
            />
          )}
        </div>

        {/* Panel droit — chat */}
        <div className="sp-panel-right">
          {activeConv ? (
            <ChatView
              conversation={activeConv}
              currentUserId={currentUserId}
              onSend={handleSend}
              onClose={handleClose}
              onRefresh={refreshActive}
            />
          ) : (
            <div className="sp-no-conv">
              <div className="sp-no-conv-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <h3>Sélectionnez une conversation</h3>
              <p>Choisissez une conversation dans la liste ou créez une nouvelle demande</p>
              <button className="sp-btn-new" onClick={() => setShowNewModal(true)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Créer une demande
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showNewModal && (
        <NewConvModal
          onClose={() => setShowNewModal(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}