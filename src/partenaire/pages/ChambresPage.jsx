import { useState, useEffect } from "react";
import { hotelsApi, chambresApi, tarifsApi, imagesApi } from "../services/api";
import ChambreModal from "../components/chambres/ChambreModal";
import TarifModal from "../components/chambres/TarifModal";
import DisponibilitePage from "./DisponibilitePage";
import "./ChambresPage.css";

function HotelItem({ hotel, isActive, onClick }) {
  const [mainImg, setMainImg] = useState(null);

  useEffect(() => {
    imagesApi.list(hotel.id).then((data) => {
      const imgs = Array.isArray(data) ? data : data?.items || [];
      const principale = imgs.find((i) => i.type === "PRINCIPALE") || imgs[0];
      if (principale) setMainImg(principale.url);
    }).catch(() => {});
  }, [hotel.id]);

  return (
    <button className={`hotel-item ${isActive ? "active" : ""}`} onClick={onClick}>
      <div className="hotel-item-img">
        {mainImg ? <img src={mainImg} alt={hotel.nom} /> : "🏨"}
      </div>
      <div className="hotel-item-info">
        <span className="hotel-item-nom">{hotel.nom}</span>
        <span className="hotel-item-pays">{hotel.ville || hotel.pays}</span>
      </div>
      <span className="hotel-item-stars">{"★".repeat(hotel.etoiles)}</span>
    </button>
  );
}

