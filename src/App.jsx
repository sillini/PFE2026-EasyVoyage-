import { useState, useEffect } from "react";

import LandingPage from "./visiteur/pages/LandingPage";

// ✨ Widget Agent IA (visible uniquement pour visiteur/client)
import AgentIaClient from "./visiteur/components/agent-ia/AgentIaClient";

import AdminSidebar            from "./admin/components/layout/AdminSidebar";
import AdminTopbar             from "./admin/components/layout/AdminTopbar";
import AdminDashboard          from "./admin/pages/AdminDashboard";
import AdminReservations       from "./admin/pages/AdminReservations";
import AdminHotels             from "./admin/pages/AdminHotels";
import AdminVoyages            from "./admin/pages/AdminVoyages";
import AdminPartenaires        from "./admin/pages/AdminPartenaires";
import AdminDemandesPartenaire from "./admin/pages/AdminDemandesPartenaire";
import AdminClients            from "./admin/pages/AdminClients";
import AdminFinances           from "./admin/pages/AdminFinances";
import AdminMarketing          from "./admin/pages/AdminMarketing";
import AdminCatalogue          from "./admin/pages/catalogue/AdminCatalogue";
import AdminFactures           from "./admin/pages/AdminFactures";
import AdminAgentIA            from "./admin/pages/AdminAgentIA";
import AdminProfil             from "./admin/pages/AdminProfil";
import AdminHeroSlides         from "./admin/pages/AdminHeroSlides";
import AdminSupport            from "./admin/pages/AdminSupport";
import AdminHotelsVedettes     from "./admin/pages/AdminHotelsVedettes";
import AdminPromotions         from "./admin/pages/AdminPromotions";
import FiscalConfig            from "./admin/pages/FiscalConfig";
import AdminVideoCampaigns     from "./admin/pages/video-campaigns/AdminVideoCampaigns";
import AdminNotifications      from "./admin/pages/AdminNotifications";
import AdminAdministrateurs    from "./admin/pages/AdminAdministrateurs";   // ✨ NEW

import Sidebar                  from "./partenaire/components/layout/Sidebar";
import Topbar                   from "./partenaire/components/layout/Topbar";
import PartenaireDashboard      from "./partenaire/pages/PartenaireDashboard";
import MesHotels                from "./partenaire/pages/MesHotels";
import ChambresPage             from "./partenaire/pages/ChambresPage";
import MesPromotions            from "./partenaire/pages/MesPromotions";
import PlaceholderPage          from "./partenaire/pages/PlaceholderPage";
import PartenaireProfil         from "./partenaire/pages/PartenaireProfil";
import PartenaireSupportPage    from "./partenaire/pages/PartenaireSupportPage";
import MesReservations          from "./partenaire/pages/MesReservations";
import PartenaireFinances       from "./partenaire/pages/PartenaireFinances";
import PartenaireAgentIA        from "./partenaire/pages/PartenaireAgentIA";
import PartenaireNotifications  from "./partenaire/pages/PartenaireNotifications";  // ← AJOUT

import "./App.css";

const API_BASE = "http://localhost:8000/api/v1";

