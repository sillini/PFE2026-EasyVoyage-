import { useState, useEffect, useCallback } from "react";
import "./HeroSlider.css";

const BASE = "http://localhost:8000/api/v1";

const FALLBACK_SLIDES = [
  { id:"f1", image_url:"https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=1600&q=80", titre:"Découvrez la Tunisie", sous_titre:"Réservez votre séjour au meilleur prix", tag:"Offre Spéciale" },
  { id:"f2", image_url:"https://images.unsplash.com/photo-1604147706283-d7119b5b822c?w=1600&q=80", titre:"Djerba — L'Île des Rêves", sous_titre:"Séjours inoubliables face à la Méditerranée", tag:"Exclusif" },
  { id:"f3", image_url:"https://images.unsplash.com/photo-1553342385-111fd41abb89?w=1600&q=80", titre:"Hammamet & Sousse", sous_titre:"Les plus belles plages vous attendent", tag:"Été 2026" },
];

export default function HeroSlider() {
  const [slides, setSlides]  = useState([]);
  const [idx, setIdx]        = useState(0);
  const [animating, setAnim] = useState(false);

  useEffect(() => {
    fetch(`${BASE}/hero-slides`)
      .then(r => r.json())
      .then(d => {
        const items = d.items || [];
        setSlides(items.length > 0 ? items : FALLBACK_SLIDES);
      })
      .catch(() => setSlides(FALLBACK_SLIDES));
  }, []);

  const goTo = useCallback((nextIdx) => {
    if (animating || slides.length <= 1) return;
    setAnim(true);
    setTimeout(() => { setIdx(nextIdx); setAnim(false); }, 350);
  }, [animating, slides.length]);

  const next = useCallback(() => goTo((idx + 1) % slides.length), [goTo, idx, slides.length]);
  const prev = () => goTo((idx - 1 + slides.length) % slides.length);

  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(next, 6000);
    return () => clearInterval(t);
  }, [slides.length, next]);

  if (slides.length === 0) return <div className="hero-root hero-loading"/>;
  const slide = slides[idx];

  return (
    <section className="hero-root" id="top">
      {/* Backgrounds */}
      {slides.map((s, i) => (
        <div key={s.id}
          className={`hero-bg ${i === idx ? "active" : ""}`}
          style={{ backgroundImage: `url(${s.image_url})` }}
        />
      ))}
      <div className="hero-overlay"/>

      {/* Contenu */}
      <div className={`hero-content ${animating ? "fade-out" : "fade-in"}`}>
        {slide.tag && <div className="hero-tag">{slide.tag}</div>}
        <h1 className="hero-titre">{slide.titre}</h1>
        {slide.sous_titre && <p className="hero-sous">{slide.sous_titre}</p>}
      </div>

      {/* Navigation */}
      {slides.length > 1 && (
        <>
          <button className="hero-arrow hero-arrow-left" onClick={prev} aria-label="Précédent">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <button className="hero-arrow hero-arrow-right" onClick={next} aria-label="Suivant">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </>
      )}

      <div className="hero-dots">
        {slides.map((_, i) => (
          <button key={i} className={`hero-dot ${i === idx ? "active" : ""}`}
            onClick={() => goTo(i)} aria-label={`Slide ${i+1}`}/>
        ))}
      </div>
      <div className="hero-counter">{idx + 1} / {slides.length}</div>
    </section>
  );
}