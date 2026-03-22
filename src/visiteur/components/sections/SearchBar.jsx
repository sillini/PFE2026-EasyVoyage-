import { useState } from "react";
import "./SearchBar.css";

const VILLES = [
  "Toute la Tunisie","Tunis","Hammamet","Sousse","Monastir",
  "Djerba","Tabarka","Sfax","Tozeur","Mahdia","Nabeul","Bizerte",
  "Gabès","Kairouan","Zarzis","Kébili","Tozeur","Douz",
];

const CATEGORIES = [
  { id: "hotels",  label: "Hôtels en Tunisie",   icon: "🏨" },
  { id: "voyages", label: "Voyages organisés",    icon: "✈️" },
];

export default function SearchBar({ onSearch }) {
  const [categorie, setCategorie] = useState("hotels");
  const [ville, setVille]         = useState("Toute la Tunisie");
  const [texte, setTexte]         = useState("");

  const handleSearch = () => {
    onSearch?.({
      categorie,
      ville: ville === "Toute la Tunisie" ? "" : ville,
      texte,
    });
    // Scroll vers la section concernée
    const el = document.getElementById(categorie);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="sb-root">
      <div className="sb-inner">
        {/* Onglets catégorie */}
        <div className="sb-tabs">
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              className={`sb-tab ${categorie === c.id ? "active" : ""}`}
              onClick={() => setCategorie(c.id)}
            >
              <span>{c.icon}</span> {c.label}
            </button>
          ))}
        </div>

        {/* Barre de recherche */}
        <div className="sb-bar">
          {/* Destination */}
          <div className="sb-field">
            <div className="sb-field-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              Destination
            </div>
            <select
              className="sb-select"
              value={ville}
              onChange={e => setVille(e.target.value)}
            >
              {VILLES.map(v => <option key={v}>{v}</option>)}
            </select>
          </div>

          <div className="sb-sep"/>

          {/* Mot clé */}
          <div className="sb-field sb-field-grow">
            <div className="sb-field-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              {categorie === "hotels" ? "Nom de l'hôtel" : "Nom du voyage"}
            </div>
            <input
              className="sb-input"
              value={texte}
              onChange={e => setTexte(e.target.value)}
              placeholder={categorie === "hotels" ? "Ex : Hôtel Barceló..." : "Ex : Circuit Sud..."}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
            />
          </div>

          {/* Bouton */}
          <button className="sb-btn" onClick={handleSearch}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            Rechercher
          </button>
        </div>
      </div>
    </div>
  );
}