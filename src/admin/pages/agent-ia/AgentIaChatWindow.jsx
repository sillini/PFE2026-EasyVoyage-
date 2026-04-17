// ══════════════════════════════════════════════════════════
//  src/admin/pages/agent-ia/AgentIaChatWindow.jsx
//  Zone principale du chat (messages + composer)
// ══════════════════════════════════════════════════════════
import { useState, useRef, useEffect } from "react";

/* ── Helpers dates ── */
function formatTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86400000;
  const ts = d.getTime();
  const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

  const hm = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  if (dayStart === today) return `Aujourd'hui · ${hm}`;
  if (dayStart === yesterday) return `Hier · ${hm}`;
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
  }) + " · " + hm;
}

/* ── Formatage markdown léger : gras + liens + retours ligne ── */
function renderContent(text) {
  if (!text) return null;

  // Regex qui capture [texte](url) OU les URLs brutes http(s)://...
  // Groupe 1 = label markdown, Groupe 2 = url markdown, Groupe 3 = url brute
  const regex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s)]+)/g;

  const lines = text.split("\n");
  return lines.map((line, li) => {
    const parts = [];
    let last = 0;
    let match;
    let key = 0;

    // Reset lastIndex car le regex est global
    regex.lastIndex = 0;

    while ((match = regex.exec(line)) !== null) {
      // Texte avant le lien
      if (match.index > last) {
        const before = line.slice(last, match.index);
        parts.push(renderBold(before, `t-${li}-${key++}`));
      }
      const label = match[1] || match[3];
      const url   = match[2] || match[3];
      parts.push(
        <a
          key={`l-${li}-${key++}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="aia-link"
        >
          {label}
        </a>
      );
      last = match.index + match[0].length;
    }

    if (last < line.length) {
      parts.push(renderBold(line.slice(last), `t-${li}-${key++}`));
    }

    return (
      <span key={li}>
        {parts}
        {li < lines.length - 1 && <br />}
      </span>
    );
  });
}

/* Sous-fonction : rend le gras **texte** dans un segment */
function renderBold(text, baseKey) {
  const segs = text.split(/(\*\*[^*]+\*\*)/g);
  return segs.map((s, i) => {
    if (s.startsWith("**") && s.endsWith("**")) {
      return <strong key={`${baseKey}-${i}`}>{s.slice(2, -2)}</strong>;
    }
    return <span key={`${baseKey}-${i}`}>{s}</span>;
  });
}

/* ── Suggestions d'accueil (cartes de démarrage) ── */
const STARTER_PROMPTS = [
  {
    icon: "📊",
    title: "Tableau de bord",
    text: "Donne-moi un résumé du chiffre d'affaires du mois",
  },
  {
    icon: "🏨",
    title: "Hôtels",
    text: "Quels sont les 5 hôtels les mieux notés ?",
  },
  {
    icon: "💰",
    title: "Finances",
    text: "Quelles sont les commissions à facturer aux partenaires ce mois ?",
  },
  {
    icon: "📅",
    title: "Réservations",
    text: "Combien de réservations avons-nous eu cette semaine ?",
  },
];

export default function AgentIaChatWindow({
  messages,
  activeConvId,
  loadingConv,
  sending,
  streamingText,
  onSend,
  onAbort,
}) {
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  // Auto-grow du textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }, [input]);

  const handleSubmit = () => {
    if (!input.trim() || sending) return;
    onSend(input);
    setInput("");
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handlePromptClick = (text) => {
    setInput(text);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const isEmpty =
    !activeConvId && messages.length === 1 && messages[0].id === "welcome";

  return (
    <section className="aia-chat">
      {/* Header — sans badge "Connecté" */}
      <div className="aia-chat-header">
        <div className="aia-chat-header-left">
          <div className="aia-chat-avatar">🤖</div>
          <div>
            <h2>Agent IA</h2>
            <span className="aia-chat-subtitle">Assistant intelligent d'administration</span>
          </div>
        </div>
      </div>

      {/* Zone messages */}
      <div className="aia-chat-messages">
        {loadingConv && (
          <div className="aia-chat-loader">
            <div className="aia-spin-lg" />
            <span>Chargement de la conversation…</span>
          </div>
        )}

        {!loadingConv && isEmpty && (
          <div className="aia-chat-welcome">
            <div className="aia-chat-welcome-icon">✨</div>
            <h3>Comment puis-je vous aider aujourd'hui ?</h3>
            <p>
              Posez une question sur votre plateforme — hôtels, réservations,
              finances, clients, partenaires…
            </p>
            <div className="aia-chat-prompts">
              {STARTER_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  className="aia-chat-prompt-card"
                  onClick={() => handlePromptClick(p.text)}
                >
                  <span className="aia-chat-prompt-icon">{p.icon}</span>
                  <div>
                    <div className="aia-chat-prompt-title">{p.title}</div>
                    <div className="aia-chat-prompt-text">{p.text}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {!loadingConv && !isEmpty && (
          <>
            {messages.map((m) => (
              <div
                key={m.id}
                className={`aia-msg-wrap aia-msg-wrap-${m.role}`}
              >
                <div
                  className={`aia-msg aia-msg-${m.role} ${
                    m.is_error ? "aia-msg-error" : ""
                  }`}
                >
                  {m.role === "assistant" && (
                    <div className="aia-msg-avatar">🤖</div>
                  )}
                  <div className="aia-msg-bubble">
                    <div className="aia-msg-content">
                      {renderContent(m.contenu)}
                    </div>
                  </div>
                  {m.role === "user" && (
                    <div className="aia-msg-avatar aia-msg-avatar-user">👤</div>
                  )}
                </div>

                {/* Timestamp sous le message */}
                {m.id !== "welcome" && (
                  <div className={`aia-msg-time aia-msg-time-${m.role}`}>
                    {formatTime(m.created_at)}
                    {m.role === "assistant" && m.duree_ms > 0 && !m.is_error && (
                      <span className="aia-msg-duree"> · {(m.duree_ms / 1000).toFixed(1)}s</span>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Streaming en cours */}
            {streamingText && (
              <div className="aia-msg-wrap aia-msg-wrap-assistant">
                <div className="aia-msg aia-msg-assistant">
                  <div className="aia-msg-avatar">🤖</div>
                  <div className="aia-msg-bubble">
                    <div className="aia-msg-content">
                      {renderContent(streamingText)}
                      <span className="aia-cursor">▊</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Indicateur typing avant le premier token */}
            {sending && !streamingText && (
              <div className="aia-msg-wrap aia-msg-wrap-assistant">
                <div className="aia-msg aia-msg-assistant">
                  <div className="aia-msg-avatar">🤖</div>
                  <div className="aia-msg-bubble aia-typing">
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="aia-chat-composer">
        <div className="aia-chat-composer-inner">
          <textarea
            ref={textareaRef}
            className="aia-chat-textarea"
            rows={1}
            placeholder="Posez une question à l'Agent IA… (Entrée pour envoyer · Shift+Entrée pour sauter une ligne)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={sending || loadingConv}
          />

          {sending ? (
            <button
              className="aia-chat-send aia-chat-abort"
              onClick={onAbort}
              title="Arrêter la génération"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </button>
          ) : (
            <button
              className="aia-chat-send"
              onClick={handleSubmit}
              disabled={!input.trim() || loadingConv}
              title="Envoyer"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          )}
        </div>
        <div className="aia-chat-footer-hint">
          L'Agent IA peut produire des informations incorrectes. Vérifiez les données sensibles.
        </div>
      </div>
    </section>
  );
}