// ══════════════════════════════════════════════════════════
//  src/visiteur/components/ui/PromoBadge.jsx
//  Composants réutilisables pour afficher les promotions
//  sur les cartes d'hôtels côté visiteur.
//
//  Exports :
//    - PromoBadge   : badge coin de carte (-20%)
//    - PromoPrice   : prix barré + prix remisé
//    - PromoChip    : puce en ligne avec type de promo
// ══════════════════════════════════════════════════════════

import "./PromoBadge.css";

const TYPE_EMOJI = {
  STANDARD:      "🎁",
  EARLY_BOOKING: "⏰",
  LAST_MINUTE:   "⚡",
};

const TYPE_LABEL = {
  STANDARD:      "Promo",
  EARLY_BOOKING: "Early Booking",
  LAST_MINUTE:   "Last Minute",
};

// ══════════════════════════════════════════════════════════
//  BADGE — à poser en absolute sur une image de carte
// ══════════════════════════════════════════════════════════
export function PromoBadge({ hotel, size = "md" }) {
  if (!hotel?.promotion_active || !hotel.promotion_pourcentage) return null;

  const sizeClass = size === "sm" ? "pb-small" : size === "lg" ? "pb-large" : "";

  return (
    <div className={`promo-badge ${sizeClass}`} title={hotel.promotion_titre || "Promotion"}>
      <span className="promo-badge-top">PROMO</span>
      <span className="promo-badge-pct">-{Math.round(hotel.promotion_pourcentage)}%</span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  PRIX — affiche prix barré + prix remisé si promo active
// ══════════════════════════════════════════════════════════
export function PromoPrice({ hotel, currency = "DT", size = "md" }) {
  const prixOriginal = hotel?.prix_min;
  const prixPromo    = hotel?.prix_min_promo;
  const hasPromo     = hotel?.promotion_active && prixPromo && prixOriginal && prixPromo < prixOriginal;

  if (!prixOriginal) return null;

  const sizeClass = size === "sm" ? "pp-small" : size === "lg" ? "pp-large" : "";

  if (!hasPromo) {
    return (
      <div className={`promo-price ${sizeClass}`}>
        <span className="pp-label">dès</span>
        <span className="pp-value">{Math.round(prixOriginal)}</span>
        <span className="pp-currency">{currency}</span>
      </div>
    );
  }

  return (
    <div className={`promo-price pp-discounted ${sizeClass}`}>
      <span className="pp-label">dès</span>
      <span className="pp-original">
        {Math.round(prixOriginal)} {currency}
      </span>
      <span className="pp-value">{Math.round(prixPromo)}</span>
      <span className="pp-currency">{currency}</span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  CHIP — petit indicateur inline du type de promo
// ══════════════════════════════════════════════════════════
export function PromoChip({ hotel }) {
  if (!hotel?.promotion_active) return null;

  const type  = hotel.promotion_type || "STANDARD";
  const emoji = TYPE_EMOJI[type] || "🎁";
  const label = TYPE_LABEL[type] || "Promo";

  return (
    <span className="promo-chip">
      {emoji} {label}
    </span>
  );
}