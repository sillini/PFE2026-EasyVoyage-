import { useState, useEffect } from "react";
import { hotelDetailApi } from "../services/hotelDetailApi";
import "./HotelDetailPage.css";

// ── Helpers ───────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}
function addDays(d, n) {
  const dt = new Date(d); dt.setDate(dt.getDate() + n);
  return dt.toISOString().split("T")[0];
}
function todayStr() { return new Date().toISOString().split("T")[0]; }
function nightsBetween(d1, d2) {
  if (!d1 || !d2) return 0;
  return Math.max(0, Math.round((new Date(d2) - new Date(d1)) / (1000 * 60 * 60 * 24)));
}
function getPrixChambre(tarifs, dateDebut, dateFin) {
  if (!tarifs?.length || !dateDebut || !dateFin) return null;
  const nuits = nightsBetween(dateDebut, dateFin);
  if (nuits <= 0) return null;
  const t = tarifs.find(t => t.date_debut <= dateDebut && t.date_fin >= dateFin)
         || tarifs.find(t => t.date_debut <= dateDebut)
         || tarifs[0];
  if (!t) return null;
  return { prix_nuit: parseFloat(t.prix), total: parseFloat(t.prix) * nuits, type_resa: t.type_reservation?.nom || "Standard" };
}

// ── Galerie images ────────────────────────────────────────
function Galerie({ images }) {
  const [idx, setIdx] = useState(0);
  if (!images?.length) return (
    <div className="hd-galerie-empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    </div>
  );
  const main = images[idx];
  return (
    <div className="hd-galerie">
      <div className="hd-galerie-main">
        <img src={main.url} alt={main.alt || "Hotel"} />
        {images.length > 1 && (
          <>
            <button className="hd-gal-prev" onClick={() => setIdx((idx - 1 + images.length) % images.length)}>‹</button>
            <button className="hd-gal-next" onClick={() => setIdx((idx + 1) % images.length)}>›</button>
            <div className="hd-gal-counter">{idx + 1}/{images.length}</div>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="hd-galerie-thumbs">
          {images.slice(0, 6).map((img, i) => (
            <button key={i} className={`hd-thumb ${i === idx ? "on" : ""}`} onClick={() => setIdx(i)}>
              <img src={img.url} alt={img.alt || ""} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Section Chambres & Tarifs ─────────────────────────────
function ChambresSection({ hotelId, isClient, user, onSelectChambre }) {
  const [dateDebut, setDateDebut] = useState(addDays(todayStr(), 1));
  const [dateFin,   setDateFin]   = useState(addDays(todayStr(), 2));
  const [adultes,   setAdultes]   = useState(2);
  const [enfants,   setEnfants]   = useState(0);
  const [chambres,  setChambres]  = useState([]);
  const [tarifMap,  setTarifMap]  = useState({});
  const [selected,  setSelected]  = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [searched,  setSearched]  = useState(false);

  const search = async () => {
    if (dateFin <= dateDebut) { alert("La date de départ doit être après l'arrivée"); return; }
    setLoading(true); setSearched(true); setSelected(null);

    // ── Capacité minimale requise = adultes + enfants ────────────────────
    const nbPersonnes = adultes + enfants;

    try {
      // ── ÉTAPE 1 : disponibilités publiques par période + filtre capacité ─
      // On envoie nbPersonnes → le backend ne retourne que les chambres
      // dont capacite >= nbPersonnes (ex: 2 adultes + 2 enfants = 4 → chambre ≥ 4 pers.)
      const dispoData  = await hotelDetailApi.getChambresDisponibles(
        hotelId, dateDebut, dateFin, nbPersonnes
      );
      const dispoTypes = dispoData.chambres || [];

      // ── ÉTAPE 2 : détails complets (type_chambre, description…) ─────────
      const allData     = await hotelDetailApi.getChambres(hotelId);
      const allChambres = allData.items || allData || [];

      // Merger dispo + détails
      const merged = dispoTypes.map(dispo => {
        const full = allChambres.find(c => c.id === dispo.chambre_id) || {};
        return {
          ...full,
          id:             dispo.chambre_id,
          nb_disponibles: dispo.nb_disponibles ?? 0,
          nb_total:       dispo.nb_total       ?? full.nb_chambres ?? 1,
          disponible:     dispo.disponible,
          type_chambre:   full.type_chambre || dispo.type_chambre,
          capacite:       full.capacite     || dispo.capacite,
          description:    full.description  || dispo.description,
          prix_min:       full.prix_min,
          prix_max:       full.prix_max,
        };
      });

      // ── Double sécurité côté client : exclure les chambres insuffisantes ─
      // (au cas où le backend ne supporterait pas encore capacite_min)
      const filtered = merged.filter(ch => (ch.capacite || 0) >= nbPersonnes);

      setChambres(filtered);

      // ── ÉTAPE 3 : tarifs par chambre filtrée ─────────────────────────────
      const map = {};
      await Promise.all(filtered.map(async c => {
        try {
          const t = await hotelDetailApi.getTarifs(hotelId, c.id);
          map[c.id] = t.items || t || [];
        } catch { map[c.id] = []; }
      }));
      setTarifMap(map);
    } catch (err) {
      console.error("Erreur disponibilités:", err);
      setChambres([]);
    }
    setLoading(false);
  };

  const nuits = nightsBetween(dateDebut, dateFin);

  const handleReserver = () => {
    if (!selected) return;
    const tarifs = tarifMap[selected.id] || [];
    const prix   = getPrixChambre(tarifs, dateDebut, dateFin);
    onSelectChambre({ chambre: selected, prix, dateDebut, dateFin, adultes, enfants, nuits });
  };

  return (
    <div className="hd-chambres-section" id="disponibilite">
      <h2 className="hd-section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
        </svg>
        Dates &amp; Disponibilités
      </h2>

      {/* Barre de recherche */}
      <div className="hd-search-bar">
        <div className="hd-sb-field">
          <label>Arrivée</label>
          <input type="date" value={dateDebut} min={todayStr()}
            onChange={e => {
              setDateDebut(e.target.value);
              if (e.target.value >= dateFin) setDateFin(addDays(e.target.value, 1));
            }} />
        </div>
        <div className="hd-sb-field">
          <label>Départ</label>
          <input type="date" value={dateFin} min={addDays(dateDebut, 1)}
            onChange={e => setDateFin(e.target.value)} />
        </div>
        <div className="hd-sb-field hd-sb-occ">
          <label>Adultes</label>
          <div className="hd-sb-counter">
            <button type="button" onClick={() => setAdultes(Math.max(1, adultes - 1))}>−</button>
            <span>{adultes}</span>
            <button type="button" onClick={() => setAdultes(adultes + 1)}>+</button>
          </div>
        </div>
        <div className="hd-sb-field hd-sb-occ">
          <label>Enfants</label>
          <div className="hd-sb-counter">
            <button type="button" onClick={() => setEnfants(Math.max(0, enfants - 1))}>−</button>
            <span>{enfants}</span>
            <button type="button" onClick={() => setEnfants(enfants + 1)}>+</button>
          </div>
        </div>
        <button className="hd-sb-btn" onClick={search} disabled={loading}>
          {loading ? <span className="hd-spin-sm" /> : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              Vérifier la disponibilité
            </>
          )}
        </button>
      </div>

      {/* Résultats */}
      {searched && !loading && (
        <div className="hd-chambres-list">
          {chambres.length === 0 ? (
            <div className="hd-no-chambre">
              Aucune chambre disponible pour {adultes + enfants} personne{adultes + enfants > 1 ? "s" : ""}
              {" "}sur ces dates. Essayez d'autres dates ou modifiez le nombre de voyageurs.
            </div>
          ) : (
            <>
              <div className="hd-ch-header">
                <span>Type de chambre</span>
                <span>Occupation</span>
                <span>Type de pension</span>
                <span>Total {nuits} nuit{nuits > 1 ? "s" : ""}</span>
              </div>

              {chambres.map(ch => {
                const tarifs = tarifMap[ch.id] || [];
                const prix   = getPrixChambre(tarifs, dateDebut, dateFin);
                const isSel  = selected?.id === ch.id;
                return (
                  <label key={ch.id}
                    className={`hd-chambre-row ${isSel ? "selected" : ""} ${!prix ? "unavailable" : ""}`}>
                    <div className="hd-ch-check">
                      <input type="radio" name="chambre" checked={isSel}
                        onChange={() => prix && setSelected(ch)} disabled={!prix} />
                    </div>
                    <div className="hd-ch-info">
                      <div className="hd-ch-nom">
                        {ch.type_chambre?.nom || "Chambre"} ({ch.capacite} Pers.)
                        <span className="hd-badge-dispo">
                          {ch.nb_disponibles} disponible{ch.nb_disponibles > 1 ? "s" : ""}
                        </span>
                      </div>
                      {ch.description && <div className="hd-ch-desc">{ch.description}</div>}
                    </div>
                    <div className="hd-ch-occ">
                      {Array(Math.min(ch.capacite || 2, 4)).fill(0).map((_, i) => (
                        <svg key={i} viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                          <circle cx="12" cy="7" r="4"/>
                          <path d="M3 21v-2a7 7 0 0 1 14 0v2"/>
                        </svg>
                      ))}
                    </div>
                    <div className="hd-ch-pension">
                      {tarifs.length > 0 && tarifs[0].type_reservation?.nom
                        ? <div className="hd-pension-badge">{tarifs[0].type_reservation.nom}</div>
                        : <div className="hd-pension-badge">Logement seul</div>
                      }
                    </div>
                    <div className="hd-ch-prix">
                      {prix ? (
                        <>
                          <div className="hd-prix-val">{prix.total.toFixed(2)} <span>DT</span></div>
                          <div className="hd-prix-nuit">{prix.prix_nuit.toFixed(2)} DT / nuit</div>
                        </>
                      ) : (
                        <div className="hd-prix-na">Sur demande</div>
                      )}
                    </div>
                  </label>
                );
              })}

              {selected && (
                <div className="hd-ch-footer">
                  <div className="hd-ch-total">
                    <span>Montant total du séjour :</span>
                    <strong>
                      {getPrixChambre(tarifMap[selected.id] || [], dateDebut, dateFin)?.total.toFixed(2) || "—"} DT
                    </strong>
                  </div>
                  <button className="hd-btn-reserver" onClick={handleReserver}>
                    RÉSERVER
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                      <polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Section Avis ──────────────────────────────────────────
function AvisSection({ hotelId, isClient }) {
  const [avis,    setAvis]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [form,    setForm]    = useState({ note: 5, commentaire: "" });
  const [posting, setPosting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState("");

  useEffect(() => { loadAvis(); }, []);

  const loadAvis = async () => {
    setLoading(true);
    try {
      const d = await hotelDetailApi.getAvis(hotelId);
      setAvis(d.items || d || []);
    } catch { setAvis([]); }
    setLoading(false);
  };

  const submitAvis = async (e) => {
    e.preventDefault(); setError(""); setPosting(true);
    try {
      await hotelDetailApi.postAvis(hotelId, { id_hotel: hotelId, ...form });
      setSuccess(true); setForm({ note: 5, commentaire: "" });
      await loadAvis();
    } catch (err) { setError(err.message); }
    setPosting(false);
  };

  const avgNote = avis.length > 0
    ? (avis.reduce((s, a) => s + a.note, 0) / avis.length).toFixed(1)
    : null;

  return (
    <div className="hd-avis-section" id="avis">
      <h2 className="hd-section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
        Avis clients
        {avgNote && <span className="hd-avg-note">★ {avgNote} ({avis.length} avis)</span>}
      </h2>

      {isClient && (
        <div className="hd-avis-form">
          <h3>Laissez votre avis</h3>
          {success && <div className="hd-avis-success">✓ Avis publié avec succès !</div>}
          {!success && (
            <form onSubmit={submitAvis}>
              <div className="hd-note-selector">
                <label>Votre note</label>
                <div className="hd-stars-input">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button type="button" key={n}
                      className={`hd-star-btn ${n <= form.note ? "on" : ""}`}
                      onClick={() => setForm({ ...form, note: n })}>★</button>
                  ))}
                  <span className="hd-note-label">
                    {["", "Mauvais", "Moyen", "Bien", "Très bien", "Excellent"][form.note]}
                  </span>
                </div>
              </div>
              <div className="hd-avis-field">
                <label>Commentaire</label>
                <textarea value={form.commentaire}
                  onChange={e => setForm({ ...form, commentaire: e.target.value })}
                  rows={3} placeholder="Partagez votre expérience..." required />
              </div>
              {error && <div className="hd-avis-error">{error}</div>}
              <button type="submit" className="hd-btn-avis" disabled={posting}>
                {posting ? <span className="hd-spin-sm" /> : "Publier mon avis"}
              </button>
            </form>
          )}
        </div>
      )}
      {!isClient && (
        <div className="hd-avis-notice">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          Connectez-vous pour laisser un avis
        </div>
      )}

      {loading ? (
        <div className="hd-avis-loading"><div className="hd-spin-sm" /></div>
      ) : avis.length === 0 ? (
        <div className="hd-avis-empty">Aucun avis pour le moment. Soyez le premier !</div>
      ) : (
        <div className="hd-avis-list">
          {avis.map(a => (
            <div key={a.id} className="hd-avis-item">
              <div className="hd-avis-header">
                <div className="hd-avis-avatar">
                  {(a.client?.prenom?.[0] || "?").toUpperCase()}
                </div>
                <div>
                  <div className="hd-avis-name">{a.client?.prenom || "Client"}</div>
                  <div className="hd-avis-date">{fmtDate(a.date || a.created_at)}</div>
                </div>
                <div className="hd-avis-note">{"★".repeat(a.note)}{"☆".repeat(5 - a.note)}</div>
              </div>
              {a.commentaire && <p className="hd-avis-text">{a.commentaire}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ══ PAGE PRINCIPALE HOTEL DÉTAIL ══════════════════════════
export default function HotelDetailPage({ hotelId, isClient, user, onBack, onReserver }) {
  const [hotel,   setHotel]   = useState(null);
  const [images,  setImages]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadHotel(); }, [hotelId]);

  const loadHotel = async () => {
    setLoading(true);
    try {
      const [h, imgs] = await Promise.all([
        hotelDetailApi.getHotel(hotelId),
        hotelDetailApi.getImages(hotelId).catch(() => ({ items: [] })),
      ]);
      setHotel(h);
      setImages((imgs.items || imgs || []).sort((a, b) => (a.type === "PRINCIPALE" ? -1 : 1)));
    } catch { }
    setLoading(false);
  };

  const handleSelectChambre = (selection) => { onReserver({ ...selection, hotel }); };

  if (loading) return (
    <div className="hd-loading">
      <div className="hd-spinner" />
      <p>Chargement des détails...</p>
    </div>
  );
  if (!hotel) return (
    <div className="hd-error">
      <h3>Hôtel introuvable</h3>
      <button onClick={onBack}>← Retour</button>
    </div>
  );

  return (
    <div className="hd-root">
      <div className="hd-breadcrumb">
        <button onClick={onBack} className="hd-back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Retour aux résultats
        </button>
        <span>/</span><span>Hôtels</span><span>/</span><span>{hotel.nom}</span>
      </div>

      <div className="hd-container">
        {/* ── En-tête ── */}
        <div className="hd-hero">
          <div className="hd-hero-left">
            <div className="hd-stars">{"★".repeat(hotel.etoiles)}</div>
            <h1 className="hd-nom">{hotel.nom}</h1>
            <div className="hd-location">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="10" r="3"/>
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              </svg>
              {hotel.ville || hotel.pays}
            </div>
          </div>
          {hotel.note_moyenne > 0 && (
            <div className="hd-note-badge">
              <span className="hd-note-num">{parseFloat(hotel.note_moyenne).toFixed(1)}</span>
              <div>
                <div className="hd-note-tag">
                  {hotel.note_moyenne >= 4.5 ? "Excellent" : hotel.note_moyenne >= 4 ? "Très bien" : "Bien"}
                </div>
                <div className="hd-note-sub">/ 5</div>
              </div>
            </div>
          )}
        </div>

        {/* ── Nav interne ── */}
        <div className="hd-inner-nav">
          {["disponibilite", "description", "avis"].map(s => (
            <button key={s} className="hd-nav-btn"
              onClick={() => document.getElementById(s)?.scrollIntoView({ behavior: "smooth" })}>
              {s === "disponibilite" ? "Dates & Chambres" : s === "description" ? "Description" : "Avis"}
            </button>
          ))}
        </div>

        {/* ── Galerie + résumé ── */}
        <div className="hd-main-grid">
          <div className="hd-left"><Galerie images={images} /></div>
          <div className="hd-right">
            <div className="hd-summary-card">
              <div className="hd-sum-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                </svg>
                <div>
                  <div className="hd-sum-label">Catégorie</div>
                  <div className="hd-sum-val">{"★".repeat(hotel.etoiles)} {hotel.etoiles} étoiles</div>
                </div>
              </div>
              <div className="hd-sum-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="10" r="3"/>
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                </svg>
                <div>
                  <div className="hd-sum-label">Localisation</div>
                  <div className="hd-sum-val">{hotel.ville || hotel.pays}</div>
                </div>
              </div>
              {hotel.note_moyenne > 0 && (
                <div className="hd-sum-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  <div>
                    <div className="hd-sum-label">Note moyenne</div>
                    <div className="hd-sum-val">{parseFloat(hotel.note_moyenne).toFixed(1)} / 5</div>
                  </div>
                </div>
              )}
            </div>
            <button className="hd-cta-dispo"
              onClick={() => document.getElementById("disponibilite")?.scrollIntoView({ behavior: "smooth" })}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Voir les disponibilités
            </button>
          </div>
        </div>

        {/* ── Description ── */}
        {hotel.description && (
          <div className="hd-description" id="description">
            <h2 className="hd-section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              Description
            </h2>
            <p>{hotel.description}</p>
          </div>
        )}

        <ChambresSection hotelId={hotelId} isClient={isClient} user={user} onSelectChambre={handleSelectChambre} />
        <AvisSection hotelId={hotelId} isClient={isClient} />
      </div>
    </div>
  );
}