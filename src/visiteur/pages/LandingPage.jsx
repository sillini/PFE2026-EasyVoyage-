import { useState } from "react";
import Navbar          from "../components/layout/Navbar";
import Footer          from "../components/layout/Footer";
import HeroSlider      from "../components/sections/HeroSlider";
import SearchBar       from "../components/sections/SearchBar";
import HotelsSection   from "../components/sections/HotelsSection";
import VoyagesSection  from "../components/sections/VoyagesSection";
import ResultatsPage   from "./ResultatsPage";
import HotelDetailPage from "./HotelDetailPage";
import AuthModal       from "../components/auth/AuthModal";
import ReservationFlow from "../components/reservation/ReservationFlow";
import ProfilModal     from "../components/profil/ProfilModal";
import "./LandingPage.css";

export default function LandingPage({ onLogin, onLogout, user, role }) {
  const isClient = role === "CLIENT" && !!user;

  const [activeSection,   setActiveSection]   = useState("hotels");
  const [searchParams,    setSearchParams]     = useState(null);
  const [showResults,     setShowResults]      = useState(false);
  const [showAuth,        setShowAuth]         = useState(false);
  const [authTab,         setAuthTab]          = useState("login");
  const [showReservation, setShowReservation]  = useState(false);
  const [reservationData, setReservationData]  = useState(null);
  const [showProfil,      setShowProfil]       = useState(false);
  const [hotelDetail,     setHotelDetail]      = useState(null); // {id} → page détail

  const openAuth = (tab="login") => { setAuthTab(tab); setShowAuth(true); };

  const handleLogin = (data) => { setShowAuth(false); onLogin(data); };

  // Clic "Voir les offres" d'un hôtel → page détail
  const handleHotelClick = (hotel) => {
    setHotelDetail(hotel);
    setShowResults(false);
    window.scrollTo(0,0);
  };

  // Après sélection chambre dans la page détail → formulaire réservation
  const handleReserver = (data) => {
    setReservationData(data);
    setShowReservation(true);
  };

  const handleSearch = (params) => {
    setSearchParams(params);
    setActiveSection(params.categorie);
    setShowResults(true);
    setHotelDetail(null);
  };

  // ── Contenu principal ──
  let content;
  if (hotelDetail) {
    content = (
      <HotelDetailPage
        hotelId={hotelDetail.id}
        isClient={isClient}
        user={user}
        onBack={() => { setHotelDetail(null); setShowResults(!!searchParams); }}
        onReserver={handleReserver}
      />
    );
  } else if (showResults) {
    content = (
      <>
        <ResultatsPage
          searchParams={searchParams}
          onBack={() => setShowResults(false)}
          onReserver={handleHotelClick}
        />
        <Footer/>
      </>
    );
  } else {
    content = (
      <>
        <HeroSlider/>
        <SearchBar onSearch={handleSearch}/>
        <HotelsSection  onReserver={handleHotelClick} searchParams={searchParams}/>
        <VoyagesSection onReserver={handleReserver}   searchParams={searchParams}/>
        <Footer/>
      </>
    );
  }

  return (
    <div className="lp-root">
      <Navbar
        activeSection={activeSection}
        onSectionClick={(s) => { setActiveSection(s); setShowResults(false); setHotelDetail(null); }}
        onLoginClick={() => openAuth("login")}
        isClient={isClient}
        user={user}
        onLogout={onLogout}
        onProfilClick={() => setShowProfil(true)}
      />

      {content}

      {showAuth && (
        <AuthModal onClose={()=>setShowAuth(false)} onLogin={handleLogin} defaultTab={authTab}/>
      )}

      {showReservation && (
        <ReservationFlow
          data={reservationData}
          isClient={isClient}
          user={user}
          onClose={() => setShowReservation(false)}
          onNeedAuth={() => { setShowReservation(false); openAuth("register"); }}
        />
      )}

      {showProfil && isClient && (
        <ProfilModal user={user} onClose={()=>setShowProfil(false)} onLogout={onLogout}/>
      )}
    </div>
  );
}