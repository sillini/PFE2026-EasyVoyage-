import { useState, useEffect, useCallback } from "react";
import "./FiscalConfig.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
const CLE_ORDER = ["taxe_sejour_2_3", "taxe_sejour_4_5", "tva", "droit_timbre"];

function getAuthHeaders() {
  const t = localStorage.getItem("access_token");
  return { "Content-Type": "application/json", ...(t ? { Authorization: `Bearer ${t}` } : {}) };
}

/* ─────────────────────── ICÔNES ─────────────────────── */
const IcoMoon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);
const IcoPercent = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="19" y1="5" x2="5" y2="19"/>
    <circle cx="6.5" cy="6.5" r="2.5"/>
    <circle cx="17.5" cy="17.5" r="2.5"/>
  </svg>
);
const IcoStamp = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M3 17l1-10h16l1 10H3z"/>
    <path d="M7 17v4h10v-4"/>
    <path d="M9 7V4a3 3 0 0 1 6 0v3"/>
  </svg>
);
const IcoCalc = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <rect x="4" y="2" width="16" height="20" rx="2"/>
    <line x1="8" y1="6" x2="16" y2="6"/>
    <line x1="8" y1="10" x2="10" y2="10"/><line x1="14" y1="10" x2="16" y2="10"/>
    <line x1="8" y1="14" x2="10" y2="14"/><line x1="14" y1="14" x2="16" y2="14"/>
    <line x1="8" y1="18" x2="16" y2="18"/>
  </svg>
);
const IcoRefresh = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);
const IcoCheck = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IcoAlert = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const IcoArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);

/* ─────────────── CONFIG PAR RÈGLE ──────────────────── */
const RULE_CFG = {
  taxe_sejour_2_3: { Icon: IcoMoon,    color: "indigo", accentBg: "#EEF2FF", accentColor: "#4F46E5" },
  taxe_sejour_4_5: { Icon: IcoMoon,    color: "violet", accentBg: "#F5F3FF", accentColor: "#7C3AED" },
  tva:             { Icon: IcoPercent, color: "teal",   accentBg: "#F0FDFA", accentColor: "#0D9488" },
  droit_timbre:    { Icon: IcoStamp,   color: "amber",  accentBg: "#FFFBEB", accentColor: "#D97706" },
};
const UNIT = { PAR_NUIT: "DT / nuit / pers.", POURCENTAGE: "%", MONTANT_FIXE: "DT" };

/* ───────────────────── TOGGLE ──────────────────────── */
function Toggle({ checked, onChange }) {
  return (
    <label style={{ cursor: "pointer", flexShrink: 0 }}>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ display: "none" }} />
      <span style={{
        display: "flex", alignItems: "center",
        width: 44, height: 26, borderRadius: 13,
        background: checked ? "#10B981" : "#CBD5E1",
        padding: 3, transition: "background .22s",
      }}>
        <span style={{
          width: 20, height: 20, borderRadius: "50%",
          background: "#fff",
          boxShadow: "0 1px 4px rgba(0,0,0,.18)",
          transition: "transform .22s cubic-bezier(.34,1.56,.64,1)",
          transform: checked ? "translateX(18px)" : "translateX(0)",
        }} />
      </span>
    </label>
  );
}

