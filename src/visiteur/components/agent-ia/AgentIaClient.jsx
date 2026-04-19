/**
 * AgentIaClient.jsx
 * =================
 * Widget Assistant EasyVoyage — design professionnel type Claude.ai
 *
 * Features :
 *   - Sidebar groupée par période (Aujourd'hui / Hier / ...)
 *   - Rename inline (double-clic ou icône crayon)
 *   - Supprimer (icône trash)
 *   - Nouvelle conversation
 *   - Markdown dans les messages
 *   - Auth required screen
 *
 * Props :
 *   - onLoginRedirect : callback pour ouvrir le modal login
 */
import React, { useState, useEffect, useRef, useMemo } from "react";
import useAgentIaClient from "./useAgentIaClient";
import "./AgentIaClient.css";

// ══════════════════════════════════════════════════════════
//  ICÔNES — SVG élégants
// ══════════════════════════════════════════════════════════

const Icon = {
  AI: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v3M12 18v3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M3 12h3M18 12h3M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>
      <circle cx="12" cy="12" r="3.5"/>
    </svg>
  ),
  Sparkles: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l1.5 5L18 8.5 13.5 10 12 15l-1.5-5L6 8.5 10.5 7z"/>
      <path d="M19 15l.7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7z"/>
      <path d="M5 4l.5 1.5L7 6l-1.5.5L5 8l-.5-1.5L3 6l1.5-.5z"/>
    </svg>
  ),
  Close: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  Menu: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  ),
  Plus: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  Trash: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6M14 11v6"/>
    </svg>
  ),
  Edit: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9"/>
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
    </svg>
  ),
  Check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  Send: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  ),
  Lock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  Alert: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  Chevron: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  MessageSquare: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  Building: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18"/>
      <path d="M6 12h12M6 7h12M6 17h12"/>
    </svg>
  ),
  Plane: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
    </svg>
  ),
  Calendar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  Coins: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6"/>
      <path d="M18.09 10.37A6 6 0 1 1 10.34 18"/>
      <path d="M7 6h1v4"/>
    </svg>
  ),
  Inbox: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
    </svg>
  ),
};


const SUGGESTIONS = [
  { icon: Icon.Building, text: "Quels hôtels 4 étoiles à Sousse ?" },
  { icon: Icon.Plane,    text: "Voyages organisés au Sahara" },
  { icon: Icon.Calendar, text: "Mes réservations à venir" },
  { icon: Icon.Coins,    text: "Simuler le prix d'un séjour" },
];


// ══════════════════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════════════════

