/**
 * src/admin/components/finance/tabs/TabDemandes.jsx
 * ===================================================
 * Onglet admin — Demandes de retrait partenaires.
 *
 * Fonctionnalités :
 *  - Liste paginée avec filtres (statut, recherche, partenaire)
 *  - KPIs : nb EN_ATTENTE, total montant demandé
 *  - Modale valider / refuser avec note admin
 *  - Badge sur l'onglet mis à jour après chaque action
 */
import { useState, useEffect, useCallback } from "react";
import Spinner    from "../ui/Spinner.jsx";
import Pagination from "../ui/Pagination.jsx";
import {
  fetchDemandesRetrait,
  validerDemande,
  refuserDemande,
} from "../../../services/financesApi.js";
import { fmt, fmtD } from "../../../services/formatters.js";

const PER = 15;

// ── Badge statut ──────────────────────────────────────────
function BadgeStatut({ statut }) {
  const styles = {
    EN_ATTENTE: { background: "#FFF3CD", color: "#856404", label: "En attente" },
    APPROUVEE:  { background: "#D4EDDA", color: "#155724", label: "Approuvée"  },
    REFUSEE:    { background: "#FEE2E2", color: "#991B1B", label: "Refusée"    },
  };
  const s = styles[statut] || { background: "#EEE", color: "#555", label: statut };
  return (
    <span style={{
      padding: "3px 10px", borderRadius: 99, fontSize: 11,
      fontWeight: 700, background: s.background, color: s.color,
      display: "inline-block", whiteSpace: "nowrap",
    }}>
      {s.label}
    </span>
  );
}

