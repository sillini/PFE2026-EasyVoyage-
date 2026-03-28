import { useState, useEffect, useRef } from "react";
import "./Navbar.css";

const NAV_LINKS = [
  { id:"hotels",   label:"Hôtels en Tunisie" },
  { id:"voyages",  label:"Voyages organisés" },
  { id:"pourquoi", label:"À propos" },
];

export default function Navbar({
  activeSection,
  onSectionClick,
  onLoginClick,
  isClient,
  user,
  onLogout,
  onProfilClick,
  onReservationsClick,
  onFavorisClick,       // ← nouveau
  onPartenaireClick,
}) {
  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [dropOpen,  setDropOpen]  = useState(false);
  const dropRef = useRef();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 70);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    const fn = e => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const handleNav = (id) => {
    setMenuOpen(false);
    onSectionClick?.(id);
    const el = document.getElementById(id);
    if (el) setTimeout(() => el.scrollIntoView({ behavior:"smooth", block:"start" }), 50);
  };

  const initiales = user ? ((user.prenom?.[0]||"")+(user.nom?.[0]||"")).toUpperCase() : "";

  return (
    <>
      {/* Topbar */}
      <div className="nav-topbar">
        <div className="nav-topbar-inner">
          <span className="nav-topbar-slogan">🇹🇳 EasyVoyage — La plateforme tunisienne de réservation</span>
          <div className="nav-topbar-right">
            <span>📧 contact@easyvoyage.tn</span>
            <span>📞 +216 XX XXX XXX</span>
          </div>
        </div>
      </div>

      {/* Navbar principale */}
      <nav className={`ev-nav ${scrolled?"scrolled":""}`}>
        <div className="ev-nav-inner">

          {/* Logo */}
          <div className="ev-logo" onClick={()=>handleNav("top")} style={{cursor:"pointer"}}>
            <div className="ev-logo-icon">
              <svg viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="14" fill="#1A3F63" stroke="#C4973A" strokeWidth="2"/>
                <path d="M8 20 Q16 8 24 20" stroke="#C4973A" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                <circle cx="16" cy="13" r="3" fill="#C4973A"/>
              </svg>
            </div>
            <span className="ev-logo-text">Easy<span>Voyage</span></span>
          </div>

          {/* Liens */}
          <div className="ev-nav-links">
            {NAV_LINKS.map(l=>(
              <button key={l.id}
                className={`ev-nav-link ${activeSection===l.id?"active":""}`}
                onClick={()=>handleNav(l.id)}>
                {l.label}
              </button>
            ))}
          </div>

          {/* Zone droite */}
          <div className="ev-nav-right">

            {/* Bouton Espace Partenaire — toujours visible */}
            <button className="ev-nav-partenaire" onClick={onPartenaireClick}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              Espace Partenaire
            </button>

            {/* CLIENT CONNECTÉ */}
            {isClient ? (
              <div className="ev-client-zone" ref={dropRef}>
                <button className="ev-client-btn" onClick={()=>setDropOpen(!dropOpen)}>
                  <div className="ev-client-avatar">{initiales}</div>
                  <div className="ev-client-info">
                    <span className="ev-client-name">{user.prenom} {user.nom}</span>
                    <span className="ev-client-role">Mon compte</span>
                  </div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    style={{width:12,height:12,color:"#8A9BB0",transition:"transform 0.2s",transform:dropOpen?"rotate(180deg)":"rotate(0)"}}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>

                {dropOpen && (
                  <div className="ev-client-drop">
                    {/* Header dropdown */}
                    <div className="ev-drop-header">
                      <div className="ev-drop-avatar">{initiales}</div>
                      <div>
                        <div className="ev-drop-name">{user.prenom} {user.nom}</div>
                        <div className="ev-drop-email">{user.email}</div>
                      </div>
                    </div>

                    <div className="ev-drop-sep"/>

                    {/* Mon profil */}
                    <button className="ev-drop-item" onClick={()=>{setDropOpen(false);onProfilClick?.();}}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/>
                      </svg>
                      Mon profil
                    </button>

                    {/* Mes favoris ← NOUVEAU */}
                    <button className="ev-drop-item" onClick={()=>{setDropOpen(false);onFavorisClick?.();}}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                      </svg>
                      Mes favoris
                    </button>

                    {/* Mes réservations */}
                    <button className="ev-drop-item" onClick={()=>{setDropOpen(false);onReservationsClick?.();}}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <rect x="3" y="4" width="18" height="18" rx="2"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      Mes réservations
                    </button>

                    <div className="ev-drop-sep"/>

                    {/* Se déconnecter */}
                    <button className="ev-drop-item ev-drop-logout" onClick={()=>{setDropOpen(false);onLogout?.();}}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                        <polyline points="16 17 21 12 16 7"/>
                        <line x1="21" y1="12" x2="9" y2="12"/>
                      </svg>
                      Se déconnecter
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* VISITEUR */
              <button className="ev-btn-connect" onClick={onLoginClick}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                Se connecter
              </button>
            )}
          </div>

          {/* Burger mobile */}
          <button className="ev-burger" onClick={()=>setMenuOpen(!menuOpen)}>
            <span/><span/><span/>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="ev-mobile-menu">
            {NAV_LINKS.map(l=>(
              <button key={l.id} className="ev-mobile-link" onClick={()=>handleNav(l.id)}>{l.label}</button>
            ))}
            <button className="ev-mobile-link ev-mobile-partenaire"
              onClick={()=>{setMenuOpen(false);onPartenaireClick?.();}}>
              🤝 Espace Partenaire
            </button>
            {isClient ? (
              <>
                <button className="ev-mobile-link" onClick={()=>{setMenuOpen(false);onProfilClick?.();}}>Mon profil</button>
                {/* Mes favoris mobile ← NOUVEAU */}
                <button className="ev-mobile-link" onClick={()=>{setMenuOpen(false);onFavorisClick?.();}}>❤ Mes favoris</button>
                <button className="ev-mobile-link" onClick={()=>{setMenuOpen(false);onReservationsClick?.();}}>Mes réservations</button>
                <button className="ev-mobile-connect" style={{background:"#C0392B"}} onClick={()=>{setMenuOpen(false);onLogout?.();}}>Se déconnecter</button>
              </>
            ) : (
              <button className="ev-mobile-connect" onClick={()=>{setMenuOpen(false);onLoginClick();}}>Se connecter</button>
            )}
          </div>
        )}
      </nav>
    </>
  );
}