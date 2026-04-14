import { useState, useEffect } from "react";
import "./ReservationFlow.css";

const API = "http://localhost:8000/api/v1";

function authHeaders() {
  const t = localStorage.getItem("access_token");
  return { "Content-Type": "application/json", ...(t ? { Authorization: "Bearer " + t } : {}) };
}
function applyPromo(total, pct) {
  if (!total || !pct) return total;
  return +(total * (1 - pct / 100)).toFixed(2);
}

// ══════════════════════════════════════════════════════════
//  BLOC FISCAL — détail des taxes (design carte claire)
// ══════════════════════════════════════════════════════════
function FiscalDetail({ fiscal, loading }) {
  if (loading) {
    return (
      <div className="rf-fiscal-loading">
        <span className="rf-spin" />
        Calcul des taxes en cours…
      </div>
    );
  }
  if (!fiscal) return null;

  return (
    <div className="rf-fiscal-card">
      {/* En-tête */}
      <div className="rf-fiscal-header">
        <div className="rf-fiscal-header-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
        </div>
        <span className="rf-fiscal-header-title">Détail des taxes</span>
      </div>

      {/* Lignes */}
      <div className="rf-fiscal-rows">
        {/* Montant HT */}
        <div className="rf-fiscal-row">
          <span>Montant HT</span>
          <strong>{fiscal.montant_ht.toFixed(3)} DT</strong>
        </div>

        {/* Taxe de séjour — uniquement si > 0 */}
        {fiscal.taxe_sejour > 0 && (
          <div className="rf-fiscal-row rf-fiscal-row--tax">
            <span>
              Taxe de séjour
              <small>
                ({fiscal.nb_nuits_taxables} nuit{fiscal.nb_nuits_taxables > 1 ? "s" : ""}
                {" × "}{fiscal.nb_personnes} pers.)
              </small>
            </span>
            <strong>+ {fiscal.taxe_sejour.toFixed(3)} DT</strong>
          </div>
        )}

        {/* TVA */}
        <div className="rf-fiscal-row">
          <span>TVA ({fiscal.taux_tva}%)</span>
          <strong>+ {fiscal.tva_montant.toFixed(3)} DT</strong>
        </div>

        {/* Droit de timbre */}
        {fiscal.droit_timbre > 0 && (
          <div className="rf-fiscal-row">
            <span>Droit de timbre</span>
            <strong>+ {fiscal.droit_timbre.toFixed(3)} DT</strong>
          </div>
        )}
      </div>

      {/* Total TTC */}
      <div className="rf-fiscal-total">
        <span>Total TTC</span>
        <strong>{fiscal.total_ttc.toFixed(3)} DT</strong>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  ÉTAPE 1 — RÉCAPITULATIF
// ══════════════════════════════════════════════════════════
function StepRecap({ data, isClient, user, onNext, onClose, fiscal, fiscalLoading }) {
  const promoPct   = (data.hotel?.promotion_active && data.hotel?.promotion_pourcentage) || 0;
  const totalOrig  = data.prix?.total || 0;
  const totalFinal = applyPromo(totalOrig, promoPct);
  const economie   = +(totalOrig - totalFinal).toFixed(2);
  const montantTTC = fiscal ? fiscal.total_ttc : totalFinal;

  return (
    <div className="rf-step-content">

      {/* ── Hero réservation ── */}
      <div className="rf-recap-hero">

        {promoPct > 0 && (
          <div className="rf-promo-pill">
            🎁 PROMO -{Math.round(promoPct)}%
            {data.hotel?.promotion_titre && ` · ${data.hotel.promotion_titre}`}
          </div>
        )}

        <div className="rf-recap-hotel">🏨 {data.hotel?.nom}</div>

        <div className="rf-recap-row">
          <span>📅 {data.dateDebut}</span>
          <span className="rf-arrow">→</span>
          <span>{data.dateFin}</span>
          <span className="rf-nuits">{data.nuits} nuit{data.nuits > 1 ? "s" : ""}</span>
        </div>

        <div className="rf-recap-row">
          🛏 {data.chambre?.type_chambre?.nom || "Chambre"}
          &nbsp;·&nbsp;
          {data.adultes} adulte{data.adultes > 1 ? "s" : ""}
          {data.enfants > 0 ? `, ${data.enfants} enfant${data.enfants > 1 ? "s" : ""}` : ""}
        </div>

        {/* Prix HT */}
        <div className="rf-prix-ht">
          <div className="rf-prix-ht-label">Prix de la chambre (HT)</div>
          {promoPct > 0 ? (
            <div className="rf-recap-prix-promo">
              <div className="rf-prix-line">
                <span>Prix initial :</span>
                <span className="rf-prix-barre">{totalOrig.toFixed(2)} DT</span>
              </div>
              <div className="rf-prix-line rf-prix-reduc">
                <span>Réduction (-{Math.round(promoPct)}%) :</span>
                <span>− {economie.toFixed(2)} DT</span>
              </div>
              <div className="rf-prix-final">
                <span>Sous-total HT :</span>
                <strong>{totalFinal.toFixed(2)} DT</strong>
              </div>
            </div>
          ) : (
            <div className="rf-recap-prix-simple">
              <span>Sous-total HT :</span>
              <strong>{totalOrig.toFixed(2)} DT</strong>
            </div>
          )}
        </div>
      </div>

      {/* ── Détail fiscal (carte claire, en dehors du hero) ── */}
      <FiscalDetail fiscal={fiscal} loading={fiscalLoading} />

      {/* ── Bannière total à payer ── */}
      {(fiscal || !fiscalLoading) && (
        <div className="rf-total-banner">
          <div className="rf-total-banner-left">
            <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.6)" strokeWidth="2">
              <rect x="1" y="4" width="22" height="16" rx="2"/>
              <line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
            <span className="rf-total-banner-label">Total à payer</span>
          </div>
          <span className="rf-total-banner-amount">{montantTTC.toFixed(3)} DT</span>
        </div>
      )}

      {/* ── Notices ── */}
      {isClient ? (
        <div className="rf-notice rf-notice--success">
          ✓ Connecté en tant que <strong>{user?.prenom} {user?.nom}</strong>
        </div>
      ) : (
        <div className="rf-notice rf-notice--info">
          ℹ️ En tant que visiteur, veuillez renseigner vos coordonnées avant le paiement.
        </div>
      )}

      <div className="rf-footer">
        <button className="rf-btn-back" onClick={onClose}>Annuler</button>
        <button className="rf-btn-next" onClick={onNext}>Continuer →</button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  ÉTAPE 2 — INFOS VISITEUR
// ══════════════════════════════════════════════════════════
function StepInfos({ infos, setInfos, onNext, onBack }) {
  const valid = infos.nom && infos.prenom && infos.email && infos.telephone;
  return (
    <div className="rf-step-content">
      <div className="rf-form-grid">
        {[
          { key: "prenom",    label: "Prénom",    type: "text",  ph: "Votre prénom",        full: false },
          { key: "nom",       label: "Nom",       type: "text",  ph: "Votre nom",           full: false },
          { key: "email",     label: "Email",     type: "email", ph: "votre@email.com",     full: true  },
          { key: "telephone", label: "Téléphone", type: "tel",   ph: "+216 XX XXX XXX",     full: true  },
        ].map(({ key, label, type, ph, full }) => (
          <label key={key} className={`rf-field${full ? " rf-field--full" : ""}`}>
            <span>{label}</span>
            <input
              type={type}
              placeholder={ph}
              value={infos[key]}
              onChange={e => setInfos(p => ({ ...p, [key]: e.target.value }))}
            />
          </label>
        ))}
      </div>
      <div className="rf-footer">
        <button className="rf-btn-back" onClick={onBack}>← Retour</button>
        <button className="rf-btn-next" onClick={onNext} disabled={!valid}>
          Passer au paiement →
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  ÉTAPE 3 — PAIEMENT
// ══════════════════════════════════════════════════════════
function StepPaiement({ montant, paiement, setPaiement, onPay, onBack, loading, error }) {
  const [showNum, setShowNum] = useState(false);
  const fmtCard   = v => v.replace(/\D/g,"").replace(/(.{4})/g,"$1 ").trim().slice(0,19);
  const fmtExpiry = v => { const d = v.replace(/\D/g,""); return d.length >= 3 ? d.slice(0,2)+"/"+d.slice(2,4) : d; };

  return (
    <div className="rf-step-content">
      <div className="rf-montant-box">
        <span>Montant à payer</span>
        <strong>{parseFloat(montant).toFixed(3)} DT TTC</strong>
      </div>

      <label className="rf-field">
        <span>Méthode de paiement</span>
        <select value={paiement.methode} onChange={e => setPaiement(p => ({...p, methode: e.target.value}))}>
          <option value="CARTE_BANCAIRE">Carte bancaire</option>
          <option value="VIREMENT">Virement bancaire</option>
          <option value="ESPECES">Espèces</option>
          <option value="PAYPAL">PayPal</option>
          <option value="CHEQUE">Chèque</option>
        </select>
      </label>

      {paiement.methode === "CARTE_BANCAIRE" && (
        <div className="rf-card-fields">
          <label className="rf-field rf-field--full">
            <span>Nom sur la carte</span>
            <input type="text" placeholder="NOM PRÉNOM"
              value={paiement.carte_nom}
              onChange={e => setPaiement(p => ({...p, carte_nom: e.target.value.toUpperCase()}))} />
          </label>
          <label className="rf-field rf-field--full">
            <span>Numéro de carte</span>
            <div className="rf-card-input">
              <input type={showNum ? "text" : "password"} placeholder="•••• •••• •••• ••••"
                value={paiement.carte_numero}
                onChange={e => setPaiement(p => ({...p, carte_numero: fmtCard(e.target.value)}))} />
              <button type="button" className="rf-eye" onClick={() => setShowNum(v => !v)}>
                {showNum ? "🙈" : "👁"}
              </button>
            </div>
          </label>
          <label className="rf-field">
            <span>Date d'expiration</span>
            <input type="text" placeholder="MM/AA" maxLength={5}
              value={paiement.carte_expiry}
              onChange={e => setPaiement(p => ({...p, carte_expiry: fmtExpiry(e.target.value)}))} />
          </label>
          <label className="rf-field">
            <span>CVV</span>
            <input type="password" placeholder="•••" maxLength={4}
              value={paiement.carte_cvv}
              onChange={e => setPaiement(p => ({...p, carte_cvv: e.target.value.replace(/\D/g,"").slice(0,4)}))} />
          </label>
        </div>
      )}

      {error && <div className="rf-error">{error}</div>}

      <div className="rf-footer">
        <button className="rf-btn-back" onClick={onBack} disabled={loading}>← Retour</button>
        <button className="rf-btn-pay" onClick={onPay} disabled={loading}>
          {loading
            ? <><span className="rf-spin" /> Traitement…</>
            : `💳 Payer ${parseFloat(montant).toFixed(2)} DT`}
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  ÉTAPE SUCCÈS
// ══════════════════════════════════════════════════════════
function StepSucces({ result, isClient, onClose }) {
  const [downloading, setDownloading] = useState(false);

  const downloadPdf = async () => {
    setDownloading(true);
    try {
      const token = localStorage.getItem("access_token");
      const url   = (isClient && result.reservation_id)
        ? `${API}/reservations/${result.reservation_id}/voucher-pdf`
        : `${API}/reservations/visiteur/${result.numero_voucher}/pdf`;
      const filename = (isClient && result.facture_numero)
        ? `voucher-${result.facture_numero}.pdf`
        : `voucher-${result.numero_voucher}.pdf`;

      const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = filename; a.click();
      URL.revokeObjectURL(a.href);
    } catch(e) { alert("Erreur PDF : " + e.message); }
    setDownloading(false);
  };

  const rows = isClient
    ? [
        ["N° Réservation", `#${result.reservation_id}`],
        ["N° Facture",     result.facture_numero],
        ["Hôtel",          result.hotel_nom],
        ["Chambre",        result.chambre_nom],
        ["Arrivée",        result.date_debut],
        ["Départ",         result.date_fin],
        ["Durée",          `${result.nb_nuits} nuit${result.nb_nuits > 1 ? "s" : ""}`],
        ["Total payé",     `${parseFloat(result.montant_total).toFixed(3)} DT TTC`],
        ["Email",          result.email],
      ]
    : [
        ["N° Voucher",  result.numero_voucher],
        ["Hôtel",       result.hotel_nom],
        ["Chambre",     result.chambre_nom],
        ["Arrivée",     result.date_debut],
        ["Départ",      result.date_fin],
        ["Durée",       `${result.nb_nuits} nuit${result.nb_nuits > 1 ? "s" : ""}`],
        ["Total payé",  `${parseFloat(result.montant_total).toFixed(3)} DT TTC`],
        ["Email",       result.email],
      ];

  return (
    <div className="rf-step-content rf-succes">
      <div className="rf-succes-icon">🎉</div>
      <h3>Réservation confirmée !</h3>
      <p>Votre paiement a bien été enregistré.</p>
      <div className="rf-succes-details">
        {rows.map(([l, v]) => (
          <div key={l} className="rf-succes-item">
            <span>{l}</span><strong>{v}</strong>
          </div>
        ))}
      </div>
      <button className="rf-btn-pdf" onClick={downloadPdf} disabled={downloading}>
        {downloading ? <><span className="rf-spin" />Génération…</> : <>📄 Télécharger le voucher PDF</>}
      </button>
      <p className="rf-succes-note">Une confirmation vous sera envoyée par email à {result.email}</p>
      <button className="rf-btn-close" onClick={onClose}>Fermer</button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  FLOW PRINCIPAL
// ══════════════════════════════════════════════════════════
export default function ReservationFlow({ data, isClient, user, onClose, onNeedAuth }) {
  const steps = isClient
    ? ["recap", "paiement", "succes"]
    : ["recap", "infos", "paiement", "succes"];

  const [step,         setStep]         = useState("recap");
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [result,       setResult]       = useState(null);
  const [fiscal,       setFiscal]       = useState(null);
  const [fiscalLoading,setFiscalLoading] = useState(false);

  const [infos, setInfos] = useState({
    nom: user?.nom||"", prenom: user?.prenom||"",
    email: user?.email||"", telephone: user?.telephone||"",
  });
  const [paiement, setPaiement] = useState({
    methode: "CARTE_BANCAIRE",
    carte_nom: user ? `${(user.prenom||"").toUpperCase()} ${(user.nom||"").toUpperCase()}` : "",
    carte_numero: "", carte_expiry: "", carte_cvv: "",
  });

  const promoPct    = (data?.hotel?.promotion_active && data?.hotel?.promotion_pourcentage) || 0;
  const montantHT   = applyPromo(data?.prix?.total || 0, promoPct);
  const montantFinal = fiscal ? fiscal.total_ttc : montantHT;

  // ── Appel API fiscal dès le montage ──────────────────
  useEffect(() => {
    if (!data?.chambre || !data?.nuits || !data?.hotel) return;
    const etoiles    = data.hotel.etoiles || 3;
    const nbPersonnes = (data.adultes || 1) + (data.enfants || 0);

    (async () => {
      setFiscalLoading(true);
      try {
        const p = new URLSearchParams({
          montant_ht: montantHT, nb_nuits: data.nuits,
          nb_personnes: nbPersonnes, etoiles_hotel: etoiles,
        });
        const r = await fetch(`${API}/fiscal/preview?${p}`);
        if (r.ok) setFiscal(await r.json());
      } catch { /* silencieux */ }
      setFiscalLoading(false);
    })();
  }, [montantHT, data?.nuits, data?.hotel?.etoiles, data?.adultes, data?.enfants]);

  const stepIdx = steps.indexOf(step);
  const titles  = { recap:"Récapitulatif", infos:"Vos coordonnées", paiement:"Paiement", succes:"Confirmation" };

  const handlePay = async () => {
    setError(""); setLoading(true);
    try {
      let res;
      if (isClient) {
        const r1 = await fetch(`${API}/reservations/chambres`, {
          method:"POST", headers: authHeaders(),
          body: JSON.stringify({
            date_debut: data.dateDebut, date_fin: data.dateFin,
            promo_pct: promoPct || null,
            chambres: [{ id_chambre: data.chambre.id, nb_adultes: data.adultes, nb_enfants: data.enfants }],
          }),
        });
        const resa = await r1.json();
        if (!r1.ok) throw new Error(resa.detail || "Erreur création réservation");

        const r2 = await fetch(`${API}/reservations/${resa.id}/paiement`, {
          method:"POST", headers: authHeaders(),
          body: JSON.stringify({ methode: paiement.methode, transaction_id: "HOT-"+Date.now() }),
        });
        const facture = await r2.json();
        if (!r2.ok) throw new Error(facture.detail || "Erreur paiement");

        res = {
          reservation_id: resa.id, facture_numero: facture.numero,
          montant_total: facture.montant_total, email: user.email,
          hotel_nom: data.hotel?.nom||"—", chambre_nom: data.chambre?.type_chambre?.nom||"Chambre",
          date_debut: data.dateDebut, date_fin: data.dateFin, nb_nuits: data.nuits,
        };
      } else {
        const r = await fetch(`${API}/reservations/visiteur`, {
          method:"POST", headers: {"Content-Type":"application/json"},
          body: JSON.stringify({
            nom: infos.nom, prenom: infos.prenom, email: infos.email, telephone: infos.telephone,
            date_debut: data.dateDebut, date_fin: data.dateFin,
            id_chambre: data.chambre.id, nb_adultes: data.adultes, nb_enfants: data.enfants,
            methode: paiement.methode, promo_pct: promoPct || null,
          }),
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.detail || "Erreur réservation visiteur");
        res = d;
      }
      setResult(res); setStep("succes");
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="rf-overlay" onClick={e => e.target === e.currentTarget && step !== "succes" && onClose()}>
      <div className="rf-modal">

        {/* Header */}
        <div className="rf-header">
          <div>
            <h2 className="rf-title">Réservation</h2>
            <p className="rf-subtitle">{data?.hotel?.nom}</p>
          </div>
          {step !== "succes" && (
            <button className="rf-close" onClick={onClose}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>

        {/* Progress */}
        {step !== "succes" && (
          <div className="rf-progress">
            {steps.filter(s => s !== "succes").map((s, i) => (
              <div key={s} className="rf-prog-step">
                <div className={`rf-prog-dot ${stepIdx > i ? "done" : stepIdx === i ? "active" : ""}`}>
                  {stepIdx > i ? "✓" : i + 1}
                </div>
                <span className={`rf-prog-label${stepIdx === i ? " active" : stepIdx > i ? " done" : ""}`}>
                  {titles[s]}
                </span>
                {i < steps.filter(s => s !== "succes").length - 1 && (
                  <div className={`rf-prog-line${stepIdx > i ? " done" : ""}`} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Étapes */}
        {step === "recap" && (
          <StepRecap data={data} isClient={isClient} user={user}
            onNext={() => setStep(isClient ? "paiement" : "infos")}
            onClose={onClose} fiscal={fiscal} fiscalLoading={fiscalLoading} />
        )}
        {step === "infos" && (
          <StepInfos infos={infos} setInfos={setInfos}
            onNext={() => setStep("paiement")} onBack={() => setStep("recap")} />
        )}
        {step === "paiement" && (
          <StepPaiement montant={montantFinal} paiement={paiement} setPaiement={setPaiement}
            onPay={handlePay} onBack={() => setStep(isClient ? "recap" : "infos")}
            loading={loading} error={error} />
        )}
        {step === "succes" && (
          <StepSucces result={result} isClient={isClient} onClose={onClose} />
        )}
      </div>
    </div>
  );
}