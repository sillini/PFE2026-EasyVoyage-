import { useState, useEffect } from "react";

const BASE = "http://localhost:8000/api/v1";
const auth = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("access_token")}`
});

const STATUT_STYLE = {
  BROUILLON: { bg: "#F0F4FF", color: "#3B5BDB", label: "Brouillon", icon: "📝" },
  ENVOYE:    { bg: "#EAFFEA", color: "#27AE60", label: "Envoyé ✓",  icon: "✅" },
  ECHOUE:    { bg: "#FFF0F0", color: "#E74C3C", label: "Échoué ✗",  icon: "❌" },
};

const FILTRES_DEST = [
  { value: "tous",     label: "👥 Tous",      desc: "Clients + Visiteurs", color: "#1A3F63" },
  { value: "client",   label: "👤 Clients",   desc: "Clients enregistrés", color: "#27AE60" },
  { value: "visiteur", label: "👁 Visiteurs", desc: "Visiteurs du site",   color: "#E67E22" },
];

// ── Helper : parse description_ia JSON ou texte brut ──────
function parseDescriptionIA(raw) {
  if (!raw) return { sujet: "", titre: "", description: "" };
  try {
    const cleaned = raw.replace(/```json/g,"").replace(/```/g,"").trim();
    if (cleaned.startsWith("{")) {
      const p = JSON.parse(cleaned);
      return {
        sujet:       p.sujet       || "",
        titre:       p.titre       || "",
        description: p.description || raw,
      };
    }
  } catch(e) {}
  return { sujet: "", titre: "", description: raw };
}

export default function AdminCatalogue() {
  const [catalogues,      setCatalogues]      = useState([]);
  const [hotels,          setHotels]          = useState([]);
  const [voyages,         setVoyages]         = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [loadingData,     setLoadingData]     = useState(true);

  // Partie 1 — Génération
  const [showPartie1,     setShowPartie1]     = useState(false);
  const [selectedHotels,  setSelectedHotels]  = useState([]);
  const [selectedVoyages, setSelectedVoyages] = useState([]);
  const [titrePartie1,    setTitrePartie1]    = useState("");
  const [generating,      setGenerating]      = useState(false);

  // Vue détail / édition
  const [detailCat,       setDetailCat]       = useState(null);
  const [loadingDetail,   setLoadingDetail]   = useState(false);
  const [editMode,        setEditMode]        = useState(false);
  const [editForm,        setEditForm]        = useState({});
  const [saving,          setSaving]          = useState(false);

  // Partie 2 — Envoi
  const [envoyerModal,    setEnvoyerModal]    = useState(null);
  const [destinataires,   setDestinataires]   = useState("tous");
  const [nbContacts,      setNbContacts]      = useState(10);
  const [sending,         setSending]         = useState(null);

  useEffect(() => {
    loadCatalogues();
    loadHotelsVoyages();
  }, []);

  const loadCatalogues = async () => {
    setLoading(true);
    const res  = await fetch(`${BASE}/catalogues?per_page=50`, { headers: auth() });
    const data = await res.json();
    setCatalogues(data.items || []);
    setLoading(false);
  };

  const loadHotelsVoyages = async () => {
    setLoadingData(true);
    const [hRes, vRes] = await Promise.all([
      fetch(`${BASE}/hotels?per_page=100&actif_only=0`, { headers: auth() }),
      fetch(`${BASE}/voyages?per_page=100&actif_only=0`, { headers: auth() }),
    ]);
    const hData = await hRes.json();
    const vData = await vRes.json();
    setHotels(hData.items || []);
    setVoyages(vData.items || []);
    setLoadingData(false);
  };

  // ── Ouvrir le détail ──────────────────────────────────
  const openDetail = async (cat) => {
    setLoadingDetail(true);
    setDetailCat(null);
    setEditMode(false);
    const res  = await fetch(`${BASE}/catalogues/${cat.id}/detail`, { headers: auth() });
    const data = await res.json();

    // Parser description_ia
    const parsed = parseDescriptionIA(data.description_ia);

    setDetailCat({
      ...data,
      sujet_affiche:       parsed.sujet       || data.titre,
      description_affichee: parsed.description || data.description_ia || "",
    });
    setEditForm({
      titre:          parsed.titre       || data.titre,
      sujet:          parsed.sujet       || data.titre,
      description_ia: parsed.description || data.description_ia || "",
      hotel_ids:      data.hotel_ids     || [],
      voyage_ids:     data.voyage_ids    || [],
    });
    setLoadingDetail(false);
  };

  // ── Sauvegarder les modifications ────────────────────
  const handleSaveEdit = async () => {
    setSaving(true);

    // Reconstruire description_ia en JSON avec les 3 champs
    const newDescIA = JSON.stringify({
      sujet:       editForm.sujet,
      titre:       editForm.titre,
      description: editForm.description_ia,
    }, null, 0);

    await fetch(`${BASE}/catalogues/${detailCat.id}`, {
      method: "PUT", headers: auth(),
      body: JSON.stringify({
        titre:          editForm.titre,
        description_ia: newDescIA,
        hotel_ids:      editForm.hotel_ids,
        voyage_ids:     editForm.voyage_ids,
      })
    });

    // Rafraîchir
    const res  = await fetch(`${BASE}/catalogues/${detailCat.id}/detail`, { headers: auth() });
    const data = await res.json();
    const parsed = parseDescriptionIA(data.description_ia);
    setDetailCat({
      ...data,
      sujet_affiche:        parsed.sujet       || data.titre,
      description_affichee: parsed.description || "",
    });
    setEditMode(false);
    setSaving(false);
    loadCatalogues();
  };

  // ── Partie 1 : Générer ────────────────────────────────
  const handleGenerer = async () => {
    if (selectedHotels.length === 0 && selectedVoyages.length === 0)
      return alert("Sélectionnez au moins un hôtel ou un voyage");
    setGenerating(true);
    try {
      const res = await fetch(`${BASE}/catalogues/generer`, {
        method: "POST", headers: auth(),
        body: JSON.stringify({
          titre:      titrePartie1 || "Notre sélection EasyVoyage",
          hotel_ids:  selectedHotels,
          voyage_ids: selectedVoyages,
        })
      });
      if (!res.ok) throw new Error("Erreur génération");
      const newCat = await res.json();
      setShowPartie1(false);
      setSelectedHotels([]);
      setSelectedVoyages([]);
      setTitrePartie1("");
      await loadCatalogues();
      // Ouvrir automatiquement le catalogue généré
      await openDetail(newCat);
    } catch(e) { alert("Erreur : " + e.message); }
    setGenerating(false);
  };

  // ── Partie 2 : Envoyer ────────────────────────────────
  const handleEnvoyer = async () => {
    if (!envoyerModal) return;
    setSending(envoyerModal.id);
    try {
      await fetch(`${BASE}/catalogues/${envoyerModal.id}/envoyer`, {
        method: "POST", headers: auth(),
        body: JSON.stringify({ destinataires, nb_contacts: nbContacts })
      });
      setEnvoyerModal(null);
      if (detailCat?.id === envoyerModal.id) {
        const res  = await fetch(`${BASE}/catalogues/${envoyerModal.id}/detail`, { headers: auth() });
        const data = await res.json();
        const parsed = parseDescriptionIA(data.description_ia);
        setDetailCat({
          ...data,
          sujet_affiche:        parsed.sujet       || data.titre,
          description_affichee: parsed.description || "",
        });
      }
      loadCatalogues();
    } catch(e) { alert("Erreur envoi : " + e.message); }
    setSending(null);
  };

  const handleDelete = async (id) => {
    if (!confirm("Supprimer ce catalogue ?")) return;
    await fetch(`${BASE}/catalogues/${id}`, { method: "DELETE", headers: auth() });
    if (detailCat?.id === id) setDetailCat(null);
    loadCatalogues();
  };

  const toggleHotel        = (id) => setSelectedHotels(p  => p.includes(id) ? p.filter(x=>x!==id) : [...p,id]);
  const toggleVoyage       = (id) => setSelectedVoyages(p => p.includes(id) ? p.filter(x=>x!==id) : [...p,id]);
  const toggleEditHotel    = (id) => setEditForm(f => ({ ...f, hotel_ids:  f.hotel_ids.includes(id)  ? f.hotel_ids.filter(x=>x!==id)  : [...f.hotel_ids,  id] }));
  const toggleEditVoyage   = (id) => setEditForm(f => ({ ...f, voyage_ids: f.voyage_ids.includes(id) ? f.voyage_ids.filter(x=>x!==id) : [...f.voyage_ids, id] }));

  return (
    <div style={{ padding:28, fontFamily:"Lato,sans-serif", maxWidth:1200, display:"flex", gap:28 }}>

      {/* ═══ COLONNE GAUCHE ═══ */}
      <div style={{ flex:1, minWidth:0 }}>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
          <div>
            <h1 style={{ fontSize:20, fontWeight:700, color:"#0F2235", margin:0 }}>📧 Catalogues Email</h1>
            <p style={{ color:"#8A9BB0", fontSize:12, marginTop:3 }}>Préparez, consultez, modifiez et envoyez vos catalogues</p>
          </div>
          <button onClick={() => setShowPartie1(!showPartie1)} style={{
            background:"#0F2235", color:"#fff", border:"none",
            padding:"9px 18px", borderRadius:8, fontWeight:700, fontSize:12, cursor:"pointer"
          }}>
            {showPartie1 ? "✕ Fermer" : "✨ Nouveau catalogue"}
          </button>
        </div>

        {/* Partie 1 — Génération */}
        {showPartie1 && (
          <div style={{ background:"#F8FAFC", border:"2px solid #0F2235", borderRadius:12, padding:20, marginBottom:20 }}>
            <div style={{ fontWeight:800, color:"#0F2235", fontSize:14, marginBottom:6 }}>✨ Préparer avec Claude AI</div>
            <div style={{ fontSize:12, color:"#8A9BB0", marginBottom:14 }}>
              Claude améliorera automatiquement votre titre et générera un sujet email + description marketing.
            </div>

            <input
              value={titrePartie1}
              onChange={e => setTitrePartie1(e.target.value)}
              placeholder="Ex: bon plan, offre été, promo Djerba... Claude le corrigera"
              style={{ width:"100%", padding:"9px 12px", border:"1px solid #DDE3EC", borderRadius:8, fontSize:13, marginBottom:14, boxSizing:"border-box" }}
            />

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
              <div>
                <div style={{ fontSize:11, fontWeight:800, color:"#8A9BB0", textTransform:"uppercase", marginBottom:6 }}>
                  🏨 Hôtels — {selectedHotels.length} sél.
                </div>
                <div style={{ border:"1px solid #DDE3EC", borderRadius:8, maxHeight:200, overflowY:"auto", background:"#fff" }}>
                  {hotels.map(h => (
                    <div key={h.id} onClick={() => toggleHotel(h.id)} style={{
                      display:"flex", alignItems:"center", gap:10, padding:"8px 12px",
                      cursor:"pointer", borderBottom:"1px solid #F4F7FB",
                      background: selectedHotels.includes(h.id) ? "#EBF3FF" : "transparent"
                    }}>
                      <div style={{
                        width:16, height:16, borderRadius:3, flexShrink:0,
                        border:`2px solid ${selectedHotels.includes(h.id) ? "#1A3F63" : "#DDE3EC"}`,
                        background: selectedHotels.includes(h.id) ? "#1A3F63" : "#fff",
                        display:"flex", alignItems:"center", justifyContent:"center"
                      }}>
                        {selectedHotels.includes(h.id) && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:12, fontWeight:600, color:"#0F2235", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{h.nom}</div>
                        <div style={{ fontSize:11, color:"#8A9BB0" }}>{h.ville}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize:11, fontWeight:800, color:"#8A9BB0", textTransform:"uppercase", marginBottom:6 }}>
                  ✈ Voyages — {selectedVoyages.length} sél.
                </div>
                <div style={{ border:"1px solid #DDE3EC", borderRadius:8, maxHeight:200, overflowY:"auto", background:"#fff" }}>
                  {voyages.map(v => (
                    <div key={v.id} onClick={() => toggleVoyage(v.id)} style={{
                      display:"flex", alignItems:"center", gap:10, padding:"8px 12px",
                      cursor:"pointer", borderBottom:"1px solid #F4F7FB",
                      background: selectedVoyages.includes(v.id) ? "#FFF3E0" : "transparent"
                    }}>
                      <div style={{
                        width:16, height:16, borderRadius:3, flexShrink:0,
                        border:`2px solid ${selectedVoyages.includes(v.id) ? "#E67E22" : "#DDE3EC"}`,
                        background: selectedVoyages.includes(v.id) ? "#E67E22" : "#fff",
                        display:"flex", alignItems:"center", justifyContent:"center"
                      }}>
                        {selectedVoyages.includes(v.id) && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:12, fontWeight:600, color:"#0F2235", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{v.titre}</div>
                        <div style={{ fontSize:11, color:"#8A9BB0" }}>{v.destination} — {v.prix_base} DT</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button onClick={handleGenerer} disabled={generating} style={{
              background: generating ? "#ccc" : "#C4973A", color:"#fff",
              border:"none", padding:"10px 24px", borderRadius:8,
              fontWeight:700, fontSize:13, cursor:"pointer"
            }}>
              {generating ? "⏳ Claude génère..." : "✨ Générer avec Claude AI"}
            </button>
          </div>
        )}

        {/* Liste catalogues */}
        {loading ? (
          <p style={{ color:"#8A9BB0", textAlign:"center", padding:30 }}>Chargement...</p>
        ) : catalogues.length === 0 ? (
          <div style={{ textAlign:"center", padding:40, color:"#8A9BB0" }}>
            <p style={{ fontSize:40 }}>📭</p>
            <p style={{ marginTop:10 }}>Aucun catalogue — créez-en un</p>
          </div>
        ) : catalogues.map(cat => {
          const s        = STATUT_STYLE[cat.statut] || STATUT_STYLE.BROUILLON;
          const isActive = detailCat?.id === cat.id;
          return (
            <div key={cat.id} onClick={() => openDetail(cat)} style={{
              background: isActive ? "#EBF3FF" : "#fff",
              border: `1px solid ${isActive ? "#1A3F63" : "#E4ECF5"}`,
              borderLeft: `4px solid ${isActive ? "#1A3F63" : "transparent"}`,
              borderRadius:10, padding:"14px 16px", marginBottom:8,
              cursor:"pointer", transition:"all 0.15s",
              display:"flex", alignItems:"center", gap:12
            }}>
              <span style={{ fontSize:20 }}>{s.icon}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                  <span style={{ fontWeight:700, color:"#0F2235", fontSize:13, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {cat.titre}
                  </span>
                  <span style={{ background:s.bg, color:s.color, padding:"1px 8px", borderRadius:12, fontSize:10, fontWeight:700, flexShrink:0 }}>
                    {s.label}
                  </span>
                </div>
                <div style={{ fontSize:11, color:"#8A9BB0", display:"flex", gap:10 }}>
                  {cat.hotel_ids?.length  > 0 && <span>🏨 {cat.hotel_ids.length}</span>}
                  {cat.voyage_ids?.length > 0 && <span>✈ {cat.voyage_ids.length}</span>}
                  {cat.nb_envoyes > 0 && <span style={{ color:"#27AE60" }}>📬 {cat.nb_envoyes}</span>}
                  <span>{new Date(cat.created_at).toLocaleDateString("fr-FR")}</span>
                </div>
              </div>
              <button onClick={e => { e.stopPropagation(); handleDelete(cat.id); }} style={{
                background:"transparent", border:"none", color:"#E74C3C",
                cursor:"pointer", fontSize:16, padding:"2px 6px"
              }}>🗑</button>
            </div>
          );
        })}
      </div>

      {/* ═══ COLONNE DROITE — Détail + édition ═══ */}
      {(detailCat || loadingDetail) && (
        <div style={{
          width:480, flexShrink:0, background:"#fff",
          border:"1px solid #E4ECF5", borderRadius:14, padding:24,
          height:"fit-content", position:"sticky", top:20,
          maxHeight:"calc(100vh - 60px)", overflowY:"auto"
        }}>
          {loadingDetail ? (
            <p style={{ color:"#8A9BB0", textAlign:"center", padding:40 }}>Chargement...</p>
          ) : detailCat && (
            <>
              {/* Header */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  {editMode ? (
                    <input
                      value={editForm.titre}
                      onChange={e => setEditForm(f => ({...f, titre: e.target.value}))}
                      style={{ width:"100%", padding:"8px 10px", border:"1px solid #1A3F63", borderRadius:6, fontSize:15, fontWeight:700, color:"#0F2235", boxSizing:"border-box" }}
                    />
                  ) : (
                    <h2 style={{ fontSize:16, fontWeight:700, color:"#0F2235", margin:0, wordBreak:"break-word" }}>
                      {detailCat.titre}
                    </h2>
                  )}
                  <div style={{ display:"flex", gap:8, marginTop:6, alignItems:"center" }}>
                    {(() => { const s = STATUT_STYLE[detailCat.statut] || STATUT_STYLE.BROUILLON; return (
                      <span style={{ background:s.bg, color:s.color, padding:"2px 10px", borderRadius:12, fontSize:11, fontWeight:700 }}>{s.label}</span>
                    ); })()}
                    <span style={{ color:"#8A9BB0", fontSize:11 }}>
                      {new Date(detailCat.created_at).toLocaleDateString("fr-FR", { day:"2-digit", month:"short", year:"numeric" })}
                    </span>
                  </div>
                </div>
                <button onClick={() => setDetailCat(null)} style={{
                  background:"transparent", border:"none", color:"#8A9BB0",
                  cursor:"pointer", fontSize:18, padding:"2px 6px", marginLeft:10
                }}>✕</button>
              </div>

              {/* ── Sujet email (géré par Claude) ── */}
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:11, fontWeight:800, color:"#8A9BB0", textTransform:"uppercase", letterSpacing:1, marginBottom:6 }}>
                  Sujet de l'email
                </div>
                {editMode ? (
                  <input
                    value={editForm.sujet}
                    onChange={e => setEditForm(f => ({...f, sujet: e.target.value}))}
                    placeholder="Sujet accrocheur de l'email..."
                    style={{ width:"100%", padding:"9px 12px", border:"1px solid #1A3F63", borderRadius:8, fontSize:13, boxSizing:"border-box", color:"#0C447C", fontWeight:600 }}
                  />
                ) : (
                  <div style={{
                    background:"#EBF3FF", border:"1px solid #B5D4F4",
                    borderRadius:8, padding:"10px 14px",
                    fontSize:14, fontWeight:600, color:"#0C447C"
                  }}>
                    {detailCat.sujet_affiche || detailCat.titre}
                  </div>
                )}
              </div>

              {/* ── Description marketing ── */}
              <div style={{ marginBottom:18 }}>
                <div style={{ fontSize:11, fontWeight:800, color:"#8A9BB0", textTransform:"uppercase", letterSpacing:1, marginBottom:6 }}>
                  Description marketing
                </div>
                {editMode ? (
                  <textarea
                    value={editForm.description_ia}
                    onChange={e => setEditForm(f => ({...f, description_ia: e.target.value}))}
                    rows={4}
                    placeholder="Description marketing attractive..."
                    style={{ width:"100%", padding:"10px 12px", border:"1px solid #1A3F63", borderRadius:8, fontSize:13, resize:"vertical", boxSizing:"border-box", lineHeight:1.6 }}
                  />
                ) : (
                  <div style={{
                    background:"#F9FAFC", borderLeft:"4px solid #C4973A",
                    borderRadius:8, padding:"12px 14px",
                    fontSize:13, color:"#4A5568", lineHeight:1.7, fontStyle:"italic"
                  }}>
                    {detailCat.description_affichee || <span style={{ color:"#ccc" }}>Aucune description</span>}
                  </div>
                )}
              </div>

              {/* ── Hôtels ── */}
              {(detailCat.hotels?.length > 0 || editMode) && (
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:11, fontWeight:800, color:"#8A9BB0", textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>
                    🏨 Hôtels — {editMode ? `${editForm.hotel_ids.length} sél.` : detailCat.hotels?.length}
                  </div>
                  {editMode ? (
                    <div style={{ border:"1px solid #DDE3EC", borderRadius:8, maxHeight:180, overflowY:"auto" }}>
                      {hotels.map(h => (
                        <div key={h.id} onClick={() => toggleEditHotel(h.id)} style={{
                          display:"flex", alignItems:"center", gap:10, padding:"8px 12px",
                          cursor:"pointer", borderBottom:"1px solid #F4F7FB",
                          background: editForm.hotel_ids.includes(h.id) ? "#EBF3FF" : "transparent"
                        }}>
                          <div style={{
                            width:16, height:16, borderRadius:3,
                            border:`2px solid ${editForm.hotel_ids.includes(h.id) ? "#1A3F63" : "#DDE3EC"}`,
                            background: editForm.hotel_ids.includes(h.id) ? "#1A3F63" : "#fff",
                            display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0
                          }}>
                            {editForm.hotel_ids.includes(h.id) && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                          </div>
                          <span style={{ fontSize:12, color:"#0F2235" }}>{h.nom} <span style={{ color:"#8A9BB0" }}>— {h.ville}</span></span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                      {detailCat.hotels?.map(h => (
                        <div key={h.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", background:"#F4F7FB", borderRadius:8 }}>
                          {h.image_url && <img src={h.image_url} alt={h.nom} style={{ width:40, height:40, borderRadius:6, objectFit:"cover" }}/>}
                          <div>
                            <div style={{ fontSize:13, fontWeight:600, color:"#0F2235" }}>{h.nom}</div>
                            <div style={{ fontSize:11, color:"#8A9BB0" }}>{h.ville} — {"⭐".repeat(h.etoiles||0)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Voyages ── */}
              {(detailCat.voyages?.length > 0 || editMode) && (
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:11, fontWeight:800, color:"#8A9BB0", textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>
                    ✈ Voyages — {editMode ? `${editForm.voyage_ids.length} sél.` : detailCat.voyages?.length}
                  </div>
                  {editMode ? (
                    <div style={{ border:"1px solid #DDE3EC", borderRadius:8, maxHeight:180, overflowY:"auto" }}>
                      {voyages.map(v => (
                        <div key={v.id} onClick={() => toggleEditVoyage(v.id)} style={{
                          display:"flex", alignItems:"center", gap:10, padding:"8px 12px",
                          cursor:"pointer", borderBottom:"1px solid #F4F7FB",
                          background: editForm.voyage_ids.includes(v.id) ? "#FFF3E0" : "transparent"
                        }}>
                          <div style={{
                            width:16, height:16, borderRadius:3,
                            border:`2px solid ${editForm.voyage_ids.includes(v.id) ? "#E67E22" : "#DDE3EC"}`,
                            background: editForm.voyage_ids.includes(v.id) ? "#E67E22" : "#fff",
                            display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0
                          }}>
                            {editForm.voyage_ids.includes(v.id) && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                          </div>
                          <span style={{ fontSize:12, color:"#0F2235" }}>{v.titre} <span style={{ color:"#8A9BB0" }}>— {v.destination}</span></span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                      {detailCat.voyages?.map(v => (
                        <div key={v.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", background:"#FFF8EC", borderRadius:8 }}>
                          {v.image_url && <img src={v.image_url} alt={v.titre} style={{ width:40, height:40, borderRadius:6, objectFit:"cover" }}/>}
                          <div>
                            <div style={{ fontSize:13, fontWeight:600, color:"#0F2235" }}>{v.titre}</div>
                            <div style={{ fontSize:11, color:"#8A9BB0" }}>{v.destination} — {v.duree}j — {v.prix_base} DT</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Boutons actions ── */}
              {detailCat.statut === "BROUILLON" && (
                <div style={{ display:"flex", flexDirection:"column", gap:10, borderTop:"1px solid #E4ECF5", paddingTop:16 }}>
                  {editMode ? (
                    <div style={{ display:"flex", gap:8 }}>
                      <button onClick={handleSaveEdit} disabled={saving} style={{
                        flex:1, background: saving ? "#ccc" : "#27AE60",
                        color:"#fff", border:"none", padding:"11px",
                        borderRadius:8, fontWeight:700, fontSize:13, cursor:"pointer"
                      }}>
                        {saving ? "Sauvegarde..." : "✓ Sauvegarder"}
                      </button>
                      <button onClick={() => setEditMode(false)} style={{
                        background:"#fff", color:"#666", border:"1px solid #E4ECF5",
                        padding:"11px 16px", borderRadius:8, fontSize:13, cursor:"pointer"
                      }}>Annuler</button>
                    </div>
                  ) : (
                    <>
                      <button onClick={() => setEditMode(true)} style={{
                        background:"#F4F7FB", color:"#0F2235",
                        border:"1px solid #DDE3EC", padding:"11px",
                        borderRadius:8, fontWeight:700, fontSize:13, cursor:"pointer"
                      }}>
                        ✏️ Modifier le catalogue
                      </button>
                      <button onClick={() => {
                        setEnvoyerModal(detailCat);
                        setDestinataires("tous");
                        setNbContacts(10);
                      }} style={{
                        background:"#C4973A", color:"#fff", border:"none",
                        padding:"11px", borderRadius:8,
                        fontWeight:700, fontSize:13, cursor:"pointer"
                      }}>
                        📧 Envoyer aux contacts
                      </button>
                    </>
                  )}
                </div>
              )}

              {detailCat.statut === "ENVOYE" && (
                <div style={{ background:"#EAFFEA", border:"1px solid #A3E4A3", borderRadius:8, padding:"12px 14px", fontSize:13, color:"#1E8449", marginTop:16 }}>
                  ✅ Envoyé à {detailCat.nb_envoyes} contact(s) le {detailCat.envoye_at ? new Date(detailCat.envoye_at).toLocaleDateString("fr-FR") : "—"}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ═══ MODAL Envoi ═══ */}
      {envoyerModal && (
        <div style={{
          position:"fixed", inset:0, background:"rgba(0,0,0,0.5)",
          display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000
        }}>
          <div style={{ background:"#fff", borderRadius:14, padding:28, width:440, maxWidth:"90vw", boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>

            <div style={{ fontWeight:800, color:"#0F2235", fontSize:16, marginBottom:4 }}>📧 Envoyer le catalogue</div>
            <div style={{ color:"#8A9BB0", fontSize:12, marginBottom:4 }}>{envoyerModal.titre}</div>

            {/* Sujet email affiché dans le modal */}
            {envoyerModal.sujet_affiche && (
              <div style={{
                background:"#EBF3FF", border:"1px solid #B5D4F4",
                borderRadius:6, padding:"8px 12px", marginBottom:16,
                fontSize:13, fontWeight:600, color:"#0C447C"
              }}>
                Sujet : {envoyerModal.sujet_affiche}
              </div>
            )}

            {/* Destinataires */}
            <div style={{ marginBottom:18 }}>
              <label style={{ fontSize:11, fontWeight:800, color:"#8A9BB0", textTransform:"uppercase", letterSpacing:1, display:"block", marginBottom:8 }}>Destinataires</label>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {FILTRES_DEST.map(f => (
                  <div key={f.value} onClick={() => setDestinataires(f.value)} style={{
                    display:"flex", alignItems:"center", gap:12, padding:"12px 14px",
                    borderRadius:8, cursor:"pointer",
                    border:`2px solid ${destinataires === f.value ? f.color : "#E4ECF5"}`,
                    background: destinataires === f.value ? `${f.color}12` : "#fff"
                  }}>
                    <div style={{
                      width:18, height:18, borderRadius:"50%",
                      border:`2px solid ${destinataires === f.value ? f.color : "#DDE3EC"}`,
                      background: destinataires === f.value ? f.color : "#fff",
                      display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0
                    }}>
                      {destinataires === f.value && <div style={{ width:7, height:7, borderRadius:"50%", background:"#fff" }}/>}
                    </div>
                    <div>
                      <div style={{ fontWeight:700, color:"#0F2235", fontSize:13 }}>{f.label}</div>
                      <div style={{ color:"#8A9BB0", fontSize:11 }}>{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Nombre */}
            <div style={{ marginBottom:22 }}>
              <label style={{ fontSize:11, fontWeight:800, color:"#8A9BB0", textTransform:"uppercase", letterSpacing:1, display:"block", marginBottom:8 }}>
                Nombre de contacts : <span style={{ color:"#C4973A", fontSize:16 }}>{nbContacts}</span>
              </label>
              <input type="range" min="1" max="100" value={nbContacts}
                onChange={e => setNbContacts(Number(e.target.value))}
                style={{ width:"100%" }}
              />
              <div style={{ fontSize:11, color:"#8A9BB0", marginTop:4 }}>
                Les {nbContacts} contacts les plus récents seront sélectionnés
              </div>
            </div>

            <div style={{ display:"flex", gap:10 }}>
              <button onClick={handleEnvoyer} disabled={sending === envoyerModal.id} style={{
                flex:1, background: sending === envoyerModal.id ? "#ccc" : "#C4973A",
                color:"#fff", border:"none", padding:"12px", borderRadius:8,
                fontWeight:700, fontSize:14, cursor:"pointer"
              }}>
                {sending === envoyerModal.id ? "Envoi..." : "📧 Confirmer l'envoi"}
              </button>
              <button onClick={() => setEnvoyerModal(null)} style={{
                background:"#fff", color:"#666", border:"1px solid #E4ECF5",
                padding:"12px 18px", borderRadius:8, fontSize:14, cursor:"pointer"
              }}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}