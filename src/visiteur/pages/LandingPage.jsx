import { useState } from "react";
import Navbar                from "../components/layout/Navbar";
import Footer                from "../components/layout/Footer";
import HeroSlider            from "../components/sections/HeroSlider";
import SearchBar             from "../components/sections/SearchBar";
import HotelsSection         from "../components/sections/HotelsSection";
import VoyagesSection        from "../components/sections/VoyagesSection";
import ResultatsPage         from "./ResultatsPage";
import HotelDetailPage       from "./HotelDetailPage";
import VoyageDetailPage      from "./VoyageDetailPage";
import AuthModal             from "../components/auth/AuthModal";
import ReservationFlow       from "../components/reservation/ReservationFlow";
import VoyageReservationFlow from "../components/reservation/VoyageReservationFlow";
import ProfilModal           from "../components/profil/ProfilModal";
import "./LandingPage.css";

export default function LandingPage({ onLogin, onLogout, user, role }) {
  const isClient = role === "CLIENT" && !!user;

  // ── Navigation / UI ────────────────────────────────────
  const [activeSection,   setActiveSection]   = useState("hotels");
  const [searchParams,    setSearchParams]     = useState(null);
  const [showResults,     setShowResults]      = useState(false);
  const [showAuth,        setShowAuth]         = useState(false);
  const [authTab,         setAuthTab]          = useState("login");
  const [showProfil,      setShowProfil]       = useState(false);

  // ── Pages détail ───────────────────────────────────────
  const [hotelDetail,     setHotelDetail]      = useState(null); // objet hôtel
  const [voyageDetail,    setVoyageDetail]     = useState(null); // objet voyage

  // ── Flows réservation ──────────────────────────────────
  const [showReservation,  setShowReservation]  = useState(false);
  const [reservationData,  setReservationData]  = useState(null);
  const [showVoyageResa,   setShowVoyageResa]   = useState(false);
  const [voyageReservData, setVoyageReservData] = useState(null);

  // ── Helpers ────────────────────────────────────────────
  const openAuth = (tab = "login") => { setAuthTab(tab); setShowAuth(true); };
  const handleLogin = (data) => { setShowAuth(false); onLogin(data); };

  // Réinitialise toutes les vues détail
  const clearDetails = () => { setHotelDetail(null); setVoyageDetail(null); };

  // ── Handlers hôtel ─────────────────────────────────────
  // Clic "Voir les offres" d'un hôtel → page détail
  const handleHotelClick = (hotel) => {
    clearDetails();
    setHotelDetail(hotel);
    setShowResults(false);
    window.scrollTo(0, 0);
  };

  // Après sélection chambre → formulaire réservation hôtel
  const handleReserver = (data) => {
    setReservationData(data);
    setShowReservation(true);
  };

  // ── Handlers voyage ────────────────────────────────────
  // Clic "Voir le voyage" → page détail voyage
  const handleVoyageClick = (voyage) => {
    clearDetails();
    setVoyageDetail(voyage);
    setShowResults(false);
    window.scrollTo(0, 0);
  };

  // Depuis VoyageDetailPage → ouvrir flow réservation voyage
  const handleReserverVoyage = (data) => {
    setVoyageReservData(data);
    setShowVoyageResa(true);
  };

  // ── Recherche ──────────────────────────────────────────
  const handleSearch = (params) => {
    setSearchParams(params);
    setActiveSection(params.categorie);
    setShowResults(true);
    clearDetails();
  };

  // ── Contenu principal ──────────────────────────────────
  let content;

  if (voyageDetail) {
    // Page détail d'un voyage
    content = (
      <VoyageDetailPage
        voyageId={voyageDetail.id}
        isClient={isClient}
        user={user}
        onBack={() => {
          setVoyageDetail(null);
          setShowResults(!!searchParams);
        }}
        onReserver={handleReserverVoyage}
        onLoginRequired={() => openAuth("login")}
      />
    );
  } else if (hotelDetail) {
    // Page détail d'un hôtel
    content = (
      <HotelDetailPage
        hotelId={hotelDetail.id}
        isClient={isClient}
        user={user}
        onBack={() => {
          setHotelDetail(null);
          setShowResults(!!searchParams);
        }}
        onReserver={handleReserver}
      />
    );
  } else if (showResults) {
    // Page de résultats de recherche
    content = (
      <>
        <ResultatsPage
          searchParams={searchParams}
          onBack={() => setShowResults(false)}
          onReserver={(item) => {
            if (activeSection === "hotels") handleHotelClick(item);
            else handleVoyageClick(item);
          }}
        />
        <Footer />
      </>
    );
  } else {
    // Landing page principale
    content = (
      <>
        <HeroSlider />
        <SearchBar onSearch={handleSearch} />
        <HotelsSection
          onReserver={handleHotelClick}
          searchParams={searchParams}
        />
        <VoyagesSection
          onReserver={handleVoyageClick}
          searchParams={searchParams}
        />
        <Footer />
      </>
    );
  }

  return (
    <div className="lp-root">
      <Navbar
        activeSection={activeSection}
        onSectionClick={(s) => {
          setActiveSection(s);
          setShowResults(false);
          clearDetails();
        }}
        onLoginClick={() => openAuth("login")}
        isClient={isClient}
        user={user}
        onLogout={onLogout}
        onProfilClick={() => setShowProfil(true)}
      />

      {content}

      {/* ── Auth Modal ── */}
      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onLogin={handleLogin}
          defaultTab={authTab}
        />
      )}

      {/* ── Réservation Hôtel ── */}
      {showReservation && reservationData && (
        <ReservationFlow
          data={reservationData}
          isClient={isClient}
          user={user}
          onClose={() => { setShowReservation(false); setReservationData(null); }}
          onNeedAuth={() => { setShowReservation(false); openAuth("register"); }}
        />
      )}

      {/* ── Réservation Voyage ── */}
      {showVoyageResa && voyageReservData && (
        <VoyageReservationFlow
          data={voyageReservData}
          user={user}
          onClose={() => { setShowVoyageResa(false); setVoyageReservData(null); }}
        />
      )}

      {/* ── Profil Modal ── */}
      {showProfil && isClient && (
        <ProfilModal
          user={user}
          onClose={() => setShowProfil(false)}
          onLogout={onLogout}
        />
      )}
    </div>
  );
}