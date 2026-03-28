import "./AProposSection.css";

// ── Données statiques ─────────────────────────────────────
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

const EQUIPE = [
  { prenom: "Rania",   nom: "Hamdi",    role: "CEO & Co-fondatrice",         init: "RH", couleur: "#1A3F63" },
  { prenom: "Karim",   nom: "Belhaj",   role: "Directeur des Opérations",    init: "KB", couleur: "#C4973A" },
  { prenom: "Salma",   nom: "Trabelsi", role: "Responsable Partenariats",    init: "ST", couleur: "#27AE60" },
  { prenom: "Youssef", nom: "Meddeb",   role: "Lead Développeur",            init: "YM", couleur: "#8E44AD" },
];

// ── Composants ────────────────────────────────────────────

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

function MembreCard({ prenom, nom, role, init, couleur }) {
  return (
    <div className="ap-membre-card">
      <div className="ap-membre-avatar" style={{ background: couleur }}>
        {init}
      </div>
      <div className="ap-membre-info">
        <span className="ap-membre-nom">{prenom} {nom}</span>
        <span className="ap-membre-role">{role}</span>
      </div>
    </div>
  );
}

// ── Section principale ─────────────────────────────────────
export default function AProposSection() {
  return (
    <section className="ap-root" id="pourquoi">
      {/* Déco de fond */}
      <div className="ap-bg-deco-1"/>
      <div className="ap-bg-deco-2"/>

      <div className="ap-container">

        {/* ── BLOC HERO ── */}
        <div className="ap-hero">
          <div className="ap-hero-left">
            <div className="ap-eyebrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 8v4l3 3"/>
              </svg>
              Notre histoire
            </div>
            <h2 className="ap-hero-title">
              La plateforme tunisienne<br/>
              <em>de confiance</em>
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
          </div>

          <div className="ap-hero-right">
            {/* Image carte + badge */}
            <div className="ap-carte-wrap">
              <div className="ap-carte-bg">
                <svg viewBox="0 0 200 260" fill="none" className="ap-carte-svg">
                  {/* Silhouette Tunisie simplifiée */}
                  <path
                    d="M110 15 L130 20 L148 35 L152 55 L145 70 L155 85 L158 110
                       L150 130 L155 155 L148 175 L140 200 L125 220 L110 235
                       L95 240 L80 230 L70 210 L65 185 L72 165 L68 145
                       L75 120 L65 100 L55 80 L60 60 L70 45 L85 30 Z"
                    fill="rgba(196,151,58,0.15)"
                    stroke="rgba(196,151,58,0.5)"
                    strokeWidth="1.5"
                  />
                  {/* Points destinations */}
                  {[
                    { x: 105, y: 90,  label: "Tunis" },
                    { x: 95,  y: 115, label: "Hammamet" },
                    { x: 88,  y: 130, label: "Sousse" },
                    { x: 80,  y: 200, label: "Djerba" },
                    { x: 90,  y: 175, label: "Tozeur" },
                  ].map(p => (
                    <g key={p.label}>
                      <circle cx={p.x} cy={p.y} r="4" fill="#C4973A" opacity="0.8"/>
                      <circle cx={p.x} cy={p.y} r="8" fill="#C4973A" opacity="0.2"/>
                      <text x={p.x + 11} y={p.y + 4}
                        fontFamily="'Lato',sans-serif" fontSize="9"
                        fill="rgba(255,255,255,0.7)">
                        {p.label}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
              {/* Badges flottants */}
              <div className="ap-badge-1">🏆 Top plateforme 2025</div>
              <div className="ap-badge-2">🇹🇳 100% Tunisien</div>
            </div>
          </div>
        </div>

        {/* ── STATS ── */}
        <div className="ap-stats">
          {STATS.map(s => <StatCard key={s.label} {...s}/>)}
        </div>

        {/* ── VALEURS ── */}
        <div className="ap-section-head">
          <div className="ap-eyebrow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            Nos engagements
          </div>
          <h3 className="ap-section-title">Ce qui nous distingue</h3>
        </div>
        <div className="ap-valeurs-grid">
          {VALEURS.map(v => <ValeurCard key={v.titre} {...v}/>)}
        </div>

        {/* ── ÉQUIPE ── */}
        <div className="ap-section-head">
          <div className="ap-eyebrow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            L'équipe
          </div>
          <h3 className="ap-section-title">Les personnes derrière EasyVoyage</h3>
        </div>
        <div className="ap-equipe-grid">
          {EQUIPE.map(m => <MembreCard key={m.init} {...m}/>)}
        </div>

        {/* ── CTA FINAL ── */}
        <div className="ap-cta-banner">
          <div className="ap-cta-left">
            <h3>Prêt à voyager ?</h3>
            <p>Des milliers d'offres vous attendent — hôtels, séjours tout compris, circuits exclusifs.</p>
          </div>
          <div className="ap-cta-right">
            <a href="#hotels" className="ap-btn-primary ap-btn-lg">
              Réserver maintenant
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}