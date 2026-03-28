import { useState } from "react";
import Navbar                from "../components/layout/Navbar";
import Footer                from "../components/layout/Footer";
import HeroSlider            from "../components/sections/HeroSlider";
import SearchBar             from "../components/sections/SearchBar";
import HotelsSection         from "../components/sections/HotelsSection";
import VoyagesSection        from "../components/sections/VoyagesSection";
import AProposSection        from "../components/sections/AProposSection";   // ← NOUVEAU
import ResultatsPage         from "./ResultatsPage";
import HotelDetailPage       from "./HotelDetailPage";
import VoyageDetailPage      from "./VoyageDetailPage";
import AuthModal             from "../components/auth/AuthModal";
import ReservationFlow       from "../components/reservation/ReservationFlow";
import VoyageReservationFlow from "../components/reservation/VoyageReservationFlow";
import ProfilModal           from "../components/profil/ProfilModal";
import DemandePartenaireModal from "../components/partenaire/DemandePartenaireModal";
import "./LandingPage.css";

export default function LandingPage({ onLogin, onLogout, user, role }) {
  const isClient = role === "CLIENT" && !!user;

  // ── Navigation / UI ────────────────────────────────────
  const [activeSection,    setActiveSection]    = useState("hotels");
  const [searchParams,     setSearchParams]     = useState(null);
  const [showResults,      setShowResults]      = useState(false);
  const [showAuth,         setShowAuth]         = useState(false);
  const [authTab,          setAuthTab]          = useState("login");
  const [showProfil,       setShowProfil]       = useState(false);
  const [profilDefaultTab, setProfilDefaultTab] = useState("profil");
  const [showDemande,      setShowDemande]      = useState(false);

  // ── Pages détail ───────────────────────────────────────
  const [hotelDetail,      setHotelDetail]      = useState(null);
  const [voyageDetail,     setVoyageDetail]     = useState(null);

  // ── Flows réservation ──────────────────────────────────
  const [showReservation,  setShowReservation]  = useState(false);
  const [reservationData,  setReservationData]  = useState(null);
  const [showVoyageResa,   setShowVoyageResa]   = useState(false);
  const [voyageReservData, setVoyageReservData] = useState(null);

  // ── Helpers ────────────────────────────────────────────
  const openAuth     = (tab = "login") => { setAuthTab(tab); setShowAuth(true); };
  const handleLogin  = (data) => { setShowAuth(false); onLogin(data); };
  const clearDetails = () => { setHotelDetail(null); setVoyageDetail(null); };

  const goToHotel = (hotel) => {
    clearDetails();
    setShowResults(false);
    setShowProfil(false);
    setHotelDetail(typeof hotel === "object" ? hotel : { id: hotel });
    window.scrollTo(0, 0);
  };

  const goToVoyage = (voyage) => {
    clearDetails();
    setShowResults(false);
    setShowProfil(false);
    setVoyageDetail(typeof voyage === "object" ? voyage : { id: voyage });
    window.scrollTo(0, 0);
  };

  // ── Handlers hôtel ─────────────────────────────────────
  const handleHotelClick = (hotel) => {
    clearDetails();
    setHotelDetail(hotel);
    setShowResults(false);
    window.scrollTo(0, 0);
  };

  const handleReserver = (data) => {
    setReservationData(data);
    setShowReservation(true);
  };

  // ── Handlers voyage ────────────────────────────────────
  const handleVoyageClick = (voyage) => {
    clearDetails();
    setVoyageDetail(voyage);
    setShowResults(false);
    window.scrollTo(0, 0);
  };

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
    content = (
      <>
        <HeroSlider />
        <SearchBar onSearch={handleSearch} />
        <HotelsSection
          isClient={isClient}
          onReserver={handleHotelClick}
          searchParams={searchParams}
          onLoginRequired={() => openAuth("login")}
        />
        <VoyagesSection
          isClient={isClient}
          onReserver={handleVoyageClick}
          searchParams={searchParams}
          onLoginRequired={() => openAuth("login")}
        />
        <AProposSection />     {/* ← NOUVEAU */}
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
        onProfilClick={()       => { setProfilDefaultTab("profil");       setShowProfil(true); }}
        onReservationsClick={() => { setProfilDefaultTab("reservations"); setShowProfil(true); }}
        onFavorisClick={()      => { setProfilDefaultTab("favoris");      setShowProfil(true); }}
        onPartenaireClick={() => setShowDemande(true)}
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
          defaultTab={profilDefaultTab}
          onClose={() => setShowProfil(false)}
          onLogout={onLogout}
          onVoirHotel={(id)  => goToHotel(id)}
          onVoirVoyage={(id) => goToVoyage(id)}
        />
      )}

      {/* ── Demande Partenaire Modal ── */}
      {showDemande && (
        <DemandePartenaireModal onClose={() => setShowDemande(false)} />
      )}
    </div>
  );
}