function ChambreCard({ chambre, isSelected, onEdit, onSelectTarifs }) {
  return (
    <div className={`chambre-card ${isSelected ? "selected" : ""}`}>
      <div className="chambre-card-header">
        <span className="chambre-type-badge">{chambre.type_chambre?.nom || "—"}</span>
        {!chambre.actif && <span className="chambre-inactif">Inactif</span>}
      </div>
      <div className="chambre-card-body">
        <div className="chambre-capacite">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          {chambre.capacite} personne{chambre.capacite > 1 ? "s" : ""}
        </div>
        {chambre.description && <p className="chambre-desc">{chambre.description}</p>}
        {chambre.prix_min && (
          <div className="chambre-prix-tag">
            <span className="prix-label">Tarif courant</span>
            <span className="prix-val">
              {chambre.prix_min === chambre.prix_max
                ? `${chambre.prix_min?.toFixed(0)} TND/nuit`
                : `${chambre.prix_min?.toFixed(0)} – ${chambre.prix_max?.toFixed(0)} TND/nuit`}
            </span>
          </div>
        )}
      </div>
      <div className="chambre-card-actions">
        <button className={`btn-tarifs ${isSelected ? "active" : ""}`} onClick={() => onSelectTarifs(chambre)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="1" x2="12" y2="23"/>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
          Tarifs
        </button>
        <button className="btn-edit-chambre" onClick={() => onEdit(chambre)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Modifier
        </button>
      </div>
    </div>
  );
}

function TarifRow({ tarif, onEdit, onDelete }) {
  const now = new Date();
  const debut = new Date(tarif.date_debut);
  const fin   = new Date(tarif.date_fin);
  const isActive   = debut <= now && fin >= now;
  const isExpired  = fin < now;
  const isUpcoming = debut > now;

  const fmt = (d) => new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className={`tarif-row ${isActive ? "active-tarif" : ""} ${isExpired ? "expired" : ""}`}>
      <div className="tarif-content">
        <div className="tarif-periode-row">
          <div className="tarif-periode-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <span className="tarif-dates">
            {fmt(tarif.date_debut)}
            <span className="date-sep">→</span>
            {fmt(tarif.date_fin)}
          </span>
          {isActive   && <span className="tarif-status-badge active">En cours</span>}
          {isUpcoming && <span className="tarif-status-badge upcoming">À venir</span>}
          {isExpired  && <span className="tarif-status-badge expired">Expiré</span>}
        </div>
        <div className="tarif-bottom-row">
          <span className="tarif-type-tag">
            {tarif.type_reservation?.nom || `Type #${tarif.id_type_reservation}`}
          </span>
        </div>
      </div>

      <div className="tarif-prix-block">
        <span className="prix-montant">{parseFloat(tarif.prix).toFixed(0)}</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <span className="prix-currency">TND</span>
          <span className="prix-per-night">/nuit</span>
        </div>
      </div>

      <div className="tarif-actions">
        <button className="tarif-btn-edit" onClick={() => onEdit(tarif)} title="Modifier">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button className="tarif-btn-delete" onClick={() => onDelete(tarif)} title="Supprimer">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14H6L5 6"/>
            <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function ChambresPage() {
  const [hotels, setHotels] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [chambres, setChambres] = useState([]);
  const [selectedChambre, setSelectedChambre] = useState(null);
  const [tarifs, setTarifs] = useState([]);
  const [typesChambres, setTypesChambres] = useState([]);
  const [typesReservation, setTypesReservation] = useState([]);
  const [loadingHotels, setLoadingHotels] = useState(true);
  const [loadingChambres, setLoadingChambres] = useState(false);
  const [loadingTarifs, setLoadingTarifs] = useState(false);
  const [chambreModal, setChambreModal] = useState({ open: false, data: null });
  const [tarifModal, setTarifModal] = useState({ open: false, data: null });
  const [showDispo, setShowDispo] = useState(false);

  useEffect(() => { loadInit(); }, []);

  const loadInit = async () => {
    setLoadingHotels(true);
    try {
      const [hotelsData, typCh, typRes] = await Promise.all([
        hotelsApi.list(),
        hotelsApi.listTypesChambre(),
        hotelsApi.listTypesReservation(),
      ]);
      const list = hotelsData.items || [];
      setHotels(list);
      setTypesChambres(typCh || []);
      setTypesReservation(typRes || []);
      if (list.length > 0) { setSelectedHotel(list[0]); loadChambres(list[0].id); }
    } finally { setLoadingHotels(false); }
  };

  const loadChambres = async (hotelId) => {
    setLoadingChambres(true); setSelectedChambre(null); setTarifs([]);
    try {
      const data = await chambresApi.list(hotelId);
      setChambres(data.items || []);
    } finally { setLoadingChambres(false); }
  };

  const loadTarifs = async (hotelId, chambreId) => {
    setLoadingTarifs(true);
    try {
      const data = await tarifsApi.list(hotelId, chambreId);
      setTarifs(data.items || []);
    } finally { setLoadingTarifs(false); }
  };

  const handleSelectHotel = (hotel) => { setSelectedHotel(hotel); loadChambres(hotel.id); };
  const handleSelectChambre = (chambre) => { setSelectedChambre(chambre); loadTarifs(selectedHotel.id, chambre.id); };

  const handleSaveChambre = async (form) => {
    if (chambreModal.data) await chambresApi.update(selectedHotel.id, chambreModal.data.id, form);
    else await chambresApi.create(selectedHotel.id, form);
    await loadChambres(selectedHotel.id);
  };

  const handleSaveTarif = async (form) => {
    if (tarifModal.data) await tarifsApi.update(selectedHotel.id, selectedChambre.id, tarifModal.data.id, form);
    else await tarifsApi.create(selectedHotel.id, selectedChambre.id, form);
    await loadTarifs(selectedHotel.id, selectedChambre.id);
  };

  const handleDeleteTarif = async (tarif) => {
    if (!confirm("Supprimer ce tarif ?")) return;
    await tarifsApi.delete(selectedHotel.id, selectedChambre.id, tarif.id);
    await loadTarifs(selectedHotel.id, selectedChambre.id);
  };

  // ── Page disponibilités
  if (showDispo && selectedHotel) {
    return (
      <DisponibilitePage
        hotelId={selectedHotel.id}
        hotelNom={selectedHotel.nom}
        onBack={() => setShowDispo(false)}
      />
    );
  }

  return (
    <div className="chambres-page">
      <div className="chambres-header">
        <div>
          <h1 className="chambres-title">Chambres & Tarifs</h1>
          <p className="chambres-subtitle">Gérez vos chambres et grilles tarifaires</p>
        </div>
        {selectedHotel && (
          <button className="btn-dispo" onClick={() => setShowDispo(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Disponibilités
          </button>
        )}
      </div>

      <div className="chambres-layout">
        {/* Colonne 1 — Hôtels */}
        <div className="col-hotels">
          <div className="col-header">
            <div className="col-header-left">
              <span className="col-title">Mes Hôtels</span>
              <span className="col-count">{hotels.length}</span>
            </div>
          </div>
          {loadingHotels ? <div className="col-loading"><span className="mini-spinner" /></div>
          : hotels.length === 0 ? <div className="col-empty"><span>🏨</span><p>Aucun hôtel</p></div>
          : <div className="hotel-list">
              {hotels.map((h) => (
                <HotelItem key={h.id} hotel={h} isActive={selectedHotel?.id === h.id} onClick={() => handleSelectHotel(h)} />
              ))}
            </div>}
        </div>

        {/* Colonne 2 — Chambres */}
        <div className="col-chambres">
          <div className="col-header">
            <div className="col-header-left">
              <span className="col-title">Chambres</span>
              {selectedHotel && <span className="col-count">{chambres.length}</span>}
            </div>
            {selectedHotel && (
              <button className="btn-col-add" onClick={() => setChambreModal({ open: true, data: null })}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Ajouter
              </button>
            )}
          </div>
          {!selectedHotel ? <div className="col-empty"><span>👆</span><p>Sélectionnez un hôtel</p></div>
          : loadingChambres ? <div className="col-loading"><span className="mini-spinner" /></div>
          : chambres.length === 0 ? (
            <div className="col-empty">
              <span>🛏️</span><p>Aucune chambre</p>
              <button className="btn-col-add-empty" onClick={() => setChambreModal({ open: true, data: null })}>Ajouter une chambre</button>
            </div>
          ) : (
            <div className="chambres-list">
              {chambres.map((ch) => (
                <ChambreCard key={ch.id} chambre={ch}
                  isSelected={selectedChambre?.id === ch.id}
                  onEdit={(c) => setChambreModal({ open: true, data: c })}
                  onSelectTarifs={handleSelectChambre}
                />
              ))}
            </div>
          )}
        </div>

        {/* Colonne 3 — Tarifs */}
        <div className="col-tarifs">
          <div className="col-header">
            <div className="col-header-left">
              <span className="col-title">Tarifs</span>
              {selectedChambre && <span className="tarifs-chambre-name">{selectedChambre.type_chambre?.nom}</span>}
            </div>
            {selectedChambre && (
              <button className="btn-col-add" onClick={() => setTarifModal({ open: true, data: null })}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Ajouter
              </button>
            )}
          </div>
          {!selectedChambre ? <div className="col-empty"><span>👆</span><p>Sélectionnez une chambre</p></div>
          : loadingTarifs ? <div className="col-loading"><span className="mini-spinner" /></div>
          : tarifs.length === 0 ? (
            <div className="col-empty">
              <span>💰</span><p>Aucun tarif défini</p>
              <button className="btn-col-add-empty" onClick={() => setTarifModal({ open: true, data: null })}>Ajouter un tarif</button>
            </div>
          ) : (
            <div className="tarifs-list">
              {tarifs.map((t) => (
                <TarifRow key={t.id} tarif={t}
                  onEdit={(t) => setTarifModal({ open: true, data: t })}
                  onDelete={handleDeleteTarif}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {chambreModal.open && (
        <ChambreModal chambre={chambreModal.data} typesChambres={typesChambres}
          onClose={() => setChambreModal({ open: false, data: null })} onSave={handleSaveChambre} />
      )}
      {tarifModal.open && (
        <TarifModal tarif={tarifModal.data} typesReservation={typesReservation}
          onClose={() => setTarifModal({ open: false, data: null })} onSave={handleSaveTarif} />
      )}
    </div>
  );
}