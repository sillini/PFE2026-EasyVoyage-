/**
 * src/visiteur/components/agent-ia/agentIaClientService.js
 * =========================================================
 * Service API pour l'Agent IA — Espace CLIENT EasyVoyage.
 * Version Vite.
 *
 * Appelle les endpoints FastAPI /api/v1/client/agent-ia/*
 * Le JWT client est lu depuis localStorage.
 */

// ── Configuration (Vite) ─────────────────────────────────
const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

const ENDPOINT = `${API_BASE}/client/agent-ia`;

// ── Helpers ──────────────────────────────────────────────
const getToken = () => {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("access_token")
  );
};

const authHeaders = () => {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const handle = async (res) => {
  if (!res.ok) {
    let detail;
    try {
      const body = await res.json();
      detail = body.detail || body.message || res.statusText;
    } catch {
      detail = res.statusText;
    }
    const err = new Error(detail);
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
};

// ══════════════════════════════════════════════════════════
//  CONVERSATIONS
// ══════════════════════════════════════════════════════════

export async function listConversations({ limit = 50, offset = 0 } = {}) {
  const url = `${ENDPOINT}/conversations?limit=${limit}&offset=${offset}`;
  const res = await fetch(url, { method: "GET", headers: authHeaders() });
  return handle(res);
}

export async function getConversation(convId) {
  const res = await fetch(`${ENDPOINT}/conversations/${convId}`, {
    method: "GET",
    headers: authHeaders(),
  });
  return handle(res);
}

export async function renameConversation(convId, titre) {
  const res = await fetch(`${ENDPOINT}/conversations/${convId}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ titre }),
  });
  return handle(res);
}

export async function deleteConversation(convId) {
  const res = await fetch(`${ENDPOINT}/conversations/${convId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handle(res);
}

export async function clearAllConversations() {
  const res = await fetch(`${ENDPOINT}/conversations`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handle(res);
}

// ══════════════════════════════════════════════════════════
//  CHAT
// ══════════════════════════════════════════════════════════

export async function sendMessage(message, conversationId = null) {
  const res = await fetch(`${ENDPOINT}/chat`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      message,
      conversation_id: conversationId,
    }),
  });
  return handle(res);
}

export async function sendMessageStream(
  message,
  conversationId = null,
  onEvent = () => {}
) {
  const res = await fetch(`${ENDPOINT}/chat/stream`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ message, conversation_id: conversationId }),
  });

  if (!res.ok) {
    throw new Error(`Erreur ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const parts = buffer.split("\n\n");
    buffer = parts.pop() || "";

    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith("data:")) continue;
      try {
        const payload = JSON.parse(line.slice(5).trim());
        onEvent(payload);
      } catch (e) {
        console.warn("SSE parse error:", e);
      }
    }
  }
}

// ══════════════════════════════════════════════════════════
//  UTILITAIRES
// ══════════════════════════════════════════════════════════

export function isAuthenticated() {
  return !!getToken();
}