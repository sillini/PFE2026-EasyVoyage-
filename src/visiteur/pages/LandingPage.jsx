import { useState } from "react";
import Navbar         from "../components/layout/Navbar";
import Footer         from "../components/layout/Footer";
import HeroSlider     from "../components/sections/HeroSlider";
import SearchBar      from "../components/sections/SearchBar";
import HotelsSection  from "../components/sections/HotelsSection";
import VoyagesSection from "../components/sections/VoyagesSection";
import LoginPage      from "../../auth/LoginPage";
import "./LandingPage.css";

export default function LandingPage({ onLogin }) {
  const [showLogin,     setShowLogin]     = useState(false);
  const [activeSection, setActiveSection] = useState("hotels");
  const [searchParams,  setSearchParams]  = useState(null);

  const handleSearch = (params) => {
    setSearchParams(params);
    setActiveSection(params.categorie);
    const el = document.getElementById(params.categorie);
    if (el) setTimeout(() => el.scrollIntoView({ behavior:"smooth", block:"start" }), 100);
  };

  const handleReserver = () => setShowLogin(true);

  if (showLogin) {
    return (
      <div className="lp-login-wrap">
        <button className="lp-back-btn" onClick={() => setShowLogin(false)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Retour à l'accueil
        </button>
        <LoginPage onLogin={onLogin}/>
      </div>
    );
  }

  return (
    <div className="lp-root">
      <Navbar
        activeSection={activeSection}
        onSectionClick={setActiveSection}
        onLoginClick={() => setShowLogin(true)}
      />
      <HeroSlider />
      <SearchBar onSearch={handleSearch}/>
      <HotelsSection  onReserver={handleReserver} searchParams={searchParams}/>
      <VoyagesSection onReserver={handleReserver} searchParams={searchParams}/>
      <Footer/>
    </div>
  );
}