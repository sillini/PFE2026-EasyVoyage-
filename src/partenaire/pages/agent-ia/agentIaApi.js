// ══════════════════════════════════════════════════════════
//  src/partenaire/pages/agent-ia/agentIaApi.js
//  Client API pour l'Agent IA — Espace PARTENAIRE
// ══════════════════════════════════════════════════════════

const BASE = "http://localhost:8000/api/v1";

function authHeaders() {
  const t = localStorage.getItem("access_token");
  return {
    "Content-Type": "application/json",
    ...(t ? { Authorization: "Bearer " + t } : {}),
  };
}

async function handle(res) {
  if (!res.ok) {
    let detail = `Erreur ${res.status}`;
    try {
      const data = await res.json();
      detail = data.detail || detail;
    } catch {}
    throw new Error(detail);
  }
  if (res.status === 204) return null;
  return res.json();
}

// ══════════════════════════════════════════════════════════
//  CONVERSATIONS
// ══════════════════════════════════════════════════════════

export async function listConversations({ limit = 50, offset = 0 } = {}) {
  const q = new URLSearchParams({ limit, offset });
  const res = await fetch(`${BASE}/partenaire/agent-ia/conversations?${q}`, {
    headers: authHeaders(),
  });
  return handle(res);
}

export async function getConversation(id) {
  const res = await fetch(`${BASE}/partenaire/agent-ia/conversations/${id}`, {
    headers: authHeaders(),
  });
  return handle(res);
}

export async function renameConversation(id, titre) {
  const res = await fetch(`${BASE}/partenaire/agent-ia/conversations/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ titre }),
  });
  return handle(res);
}

export async function deleteConversation(id) {
  const res = await fetch(`${BASE}/partenaire/agent-ia/conversations/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handle(res);
}

export async function clearAllConversations() {
  const res = await fetch(`${BASE}/partenaire/agent-ia/conversations`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handle(res);
}

// ══════════════════════════════════════════════════════════
//  CHAT — non streaming
// ══════════════════════════════════════════════════════════

export async function sendMessage({ message, conversation_id = null }) {
  const res = await fetch(`${BASE}/partenaire/agent-ia/chat`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ message, conversation_id }),
  });
  return handle(res);
}

// ══════════════════════════════════════════════════════════
//  CHAT — streaming SSE (fetch + ReadableStream)
// ══════════════════════════════════════════════════════════

/**
 * Envoie un message avec streaming SSE.
 * @param {Object} params - { message, conversation_id }
 * @param {Object} callbacks - { onConv, onUserMsg, onToken, onDone, onError }
 * @returns {Promise<AbortController>} pour pouvoir annuler
 */
export async function sendMessageStream({ message, conversation_id = null }, callbacks = {}) {
  const { onConv, onUserMsg, onToken, onDone, onError } = callbacks;
  const controller = new AbortController();

  try {
    const res = await fetch(`${BASE}/partenaire/agent-ia/chat/stream`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ message, conversation_id }),
      signal: controller.signal,
    });

    if (!res.ok) {
      let detail = `Erreur ${res.status}`;
      try {
        const data = await res.json();
        detail = data.detail || detail;
      } catch {}
      onError?.(new Error(detail));
      return controller;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // Decoupage par event SSE (separes par \n\n)
      const events = buffer.split("\n\n");
      buffer = events.pop(); // dernier = potentiellement incomplet

      for (const ev of events) {
        const line = ev.trim();
        if (!line.startsWith("data:")) continue;
        const jsonStr = line.slice(5).trim();
        if (!jsonStr) continue;

        try {
          const data = JSON.parse(jsonStr);
          switch (data.type) {
            case "conv":     onConv?.(data);     break;
            case "user_msg": onUserMsg?.(data.message); break;
            case "token":    onToken?.(data.text); break;
            case "done":     onDone?.(data);     break;
            case "error":    onError?.(new Error(data.detail || "Erreur")); break;
            default: console.warn("Event SSE inconnu:", data);
          }
        } catch (e) {
          console.warn("JSON SSE invalide:", jsonStr);
        }
      }
    }
  } catch (err) {
    if (err.name !== "AbortError") onError?.(err);
  }

  return controller;
}