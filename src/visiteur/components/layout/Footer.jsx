import "./Footer.css";

export default function Footer() {
  return (
    <footer className="ft-root">
      <div className="ft-inner">
        <div className="ft-brand">
          <span className="ft-logo">Easy<span>Voyage</span></span>
          <p>La plateforme tunisienne de réservation d'hôtels et de voyages organisés.</p>
          <div className="ft-socials">
            {["📘","📸","🐦"].map((s,i) => <button key={i} className="ft-social">{s}</button>)}
          </div>
        </div>
        <div className="ft-col">
          <h4>Navigation</h4>
          <a href="#hotels">Hôtels en Tunisie</a>
          <a href="#voyages">Voyages organisés</a>
          <a href="#pourquoi">À propos</a>
        </div>
        <div className="ft-col">
          <h4>Destinations</h4>
          {["Hammamet","Sousse","Djerba","Tabarka","Tozeur"].map(v => (
            <span key={v} className="ft-dest-link">{v}</span>
          ))}
        </div>
        <div className="ft-col">
          <h4>Contact</h4>
          <p>📧 contact@easyvoyage.tn</p>
          <p>📞 +216 XX XXX XXX</p>
          <p>📍 Tunisie</p>
        </div>
      </div>
      <div className="ft-bottom">
        <p>© 2026 EasyVoyage — Tous droits réservés.</p>
      </div>
    </footer>
  );
}