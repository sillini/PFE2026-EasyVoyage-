/**
 * src/partenaire/components/finances/TabPaiements.jsx
 * =====================================================
 * Historique des paiements réellement reçus de l'admin.
 * Chaque paiement validé dispose d'un bouton PDF téléchargeable.
 */
import { useState, useEffect, useCallback } from "react";
import { fetchPartPaiements, downloadFacturePdf } from "../../services/financesPartenaireApi.js";

const fmt = (n) =>
  new Intl.NumberFormat("fr-TN", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n ?? 0);

const fmtDT = (d) =>
  d
    ? new Date(d).toLocaleDateString("fr-TN", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

const PER = 20;

// ── Bouton téléchargement PDF ─────────────────────────────
function BtnPdf({ paiementId, numeroFacture }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await downloadFacturePdf(paiementId, numeroFacture);
    } catch (e) {
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
        padding: "5px 12px", borderRadius: 7, cursor: loading ? "not-allowed" : "pointer",
        border: "1.5px solid #1A3F63", background: loading ? "#F0F4F8" : "#EBF4FF",
        color: "#1A3F63", fontSize: 12, fontWeight: 700,
        opacity: loading ? 0.7 : 1, transition: "all .15s",
        fontFamily: "inherit",
      }}
    >
      {loading ? (
        <>
          <span style={{ fontSize: 11 }}>⏳</span> Chargement…
        </>
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

export default function TabPaiements() {
  const [items,   setItems]   = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await fetchPartPaiements(page, PER);
      setItems(d.items || []);
      setTotal(d.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / PER);

  // Total des montants reçus
  const totalMontant = items.reduce((s, p) => s + (p.montant || 0), 0);

  return (
    <div className="pf-card">
      <div className="pf-card-header">
        <h3 className="pf-card-title">Paiements reçus</h3>
        {total > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 13, color: "#7A8FA6" }}>{total} paiement(s)</span>
            <span style={{
              fontSize: 13, fontWeight: 700, color: "#155724",
              background: "#D4EDDA", padding: "3px 10px", borderRadius: 99,
            }}>
              Total : {fmt(totalMontant)} DT
            </span>
          </div>
        )}
      </div>

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
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="pf-empty">
                      Aucun paiement reçu pour le moment.
                    </td>
                  </tr>
                ) : (
                  items.map((p, i) => (
                    <tr key={p.id}>

                      {/* # */}
                      <td style={{ color: "#7A8FA6", fontSize: 12 }}>
                        {(page - 1) * PER + i + 1}
                      </td>

                      {/* N° Facture */}
                      <td style={{ fontFamily: "monospace", fontSize: 12, color: "#1A3F63", fontWeight: 700 }}>
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
                          : <span style={{ fontStyle: "italic" }}>—</span>}
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
                        {p.has_pdf ? (
                          <BtnPdf paiementId={p.id} numeroFacture={p.numero_facture} />
                        ) : (
                          <span style={{ color: "#7A8FA6", fontSize: 12, fontStyle: "italic" }}>—</span>
                        )}
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pf-pagination">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
                ‹ Précédent
              </button>
              <span>Page {page} / {totalPages} — {total} entrée(s)</span>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                Suivant ›
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}