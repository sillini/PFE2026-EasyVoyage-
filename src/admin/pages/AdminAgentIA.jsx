import { useState, useRef, useEffect } from "react";
import "./AdminAgentIA.css";

const API = "http://localhost:8000/api/v1";

function authHeaders() {
  const t = localStorage.getItem("access_token");
  return { "Content-Type": "application/json", ...(t ? { Authorization: "Bearer " + t } : {}) };
}

// ID de session unique par onglet
const SESSION_ID = "admin-" + Math.random().toString(36).slice(2);

export default function AdminAgentIA() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Bonjour 👋 Je suis votre assistant IA EasyVoyage. Comment puis-je vous aider aujourd'hui ?",
    },
  ]);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setMessages(prev => [...prev, { role: "user", text }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API}/admin/agent-ia/chat`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ message: text, session_id: SESSION_ID }),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", text: data.reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", text: "❌ Erreur : " + e.message, error: true }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div className="aia-root">
      {/* Header */}
      <div className="aia-header">
        <div className="aia-header-left">
          <div className="aia-avatar-icon">🤖</div>
          <div>
            <h2>Agent IA</h2>
            <span className="aia-badge"><span className="aia-dot"/>Connecté · n8n + Ollama</span>
          </div>
        </div>
        <button className="aia-clear-btn" onClick={() => setMessages([{
          role: "assistant",
          text: "Conversation réinitialisée. Comment puis-je vous aider ?",
        }])}>
          🗑 Effacer
        </button>
      </div>

      {/* Zone messages */}
      <div className="aia-messages">
        {messages.map((m, i) => (
          <div key={i} className={`aia-msg aia-msg-${m.role} ${m.error ? "aia-msg-error" : ""}`}>
            {m.role === "assistant" && <div className="aia-msg-avatar">🤖</div>}
            <div className="aia-msg-bubble">
              {m.text.split("\n").map((line, j) => (
                <span key={j}>{line}{j < m.text.split("\n").length - 1 && <br />}</span>
              ))}
            </div>
            {m.role === "user" && <div className="aia-msg-avatar aia-msg-avatar-user">👤</div>}
          </div>
        ))}

        {loading && (
          <div className="aia-msg aia-msg-assistant">
            <div className="aia-msg-avatar">🤖</div>
            <div className="aia-msg-bubble aia-typing">
              <span/><span/><span/>
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Zone saisie */}
      <div className="aia-input-zone">
        <textarea
          className="aia-textarea"
          rows={1}
          placeholder="Posez une question à l'agent IA… (Entrée pour envoyer)"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          disabled={loading}
        />
        <button className="aia-send-btn" onClick={sendMessage} disabled={loading || !input.trim()}>
          {loading
            ? <span className="aia-spin"/>
            : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
          }
        </button>
      </div>
    </div>
  );
}