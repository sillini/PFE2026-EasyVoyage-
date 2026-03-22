import { useState, useEffect } from "react";
import { voyagesPublicApi, fetchMainImage } from "../../services/api";
import "./VoyagesSection.css";

function VoyageCard({ voyage, onReserver }) {
  const [img, setImg]         = useState(null);
  const [imgLoaded, setLoaded] = useState(false);
  const fmt = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day:"2-digit", month:"short", year:"numeric" }) : null;

  useEffect(() => { fetchMainImage("voyage", voyage.id).then(setImg); }, [voyage.id]);

  return (
    <div className="vc-card">
      <div className="vc-img-wrap">
        {img ? (
          <img src={img} alt={voyage.titre}
            onLoad={() => setLoaded(true)}
            style={{ opacity: imgLoaded ? 1 : 0 }}/>
        ) : (
          <div className="vc-no-img">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.7">
              <path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/>
            </svg>
          </div>
        )}
        <div className="vc-overlay"/>
        {voyage.prix_par_personne && (
          <div className="vc-prix">
            <span>À partir de</span>
            <strong>{parseFloat(voyage.prix_par_personne).toFixed(0)} DT</strong>
          </div>
        )}
      </div>

      <div className="vc-body">
        <h3 className="vc-titre">{voyage.titre}</h3>
        {voyage.destination && (
          <div className="vc-dest">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            {voyage.destination}
          </div>
        )}
        {(voyage.date_debut || voyage.date_fin) && (
          <div className="vc-dates">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            {fmt(voyage.date_debut)} {voyage.date_fin && `→ ${fmt(voyage.date_fin)}`}
          </div>
        )}
        {voyage.description && <p className="vc-desc">{voyage.description}</p>}
      </div>

      <div className="vc-footer">
        <button className="vc-btn" onClick={() => onReserver(voyage)}>
          Réserver ce voyage
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12"/>
            <polyline points="12 5 19 12 12 19"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="vc-card vc-skeleton">
      <div className="vc-skel-img"/>
      <div className="vc-skel-body">
        <div className="vc-skel-line long"/>
        <div className="vc-skel-line short"/>
        <div className="vc-skel-line medium"/>
      </div>
    </div>
  );
}

export default function VoyagesSection({ onReserver, searchParams }) {
  const [voyages, setVoyages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (searchParams?.categorie === "voyages") load(searchParams.texte);
  }, [searchParams]);

  const load = async (texte = "") => {
    setLoading(true);
    try {
      const params = { per_page: 8 };
      if (texte) params.search = texte;
      const d = await voyagesPublicApi.list(params);
      setVoyages(d.items || []);
    } catch { setVoyages([]); }
    finally { setLoading(false); }
  };

  if (!loading && voyages.length === 0) return null;

  return (
    <section className="vs-root" id="voyages">
      <div className="vs-inner">
        <div className="vs-header">
          <div>
            <span className="vs-tag">✈️ Voyages organisés</span>
            <h2 className="vs-title">Nos Offres de Voyages</h2>
            <p className="vs-sub">Partez l'esprit tranquille avec nos voyages tout compris</p>
          </div>
        </div>

        <div className="vs-grid">
          {loading
            ? Array(6).fill(0).map((_, i) => <SkeletonCard key={i}/>)
            : voyages.map(v => <VoyageCard key={v.id} voyage={v} onReserver={onReserver}/>)
          }
        </div>
      </div>
    </section>
  );
}