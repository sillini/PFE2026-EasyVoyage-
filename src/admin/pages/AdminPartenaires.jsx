import { useState, useEffect } from "react";
import { partenairesApi } from "../services/api";
import AdminHotelDetail from "../components/hotels/AdminHotelDetail";
import InvitationWizard from "../components/partenaires/InvitationWizard";
import "./AdminPartenaires.css";

/* ── helpers ───────────────────────────────────────────── */
function fmt(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtShort(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

/* ── micro-composants ──────────────────────────────────── */
function StatusPill({ actif, statut }) {
  return (
    <span className={`apm-pill ${actif ? "apm-pill-on" : "apm-pill-off"}`}>
      <span className="apm-pill-dot" />
      {actif ? "Actif" : statut === "SUSPENDU" ? "Suspendu" : "Inactif"}
    </span>
  );
}

function TypeChip({ type }) {
  const map = {
    HOTEL: { icon: "🏨", cls: "hotel" }, AGENCE: { icon: "✈️", cls: "agence" },
    TRANSPORT: { icon: "🚌", cls: "transport" }, RESTAURATION: { icon: "🍽️", cls: "resto" }, AUTRE: { icon: "🤝", cls: "autre" }
  };
  const { icon, cls } = map[type] || { icon: "🤝", cls: "autre" };
  return <span className={`apm-chip apm-chip-${cls}`}>{icon} {type}</span>;
}

function Stars({ n = 0 }) {
  return (
    <span className="apm-stars">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < n ? "apm-star-on" : "apm-star-off"}>★</span>
      ))}
    </span>
  );
}

function Avatar({ prenom, nom, size = "md" }) {
  const initials = `${prenom?.[0] || ""}${nom?.[0] || ""}`.toUpperCase();
  return <div className={`apm-avatar apm-avatar-${size}`}>{initials}</div>;
}

