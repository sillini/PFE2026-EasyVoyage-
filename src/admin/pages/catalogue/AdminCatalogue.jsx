// src/admin/pages/catalogue/AdminCatalogue.jsx
import { useState, useEffect, useCallback } from "react";
import "./AdminCatalogue.css";
import { BASE, auth } from "./constants";
import { parseIA } from "./utils";

import CatalogueSidebar from "./CatalogueSidebar";
import CatalogueCreate  from "./CatalogueCreate";
import CatalogueDetail  from "./CatalogueDetail";
import CatalogueEnvoi   from "./CatalogueEnvoi";

export default function AdminCatalogue() {
  const [catalogues,    setCatalogues]    = useState([]);
  const [hotels,        setHotels]        = useState([]);
  const [voyages,       setVoyages]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [view,          setView]          = useState("list");
  const [detailCat,     setDetailCat]     = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      // ⚠️  IMPORTANT : per_page MAX = 100 (limite imposée par le backend FastAPI)
      //                 actif_only=0 pour récupérer aussi les inactifs
      const [cR, hR, vR] = await Promise.all([
        fetch(`${BASE}/catalogues?per_page=100`,                  { headers: auth() }),
        fetch(`${BASE}/hotels?per_page=100&actif_only=0`,         { headers: auth() }),
        fetch(`${BASE}/voyages?per_page=100&actif_only=0`,        { headers: auth() }),
      ]);

      // ── Catalogues ──
      if (cR.ok) {
        const cData = await cR.json();
        setCatalogues(cData.items || []);
      } else {
        console.error("[CATALOGUE] catalogues HTTP", cR.status);
        setCatalogues([]);
      }

      // ── Hôtels ──
      if (hR.ok) {
        const hData = await hR.json();
        const hItems = hData.items || [];
        console.log(`[CATALOGUE] ${hItems.length}/${hData.total} hôtels chargés`);
        setHotels(hItems);
      } else {
        const errTxt = await hR.text();
        console.error("[CATALOGUE] hotels HTTP", hR.status, errTxt);
        setHotels([]);
      }

      // ── Voyages ──
      if (vR.ok) {
        const vData = await vR.json();
        const vItems = vData.items || [];
        console.log(`[CATALOGUE] ${vItems.length}/${vData.total} voyages chargés`);
        setVoyages(vItems);
      } else {
        const errTxt = await vR.text();
        console.error("[CATALOGUE] voyages HTTP", vR.status, errTxt);
        setVoyages([]);
      }
    } catch (e) {
      console.error("[CATALOGUE] loadAll error:", e);
      setCatalogues([]);
      setHotels([]);
      setVoyages([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

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

  const handleDelete = async (id) => {
    if (!confirm("Supprimer ce catalogue ?")) return;
    await fetch(`${BASE}/catalogues/${id}`, { method: "DELETE", headers: auth() });
    if (detailCat?.id === id) { setDetailCat(null); setView("list"); }
    loadAll();
  };

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
      <CatalogueSidebar
        catalogues={catalogues}
        loading={loading}
        activeId={detailCat?.id}
        onSelect={openDetail}
        onNew={() => setView("create")}
        onDelete={handleDelete}
      />

      <main className="cat-main">
        {view === "list" && (
          <div className="cat-empty-state">
            <div className="cat-empty-state__visual">
              <div className="cat-empty-state__ring cat-empty-state__ring--1" />
              <div className="cat-empty-state__ring cat-empty-state__ring--2" />
              <div className="cat-empty-state__ring cat-empty-state__ring--3" />
              <span className="cat-empty-state__icon">✉</span>
            </div>
            <h2 className="cat-empty-state__title">Catalogues Email</h2>
            <p className="cat-empty-state__sub">Sélectionnez un catalogue ou créez-en un nouveau pour démarrer votre campagne</p>
            <button className="cat-empty-state__cta" onClick={() => setView("create")}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Créer un catalogue
            </button>
          </div>
        )}

        {view === "create" && (
          <CatalogueCreate
            hotels={hotels}
            voyages={voyages}
            loading={loading}
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