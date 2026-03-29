import { useState } from "react";
import { disponibiliteApi } from "../services/api";
import "./DisponibilitePage.css";

// ── Badge disponibilité avec compteur ─────────────────────
function StatusBadge({ disponible, nbDisponibles, nbTotal }) {
  if (disponible) {
    return (
      <span className="dispo-badge dispo">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        {nbDisponibles} / {nbTotal} disponible{nbDisponibles > 1 ? "s" : ""}
      </span>
    );
  }
  return (
    <span className="dispo-badge occupe">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
      Complet ({nbTotal} / {nbTotal})
    </span>
  );
}

// ── Carte occupation avec N° facture ou voucher ───────────
function OccupationCard({ occupation }) {
  const fmt = d => new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
  });
  const isVisiteur = occupation.source === "visiteur";

  return (
    <div className="occupation-card">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
      <span className="occ-dates">
        {fmt(occupation.date_debut)}
        <span className="occ-sep">→</span>
        {fmt(occupation.date_fin)}
      </span>
      {occupation.numero_ref && (
        <span className={`occ-ref ${isVisiteur ? "occ-ref-visiteur" : "occ-ref-client"}`}>
          {isVisiteur ? "👤" : "🏷️"} {occupation.numero_ref}
        </span>
      )}
    </div>
  );
}

