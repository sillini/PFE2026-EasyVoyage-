/**
 * src/partenaire/components/finances/TabPaiements.jsx
 * =====================================================
 * Historique des paiements reçus de l'admin.
 * Ajouts : recherche N° facture, filtre par date, export CSV.
 */
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { fetchPartPaiements, downloadFacturePdf } from "../../services/financesPartenaireApi.js";

const fmt = (n) =>
  new Intl.NumberFormat("fr-TN", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n ?? 0);

const fmtDT = (d) =>
  d
    ? new Date(d).toLocaleDateString("fr-TN", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

// Retourne "YYYY-MM-DD" depuis une date ISO pour comparaison
const toDateStr = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");

const PER = 100; // Charger tout en une fois pour le filtrage/export côté frontend

// ── Bouton PDF ────────────────────────────────────────────
function BtnPdf({ paiementId, numeroFacture }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await downloadFacturePdf(paiementId, numeroFacture);
    } catch {
      alert("Impossible de télécharger la facture.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      title={`Télécharger ${numeroFacture || ""}`}
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "5px 12px", borderRadius: 7,
        cursor: loading ? "not-allowed" : "pointer",
        border: "1.5px solid #1A3F63",
        background: loading ? "#F0F4F8" : "#EBF4FF",
        color: "#1A3F63", fontSize: 12, fontWeight: 700,
        opacity: loading ? 0.7 : 1, transition: "all .15s",
        fontFamily: "inherit",
      }}
    >
      {loading ? (
        <><span style={{ fontSize: 11 }}>⏳</span> Chargement…</>
      ) : (
        <>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="12" y1="18" x2="12" y2="12"/>
            <polyline points="9 15 12 18 15 15"/>
          </svg>
          PDF
        </>
      )}
    </button>
  );
}

