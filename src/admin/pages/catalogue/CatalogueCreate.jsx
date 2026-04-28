// src/admin/pages/catalogue/CatalogueCreate.jsx
import { useState, useMemo } from "react";
import "./CatalogueCreate.css";
import { BASE, auth } from "./constants";
import { stars } from "./utils";
import { SpinnerInline } from "./CatalogueUI";

export default function CatalogueCreate({ hotels, voyages, onCreated, onCancel, loading = false }) {
  const [titre,      setTitre]      = useState("");
  const [selHotels,  setSelHotels]  = useState([]);
  const [selVoyages, setSelVoyages] = useState([]);
  const [search,     setSearch]     = useState("");
  const [generating, setGenerating] = useState(false);

  // ── Sécurisation : on s'assure que ce sont bien des tableaux ──
  const safeHotels  = Array.isArray(hotels)  ? hotels  : [];
  const safeVoyages = Array.isArray(voyages) ? voyages : [];

  // ── Filtrage local (résistant aux champs null/undefined) ──
  const filteredHotels = useMemo(() => {
    const q = (search || "").toLowerCase().trim();
    return safeHotels.filter(h => {
      if (!h || typeof h !== "object") return false;
      if (!q) return true;
      const nom   = (h.nom   || "").toLowerCase();
      const ville = (h.ville || "").toLowerCase();
      return nom.includes(q) || ville.includes(q);
    });
  }, [safeHotels, search]);

  const filteredVoyages = useMemo(() => {
    const q = (search || "").toLowerCase().trim();
    return safeVoyages.filter(v => {
      if (!v || typeof v !== "object") return false;
      if (!q) return true;
      const titre       = (v.titre       || "").toLowerCase();
      const destination = (v.destination || "").toLowerCase();
      return titre.includes(q) || destination.includes(q);
    });
  }, [safeVoyages, search]);

  const toggleH = (id) => setSelHotels(p  => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleV = (id) => setSelVoyages(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  // ── Comptage promos sélectionnées ─────────────────────
  const promosSelectionnees = safeHotels.filter(
    h => selHotels.includes(h.id) && h.promotion_active && h.promotion_pourcentage > 0
  );

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
        <label className="cat-create__label">Rechercher hôtels &amp; voyages</label>
        <input
          className="cat-input"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Nom, ville, destination..."
        />
      </div>

      {/* ── Alerte promos détectées ───────────────────── */}
      {promosSelectionnees.length > 0 && (
        <div className="cat-create__promo-alert">
          🔥 <strong>{promosSelectionnees.length} promotion{promosSelectionnees.length > 1 ? "s" : ""} active{promosSelectionnees.length > 1 ? "s" : ""}</strong> détectée{promosSelectionnees.length > 1 ? "s" : ""} —
          Claude AI les intégrera dans la description marketing
          &nbsp;({promosSelectionnees.map(h => `-${Math.round(h.promotion_pourcentage)}% ${h.nom}`).join(", ")})
        </div>
      )}

      {/* ── Grille hôtels / voyages ───────────────────── */}
      <div className="cat-create__grid">

        {/* ═══════════ HÔTELS ═══════════ */}
        <div className="cat-create__col">
          <div className="cat-create__col-header">
            <span>🏨 Hôtels</span>
            <span className={`cat-create__col-count${selHotels.length > 0 ? " cat-create__col-count--active" : ""}`}>
              {selHotels.length} sélectionné{selHotels.length > 1 ? "s" : ""}
            </span>
          </div>
          <div className="cat-create__items-list">
            {loading ? (
              <p className="cat-create__no-result">⏳ Chargement des hôtels...</p>
            ) : filteredHotels.length === 0 ? (
              <p className="cat-create__no-result">
                {safeHotels.length === 0
                  ? "Aucun hôtel disponible"
                  : "Aucun résultat pour cette recherche"}
              </p>
            ) : (
              filteredHotels.map(h => {
                const sel      = selHotels.includes(h.id);
                const hasPromo = h.promotion_active && h.promotion_pourcentage > 0;
                const prixAff  = hasPromo && h.prix_min_promo
                  ? Math.round(h.prix_min_promo)
                  : h.prix_min ? Math.round(h.prix_min) : null;

                return (
                  <div
                    key={h.id}
                    className={`cat-item-chip${sel ? " cat-item-chip--selected" : ""}${hasPromo ? " cat-item-chip--has-promo" : ""}`}
                    onClick={() => toggleH(h.id)}
                  >
                    <div className={`cat-item-chip__check${sel ? " cat-item-chip__check--filled" : " cat-item-chip__check--empty"}`}>
                      {sel && "✓"}
                    </div>

                    <div className="cat-item-chip__body">
                      {/* Ligne nom + badge % */}
                      <div className="cat-item-chip__name">
                        {h.nom || "Hôtel sans nom"}
                        {hasPromo && (
                          <span
                            className="cat-item-chip__promo-badge"
                            title={h.promotion_titre || `Promotion active -${Math.round(h.promotion_pourcentage)}%`}
                          >
                            🔥 -{Math.round(h.promotion_pourcentage)}%
                          </span>
                        )}
                      </div>

                      {/* Ligne ville + étoiles + prix */}
                      <div className="cat-item-chip__sub">
                        <span>{h.ville || "—"} · {stars(h.etoiles)}</span>

                        {h.prix_min && (
                          <span className="cat-item-chip__prix-wrap">
                            {hasPromo && h.prix_min_promo && (
                              <span className="cat-item-chip__prix-original">
                                {Math.round(h.prix_min)} DT
                              </span>
                            )}
                            <span className={`cat-item-chip__price${hasPromo ? " cat-item-chip__price--promo" : ""}`}>
                              {prixAff} DT/nuit
                            </span>
                          </span>
                        )}
                      </div>

                      {hasPromo && sel && h.promotion_titre && (
                        <div className="cat-item-chip__promo-label">
                          {h.promotion_titre}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ═══════════ VOYAGES ═══════════ */}
        <div className="cat-create__col">
          <div className="cat-create__col-header">
            <span>✈️ Voyages</span>
            <span className={`cat-create__col-count${selVoyages.length > 0 ? " cat-create__col-count--active" : ""}`}>
              {selVoyages.length} sélectionné{selVoyages.length > 1 ? "s" : ""}
            </span>
          </div>
          <div className="cat-create__items-list">
            {loading ? (
              <p className="cat-create__no-result">⏳ Chargement des voyages...</p>
            ) : filteredVoyages.length === 0 ? (
              <p className="cat-create__no-result">
                {safeVoyages.length === 0
                  ? "Aucun voyage disponible"
                  : "Aucun résultat pour cette recherche"}
              </p>
            ) : (
              filteredVoyages.map(v => {
                const sel    = selVoyages.includes(v.id);
                const places = v.capacite_max != null
                  ? Math.max(0, v.capacite_max - (v.nb_inscrits || 0))
                  : null;
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
                      <div className="cat-item-chip__name">
                        {v.titre || "Voyage sans titre"}
                        {places != null && places <= 5 && (
                          <span className="cat-item-chip__places-badge">
                            ⚡ {places} place{places > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      <div className="cat-item-chip__sub">
                        <span>{v.destination || "—"} · {v.duree || 0}j</span>
                        {v.prix_base != null && (
                          <span className="cat-item-chip__price">
                            {parseInt(v.prix_base)} DT/pers
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Actions ──────────────────────────────────── */}
      <div className="cat-create__actions">
        <button
          className="cat-btn-primary cat-btn-primary--lg"
          onClick={handleGenerer}
          disabled={generating || (!selHotels.length && !selVoyages.length)}
        >
          {generating
            ? <><SpinnerInline /> Génération en cours...</>
            : "✨ Générer avec Claude AI"}
        </button>
        <button className="cat-btn-ghost" onClick={onCancel}>Annuler</button>
      </div>
    </div>
  );
}