// ── Carte type de chambre ─────────────────────────────────
function TypeChambreCard({ chambre }) {
  const nbTotal       = chambre.nb_total       ?? 0;
  const nbDisponibles = chambre.nb_disponibles ?? 0;
  const nbReservees   = chambre.nb_reservees   ?? (nbTotal - nbDisponibles);
  const pct           = nbTotal > 0 ? Math.round((nbDisponibles / nbTotal) * 100) : 0;
  const toutesOccupees = nbDisponibles === 0;
  const barColor = pct === 0 ? "#E05252" : pct < 30 ? "#E07B25" : "#27AE60";

  return (
    <div className={`dispo-chambre-card ${chambre.disponible ? "dispo" : "occupe"}`}>
      <div className={`dispo-card-bar ${chambre.disponible ? "dispo" : "occupe"}`} />
      <div className="dispo-card-content">

        {/* En-tête */}
        <div className="dispo-card-header">
          <div className="dispo-card-type">
            <span className="dispo-type-badge">{chambre.type_chambre?.nom || "—"}</span>
            {chambre.capacite && (
              <div className="dispo-capacite">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                {chambre.capacite} pers.
              </div>
            )}
          </div>
          <StatusBadge disponible={chambre.disponible} nbDisponibles={nbDisponibles} nbTotal={nbTotal} />
        </div>

        {/* Compteur + barre de progression */}
        <div className="dispo-stock-row">
          <div className="dispo-stock-numbers">
            <span className="dispo-stock-dispo">{nbDisponibles}</span>
            <span className="dispo-stock-sep">/</span>
            <span className="dispo-stock-total">{nbTotal}</span>
            <span className="dispo-stock-label">chambres disponibles</span>
          </div>
          <div className="dispo-progress-bar">
            <div className="dispo-progress-fill" style={{ width: `${pct}%`, background: barColor }} />
          </div>
        </div>

        {/* Badge invisible visiteurs */}
        {toutesOccupees && (
          <div className="dispo-invisible-badge">
            🚫 Invisible pour les visiteurs et clients
          </div>
        )}

        {chambre.description && (
          <p className="dispo-card-desc">{chambre.description}</p>
        )}

        {chambre.prix_min != null && (
          <div className="dispo-card-prix">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
            <span>
              {chambre.prix_min === chambre.prix_max
                ? `${Number(chambre.prix_min).toFixed(0)} TND/nuit`
                : `${Number(chambre.prix_min).toFixed(0)} – ${Number(chambre.prix_max).toFixed(0)} TND/nuit`}
            </span>
          </div>
        )}

        {/* Réservations actives */}
        {nbReservees > 0 && chambre.occupations?.length > 0 && (
          <div className="dispo-occupations">
            <p className="occ-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {nbReservees} réservation{nbReservees > 1 ? "s" : ""} active{nbReservees > 1 ? "s" : ""}
            </p>
            {chambre.occupations.map((occ, i) => (
              <OccupationCard key={i} occupation={occ} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page principale ────────────────────────────────────────
export default function DisponibilitePage({ hotelId, hotelNom, onBack }) {
  const today    = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  const [dateDebut, setDateDebut] = useState(today);
  const [dateFin,   setDateFin]   = useState(tomorrow);
  const [result,    setResult]    = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  const handleSearch = async () => {
    if (!dateDebut || !dateFin || dateFin <= dateDebut) {
      setError("La date de fin doit être après la date de début"); return;
    }
    setError(""); setLoading(true);
    try {
      const data = await disponibiliteApi.getHotelDisponibilites(hotelId, dateDebut, dateFin);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  const totalDispos    = result?.chambres?.reduce((s, c) => s + (c.nb_disponibles ?? 0), 0) ?? 0;
  const totalChambres  = result?.chambres?.reduce((s, c) => s + (c.nb_total ?? 0), 0) ?? 0;
  const totalReservees = totalChambres - totalDispos;

  const fmt = d => new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
  });

  return (
    <div className="dispo-page">

      {/* ════════════════════════════════════════════════
          HEADER STICKY — Reste fixe en haut lors du scroll
      ════════════════════════════════════════════════ */}
      <div className="dispo-sticky-header">
        <div className="dispo-sticky-left">
          <button className="dispo-back" onClick={onBack}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Retour
          </button>
          <div className="dispo-sticky-titles">
            <h1 className="dispo-title">Disponibilités</h1>
            <p className="dispo-subtitle">{hotelNom}</p>
          </div>
        </div>

        {/* Formulaire intégré dans le header sticky */}
        <div className="dispo-sticky-form">
          <div className="dispo-date-field">
            <label>Arrivée</label>
            <input type="date" value={dateDebut}
              onChange={e => setDateDebut(e.target.value)} min={today} />
          </div>
          <div className="dispo-date-arrow">→</div>
          <div className="dispo-date-field">
            <label>Départ</label>
            <input type="date" value={dateFin}
              onChange={e => setDateFin(e.target.value)} min={dateDebut || today} />
          </div>
          <button className="dispo-btn-search" onClick={handleSearch} disabled={loading}>
            {loading ? <span className="dispo-spinner" /> : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                Rechercher
              </>
            )}
          </button>
        </div>
      </div>

      {/* Compensateur hauteur sticky */}
      <div className="dispo-sticky-spacer" />

      {error && <p className="dispo-error-inline">{error}</p>}

      {/* ── Résultats ────────────────────────────────── */}
      {result && (
        <>
          {/* Résumé période + stats */}
          <div className="dispo-summary">
            <div className="summary-period">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <span>Du <strong>{fmt(result.date_debut)}</strong> au <strong>{fmt(result.date_fin)}</strong></span>
            </div>
            <div className="summary-stats">
              <div className="summary-stat dispo">
                <span className="summary-num">{totalDispos}</span>
                <span className="summary-lbl">Chambres dispo.</span>
              </div>
              <div className="summary-stat occupe">
                <span className="summary-num">{totalReservees}</span>
                <span className="summary-lbl">Réservées</span>
              </div>
              <div className="summary-stat total">
                <span className="summary-num">{totalChambres}</span>
                <span className="summary-lbl">Total</span>
              </div>
            </div>
          </div>

          {/* Grille par type */}
          <div className="dispo-chambres-grid">
            {result.chambres.map(chambre => (
              <TypeChambreCard key={chambre.chambre_id} chambre={chambre} />
            ))}
          </div>
        </>
      )}

      {/* État initial */}
      {!result && !loading && (
        <div className="dispo-empty-state">
          <div className="dispo-empty-icon">📅</div>
          <h3>Sélectionnez une période</h3>
          <p>Choisissez les dates d'arrivée et de départ pour visualiser le stock disponible par type de chambre</p>
        </div>
      )}
    </div>
  );
}