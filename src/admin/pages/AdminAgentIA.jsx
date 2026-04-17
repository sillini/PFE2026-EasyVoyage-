// ══════════════════════════════════════════════════════════
//  src/admin/pages/AdminAgentIA.jsx  (REMPLACE L'ANCIEN FICHIER)
//  Layout principal : sidebar + chat window
// ══════════════════════════════════════════════════════════
import { useState } from "react";
import AgentIaSidebar   from "./agent-ia/AgentIaSidebar";
import AgentIaChatWindow from "./agent-ia/AgentIaChatWindow";
import { useAgentIA }   from "./agent-ia/useAgentIA";
import "./AdminAgentIA.css";

export default function AdminAgentIA() {
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