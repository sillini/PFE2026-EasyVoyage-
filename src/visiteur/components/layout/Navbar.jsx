import { useState, useEffect } from "react";
import "./Navbar.css";

const NAV_LINKS = [
  { id: "hotels",   label: "Hôtels en Tunisie" },
  { id: "voyages",  label: "Voyages organisés" },
  { id: "promos",   label: "Promos" },
  { id: "pourquoi", label: "À propos" },
];

export default function Navbar({ activeSection, onSectionClick, onLoginClick }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 70);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const handleNav = (id) => {
    setMenuOpen(false);
    onSectionClick?.(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      {/* Top bar */}
      <div className="nav-topbar">
        <div className="nav-topbar-inner">
          <span className="nav-topbar-slogan">
            🇹🇳 EasyVoyage — La plateforme tunisienne de réservation
          </span>
          <div className="nav-topbar-right">
            <span>📧 contact@easyvoyage.tn</span>
            <span>📞 +216 XX XXX XXX</span>
          </div>
        </div>
      </div>

      {/* Main navbar */}
      <nav className={`ev-nav ${scrolled ? "scrolled" : ""}`}>
        <div className="ev-nav-inner">
          {/* Logo */}
          <div className="ev-logo" onClick={() => handleNav("top")} style={{ cursor: "pointer" }}>
            <div className="ev-logo-icon">
              <svg viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="14" fill="#1A3F63" stroke="#C4973A" strokeWidth="2"/>
                <path d="M8 20 Q16 8 24 20" stroke="#C4973A" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                <circle cx="16" cy="13" r="3" fill="#C4973A"/>
              </svg>
            </div>
            <span className="ev-logo-text">Easy<span>Voyage</span></span>
          </div>

          {/* Links desktop */}
          <div className="ev-nav-links">
            {NAV_LINKS.map(l => (
              <button
                key={l.id}
                className={`ev-nav-link ${activeSection === l.id ? "active" : ""}`}
                onClick={() => handleNav(l.id)}
              >
                {l.label}
              </button>
            ))}
          </div>

          {/* Bouton connexion */}
          <button className="ev-btn-connect" onClick={onLoginClick}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            Se connecter
          </button>

          {/* Burger mobile */}
          <button className="ev-burger" onClick={() => setMenuOpen(!menuOpen)}>
            <span/><span/><span/>
          </button>
        </div>

        {/* Menu mobile */}
        {menuOpen && (
          <div className="ev-mobile-menu">
            {NAV_LINKS.map(l => (
              <button key={l.id} className="ev-mobile-link" onClick={() => handleNav(l.id)}>
                {l.label}
              </button>
            ))}
            <button className="ev-btn-connect ev-mobile-connect" onClick={() => { setMenuOpen(false); onLoginClick(); }}>
              Se connecter
            </button>
          </div>
        )}
      </nav>
    </>
  );
}