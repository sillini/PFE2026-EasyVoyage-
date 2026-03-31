const STATUS_MAP = {
  EN_ATTENTE: { label: "En attente", cls: "pill-wait" },
  PAYEE:      { label: "Payée",      cls: "pill-paid" },
  CONFIRMEE:  { label: "Confirmée",  cls: "pill-ok"   },
  TERMINEE:   { label: "Terminée",   cls: "pill-end"  },
};

export default function Pill({ statut }) {
  const v = STATUS_MAP[statut] || { label: statut, cls: "pill-default" };
  return <span className={`af2-pill ${v.cls}`}>{v.label}</span>;
}