/* ──────────────── RULE ROW (horizontal) ────────────── */
function RuleRow({ rule, onSave, onToggle, saving, isLast }) {
  const [draft, setDraft] = useState(String(rule.valeur));
  const isDirty   = draft !== "" && parseFloat(draft) !== rule.valeur;
  const isLoading = saving === rule.id;
  const cfg       = RULE_CFG[rule.cle] || { Icon: IcoCalc, color: "teal", accentBg: "#F0FDFA", accentColor: "#0D9488" };

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "44px 1fr auto auto",
      alignItems: "center",
      gap: 20,
      padding: "18px 24px",
      borderBottom: isLast ? "none" : "1px solid #F1F5F9",
      opacity: rule.actif ? 1 : .5,
      transition: "background .15s",
      cursor: "default",
    }}
    onMouseEnter={e => e.currentTarget.style.background = "#FAFBFC"}
    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      {/* Icône */}
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: cfg.accentBg, color: cfg.accentColor,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <cfg.Icon size={18} />
      </div>

      {/* Infos */}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 700, fontSize: ".9rem", color: "#0F172A" }}>{rule.libelle}</span>
          {rule.nb_nuits_max && (
            <span style={{
              fontSize: ".68rem", fontWeight: 700, padding: "2px 8px",
              borderRadius: 20, background: "#EFF6FF", color: "#1D4ED8",
              border: "1px solid #BFDBFE",
            }}>
              max {rule.nb_nuits_max} nuits
            </span>
          )}
          {rule.etoiles_min != null && (
            <span style={{
              fontSize: ".68rem", fontWeight: 700, padding: "2px 8px",
              borderRadius: 20, background: "#FFFBEB", color: "#B45309",
              border: "1px solid #FDE68A",
            }}>
              {"★".repeat(rule.etoiles_min)} → {"★".repeat(rule.etoiles_max)}
            </span>
          )}
        </div>
        <span style={{ fontSize: ".78rem", color: "#94A3B8", lineHeight: 1.5 }}>
          {rule.description || "—"}
        </span>
      </div>

      {/* Éditeur valeur */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <div style={{
          display: "flex", alignItems: "center",
          background: "#fff",
          border: `1.5px solid ${isDirty ? "#F59E0B" : "#CBD5E1"}`,
          borderRadius: 10, overflow: "hidden", width: 160,
          boxShadow: isDirty ? "0 0 0 3px rgba(245,158,11,.15)" : "none",
          transition: "border-color .15s, box-shadow .15s",
        }}>
          <input
            type="number" min="0"
            step={rule.type_valeur === "POURCENTAGE" ? "0.1" : "0.5"}
            value={draft}
            disabled={!rule.actif}
            onChange={e => setDraft(e.target.value)}
            style={{
              flex: 1, border: "none", outline: "none",
              background: "transparent", padding: "9px 12px",
              fontSize: "1rem", fontWeight: 700, color: "#0F172A",
              width: 0, minWidth: 0,
            }}
          />
          <span style={{
            padding: "0 11px", fontSize: ".72rem", fontWeight: 600,
            color: "#94A3B8", background: "#F8FAFC",
            borderLeft: "1px solid #E2E8F0",
            height: "100%", display: "flex", alignItems: "center",
            whiteSpace: "nowrap",
          }}>
            {UNIT[rule.type_valeur]}
          </span>
        </div>

        <button
          disabled={!isDirty || isLoading || !rule.actif}
          onClick={() => onSave(rule.id, parseFloat(draft))}
          style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "9px 16px", borderRadius: 10,
            fontSize: ".8rem", fontWeight: 700, cursor: "pointer",
            transition: "all .15s", whiteSpace: "nowrap",
            border: isDirty ? "none" : "1.5px solid #E2E8F0",
            background: isDirty ? "#6366F1" : "transparent",
            color: isDirty ? "#fff" : "#10B981",
            boxShadow: isDirty ? "0 2px 8px rgba(99,102,241,.3)" : "none",
            opacity: (!isDirty && !isLoading) || rule.actif ? 1 : .5,
          }}
        >
          {isLoading ? <span style={{ width: 13, height: 13, borderRadius: "50%", border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", animation: "fcSpin .7s linear infinite", display: "inline-block" }} />
           : isDirty  ? "Enregistrer"
           : <><IcoCheck size={12} /> Sauvegardé</>}
        </button>
      </div>

      {/* Toggle */}
      <Toggle checked={rule.actif} onChange={() => onToggle(rule)} />
    </div>
  );
}

