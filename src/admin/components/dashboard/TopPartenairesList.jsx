/**
 * src/admin/components/dashboard/TopPartenairesList.jsx
 * =======================================================
 * Top 5 partenaires par revenu généré (commission agence + part partenaire).
 *
 * Avatar = initiales colorées (hash déterministe sur l'id partenaire).
 *
 * @prop {Array}    items   — partenaires { id_partenaire, partenaire_nom,
 *                            partenaire_prenom, nom_entreprise, revenu_total,
 *                            commission_agence, nb_reservations }
 * @prop {boolean}  loading
 * @prop {Function} onNavigate — (page) => void
 */
import { fmt } from "../../services/formatters.js";

// 6 couleurs cohérentes avec la charte
const AVATAR_COLORS = [
  { bg: "rgba(26,63,99,0.10)",   fg: "#1A3F63" },
  { bg: "rgba(39,174,96,0.10)",  fg: "#27AE60" },
  { bg: "rgba(196,151,58,0.10)", fg: "#C4973A" },
  { bg: "rgba(192,57,43,0.10)",  fg: "#C0392B" },
  { bg: "rgba(142,68,173,0.10)", fg: "#8E44AD" },
  { bg: "rgba(43,95,142,0.10)",  fg: "#2B5F8E" },
];

function pickColor(id) {
  const idx = (Number(id) || 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

function initials(prenom, nom) {
  const p = (prenom || "").trim().charAt(0);
  const n = (nom || "").trim().charAt(0);
  return (p + n).toUpperCase() || "—";
}

function PartenaireRow({ partenaire, onClick }) {
  const color = pickColor(partenaire.id_partenaire);
  const fullName = `${partenaire.partenaire_prenom || ""} ${partenaire.partenaire_nom || ""}`.trim() || "—";

  return (
    <div
      className="ad-top-row"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
    >
      <div
        className="ad-avatar"
        style={{ background: color.bg, color: color.fg }}
      >
        {initials(partenaire.partenaire_prenom, partenaire.partenaire_nom)}
      </div>
      <div className="ad-top-info">
        <div className="ad-top-name">{partenaire.nom_entreprise || fullName}</div>
        <div className="ad-top-meta">
          {fullName} · {partenaire.nb_reservations || 0} résa{partenaire.nb_reservations > 1 ? "s" : ""}
        </div>
      </div>
      <div className="ad-top-amount">
        {fmt(partenaire.commission_agence)} <span className="ad-top-cur">DT</span>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="ad-top-row">
      <div className="ad-skeleton-circle ad-skeleton-avatar" />
      <div className="ad-top-info">
        <div className="ad-skeleton-line" style={{ width: "55%" }} />
        <div className="ad-skeleton-line" style={{ width: "35%", height: 10 }} />
      </div>
    </div>
  );
}

export default function TopPartenairesList({ items, loading, onNavigate }) {
  return (
    <section className="ad-top-card">
      <div className="ad-card-head">
        <div>
          <h3 className="ad-card-title">Top partenaires</h3>
          <p className="ad-card-sub">Par commission générée</p>
        </div>
        <button
          className="ad-link-all"
          onClick={() => onNavigate?.("partenaires")}
          type="button"
        >
          Voir tout →
        </button>
      </div>

      <div className="ad-top-list">
        {loading && (!items || items.length === 0) && (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        )}

        {!loading && (!items || items.length === 0) && (
          <div className="ad-empty">
            <p>Aucun partenaire actif</p>
          </div>
        )}

        {items?.slice(0, 5).map((p) => (
          <PartenaireRow
            key={p.id_partenaire}
            partenaire={p}
            onClick={() => onNavigate?.("partenaires")}
          />
        ))}
      </div>
    </section>
  );
}