export default function App() {
  const [user,       setUser]       = useState(null);
  const [role,       setRole]       = useState(null);
  const [activePage, setActivePage] = useState("dashboard");
  const [wizardData, setWizardData] = useState(null);

  useEffect(() => {
    const token     = localStorage.getItem("access_token");
    const savedRole = localStorage.getItem("role");
    if (token && savedRole) fetchMe(token, savedRole);
  }, []);

  // ✨ NOUVEAU — Titre dynamique de l'onglet selon le rôle utilisateur
  useEffect(() => {
    let titre;
    switch (role) {
      case "ADMIN":      titre = "EasyVoyage — Espace Admin";      break;
      case "PARTENAIRE": titre = "EasyVoyage — Espace Partenaire"; break;
      case "CLIENT":     titre = "EasyVoyage — Mon compte";        break;
      default:           titre = "EasyVoyage — Voyages & Hôtels";
    }
    document.title = titre;
  }, [role]);

  const fetchMe = async (token, savedRole) => {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data); setRole(savedRole);
      } else { localStorage.clear(); }
    } catch { localStorage.clear(); }
  };

  const handleLogin = (data) => {
    if (!["PARTENAIRE", "ADMIN", "CLIENT"].includes(data.role)) {
      alert("Accès non autorisé."); localStorage.clear(); return;
    }
    fetchMe(data.access_token, data.role);
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null); setRole(null);
    setActivePage("dashboard");
    setWizardData(null);
  };

  const handleConfirmerDemande = (email, formData) => {
    setWizardData({ email, form: formData });
    setActivePage("partenaires");
  };

  // ✨ Déclencheur du modal de connexion depuis l'Agent IA
  const handleOpenLoginModal = () => {
    window.dispatchEvent(new CustomEvent("open-login-modal"));

    const trigger = document.querySelector("[data-login-trigger]");
    if (trigger) {
      trigger.click();
      trigger.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const buttons = Array.from(document.querySelectorAll("button, a"));
    const loginBtn = buttons.find((el) => {
      const txt = (el.textContent || "").trim().toLowerCase();
      return txt === "se connecter" || txt === "connexion" || txt === "login";
    });
    if (loginBtn) {
      loginBtn.click();
      loginBtn.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // ── VISITEUR / CLIENT ──────────────────────────────────
  if (!user || role === "CLIENT") {
    document.body.style.overflow = "";
    document.body.style.position = "";
    document.body.style.top      = "";
    document.documentElement.style.overflow = "";
    return (
      <>
        <LandingPage
          onLogin={handleLogin}
          onLogout={handleLogout}
          user={role === "CLIENT" ? user : null}
          role={role}
        />
        {/* ✨ Bulle assistant IA — visible partout sur la landing */}
        <AgentIaClient onLoginRedirect={handleOpenLoginModal} />
      </>
    );
  }

  // ── ADMIN ──────────────────────────────────────────────
  if (role === "ADMIN") {
    const renderAdmin = () => {
      switch (activePage) {
        case "dashboard":       return <AdminDashboard onNavigate={setActivePage} user={user} />;
        case "reservations":    return <AdminReservations />;
        case "hotels":          return <AdminHotels />;
        case "voyages":         return <AdminVoyages />;
        case "partenaires":
          return (
            <AdminPartenaires
              initialWizardEmail={wizardData?.email}
              initialWizardForm={wizardData?.form}
              onWizardConsumed={() => setWizardData(null)}
            />
          );
        case "demandes-partenaire":
          return <AdminDemandesPartenaire onConfirmer={handleConfirmerDemande}/>;
        case "clients":         return <AdminClients />;
        case "finances":        return <AdminFinances />;
        case "promotions":      return <AdminPromotions />;
        case "factures":        return <AdminFactures />;
        case "fiscal":          return <FiscalConfig />;
        case "marketing":       return <AdminMarketing />;
        case "catalogue":       return <AdminCatalogue />;
        case "video-campaigns": return <AdminVideoCampaigns />;
        case "hotels-vedettes": return <AdminHotelsVedettes />;
        case "hero-slides":     return <AdminHeroSlides />;
        case "support":         return <AdminSupport currentUserId={user?.id}/>;
        case "agent":           return <AdminAgentIA />;
        case "profil":          return <AdminProfil />;

        // Centre de notifications
        case "notifications":   return <AdminNotifications onNavigate={setActivePage} />;

        // ✨ NEW — Gestion administrateurs (Super Admin uniquement)
        case "administrateurs":
          // Garde-fou côté frontend : si quelqu'un tape l'URL/state à la main
          // mais n'est pas super admin, on redirige vers le dashboard.
          // Le backend bloque aussi avec 403 (require_super_admin).
          if (!user?.is_super_admin) {
            return <AdminDashboard onNavigate={setActivePage} user={user} />;
          }
          return <AdminAdministrateurs currentUser={user} />;

        default:                return <AdminDashboard onNavigate={setActivePage} user={user} />;
      }
    };

    return (
      <div className="app-shell">
        <AdminSidebar
          activePage={activePage}
          onNavigate={setActivePage}
          user={user}
          onLogout={handleLogout}
        />
        <div className="app-main">
          <AdminTopbar activePage={activePage} user={user} onNavigate={setActivePage}/>
          <main className="app-content">{renderAdmin()}</main>
        </div>
      </div>
    );
  }

  // ── PARTENAIRE ─────────────────────────────────────────
  const renderPartenaire = () => {
    switch (activePage) {
      case "dashboard":     return <PartenaireDashboard onNavigate={setActivePage} user={user} />;
      case "hotels":        return <MesHotels />;
      case "chambres":      return <ChambresPage />;
      case "promotions":    return <MesPromotions />;
      case "reservations":  return <MesReservations />;
      case "finances":      return <PartenaireFinances />;
      case "notifications": return <PartenaireNotifications onNavigate={setActivePage} />;  // ← AJOUT
      case "profil":        return <PartenaireProfil />;
      case "support":       return <PartenaireSupportPage currentUserId={user?.id}/>;
      case "agent":         return <PartenaireAgentIA />;
      default:              return <PartenaireDashboard onNavigate={setActivePage} user={user} />;
    }
  };

  return (
    <div className="app-shell">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        user={user}
        onLogout={handleLogout}
      />
      <div className="app-main">
        <Topbar activePage={activePage} user={user} onNavigate={setActivePage}/>
        <main className="app-content">{renderPartenaire()}</main>
      </div>
    </div>
  );
}