/* ─────────────────── SIMULATEUR ───────────────────── */
function Simulator() {
  const [form,    setForm]    = useState({ montant_ht: 300, nb_nuits: 5, nb_personnes: 2, etoiles: 4 });
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const simulate = async () => {
    setLoading(true); setError("");
    try {
      const p = new URLSearchParams({ ...form, etoiles_hotel: form.etoiles });
      const r = await fetch(`${API}/fiscal/simulate?${p}`, { headers: getAuthHeaders() });
      if (!r.ok) throw new Error("Erreur de simulation");
      setResult(await r.json());
    } catch(e) { setError(e.message); }
    setLoading(false);
  };

  const pct = result ? +((result.total_ttc - result.montant_ht) / result.montant_ht * 100).toFixed(1) : null;

  const fields = [
    { key: "montant_ht",   label: "Montant HT",  unit: "DT",     type: "number", min: 1  },
    { key: "nb_nuits",     label: "Nuits",        unit: "nuits",  type: "number", min: 1  },
    { key: "nb_personnes", label: "Personnes",    unit: "pers.",  type: "number", min: 1  },
  ];

  return (
    <div style={{
      background: "#fff", border: "1px solid #E2E8F0",
      borderRadius: 18, overflow: "hidden",
      boxShadow: "0 4px 16px rgba(15,23,42,.07)",
      marginBottom: 24,
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg,#0F172A 0%,#1E3A5F 100%)",
        padding: "20px 28px",
        display: "flex", alignItems: "center", gap: 14,
      }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12,
          background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.15)",
          display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
        }}>
          <IcoCalc size={20} />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: "1rem", color: "#fff", marginBottom: 2 }}>
            Simulateur fiscal
          </div>
          <div style={{ fontSize: ".78rem", color: "rgba(255,255,255,.55)" }}>
            Testez l'impact des règles sur une réservation fictive
          </div>
        </div>
      </div>

      {/* Corps */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: 0 }}>

        {/* Formulaire */}
        <div style={{ padding: "24px 28px", borderRight: "1px solid #F1F5F9", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {fields.map(f => (
              <label key={f.key} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <span style={{ fontSize: ".68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".6px", color: "#64748B" }}>
                  {f.label}
                </span>
                <div style={{
                  display: "flex", alignItems: "center",
                  border: "1.5px solid #CBD5E1", borderRadius: 10,
                  background: "#fff", height: 42, overflow: "hidden",
                  transition: "border-color .15s",
                }}>
                  <input
                    type={f.type} min={f.min}
                    value={form[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: Number(e.target.value) }))}
                    onFocus={e => e.currentTarget.parentElement.style.borderColor = "#6366F1"}
                    onBlur={e  => e.currentTarget.parentElement.style.borderColor = "#CBD5E1"}
                    style={{ flex: 1, border: "none", outline: "none", background: "transparent", padding: "0 12px", fontSize: ".9rem", fontWeight: 600, color: "#0F172A" }}
                  />
                  <span style={{ padding: "0 10px", fontSize: ".7rem", fontWeight: 600, color: "#94A3B8", background: "#F8FAFC", borderLeft: "1px solid #E2E8F0", height: "100%", display: "flex", alignItems: "center", whiteSpace: "nowrap" }}>
                    {f.unit}
                  </span>
                </div>
              </label>
            ))}

            {/* Select étoiles */}
            <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <span style={{ fontSize: ".68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".6px", color: "#64748B" }}>
                Classement
              </span>
              <select
                value={form.etoiles}
                onChange={e => setForm(p => ({ ...p, etoiles: Number(e.target.value) }))}
                style={{
                  height: 42, border: "1.5px solid #CBD5E1", borderRadius: 10,
                  padding: "0 12px", background: "#fff", fontSize: ".88rem",
                  fontWeight: 600, color: "#0F172A", cursor: "pointer", outline: "none",
                }}
              >
                {[1,2,3,4,5].map(n => (
                  <option key={n} value={n}>{"★".repeat(n)} {n} étoile{n > 1 ? "s" : ""}</option>
                ))}
              </select>
            </label>
          </div>

          <button
            onClick={simulate} disabled={loading}
            style={{
              width: "100%", height: 44, borderRadius: 10, border: "none",
              background: loading ? "#A5B4FC" : "linear-gradient(135deg,#6366F1,#4F46E5)",
              color: "#fff", fontSize: ".9rem", fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: loading ? "none" : "0 4px 14px rgba(99,102,241,.35)",
              transition: "all .2s",
            }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(99,102,241,.45)"; }}}
            onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = loading ? "none" : "0 4px 14px rgba(99,102,241,.35)"; }}
          >
            {loading
              ? <><span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", animation: "fcSpin .7s linear infinite", display: "inline-block" }} />Calcul…</>
              : <><IcoArrow /> Lancer la simulation</>}
          </button>

          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "#FFF1F2", border: "1px solid #FECDD3", borderRadius: 10, fontSize: ".82rem", color: "#9F1239" }}>
              <IcoAlert size={14} /> {error}
            </div>
          )}
        </div>

        {/* Résultats */}
        <div style={{ padding: "24px 28px", background: "#FAFBFD", display: "flex", flexDirection: "column", gap: 14 }}>
          {result ? (
            <>
              {/* Badge */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: ".68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".7px", color: "#94A3B8" }}>
                  Résultat
                </span>
                {pct != null && (
                  <span style={{ fontSize: ".72rem", fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "#FEF3C7", color: "#92400E", border: "1px solid #FDE68A" }}>
                    +{pct}% de charges
                  </span>
                )}
              </div>

              {/* Lignes */}
              <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, overflow: "hidden" }}>
                {[
                  { dot: "#1E3A5F", label: "Montant HT",       val: result.montant_ht,   extra: null,          bg: "rgba(99,102,241,.03)" },
                  result.taxe_sejour > 0 ? { dot: "#F59E0B", label: "Taxe de séjour",
                    val: result.taxe_sejour,
                    extra: `${result.nb_nuits_taxables} nuit${result.nb_nuits_taxables>1?"s":""} × ${result.nb_personnes??form.nb_personnes} pers.`,
                    bg: "rgba(245,158,11,.04)", prefix: "+" } : null,
                  { dot: "#14B8A6", label: `TVA (${result.taux_tva}%)`, val: result.tva_montant, extra: null, bg: "transparent", prefix: "+" },
                  result.droit_timbre > 0 ? { dot: "#8B5CF6", label: "Droit de timbre", val: result.droit_timbre, extra: null, bg: "transparent", prefix: "+" } : null,
                  null, // divider
                  { dot: "#6366F1", label: "Total TTC", val: result.total_ttc, extra: null, bg: "#EEF2FF", isTotal: true },
                ].map((line, i) => {
                  if (line === null) return <div key={i} style={{ height: 1, background: "#E2E8F0" }} />;
                  return (
                    <div key={i} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "10px 16px", background: line.bg,
                      fontSize: line.isTotal ? ".9rem" : ".845rem",
                      fontWeight: line.isTotal ? 800 : 500,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: line.dot, flexShrink: 0 }} />
                        <span style={{ color: line.isTotal ? "#4F46E5" : "#334155" }}>{line.label}</span>
                        {line.extra && <span style={{ fontSize: ".7rem", color: "#94A3B8" }}>{line.extra}</span>}
                      </div>
                      <strong style={{ color: line.isTotal ? "#4F46E5" : "#0F172A", fontVariantNumeric: "tabular-nums" }}>
                        {line.prefix || ""}{line.val.toFixed(3)} DT
                      </strong>
                    </div>
                  );
                })}
              </div>

              {/* Barre proportionnelle */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ height: 8, borderRadius: 4, background: "#E2E8F0", display: "flex", overflow: "hidden" }}>
                  {[
                    { color: "#1E3A5F", val: result.montant_ht },
                    { color: "#F59E0B", val: result.taxe_sejour },
                    { color: "#14B8A6", val: result.tva_montant },
                    { color: "#8B5CF6", val: result.droit_timbre },
                  ].map((seg, i) => (
                    <div key={i} style={{
                      background: seg.color, flexShrink: 0,
                      width: `${(seg.val / result.total_ttc * 100).toFixed(2)}%`,
                      transition: "width .55s cubic-bezier(.4,0,.2,1)",
                    }} />
                  ))}
                </div>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                  {[
                    { color: "#1E3A5F", label: "HT" },
                    result.taxe_sejour > 0 && { color: "#F59E0B", label: "Taxe séjour" },
                    { color: "#14B8A6", label: "TVA" },
                    result.droit_timbre > 0 && { color: "#8B5CF6", label: "Timbre" },
                  ].filter(Boolean).map((lg, i) => (
                    <span key={i} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: ".7rem", color: "#64748B" }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: lg.color }} />
                      {lg.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Note */}
              {result.taxe_sejour > 0 && form.nb_nuits > result.nb_nuits_taxables && (
                <div style={{ fontSize: ".77rem", color: "#92400E", background: "#FFFBEB", padding: "8px 12px", borderLeft: "3px solid #F59E0B", borderRadius: "0 8px 8px 0" }}>
                  Seules {result.nb_nuits_taxables}/{form.nb_nuits} nuits sont taxées (plafond atteint).
                </div>
              )}
            </>
          ) : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, opacity: .35, textAlign: "center", padding: "32px 16px" }}>
              <IcoCalc size={32} />
              <p style={{ fontSize: ".84rem", color: "#64748B", margin: 0, lineHeight: 1.6 }}>
                Renseignez les paramètres<br />et lancez la simulation
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ──────────────── COMPOSANT PRINCIPAL ──────────────── */
export default function FiscalConfig() {
  const [rules,   setRules]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(null);
  const [toast,   setToast]   = useState(null);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/fiscal/rules`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const sorted = [...data.items].sort((a, b) => {
        const ai = CLE_ORDER.indexOf(a.cle), bi = CLE_ORDER.indexOf(b.cle);
        return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
      });
      setRules(sorted);
    } catch { showToast("Erreur de chargement", "error"); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  const saveRule = async (id, val) => {
    setSaving(id);
    try {
      const res = await fetch(`${API}/fiscal/rules/${id}`, {
        method: "PATCH", headers: getAuthHeaders(),
        body: JSON.stringify({ valeur: val }),
      });
      if (!res.ok) throw new Error();
      setRules(prev => prev.map(r => r.id === id ? { ...r, valeur: val } : r));
      showToast("Règle mise à jour ✓", "success");
    } catch { showToast("Erreur de sauvegarde", "error"); }
    setSaving(null);
  };

  const toggleRule = async (rule) => {
    try {
      await fetch(`${API}/fiscal/rules/${rule.id}`, {
        method: "PATCH", headers: getAuthHeaders(),
        body: JSON.stringify({ actif: !rule.actif }),
      });
      setRules(prev => prev.map(r => r.id === rule.id ? { ...r, actif: !r.actif } : r));
      showToast(rule.actif ? "Règle désactivée" : "Règle activée ✓", "success");
    } catch { showToast("Erreur", "error"); }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  const sejour = rules.filter(r => r.type_valeur === "PAR_NUIT");
  const autres = rules.filter(r => r.type_valeur !== "PAR_NUIT");

  /* ── Section helper ── */
  const Section = ({ title, hint, iconColor, iconBg, IconCmp, rows }) => (
    <div style={{ marginBottom: 28 }}>
      {/* Header section */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: iconBg, color: iconColor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <IconCmp size={16} />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "#0F172A" }}>{title}</h2>
          <p style={{ margin: 0, fontSize: ".78rem", color: "#94A3B8", lineHeight: 1.5 }}>{hint}</p>
        </div>
      </div>

      {/* Tableau des règles */}
      <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 3px rgba(15,23,42,.06)" }}>
        {/* Colonnes header */}
        <div style={{
          display: "grid", gridTemplateColumns: "44px 1fr auto auto",
          gap: 20, padding: "11px 24px",
          background: "#FAFBFC", borderBottom: "1px solid #F1F5F9",
        }}>
          <div />
          <span style={{ fontSize: ".67rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".6px", color: "#94A3B8" }}>Règle</span>
          <span style={{ fontSize: ".67rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".6px", color: "#94A3B8", whiteSpace: "nowrap" }}>Valeur</span>
          <span style={{ fontSize: ".67rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".6px", color: "#94A3B8" }}>Statut</span>
        </div>

        {rows.map((rule, i) => (
          <RuleRow
            key={rule.id}
            rule={rule}
            onSave={saveRule}
            onToggle={toggleRule}
            saving={saving}
            isLast={i === rows.length - 1}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="fc-page">

      {/* Toast */}
      {toast && (
        <div className={`fc-toast fc-toast--${toast.type}`}>
          <IcoCheck size={13} /> {toast.msg}
        </div>
      )}

      {/* ── Header page ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, marginBottom: 32, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: ".68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.4px", color: "#6366F1", marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 18, height: 2, background: "#6366F1", borderRadius: 2, display: "inline-block" }} />
            Configuration fiscale
          </div>
          <h1 style={{ margin: "0 0 8px", fontSize: "1.85rem", fontWeight: 800, color: "#0F172A", letterSpacing: "-.4px", lineHeight: 1.15 }}>
            Règles Fiscales
          </h1>
          <p style={{ margin: 0, fontSize: ".875rem", color: "#64748B", lineHeight: 1.65, maxWidth: 520 }}>
            Gérez dynamiquement les taxes, TVA et droits de timbre appliqués aux factures.
            Toute modification est prise en compte immédiatement lors de la génération.
          </p>
        </div>
        <button
          onClick={fetchRules}
          style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            padding: "9px 16px", background: "#fff", border: "1px solid #CBD5E1",
            borderRadius: 10, fontSize: ".82rem", fontWeight: 600, color: "#475569",
            cursor: "pointer", transition: "all .16s", whiteSpace: "nowrap",
            boxShadow: "0 1px 2px rgba(15,23,42,.04)", flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#6366F1"; e.currentTarget.style.color = "#6366F1"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#CBD5E1"; e.currentTarget.style.color = "#475569"; }}
        >
          <IcoRefresh /> Actualiser
        </button>
      </div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: 48, color: "#94A3B8" }}>
          <div style={{ width: 22, height: 22, borderRadius: "50%", border: "2.5px solid #E2E8F0", borderTopColor: "#6366F1", animation: "fcSpin .7s linear infinite" }} />
          Chargement des règles fiscales…
        </div>
      ) : (
        <>
          {sejour.length > 0 && (
            <Section
              title="Taxe de séjour"
              hint="Calculée par nuit et par personne selon le classement de l'hôtel — plafonnée au nombre de nuits configuré."
              iconColor="#4F46E5" iconBg="#EEF2FF"
              IconCmp={IcoMoon}
              rows={sejour}
            />
          )}
          {autres.length > 0 && (
            <Section
              title="Taxes générales"
              hint="Appliquées sur toutes les factures émises — clients connectés et visiteurs."
              iconColor="#0D9488" iconBg="#F0FDFA"
              IconCmp={IcoPercent}
              rows={autres}
            />
          )}
        </>
      )}

      {/* Simulateur */}
      <Simulator />

      {/* Warning */}
      <div style={{
        display: "flex", alignItems: "flex-start", gap: 10,
        padding: "14px 18px", background: "#FFFBEB",
        border: "1px solid #FDE68A", borderRadius: 10,
        fontSize: ".835rem", color: "#78350F", lineHeight: 1.55,
      }}>
        <span style={{ flexShrink: 0, marginTop: 1 }}><IcoAlert size={15} /></span>
        <p style={{ margin: 0 }}>
          <strong>Attention :</strong> les modifications s'appliquent uniquement aux nouvelles factures
          générées après la sauvegarde. Les factures existantes ne sont pas recalculées.
        </p>
      </div>
    </div>
  );
}