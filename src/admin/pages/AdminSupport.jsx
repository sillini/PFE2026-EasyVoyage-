import { useState, useEffect, useRef, useCallback } from "react";
import { adminSupportApi, partenairesApi } from "../services/api";
import "./AdminSupport.css";

/* ── helpers ───────────────────────────────────────────── */
function fmtDate(d) {
  if (!d) return "";
  const diff = Date.now() - new Date(d);
  if (diff < 60000)    return "À l'instant";
  if (diff < 3600000)  return `${Math.floor(diff/60000)} min`;
  if (diff < 86400000) return `${Math.floor(diff/3600000)} h`;
  return new Date(d).toLocaleDateString("fr-FR", { day:"2-digit", month:"short" });
}
function fmtTime(d) {
  if (!d) return "";
  return new Date(d).toLocaleTimeString("fr-FR", { hour:"2-digit", minute:"2-digit" });
}

/* ── Badge statut ──────────────────────────────────────── */
function Badge({ statut }) {
  const MAP = {
    EN_ATTENTE: { label: "En attente", cls: "as-badge-wait"   },
    ACCEPTEE:   { label: "En cours",   cls: "as-badge-active" },
    FERMEE:     { label: "Fermée",     cls: "as-badge-closed" },
  };
  const { label, cls } = MAP[statut] || { label: statut, cls: "" };
  return (
    <span className={`as-badge ${cls}`}>
      <span className="as-badge-dot" />
      {label}
    </span>
  );
}

/* ── Avatar ────────────────────────────────────────────── */
function SupportAvatar({ prenom, nom, size = "md" }) {
  const init = `${(prenom||"?")[0]}${(nom||"")[0]||""}`.toUpperCase();
  return <div className={`as-av as-av-${size}`}>{init}</div>;
}

