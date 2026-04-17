import "./AProposSection.css";

// ══════════════════════════════════════════════════════════
//  DONNÉES STATIQUES
// ══════════════════════════════════════════════════════════
const STATS = [
  { valeur: "500+",  label: "Partenaires",      icon: "🤝" },
  { valeur: "12k+",  label: "Réservations",     icon: "📋" },
  { valeur: "98%",   label: "Satisfaction",     icon: "⭐" },
  { valeur: "8",     label: "Ans d'expérience", icon: "🏆" },
];

const VALEURS = [
  {
    titre: "Confiance & Transparence",
    desc:  "Chaque prix affiché est le prix final — aucun frais caché. Nos avis clients sont vérifiés et non filtrés.",
    icone: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <polyline points="9 12 11 14 15 10"/>
      </svg>
    ),
  },
  {
    titre: "Expertise Locale",
    desc:  "Équipe 100 % tunisienne. Nous connaissons chaque destination, chaque établissement, chaque route.",
    icone: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10"/>
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
  },
  {
    titre: "Support 7j/7",
    desc:  "Une question avant votre départ, un imprévu sur place ? Notre équipe est joignable à toute heure.",
    icone: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  {
    titre: "Meilleur Prix Garanti",
    desc:  "Si vous trouvez moins cher ailleurs pour la même offre, nous alignons le tarif sans condition.",
    icone: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
  },
];

// ══════════════════════════════════════════════════════════
//  SOUS-COMPOSANTS
// ══════════════════════════════════════════════════════════
function StatCard({ valeur, label, icon }) {
  return (
    <div className="ap-stat-card">
      <span className="ap-stat-icon">{icon}</span>
      <span className="ap-stat-valeur">{valeur}</span>
      <span className="ap-stat-label">{label}</span>
    </div>
  );
}