// ── Composant principal ───────────────────────────────────
export default function TabPaiements() {
  const [allItems,  setAllItems]  = useState([]);   // toutes les données (sans pagination backend)
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [csvLoad,   setCsvLoad]   = useState(false);

  // Filtres
  const [searchNum, setSearchNum] = useState("");   // recherche N° facture
  const [dateDebut, setDateDebut] = useState("");   // YYYY-MM-DD
  const [dateFin,   setDateFin]   = useState("");   // YYYY-MM-DD

  const debounceRef = useRef(null);
  const searchRef   = useRef(null);

  // ── Chargement (une seule fois, tout récupérer) ──────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await fetchPartPaiements(1, PER);
      setAllItems(d.items || []);
      setTotal(d.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Filtrage côté frontend ────────────────────────────
  const filtered = useMemo(() => {
    let items = allItems;

    // Filtre N° facture
    if (searchNum.trim()) {
      const q = searchNum.trim().toLowerCase();
      items = items.filter((p) =>
        (p.numero_facture || "").toLowerCase().includes(q)
      );
    }

    // Filtre date début
    if (dateDebut) {
      items = items.filter((p) => toDateStr(p.created_at) >= dateDebut);
    }

    // Filtre date fin
    if (dateFin) {
      items = items.filter((p) => toDateStr(p.created_at) <= dateFin);
    }

    return items;
  }, [allItems, searchNum, dateDebut, dateFin]);

  // Totaux calculés sur les lignes filtrées
  const totalMontant = filtered.reduce((s, p) => s + (p.montant || 0), 0);
  const hasFilters   = searchNum.trim() || dateDebut || dateFin;

  const onSearchChange = (val) => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearchNum(val), 300);
  };

  const onReset = () => {
    setSearchNum("");
    setDateDebut("");
    setDateFin("");
    if (searchRef.current) searchRef.current.value = "";
  };

  // ── Export CSV ────────────────────────────────────────
  const onExportCsv = () => {
    if (filtered.length === 0) { alert("Aucune donnée à exporter."); return; }
    setCsvLoad(true);
    try {
      const headers = ["#", "N° Facture", "Date paiement", "Montant (DT)", "Note", "Statut", "PDF dispo"];

      const escape = (v) => {
        if (v == null) return "";
        const s = String(v).replace(/"/g, '""');
        return (s.includes(",") || s.includes('"') || s.includes("\n")) ? `"${s}"` : s;
      };

      const rows = filtered.map((p, i) => [
        escape(i + 1),
        escape(p.numero_facture || "—"),
        escape(fmtDT(p.created_at)),
        escape(p.montant != null ? p.montant.toFixed(2) : "0.00"),
        escape(p.note || ""),
        escape("Versé"),
        escape(p.has_pdf ? "Oui" : "Non"),
      ]);

      const bom  = "\uFEFF";
      const csv  = bom + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url  = URL.createObjectURL(blob);
      const date = new Date().toISOString().slice(0, 10);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = "paiements_recus_" + date + ".csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Erreur export : " + (err.message || String(err)));
    } finally {
      setCsvLoad(false);
    }
  };

  // ── Rendu ─────────────────────────────────────────────
  return (
    <div className="pf-card">

      {/* ── En-tête ── */}
      <div className="pf-card-header">
        <h3 className="pf-card-title">Paiements reçus</h3>
        {total > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, color: "#7A8FA6" }}>
              {filtered.length !== total
                ? `${filtered.length} / ${total} paiement(s)`
                : `${total} paiement(s)`}
            </span>
            <span style={{
              fontSize: 13, fontWeight: 700, color: "#155724",
              background: "#D4EDDA", padding: "3px 10px", borderRadius: 99,
            }}>
              Total : {fmt(totalMontant)} DT
            </span>
          </div>
        )}
      </div>

      {/* ── Toolbar : recherche + dates + reset + export ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "12px 20px", borderBottom: "1px solid #EEF2F7",
        background: "#FAFCFF", flexWrap: "wrap",
      }}>

        {/* Recherche N° facture */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "#fff", border: "1.5px solid #DDE5EE",
          borderRadius: 8, padding: "7px 12px", flex: 1, minWidth: 200,
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7A8FA6" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref={searchRef}
            type="text"
            placeholder="Rechercher par N° facture…"
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              border: "none", outline: "none", background: "transparent",
              fontSize: 13, color: "#1C2B3A", width: "100%", fontFamily: "inherit",
            }}
          />
        </div>

        {/* Date début */}
        <input
          type="date"
          value={dateDebut}
          onChange={(e) => setDateDebut(e.target.value)}
          title="Date de début"
          style={{
            border: "1.5px solid #DDE5EE", borderRadius: 8,
            padding: "7px 10px", fontSize: 12, color: "#1C2B3A",
            background: "#fff", outline: "none", cursor: "pointer", fontFamily: "inherit",
          }}
        />

        <span style={{ fontSize: 12, color: "#7A8FA6", flexShrink: 0 }}>→</span>

        {/* Date fin */}
        <input
          type="date"
          value={dateFin}
          onChange={(e) => setDateFin(e.target.value)}
          title="Date de fin"
          style={{
            border: "1.5px solid #DDE5EE", borderRadius: 8,
            padding: "7px 10px", fontSize: 12, color: "#1C2B3A",
            background: "#fff", outline: "none", cursor: "pointer", fontFamily: "inherit",
          }}
        />

        {/* Reset */}
        {hasFilters && (
          <button
            onClick={onReset}
            style={{
              padding: "7px 12px", background: "#FEE2E2", color: "#991B1B",
              border: "1px solid #FECACA", borderRadius: 8,
              fontSize: 11, fontWeight: 700, cursor: "pointer",
              whiteSpace: "nowrap", fontFamily: "inherit",
            }}
          >
            ✕ Réinitialiser
          </button>
        )}

        {/* Export CSV */}
        <button
          onClick={onExportCsv}
          disabled={csvLoad || loading || filtered.length === 0}
          style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            padding: "7px 16px", background: "#0F2235", color: "#fff",
            border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700,
            cursor: (csvLoad || loading || filtered.length === 0) ? "not-allowed" : "pointer",
            opacity: (csvLoad || loading || filtered.length === 0) ? 0.5 : 1,
            whiteSpace: "nowrap", fontFamily: "inherit", flexShrink: 0,
          }}
        >
          {csvLoad ? (
            "Export…"
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="8" y1="13" x2="16" y2="13"/>
                <line x1="8" y1="17" x2="16" y2="17"/>
              </svg>
              Exporter CSV
            </>
          )}
        </button>
      </div>

      {/* ── Tableau ── */}
      {loading ? (
        <div className="pf-spinner"><div className="pf-spin" /></div>
      ) : (
        <>
          <div className="pf-table-wrap">
            <table className="pf-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>N° Facture</th>
                  <th>Date de paiement</th>
                  <th style={{ textAlign: "right" }}>Montant reçu</th>
                  <th>Note</th>
                  <th>Statut</th>
                  <th style={{ textAlign: "center" }}>Facture</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="pf-empty">
                      {hasFilters
                        ? "Aucun paiement ne correspond à vos critères."
                        : "Aucun paiement reçu pour le moment."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((p, i) => (
                    <tr key={p.id}>

                      {/* # */}
                      <td style={{ color: "#7A8FA6", fontSize: 12 }}>{i + 1}</td>

                      {/* N° Facture */}
                      <td style={{
                        fontFamily: "monospace", fontSize: 12,
                        color: "#1A3F63", fontWeight: 700,
                      }}>
                        {p.numero_facture || (
                          <span style={{ color: "#7A8FA6", fontStyle: "italic", fontFamily: "inherit" }}>—</span>
                        )}
                      </td>

                      {/* Date */}
                      <td style={{ fontSize: 13 }}>{fmtDT(p.created_at)}</td>

                      {/* Montant */}
                      <td style={{ textAlign: "right" }}>
                        <span className="pf-amt">{fmt(p.montant)} DT</span>
                      </td>

                      {/* Note */}
                      <td style={{ fontSize: 12, color: "#7A8FA6", maxWidth: 200 }}>
                        {p.note
                          ? <span title={p.note}>{p.note.length > 40 ? p.note.slice(0, 40) + "…" : p.note}</span>
                          : <span style={{ fontStyle: "italic" }}>—</span>
                        }
                      </td>

                      {/* Statut */}
                      <td>
                        <span style={{
                          display: "inline-block", padding: "3px 10px",
                          borderRadius: 99, fontSize: 11, fontWeight: 700,
                          background: "#D4EDDA", color: "#155724",
                        }}>
                          ✓ Versé
                        </span>
                      </td>

                      {/* Facture PDF */}
                      <td style={{ textAlign: "center" }}>
                        {p.has_pdf
                          ? <BtnPdf paiementId={p.id} numeroFacture={p.numero_facture} />
                          : <span style={{ color: "#7A8FA6", fontSize: 12, fontStyle: "italic" }}>—</span>
                        }
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ── Total ligne de bas ── */}
          {filtered.length > 0 && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "flex-end",
              padding: "10px 20px", borderTop: "1px solid #EEF2F7",
              fontSize: 13, gap: 8,
            }}>
              <span style={{ color: "#7A8FA6" }}>
                {filtered.length} paiement{filtered.length > 1 ? "s" : ""}
                {hasFilters && ` (filtrés sur ${total})`}
              </span>
              <span style={{
                fontWeight: 700, color: "#155724",
                background: "#D4EDDA", padding: "3px 12px", borderRadius: 99,
              }}>
                Total : {fmt(totalMontant)} DT
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}