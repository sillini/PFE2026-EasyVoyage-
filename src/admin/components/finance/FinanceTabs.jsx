/**
 * FinanceTabs — barre d'onglets principale du module Finance.
 *
 * @prop {string}   activeTab — id de l'onglet actif
 * @prop {Function} onChange  — (tabId: string) => void
 * @prop {object}   dash      — données dashboard (pour badge soldes)
 */

const TABS = [
  { id: "revenus",     label: "📈 Revenus"            },
  { id: "partenaires", label: "🤝 Partenaires"         },
  { id: "soldes",      label: "⏳ Soldes à payer"      },
  { id: "historique",  label: "📜 Historique"          },
  { id: "clients",     label: "👥 Clients & Visiteurs" },
];

export default function FinanceTabs({ activeTab, onChange, dash }) {
  return (
    <div className="af2-tabs">
      {TABS.map((t) => (
        <button
          key={t.id}
          className={`af2-tab${activeTab === t.id ? " on" : ""}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
          {t.id === "soldes" && dash?.nb_partenaires_en_attente > 0 && (
            <span className="af2-tab-badge">{dash.nb_partenaires_en_attente}</span>
          )}
        </button>
      ))}
    </div>
  );
}