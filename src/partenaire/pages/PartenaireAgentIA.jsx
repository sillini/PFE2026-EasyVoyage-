// ══════════════════════════════════════════════════════════
//  src/partenaire/pages/PartenaireAgentIA.jsx
//  Layout principal : sidebar + chat window — Espace PARTENAIRE
// ══════════════════════════════════════════════════════════
import { useState } from "react";
import AgentIaSidebar    from "./agent-ia/AgentIaSidebar";
import AgentIaChatWindow from "./agent-ia/AgentIaChatWindow";
import { useAgentIA }    from "./agent-ia/useAgentIA";
import "./PartenaireAgentIA.css";

export default function PartenaireAgentIA() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const {
    // Sidebar
    conversations,
    loadingSidebar,
    // Chat
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
  } = useAgentIA();

  return (
    <div className="aia-root-v2">
      <AgentIaSidebar
        conversations={conversations}
        loading={loadingSidebar}
        activeConvId={activeConvId}
        onNewChat={handleNewChat}
        onSelect={handleSelectConv}
        onRename={handleRenameConv}
        onDelete={handleDeleteConv}
        onClearAll={handleClearAll}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
      />

      <AgentIaChatWindow
        messages={messages}
        activeConvId={activeConvId}
        loadingConv={loadingConv}
        sending={sending}
        streamingText={streamingText}
        onSend={handleSend}
        onAbort={handleAbort}
      />
    </div>
  );
}