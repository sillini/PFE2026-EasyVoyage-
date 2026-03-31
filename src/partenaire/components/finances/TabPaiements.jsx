/**
 * src/partenaire/components/finances/TabPaiements.jsx
 * =====================================================
 * Historique des paiements reçus de l'admin.
 */
import { useState, useEffect, useCallback } from "react";
import { fetchPartPaiements } from "../../services/financesPartenaireApi.js";

const fmt = (n) =>
  new Intl.NumberFormat("fr-TN", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n ?? 0);

const fmtDT = (d) =>
  d ? new Date(d).toLocaleDateString("fr-TN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const PER = 20;

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

  return (
    <div className="pf-card">
      <div className="pf-card-header">
        <h3 className="pf-card-title">Paiements reçus</h3>
        {total > 0 && (
          <span style={{ fontSize: 13, color: "#7A8FA6" }}>
            {total} entrée(s)
          </span>
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
                  <th>Date</th>
                  <th style={{ textAlign: "right" }}>Montant</th>
                  <th>Note</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan={5} className="pf-empty">Aucun paiement enregistré.</td></tr>
                ) : (
                  items.map((p, i) => {
                    const isDemande = p.note?.startsWith("DEMANDE_RETRAIT:");
                    return (
                      <tr key={p.id}>
                        <td style={{ color: "#7A8FA6", fontSize: 12 }}>{(page - 1) * PER + i + 1}</td>
                        <td>{fmtDT(p.created_at)}</td>
                        <td style={{ textAlign: "right" }}>
                          {isDemande
                            ? <span style={{ color: "#7A8FA6", fontStyle: "italic" }}>En attente</span>
                            : <span className="pf-amt">{fmt(p.montant)} DT</span>
                          }
                        </td>
                        <td style={{ fontSize: 12, color: "#7A8FA6" }}>
                          {isDemande
                            ? `Demande retrait : ${p.note.split(":")[1]?.split("|")[0]?.trim()} DT`
                            : (p.note || "—")
                          }
                        </td>
                        <td>
                          {isDemande
                            ? <span className="pf-pill pf-pill--wait">En attente admin</span>
                            : <span className="pf-pill pf-pill--paid">Versé</span>
                          }
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="pf-pagination">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)}>‹ Précédent</button>
              <span>Page {page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Suivant ›</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}