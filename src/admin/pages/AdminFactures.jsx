/**
 * src/admin/pages/AdminFactures.jsx
 * ====================================
 * Page Admin — Factures
 * 3 onglets : Clients | Visiteurs | Paiements Partenaires
 *
 * Dépendances :
 *   ./AdminFactures.css
 *   ../services/facturesAdminApi.js
 *   ../services/formatters.js  (fmt, fmtD)
 */
import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchFacturesKpis,
  fetchFacturesAdmin,
  fetchFactureDetail,
  downloadFacturePdf,
} from "../services/facturesAdminApi.js";
import { fmt, fmtD } from "../services/formatters.js";
import "./AdminFactures.css";

// ─────────────────────────────────────────────────────────
//  CONSTANTES
// ─────────────────────────────────────────────────────────
const PER_PAGE = 50;

const TABS = [
  { id: null,         label: "Toutes",                icon: "◈" },
  { id: "client",     label: "Clients",               icon: "👤" },
  { id: "visiteur",   label: "Visiteurs",             icon: "🚶" },
  { id: "partenaire", label: "Paiements Partenaires", icon: "🤝" },
];

const STATUTS = [
  { value: "",          label: "Tous les statuts" },
  { value: "PAYEE",     label: "Payée"            },
  { value: "EMISE",     label: "Émise"            },
  { value: "EN_RETARD", label: "En retard"        },
  { value: "ANNULEE",   label: "Annulée"          },
];

const STATUT_META = {
  PAYEE:     { label: "Payée",     bg: "#D4EDDA", color: "#155724", dot: "#27AE60" },
  EMISE:     { label: "Émise",     bg: "#D0ECF8", color: "#0A5078", dot: "#2980B9" },
  EN_RETARD: { label: "En retard", bg: "#FEE2E2", color: "#991B1B", dot: "#E74C3C" },
  ANNULEE:   { label: "Annulée",   bg: "#F0F0F0", color: "#666",    dot: "#999"    },
};

const TYPE_META = {
  client:     { label: "Client",     bg: "#E8EEF9", color: "#1A3F63" },
  visiteur:   { label: "Visiteur",   bg: "#F0EBF8", color: "#6C3483" },
  partenaire: { label: "Partenaire", bg: "#E8F7EE", color: "#155724" },
};

const AVATAR_COLORS = [
  "#1A3F63","#27AE60","#8E44AD","#C4973A",
  "#E74C3C","#2980B9","#16A085","#D35400",
];

// ─────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────
const initiales = (nom = "") => {
  const p = nom.trim().split(" ");
  return p.length >= 2
    ? (p[0][0] + p[p.length - 1][0]).toUpperCase()
    : nom.slice(0, 2).toUpperCase();
};

const avatarColor = (str = "") => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
};

// ─────────────────────────────────────────────────────────
//  ATOMES UI
// ─────────────────────────────────────────────────────────
function Spinner({ size = "md" }) {
  return <span className={`af-spin af-spin-${size}`} />;
}

function Avatar({ nom }) {
  return (
    <div className="af-avatar" style={{ background: avatarColor(nom) }}>
      {initiales(nom)}
    </div>
  );
}

function BadgeStatut({ statut }) {
  if (!statut) return <span className="af-badge-none">—</span>;
  const m = STATUT_META[statut] || { label: statut, bg: "#eee", color: "#555", dot: "#999" };
  return (
    <span className="af-badge" style={{ background: m.bg, color: m.color }}>
      <span className="af-badge-dot" style={{ background: m.dot }} />
      {m.label}
    </span>
  );
}

function BadgeType({ type }) {
  const m = TYPE_META[type] || { label: type, bg: "#eee", color: "#555" };
  return (
    <span className="af-badge-type" style={{ background: m.bg, color: m.color }}>
      {m.label}
    </span>
  );
}

