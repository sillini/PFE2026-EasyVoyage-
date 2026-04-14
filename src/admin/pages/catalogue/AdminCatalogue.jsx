// src/admin/pages/catalogue/AdminCatalogue.jsx
// ─────────────────────────────────────────────────────────
// Point d'entrée — orchestre les 4 vues du module
// Dans App.jsx : import AdminCatalogue from "./admin/pages/catalogue"
// ─────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from "react";
import "./AdminCatalogue.css";
import { BASE, auth } from "./constants";
import { parseIA } from "./utils";

import CatalogueSidebar from "./CatalogueSidebar";
import CatalogueCreate  from "./CatalogueCreate";
import CatalogueDetail  from "./CatalogueDetail";
import CatalogueEnvoi   from "./CatalogueEnvoi";

export default function AdminCatalogue() {
  const [catalogues, setCatalogues] = useState([]);
  const [hotels,     setHotels]     = useState([]);
  const [voyages,    setVoyages]    = useState([]);
  const [loading,    setLoading]    = useState(true);

  const [view,          setView]         = useState("list");
  const [detailCat,     setDetailCat]    = useState(null);
  const [loadingDetail, setLoadingDetail]= useState(false);

  // ── Chargement initial ────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [cR, hR, vR] = await Promise.all([
        fetch(`${BASE}/catalogues?per_page=50`, { headers: auth() }),
        fetch(`${BASE}/hotels?per_page=100`,    { headers: auth() }),
        fetch(`${BASE}/voyages?per_page=100`,   { headers: auth() }),
      ]);
      setCatalogues((await cR.json()).items || []);
      setHotels((await hR.json()).items     || []);
      setVoyages((await vR.json()).items    || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Ouvrir détail ─────────────────────────────────────
  const openDetail = useCallback(async (cat) => {
    setLoadingDetail(true);
    setDetailCat(null);
    setView("detail");
    try {
      const r = await fetch(`${BASE}/catalogues/${cat.id}/detail`, { headers: auth() });
      const d = await r.json();
      const p = parseIA(d.description_ia);
      setDetailCat({ ...d, _sujet: p.sujet || d.titre, _desc: p.description || "" });
    } catch (e) { console.error(e); }
    setLoadingDetail(false);
  }, []);

  // ── Supprimer ─────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!confirm("Supprimer ce catalogue ?")) return;
    await fetch(`${BASE}/catalogues/${id}`, { method: "DELETE", headers: auth() });
    if (detailCat?.id === id) { setDetailCat(null); setView("list"); }
    loadAll();
  };

  // ── Callbacks enfants ─────────────────────────────────
  const handleCreated = async (cat) => {
    await loadAll();
    await openDetail(cat);
  };

  const handleSent = async () => {
    setView("detail");
    await loadAll();
    if (detailCat) await openDetail(detailCat);
  };

  return (
    <div className="cat-shell">

      {/* Panneau gauche */}
      <CatalogueSidebar
        catalogues={catalogues}
        loading={loading}
        activeId={detailCat?.id}
        onSelect={openDetail}
        onNew={() => setView("create")}
        onDelete={handleDelete}
      />

      {/* Zone principale */}
      <main className="cat-main">

        {view === "list" && (
          <div className="cat-empty-state">
            <p className="cat-empty-state__icon">📧</p>
            <h2 className="cat-empty-state__title">Sélectionnez un catalogue</h2>
            <p className="cat-empty-state__sub">ou créez-en un nouveau</p>
          </div>
        )}

        {view === "create" && (
          <CatalogueCreate
            hotels={hotels}
            voyages={voyages}
            onCreated={handleCreated}
            onCancel={() => setView("list")}
          />
        )}

        {view === "detail" && (
          <CatalogueDetail
            detailCat={detailCat}
            loadingDetail={loadingDetail}
            hotels={hotels}
            voyages={voyages}
            onEdit={openDetail}
            onSendOpen={() => setView("send")}
            onReload={loadAll}
          />
        )}

        {view === "send" && detailCat && (
          <CatalogueEnvoi
            detailCat={detailCat}
            onClose={() => setView("detail")}
            onSent={handleSent}
          />
        )}
      </main>
    </div>
  );
}