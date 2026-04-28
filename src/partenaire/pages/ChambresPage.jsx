import { useState, useEffect } from "react";
import { hotelsApi, chambresApi, tarifsApi, imagesApi } from "../services/api";
import ChambreModal    from "../components/chambres/ChambreModal";
import TarifModal      from "../components/chambres/TarifModal";
import DisponibilitePage from "./DisponibilitePage";
import "./ChambresPage.css";

/* ── Hôtel item ────────────────────────────────────────── */
function HotelItem({ hotel, isActive, onClick }) {
  const [mainImg, setMainImg] = useState(null);
  useEffect(() => {
    imagesApi.list(hotel.id).then(data => {
      const imgs = Array.isArray(data) ? data : data?.items || [];
      const p = imgs.find(i => i.type === "PRINCIPALE") || imgs[0];
      if (p) setMainImg(p.url);
    }).catch(() => {});
  }, [hotel.id]);

  return (
    <button className={`cp-hotel-item ${isActive ? "active" : ""}`} onClick={onClick}>
      <div className="cp-hotel-thumb">
        {mainImg
          ? <img src={mainImg} alt={hotel.nom} />
          : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" width="22" height="22"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        }
      </div>
      <div className="cp-hotel-info">
        <span className="cp-hotel-nom">{hotel.nom}</span>
        <span className="cp-hotel-loc">{hotel.ville || hotel.pays}</span>
      </div>
      <div className="cp-hotel-stars">
        {[1,2,3,4,5].map(n => (
          <span key={n} className={n <= (hotel.etoiles||0) ? "cps-on" : "cps-off"}>★</span>
        ))}
      </div>
    </button>
  );
}

/* ── Chambre card ──────────────────────────────────────── */
function ChambreCard({ chambre, isSelected, onEdit, onSelectTarifs }) {
  return (
    <div className={`cp-chambre-card ${isSelected ? "selected" : ""}`}
      onClick={() => onSelectTarifs(chambre)}>

      {isSelected && <div className="cp-chambre-sel-bar" />}

      <div className="cp-chambre-top">
        <span className="cp-chambre-badge">{chambre.type_chambre?.nom || "—"}</span>
        {!chambre.actif && <span className="cp-inactif-tag">Inactif</span>}
      </div>

      <div className="cp-chambre-body">
        {/* Stock total */}
        <div className="cp-stock-row">
          <div className="cp-stock-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="13" height="13">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
          </div>
          <strong>{chambre.nb_chambres ?? 1}</strong>
          <span>chambre{(chambre.nb_chambres ?? 1) > 1 ? "s" : ""} disponible{(chambre.nb_chambres ?? 1) > 1 ? "s" : ""}</span>
        </div>

        <div className="cp-capacite">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="13" height="13">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          {chambre.capacite} personne{chambre.capacite > 1 ? "s" : ""} / chambre
        </div>

        {chambre.description && (
          <p className="cp-chambre-desc">{chambre.description}</p>
        )}

        {chambre.prix_min != null && (
          <div className="cp-prix-pill">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="11" height="11">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
            <span className="cp-prix-lbl">Tarif</span>
            <span className="cp-prix-val">
              {chambre.prix_min === chambre.prix_max
                ? `${Number(chambre.prix_min).toFixed(0)} TND`
                : `${Number(chambre.prix_min).toFixed(0)}–${Number(chambre.prix_max).toFixed(0)} TND`}
              <em>/nuit</em>
            </span>
          </div>
        )}
      </div>

      <div className="cp-chambre-footer">
        <button className={`cp-btn-tarifs ${isSelected ? "active" : ""}`}
          onClick={e => { e.stopPropagation(); onSelectTarifs(chambre); }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
            <line x1="12" y1="1" x2="12" y2="23"/>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
          Tarifs
        </button>
        <button className="cp-btn-edit"
          onClick={e => { e.stopPropagation(); onEdit(chambre); }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Modifier
        </button>
      </div>
    </div>
  );
}

/* ── Tarif row ─────────────────────────────────────────── */
function TarifRow({ tarif, onEdit, onDelete }) {
  const now      = new Date();
  const debut    = new Date(tarif.date_debut);
  const fin      = new Date(tarif.date_fin);
  const isActive  = debut <= now && fin >= now;
  const isExpired = fin < now;
  const isUpcoming = debut > now;

  const fmt = d => new Date(d).toLocaleDateString("fr-FR", { day:"2-digit", month:"short", year:"numeric" });

  return (
    <div className={`cp-tarif-row ${isActive?"active":""} ${isExpired?"expired":""}`}>
      <div className="cp-tarif-left">
        <div className="cp-tarif-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <div className="cp-tarif-info">
          <div className="cp-tarif-dates">
            {fmt(tarif.date_debut)}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="11" height="11" className="cp-arrow-icon">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
            {fmt(tarif.date_fin)}
          </div>
          <div className="cp-tarif-meta">
            <span className="cp-type-tag">{tarif.type_reservation?.nom || `Type #${tarif.id_type_reservation}`}</span>
            {isActive   && <span className="cp-status-badge cp-s-active">En cours</span>}
            {isUpcoming && <span className="cp-status-badge cp-s-upcoming">À venir</span>}
            {isExpired  && <span className="cp-status-badge cp-s-expired">Expiré</span>}
          </div>
        </div>
      </div>

      <div className="cp-tarif-prix">
        <span className="cp-prix-num">{parseFloat(tarif.prix).toFixed(0)}</span>
        <div className="cp-prix-unit">
          <span>TND</span>
          <span>/nuit</span>
        </div>
      </div>

      <div className="cp-tarif-actions">
        <button className="cp-taction cp-ta-edit" onClick={() => onEdit(tarif)} title="Modifier">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button className="cp-taction cp-ta-del" onClick={() => onDelete(tarif)} title="Supprimer">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14H6L5 6"/>
            <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE PRINCIPALE
══════════════════════════════════════════════════════════ */
export default function ChambresPage() {
  const [hotels,           setHotels]           = useState([]);
  const [selectedHotel,    setSelectedHotel]    = useState(null);
  const [chambres,         setChambres]         = useState([]);
  const [selectedChambre,  setSelectedChambre]  = useState(null);
  const [tarifs,           setTarifs]           = useState([]);
  const [typesChambres,    setTypesChambres]    = useState([]);
  const [typesReservation, setTypesReservation] = useState([]);

  const [loadingHotels,   setLoadingHotels]   = useState(true);
  const [loadingChambres, setLoadingChambres] = useState(false);
  const [loadingTarifs,   setLoadingTarifs]   = useState(false);
  const [errorHotels,     setErrorHotels]     = useState("");
  const [errorChambres,   setErrorChambres]   = useState("");
  const [errorTarifs,     setErrorTarifs]     = useState("");

  const [chambreModal, setChambreModal] = useState({ open:false, data:null });
  const [tarifModal,   setTarifModal]   = useState({ open:false, data:null });
  const [showDispo,    setShowDispo]    = useState(false);

  useEffect(() => { loadInit(); }, []);

  const loadInit = async () => {
    setLoadingHotels(true); setErrorHotels("");
    try {
      const [hotelsData, typCh, typRes] = await Promise.all([
        hotelsApi.mesHotels(),
        hotelsApi.listTypesChambre(),
        hotelsApi.listTypesReservation(),
      ]);
      const list = hotelsData?.items || [];
      setHotels(list);
      setTypesChambres(typCh || []);
      setTypesReservation(typRes || []);
      if (list.length > 0) { setSelectedHotel(list[0]); loadChambres(list[0].id); }
    } catch (err) { setErrorHotels(err.message || "Erreur chargement hôtels"); }
    finally { setLoadingHotels(false); }
  };

  const loadChambres = async hotelId => {
    setLoadingChambres(true); setErrorChambres("");
    setSelectedChambre(null); setTarifs([]);
    try { const data = await chambresApi.list(hotelId); setChambres(data?.items || []); }
    catch (err) { setErrorChambres(err.message || "Erreur chargement chambres"); }
    finally { setLoadingChambres(false); }
  };

  const loadTarifs = async (hotelId, chambreId) => {
    setLoadingTarifs(true); setErrorTarifs("");
    try { const data = await tarifsApi.list(hotelId, chambreId); setTarifs(data?.items || []); }
    catch (err) { setErrorTarifs(err.message || "Erreur chargement tarifs"); }
    finally { setLoadingTarifs(false); }
  };

  const handleSelectHotel   = hotel   => { setSelectedHotel(hotel); loadChambres(hotel.id); };
  const handleSelectChambre = chambre => { setSelectedChambre(chambre); loadTarifs(selectedHotel.id, chambre.id); };

  const handleSaveChambre = async form => {
    if (chambreModal.data) await chambresApi.update(selectedHotel.id, chambreModal.data.id, form);
    else                   await chambresApi.create(selectedHotel.id, form);
    await loadChambres(selectedHotel.id);
  };
  const handleSaveTarif = async form => {
    if (tarifModal.data) await tarifsApi.update(selectedHotel.id, selectedChambre.id, tarifModal.data.id, form);
    else                 await tarifsApi.create(selectedHotel.id, selectedChambre.id, form);
    await loadTarifs(selectedHotel.id, selectedChambre.id);
  };
  const handleDeleteTarif = async tarif => {
    if (!confirm("Supprimer ce tarif ?")) return;
    try { await tarifsApi.delete(selectedHotel.id, selectedChambre.id, tarif.id); await loadTarifs(selectedHotel.id, selectedChambre.id); }
    catch (err) { alert("Erreur : " + err.message); }
  };

  if (showDispo && selectedHotel) {
    return (
      <DisponibilitePage
        hotelId={selectedHotel.id}
        hotelNom={selectedHotel.nom}
        onBack={() => setShowDispo(false)}
      />
    );
  }

  const totalChambresPhysiques = chambres.reduce((s, c) => s + (c.nb_chambres ?? 1), 0);

  return (
    <div className="cp-page">

      {/* ── Header ──────────────────────────────────────── */}
      <header className="cp-page-header">
        <div className="cp-title-block">
          <div className="cp-eyebrow">
            <span className="cp-eyebrow-dot" />
            Gestion tarifaire
          </div>
          <h1 className="cp-page-title">Chambres & Tarifs</h1>
          <p className="cp-page-desc">Gérez vos types de chambres et grilles tarifaires</p>
        </div>
        {selectedHotel && (
          <button className="cp-btn-dispo" onClick={() => setShowDispo(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Disponibilités
          </button>
        )}
      </header>

      {/* ── Layout 3 colonnes ───────────────────────────── */}
      <div className="cp-layout">

        {/* Col 1 — Hôtels */}
        <div className="cp-col cp-col-hotels">
          <div className="cp-col-header">
            <div className="cp-col-header-left">
              <div className="cp-col-icon blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
              <span className="cp-col-title">Mes Hôtels</span>
            </div>
            <span className="cp-col-count blue">{hotels.length}</span>
          </div>

          <div className="cp-col-body">
            {loadingHotels ? (
              <div className="cp-col-state">
                <div className="cp-loader"><div className="cp-ring"/><div className="cp-ring cp-ring2"/></div>
              </div>
            ) : errorHotels ? (
              <div className="cp-col-err">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {errorHotels}
                <button onClick={loadInit}>↺</button>
              </div>
            ) : hotels.length === 0 ? (
              <div className="cp-col-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8" width="40" height="40"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                <p>Aucun hôtel</p>
              </div>
            ) : (
              <div className="cp-hotels-list">
                {hotels.map(h => (
                  <HotelItem key={h.id} hotel={h} isActive={selectedHotel?.id === h.id}
                    onClick={() => handleSelectHotel(h)} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Col 2 — Types de chambres */}
        <div className="cp-col cp-col-chambres">
          <div className="cp-col-header">
            <div className="cp-col-header-left">
              <div className="cp-col-icon gold">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15">
                  <path d="M3 7h18M3 12h18M3 17h18"/>
                </svg>
              </div>
              <span className="cp-col-title">Types de chambres</span>
            </div>
            <div className="cp-col-header-right">
              {selectedHotel && chambres.length > 0 && (
                <div className="cp-col-stats">
                  <span className="cp-col-count gold">{chambres.length} type{chambres.length>1?"s":""}</span>
                  <span className="cp-col-sep">·</span>
                  <span className="cp-col-count slate">{totalChambresPhysiques} chambre{totalChambresPhysiques>1?"s":""}</span>
                </div>
              )}
              {selectedHotel && (
                <button className="cp-btn-add" onClick={() => setChambreModal({ open:true, data:null })}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Ajouter
                </button>
              )}
            </div>
          </div>

          <div className="cp-col-body">
            {!selectedHotel ? (
              <div className="cp-col-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" width="36" height="36"><polyline points="9 18 15 12 9 6"/></svg>
                <p>Sélectionnez un hôtel</p>
              </div>
            ) : loadingChambres ? (
              <div className="cp-col-state">
                <div className="cp-loader"><div className="cp-ring"/><div className="cp-ring cp-ring2"/></div>
              </div>
            ) : errorChambres ? (
              <div className="cp-col-err">{errorChambres} <button onClick={() => loadChambres(selectedHotel.id)}>↺</button></div>
            ) : chambres.length === 0 ? (
              <div className="cp-col-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8" width="40" height="40"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-4 0v2"/></svg>
                <p>Aucun type de chambre</p>
                <button className="cp-btn-add-empty" onClick={() => setChambreModal({ open:true, data:null })}>+ Ajouter un type</button>
              </div>
            ) : (
              <div className="cp-chambres-list">
                {chambres.map(ch => (
                  <ChambreCard key={ch.id} chambre={ch}
                    isSelected={selectedChambre?.id === ch.id}
                    onEdit={c => setChambreModal({ open:true, data:c })}
                    onSelectTarifs={handleSelectChambre}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Col 3 — Tarifs */}
        <div className="cp-col cp-col-tarifs">
          <div className="cp-col-header">
            <div className="cp-col-header-left">
              <div className="cp-col-icon green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15">
                  <line x1="12" y1="1" x2="12" y2="23"/>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
              <span className="cp-col-title">Tarifs</span>
              {selectedChambre && (
                <span className="cp-chambre-tag">{selectedChambre.type_chambre?.nom}</span>
              )}
            </div>
            {selectedChambre && (
              <button className="cp-btn-add" onClick={() => setTarifModal({ open:true, data:null })}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Ajouter
              </button>
            )}
          </div>

          <div className="cp-col-body">
            {!selectedChambre ? (
              <div className="cp-col-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" width="36" height="36"><polyline points="9 18 15 12 9 6"/></svg>
                <p>Sélectionnez un type de chambre</p>
              </div>
            ) : loadingTarifs ? (
              <div className="cp-col-state">
                <div className="cp-loader"><div className="cp-ring"/><div className="cp-ring cp-ring2"/></div>
              </div>
            ) : errorTarifs ? (
              <div className="cp-col-err">{errorTarifs} <button onClick={() => loadTarifs(selectedHotel.id, selectedChambre.id)}>↺</button></div>
            ) : tarifs.length === 0 ? (
              <div className="cp-col-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8" width="40" height="40"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                <p>Aucun tarif défini</p>
                <button className="cp-btn-add-empty" onClick={() => setTarifModal({ open:true, data:null })}>+ Ajouter un tarif</button>
              </div>
            ) : (
              <div className="cp-tarifs-list">
                {tarifs.map(t => (
                  <TarifRow key={t.id} tarif={t}
                    onEdit={t => setTarifModal({ open:true, data:t })}
                    onDelete={handleDeleteTarif}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {chambreModal.open && (
        <ChambreModal
          chambre={chambreModal.data}
          typesChambres={typesChambres}
          hotel={selectedHotel}
          onClose={() => setChambreModal({ open:false, data:null })}
          onSave={handleSaveChambre}
        />
      )}
      {tarifModal.open && (
        <TarifModal tarif={tarifModal.data} typesReservation={typesReservation}
          onClose={() => setTarifModal({ open:false, data:null })}
          onSave={handleSaveTarif} />
      )}
    </div>
  );
}