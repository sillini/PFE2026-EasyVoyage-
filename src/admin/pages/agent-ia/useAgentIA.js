// ══════════════════════════════════════════════════════════
//  src/admin/pages/agent-ia/useAgentIA.js
//  Hook principal pour la gestion d'état de l'Agent IA
// ══════════════════════════════════════════════════════════
import { useState, useEffect, useCallback, useRef } from "react";
import {
  listConversations,
  getConversation,
  renameConversation,
  deleteConversation,
  clearAllConversations,
  sendMessageStream,
} from "./agentIaApi";

const WELCOME_MSG = {
  id: "welcome",
  role: "assistant",
  contenu:
    "Bonjour 👋 Je suis votre assistant IA EasyVoyage. Comment puis-je vous aider aujourd'hui ?",
  created_at: new Date().toISOString(),
};

export function useAgentIA() {
  // ── État de la sidebar ──
  const [conversations, setConversations] = useState([]);
  const [loadingSidebar, setLoadingSidebar] = useState(true);

  // ── État du chat actif ──
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([WELCOME_MSG]);
  const [loadingConv, setLoadingConv] = useState(false);

  // ── État d'envoi ──
  const [sending, setSending] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const abortRef = useRef(null);

  // ══════════════════════════════════════════════════════════
  //  SIDEBAR — charger la liste au montage
  // ══════════════════════════════════════════════════════════

  const refreshSidebar = useCallback(async () => {
    try {
      const data = await listConversations({ limit: 100 });
      setConversations(data.items || []);
    } catch (e) {
      console.error("Erreur chargement conversations:", e);
    } finally {
      setLoadingSidebar(false);
    }
  }, []);

  useEffect(() => {
    refreshSidebar();
  }, [refreshSidebar]);

  // ══════════════════════════════════════════════════════════
  //  ACTIONS — nouveau chat, sélection, renommer, supprimer
  // ══════════════════════════════════════════════════════════

  const handleNewChat = useCallback(() => {
    if (sending) return;
    setActiveConvId(null);
    setMessages([WELCOME_MSG]);
    setStreamingText("");
  }, [sending]);

  const handleSelectConv = useCallback(
    async (id) => {
      if (sending || id === activeConvId) return;
      setLoadingConv(true);
      setStreamingText("");
      try {
        const data = await getConversation(id);
        setActiveConvId(id);
        setMessages(data.messages || []);
      } catch (e) {
        console.error("Erreur chargement conversation:", e);
        alert("Impossible de charger cette conversation : " + e.message);
      } finally {
        setLoadingConv(false);
      }
    },
    [sending, activeConvId]
  );

  const handleRenameConv = useCallback(
    async (id, newTitre) => {
      try {
        await renameConversation(id, newTitre);
        setConversations((prev) =>
          prev.map((c) => (c.id === id ? { ...c, titre: newTitre } : c))
        );
      } catch (e) {
        alert("Erreur renommage : " + e.message);
      }
    },
    []
  );

  const handleDeleteConv = useCallback(
    async (id) => {
      if (!window.confirm("Supprimer définitivement cette conversation ?")) return;
      try {
        await deleteConversation(id);
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (activeConvId === id) handleNewChat();
      } catch (e) {
        alert("Erreur suppression : " + e.message);
      }
    },
    [activeConvId, handleNewChat]
  );

  const handleClearAll = useCallback(async () => {
    if (
      !window.confirm(
        "⚠️ Supprimer TOUTES vos conversations ? Cette action est irréversible."
      )
    )
      return;
    try {
      await clearAllConversations();
      setConversations([]);
      handleNewChat();
    } catch (e) {
      alert("Erreur : " + e.message);
    }
  }, [handleNewChat]);

  // ══════════════════════════════════════════════════════════
  //  ENVOI DE MESSAGE — streaming
  // ══════════════════════════════════════════════════════════

  const handleSend = useCallback(
    async (text) => {
      const msg = text.trim();
      if (!msg || sending) return;

      setSending(true);
      setStreamingText("");

      // Optimistic UI : afficher le message user immédiatement
      const tempUserMsg = {
        id: "temp-user-" + Date.now(),
        role: "user",
        contenu: msg,
        created_at: new Date().toISOString(),
      };

      // Si c'est le welcome initial seulement, on le remplace
      setMessages((prev) => {
        const base = prev.length === 1 && prev[0].id === "welcome" ? [] : prev;
        return [...base, tempUserMsg];
      });

      let newConvId = activeConvId;
      let accumulatedText = "";

      abortRef.current = await sendMessageStream(
        { message: msg, conversation_id: activeConvId },
        {
          onConv: (data) => {
            newConvId = data.conversation_id;
            if (!activeConvId) setActiveConvId(newConvId);
          },
          onUserMsg: (userMsg) => {
            // Remplace le message temporaire par celui renvoyé par le backend
            setMessages((prev) =>
              prev.map((m) => (m.id === tempUserMsg.id ? userMsg : m))
            );
          },
          onToken: (chunk) => {
            accumulatedText += chunk;
            setStreamingText(accumulatedText);
          },
          onDone: (data) => {
            // Ajouter le message assistant final (remplace le streaming)
            setMessages((prev) => [...prev, data.assistant_message]);
            setStreamingText("");
            // Rafraîchir la sidebar pour voir le nouveau titre
            refreshSidebar();
          },
          onError: (err) => {
            setMessages((prev) => [
              ...prev,
              {
                id: "err-" + Date.now(),
                role: "assistant",
                contenu: "❌ " + err.message,
                is_error: true,
                created_at: new Date().toISOString(),
              },
            ]);
            setStreamingText("");
          },
        }
      );

      setSending(false);
      abortRef.current = null;
    },
    [activeConvId, sending, refreshSidebar]
  );

  const handleAbort = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
      setSending(false);
      setStreamingText("");
    }
  }, []);

  return {
    // Sidebar
    conversations,
    loadingSidebar,
    refreshSidebar,

    // Chat actif
    activeConvId,
    messages,
    loadingConv,

    // Envoi
    sending,
    streamingText,

    // Handlers
    handleNewChat,
    handleSelectConv,
    handleRenameConv,
    handleDeleteConv,
    handleClearAll,
    handleSend,
    handleAbort,
  };
}