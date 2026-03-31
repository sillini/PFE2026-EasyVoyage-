import { useState, useEffect, useRef, useCallback } from "react";
import { supportApi } from "../services/api";
import "./PartenaireSupportPage.css";

/* ── Helpers ───────────────────────────────────────────── */
function fmtDate(d) {
  if (!d) return "";
  const date = new Date(d);
  const diff  = new Date() - date;
  if (diff < 60000)    return "À l'instant";
  if (diff < 3600000)  return `Il y a ${Math.floor(diff/60000)} min`;
  if (diff < 86400000) return `Il y a ${Math.floor(diff/3600000)} h`;
  return date.toLocaleDateString("fr-FR", { day:"2-digit", month:"short", year:"numeric" });
}
function fmtTime(d) {
  if (!d) return "";
  return new Date(d).toLocaleTimeString("fr-FR", { hour:"2-digit", minute:"2-digit" });
}

/* ── Status Badge ──────────────────────────────────────── */
function StatusBadge({ statut }) {
  const map = {
    EN_ATTENTE: { label:"En attente", cls:"waiting" },
    ACCEPTEE:   { label:"En cours",   cls:"active"  },
    FERMEE:     { label:"Fermée",     cls:"closed"  },
  };
  const { label, cls } = map[statut] || { label:statut, cls:"waiting" };
  return (
    <span className={`sp-badge sp-badge-${cls}`}>
      <span className="sp-badge-dot" />
      {label}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════
   MODAL NOUVELLE CONVERSATION
══════════════════════════════════════════════════════════ */
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
    <div className="sp-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sp-modal">
        <div className="sp-modal-ridge" />
        <div className="sp-modal-head">
          <div className="sp-modal-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div>
            <h2>Nouvelle demande de support</h2>
            <p>Un administrateur sera notifié et vous répondra rapidement</p>
          </div>
          <button className="sp-modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="sp-modal-form">
          <div className="sp-mfield">
            <label>Sujet de la demande <span className="sp-req">*</span></label>
            <input
              value={sujet} onChange={e => setSujet(e.target.value)}
              placeholder="Ex : Problème avec ma fiche hôtel, Demande de modification…"
              className="sp-minput" autoFocus
            />
            <span className="sp-mhint">Soyez précis pour recevoir une aide adaptée</span>
          </div>
          {error && (
            <div className="sp-merror">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}
          <div className="sp-modal-foot">
            <button type="button" className="sp-btn-ghost" onClick={onClose}>Annuler</button>
            <button type="submit" className="sp-btn-primary" disabled={loading}>
              {loading ? <span className="sp-spin"/> : (
                <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
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

/* ══════════════════════════════════════════════════════════
   LISTE CONVERSATIONS
══════════════════════════════════════════════════════════ */
function ConvList({ conversations, activeId, onSelect }) {
  if (conversations.length === 0) {
    return (
      <div className="sp-list-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8" width="52" height="52">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <p>Aucune conversation</p>
        <span>Créez votre première demande de support</span>
      </div>
    );
  }

  return (
    <div className="sp-conv-list">
      {conversations.map(c => (
        <button key={c.id}
          className={`sp-conv-item ${c.id === activeId ? "active" : ""} ${c.nb_non_lus > 0 ? "unread" : ""}`}
          onClick={() => onSelect(c)}>
          {c.nb_non_lus > 0 && <span className="sp-conv-dot" />}
          <div className="sp-conv-top">
            <span className="sp-conv-sujet">{c.sujet}</span>
            {c.nb_non_lus > 0 && (
              <span className="sp-unread-badge">{c.nb_non_lus}</span>
            )}
          </div>
          <div className="sp-conv-mid">
            <StatusBadge statut={c.statut}/>
            {c.admin && (
              <span className="sp-conv-admin">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="10" height="10">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                {c.admin.prenom} {c.admin.nom}
              </span>
            )}
          </div>
          {c.messages?.length > 0 && (
            <p className="sp-conv-preview">
              {c.messages[c.messages.length-1]?.contenu?.slice(0,55)}
              {c.messages[c.messages.length-1]?.contenu?.length > 55 ? "…" : ""}
            </p>
          )}
          <span className="sp-conv-date">{fmtDate(c.updated_at)}</span>
        </button>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   CHAT VIEW
══════════════════════════════════════════════════════════ */
function ChatView({ conversation, currentUserId, onSend, onClose, onRefresh }) {
  const [texte,        setTexte]        = useState("");
  const [sending,      setSending]      = useState(false);
  const [closing,      setClosing]      = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const bottomRef = useRef(null);
  const textaRef  = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [conversation.messages]);

  const handleSend = async () => {
    if (!texte.trim() || sending) return;
    setSending(true);
    try { await onSend(texte.trim()); setTexte(""); textaRef.current?.focus(); }
    finally { setSending(false); }
  };
  const handleKeyDown = (e) => { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } };
  const handleClose   = async () => {
    setClosing(true);
    try { await onClose(conversation.id); setConfirmClose(false); }
    finally { setClosing(false); }
  };

  const isFermee  = conversation.statut === "FERMEE";
  const isAttente = conversation.statut === "EN_ATTENTE";
  const msgs = [...(conversation.messages||[])].sort((a,b) => new Date(a.created_at)-new Date(b.created_at));

  const grouped = [];
  let lastDay = "";
  msgs.forEach(m => {
    const day = new Date(m.created_at).toLocaleDateString("fr-FR", { day:"2-digit", month:"long", year:"numeric" });
    if (day !== lastDay) { grouped.push({ type:"day", label:day }); lastDay = day; }
    grouped.push({ type:"msg", data:m });
  });

  return (
    <div className="sp-chat">
      {/* Header */}
      <div className="sp-chat-head">
        <div className="sp-chat-info">
          <div className={`sp-chat-av ${conversation.admin ? "has-admin" : "no-admin"}`}>
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
                : <span className="sp-chat-waiting">En attente d'un administrateur…</span>
              }
            </div>
          </div>
        </div>
        <div className="sp-chat-btns">
          <button className="sp-icon-btn" onClick={onRefresh} title="Actualiser">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
            </svg>
          </button>
          {!isFermee && !confirmClose && (
            <button className="sp-btn-close-conv" onClick={() => setConfirmClose(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Fermer
            </button>
          )}
          {!isFermee && confirmClose && (
            <div className="sp-confirm-row">
              <span>Fermer définitivement ?</span>
              <button className="sp-confirm-yes" onClick={handleClose} disabled={closing}>{closing?"…":"Oui"}</button>
              <button className="sp-confirm-no" onClick={() => setConfirmClose(false)}>Non</button>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="sp-msgs">
        {isAttente && (
          <div className="sp-wait-banner">
            <div className="sp-wait-pulse"/>
            <div>
              <strong>Demande envoyée — En attente d'un administrateur</strong>
              <p>Un membre de notre équipe va accepter votre conversation et vous répondre très prochainement.</p>
            </div>
          </div>
        )}

        {grouped.length === 0 ? (
          <div className="sp-no-msgs">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8" width="52" height="52">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <p>Aucun message pour l'instant</p>
            {!isAttente && <span>Envoyez votre premier message</span>}
          </div>
        ) : grouped.map((item, i) => {
          if (item.type === "day") {
            return (
              <div key={`day-${i}`} className="sp-day-sep">
                <span>{item.label}</span>
              </div>
            );
          }
          const m = item.data;
          const isMe    = m.id_expediteur === currentUserId;
          const isAdmin = m.expediteur?.role === "ADMIN";
          return (
            <div key={m.id} className={`sp-msg ${isMe ? "me" : "other"}`}>
              {!isMe && (
                <div className={`sp-msg-av ${isAdmin ? "admin" : ""}`}>
                  {m.expediteur ? `${m.expediteur.prenom?.[0]||""}${m.expediteur.nom?.[0]||""}` : "?"}
                </div>
              )}
              <div className="sp-msg-wrap">
                {!isMe && (
                  <span className="sp-msg-sender">
                    {m.expediteur?.prenom} {m.expediteur?.nom}
                    {isAdmin && <span className="sp-admin-tag">Admin</span>}
                  </span>
                )}
                <div className={`sp-bubble ${isMe?"bubble-me":isAdmin?"bubble-admin":"bubble-other"}`}>
                  {m.contenu}
                </div>
                <span className="sp-msg-time">{fmtTime(m.created_at)}</span>
              </div>
              {isMe && <div style={{width:32,flexShrink:0}}/>}
            </div>
          );
        })}
        <div ref={bottomRef}/>
      </div>

      {/* Composer */}
      {!isFermee ? (
        isAttente ? (
          <div className="sp-blocked">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            En attente d'acceptation — vous pourrez envoyer des messages ensuite
          </div>
        ) : (
          <div className="sp-composer">
            <textarea ref={textaRef} className="sp-composer-ta"
              placeholder="Tapez votre message… (Entrée pour envoyer, Maj+Entrée pour aller à la ligne)"
              value={texte} onChange={e => setTexte(e.target.value)}
              onKeyDown={handleKeyDown} rows={1}
            />
            <button className={`sp-send-btn ${texte.trim()?"ready":""}`}
              onClick={handleSend} disabled={!texte.trim()||sending}>
              {sending ? <span className="sp-spin"/> : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                  <path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/>
                </svg>
              )}
            </button>
          </div>
        )
      ) : (
        <div className="sp-closed-bar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          Cette conversation est fermée
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE PRINCIPALE
══════════════════════════════════════════════════════════ */
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
      setConversations(prev => prev.map(c => c.id===d.id ? d : c));
    } catch {}
  };

  const handleSelect = async (conv) => {
    try {
      const d = await supportApi.getConversation(conv.id);
      setActiveConv(d);
      setConversations(prev => prev.map(c => c.id===d.id ? d : c));
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
    setActiveConv(prev => ({ ...prev, messages:[...(prev.messages||[]), msg] }));
    load();
  };
  const handleClose = async (id) => {
    const d = await supportApi.closeConversation(id);
    setActiveConv(d);
    setConversations(prev => prev.map(c => c.id===id ? d : c));
  };

  const filtered = conversations.filter(c => {
    if (filterStatut === "en_attente") return c.statut === "EN_ATTENTE";
    if (filterStatut === "actives")    return c.statut === "ACCEPTEE";
    if (filterStatut === "fermees")    return c.statut === "FERMEE";
    return true;
  });

  const nbEnAttente = conversations.filter(c => c.statut==="EN_ATTENTE").length;
  const nbActives   = conversations.filter(c => c.statut==="ACCEPTEE").length;
  const nbFermees   = conversations.filter(c => c.statut==="FERMEE").length;
  const nbNonLus    = conversations.reduce((acc,c) => acc + (c.nb_non_lus||0), 0);

  return (
    <div className="sp-page">

      {/* ── Header ──────────────────────────────────────── */}
      <header className="sp-page-header">
        <div className="sp-title-block">
          <div className="sp-eyebrow">
            <span className="sp-eyebrow-dot" />
            Assistance & échanges
          </div>
          <h1 className="sp-page-title">Support</h1>
          <p className="sp-page-desc">
            {nbActives > 0
              ? `${nbActives} conversation${nbActives>1?"s":""} en cours`
              : "Contactez notre équipe d'administration"
            }
            {nbNonLus > 0 && (
              <span className="sp-desc-unread">
                <span className="sp-desc-dot"/>
                {nbNonLus} non lu{nbNonLus>1?"s":""}
              </span>
            )}
          </p>
        </div>
        <button className="sp-btn-new" onClick={() => setShowNewModal(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="15" height="15">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="10" y1="11" x2="14" y2="11"/>
          </svg>
          Nouvelle demande
        </button>
      </header>

      {/* ── KPI Cards ───────────────────────────────────── */}
      <div className="sp-kpi-grid">
        {[
          { color:"blue",  val:conversations.length, lbl:"Total",      sub:"conversations",
            icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
          { color:"amber", val:nbEnAttente,           lbl:"En attente", sub:"à traiter",
            icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
          { color:"green", val:nbActives,             lbl:"En cours",   sub:"actives",
            icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
          { color:"slate", val:nbFermees,             lbl:"Fermées",    sub:"archivées",
            icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> },
        ].map((k,i) => (
          <div key={i} className={`sp-kpi-card sp-kpi-${k.color}`}>
            <div className="sp-kpi-icon">{k.icon}</div>
            <div className="sp-kpi-body">
              <span className="sp-kpi-val">{k.val}</span>
              <span className="sp-kpi-lbl">{k.lbl}</span>
              <span className="sp-kpi-sub">{k.sub}</span>
            </div>
            <div className="sp-kpi-deco" />
          </div>
        ))}
      </div>

      {/* ── Corps ───────────────────────────────────────── */}
      <div className="sp-body">

        {/* Panel gauche */}
        <div className="sp-panel-left">
          <div className="sp-filter-tabs">
            {[
              ["tous",       "Tous",       conversations.length],
              ["en_attente", "En attente", nbEnAttente],
              ["actives",    "En cours",   nbActives],
              ["fermees",    "Fermées",    nbFermees],
            ].map(([val, lbl, nb]) => (
              <button key={val}
                className={`sp-ftab ${filterStatut===val?"active":""}`}
                onClick={() => setFilter(val)}>
                {val==="en_attente" && <span className="sp-ftab-dot sp-ftd-amber" />}
                {val==="actives"    && <span className="sp-ftab-dot sp-ftd-green" />}
                {lbl}
                <span className="sp-ftab-count">{nb}</span>
              </button>
            ))}
          </div>

          <div className="sp-list-body">
            {loading ? (
              <div className="sp-list-state">
                <div className="sp-loader"><div className="sp-ring"/><div className="sp-ring sp-ring2"/></div>
              </div>
            ) : error ? (
              <div className="sp-list-err">
                <p>{error}</p>
                <button onClick={load}>Réessayer</button>
              </div>
            ) : (
              <ConvList conversations={filtered} activeId={activeConv?.id} onSelect={handleSelect}/>
            )}
          </div>
        </div>

        {/* Panel droit */}
        <div className="sp-panel-right">
          {activeConv ? (
            <ChatView
              conversation={activeConv} currentUserId={currentUserId}
              onSend={handleSend} onClose={handleClose} onRefresh={refreshActive}
            />
          ) : (
            <div className="sp-empty-panel">
              <div className="sp-empty-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.7">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <h3>Sélectionnez une conversation</h3>
              <p>Choisissez une conversation dans la liste ou créez une nouvelle demande</p>
              <button className="sp-btn-new" onClick={() => setShowNewModal(true)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="14" height="14">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="10" y1="11" x2="14" y2="11"/>
                </svg>
                Créer une demande
              </button>
            </div>
          )}
        </div>
      </div>

      {showNewModal && (
        <NewConvModal onClose={() => setShowNewModal(false)} onCreate={handleCreate}/>
      )}
    </div>
  );
}