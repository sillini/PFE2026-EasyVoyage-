import { useState, useEffect } from "react";
import "./VoyageDetailPage.css";

const API = "http://localhost:8000/api/v1";

async function get(url) {
  const t   = localStorage.getItem("access_token");
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(t ? { Authorization: "Bearer " + t } : {}) }
  });
  const text = await res.text();
  let d; try { d = JSON.parse(text); } catch { d = {}; }
  if (!res.ok) throw new Error(d.detail || "Erreur " + res.status);
  return d;
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}
function fmtShort(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

// ── Galerie ────────────────────────────────────────────────
function Galerie({ images }) {
  const [idx, setIdx] = useState(0);
  if (!images?.length) return (
    <div className="vdp-galerie-empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.6">
        <path d="M17.5 3H6.5C4.6 3 3 4.6 3 6.5v11C3 19.4 4.6 21 6.5 21h11c1.9 0 3.5-1.6 3.5-3.5v-11C21 4.6 19.4 3 17.5 3z"/>
        <circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
      </svg>
      <p>Aucune photo disponible</p>
    </div>
  );
  const main = images[idx];
  return (
    <div className="vdp-galerie">
      <div className="vdp-galerie-main">
        <img src={main.url} alt={main.alt || "Voyage"} />
        <div className="vdp-gal-overlay" />
        {images.length > 1 && (
          <>
            <button className="vdp-gal-prev" onClick={() => setIdx((idx - 1 + images.length) % images.length)}>‹</button>
            <button className="vdp-gal-next" onClick={() => setIdx((idx + 1) % images.length)}>›</button>
            <div className="vdp-gal-counter">{idx + 1} / {images.length}</div>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="vdp-galerie-thumbs">
          {images.slice(0, 6).map((img, i) => (
            <button key={i} className={`vdp-thumb ${i === idx ? "on" : ""}`} onClick={() => setIdx(i)}>
              <img src={img.url} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Carte Réservation ─────────────────────────────────────
function ReservationSection({ voyage, isClient, onReserver, onLoginRequired }) {
  const [adultes, setAdultes] = useState(1);
  const [enfants, setEnfants] = useState(0);
  const [error,   setError]   = useState("");

  const isExpired = new Date(voyage.date_retour) < new Date();
  const nbPersonnes = adultes + enfants;

  // ── Places restantes : utilise places_restantes si fourni par l'API,
  //    sinon calcule depuis capacite_max - nb_inscrits ──────────────────
  const placesRestantes =
    typeof voyage.places_restantes === "number"
      ? voyage.places_restantes
      : Math.max(0, (voyage.capacite_max || 0) - (voyage.nb_inscrits || 0));

  const isComplet = placesRestantes <= 0;
  const total     = parseFloat(voyage.prix_base) * nbPersonnes;

  const handleReserver = () => {
    setError("");
    if (!isClient) { onLoginRequired(); return; }
    if (nbPersonnes > placesRestantes) {
      setError(`Seulement ${placesRestantes} place(s) disponible(s).`); return;
    }
    onReserver({
      voyage,
      adultes,
      enfants,
      prix: { total, prix_par_pers: parseFloat(voyage.prix_base) },
    });
  };

  return (
    <div className="vdp-resa-card">
      {/* Prix */}
      <div className="vdp-resa-prix">
        <span className="vdp-prix-val">{parseFloat(voyage.prix_base).toFixed(2)}</span>
        <span className="vdp-prix-unit">DT / pers.</span>
      </div>

      {/* Dates fixes */}
      <div className="vdp-resa-dates">
        <div className="vdp-resa-date-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <div>
            <div className="vdp-resa-date-label">Départ</div>
            <div className="vdp-resa-date-val">{fmtShort(voyage.date_depart)}</div>
          </div>
        </div>
        <div className="vdp-resa-date-sep">
          <div className="vdp-resa-dur-badge">{voyage.duree}j</div>
        </div>
        <div className="vdp-resa-date-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <div>
            <div className="vdp-resa-date-label">Retour</div>
            <div className="vdp-resa-date-val">{fmtShort(voyage.date_retour)}</div>
          </div>
        </div>
      </div>

      {/* Sélecteur voyageurs */}
      {!isExpired && !isComplet && (
        <div className="vdp-resa-voyageurs">
          <div className="vdp-resa-voy-row">
            <div>
              <div className="vdp-resa-voy-label">Adultes</div>
              <div className="vdp-resa-voy-note">18 ans et +</div>
            </div>
            <div className="vdp-counter">
              <button onClick={() => setAdultes(Math.max(1, adultes - 1))} disabled={adultes <= 1}>−</button>
              <span>{adultes}</span>
              <button onClick={() => setAdultes(adultes + 1)} disabled={nbPersonnes >= placesRestantes}>+</button>
            </div>
          </div>
          <div className="vdp-resa-voy-row">
            <div>
              <div className="vdp-resa-voy-label">Enfants</div>
              <div className="vdp-resa-voy-note">Moins de 18 ans</div>
            </div>
            <div className="vdp-counter">
              <button onClick={() => setEnfants(Math.max(0, enfants - 1))} disabled={enfants <= 0}>−</button>
              <span>{enfants}</span>
              <button onClick={() => setEnfants(enfants + 1)} disabled={nbPersonnes >= placesRestantes}>+</button>
            </div>
          </div>
        </div>
      )}

      {/* Total */}
      {!isExpired && !isComplet && (
        <div className="vdp-resa-total">
          <span>Total ({nbPersonnes} pers.)</span>
          <strong>{total.toFixed(2)} DT</strong>
        </div>
      )}

      {error && <div className="vdp-resa-error">{error}</div>}

      {/* Badge places restantes */}
      {!isExpired && !isComplet && (
        <div className="vdp-places-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          {placesRestantes} place{placesRestantes > 1 ? "s" : ""} restante{placesRestantes > 1 ? "s" : ""}
        </div>
      )}

      {/* Bouton */}
      {isExpired ? (
        <div className="vdp-btn-disabled">Voyage terminé</div>
      ) : isComplet ? (
        <div className="vdp-btn-disabled vdp-btn-complet">Complet</div>
      ) : isClient ? (
        <button className="vdp-btn-reserver" onClick={handleReserver}>
          Réserver maintenant
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
          </svg>
        </button>
      ) : (
        <div className="vdp-login-required">
          <button className="vdp-btn-login" onClick={onLoginRequired}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
              <polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
            Se connecter pour réserver
          </button>
          <p className="vdp-login-note">La réservation de voyages est réservée aux clients connectés.</p>
        </div>
      )}
    </div>
  );
}

// ══ PAGE PRINCIPALE ══════════════════════════════════════
export default function VoyageDetailPage({ voyageId, isClient, user, onBack, onReserver, onLoginRequired }) {
  const [voyage,  setVoyage]  = useState(null);
  const [images,  setImages]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg,  setErrMsg]  = useState("");

  useEffect(() => { loadVoyage(); }, [voyageId]);

  const loadVoyage = async () => {
    setLoading(true); setErrMsg("");
    try {
      const [v, imgs] = await Promise.all([
        get(`${API}/voyages/${voyageId}`),
        get(`${API}/voyages/${voyageId}/images`).catch(() => ({ items: [] })),
      ]);
      setVoyage(v);
      const list = Array.isArray(imgs) ? imgs : imgs?.items || [];
      setImages([...list.filter(i => i.type === "PRINCIPALE"), ...list.filter(i => i.type !== "PRINCIPALE")]);
    } catch (e) { setErrMsg(e.message); }
    setLoading(false);
  };

  if (loading) return (
    <div className="vdp-loading"><div className="vdp-spinner"/><p>Chargement du voyage…</p></div>
  );
  if (errMsg || !voyage) return (
    <div className="vdp-error"><h3>Voyage introuvable</h3><button onClick={onBack}>← Retour</button></div>
  );

  const isExpired = new Date(voyage.date_retour) < new Date();
  const isOngoing = new Date(voyage.date_depart) <= new Date() && !isExpired;
  const statusLbl = isExpired ? "Terminé" : isOngoing ? "En cours" : "À venir";
  const statusCls = isExpired ? "expired" : isOngoing ? "ongoing" : "upcoming";

  // Places restantes pour l'affichage dans les infos pratiques
  const nbInscrits      = voyage.nb_inscrits || 0;
  const placesRestantes =
    typeof voyage.places_restantes === "number"
      ? voyage.places_restantes
      : Math.max(0, voyage.capacite_max - nbInscrits);

  return (
    <div className="vdp-root">
      {/* Breadcrumb */}
      <div className="vdp-breadcrumb">
        <button onClick={onBack} className="vdp-back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Retour
        </button>
        <span>/</span><span>Voyages</span><span>/</span>
        <span className="vdp-bc-current">{voyage.destination}</span>
      </div>

      {/* Hero */}
      <div className="vdp-hero-header">
        <div className="vdp-hero-meta">
          <span className={`vdp-status-badge ${statusCls}`}>{statusLbl}</span>
          <span className="vdp-dest-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            {voyage.destination}
          </span>
        </div>
        <h1 className="vdp-titre">{voyage.titre}</h1>
        <div className="vdp-hero-infos">
          <span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            {fmtDate(voyage.date_depart)} → {fmtDate(voyage.date_retour)}
          </span>
          <span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            {voyage.duree} jour{voyage.duree > 1 ? "s" : ""}
          </span>
          <span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
            </svg>
            {voyage.capacite_max} personnes max
          </span>
          {/* Places restantes dans le hero */}
          {!isExpired && (
            <span className={placesRestantes === 0 ? "vdp-hero-complet" : placesRestantes <= 3 ? "vdp-hero-warning" : ""}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              {placesRestantes === 0
                ? "Complet"
                : `${placesRestantes} place${placesRestantes > 1 ? "s" : ""} restante${placesRestantes > 1 ? "s" : ""}`}
            </span>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="vdp-main-grid">
        <div className="vdp-left">
          <Galerie images={images} />

          {voyage.description && (
            <div className="vdp-description">
              <h2 className="vdp-section-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
                  <line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/>
                  <line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
                Description du voyage
              </h2>
              <p>{voyage.description}</p>
            </div>
          )}

          {/* Infos pratiques */}
          <div className="vdp-infos-grid">
            {[
              { icon: "✈️", label: "Destination",       val: voyage.destination },
              { icon: "📅", label: "Départ",            val: fmtDate(voyage.date_depart) },
              { icon: "🏁", label: "Retour",            val: fmtDate(voyage.date_retour) },
              { icon: "⏱️", label: "Durée",             val: `${voyage.duree} jour${voyage.duree > 1 ? "s" : ""}`, accent: true },
              { icon: "👥", label: "Capacité max",      val: `${voyage.capacite_max} pers.` },
              { icon: "✅", label: "Inscrits",          val: `${nbInscrits} pers.` },
              { icon: placesRestantes === 0 ? "🔴" : "🟢",
                label: "Places restantes",
                val: placesRestantes === 0 ? "Complet" : `${placesRestantes} place${placesRestantes > 1 ? "s" : ""}`,
                accent: placesRestantes > 0,
              },
              { icon: "💰", label: "Prix / personne",   val: `${parseFloat(voyage.prix_base).toFixed(2)} DT`, accent: true },
            ].map(({ icon, label, val, accent }) => (
              <div key={label} className={`vdp-info-card ${accent ? "accent" : ""}`}>
                <div className="vdp-info-icon">{icon}</div>
                <div className="vdp-info-label">{label}</div>
                <div className="vdp-info-val">{val}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="vdp-right">
          <ReservationSection
            voyage={voyage}
            isClient={isClient}
            onReserver={onReserver}
            onLoginRequired={onLoginRequired}
          />
        </div>
      </div>
    </div>
  );
}