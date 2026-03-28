/**
 * src/visiteur/components/profil/TabFavoris.jsx
 * ───────────────────────────────────────────────
 * Onglet "Mes Favoris" dans ProfilModal.
 * Affiche hôtels & voyages en favori avec filtres et pagination.
 */
import { useState, useEffect, useCallback } from "react";
import { listFavoris, toggleFavori } from "../../../api/favorisApi";
import "./TabFavoris.css";

const PER_PAGE = 12;

// ── Carte Hôtel favori ────────────────────────────────────
function HotelCard({ item, onRetirer, onVoir }) {
  const [removing, setRemoving] = useState(false);

  const handleRetirer = async (e) => {
    e.stopPropagation();
    setRemoving(true);
    try {
      await toggleFavori({ id_hotel: item.id_hotel });
      onRetirer(item.id);
    } catch { setRemoving(false); }
  };

  const stars = Array.from({ length: 5 }, (_, i) => i < (item.hotel?.etoiles || 0));

  return (
    <div className="tf-card" onClick={() => onVoir?.("hotel", item.id_hotel)}>
      <div className="tf-card-badge tf-badge-hotel">🏨 Hôtel</div>

      <button
        className={`tf-remove-btn ${removing ? "removing" : ""}`}
        onClick={handleRetirer}
        disabled={removing}
        title="Retirer des favoris"
      >
        {removing
          ? <span className="tf-spin" />
          : <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
        }
      </button>

      <div className="tf-card-body">
        <h4 className="tf-card-title">{item.hotel?.nom || "Hôtel"}</h4>
        <div className="tf-card-stars">
          {stars.map((filled, i) => (
            <span key={i} className={filled ? "tf-star-on" : "tf-star-off"}>★</span>
          ))}
        </div>
        <p className="tf-card-sub">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
            <circle cx="12" cy="9" r="2.5"/>
          </svg>
          {item.hotel?.ville || ""}{item.hotel?.ville && item.hotel?.pays ? ", " : ""}{item.hotel?.pays || ""}
        </p>
        {item.hotel?.note_moyenne > 0 && (
          <div className="tf-card-note">
            <span className="tf-star-on">★</span>
            {Number(item.hotel.note_moyenne).toFixed(1)}
          </div>
        )}
      </div>

      <div className="tf-card-footer">
        <button className="tf-voir-btn" onClick={e => { e.stopPropagation(); onVoir?.("hotel", item.id_hotel); }}>
          Voir l'hôtel
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── Carte Voyage favori ───────────────────────────────────
function VoyageCard({ item, onRetirer, onVoir }) {
  const [removing, setRemoving] = useState(false);

  const handleRetirer = async (e) => {
    e.stopPropagation();
    setRemoving(true);
    try {
      await toggleFavori({ id_voyage: item.id_voyage });
      onRetirer(item.id);
    } catch { setRemoving(false); }
  };

  const prix = item.voyage?.prix_base
    ? `À partir de ${Number(item.voyage.prix_base).toFixed(0)} DT`
    : null;

  return (
    <div className="tf-card" onClick={() => onVoir?.("voyage", item.id_voyage)}>
      <div className="tf-card-badge tf-badge-voyage">✈️ Voyage</div>

      <button
        className={`tf-remove-btn ${removing ? "removing" : ""}`}
        onClick={handleRetirer}
        disabled={removing}
        title="Retirer des favoris"
      >
        {removing
          ? <span className="tf-spin" />
          : <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
        }
      </button>

      <div className="tf-card-body">
        <h4 className="tf-card-title">{item.voyage?.titre || "Voyage"}</h4>
        <p className="tf-card-sub">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
          {item.voyage?.destination}
        </p>
        {item.voyage?.duree && (
          <p className="tf-card-sub">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            {item.voyage.duree} jour{item.voyage.duree > 1 ? "s" : ""}
          </p>
        )}
        {prix && <div className="tf-card-prix">{prix}</div>}
      </div>

      <div className="tf-card-footer">
        <button className="tf-voir-btn" onClick={e => { e.stopPropagation(); onVoir?.("voyage", item.id_voyage); }}>
          Voir le voyage
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── Squelette de chargement ───────────────────────────────
function SkeletonCard() {
  return (
    <div className="tf-skeleton">
      <div className="tf-sk-badge"/>
      <div className="tf-sk-body">
        <div className="tf-sk-line" style={{ width:"70%", height:"16px" }}/>
        <div className="tf-sk-line" style={{ width:"45%", height:"12px" }}/>
        <div className="tf-sk-line" style={{ width:"55%", height:"12px" }}/>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  COMPOSANT PRINCIPAL
// ══════════════════════════════════════════════════════════
export default function TabFavoris({ onVoirHotel, onVoirVoyage }) {
  const [items,     setItems]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [filtre,    setFiltre]    = useState("all");   // "all" | "hotel" | "voyage"
  const [page,      setPage]      = useState(1);
  const [total,     setTotal]     = useState(0);
  const [nbHotels,  setNbHotels]  = useState(0);
  const [nbVoyages, setNbVoyages] = useState(0);

  const totalPages = Math.ceil(total / PER_PAGE);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const type = filtre === "all" ? null : filtre;
      const res  = await listFavoris({ type, page, per_page: PER_PAGE });
      setItems(res.items || []);
      setTotal(res.total || 0);
      setNbHotels(res.nb_hotels || 0);
      setNbVoyages(res.nb_voyages || 0);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filtre, page]);

  useEffect(() => { load(); }, [load]);

  // Retirer localement un item (sans recharger)
  const handleRetirer = (favoriId) => {
    setItems(prev => prev.filter(i => i.id !== favoriId));
    setTotal(prev => Math.max(0, prev - 1));
  };

  const handleVoir = (type, id) => {
    if (type === "hotel")  onVoirHotel?.(id);
    if (type === "voyage") onVoirVoyage?.(id);
  };

  const FILTRES = [
    { key: "all",    label: "Tous",    count: nbHotels + nbVoyages },
    { key: "hotel",  label: "Hôtels",  count: nbHotels },
    { key: "voyage", label: "Voyages", count: nbVoyages },
  ];

  return (
    <div className="tf-root">

      {/* ── Filtres ── */}
      <div className="tf-filters">
        {FILTRES.map(f => (
          <button
            key={f.key}
            className={`tf-filter-btn ${filtre === f.key ? "active" : ""}`}
            onClick={() => { setFiltre(f.key); setPage(1); }}
          >
            {f.label}
            <span className="tf-filter-count">{f.count}</span>
          </button>
        ))}
      </div>

      {/* ── Contenu ── */}
      {loading ? (
        <div className="tf-grid">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <div className="tf-error">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p>{error}</p>
          <button className="tf-retry-btn" onClick={load}>Réessayer</button>
        </div>
      ) : items.length === 0 ? (
        <div className="tf-empty">
          <div className="tf-empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </div>
          <h4>
            {filtre === "all"
              ? "Aucun favori pour l'instant"
              : filtre === "hotel"
              ? "Aucun hôtel en favori"
              : "Aucun voyage en favori"}
          </h4>
          <p>
            Cliquez sur le ❤ sur un hôtel ou un voyage pour l'ajouter à vos favoris.
          </p>
        </div>
      ) : (
        <>
          <div className="tf-grid">
            {items.map(item =>
              item.type === "hotel"
                ? <HotelCard  key={item.id} item={item} onRetirer={handleRetirer} onVoir={handleVoir} />
                : <VoyageCard key={item.id} item={item} onRetirer={handleRetirer} onVoir={handleVoir} />
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="tf-pagination">
              <button className="tf-pg-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                ← Précédent
              </button>
              <span className="tf-pg-info">Page {page} / {totalPages}</span>
              <button className="tf-pg-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                Suivant →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}