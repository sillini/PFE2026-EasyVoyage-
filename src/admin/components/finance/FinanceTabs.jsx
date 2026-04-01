/**
 * FinanceTabs — barre d'onglets principale du module Finance.
 */
const TABS = [
  { id: "revenus",     label: "📈 Revenus"              },
  { id: "partenaires", label: "🤝 Partenaires"           },
  { id: "soldes",      label: "⏳ Soldes à payer"        },
  { id: "demandes",    label: "📥 Demandes de retrait"   },
  { id: "historique",  label: "📜 Historique"            },
  { id: "clients",     label: "👥 Clients & Visiteurs"   },
];

export default function FinanceTabs({ activeTab, onChange, dash, nbDemandes = 0 }) {
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
          {t.id === "demandes" && nbDemandes > 0 && (
            <span className="af2-tab-badge" style={{ background: "#E74C3C" }}>
              {nbDemandes}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}