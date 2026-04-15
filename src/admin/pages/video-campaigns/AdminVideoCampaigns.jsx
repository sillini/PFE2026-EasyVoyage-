// src/admin/pages/video-campaigns/AdminVideoCampaigns.jsx
// MISE À JOUR : voyages uniquement (hotels retiré)
import { useState, useEffect, useCallback } from "react";
import "./AdminVideoCampaigns.css";
import { BASE, auth } from "./constants";

import VCsidebar from "./VCsidebar";
import VCcreate  from "./VCcreate";
import VCdetail  from "./VCdetail";

export default function AdminVideoCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [voyages,   setVoyages]   = useState([]);
  const [loading,   setLoading]   = useState(true);

  const [view,          setView]         = useState("list");
  const [activeCamp,    setActiveCamp]   = useState(null);
  const [loadingDetail, setLoadingDetail]= useState(false);

  // ── Chargement initial ────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [cR, vR] = await Promise.all([
        fetch(`${BASE}/video-campaigns?per_page=50`, { headers: auth() }),
        fetch(`${BASE}/voyages?per_page=100&actif_only=true`, { headers: auth() }),
      ]);
      setCampaigns((await cR.json()).items || []);
      setVoyages((await vR.json()).items   || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Ouvrir détail ─────────────────────────────────────
  const openDetail = useCallback(async (camp) => {
    setLoadingDetail(true);
    setActiveCamp(null);
    setView("detail");
    try {
      const r = await fetch(`${BASE}/video-campaigns/${camp.id}`, { headers: auth() });
      setActiveCamp(await r.json());
    } catch (e) { console.error(e); }
    setLoadingDetail(false);
  }, []);

  // ── Rafraîchir campagne active ────────────────────────
  const refreshActive = useCallback(async () => {
    if (!activeCamp?.id) return;
    try {
      const r = await fetch(`${BASE}/video-campaigns/${activeCamp.id}`, { headers: auth() });
      const updated = await r.json();
      setActiveCamp(updated);
      setCampaigns(prev => prev.map(c => c.id === updated.id ? updated : c));
    } catch (e) { console.error(e); }
  }, [activeCamp?.id]);

  // ── Supprimer ─────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!confirm("Supprimer cette campagne ?")) return;
    await fetch(`${BASE}/video-campaigns/${id}`, { method: "DELETE", headers: auth() });
    if (activeCamp?.id === id) { setActiveCamp(null); setView("list"); }
    loadAll();
  };

  const handleCreated = async (camp) => {
    await loadAll();
    await openDetail(camp);
  };

  return (
    <div className="vc-shell">
      <VCsidebar
        campaigns={campaigns}
        loading={loading}
        activeId={activeCamp?.id}
        onSelect={openDetail}
        onNew={() => setView("create")}
        onDelete={handleDelete}
      />

      <main className="vc-main">
        {view === "list" && (
          <div className="vc-empty-state">
            <div className="vc-empty-state__icon">🎬</div>
            <h2 className="vc-empty-state__title">Sélectionnez une campagne</h2>
            <p className="vc-empty-state__sub">ou créez-en une nouvelle</p>
            <button className="vc-btn-primary" onClick={() => setView("create")}>
              + Nouvelle campagne vidéo
            </button>
          </div>
        )}

        {view === "create" && (
          <VCcreate
            voyages={voyages}
            onCreated={handleCreated}
            onCancel={() => setView("list")}
          />
        )}

        {view === "detail" && (
          <VCdetail
            campaign={activeCamp}
            loading={loadingDetail}
            voyages={voyages}
            onRefresh={refreshActive}
            onReload={loadAll}
            onBack={() => setView("list")}
          />
        )}
      </main>
    </div>
  );
}