function formatTime(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString("fr-FR", {
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return ""; }
}

function renderMarkdown(text) {
  if (!text) return "";
  let html = text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener">$1</a>'
  );
  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.+<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`);
  html = html.replace(/\n/g, "<br/>");
  return html;
}

function groupConversationsByDate(conversations) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);
  const lastMonth = new Date(today);
  lastMonth.setDate(lastMonth.getDate() - 30);

  const groups = {
    "Aujourd'hui":    [],
    "Hier":           [],
    "Cette semaine":  [],
    "Ce mois-ci":     [],
    "Plus ancien":    [],
  };

  for (const c of conversations) {
    const d = new Date(c.last_message_at || c.created_at);
    if (d >= today) groups["Aujourd'hui"].push(c);
    else if (d >= yesterday) groups["Hier"].push(c);
    else if (d >= lastWeek) groups["Cette semaine"].push(c);
    else if (d >= lastMonth) groups["Ce mois-ci"].push(c);
    else groups["Plus ancien"].push(c);
  }

  return Object.entries(groups).filter(([_, items]) => items.length > 0);
}


// ══════════════════════════════════════════════════════════
//  SOUS-COMPOSANTS
// ══════════════════════════════════════════════════════════

function Launcher({ onClick }) {
  return (
    <button
      className="ev-agent-launcher"
      onClick={onClick}
      aria-label="Ouvrir l'assistant EasyVoyage"
      type="button"
    >
      <span className="ev-agent-launcher__pulse" />
      <span className="ev-agent-launcher__dot" />
      <span className="ev-agent-launcher__icon">{Icon.AI}</span>
      <span className="ev-agent-launcher__tooltip">Assistant IA EasyVoyage</span>
    </button>
  );
}

function Header({ onToggleSidebar, onNewChat, onClose, sidebarOpen }) {
  return (
    <div className="ev-agent-header">
      <button
        className="ev-agent-header__btn"
        onClick={onToggleSidebar}
        aria-label={sidebarOpen ? "Fermer l'historique" : "Ouvrir l'historique"}
        type="button"
      >
        {Icon.Menu}
      </button>
      <div className="ev-agent-header__avatar">{Icon.AI}</div>
      <div className="ev-agent-header__titles">
        <p className="ev-agent-header__title">Assistant EasyVoyage</p>
        <p className="ev-agent-header__subtitle">
          <span className="ev-agent-header__status-dot" />
          Propulsé par IA
        </p>
      </div>
      <div className="ev-agent-header__actions">
        <button className="ev-agent-header__btn" onClick={onNewChat}
                aria-label="Nouvelle conversation" type="button" title="Nouvelle conversation">
          {Icon.Plus}
        </button>
        <button className="ev-agent-header__btn" onClick={onClose}
                aria-label="Fermer" type="button" title="Fermer">
          {Icon.Close}
        </button>
      </div>
    </div>
  );
}


// ──────────────────────────────────────────────────────────
//  ConversationItem — avec rename inline
// ──────────────────────────────────────────────────────────

function ConversationItem({ conv, isActive, onOpen, onDelete, onRename }) {
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(conv.titre);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  // Synchronise si la conversation change (selection différente)
  useEffect(() => {
    if (!editing) setDraftTitle(conv.titre);
  }, [conv.titre, editing]);

  const startEdit = (e) => {
    if (e) e.stopPropagation();
    setDraftTitle(conv.titre);
    setEditing(true);
  };

  const commitEdit = async () => {
    const trimmed = draftTitle.trim();
    if (!trimmed) {
      // Titre vide → on annule l'édition
      setDraftTitle(conv.titre);
      setEditing(false);
      return;
    }
    if (trimmed === conv.titre) {
      setEditing(false);
      return;
    }
    const ok = await onRename(conv.id, trimmed);
    if (ok) {
      setEditing(false);
    } else {
      // Echec → on revient à l'ancien titre
      setDraftTitle(conv.titre);
      setEditing(false);
    }
  };

  const cancelEdit = () => {
    setDraftTitle(conv.titre);
    setEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitEdit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit();
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm("Supprimer cette conversation ?")) {
      onDelete(conv.id);
    }
  };

  return (
    <div
      className={`ev-agent-conv-item${isActive ? " active" : ""}${editing ? " editing" : ""}`}
      onClick={() => !editing && onOpen(conv.id)}
      role="button"
      tabIndex={editing ? -1 : 0}
    >
      {editing ? (
        <div className="ev-agent-conv-item__edit-row">
          <input
            ref={inputRef}
            type="text"
            className="ev-agent-conv-item__edit-input"
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={commitEdit}
            onClick={(e) => e.stopPropagation()}
            maxLength={200}
            placeholder="Nom de la conversation"
          />
          <button
            className="ev-agent-conv-item__edit-btn"
            onClick={(e) => { e.stopPropagation(); commitEdit(); }}
            onMouseDown={(e) => e.preventDefault()} // évite onBlur avant onClick
            aria-label="Valider"
            type="button"
            title="Valider (Entrée)"
          >
            {Icon.Check}
          </button>
        </div>
      ) : (
        <>
          <p
            className="ev-agent-conv-item__title"
            onDoubleClick={startEdit}
            title="Double-cliquez pour renommer"
          >
            {conv.titre}
          </p>
          <p className="ev-agent-conv-item__meta">
            <span>{conv.nb_messages || 0} message{(conv.nb_messages || 0) > 1 ? "s" : ""}</span>
            {conv.last_message_at && (
              <>
                <span className="ev-agent-conv-item__meta-dot" />
                <span>{formatTime(conv.last_message_at)}</span>
              </>
            )}
          </p>
          <div className="ev-agent-conv-item__actions">
            <button
              className="ev-agent-conv-item__action-btn"
              onClick={startEdit}
              aria-label="Renommer"
              type="button"
              title="Renommer"
            >
              {Icon.Edit}
            </button>
            <button
              className="ev-agent-conv-item__action-btn ev-agent-conv-item__action-btn--danger"
              onClick={handleDelete}
              aria-label="Supprimer"
              type="button"
              title="Supprimer"
            >
              {Icon.Trash}
            </button>
          </div>
        </>
      )}
    </div>
  );
}


function Sidebar({ conversations, activeId, onOpen, onDelete, onRename, onNew, isLoading }) {
  const grouped = useMemo(
    () => groupConversationsByDate(conversations),
    [conversations]
  );

  return (
    <div className="ev-agent-sidebar">
      <div className="ev-agent-sidebar__head">
        <h3 className="ev-agent-sidebar__title">Historique</h3>
        <button className="ev-agent-sidebar__new-btn" onClick={onNew} type="button">
          {Icon.Plus}
          Nouveau
        </button>
      </div>

      <div className="ev-agent-sidebar__list">
        {isLoading && (
          <div className="ev-agent-sidebar__empty">
            <div className="ev-agent-sidebar__empty-icon">{Icon.MessageSquare}</div>
            Chargement…
          </div>
        )}

        {!isLoading && conversations.length === 0 && (
          <div className="ev-agent-sidebar__empty">
            <div className="ev-agent-sidebar__empty-icon">{Icon.Inbox}</div>
            Aucune conversation.<br/>
            Commencez par poser une question.
          </div>
        )}

        {!isLoading && grouped.map(([groupLabel, items]) => (
          <React.Fragment key={groupLabel}>
            <p className="ev-agent-sidebar__group-label">{groupLabel}</p>
            {items.map((c) => (
              <ConversationItem
                key={c.id}
                conv={c}
                isActive={c.id === activeId}
                onOpen={onOpen}
                onDelete={onDelete}
                onRename={onRename}
              />
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}


function Welcome({ onSuggest }) {
  return (
    <div className="ev-agent-welcome">
      <div className="ev-agent-welcome__icon">{Icon.Sparkles}</div>
      <h3 className="ev-agent-welcome__title">Bonjour !</h3>
      <p className="ev-agent-welcome__subtitle">
        Je peux vous aider à trouver un séjour, consulter vos réservations,
        ou répondre à vos questions sur EasyVoyage.
      </p>
      <div className="ev-agent-suggestions">
        {SUGGESTIONS.map((s, i) => (
          <button
            key={i}
            className="ev-agent-suggestion"
            onClick={() => onSuggest(s.text)}
            type="button"
          >
            <span className="ev-agent-suggestion__icon">{s.icon}</span>
            <span className="ev-agent-suggestion__text">{s.text}</span>
            <span className="ev-agent-suggestion__arrow">{Icon.Chevron}</span>
          </button>
        ))}
      </div>
    </div>
  );
}


function MessageBubble({ message }) {
  const isUser = message.role === "user";
  const isError = message.is_error;
  return (
    <div className={`ev-msg ${isUser ? "user" : "assistant"}${isError ? " error" : ""}`}>
      <div className={`ev-msg__avatar ${isUser ? "user" : "assistant"}`}>
        {isUser ? "SA" : Icon.AI}
      </div>
      <div className="ev-msg__content">
        <div
          className="ev-msg__bubble"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(message.contenu) }}
        />
        <div className="ev-msg__time">{formatTime(message.created_at)}</div>
      </div>
    </div>
  );
}


function TypingIndicator() {
  return (
    <div className="ev-msg assistant">
      <div className="ev-msg__avatar assistant">{Icon.AI}</div>
      <div className="ev-msg__content">
        <div className="ev-typing" aria-label="Assistant en train d'écrire">
          <span className="ev-typing__dot" />
          <span className="ev-typing__dot" />
          <span className="ev-typing__dot" />
        </div>
      </div>
    </div>
  );
}


function InputBar({ onSend, disabled }) {
  const [text, setText] = useState("");
  const textareaRef = useRef(null);

  const handleSend = () => {
    const t = text.trim();
    if (!t || disabled) return;
    onSend(t);
    setText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e) => {
    setText(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
    }
  };

  return (
    <div className="ev-agent-input">
      <div className="ev-agent-input__row">
        <textarea
          ref={textareaRef}
          className="ev-agent-input__field"
          placeholder="Posez votre question…"
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={1}
        />
        <button
          className="ev-agent-input__send"
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          aria-label="Envoyer"
          type="button"
        >
          {Icon.Send}
        </button>
      </div>
      <p className="ev-agent-input__hint">
        <kbd>Entrée</kbd> pour envoyer · <kbd>Maj</kbd>+<kbd>Entrée</kbd> pour nouvelle ligne
      </p>
    </div>
  );
}


function AuthRequired({ onLogin }) {
  return (
    <div className="ev-agent-auth">
      <div className="ev-agent-auth__icon">{Icon.Lock}</div>
      <h3 className="ev-agent-auth__title">Connexion requise</h3>
      <p className="ev-agent-auth__text">
        Connectez-vous à votre compte pour profiter de votre assistant personnel
        EasyVoyage, consulter vos réservations, gérer vos favoris et bien plus.
      </p>
      <button className="ev-agent-auth__btn" onClick={onLogin} type="button">
        Se connecter
      </button>
    </div>
  );
}


// ══════════════════════════════════════════════════════════
//  COMPOSANT PRINCIPAL
// ══════════════════════════════════════════════════════════

export default function AgentIaClient({ onLoginRedirect } = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const messagesEndRef = useRef(null);

  const {
    conversations,
    activeConvId,
    messages,
    isLoadingList,
    isLoadingConv,
    isSending,
    error,
    refreshConversations,
    openConversation,
    startNewConversation,
    sendMessage,
    deleteConversation,
    renameConversation,
    isAuthenticated,
  } = useAgentIaClient({ autoLoadOnMount: false });

  const authenticated = isAuthenticated();

  useEffect(() => {
    if (isOpen && authenticated) {
      refreshConversations();
    }
  }, [isOpen, authenticated, refreshConversations]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isSending]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (isOpen && window.innerWidth <= 520) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleSuggest = (text) => sendMessage(text);

  const handleOpenConv = (id) => {
    openConversation(id);
    setShowSidebar(false);
  };

  const handleNewChat = () => {
    startNewConversation();
    setShowSidebar(false);
  };

  const handleLoginRedirect = () => {
    setIsOpen(false);
    if (typeof onLoginRedirect === "function") {
      setTimeout(() => onLoginRedirect(), 200);
    }
  };

  return (
    <>
      {!isOpen && <Launcher onClick={() => setIsOpen(true)} />}

      {isOpen && (
        <div className="ev-agent-panel" role="dialog" aria-label="Assistant EasyVoyage">
          <Header
            onToggleSidebar={() => setShowSidebar((s) => !s)}
            onNewChat={handleNewChat}
            onClose={() => setIsOpen(false)}
            sidebarOpen={showSidebar}
          />

          {error && (
            <div className="ev-agent-error">
              {Icon.Alert}
              <span>{error}</span>
            </div>
          )}

          {!authenticated ? (
            <AuthRequired onLogin={handleLoginRedirect} />
          ) : (
            <>
              {showSidebar && (
                <Sidebar
                  conversations={conversations}
                  activeId={activeConvId}
                  onOpen={handleOpenConv}
                  onDelete={deleteConversation}
                  onRename={renameConversation}
                  onNew={handleNewChat}
                  isLoading={isLoadingList}
                />
              )}

              <div className="ev-agent-messages">
                {isLoadingConv && (
                  <div style={{ textAlign: "center", padding: 20, color: "var(--ev-text-muted)", fontSize: 13 }}>
                    Chargement…
                  </div>
                )}

                {!isLoadingConv && messages.length === 0 && !isSending && (
                  <Welcome onSuggest={handleSuggest} />
                )}

                {messages.map((m) => (
                  <MessageBubble key={m.id} message={m} />
                ))}

                {isSending && <TypingIndicator />}

                <div ref={messagesEndRef} />
              </div>

              <InputBar onSend={sendMessage} disabled={isSending} />
            </>
          )}
        </div>
      )}
    </>
  );
}