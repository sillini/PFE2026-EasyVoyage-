/**
 * src/visiteur/components/agent-ia/useAgentIaClient.js
 * =====================================================
 * Hook React encapsulant la logique de l'agent IA côté client.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import * as api from "./agentIaClientService";

export default function useAgentIaClient({ autoLoadOnMount = true } = {}) {
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingConv, setIsLoadingConv] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);

  const pendingConvRef = useRef(null);

  const refreshConversations = useCallback(async () => {
    setIsLoadingList(true);
    setError(null);
    try {
      const data = await api.listConversations();
      setConversations(data.items || []);
    } catch (e) {
      setError(e.message || "Impossible de charger les conversations");
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  const openConversation = useCallback(async (convId) => {
    if (!convId) return;
    setIsLoadingConv(true);
    setError(null);
    setActiveConvId(convId);
    try {
      const data = await api.getConversation(convId);
      setMessages(data.messages || []);
    } catch (e) {
      setError(e.message || "Impossible de charger la conversation");
      setMessages([]);
    } finally {
      setIsLoadingConv(false);
    }
  }, []);

  const startNewConversation = useCallback(() => {
    setActiveConvId(null);
    setMessages([]);
    setError(null);
  }, []);

  const sendMessage = useCallback(
    async (text) => {
      const trimmed = (text || "").trim();
      if (!trimmed || isSending) return null;

      setIsSending(true);
      setError(null);
      pendingConvRef.current = activeConvId;

      const tempUserMsg = {
        id: `temp-${Date.now()}`,
        role: "user",
        contenu: trimmed,
        created_at: new Date().toISOString(),
        _pending: true,
      };
      setMessages((prev) => [...prev, tempUserMsg]);

      try {
        const res = await api.sendMessage(trimmed, activeConvId);

        if (
          pendingConvRef.current !== null &&
          pendingConvRef.current !== activeConvId
        ) {
          return res;
        }

        setMessages((prev) => {
          const withoutTemp = prev.filter((m) => m.id !== tempUserMsg.id);
          return [...withoutTemp, res.user_message, res.assistant_message];
        });

        if (!activeConvId) {
          setActiveConvId(res.conversation_id);
          setConversations((prev) => [
            {
              id: res.conversation_id,
              titre: res.titre,
              nb_messages: 2,
              last_message_at: res.assistant_message.created_at,
              created_at: res.user_message.created_at,
            },
            ...prev,
          ]);
        } else {
          setConversations((prev) =>
            prev.map((c) =>
              c.id === activeConvId
                ? {
                    ...c,
                    last_message_at: res.assistant_message.created_at,
                    nb_messages: (c.nb_messages || 0) + 2,
                  }
                : c
            )
          );
        }

        return res;
      } catch (e) {
        setError(e.message || "Erreur lors de l'envoi du message");
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
        return null;
      } finally {
        setIsSending(false);
        pendingConvRef.current = null;
      }
    },
    [activeConvId, isSending]
  );

  const deleteConversation = useCallback(
    async (convId) => {
      try {
        await api.deleteConversation(convId);
        setConversations((prev) => prev.filter((c) => c.id !== convId));
        if (convId === activeConvId) {
          startNewConversation();
        }
        return true;
      } catch (e) {
        setError(e.message || "Suppression impossible");
        return false;
      }
    },
    [activeConvId, startNewConversation]
  );

  const renameConversation = useCallback(async (convId, titre) => {
    try {
      await api.renameConversation(convId, titre);
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, titre } : c))
      );
      return true;
    } catch (e) {
      setError(e.message || "Renommage impossible");
      return false;
    }
  }, []);

  const clearAll = useCallback(async () => {
    try {
      await api.clearAllConversations();
      setConversations([]);
      startNewConversation();
      return true;
    } catch (e) {
      setError(e.message || "Impossible de tout supprimer");
      return false;
    }
  }, [startNewConversation]);

  useEffect(() => {
    if (autoLoadOnMount) refreshConversations();
  }, [autoLoadOnMount, refreshConversations]);

  return {
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
    clearAll,
    isAuthenticated: api.isAuthenticated,
  };
}