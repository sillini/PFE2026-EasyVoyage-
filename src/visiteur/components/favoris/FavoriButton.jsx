/**
 * src/visiteur/components/favoris/FavoriButton.jsx
 * ──────────────────────────────────────────────────
 * Bouton cœur ❤ pour ajouter / retirer un favori.
 * Utilisable dans les cartes hôtel et voyage.
 *
 * Props :
 *   id_hotel   {number}   id de l'hôtel  (OU id_voyage)
 *   id_voyage  {number}   id du voyage   (OU id_hotel)
 *   isClient   {bool}     si false → redirige vers login
 *   isFavori   {bool}     état initial (passé par le parent)
 *   onChange   {fn}       callback(isFavori: bool)
 *   onLoginRequired {fn}  ouvre le modal de connexion
 *   size       "sm"|"md"  taille du bouton (défaut "md")
 */
import { useState } from "react";
import { toggleFavori } from "../../../api/favorisApi";
import "./FavoriButton.css";

export default function FavoriButton({
  id_hotel      = null,
  id_voyage     = null,
  isClient      = false,
  isFavori      = false,
  onChange      = null,
  onLoginRequired = null,
  size          = "md",
}) {
  const [active,  setActive]  = useState(isFavori);
  const [loading, setLoading] = useState(false);
  const [burst,   setBurst]   = useState(false);  // animation ajout

  const handleClick = async (e) => {
    e.stopPropagation();   // ne pas déclencher le clic de la carte parent
    e.preventDefault();

    if (!isClient) {
      onLoginRequired?.();
      return;
    }

    setLoading(true);
    try {
      const res = await toggleFavori({ id_hotel, id_voyage });
      setActive(res.favori);
      if (res.favori) {
        setBurst(true);
        setTimeout(() => setBurst(false), 600);
      }
      onChange?.(res.favori);
    } catch (err) {
      console.error("Favori error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className={`fav-btn fav-btn--${size} ${active ? "fav-btn--active" : ""} ${burst ? "fav-btn--burst" : ""}`}
      onClick={handleClick}
      disabled={loading}
      title={active ? "Retirer des favoris" : "Ajouter aux favoris"}
      aria-label={active ? "Retirer des favoris" : "Ajouter aux favoris"}
      aria-pressed={active}
    >
      {/* Cœur SVG */}
      <svg
        className="fav-icon"
        viewBox="0 0 24 24"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={active ? "0" : "2"}
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>

      {/* Particules burst */}
      {burst && (
        <span className="fav-burst" aria-hidden="true">
          {[...Array(6)].map((_, i) => (
            <span key={i} className={`fav-particle fav-particle--${i}`} />
          ))}
        </span>
      )}
    </button>
  );
}