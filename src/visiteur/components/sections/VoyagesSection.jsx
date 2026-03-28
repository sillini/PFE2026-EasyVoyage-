import { useState, useEffect } from "react";
import { voyagesPublicApi, fetchMainImage } from "../../services/api";
import { toggleFavori, getFavoriIds } from "../../../api/favorisApi";
import "./VoyagesSection.css";

const fmt = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day:"2-digit", month:"short", year:"numeric" }) : null;

function duree(d1, d2) {
  if (!d1 || !d2) return null;
  const diff = Math.round((new Date(d2) - new Date(d1)) / (1000 * 60 * 60 * 24));
  return diff > 0 ? `${diff}J / ${diff - 1}N` : null;
}

// ══ Bouton Favori ❤ ═══════════════════════════════════════
function FavoriBtn({ voyageId, isClient, isFavori, onChange, onLoginRequired }) {
  const [active,  setActive]  = useState(isFavori);
  const [loading, setLoading] = useState(false);
  const [burst,   setBurst]   = useState(false);

  useEffect(() => { setActive(isFavori); }, [isFavori]);

  const handleClick = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isClient) { onLoginRequired?.(); return; }
    setLoading(true);
    try {
      const res = await toggleFavori({ id_voyage: voyageId });
      setActive(res.favori);
      if (res.favori) { setBurst(true); setTimeout(() => setBurst(false), 600); }
      onChange?.(res.favori);
    } catch (err) { console.error("Favori error:", err); }
    finally { setLoading(false); }
  };

  return (
    <button
      className={`vc-fav-btn ${active ? "vc-fav-active" : ""} ${burst ? "vc-fav-burst" : ""}`}
      onClick={handleClick}
      disabled={loading}
      title={active ? "Retirer des favoris" : "Ajouter aux favoris"}
      aria-label={active ? "Retirer des favoris" : "Ajouter aux favoris"}
      aria-pressed={active}
    >
      <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 2}>
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
      {burst && (
        <span className="vc-fav-burst-wrap" aria-hidden="true">
          {[...Array(6)].map((_, i) => <span key={i} className={`vc-fav-p vc-fav-p--${i}`}/>)}
        </span>
      )}
    </button>
  );
}

// ── Card voyage ───────────────────────────────────────────
function VoyageCard({ voyage, onReserver, isClient, isFavori, onFavoriChange, onLoginRequired }) {
  const [img,    setImg]    = useState(null);
  const [loaded, setLoaded] = useState(false);
  const dur = duree(voyage.date_debut, voyage.date_fin);

  useEffect(() => { fetchMainImage("voyage", voyage.id).then(setImg); }, [voyage.id]);

  return (
    <article className="vc-card" onClick={() => onReserver(voyage)}>
      <div className="vc-img-wrap">
        {img
          ? <img src={img} alt={voyage.titre} className="vc-img"
              onLoad={() => setLoaded(true)} style={{ opacity: loaded ? 1 : 0 }}/>
          : <div className="vc-img-ph">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5">
                <path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/>
              </svg>
            </div>
        }
        <div className="vc-gradient"/>

        {/* Badge durée — haut gauche */}
        {dur && <div className="vc-dur">{dur}</div>}

        {/* Badge prix — haut droit */}
        {voyage.prix_par_personne && (
          <div className="vc-prix">
            <span>dès</span>
            <strong>{parseFloat(voyage.prix_par_personne).toFixed(0)}</strong>
            <em>DT</em>
          </div>
        )}

        {/* Bouton favori ❤ — sous le badge prix */}
        <div className="vc-fav-wrap" onClick={e => e.stopPropagation()}>
          <FavoriBtn
            voyageId={voyage.id}
            isClient={isClient}
            isFavori={isFavori}
            onChange={onFavoriChange}
            onLoginRequired={onLoginRequired}
          />
        </div>

        {/* Info bas de carte */}
        <div className="vc-bottom">
          {voyage.destination && (
            <div className="vc-dest">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              {voyage.destination}
            </div>
          )}
          <h3 className="vc-titre">{voyage.titre}</h3>
          {(voyage.date_debut || voyage.date_fin) && (
            <div className="vc-dates">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              {fmt(voyage.date_debut)}{voyage.date_fin && ` → ${fmt(voyage.date_fin)}`}
            </div>
          )}
          <button className="vc-btn" onClick={e => { e.stopPropagation(); onReserver(voyage); }}>
            Réserver
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </button>
        </div>
      </div>
    </article>
  );
}

function Skeleton() {
  return (
    <div className="vc-skel">
      <div className="vc-skel-img"/>
    </div>
  );
}

// ── Section principale ────────────────────────────────────
export default function VoyagesSection({ onReserver, searchParams, isClient, onLoginRequired }) {
  const [voyages,   setVoyages]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [favoriIds, setFavoriIds] = useState([]);

  // Charger IDs favoris si client connecté
  useEffect(() => {
    if (!isClient) { setFavoriIds([]); return; }
    getFavoriIds()
      .then(d => setFavoriIds(d.voyage_ids || []))
      .catch(() => setFavoriIds([]));
  }, [isClient]);

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (searchParams?.categorie === "voyages") load(searchParams.texte);
  }, [searchParams]);

  const load = async (texte = "") => {
    setLoading(true);
    try {
      const params = { per_page: 9 };
      if (texte) params.search = texte;
      const d = await voyagesPublicApi.list(params);
      setVoyages(d?.items || []);
    } catch { setVoyages([]); }
    finally { setLoading(false); }
  };

  const handleFavoriChange = (voyageId, isFavori) => {
    setFavoriIds(prev =>
      isFavori ? [...prev, voyageId] : prev.filter(id => id !== voyageId)
    );
  };

  if (!loading && voyages.length === 0) return null;

  return (
    <section className="vs-root" id="voyages">
      <div className="vs-deco-1"/>
      <div className="vs-deco-2"/>

      <div className="vs-container">
        {/* En-tête */}
        <div className="vs-head">
          <div className="vs-tag-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/>
            </svg>
            Voyages organisés
          </div>
          <h2 className="vs-title">Nos Offres de<br/><em>Voyages</em></h2>
          <p className="vs-subtitle">Partez l'esprit tranquille — circuits tout compris soigneusement sélectionnés</p>
        </div>

        {/* Grille */}
        <div className="vs-grid">
          {loading
            ? Array(6).fill(0).map((_, i) => <Skeleton key={i}/>)
            : voyages.map(v => (
                <VoyageCard
                  key={v.id}
                  voyage={v}
                  onReserver={onReserver}
                  isClient={isClient}
                  isFavori={favoriIds.includes(v.id)}
                  onFavoriChange={(isFav) => handleFavoriChange(v.id, isFav)}
                  onLoginRequired={onLoginRequired}
                />
              ))
          }
        </div>
      </div>
    </section>
  );
}