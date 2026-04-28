/**
 * src/admin/components/dashboard/RecentActivityFeed.jsx
 * =======================================================
 * Feed des 10 dernières réservations enrichies.
 *
 * L'endpoint /reservations/admin/enrichi renvoie les champs :
 *   client_nom, client_prenom, client_email,
 *   hotel_nom, hotel_ville,
 *   voyage_titre, voyage_destination,
 *   total_ttc, date_reservation, source ("client" | "visiteur"), statut
 *
 * Ce composant gère aussi gracieusement les champs manquants ou différents.
 *
 * @prop {Array}    items   — items issus de /reservations/admin/enrichi
 * @prop {boolean}  loading
 * @prop {Function} onNavigate
 */
import { fmt } from "../../services/formatters.js";

// ── Format relatif (« il y a 12 min ») ───────────────────
function timeAgo(dateStr) {
  if (!dateStr) return "—";
  // Le backend renvoie soit "DD/MM/YYYY HH:mm" soit ISO. On gère les deux.
  let d;
  if (typeof dateStr === "string" && dateStr.includes("/")) {
    // "28/04/2026 14:53" → ISO
    const [datePart, timePart = "00:00"] = dateStr.split(" ");
    const [day, month, year] = datePart.split("/");
    d = new Date(`${year}-${month}-${day}T${timePart}:00`);
  } else {
    d = new Date(dateStr);
  }
  if (isNaN(d.getTime())) return "—";

  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60)        return "à l'instant";
  if (diff < 3600)      return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400)     return `il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 86400 * 2) return "hier";
  if (diff < 86400 * 7) return `il y a ${Math.floor(diff / 86400)} j`;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

// ── Couleur du dot selon le statut ────────────────────────
function dotColor(statut, source) {
  if (source === "visiteur") return "#8E44AD";
  if (statut === "CONFIRMEE")  return "#27AE60";
  if (statut === "TERMINEE")   return "#1A3F63";
  if (statut === "EN_ATTENTE") return "#D97706";
  if (statut === "ANNULEE")    return "#C0392B";
  return "#7A93AE";
}

// ── Construit le label du nom (robuste) ──────────────────
function nameOf(r) {
  // Champs possibles selon l'endpoint
  const prenom = r.client_prenom || r.prenom || "";
  const nom    = r.client_nom    || r.nom    || "";
  const full   = `${prenom} ${nom}`.trim();

  if (full) return full;

  // Fallback selon la source
  if (r.source === "visiteur") return "Visiteur";
  if (r.client_email)          return r.client_email;
  if (r.email)                 return r.email;
  return "Réservation";
}

// ── Construit le label de prestation (robuste) ───────────
function prestationOf(r) {
  // Cas voyage
  if (r.voyage_titre) {
    const dest = r.voyage_destination ? ` · ${r.voyage_destination}` : "";
    return `${r.voyage_titre}${dest}`;
  }
  // Cas hôtel
  if (r.hotel_nom) {
    const ville = r.hotel_ville ? ` · ${r.hotel_ville}` : "";
    return `${r.hotel_nom}${ville}`;
  }
  // Fallback : nb nuits si dispo
  if (r.nb_nuits) return `${r.nb_nuits} nuit${r.nb_nuits > 1 ? "s" : ""}`;
  if (r.type_resa === "voyage") return "Voyage";
  if (r.type_resa === "hotel")  return "Séjour hôtel";
  return r.source === "visiteur" ? "Réservation visiteur" : "Réservation";
}

function ActivityRow({ resa, onClick }) {
  const isAnnulee = resa.statut === "ANNULEE";
  const sign = isAnnulee ? "" : "+ ";

  return (
    <div
      className="ad-feed-row"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
    >
      <span
        className="ad-feed-dot"
        style={{ background: dotColor(resa.statut, resa.source) }}
        title={resa.statut}
      />
      <div className="ad-feed-name">{nameOf(resa)}</div>
      <div className="ad-feed-prest">{prestationOf(resa)}</div>
      <div
        className="ad-feed-amount"
        style={isAnnulee ? { color: "#C0392B", textDecoration: "line-through" } : undefined}
      >
        {sign}{fmt(resa.total_ttc)} DT
      </div>
      <div className="ad-feed-time">{timeAgo(resa.date_reservation)}</div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="ad-feed-row">
      <span className="ad-skeleton-dot" />
      <div className="ad-skeleton-line" style={{ width: "70%" }} />
      <div className="ad-skeleton-line" style={{ width: "85%" }} />
      <div className="ad-skeleton-line" style={{ width: "60%" }} />
      <div className="ad-skeleton-line" style={{ width: "50%" }} />
    </div>
  );
}

export default function RecentActivityFeed({ items, loading, onNavigate }) {
  return (
    <section className="ad-feed-card">
      <div className="ad-card-head">
        <div>
          <h3 className="ad-card-title">Activité récente</h3>
          <p className="ad-card-sub">Dernières réservations enregistrées</p>
        </div>
        <button
          className="ad-link-all"
          onClick={() => onNavigate?.("reservations")}
          type="button"
        >
          Voir tout →
        </button>
      </div>

      <div className="ad-feed-list">
        {loading && (!items || items.length === 0) && (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        )}

        {!loading && (!items || items.length === 0) && (
          <div className="ad-empty">
            <p>Aucune réservation pour le moment</p>
          </div>
        )}

        {items?.slice(0, 10).map((r) => (
          <ActivityRow
            key={`${r.source || "client"}-${r.id}`}
            resa={r}
            onClick={() => onNavigate?.("reservations")}
          />
        ))}
      </div>
    </section>
  );
}