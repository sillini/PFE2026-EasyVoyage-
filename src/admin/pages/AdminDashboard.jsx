import "./AdminPage.css";
export default function AdminDashboard() {
  return (
    <div className="adm-page">
      <div className="adm-page-card">
        <div className="adm-page-icon">📊</div>
        <h2>Tableau de bord</h2>
        <p>Statistiques globales : réservations, revenus, hôtels, voyages, partenaires et clients.</p>
        <span className="adm-page-badge"><span className="adm-page-dot"/>En cours de développement</span>
      </div>
    </div>
  );
}