/* ══════════════════════════════════════════════════════════
   MODAL — Nouvelle conversation
══════════════════════════════════════════════════════════ */
function NouvelleConvModal({ onClose, onCreate }) {
  const [partenaires,    setPartenaires]    = useState([]);
  const [loadingPart,    setLoadingPart]    = useState(true);
  const [selectedPart,   setSelectedPart]   = useState(null);
  const [sujet,          setSujet]          = useState("");
  const [premierMessage, setPremierMessage] = useState("");
  const [searchPart,     setSearchPart]     = useState("");
  const [creating,       setCreating]       = useState(false);
  const [error,          setError]          = useState("");

  useEffect(() => {
    partenairesApi.list({ per_page: 100, actif: "true" })
      .then(d => setPartenaires(d.items || []))
      .catch(() => setPartenaires([]))
      .finally(() => setLoadingPart(false));
  }, []);

  const filtered = partenaires.filter(p => {
    const q = searchPart.toLowerCase();
    return `${p.prenom} ${p.nom}`.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      (p.nom_entreprise || "").toLowerCase().includes(q);
  });

  const handleCreate = async () => {
    if (!selectedPart) { setError("Veuillez sélectionner un partenaire."); return; }
    if (!sujet.trim())  { setError("Le sujet est obligatoire."); return; }
    setCreating(true); setError("");
    try {
      const conv = await adminSupportApi.createConversation({
        id_partenaire: selectedPart.id,
        sujet: sujet.trim(),
        premier_message: premierMessage.trim() || null,
      });
      onCreate(conv); onClose();
    } catch(e) { setError(e.message || "Erreur lors de la création."); }
    finally { setCreating(false); }
  };

  return (
    <div className="as-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="as-modal">
        <div className="as-modal-ridge" />
        <div className="as-modal-head">
          <div className="as-modal-head-info">
            <h2>Nouvelle conversation</h2>
            <p>Initiez une discussion avec un partenaire</p>
          </div>
          <button className="as-modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="as-modal-body">
          {/* Partenaire */}
          <div className="as-mfield">
            <label>Partenaire <span className="as-required">*</span></label>
            {selectedPart ? (
              <div className="as-selected-part">
                <SupportAvatar prenom={selectedPart.prenom} nom={selectedPart.nom} size="sm" />
                <div className="as-sp-info">
                  <strong>{selectedPart.prenom} {selectedPart.nom}</strong>
                  <span>{selectedPart.email}</span>
                  {selectedPart.nom_entreprise && <em>{selectedPart.nom_entreprise}</em>}
                </div>
                <button className="as-sp-change" onClick={() => setSelectedPart(null)}>Changer</button>
              </div>
            ) : (
              <>
                <div className="as-modal-search">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <input placeholder="Rechercher un partenaire…" value={searchPart}
                    onChange={e => setSearchPart(e.target.value)} autoFocus />
                </div>
                <div className="as-part-list">
                  {loadingPart ? (
                    <div className="as-part-state"><div className="as-spin as-spin-dark" /></div>
                  ) : filtered.length === 0 ? (
                    <div className="as-part-state">Aucun partenaire trouvé</div>
                  ) : filtered.map(p => (
                    <button key={p.id} className="as-part-row" onClick={() => setSelectedPart(p)}>
                      <SupportAvatar prenom={p.prenom} nom={p.nom} size="xs" />
                      <div className="as-sp-info">
                        <strong>{p.prenom} {p.nom}</strong>
                        <span>{p.email}</span>
                        {p.nom_entreprise && <em>{p.nom_entreprise}</em>}
                      </div>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13" className="as-part-arrow">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Sujet */}
          <div className="as-mfield">
            <label>Sujet <span className="as-required">*</span></label>
            <input className="as-minput" placeholder="Ex: Vérification des disponibilités…"
              value={sujet} onChange={e => setSujet(e.target.value)} maxLength={300} />
          </div>

          {/* Message */}
          <div className="as-mfield">
            <label>Message d'introduction <span className="as-optional">(optionnel)</span></label>
            <textarea className="as-mta" placeholder="Rédigez votre message d'introduction…"
              value={premierMessage} onChange={e => setPremierMessage(e.target.value)} rows={4} maxLength={5000} />
            <p className="as-mhint">💡 Si laissé vide, la conversation sera créée sans message initial.</p>
          </div>

          {error && (
            <div className="as-merror">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              {error}
            </div>
          )}
        </div>

        <div className="as-modal-foot">
          <button className="as-btn-ghost" onClick={onClose}>Annuler</button>
          <button className="as-btn-primary" onClick={handleCreate}
            disabled={creating || !selectedPart || !sujet.trim()}>
            {creating
              ? <><span className="as-spin" /> Création…</>
              : <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14"><path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/></svg>Lancer la conversation</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   CHAT
══════════════════════════════════════════════════════════ */
function Chat({ conv, userId, onAccept, onClose, onSend, onRefresh }) {
  const [msg,     setMsg]     = useState("");
  const [sending, setSending] = useState(false);
  const [acting,  setActing]  = useState(false);
  const [confirm, setConfirm] = useState(false);
  const bottomRef = useRef();
  const inputRef  = useRef();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [conv?.messages?.length]);
  useEffect(() => { if (conv?.statut === "ACCEPTEE") setTimeout(() => inputRef.current?.focus(), 200); }, [conv?.statut]);

  if (!conv) return null;

  const msgs   = [...(conv.messages || [])].sort((a,b) => new Date(a.created_at)-new Date(b.created_at));
  const isWait = conv.statut === "EN_ATTENTE";
  const isOpen = conv.statut === "ACCEPTEE";

  const doAccept = async () => { setActing(true); try { await onAccept(conv.id); } finally { setActing(false); } };
  const doClose  = async () => { setActing(true); try { await onClose(conv.id); setConfirm(false); } finally { setActing(false); } };
  const doSend   = async () => {
    if (!msg.trim() || sending) return;
    setSending(true);
    try { await onSend(msg.trim()); setMsg(""); inputRef.current?.focus(); }
    finally { setSending(false); }
  };

  const partNom  = conv.partenaire ? `${conv.partenaire.prenom||""} ${conv.partenaire.nom||""}`.trim() : "Partenaire";
  const partInit = conv.partenaire ? `${(conv.partenaire.prenom||"?")[0]}${(conv.partenaire.nom||"")[0]||""}`.toUpperCase() : "P";

  return (
    <div className="as-chat">
      {/* Header */}
      <div className="as-chat-head">
        <div className="as-av as-av-md">{partInit}</div>
        <div className="as-chat-info">
          <strong>{partNom}</strong>
          <div className="as-chat-meta">
            <Badge statut={conv.statut} />
            <span className="as-chat-sujet">· {conv.sujet}</span>
          </div>
        </div>
        <div className="as-chat-actions">
          <button className="as-icon-btn" onClick={onRefresh} title="Actualiser">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
            </svg>
          </button>
          {isWait && (
            <button className="as-btn-accept" onClick={doAccept} disabled={acting}>
              {acting ? <span className="as-spin" /> : <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13"><polyline points="20 6 9 17 4 12"/></svg>Accepter</>}
            </button>
          )}
          {isOpen && !confirm && (
            <button className="as-btn-close-conv" onClick={() => setConfirm(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Fermer
            </button>
          )}
          {isOpen && confirm && (
            <div className="as-confirm-row">
              <span>Fermer définitivement ?</span>
              <button className="as-confirm-yes" onClick={doClose} disabled={acting}>{acting ? "…" : "Oui"}</button>
              <button className="as-confirm-no" onClick={() => setConfirm(false)}>Non</button>
            </div>
          )}
        </div>
      </div>

      {/* Bannière en attente */}
      {isWait && (
        <div className="as-wait-banner">
          <div className="as-wait-pulse" />
          <div className="as-wait-text">
            <strong>Demande en attente — {partNom}</strong>
            <p>Acceptez pour commencer à discuter avec ce partenaire</p>
          </div>
          <button className="as-btn-accept-big" onClick={doAccept} disabled={acting}>
            {acting ? <><span className="as-spin" /> Acceptation…</> : "✓ Accepter & discuter"}
          </button>
        </div>
      )}

      {isOpen && msgs.length === 0 && (
        <div className="as-ok-banner">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
            <circle cx="12" cy="12" r="10"/><polyline points="9 11 12 14 22 4"/>
          </svg>
          <strong>Conversation ouverte !</strong> Envoyez votre premier message.
        </div>
      )}

      {/* Messages */}
      <div className="as-msgs">
        {msgs.length === 0 && !isWait && (
          <div className="as-msgs-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8" width="48" height="48">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <p>Aucun message pour l'instant</p>
          </div>
        )}
        {msgs.map(m => {
          const isMe = m.id_expediteur === userId;
          const init = m.expediteur ? `${(m.expediteur.prenom||"?")[0]}${(m.expediteur.nom||"")[0]||""}`.toUpperCase() : "?";
          return (
            <div key={m.id} className={`as-msg ${isMe ? "as-msg-me" : "as-msg-other"}`}>
              {!isMe && <div className="as-msg-av">{init}</div>}
              <div className="as-msg-wrap">
                {!isMe && (
                  <span className="as-msg-name">
                    {m.expediteur?.prenom} {m.expediteur?.nom}
                    {m.expediteur?.role === "PARTENAIRE" && <em>Partenaire</em>}
                  </span>
                )}
                <div className={`as-bubble ${isMe ? "as-bubble-me" : "as-bubble-other"}`}>{m.contenu}</div>
                <span className="as-msg-time">{fmtTime(m.created_at)}</span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      {isOpen ? (
        <div className="as-composer">
          <textarea ref={inputRef} className="as-composer-ta"
            placeholder="Répondre… (Entrée pour envoyer, Maj+Entrée pour aller à la ligne)"
            value={msg} onChange={e => setMsg(e.target.value)}
            onKeyDown={e => { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); doSend(); } }}
            rows={1} />
          <button className={`as-send-btn ${msg.trim() ? "ready" : ""}`} onClick={doSend} disabled={!msg.trim() || sending}>
            {sending ? <span className="as-spin" /> : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                <path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/>
              </svg>
            )}
          </button>
        </div>
      ) : isWait ? (
        <div className="as-composer-blocked">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15">
            <circle cx="12" cy="12" r="10"/><polyline points="12 8 12 12 14 14"/>
          </svg>
          Acceptez d'abord la conversation pour écrire
        </div>
      ) : (
        <div className="as-composer-blocked">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          Conversation fermée
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PANEL ACCEPTATION
══════════════════════════════════════════════════════════ */
function AcceptationPanel({ conv, onAccept, onRefresh, onSwitchToChat }) {
  const [acting, setActing] = useState(false);

  const doAccept = async () => {
    setActing(true);
    try { await onAccept(conv.id); onSwitchToChat(); }
    finally { setActing(false); }
  };

  const partNom  = conv.partenaire ? `${conv.partenaire.prenom||""} ${conv.partenaire.nom||""}`.trim() : "Partenaire";
  const isWait   = conv.statut === "EN_ATTENTE";
  const isActive = conv.statut === "ACCEPTEE";
  const isClosed = conv.statut === "FERMEE";

  return (
    <div className="as-accept-panel">
      {/* Carte partenaire */}
      <div className="as-ap-card">
        <SupportAvatar prenom={conv.partenaire?.prenom} nom={conv.partenaire?.nom} size="lg" />
        <div className="as-ap-info">
          <h3>{partNom}</h3>
          {conv.partenaire?.email && (
            <p className="as-ap-email">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="12" height="12">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              {conv.partenaire.email}
            </p>
          )}
          <div className="as-ap-meta">
            <Badge statut={conv.statut} />
            <span>· {fmtDate(conv.created_at)}</span>
          </div>
        </div>
        <button className="as-icon-btn" onClick={onRefresh} title="Actualiser">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
          </svg>
        </button>
      </div>

      {/* Sujet */}
      <div className="as-ap-sujet">
        <span className="as-ap-sujet-label">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="11" height="11">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          Sujet de la conversation
        </span>
        <blockquote className="as-ap-sujet-val">« {conv.sujet} »</blockquote>
      </div>

      {/* Statut + Action */}
      {isWait && (
        <div className="as-ap-action">
          <div className="as-ap-action-body">
            <div className="as-wait-pulse" />
            <div>
              <strong>En attente de votre acceptation</strong>
              <p>{partNom} attend qu'un administrateur accepte cette conversation.</p>
            </div>
          </div>
          <button className="as-ap-btn-accept" onClick={doAccept} disabled={acting}>
            {acting
              ? <><span className="as-spin" /> Acceptation en cours…</>
              : <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15"><polyline points="20 6 9 17 4 12"/></svg>Accepter & ouvrir la discussion</>
            }
          </button>
        </div>
      )}

      {isActive && (
        <div className="as-ap-accepted">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" width="22" height="22">
            <circle cx="12" cy="12" r="10" stroke="#27AE60"/>
            <polyline points="9 11 12 14 22 4" stroke="#27AE60"/>
          </svg>
          <div>
            <strong>Conversation ouverte</strong>
            <p>Vous pouvez discuter avec {partNom} dans l'onglet <em>Discussion</em>.</p>
            <button className="as-ap-btn-switch" onClick={onSwitchToChat}>
              Aller à la discussion
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {isClosed && (
        <div className="as-ap-closed">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <div>
            <strong>Conversation fermée</strong>
            <p>L'historique des messages reste consultable dans l'onglet Discussion.</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE PRINCIPALE
══════════════════════════════════════════════════════════ */
export default function AdminSupport({ currentUserId }) {
  const [convs,     setConvs]     = useState([]);
  const [active,    setActive]    = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [filtre,    setFiltre]    = useState("tous");
  const [search,    setSearch]    = useState("");
  const [chatTab,   setChatTab]   = useState("acceptation");
  const [showModal, setShowModal] = useState(false);

  const loadConvs = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const d = await adminSupportApi.listConversations();
      setConvs(d.items || []);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadConvs(true); }, [loadConvs]);
  useEffect(() => {
    const t = setInterval(() => loadConvs(false), 30000);
    return () => clearInterval(t);
  }, [loadConvs]);

  const handleSelect = async (conv) => {
    setActive(conv);
    try { const d = await adminSupportApi.getConversation(conv.id); setActive(d); }
    catch(e) { console.error(e); }
  };
  const handleAccept = async (id) => {
    try { const d = await adminSupportApi.acceptConversation(id); setActive(d); setConvs(prev => prev.map(c => c.id===id?d:c)); }
    catch(e) { console.error(e); }
  };
  const handleClose = async (id) => {
    try { const d = await adminSupportApi.closeConversation(id); setActive(d); setConvs(prev => prev.map(c => c.id===id?d:c)); }
    catch(e) { console.error(e); }
  };
  const handleSend = async (contenu) => {
    if (!active) return;
    try {
      const m = await adminSupportApi.sendMessage(active.id, contenu);
      setActive(prev => ({ ...prev, messages:[...(prev.messages||[]),m] }));
      loadConvs(false);
    } catch(e) { console.error(e); }
  };
  const handleRefresh = async () => {
    if (!active) return;
    try { const d = await adminSupportApi.getConversation(active.id); setActive(d); } catch {}
  };
  const handleConvCreated = (newConv) => {
    setConvs(prev => [newConv, ...prev]);
    setActive(newConv);
    setChatTab("discussion");
    loadConvs(false);
  };

  const filtered = convs.filter(c => {
    if (filtre==="attente" && c.statut!=="EN_ATTENTE") return false;
    if (filtre==="cours"   && c.statut!=="ACCEPTEE")   return false;
    if (filtre==="fermees" && c.statut!=="FERMEE")     return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const nom   = `${c.partenaire?.prenom||""} ${c.partenaire?.nom||""}`.toLowerCase();
    const email = (c.partenaire?.email||"").toLowerCase();
    const sujet = (c.sujet||"").toLowerCase();
    return nom.includes(q) || email.includes(q) || sujet.includes(q);
  });

  const nbAttente = convs.filter(c => c.statut==="EN_ATTENTE").length;
  const nbCours   = convs.filter(c => c.statut==="ACCEPTEE").length;
  const nbFermees = convs.filter(c => c.statut==="FERMEE").length;

  return (
    <div className="as-page">

      {/* ── Header ──────────────────────────────────────── */}
      <header className="as-page-header">
        <div className="as-page-title-block">
          <div className="as-page-eyebrow">
            <span className="as-eyebrow-dot" />
            Messagerie interne
          </div>
          <h1 className="as-page-title">Support partenaires</h1>
          <p className="as-page-desc">
            {nbAttente > 0
              ? <span className="as-desc-warn"><span className="as-desc-dot" />{nbAttente} demande{nbAttente>1?"s":""} en attente d'acceptation</span>
              : `${convs.length} conversation${convs.length>1?"s":""}`
            }
          </p>
        </div>
        <div className="as-header-actions">
          <button className="as-btn-new" onClick={() => setShowModal(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="15" height="15">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="10" y1="11" x2="14" y2="11"/>
            </svg>
            Nouvelle conversation
          </button>
          <button className="as-icon-btn" onClick={() => loadConvs(false)} title="Actualiser">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
            </svg>
          </button>
        </div>
      </header>

      {/* ── KPI cards ───────────────────────────────────── */}
      <div className="as-kpi-grid">
        {[
          { color:"blue",  icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>, val:convs.length, lbl:"Total",      sub:"conversations" },
          { color:"amber", icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 8 12 12 14 14"/></svg>,                   val:nbAttente,    lbl:"En attente",  sub:"à accepter" },
          { color:"green", icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>, val:nbCours,      lbl:"En cours",    sub:"actives" },
          { color:"slate", icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,  val:nbFermees,    lbl:"Fermées",     sub:"archivées" },
        ].map((k,i) => (
          <div key={i} className={`as-kpi-card as-kpi-${k.color}`}>
            <div className="as-kpi-icon">{k.icon}</div>
            <div className="as-kpi-body">
              <span className="as-kpi-val">{k.val}</span>
              <span className="as-kpi-lbl">{k.lbl}</span>
              <span className="as-kpi-sub">{k.sub}</span>
            </div>
            <div className="as-kpi-deco" />
          </div>
        ))}
      </div>

      {/* ── Corps principal ─────────────────────────────── */}
      <div className="as-body">

        {/* Panel liste gauche */}
        <div className="as-panel-left">
          {/* Onglets */}
          <div className="as-list-tabs">
            {[
              { k:"tous",    l:"Tous",       n:convs.length },
              { k:"attente", l:"En attente", n:nbAttente    },
              { k:"cours",   l:"En cours",   n:nbCours      },
              { k:"fermees", l:"Fermées",    n:nbFermees    },
            ].map(t => (
              <button key={t.k} className={`as-ltab ${filtre===t.k?"active":""}`}
                onClick={() => setFiltre(t.k)}>
                {t.k==="attente" && <span className="as-ltab-dot as-ltd-amber" />}
                {t.k==="cours"   && <span className="as-ltab-dot as-ltd-green" />}
                {t.l}
                {t.n > 0 && <span className="as-ltab-count">{t.n}</span>}
              </button>
            ))}
          </div>

          {/* Recherche */}
          <div className="as-list-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nom, email, sujet…" />
            {search && <button className="as-list-clear" onClick={() => setSearch("")}>✕</button>}
          </div>

          {/* Liste */}
          <div className="as-list">
            {loading ? (
              <div className="as-list-state">
                <div className="as-loader"><div className="as-loader-ring"/><div className="as-loader-ring as-lr2"/></div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="as-list-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8" width="40" height="40">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <p>{search ? `Aucun résultat pour « ${search} »` : "Aucune conversation"}</p>
              </div>
            ) : filtered.map(c => {
              const nom  = c.partenaire ? `${c.partenaire.prenom||""} ${c.partenaire.nom||""}`.trim() : "Partenaire";
              const init = c.partenaire ? `${(c.partenaire.prenom||"?")[0]}${(c.partenaire.nom||"")[0]||""}`.toUpperCase() : "P";
              const last = c.messages?.[c.messages.length-1]?.contenu || c.sujet;
              const isPending = c.statut === "EN_ATTENTE";
              return (
                <button key={c.id}
                  className={`as-conv-item ${active?.id===c.id?"active":""} ${isPending?"pending":""}`}
                  onClick={() => { handleSelect(c); setChatTab(isPending?"acceptation":"discussion"); }}>
                  {isPending && <span className="as-conv-dot" />}
                  <div className={`as-av as-av-sm ${isPending?"as-av-pending":""}`}>{init}</div>
                  <div className="as-conv-info">
                    <div className="as-conv-top">
                      <span className="as-conv-nom">{nom}</span>
                      <span className="as-conv-time">{fmtDate(c.updated_at)}</span>
                    </div>
                    <span className="as-conv-email">{c.partenaire?.email}</span>
                    <div className="as-conv-mid">
                      <Badge statut={c.statut} />
                    </div>
                    <p className="as-conv-preview">{last?.slice(0,55)}{last?.length>55?"…":""}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Panel droit */}
        <div className="as-panel-right">
          {active ? (
            <>
              {/* Onglets chat */}
              <div className="as-chat-tabs">
                <button className={`as-ctab ${chatTab==="acceptation"?"active":""}`}
                  onClick={() => setChatTab("acceptation")}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                    <polyline points="9 11 12 14 22 4"/>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                  </svg>
                  Acceptation
                  {active.statut==="EN_ATTENTE" && <span className="as-ctab-dot" />}
                </button>
                <button className={`as-ctab ${chatTab==="discussion"?"active":""}`}
                  onClick={() => setChatTab("discussion")}
                  disabled={active.statut==="EN_ATTENTE"}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  Discussion
                  {active.messages?.length > 0 && <span className="as-ctab-count">{active.messages.length}</span>}
                </button>
              </div>

              {chatTab === "acceptation" ? (
                <AcceptationPanel conv={active} onAccept={handleAccept}
                  onRefresh={handleRefresh} onSwitchToChat={() => setChatTab("discussion")} />
              ) : (
                <Chat conv={active} userId={currentUserId} onAccept={handleAccept}
                  onClose={handleClose} onSend={handleSend} onRefresh={handleRefresh} />
              )}
            </>
          ) : (
            <div className="as-empty-panel">
              <div className="as-empty-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.7">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <h3>{nbAttente>0 ? `${nbAttente} demande${nbAttente>1?"s":""} en attente` : "Aucune conversation sélectionnée"}</h3>
              <p>Cliquez sur une conversation dans la liste pour l'ouvrir</p>
              <button className="as-empty-cta" onClick={() => setShowModal(true)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="14" height="14">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="10" y1="11" x2="14" y2="11"/>
                </svg>
                Nouvelle conversation
              </button>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <NouvelleConvModal onClose={() => setShowModal(false)} onCreate={handleConvCreated} />
      )}
    </div>
  );
}