function KpiCard({ icon, label, value, sub, accent }) {
  return (
    <div className="af-kpi" style={{ "--accent": accent }}>
      <div className="af-kpi-icon">{icon}</div>
      <div className="af-kpi-body">
        <div className="af-kpi-value">{value}</div>
        <div className="af-kpi-label">{label}</div>
        {sub && <div className="af-kpi-sub">{sub}</div>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  MODALE DÉTAIL
// ─────────────────────────────────────────────────────────
function DetailModal({ item, onClose }) {
  const [detail,   setDetail]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [dlLoading, setDlLoad]  = useState(false);

  useEffect(() => {
    fetchFactureDetail(item.id, item.type)
      .then(setDetail)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [item.id, item.type]);

  const handlePdf = async () => {
    setDlLoad(true);
    try { await downloadFacturePdf(item.id, item.type, `facture_${item.numero}.pdf`); }
    catch (e) { alert("Erreur PDF : " + e.message); }
    finally { setDlLoad(false); }
  };

  const stopProp = (e) => e.stopPropagation();

  return (
    <div className="af-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="af-modal" onClick={stopProp}>

        {/* Ridge décoratif */}
        <div className="af-modal-ridge" />

        {/* Header */}
        <div className="af-modal-head">
          <div className="af-modal-head-left">
            <div className="af-modal-head-icon">📄</div>
            <div>
              <div className="af-modal-num">{item.numero}</div>
              <div className="af-modal-badges">
                <BadgeType type={item.type} />
                {item.statut && <BadgeStatut statut={item.statut} />}
              </div>
            </div>
          </div>
          <button className="af-modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Corps */}
        <div className="af-modal-body">
          {loading && (
            <div className="af-modal-loading">
              <Spinner /> Chargement…
            </div>
          )}
          {error && <div className="af-modal-error">⚠️ {error}</div>}

          {!loading && !error && detail && (
            <>
              {/* Section personne */}
              <div className="af-msection">
                <div className="af-msection-title">
                  <span>👤</span>
                  {detail.type === "partenaire" ? "Partenaire" : "Client / Visiteur"}
                </div>
                <div className="af-person-row">
                  <Avatar nom={detail.personne_nom} />
                  <div>
                    <div className="af-detail-name">{detail.personne_nom}</div>
                    <div className="af-detail-email">{detail.personne_email}</div>
                    {detail.personne_tel && (
                      <div className="af-detail-line">📞 {detail.personne_tel}</div>
                    )}
                    {detail.partenaire_entreprise && (
                      <div className="af-detail-line af-detail-ent">
                        🏢 {detail.partenaire_entreprise}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Section méta */}
              <div className="af-msection">
                <div className="af-msection-title"><span>🗂️</span> Informations facture</div>
                <div className="af-meta-grid">
                  <div className="af-meta-item">
                    <span>N° Facture</span>
                    <strong className="af-mono">{detail.numero}</strong>
                  </div>
                  <div className="af-meta-item">
                    <span>Date émission</span>
                    <strong>{fmtD(detail.date_emission)}</strong>
                  </div>
                  <div className="af-meta-item">
                    <span>Montant total</span>
                    <strong className="af-big-amount">{fmt(detail.montant_total)} DT</strong>
                  </div>
                  {detail.statut && (
                    <div className="af-meta-item">
                      <span>Statut</span>
                      <BadgeStatut statut={detail.statut} />
                    </div>
                  )}
                  {detail.methode_paiement && (
                    <div className="af-meta-item">
                      <span>Méthode</span>
                      <strong>{detail.methode_paiement.replace(/_/g, " ")}</strong>
                    </div>
                  )}
                  {detail.numero_voucher && (
                    <div className="af-meta-item">
                      <span>N° Voucher</span>
                      <strong className="af-mono">{detail.numero_voucher}</strong>
                    </div>
                  )}
                  {detail.reservation_id && (
                    <div className="af-meta-item">
                      <span>ID Réservation</span>
                      <strong>#{detail.reservation_id}</strong>
                    </div>
                  )}
                  {detail.note && (
                    <div className="af-meta-item af-meta-full">
                      <span>Note</span>
                      <strong>{detail.note}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Section lignes */}
              {detail.lignes?.length > 0 && (
                <div className="af-msection">
                  <div className="af-msection-title"><span>📋</span> Détail des prestations</div>
                  <table className="af-lines">
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th>Période</th>
                        <th>Nuits</th>
                        <th>P.U.</th>
                        <th>Sous-total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.lignes.map((l, i) => (
                        <tr key={i}>
                          <td>{l.description}</td>
                          <td>
                            {l.date_debut && l.date_fin
                              ? `${fmtD(l.date_debut)} → ${fmtD(l.date_fin)}`
                              : "—"}
                          </td>
                          <td>{l.nb_nuits ?? "—"}</td>
                          <td>{l.prix_unitaire != null ? `${fmt(l.prix_unitaire)} DT` : "—"}</td>
                          <td className="af-lines-sub">{fmt(l.sous_total)} DT</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={4} className="af-lines-ftlabel">Total TTC</td>
                        <td className="af-lines-ftval">{fmt(detail.montant_total)} DT</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="af-modal-footer">
          <button className="af-btn-ghost" onClick={onClose}>Fermer</button>
          {item.has_pdf && (
            <button className="af-btn-primary" onClick={handlePdf} disabled={dlLoading}>
              {dlLoading ? <><Spinner size="sm" /> Génération…</> : <>📥 Télécharger PDF</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  PAGE PRINCIPALE
// ─────────────────────────────────────────────────────────
export default function AdminFactures() {
  /* ── State ── */
  const [kpis,     setKpis]     = useState(null);
  const [kpisLoad, setKpisLoad] = useState(true);

  const [items,    setItems]    = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const [activeTab,  setActiveTab]  = useState(null);
  const [statut,     setStatut]     = useState("");
  const [search,     setSearch]     = useState("");
  const [dateDebut,  setDateDebut]  = useState("");
  const [dateFin,    setDateFin]    = useState("");
  const [page,       setPage]       = useState(1);

  const [modalItem,  setModalItem]  = useState(null);
  const [dlId,       setDlId]       = useState(null);
  const [csvLoading, setCsvLoading] = useState(false);

  const searchInput = useRef(null);
  const debounce    = useRef(null);

  /* ── Charger KPIs ── */
  useEffect(() => {
    setKpisLoad(true);
    fetchFacturesKpis()
      .then(setKpis)
      .catch(console.error)
      .finally(() => setKpisLoad(false));
  }, []);

  /* ── Charger liste ── */
  const loadList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFacturesAdmin({
        type:       activeTab   || undefined,
        statut:     statut      || undefined,
        search:     search      || undefined,
        date_debut: dateDebut   || undefined,
        date_fin:   dateFin     || undefined,
        page,
        per_page: PER_PAGE,
      });
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [activeTab, statut, search, dateDebut, dateFin, page]);

  useEffect(() => { loadList(); }, [loadList]);

  /* ── Handlers ── */
  const onSearchChange = (val) => {
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => { setSearch(val); setPage(1); }, 350);
  };

  const onTabChange = (id) => {
    setActiveTab(id);
    setStatut("");
    setPage(1);
  };

  const onReset = () => {
    setStatut(""); setDateDebut(""); setDateFin(""); setSearch(""); setPage(1);
    if (searchInput.current) searchInput.current.value = "";
  };

  const onQuickPdf = async (item, e) => {
    e.stopPropagation();
    setDlId(item.id);
    try { await downloadFacturePdf(item.id, item.type, `facture_${item.numero}.pdf`); }
    catch (err) { alert("Erreur PDF : " + err.message); }
    finally { setDlId(null); }
  };

  /* ── Export CSV ── */
  const onExportCsv = async () => {
    setCsvLoading(true);
    try {
      // Charger TOUTES les données (sans pagination) avec les filtres actifs
      const data = await fetchFacturesAdmin({
        type:       activeTab  || undefined,
        statut:     statut     || undefined,
        search:     search     || undefined,
        date_debut: dateDebut  || undefined,
        date_fin:   dateFin    || undefined,
        page:       1,
        per_page:   100,
      });

      const allItems = data.items || [];
      if (allItems.length === 0) { alert("Aucune donn\u00e9e \u00e0 exporter."); return; }
      if (data.total > 100) {
        const ok = window.confirm(`Export des 100 premi\u00e8res factures sur ${data.total} au total. Continuer ?`);
        if (!ok) return;
      }

      // En-têtes CSV
      const headers = [
        "N° Facture", "Type", "Nom", "Email", "Téléphone",
        "Contexte", "Date émission", "Montant (DT)", "Statut", "Note",
      ];

      // Formater chaque ligne
      const escape = (v) => {
        if (v == null) return "";
        const s = String(v).replace(/"/g, '""');
        return (s.includes(",") || s.includes('"') || s.includes("\n")) ? `"${s}"` : s;
      };

      const rows = allItems.map((item) => [
        escape(item.numero),
        escape(item.type === "client" ? "Client" : item.type === "visiteur" ? "Visiteur" : "Partenaire"),
        escape(item.personne_nom),
        escape(item.personne_email),
        escape(item.personne_tel || ""),
        escape(item.contexte || ""),
        escape(item.date_emission ? new Date(item.date_emission).toLocaleDateString("fr-FR") : ""),
        escape(item.montant_total?.toFixed(2) || "0.00"),
        escape(item.statut || "PAYÉE"),
        escape(item.note || ""),
      ]);

      // Construire le CSV avec BOM UTF-8 pour Excel
      const bom = "\uFEFF";
      const lines = [headers.join(","), ...rows.map((r) => r.join(","))];
      const csv = bom + lines.join("\r\n");

      // Déclencher le téléchargement
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url  = URL.createObjectURL(blob);
      const tab  = TABS.find((t) => t.id === activeTab);
      const label = tab ? tab.label.toLowerCase().replace(/\s/g, "_") : "toutes";
      const dateStr = new Date().toISOString().slice(0, 10);
      const a = document.createElement("a");
      a.href = url;
      a.download = "factures_" + label + "_" + dateStr + ".csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      const msg = (err && err.message) ? err.message : String(err);
      alert("Erreur export CSV : " + msg);
    } finally {
      setCsvLoading(false);
    }
  };

  /* ── Dérivés ── */
  const totalPages = Math.ceil(total / PER_PAGE);

  const tabCount = (id) => {
    if (!kpis) return null;
    if (id === "client")
      return kpis.nb_clients_payee + kpis.nb_clients_emise + kpis.nb_clients_retard + kpis.nb_clients_annulee;
    if (id === "visiteur")
      return kpis.nb_visiteurs_payee + kpis.nb_visiteurs_annulee;
    if (id === "partenaire")
      return kpis.nb_paiements_partenaires;
    return null;
  };

  const hasFilters = statut || dateDebut || dateFin || search;

  /* ── Pages fenêtrées ── */
  const pageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 4)       return [1,2,3,4,5,"…",totalPages];
    if (page >= totalPages - 3) return [1,"…",totalPages-4,totalPages-3,totalPages-2,totalPages-1,totalPages];
    return [1,"…",page-1,page,page+1,"…",totalPages];
  };

  // ── Rendu ────────────────────────────────────────────────
  return (
    <div className="af-page">

      {/* ══ HEADER ══ */}
      <header className="af-header">
        <div>
          <div className="af-eyebrow">
            <span className="af-eyebrow-dot" />
            Gestion administrative
          </div>
          <h1 className="af-title">Factures</h1>
          <p className="af-desc">
            Historique complet — clients, visiteurs &amp; paiements partenaires
          </p>
        </div>
      </header>

      {/* ══ KPI CARDS ══ */}
      <div className="af-kpi-grid">
        <KpiCard
          icon="💰" accent="#1A3F63"
          label="Total facturé (payé)"
          value={kpisLoad ? "…" : `${fmt(kpis?.total_global_facture ?? 0)} DT`}
          sub="clients + visiteurs"
        />
        <KpiCard
          icon="✅" accent="#27AE60"
          label="Factures clients payées"
          value={kpisLoad ? "…" : (kpis?.nb_clients_payee ?? "—")}
        />
        <KpiCard
          icon="🚶" accent="#8E44AD"
          label="Factures visiteurs"
          value={kpisLoad ? "…" : (kpis?.nb_visiteurs_payee ?? "—")}
        />
        <KpiCard
          icon="🤝" accent="#C4973A"
          label="Paiements partenaires"
          value={kpisLoad ? "…" : (kpis?.nb_paiements_partenaires ?? "—")}
        />
      </div>

      {/* ══ CARD PRINCIPALE ══ */}
      <div className="af-card">

        {/* ── Onglets ── */}
        <div className="af-tabs">
          {TABS.map((t) => {
            const cnt = tabCount(t.id);
            const isActive = activeTab === t.id;
            return (
              <button
                key={String(t.id)}
                className={`af-tab${isActive ? " af-tab-active" : ""}`}
                onClick={() => onTabChange(t.id)}
              >
                <span className="af-tab-ico">{t.icon}</span>
                {t.label}
                {cnt != null && (
                  <span className={`af-tab-badge${isActive ? " af-tab-badge-active" : ""}`}>
                    {cnt}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Toolbar ── */}
        <div className="af-toolbar">
          {/* Recherche */}
          <div className="af-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" style={{ color: "#7A93AE", flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={searchInput}
              type="text"
              placeholder="Rechercher par N° facture, nom, email, hôtel…"
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          {/* Filtre statut (masqué pour partenaires) */}
          {activeTab !== "partenaire" && (
            <select
              className="af-select"
              value={statut}
              onChange={(e) => { setStatut(e.target.value); setPage(1); }}
            >
              {STATUTS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          )}

          {/* Dates */}
          <input
            type="date"
            className="af-input-date"
            value={dateDebut}
            onChange={(e) => { setDateDebut(e.target.value); setPage(1); }}
            title="Date début"
          />
          <span className="af-date-sep">→</span>
          <input
            type="date"
            className="af-input-date"
            value={dateFin}
            onChange={(e) => { setDateFin(e.target.value); setPage(1); }}
            title="Date fin"
          />

          {/* Reset */}
          {hasFilters && (
            <button className="af-btn-reset" onClick={onReset}>
              ✕ Réinitialiser
            </button>
          )}

          {/* Export CSV */}
          <button
            className="af-btn-export"
            onClick={onExportCsv}
            disabled={csvLoading || loading || total === 0}
            title="Exporter en CSV (Excel)"
          >
            {csvLoading ? (
              <><Spinner size="sm" /> Export…</>
            ) : (
              <><CsvIcon /> Exporter CSV</>
            )}
          </button>
        </div>

        {/* ── Tableau ── */}
        <div className="af-table-wrap">
          {loading ? (
            <div className="af-state-row">
              <Spinner /> Chargement des factures…
            </div>
          ) : error ? (
            <div className="af-state-row af-state-error">⚠️ {error}</div>
          ) : items.length === 0 ? (
            <div className="af-state-empty">
              <div className="af-empty-ico">🗂️</div>
              <div className="af-empty-title">Aucune facture trouvée</div>
              <div className="af-empty-sub">Modifiez vos filtres ou choisissez une autre période</div>
            </div>
          ) : (
            <table className="af-table">
              <thead>
                <tr>
                  <th>N° Facture</th>
                  <th>Personne</th>
                  <th>Type</th>
                  <th>Contexte</th>
                  <th>Date</th>
                  <th>Montant</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={`${item.type}-${item.id}`}
                    className="af-tr"
                    onClick={() => setModalItem(item)}
                  >
                    <td>
                      <span className="af-num">{item.numero}</span>
                    </td>
                    <td>
                      <div className="af-person-cell">
                        <Avatar nom={item.personne_nom} />
                        <div>
                          <div className="af-pname">{item.personne_nom}</div>
                          <div className="af-pemail">{item.personne_email}</div>
                        </div>
                      </div>
                    </td>
                    <td><BadgeType type={item.type} /></td>
                    <td>
                      <span className="af-contexte" title={item.contexte}>
                        {item.contexte || "—"}
                      </span>
                    </td>
                    <td><span className="af-date">{fmtD(item.date_emission)}</span></td>
                    <td><span className="af-montant">{fmt(item.montant_total)} DT</span></td>
                    <td><BadgeStatut statut={item.statut} /></td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="af-actions">
                        <button
                          className="af-btn-view"
                          onClick={(e) => { e.stopPropagation(); setModalItem(item); }}
                          title="Voir le détail"
                        >
                          <EyeIcon /> Voir
                        </button>
                        {item.has_pdf && (
                          <button
                            className="af-btn-pdf"
                            onClick={(e) => onQuickPdf(item, e)}
                            disabled={dlId === item.id}
                            title="Télécharger PDF"
                          >
                            {dlId === item.id ? <Spinner size="sm" /> : <DownloadIcon />}
                            PDF
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Pagination ── */}
        {!loading && total > 0 && (
          <div className="af-pagination">
            <span className="af-pg-info">
              {total} facture{total > 1 ? "s" : ""} — page {page} / {totalPages}
            </span>
            <div className="af-pg-btns">
              <button
                className="af-pg-btn"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >← Préc.</button>

              {pageNumbers().map((p, i) =>
                p === "…"
                  ? <span key={`sep-${i}`} className="af-pg-sep">…</span>
                  : (
                    <button
                      key={p}
                      className={`af-pg-btn${p === page ? " af-pg-active" : ""}`}
                      onClick={() => setPage(p)}
                    >{p}</button>
                  )
              )}

              <button
                className="af-pg-btn"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >Suiv. →</button>
            </div>
          </div>
        )}
      </div>

      {/* ══ MODALE ══ */}
      {modalItem && (
        <DetailModal item={modalItem} onClose={() => setModalItem(null)} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  ICÔNES INLINE (évite une dépendance externe)
// ─────────────────────────────────────────────────────────
function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="11" height="11">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="11" height="11">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function CsvIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="16" y2="17" />
      <line x1="8" y1="9" x2="10" y2="9" />
    </svg>
  );
}