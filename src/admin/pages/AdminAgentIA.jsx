import "./AdminPage.css";
export default function AdminAgentIA() {
  return (
    <div className="adm-page">
      <div className="adm-page-card">
        <div className="adm-page-icon">🤖</div>
        <h2>Agent IA</h2>
        <p>Assistant intelligent d'administration pour analyser les données, générer des rapports et optimiser la plateforme.</p>
        <span className="adm-page-badge adm-badge-beta"><span className="adm-page-dot"/>Bêta — En cours de développement</span>
      </div>
    </div>
  );
}