// src/admin/pages/catalogue/CatalogueCreate.jsx
import { useState } from "react";
import "./CatalogueCreate.css";
import { BASE, auth } from "./constants";
import { stars } from "./utils";
import { SpinnerInline } from "./CatalogueUI";

export default function CatalogueCreate({ hotels, voyages, onCreated, onCancel }) {
  const [titre,      setTitre]      = useState("");
  const [selHotels,  setSelHotels]  = useState([]);
  const [selVoyages, setSelVoyages] = useState([]);
  const [search,     setSearch]     = useState("");
  const [generating, setGenerating] = useState(false);

  // ── Filtrage local ────────────────────────────────────
  const filteredHotels = hotels.filter(h =>
    !search ||
    h.nom.toLowerCase().includes(search.toLowerCase()) ||
    (h.ville || "").toLowerCase().includes(search.toLowerCase())
  );
  const filteredVoyages = voyages.filter(v =>
    !search ||
    v.titre.toLowerCase().includes(search.toLowerCase()) ||
    (v.destination || "").toLowerCase().includes(search.toLowerCase())
  );

  const toggleH = (id) => setSelHotels(p  => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleV = (id) => setSelVoyages(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  // ── Génération ────────────────────────────────────────
  const handleGenerer = async () => {
    if (!selHotels.length && !selVoyages.length)
      return alert("Sélectionnez au moins un hôtel ou un voyage");
    setGenerating(true);
    try {
      const r = await fetch(`${BASE}/catalogues/generer`, {
        method: "POST", headers: auth(),
        body: JSON.stringify({
          titre:      titre.trim() || "Notre sélection EasyVoyage",
          hotel_ids:  selHotels,
          voyage_ids: selVoyages,
        }),
      });
      if (!r.ok) throw new Error((await r.json()).detail || "Erreur");
      onCreated(await r.json());
    } catch (e) { alert("Erreur : " + e.message); }
    setGenerating(false);
  };

  return (
    <div className="cat-create">

      {/* ── Titre ────────────────────────────────────── */}
      <div className="cat-create__heading">
        <h1>✨ Nouveau catalogue</h1>
        <p>Claude AI génère automatiquement le sujet et la description marketing</p>
      </div>

      {/* ── Titre du catalogue ──────────────────────── */}
      <div className="cat-create__field">
        <label className="cat-create__label">Titre du catalogue</label>
        <input
          className="cat-input cat-input--lg"
          value={titre}
          onChange={e => setTitre(e.target.value)}
          placeholder="Ex: Offres Été Tunisie, Promos Djerba, Circuit Sahara..."
        />
      </div>

      {/* ── Recherche ────────────────────────────────── */}
      <div className="cat-create__field">
        <label className="cat-create__label">Rechercher hôtels & voyages</label>
        <input
          className="cat-input"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Nom, ville, destination..."
        />
      </div>

      {/* ── Grille hôtels / voyages ───────────────────── */}
      <div className="cat-create__grid">

        {/* Hôtels */}
        <div>
          <div className="cat-create__col-header">
            <span>🏨 Hôtels</span>
            <span className={`cat-create__col-count${selHotels.length > 0 ? " cat-create__col-count--active" : ""}`}>
              {selHotels.length} sélectionné{selHotels.length > 1 ? "s" : ""}
            </span>
          </div>
          <div className="cat-create__items-list">
            {filteredHotels.map(h => {
              const sel      = selHotels.includes(h.id);
              const hasPromo = h.promotion_active && h.promotion_pourcentage > 0;
              return (
                <div
                  key={h.id}
                  className={`cat-item-chip${sel ? " cat-item-chip--selected" : ""}`}
                  onClick={() => toggleH(h.id)}
                >
                  <div className={`cat-item-chip__check${sel ? " cat-item-chip__check--filled" : " cat-item-chip__check--empty"}`}>
                    {sel && "✓"}
                  </div>
                  <div className="cat-item-chip__body">
                    <div className="cat-item-chip__name">
                      {h.nom}
                      {hasPromo && (
                        <span className="cat-item-chip__promo-badge">
                          -{Math.round(h.promotion_pourcentage)}%
                        </span>
                      )}
                    </div>
                    <div className="cat-item-chip__sub">
                      <span>{h.ville} · {stars(h.etoiles)}</span>
                      {h.prix_min && (
                        <span className={`cat-item-chip__price${hasPromo ? " cat-item-chip__price--promo" : ""}`}>
                          {hasPromo && h.prix_min_promo
                            ? `${Math.round(h.prix_min_promo)} DT`
                            : `${Math.round(h.prix_min)} DT`}/nuit
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredHotels.length === 0 && (
              <p className="cat-create__no-result">Aucun résultat</p>
            )}
          </div>
        </div>

        {/* Voyages */}
        <div>
          <div className="cat-create__col-header">
            <span>✈️ Voyages</span>
            <span className={`cat-create__col-count${selVoyages.length > 0 ? " cat-create__col-count--active" : ""}`}>
              {selVoyages.length} sélectionné{selVoyages.length > 1 ? "s" : ""}
            </span>
          </div>
          <div className="cat-create__items-list">
            {filteredVoyages.map(v => {
              const sel = selVoyages.includes(v.id);
              return (
                <div
                  key={v.id}
                  className={`cat-item-chip${sel ? " cat-item-chip--selected" : ""}`}
                  onClick={() => toggleV(v.id)}
                >
                  <div className={`cat-item-chip__check${sel ? " cat-item-chip__check--filled" : " cat-item-chip__check--empty"}`}>
                    {sel && "✓"}
                  </div>
                  <div className="cat-item-chip__body">
                    <div className="cat-item-chip__name">{v.titre}</div>
                    <div className="cat-item-chip__sub">
                      {v.destination} · {v.duree}j · {parseInt(v.prix_base)} DT
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredVoyages.length === 0 && (
              <p className="cat-create__no-result">Aucun résultat</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Actions ──────────────────────────────────── */}
      <div className="cat-create__actions">
        <button
          className="cat-btn-primary cat-btn-primary--lg"
          onClick={handleGenerer}
          disabled={generating}
        >
          {generating ? <><SpinnerInline /> Génération en cours...</> : "✨ Générer avec Claude AI"}
        </button>
        <button className="cat-btn-ghost" onClick={onCancel}>Annuler</button>
      </div>
    </div>
  );
}