function ValeurCard({ titre, desc, icone }) {
  return (
    <div className="ap-valeur-card">
      <div className="ap-valeur-ico">{icone}</div>
      <h4 className="ap-valeur-titre">{titre}</h4>
      <p className="ap-valeur-desc">{desc}</p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  SECTION PRINCIPALE
// ══════════════════════════════════════════════════════════
export default function AProposSection() {
  return (
    <section className="ap-root" id="pourquoi">
      {/* Déco de fond subtile */}
      <div className="ap-bg-deco-1"/>
      <div className="ap-bg-deco-2"/>

      <div className="ap-container">

        {/* ═══ BLOC HERO (sans carte) ═══ */}
        <div className="ap-hero">
          <div className="ap-hero-content">
            <div className="ap-eyebrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 8v4l3 3"/>
              </svg>
              Notre histoire
            </div>
            <h2 className="ap-hero-title">
              La plateforme tunisienne <em>de confiance</em>
            </h2>
            <p className="ap-hero-text">
              Fondée en 2016 à Tunis, EasyVoyage est née d'un constat simple : réserver un hôtel
              ou un voyage organisé en Tunisie ne devrait pas être compliqué. Aujourd'hui, nous
              connectons des milliers de voyageurs aux meilleurs établissements du pays, avec un
              seul objectif — vous offrir une expérience mémorable.
            </p>
            <p className="ap-hero-text">
              Notre réseau de partenaires certifiés couvre l'ensemble du territoire, des plages
              de Hammamet aux dunes de Tozeur, en passant par les médinas historiques. Chaque
              offre est vérifiée par notre équipe avant d'être publiée.
            </p>
            <div className="ap-hero-cta">
              <a href="#hotels" className="ap-btn-primary">
                Explorer les hôtels
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </a>
              <a href="#voyages" className="ap-btn-secondary">
                Voir les voyages
              </a>
            </div>

            {/* Badges de confiance */}
            <div className="ap-trust-badges">
              <div className="ap-trust-badge">
                <span className="ap-trust-ico">🏆</span>
                <div>
                  <strong>Top plateforme 2025</strong>
                  <span>Prix de l'innovation touristique</span>
                </div>
              </div>
              <div className="ap-trust-badge">
                <span className="ap-trust-ico">🇹🇳</span>
                <div>
                  <strong>100% Tunisien</strong>
                  <span>Équipe et partenaires locaux</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ STATS ═══ */}
        <div className="ap-stats">
          {STATS.map(s => <StatCard key={s.label} {...s}/>)}
        </div>

        {/* ═══ VALEURS ═══ */}
        <div className="ap-section-head">
          <div className="ap-eyebrow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            Nos engagements
          </div>
          <h3 className="ap-section-title">Ce qui nous distingue</h3>
        </div>

        <div className="ap-valeurs-grid">
          {VALEURS.map(v => <ValeurCard key={v.titre} {...v}/>)}
        </div>

        {/* ═══ SECTION AGENT IA ═══ */}
        <div className="ap-section-head">
          <div className="ap-eyebrow ap-eyebrow-ai">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7H3a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
              <path d="M5 14v7M19 14v7M5 17H3M21 17h-2"/>
              <circle cx="12" cy="11" r="1"/>
            </svg>
            Innovation
          </div>
          <h3 className="ap-section-title">
            Propulsé par l'<em>Intelligence Artificielle</em>
          </h3>
          <p className="ap-section-sub">
            EasyVoyage intègre une IA avancée pour simplifier votre expérience
          </p>
        </div>

        <div className="ap-ai-card">
          {/* Colonne gauche : texte et features */}
          <div className="ap-ai-left">
            <div className="ap-ai-badge">
              <span className="ap-ai-dot"/>
              Exclusif EasyVoyage
            </div>
            <h3 className="ap-ai-title">
              Un assistant intelligent pour tous vos besoins
            </h3>
            <p className="ap-ai-desc">
              Notre <strong>intelligence artificielle</strong> simplifie chaque étape de votre
              expérience — de la recherche du voyage idéal à la gestion quotidienne de nos
              partenaires et administrateurs.
            </p>

            <ul className="ap-ai-features">
              <li>
                <span className="ap-ai-feat-ico">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </span>
                <div>
                  <strong>Recommandations personnalisées</strong>
                  <span>Selon vos préférences, budget et style de voyage</span>
                </div>
              </li>
              <li>
                <span className="ap-ai-feat-ico">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </span>
                <div>
                  <strong>Analyse financière en temps réel</strong>
                  <span>Commissions, revenus et statistiques pour nos partenaires</span>
                </div>
              </li>
              <li>
                <span className="ap-ai-feat-ico">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </span>
                <div>
                  <strong>Assistant administratif intelligent</strong>
                  <span>Génère rapports et analyses en langage naturel</span>
                </div>
              </li>
              <li>
                <span className="ap-ai-feat-ico">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </span>
                <div>
                  <strong>Disponible 24h/24 et 7j/7</strong>
                  <span>Une réponse instantanée à chaque question</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Colonne droite : aperçu du chat */}
          <div className="ap-ai-right">
            <div className="ap-ai-chat">
              <div className="ap-ai-chat-head">
                <div className="ap-ai-chat-avatar">🤖</div>
                <div className="ap-ai-chat-info">
                  <div className="ap-ai-chat-name">Agent IA EasyVoyage</div>
                  <div className="ap-ai-chat-status">
                    <span className="ap-ai-chat-online"/>
                    En ligne
                  </div>
                </div>
              </div>
              <div className="ap-ai-chat-body">
                <div className="ap-ai-bubble ap-ai-bubble-user">
                  Quels sont les 5 hôtels les mieux notés à Hammamet ?
                </div>
                <div className="ap-ai-bubble ap-ai-bubble-bot">
                  Voici les 5 meilleurs hôtels de Hammamet :
                  <br/>⭐ <strong>Hôtel Royal</strong> — 4.9/5
                  <br/>⭐ <strong>Bel Azur</strong> — 4.8/5
                  <br/>⭐ <strong>Sindbad Palace</strong> — 4.7/5
                </div>
                <div className="ap-ai-bubble ap-ai-bubble-typing">
                  <span/><span/><span/>
                </div>
              </div>
            </div>
            {/* Décos flottantes */}
            <div className="ap-ai-float ap-ai-float-1">✨</div>
            <div className="ap-ai-float ap-ai-float-2">💬</div>
            <div className="ap-ai-float ap-ai-float-3">⚡</div>
          </div>
        </div>

        {/* ═══ CTA BANNER ═══ */}
        <div className="ap-cta-banner">
          <div className="ap-cta-left">
            <h3>Prêt à explorer la Tunisie ?</h3>
            <p>Rejoignez des milliers de voyageurs qui nous font confiance.</p>
          </div>
          <a href="#hotels" className="ap-btn-primary ap-btn-lg">
            Commencer ma recherche
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </a>
        </div>

      </div>
    </section>
  );
}