/* ══════════════════════════════════════════════════════════
   CARD PARTENAIRE
══════════════════════════════════════════════════════════ */
function PartenaireCard({ partenaire, onToggle, onView, index }) {
  const [toggling, setToggling] = useState(false);

  const handleToggle = async (e) => {
    e.stopPropagation();
    setToggling(true);
    try { await onToggle(partenaire.id, !partenaire.actif); }
    finally { setToggling(false); }
  };

  return (
    <article
      className={`apm-card ${partenaire.actif ? "" : "apm-card-suspended"}`}
      style={{ animationDelay: `${index * 0.07}s` }}
      onClick={() => onView(partenaire)}>

      <div className="apm-card-ridge" />

      <div className="apm-card-header">
        <div className="apm-card-avatar-zone">
          <Avatar prenom={partenaire.prenom} nom={partenaire.nom} size="md" />
          <span className={`apm-online-dot ${partenaire.actif ? "on" : "off"}`} />
        </div>
        <div className="apm-card-meta">
          <h3 className="apm-card-name">{partenaire.prenom} {partenaire.nom}</h3>
          <span className="apm-card-email">{partenaire.email}</span>
          <div className="apm-card-tags">
            <StatusPill actif={partenaire.actif} statut={partenaire.statut} />
            <TypeChip type={partenaire.type_partenaire} />
          </div>
        </div>
      </div>

      <div className="apm-card-company">
        <div className="apm-company-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>
        <span className="apm-company-name">{partenaire.nom_entreprise}</span>
      </div>

      <div className="apm-card-metrics">
        <div className="apm-metric">
          <span className="apm-metric-val">{partenaire.hotels.length}</span>
          <span className="apm-metric-key">Hôtels</span>
        </div>
        <div className="apm-metric-divider" />
        <div className="apm-metric">
          <span className="apm-metric-val">{(partenaire.commission || 0).toFixed(1)}<sup>%</sup></span>
          <span className="apm-metric-key">Commission</span>
        </div>
        <div className="apm-metric-divider" />
        <div className="apm-metric">
          <span className="apm-metric-val apm-metric-date">{fmtShort(partenaire.date_inscription)}</span>
          <span className="apm-metric-key">Inscription</span>
        </div>
      </div>

      {partenaire.hotels.length > 0 && (
        <div className="apm-hotels-chips">
          {partenaire.hotels.slice(0, 3).map(h => (
            <span key={h.id} className="apm-hchip">
              <span className={`apm-hchip-dot ${h.actif ? "on" : "off"}`} />
              {h.nom}
            </span>
          ))}
          {partenaire.hotels.length > 3 && (
            <span className="apm-hchip apm-hchip-more">+{partenaire.hotels.length - 3}</span>
          )}
        </div>
      )}

      <div className="apm-card-actions" onClick={e => e.stopPropagation()}>
        <button className="apm-action-profile" onClick={() => onView(partenaire)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          Voir le profil
        </button>
        <button className={`apm-action-toggle ${partenaire.actif ? "suspend" : "activate"}`}
          onClick={handleToggle} disabled={toggling}>
          {toggling
            ? <span className="apm-spinner-xs" />
            : partenaire.actif
              ? <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>Suspendre</>
              : <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12"><polygon points="5 3 19 12 5 21 5 3"/></svg>Activer</>
          }
        </button>
      </div>
    </article>
  );
}

/* ══════════════════════════════════════════════════════════
   DÉTAIL PARTENAIRE
══════════════════════════════════════════════════════════ */
function PartenaireDetail({ partenaire, onBack, onToggle, onViewHotel }) {
  const [toggling, setToggling] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    try { await onToggle(partenaire.id, !partenaire.actif); }
    finally { setToggling(false); }
  };

  const infoRows = [
    { label: "Prénom",        value: partenaire.prenom },
    { label: "Nom",           value: partenaire.nom },
    { label: "Email",         value: partenaire.email },
    { label: "Téléphone",     value: partenaire.telephone || "—" },
    { label: "Entreprise",    value: partenaire.nom_entreprise },
    { label: "Type",          value: partenaire.type_partenaire },
    { label: "Commission",    value: `${(partenaire.commission || 0).toFixed(2)} %` },
    { label: "Statut",        value: <StatusPill actif={partenaire.actif} statut={partenaire.statut} /> },
    { label: "Membre depuis", value: fmt(partenaire.date_inscription) },
  ];

  return (
    <div className="apm-detail">

      {/* breadcrumb */}
      <div className="apm-breadcrumb">
        <button className="apm-back" onClick={onBack}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Partenaires
        </button>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="11" height="11" className="apm-bc-sep">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
        <span className="apm-bc-current">{partenaire.prenom} {partenaire.nom}</span>
      </div>

      {/* Hero banner */}
      <div className="apm-detail-banner">
        <div className="apm-banner-bg">
          <div className="apm-banner-mesh" />
          <div className="apm-banner-line apm-bl-1" />
          <div className="apm-banner-line apm-bl-2" />
          <div className="apm-banner-line apm-bl-3" />
        </div>

        <div className="apm-banner-body">
          <div className="apm-banner-left">
            <div className="apm-banner-avatar-wrap">
              <Avatar prenom={partenaire.prenom} nom={partenaire.nom} size="xl" />
              <span className={`apm-banner-dot ${partenaire.actif ? "on" : "off"}`} />
            </div>
            <div className="apm-banner-identity">
              <div className="apm-banner-pills">
                <StatusPill actif={partenaire.actif} statut={partenaire.statut} />
                <TypeChip type={partenaire.type_partenaire} />
              </div>
              <h1 className="apm-banner-name">{partenaire.prenom} {partenaire.nom}</h1>
              <p className="apm-banner-company">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="12" height="12">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                {partenaire.nom_entreprise}
              </p>
              <p className="apm-banner-email">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="12" height="12">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                {partenaire.email}
              </p>
            </div>
          </div>
          <div className="apm-banner-right">
            <button className={`apm-toggle-hero ${partenaire.actif ? "suspend" : "activate"}`}
              onClick={handleToggle} disabled={toggling}>
              {toggling
                ? <span className="apm-spinner-xs white" />
                : partenaire.actif
                  ? <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>Suspendre le compte</>
                  : <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><polygon points="5 3 19 12 5 21 5 3"/></svg>Activer le compte</>
              }
            </button>
          </div>
        </div>

        {/* KPI strip */}
        <div className="apm-kpi-strip">
          {[
            { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>, val: partenaire.hotels.length, lbl: "Hôtels gérés" },
            { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>, val: `${(partenaire.commission || 0).toFixed(2)}%`, lbl: "Commission" },
            { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/></svg>, val: fmt(partenaire.date_inscription), lbl: "Membre depuis" },
            { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.27 2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 17z"/></svg>, val: partenaire.telephone || "—", lbl: "Téléphone" },
          ].map((k, i) => (
            <div key={i} className="apm-kpi">
              <div className="apm-kpi-icon">{k.icon}</div>
              <div className="apm-kpi-body">
                <span className="apm-kpi-val">{k.val}</span>
                <span className="apm-kpi-lbl">{k.lbl}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="apm-detail-grid">
        <section className="apm-panel">
          <div className="apm-panel-header">
            <div className="apm-panel-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div>
              <h2 className="apm-panel-title">Informations</h2>
              <p className="apm-panel-sub">Données du compte partenaire</p>
            </div>
          </div>
          <div className="apm-info-table">
            {infoRows.map(({ label, value }) => (
              <div key={label} className="apm-info-row">
                <span className="apm-info-label">{label}</span>
                <span className="apm-info-value">{value}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="apm-panel">
          <div className="apm-panel-header">
            <div className="apm-panel-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <div>
              <h2 className="apm-panel-title">Hôtels associés</h2>
              <p className="apm-panel-sub">{partenaire.hotels.length} établissement{partenaire.hotels.length !== 1 ? "s" : ""}</p>
            </div>
            {partenaire.hotels.length > 0 && (
              <span className="apm-panel-badge">{partenaire.hotels.length}</span>
            )}
          </div>

          {partenaire.hotels.length === 0 ? (
            <div className="apm-empty-hotels">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.9">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              <p>Aucun hôtel associé à ce partenaire</p>
            </div>
          ) : (
            <ul className="apm-hotel-list">
              {partenaire.hotels.map(h => (
                <li key={h.id} className="apm-hotel-item" onClick={() => onViewHotel(h.id)}>
                  <div className="apm-hi-indicator">
                    <span className={`apm-hi-dot ${h.actif ? "on" : "off"}`} />
                  </div>
                  <div className="apm-hi-info">
                    <span className="apm-hi-name">{h.nom}</span>
                    <span className="apm-hi-loc">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="10" height="10">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                      {h.ville || h.pays}
                    </span>
                  </div>
                  <div className="apm-hi-right">
                    {h.etoiles > 0 && <Stars n={h.etoiles} />}
                    <span className={`apm-hi-status ${h.actif ? "on" : "off"}`}>
                      {h.actif ? "Actif" : "Inactif"}
                    </span>
                    <div className="apm-hi-arrow">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                        <line x1="5" y1="12" x2="19" y2="12"/>
                        <polyline points="12 5 19 12 12 19"/>
                      </svg>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE PRINCIPALE
══════════════════════════════════════════════════════════ */
export default function AdminPartenaires({ initialWizardEmail, initialWizardForm, onWizardConsumed }) {
  const [partenaires, setPartenaires] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [filterTab, setFilterTab]     = useState("actif");
  const [search, setSearch]           = useState("");
  const [filterType, setFilterType]   = useState("");
  const [filterEnt, setFilterEnt]     = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [wizard, setWizard]           = useState(false);
  const [selectedId, setSelectedId]   = useState(null);
  const [hotelDetailId, setHotelDetailId] = useState(null);

  useEffect(() => { load(); }, []);
  useEffect(() => { if (initialWizardEmail) setWizard(true); }, [initialWizardEmail]);
  useEffect(() => {
    const h = (e) => setHotelDetailId(e.detail?.hotelId);
    window.addEventListener("navigate-hotel-detail", h);
    return () => window.removeEventListener("navigate-hotel-detail", h);
  }, []);

  const load = async () => {
    setLoading(true); setError("");
    try { const d = await partenairesApi.list({ per_page: 100 }); setPartenaires(d.items || []); }
    catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleToggle = async (id, actif) => { await partenairesApi.toggle(id, actif); await load(); };
  const handleViewHotel = (hotelId) => setHotelDetailId(hotelId);

  if (hotelDetailId) return <AdminHotelDetail hotelId={hotelDetailId} onBack={() => { setHotelDetailId(null); load(); }} />;

  if (selectedId) {
    const p = partenaires.find(x => x.id === selectedId);
    if (p) return (
      <PartenaireDetail
        partenaire={p}
        onBack={() => { setSelectedId(null); load(); }}
        onToggle={async (id, actif) => { await handleToggle(id, actif); }}
        onViewHotel={handleViewHotel}
      />
    );
  }

  const actifs      = partenaires.filter(p => p.actif);
  const inactifs    = partenaires.filter(p => !p.actif);
  const base        = filterTab === "actif" ? actifs : inactifs;
  const hasFilters  = search || filterType || filterEnt;
  const totalHotels = partenaires.reduce((s, p) => s + p.hotels.length, 0);

  const filtered = base.filter(p => {
    if (search) {
      const s = search.toLowerCase();
      if (!p.nom.toLowerCase().includes(s) && !p.prenom.toLowerCase().includes(s) &&
          !p.email.toLowerCase().includes(s) && !p.nom_entreprise.toLowerCase().includes(s)) return false;
    }
    if (filterType && p.type_partenaire !== filterType) return false;
    if (filterEnt && !p.nom_entreprise.toLowerCase().includes(filterEnt.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="apm-page">

      {/* Header */}
      <header className="apm-page-header">
        <div className="apm-page-title-block">
          <div className="apm-page-eyebrow">
            <span className="apm-eyebrow-dot" />
            Gestion des partenaires
          </div>
          <h1 className="apm-page-title">Partenaires</h1>
          <p className="apm-page-desc">
            {partenaires.length} partenaire{partenaires.length !== 1 ? "s" : ""} enregistrés sur la plateforme
          </p>
        </div>
        <button className="apm-cta" onClick={() => setWizard(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <line x1="19" y1="8" x2="19" y2="14"/>
            <line x1="22" y1="11" x2="16" y2="11"/>
          </svg>
          Inviter un partenaire
        </button>
      </header>

      {/* KPI grid */}
      <div className="apm-kpi-grid">
        {[
          { color: "blue",  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, val: partenaires.length, lbl: "Total partenaires",   sub: "sur la plateforme" },
          { color: "green", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,                val: actifs.length,       lbl: "Partenaires actifs",  sub: `${inactifs.length > 0 ? inactifs.length + " suspendu" + (inactifs.length > 1 ? "s" : "") : "aucun suspendu"}` },
          { color: "amber", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,    val: totalHotels,         lbl: "Hôtels gérés",        sub: "au total" },
          { color: "rose",  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>, val: inactifs.length,     lbl: "Comptes suspendus",   sub: "en attente" },
        ].map((k, i) => (
          <div key={i} className={`apm-kpi-card apm-kpi-${k.color}`}>
            <div className="apm-kpi-card-icon">{k.icon}</div>
            <div className="apm-kpi-card-body">
              <span className="apm-kpi-card-val">{k.val}</span>
              <span className="apm-kpi-card-lbl">{k.lbl}</span>
              <span className="apm-kpi-card-sub">{k.sub}</span>
            </div>
            <div className="apm-kpi-card-deco" />
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="apm-toolbar">
        <div className="apm-tabs">
          {[
            { key: "actif",   label: "Actifs",    count: actifs.length,   dot: "green" },
            { key: "inactif", label: "Suspendus", count: inactifs.length, dot: "rose" },
          ].map(t => (
            <button key={t.key} className={`apm-tab ${filterTab === t.key ? "apm-tab-active" : ""}`}
              onClick={() => setFilterTab(t.key)}>
              <span className={`apm-tab-dot apm-td-${t.dot}`} />
              {t.label}
              <span className="apm-tab-badge">{t.count}</span>
            </button>
          ))}
        </div>
        <div className="apm-toolbar-spacer" />
        <label className="apm-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un partenaire…" />
          {search && (
            <button className="apm-search-clear" onClick={() => setSearch("")} title="Effacer">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="10" height="10">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </label>
        <button className={`apm-btn-filter ${showFilters ? "active" : ""} ${(filterType || filterEnt) ? "has-filter" : ""}`}
          onClick={() => setShowFilters(v => !v)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
          Filtres
          {(filterType || filterEnt) && <span className="apm-filter-badge">!</span>}
        </button>
        <div className="apm-result-count">
          <span className="apm-rc-num">{filtered.length}</span>
          <span className="apm-rc-lbl">résultat{filtered.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Filtres avancés */}
      {showFilters && (
        <div className="apm-filter-drawer">
          <div className="apm-filter-drawer-inner">
            <p className="apm-filter-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
              </svg>
              Filtres avancés
            </p>
            <div className="apm-filter-fields">
              <div className="apm-filter-field">
                <label>Type de partenaire</label>
                <select value={filterType} onChange={e => setFilterType(e.target.value)}>
                  <option value="">Tous les types</option>
                  {["HOTEL","AGENCE","TRANSPORT","RESTAURATION","AUTRE"].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="apm-filter-field">
                <label>Nom d'entreprise</label>
                <input value={filterEnt} onChange={e => setFilterEnt(e.target.value)} placeholder="Ex: Hôtel Carthage…" />
              </div>
            </div>
            {(filterType || filterEnt) && (
              <button className="apm-filter-reset" onClick={() => { setFilterType(""); setFilterEnt(""); }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                  <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
                </svg>
                Réinitialiser les filtres
              </button>
            )}
          </div>
        </div>
      )}

      {/* États */}
      {loading && (
        <div className="apm-state-box">
          <div className="apm-loader">
            <div className="apm-loader-ring" />
            <div className="apm-loader-ring apm-loader-ring-2" />
          </div>
          <p>Chargement des partenaires…</p>
        </div>
      )}

      {error && (
        <div className="apm-error-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div>
            <strong>Erreur de chargement</strong>
            <p>{error}</p>
          </div>
          <button onClick={load}>Réessayer</button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="apm-state-box">
          <div className="apm-empty-icon">🤝</div>
          <h3>{hasFilters ? "Aucun résultat trouvé" : `Aucun partenaire ${filterTab === "actif" ? "actif" : "suspendu"}`}</h3>
          <p>{hasFilters ? "Essayez de modifier vos critères de recherche" : "Commencez par inviter votre premier partenaire"}</p>
          {!hasFilters && (
            <button className="apm-cta" onClick={() => setWizard(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
              </svg>
              Inviter un partenaire
            </button>
          )}
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="apm-grid">
          {filtered.map((p, i) => (
            <PartenaireCard key={p.id} partenaire={p} onToggle={handleToggle} onView={p => setSelectedId(p.id)} index={i} />
          ))}
        </div>
      )}

      {wizard && (
        <InvitationWizard
          onClose={() => { setWizard(false); onWizardConsumed?.(); }}
          onSuccess={() => { load(); onWizardConsumed?.(); }}
          initialEmail={initialWizardEmail || ""}
          initialStep={initialWizardEmail ? 2 : 1}
          initialForm={initialWizardForm || {}}
        />
      )}
    </div>
  );
}