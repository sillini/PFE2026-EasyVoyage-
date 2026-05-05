/**
 * src/partenaire/components/dashboard/DashTauxOccupation.jsx
 * ============================================================
 * Carte horizontale avec 3 indicateurs de performance :
 *   - Taux d'occupation (mois courant) — gauge horizontale
 *   - Note moyenne globale — étoiles
 *   - Ratio hôtels actifs — gauge
 *
 * Le taux d'occupation est calculé approximativement côté frontend
 * (voir usePartDashboard.js). Pour un calcul exact, un endpoint
 * /finances-partenaire/taux-occupation pourrait être ajouté.
 */

const fmt = (n) => new Intl.NumberFormat("fr-TN").format(n ?? 0);

// ── Étoiles pour note ─────────────────────────────────────
function Stars({ value = 0 }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <div className="pd-occ-stars" aria-label={`${value.toFixed(1)} sur 5`}>
      {Array.from({ length: full }).map((_, i) => (
        <span key={`f${i}`} className="pd-occ-star-on">★</span>
      ))}
      {half && <span className="pd-occ-star-on">★</span>}
      {Array.from({ length: empty }).map((_, i) => (
        <span key={`e${i}`} className="pd-occ-star-off">★</span>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
export default function DashTauxOccupation({
  taux,
  noteGlobale,
  nbHotelsActifs,
  loading,
}) {
  const { actifs = 0, total = 0 } = nbHotelsActifs || {};
  const pctActifs = total > 0 ? Math.round((actifs / total) * 100) : 0;

  const tauxPct = taux?.pct ?? 0;
  const tauxNuits = taux?.nuits ?? 0;

  return (
    <section className="pd-occupation-card">
      {/* ── Taux d'occupation ── */}
      <div className="pd-occ-block">
        <span className="pd-occ-label">Taux d'occupation (estimation)</span>
        {loading && !taux ? (
          <div className="pd-skeleton-line" style={{ width: "60%", height: 30 }} />
        ) : taux === null ? (
          <span className="pd-occ-sub">Aucune chambre enregistrée</span>
        ) : (
          <>
            <div className="pd-occ-main">
              <span className="pd-occ-pct">{tauxPct}</span>
              <span className="pd-occ-unit">%</span>
            </div>
            <div className="pd-occ-bar">
              <div
                className="pd-occ-bar-fill"
                style={{ width: `${tauxPct}%` }}
              />
            </div>
            <span className="pd-occ-sub">
              {fmt(tauxNuits)} nuits réservées ce mois
            </span>
          </>
        )}
      </div>

      {/* ── Note moyenne ── */}
      <div className="pd-occ-block">
        <span className="pd-occ-label">Note moyenne globale</span>
        {loading && noteGlobale === null ? (
          <div className="pd-skeleton-line" style={{ width: "60%", height: 30 }} />
        ) : noteGlobale === null ? (
          <span className="pd-occ-sub">Aucun avis pour le moment</span>
        ) : (
          <>
            <div className="pd-occ-main">
              <span className="pd-occ-pct">{noteGlobale.toFixed(1)}</span>
              <span className="pd-occ-unit">/ 5</span>
            </div>
            <Stars value={noteGlobale} />
            <span className="pd-occ-sub">satisfaction clients</span>
          </>
        )}
      </div>

      {/* ── Hôtels actifs ── */}
      <div className="pd-occ-block">
        <span className="pd-occ-label">Hôtels actifs</span>
        {loading && total === 0 ? (
          <div className="pd-skeleton-line" style={{ width: "60%", height: 30 }} />
        ) : total === 0 ? (
          <span className="pd-occ-sub">Aucun hôtel enregistré</span>
        ) : (
          <>
            <div className="pd-occ-main">
              <span className="pd-occ-pct">{actifs}</span>
              <span className="pd-occ-unit">/ {total}</span>
            </div>
            <div className="pd-occ-bar">
              <div
                className="pd-occ-bar-fill"
                style={{ width: `${pctActifs}%` }}
              />
            </div>
            <span className="pd-occ-sub">{pctActifs}% en ligne</span>
          </>
        )}
      </div>
    </section>
  );
}