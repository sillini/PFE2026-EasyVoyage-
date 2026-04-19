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

import Sidebar               from "./partenaire/components/layout/Sidebar";
import Topbar                from "./partenaire/components/layout/Topbar";
import MesHotels             from "./partenaire/pages/MesHotels";
import ChambresPage          from "./partenaire/pages/ChambresPage";
import MesPromotions         from "./partenaire/pages/MesPromotions";
import PlaceholderPage       from "./partenaire/pages/PlaceholderPage";
import PartenaireProfil      from "./partenaire/pages/PartenaireProfil";
import PartenaireSupportPage from "./partenaire/pages/PartenaireSupportPage";
import MesReservations       from "./partenaire/pages/MesReservations";
import PartenaireFinances    from "./partenaire/pages/PartenaireFinances";

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
  // Essaye plusieurs stratégies dans l'ordre pour maximiser la compat avec
  // l'implementation existante de LandingPage :
  //   1. Événement custom "open-login-modal" (si LandingPage l'écoute)
  //   2. Clic sur un élément marqué [data-login-trigger]
  //   3. Clic sur un bouton dont le texte contient "se connecter" (fallback)
  const handleOpenLoginModal = () => {
    // 1. Dispatch l'événement custom
    window.dispatchEvent(new CustomEvent("open-login-modal"));

    // 2. Essaye de trouver un trigger explicite
    const trigger = document.querySelector("[data-login-trigger]");
    if (trigger) {
      trigger.click();
      trigger.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    // 3. Fallback : cherche un bouton "Se connecter" dans la landing
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
        default:                return <AdminDashboard />;
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
      case "hotels":        return <MesHotels />;
      case "chambres":      return <ChambresPage />;
      case "promotions":    return <MesPromotions />;
      case "reservations":  return <MesReservations />;
      case "finances":      return <PartenaireFinances />;
      case "profil":        return <PartenaireProfil />;
      case "support":       return <PartenaireSupportPage currentUserId={user?.id}/>;
      default:              return <PlaceholderPage page={activePage} />;
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