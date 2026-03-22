import { useState, useEffect, useRef, useCallback } from "react";
import { adminSupportApi } from "../services/api";
import "./AdminSupport.css";

function fmtDate(d) {
  if (!d) return "";
  const diff = Date.now() - new Date(d);
  if (diff < 60000)    return "À l'instant";
  if (diff < 3600000)  return `Il y a ${Math.floor(diff/60000)} min`;
  if (diff < 86400000) return `Il y a ${Math.floor(diff/3600000)} h`;
  return new Date(d).toLocaleDateString("fr-FR", { day:"2-digit", month:"short" });
}
function fmtTime(d) {
  if (!d) return "";
  return new Date(d).toLocaleTimeString("fr-FR", { hour:"2-digit", minute:"2-digit" });
}

function Badge({ statut }) {
  if (statut === "EN_ATTENTE") return <span className="as-badge as-badge-wait"><span/>En attente</span>;
  if (statut === "ACCEPTEE")   return <span className="as-badge as-badge-active"><span/>En cours</span>;
  if (statut === "FERMEE")     return <span className="as-badge as-badge-closed"><span/>Fermée</span>;
  return null;
}

// ── Chat ──────────────────────────────────────────────────
function Chat({ conv, userId, onAccept, onClose, onSend, onRefresh }) {
  const [msg,     setMsg]     = useState("");
  const [sending, setSending] = useState(false);
  const [acting,  setActing]  = useState(false);
  const [confirm, setConfirm] = useState(false);
  const bottomRef = useRef();
  const inputRef  = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [conv?.messages?.length]);

  useEffect(() => {
    if (conv?.statut === "ACCEPTEE") {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [conv?.statut]);

  if (!conv) return null;

  const msgs    = [...(conv.messages || [])].sort((a,b) => new Date(a.created_at)-new Date(b.created_at));
  const isWait  = conv.statut === "EN_ATTENTE";
  const isOpen  = conv.statut === "ACCEPTEE";
  const isClosed= conv.statut === "FERMEE";

  const doAccept = async () => {
    setActing(true);
    try { await onAccept(conv.id); } catch(e){ console.error(e); } finally { setActing(false); }
  };

  const doClose = async () => {
    setActing(true);
    try { await onClose(conv.id); setConfirm(false); } catch(e){ console.error(e); } finally { setActing(false); }
  };

  const doSend = async () => {
    if (!msg.trim() || sending) return;
    setSending(true);
    try { await onSend(msg.trim()); setMsg(""); inputRef.current?.focus(); }
    catch(e){ console.error(e); }
    finally { setSending(false); }
  };

  const partNom = conv.partenaire
    ? `${conv.partenaire.prenom || ""} ${conv.partenaire.nom || ""}`.trim()
    : "Partenaire";
  const partInit = conv.partenaire
    ? `${(conv.partenaire.prenom||"?")[0]}${(conv.partenaire.nom||"")[0]||""}`.toUpperCase()
    : "P";

  return (
    <div className="as-chat">
      {/* Header */}
      <div className="as-chat-head">
        <div className="as-chat-av">{partInit}</div>
        <div className="as-chat-info">
          <strong>{partNom}</strong>
          <div className="as-chat-meta">
            <Badge statut={conv.statut}/>
            <span>· {conv.sujet}</span>
          </div>
        </div>
        <div className="as-chat-btns">
          <button className="as-icon-btn" onClick={onRefresh} title="Actualiser">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="1 4 1 10 7 10"/>
              <path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
            </svg>
          </button>
          {isWait && (
            <button className="as-btn-accept" onClick={doAccept} disabled={acting}>
              {acting ? <span className="as-spin"/> : "✓ Accepter & discuter"}
            </button>
          )}
          {isOpen && !confirm && (
            <button className="as-btn-close-c" onClick={() => setConfirm(true)}>✕ Fermer</button>
          )}
          {isOpen && confirm && (
            <div className="as-confirm">
              <span>Fermer définitivement ?</span>
              <button className="as-confirm-y" onClick={doClose} disabled={acting}>{acting?"...":"Oui"}</button>
              <button className="as-confirm-n" onClick={() => setConfirm(false)}>Non</button>
            </div>
          )}
        </div>
      </div>

      {/* Bannière attente */}
      {isWait && (
        <div className="as-accept-banner">
          <div className="as-accept-pulse"/>
          <div className="as-accept-text">
            <strong>Demande en attente — {partNom}</strong>
            <p>Acceptez pour commencer à discuter avec ce partenaire</p>
          </div>
          <button className="as-accept-big" onClick={doAccept} disabled={acting}>
            {acting ? <><span className="as-spin"/> Acceptation...</> : "✓ Accepter & discuter"}
          </button>
        </div>
      )}

      {/* Succès acceptation */}
      {isOpen && msgs.length === 0 && (
        <div className="as-ok-banner">
          ✅ <strong>Conversation acceptée !</strong> Envoyez votre premier message.
        </div>
      )}

      {/* Messages */}
      <div className="as-msgs">
        {msgs.length === 0 && !isWait && (
          <div className="as-msgs-empty">
            <p>Aucun message pour l'instant</p>
          </div>
        )}
        {msgs.map(m => {
          const isMe = m.id_expediteur === userId;
          const init = m.expediteur
            ? `${(m.expediteur.prenom||"?")[0]}${(m.expediteur.nom||"")[0]||""}`.toUpperCase()
            : "?";
          return (
            <div key={m.id} className={`as-msg ${isMe?"as-msg-me":"as-msg-other"}`}>
              {!isMe && <div className="as-msg-av">{init}</div>}
              <div className="as-msg-wrap">
                {!isMe && (
                  <span className="as-msg-name">
                    {m.expediteur?.prenom} {m.expediteur?.nom}
                    {m.expediteur?.role==="PARTENAIRE" && <em>Partenaire</em>}
                  </span>
                )}
                <div className={`as-bubble ${isMe?"as-bubble-me":"as-bubble-other"}`}>{m.contenu}</div>
                <span className="as-msg-time">{fmtTime(m.created_at)}</span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef}/>
      </div>

      {/* Composer */}
      {isOpen ? (
        <div className="as-composer">
          <textarea
            ref={inputRef}
            className="as-composer-ta"
            placeholder="Répondre... (Entrée pour envoyer, Maj+Entrée pour aller à la ligne)"
            value={msg}
            onChange={e => setMsg(e.target.value)}
            onKeyDown={e => { if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();doSend();} }}
            rows={1}
          />
          <button className={`as-composer-btn ${msg.trim()?"ready":""}`} onClick={doSend} disabled={!msg.trim()||sending}>
            {sending ? <span className="as-spin"/> : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/>
              </svg>
            )}
          </button>
        </div>
      ) : isWait ? (
        <div className="as-blocked">⏳ Acceptez d'abord la conversation pour écrire</div>
      ) : (
        <div className="as-blocked">🔒 Conversation fermée</div>
      )}
    </div>
  );
}

// ── Panel Acceptation ──────────────────────────────────────
function AcceptationPanel({ conv, onAccept, onRefresh, onSwitchToChat }) {
  const [acting, setActing] = useState(false);

  const doAccept = async () => {
    setActing(true);
    try {
      await onAccept(conv.id);
      onSwitchToChat(); // basculer vers discussion après acceptation
    } catch(e) { console.error(e); }
    finally { setActing(false); }
  };

  const isWait   = conv.statut === "EN_ATTENTE";
  const isActive = conv.statut === "ACCEPTEE";
  const isClosed = conv.statut === "FERMEE";
  const partNom  = conv.partenaire
    ? `${conv.partenaire.prenom||""} ${conv.partenaire.nom||""}`.trim()
    : "Partenaire";

  return (
    <div className="as-accept-panel">
      {/* Infos partenaire */}
      <div className="as-ap-card">
        <div className="as-ap-avatar">
          {conv.partenaire
            ? `${(conv.partenaire.prenom||"?")[0]}${(conv.partenaire.nom||"")[0]||""}`.toUpperCase()
            : "P"}
        </div>
        <div className="as-ap-info">
          <h3>{partNom}</h3>
          {conv.partenaire?.email && (
            <div className="as-ap-email">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              {conv.partenaire.email}
            </div>
          )}
          <div className="as-ap-meta">
            <Badge statut={conv.statut}/>
            <span>· Demande créée {fmtDate(conv.created_at)}</span>
          </div>
        </div>
        <button className="as-icon-btn" onClick={onRefresh} title="Actualiser">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
          </svg>
        </button>
      </div>

      {/* Sujet */}
      <div className="as-ap-sujet">
        <div className="as-ap-sujet-label">Sujet de la demande</div>
        <div className="as-ap-sujet-val">« {conv.sujet} »</div>
      </div>

      {/* Statut et action */}
      {isWait && (
        <div className="as-ap-action">
          <div className="as-ap-action-info">
            <div className="as-ap-pulse"/>
            <div>
              <strong>En attente de votre acceptation</strong>
              <p>Le partenaire {partNom} attend qu'un administrateur accepte cette conversation pour commencer à discuter.</p>
            </div>
          </div>
          <button className="as-ap-btn-accept" onClick={doAccept} disabled={acting}>
            {acting ? (
              <><span className="as-spin"/> Acceptation en cours...</>
            ) : (
              <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>Accepter cette demande &amp; ouvrir la discussion</>
            )}
          </button>
        </div>
      )}

      {isActive && (
        <div className="as-ap-accepted">
          <svg viewBox="0 0 24 24" fill="none" stroke="#27AE60" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10"/><polyline points="9 11 12 14 22 4"/>
          </svg>
          <div>
            <strong>Conversation acceptée par vous</strong>
            <p>Vous pouvez maintenant discuter avec ce partenaire dans l'onglet <em>Discussion</em>.</p>
            <button className="as-ap-btn-switch" onClick={onSwitchToChat}>
              Aller à la discussion →
            </button>
          </div>
        </div>
      )}

      {isClosed && (
        <div className="as-ap-closed">
          <svg viewBox="0 0 24 24" fill="none" stroke="#8A9BB0" strokeWidth="1.8">
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <div>
            <strong>Conversation fermée</strong>
            <p>Cette conversation a été fermée. L'historique des messages reste consultable dans l'onglet Discussion.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────
export default function AdminSupport({ currentUserId }) {
  const [convs,    setConvs]   = useState([]);
  const [active,   setActive]  = useState(null);
  const [loading,  setLoading] = useState(true);
  const [filtre,   setFiltre]  = useState("tous");
  const [search,   setSearch]  = useState("");
  const [chatTab,  setChatTab] = useState("acceptation"); // "acceptation" | "discussion"
  const [nbNotifs, setNbNotifs]= useState(0);

  const loadConvs = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const d = await adminSupportApi.listConversations();
      setConvs(d.items || []);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  const loadNotifs = useCallback(async () => {
    try {
      const d = await adminSupportApi.getNotifications();
      setNbNotifs((d.items||[]).filter(n=>!n.lue).length);
    } catch {}
  }, []);

  useEffect(() => { loadConvs(true); loadNotifs(); }, [loadConvs, loadNotifs]);

  // Poll silencieux 30s
  useEffect(() => {
    const t = setInterval(() => { loadConvs(false); loadNotifs(); }, 30000);
    return () => clearInterval(t);
  }, [loadConvs, loadNotifs]);

  const handleSelect = async (conv) => {
    setActive(conv); // affichage immédiat
    try {
      const d = await adminSupportApi.getConversation(conv.id);
      setActive(d);
    } catch(e) { console.error("select err:", e); }
  };

  const handleAccept = async (id) => {
    try {
      const d = await adminSupportApi.acceptConversation(id);
      setActive(d);
      setConvs(prev => prev.map(c => c.id===id ? d : c));
    } catch(e) { console.error("accept err:", e); }
  };

  const handleClose = async (id) => {
    try {
      const d = await adminSupportApi.closeConversation(id);
      setActive(d);
      setConvs(prev => prev.map(c => c.id===id ? d : c));
    } catch(e) { console.error("close err:", e); }
  };

  const handleSend = async (contenu) => {
    if (!active) return;
    try {
      const m = await adminSupportApi.sendMessage(active.id, contenu);
      setActive(prev => ({ ...prev, messages:[...(prev.messages||[]), m] }));
      loadConvs(false);
    } catch(e) { console.error("send err:", e); }
  };

  const handleRefresh = async () => {
    if (!active) return;
    try {
      const d = await adminSupportApi.getConversation(active.id);
      setActive(d);
    } catch {}
  };

  const filtered = convs.filter(c => {
    if (filtre==="attente") { if (c.statut!=="EN_ATTENTE") return false; }
    else if (filtre==="cours")   { if (c.statut!=="ACCEPTEE")   return false; }
    else if (filtre==="fermees") { if (c.statut!=="FERMEE")     return false; }
    if (search.trim()) {
      const q = search.toLowerCase();
      const nom   = `${c.partenaire?.prenom||""} ${c.partenaire?.nom||""}`.toLowerCase();
      const email = (c.partenaire?.email||"").toLowerCase();
      const sujet = (c.sujet||"").toLowerCase();
      if (!nom.includes(q) && !email.includes(q) && !sujet.includes(q)) return false;
    }
    return true;
  });

  const nbAttente = convs.filter(c=>c.statut==="EN_ATTENTE").length;
  const nbCours   = convs.filter(c=>c.statut==="ACCEPTEE").length;
  const nbFermees = convs.filter(c=>c.statut==="FERMEE").length;

  return (
    <div className="as-page">

      {/* Header */}
      <div className="as-header">
        <div>
          <h1 className="as-title">Support partenaires</h1>
          <p className="as-sub">
            {nbAttente > 0
              ? <span className="as-sub-warn">● {nbAttente} demande{nbAttente>1?"s":""} en attente d'acceptation</span>
              : `${convs.length} conversation${convs.length>1?"s":""}`
            }
          </p>
        </div>
        <div className="as-header-right">
          <button className="as-icon-btn as-notif-btn" onClick={() => loadConvs(false)} title="Actualiser">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="1 4 1 10 7 10"/>
              <path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="as-stats-row">
        {[
          { n:convs.length, l:"Total",      c:"blue",  i:"💬" },
          { n:nbAttente,    l:"En attente", c:"gold",  i:"⏳" },
          { n:nbCours,      l:"En cours",   c:"green", i:"✅" },
          { n:nbFermees,    l:"Fermées",    c:"gray",  i:"🔒" },
        ].map(s => (
          <div key={s.l} className={`as-stat-card as-stat-${s.c}`}>
            <span className="as-stat-i">{s.i}</span>
            <span className="as-stat-n">{s.n}</span>
            <span className="as-stat-l">{s.l}</span>
          </div>
        ))}
      </div>

      {/* Corps */}
      <div className="as-body">

        {/* Panel liste gauche */}
        <div className="as-panel-left">
          {/* Filtres statut */}
          <div className="as-tabs">
            {[
              ["tous",    "Tous",       convs.length],
              ["attente", "En attente", nbAttente],
              ["cours",   "En cours",   nbCours],
              ["fermees", "Fermées",    nbFermees],
            ].map(([k,l,n]) => (
              <button key={k} className={`as-tab ${filtre===k?"on":""}`} onClick={()=>setFiltre(k)}>
                {l}{n>0&&<span>{n}</span>}
              </button>
            ))}
          </div>

          {/* Barre de recherche */}
          <div className="as-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher par nom, email..."
              className="as-search-input"
            />
            {search && (
              <button className="as-search-clear" onClick={() => setSearch("")}>✕</button>
            )}
          </div>
          {search && (
            <div className="as-search-info">
              {filtered.length} résultat{filtered.length>1?"s":""} pour « {search} »
            </div>
          )}

          <div className="as-list">
            {loading ? (
              <div className="as-list-loading"><div className="as-spin as-spin-dark"/></div>
            ) : filtered.length === 0 ? (
              <div className="as-list-empty">
                {search ? `Aucun résultat pour « ${search} »` : "Aucune conversation"}
              </div>
            ) : (
              filtered.map(c => {
                const init = c.partenaire
                  ? `${(c.partenaire.prenom||"?")[0]}${(c.partenaire.nom||"")[0]||""}`.toUpperCase()
                  : "P";
                const nom = c.partenaire
                  ? `${c.partenaire.prenom||""} ${c.partenaire.nom||""}`.trim()
                  : "Partenaire";
                const email = c.partenaire?.email || "";
                const last = c.messages?.[c.messages.length-1]?.contenu || c.sujet;
                return (
                  <button key={c.id}
                    className={`as-item ${active?.id===c.id?"as-item-on":""} ${c.statut==="EN_ATTENTE"?"as-item-new":""}`}
                    onClick={() => { handleSelect(c); setChatTab(c.statut==="EN_ATTENTE"?"acceptation":"discussion"); }}>
                    {c.statut==="EN_ATTENTE" && <div className="as-item-dot"/>}
                    <div className="as-item-av">{init}</div>
                    <div className="as-item-info">
                      <div className="as-item-top">
                        <span className="as-item-nom">{nom}</span>
                        <span className="as-item-time">{fmtDate(c.updated_at)}</span>
                      </div>
                      {email && <span className="as-item-email">{email}</span>}
                      <div className="as-item-mid"><Badge statut={c.statut}/></div>
                      <p className="as-item-prev">{last?.slice(0,50)}{last?.length>50?"…":""}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Panel chat droit */}
        <div className="as-panel-right">
          {active ? (
            <>
              {/* Onglets Acceptation / Discussion */}
              <div className="as-chat-tabs">
                <button
                  className={`as-chat-tab ${chatTab==="acceptation"?"on":""}`}
                  onClick={() => setChatTab("acceptation")}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 11 12 14 22 4"/>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                  </svg>
                  Acceptation
                  {active.statut==="EN_ATTENTE" && <span className="as-chat-tab-dot"/>}
                </button>
                <button
                  className={`as-chat-tab ${chatTab==="discussion"?"on":""}`}
                  onClick={() => setChatTab("discussion")}
                  disabled={active.statut==="EN_ATTENTE"}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  Discussion
                  {active.messages?.length > 0 && <span className="as-chat-tab-count">{active.messages.length}</span>}
                </button>
              </div>

              {chatTab === "acceptation" ? (
                <AcceptationPanel
                  conv={active}
                  onAccept={handleAccept}
                  onRefresh={handleRefresh}
                  onSwitchToChat={() => setChatTab("discussion")}
                />
              ) : (
                <Chat
                  conv={active}
                  userId={currentUserId}
                  onAccept={handleAccept}
                  onClose={handleClose}
                  onSend={handleSend}
                  onRefresh={handleRefresh}
                />
              )}
            </>
          ) : (
            <div className="as-empty-chat">
              <div className="as-empty-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <h3>{nbAttente>0 ? `${nbAttente} demande${nbAttente>1?"s":""} en attente` : "Aucune conversation sélectionnée"}</h3>
              <p>Cliquez sur une conversation dans la liste pour l'ouvrir</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}