// ── Modale action ─────────────────────────────────────────
function ActionModal({ demande, onClose, onDone }) {
  const [mode,      setMode]      = useState(null);   // "valider" | "refuser"
  const [noteAdmin, setNoteAdmin] = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);

  if (!demande) return null;

  const handleAction = async () => {
    setError(null);
    setLoading(true);
    try {
      let res;
      if (mode === "valider") res = await validerDemande(demande.id, noteAdmin);
      else                    res = await refuserDemande(demande.id, noteAdmin);

      if (res.success === false) {
        setError(res.message || "Erreur serveur.");
      } else {
        onDone();
        onClose();
      }
    } catch (e) {
      setError(e.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.45)",
      zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: "#fff", borderRadius: 14, padding: 32, width: 480,
        maxWidth: "95vw", boxShadow: "0 20px 60px rgba(0,0,0,.25)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#1A3F63" }}>
            Traiter la demande #{demande.id}
          </h3>
          <button onClick={onClose} style={{ border: "none", background: "none", fontSize: 20, cursor: "pointer", color: "#7A8FA6" }}>×</button>
        </div>

        {/* Infos demande */}
        <div style={{
          background: "#F8FAFC", borderRadius: 10, padding: "14px 16px",
          marginBottom: 20, fontSize: 13,
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px" }}>
            <div>
              <span style={{ color: "#7A8FA6", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>Partenaire</span>
              <div style={{ fontWeight: 700, color: "#1A3F63" }}>
                {demande.partenaire_prenom} {demande.partenaire_nom}
              </div>
              <div style={{ color: "#7A8FA6", fontSize: 12 }}>{demande.partenaire_email}</div>
            </div>
            <div>
              <span style={{ color: "#7A8FA6", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>Entreprise</span>
              <div style={{ fontWeight: 600 }}>{demande.nom_entreprise}</div>
            </div>
            <div>
              <span style={{ color: "#7A8FA6", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>Montant demandé</span>
              <div style={{ fontWeight: 800, fontSize: 18, color: "#1A3F63" }}>{fmt(demande.montant)} DT</div>
            </div>
            <div>
              <span style={{ color: "#7A8FA6", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>Date</span>
              <div>{fmtD(demande.created_at)}</div>
            </div>
            {demande.note && (
              <div style={{ gridColumn: "1 / -1" }}>
                <span style={{ color: "#7A8FA6", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>Note partenaire</span>
                <div style={{ fontStyle: "italic" }}>{demande.note}</div>
              </div>
            )}
          </div>
        </div>

        {/* Choix action */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <button
            onClick={() => setMode("valider")}
            style={{
              flex: 1, padding: "10px 0", borderRadius: 8, border: "2px solid",
              borderColor: mode === "valider" ? "#27AE60" : "#DDE5EE",
              background: mode === "valider" ? "#D4EDDA" : "#fff",
              color: mode === "valider" ? "#155724" : "#7A8FA6",
              fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "all .15s",
            }}
          >
            ✓ Approuver & Payer
          </button>
          <button
            onClick={() => setMode("refuser")}
            style={{
              flex: 1, padding: "10px 0", borderRadius: 8, border: "2px solid",
              borderColor: mode === "refuser" ? "#E74C3C" : "#DDE5EE",
              background: mode === "refuser" ? "#FEE2E2" : "#fff",
              color: mode === "refuser" ? "#991B1B" : "#7A8FA6",
              fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "all .15s",
            }}
          >
            ✕ Refuser
          </button>
        </div>

        {mode && (
          <>
            {mode === "valider" && (
              <div style={{
                background: "#F0FBF4", border: "1px solid #B7E4C7",
                borderRadius: 8, padding: "10px 14px", fontSize: 12,
                color: "#155724", marginBottom: 14,
              }}>
                ✓ Un paiement de <strong>{fmt(demande.montant)} DT</strong> sera enregistré
                dans l'historique des paiements du partenaire.
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#1A3F63", display: "block", marginBottom: 6 }}>
                {mode === "valider" ? "Note de validation (optionnelle)" : "Motif du refus (optionnel)"}
              </label>
              <textarea
                value={noteAdmin}
                onChange={(e) => setNoteAdmin(e.target.value)}
                rows={3}
                placeholder={
                  mode === "valider"
                    ? "Ex : Virement effectué le …"
                    : "Ex : Solde insuffisant, veuillez réessayer plus tard."
                }
                style={{
                  width: "100%", boxSizing: "border-box",
                  border: "1.5px solid #DDE5EE", borderRadius: 8,
                  padding: "8px 12px", fontSize: 13, resize: "vertical",
                  fontFamily: "inherit", outline: "none",
                }}
              />
            </div>

            {error && (
              <div style={{
                background: "#FEE2E2", color: "#991B1B", borderRadius: 8,
                padding: "8px 12px", fontSize: 13, marginBottom: 14,
              }}>
                ⚠ {error}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => { setMode(null); setError(null); setNoteAdmin(""); }}
                style={{
                  padding: "9px 20px", borderRadius: 8, border: "1.5px solid #DDE5EE",
                  background: "#fff", color: "#7A8FA6", fontWeight: 600,
                  fontSize: 13, cursor: "pointer",
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleAction}
                disabled={loading}
                style={{
                  padding: "9px 24px", borderRadius: 8, border: "none",
                  background: mode === "valider" ? "#27AE60" : "#E74C3C",
                  color: "#fff", fontWeight: 700, fontSize: 13,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? .7 : 1,
                }}
              >
                {loading
                  ? "En cours…"
                  : mode === "valider"
                  ? `Confirmer le paiement (${fmt(demande.montant)} DT)`
                  : "Confirmer le refus"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────
export default function TabDemandes({ onAction }) {
  const [items,      setItems]      = useState([]);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [loading,    setLoading]    = useState(true);
  const [statut,     setStatut]     = useState("EN_ATTENTE");
  const [search,     setSearch]     = useState("");
  const [selected,   setSelected]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await fetchDemandesRetrait(page, PER, { statut: statut || undefined });
      setItems(d.items || []);
      setTotal(d.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, statut]);

  useEffect(() => { load(); }, [load]);

  const handleDone = () => {
    load();
    onAction?.();
  };

  // Filtrage search côté frontend (sur les données déjà chargées)
  const filtered = search.trim()
    ? items.filter((d) => {
        const s = search.toLowerCase();
        return (
          d.partenaire_nom?.toLowerCase().includes(s)    ||
          d.partenaire_prenom?.toLowerCase().includes(s) ||
          d.partenaire_email?.toLowerCase().includes(s)  ||
          d.nom_entreprise?.toLowerCase().includes(s)
        );
      })
    : items;

  // KPIs
  const totalMontant  = items.filter(i => i.statut === "EN_ATTENTE").reduce((s, i) => s + i.montant, 0);
  const nbEnAttente   = items.filter(i => i.statut === "EN_ATTENTE").length;

  const totalPages = Math.ceil(total / PER);

  return (
    <div className="af2-tab-content">
      <ActionModal
        demande={selected}
        onClose={() => setSelected(null)}
        onDone={handleDone}
      />

      {/* ── KPIs ── */}
      <div className="af2-kpis-grid" style={{ marginBottom: 20 }}>
        {[
          { icon: "📥", label: "Demandes EN ATTENTE", value: nbEnAttente, color: "#C4973A" },
          { icon: "💰", label: "Montant total demandé", value: `${fmt(totalMontant)} DT`, color: "#1A3F63" },
          { icon: "📊", label: "Total (tous statuts)", value: total, color: "#7A8FA6" },
        ].map((k) => (
          <div key={k.label} className="af2-kpi-card" style={{ borderLeftColor: k.color }}>
            <span style={{ fontSize: 22 }}>{k.icon}</span>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: k.color }}>{k.value}</div>
              <div style={{ fontSize: 11, color: "#7A8FA6", fontWeight: 600, textTransform: "uppercase" }}>{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filtres ── */}
      <div className="af2-toolbar" style={{ marginBottom: 16, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input
          className="af2-search"
          placeholder="🔍 Rechercher partenaire…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200 }}
        />
        <select
          value={statut}
          onChange={(e) => { setStatut(e.target.value); setPage(1); }}
          style={{
            padding: "8px 14px", borderRadius: 8, border: "1.5px solid #DDE5EE",
            fontSize: 13, color: "#1A3F63", fontWeight: 600, background: "#fff",
            cursor: "pointer", outline: "none",
          }}
        >
          <option value="">Tous les statuts</option>
          <option value="EN_ATTENTE">En attente</option>
          <option value="APPROUVEE">Approuvées</option>
          <option value="REFUSEE">Refusées</option>
        </select>
        {(search || statut !== "EN_ATTENTE") && (
          <button
            onClick={() => { setSearch(""); setStatut("EN_ATTENTE"); setPage(1); }}
            style={{
              padding: "8px 14px", borderRadius: 8, border: "1.5px solid #DDE5EE",
              background: "#fff", color: "#7A8FA6", fontSize: 12,
              cursor: "pointer", fontWeight: 600,
            }}
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* ── Tableau ── */}
      {loading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <div className="af2-empty-full">
          {statut === "EN_ATTENTE"
            ? "✅ Aucune demande en attente."
            : "Aucune demande trouvée."}
        </div>
      ) : (
        <div className="af2-table-card">
          <table className="af2-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Partenaire</th>
                <th>Entreprise</th>
                <th style={{ textAlign: "right" }}>Montant</th>
                <th>Note partenaire</th>
                <th>Date</th>
                <th>Statut</th>
                <th>Réponse admin</th>
                <th style={{ textAlign: "center" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, i) => (
                <tr key={d.id} className="af2-tr">
                  <td style={{ color: "#7A8FA6", fontSize: 12 }}>
                    {(page - 1) * PER + i + 1}
                  </td>

                  {/* Partenaire */}
                  <td>
                    <div className="af2-person">
                      <div className="af2-avatar">
                        {d.partenaire_prenom?.[0]}{d.partenaire_nom?.[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>
                          {d.partenaire_prenom} {d.partenaire_nom}
                        </div>
                        <div style={{ fontSize: 11, color: "#7A8FA6" }}>{d.partenaire_email}</div>
                      </div>
                    </div>
                  </td>

                  {/* Entreprise */}
                  <td style={{ fontSize: 13, fontWeight: 600 }}>{d.nom_entreprise}</td>

                  {/* Montant */}
                  <td style={{ textAlign: "right" }}>
                    <span style={{ fontWeight: 800, fontSize: 15, color: "#1A3F63" }}>
                      {fmt(d.montant)} DT
                    </span>
                  </td>

                  {/* Note partenaire */}
                  <td style={{ fontSize: 12, color: "#7A8FA6", maxWidth: 160 }}>
                    {d.note || <span style={{ fontStyle: "italic" }}>—</span>}
                  </td>

                  {/* Date */}
                  <td style={{ fontSize: 12, whiteSpace: "nowrap" }}>
                    {fmtD(d.created_at)}
                  </td>

                  {/* Statut */}
                  <td><BadgeStatut statut={d.statut} /></td>

                  {/* Réponse admin */}
                  <td style={{ fontSize: 12, maxWidth: 180 }}>
                    {d.statut === "REFUSEE" && d.note_admin ? (
                      <span style={{ color: "#991B1B" }}>⚠ {d.note_admin}</span>
                    ) : d.statut === "APPROUVEE" ? (
                      <span style={{ color: "#155724" }}>
                        ✓ {d.note_admin || "Paiement effectué"}
                      </span>
                    ) : (
                      <span style={{ color: "#7A8FA6", fontStyle: "italic" }}>—</span>
                    )}
                  </td>

                  {/* Action */}
                  <td style={{ textAlign: "center" }}>
                    {d.statut === "EN_ATTENTE" ? (
                      <button
                        onClick={() => setSelected(d)}
                        style={{
                          padding: "6px 14px", borderRadius: 7,
                          background: "#1A3F63", color: "#fff",
                          border: "none", fontWeight: 700, fontSize: 12,
                          cursor: "pointer", whiteSpace: "nowrap",
                        }}
                      >
                        Traiter →
                      </button>
                    ) : (
                      <span style={{ fontSize: 11, color: "#7A8FA6" }}>
                        {fmtD(d.updated_at)}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div style={{ padding: "12px 20px", borderTop: "1px solid #DDE5EE" }}>
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}