// ══════════════════════════════════════════════════════════
//  src/admin/pages/marketing/MarketingKpis.jsx
// ══════════════════════════════════════════════════════════
export default function MarketingKpis({ stats }) {
  const cards = [
    { label: "Total",      value: stats.total,     mod: "blue"  },
    { label: "Publiées",   value: stats.published, mod: "green" },
    { label: "Planifiées", value: stats.scheduled, mod: "gold"  },
    { label: "Brouillons", value: stats.draft,     mod: "gray"  },
  ];

  return (
    <div className="mkt-kpi-grid">
      {cards.map((k) => (
        <div key={k.label} className={`mkt-kpi mkt-kpi--${k.mod}`}>
          <span className="mkt-kpi-val">{k.value}</span>
          <span className="mkt-kpi-lbl">{k.label}</span>
        </div>
      ))}
    </div>
  );
}