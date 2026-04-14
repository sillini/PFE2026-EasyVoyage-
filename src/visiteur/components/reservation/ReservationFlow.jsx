import { useState } from "react";
import "./ReservationFlow.css";

const API = "http://localhost:8000/api/v1";

function authHeaders() {
  const t = localStorage.getItem("access_token");
  return { "Content-Type": "application/json", ...(t ? { Authorization: "Bearer " + t } : {}) };
}

// ── Helper : calcule le prix promo à partir d'un total et d'un % ──
function applyPromo(total, promoPct) {
  if (!total || !promoPct) return total;
  return +(total * (1 - promoPct / 100)).toFixed(2);
}

// ══════════════════════════════════════════════════════════
//  ÉTAPE 1 — RÉCAPITULATIF
// ══════════════════════════════════════════════════════════
function StepRecap({ data, isClient, user, onNext, onClose }) {
  const promoPct  = (data.hotel?.promotion_active && data.hotel?.promotion_pourcentage) || 0;
  const totalOrig = data.prix?.total || 0;
  const totalFinal = applyPromo(totalOrig, promoPct);
  const economie  = totalOrig - totalFinal;

  return (
    <div className="rf-step-content">
      <div className="rf-recap-hero">
        {/* Badge promo */}
        {promoPct > 0 && (
          <div className="rf-promo-pill">
            🎁 <strong>PROMO -{Math.round(promoPct)}%</strong>
            {data.hotel?.promotion_titre && <span> · {data.hotel.promotion_titre}</span>}
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
          🛏 {data.chambre?.type_chambre?.nom || "Chambre"} &nbsp;·&nbsp;
          {data.adultes} adulte{data.adultes > 1 ? "s" : ""}
          {data.enfants > 0 ? `, ${data.enfants} enfant${data.enfants > 1 ? "s" : ""}` : ""}
        </div>

        {/* Prix — avec ou sans promo */}
        {promoPct > 0 ? (
          <div className="rf-recap-prix rf-recap-prix-promo">
            <div className="rf-prix-line">
              <span>Prix initial :</span>
              <span className="rf-prix-barre">{totalOrig.toFixed(2)} DT</span>
            </div>
            <div className="rf-prix-line rf-prix-reduc">
              <span>Réduction (-{Math.round(promoPct)}%) :</span>
              <span>− {economie.toFixed(2)} DT</span>
            </div>
            <div className="rf-prix-line rf-prix-total">
              <span>Total séjour :</span>
              <strong>{totalFinal.toFixed(2)} DT</strong>
            </div>
          </div>
        ) : (
          <div className="rf-recap-prix">
            <span>Total séjour :</span>
            <strong>{totalOrig.toFixed(2)} DT</strong>
          </div>
        )}
      </div>

      {isClient ? (
        <div className="rf-notice green">
          ✓ Connecté en tant que <strong>{user.prenom} {user.nom}</strong> — passage direct au paiement
        </div>
      ) : (
        <div className="rf-notice orange">
          ℹ️ En tant que visiteur, veuillez renseigner vos coordonnées avant le paiement.
        </div>
      )}

      <div className="rf-footer">
        <button className="rf-btn-back" onClick={onClose}>Annuler</button>
        <button className="rf-btn-next" onClick={onNext}>
          {isClient ? "Aller au paiement →" : "Continuer →"}
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  ÉTAPE 2 — INFOS VISITEUR
// ══════════════════════════════════════════════════════════
function StepInfos({ form, setForm, onNext, onBack }) {
  const ok = form.nom && form.prenom && form.email.includes("@") && form.telephone;
  return (
    <div className="rf-step-content">
      <p className="rf-step-desc">Renseignez vos coordonnées pour confirmer la réservation</p>
      <div className="rf-row2">
        <div className="rf-field">
          <label>Prénom *</label>
          <input value={form.prenom}
            onChange={e => setForm({ ...form, prenom: e.target.value })}
            placeholder="Mohamed" />
        </div>
        <div className="rf-field">
          <label>Nom *</label>
          <input value={form.nom}
            onChange={e => setForm({ ...form, nom: e.target.value })}
            placeholder="Ben Ali" />
        </div>
      </div>
      <div className="rf-field">
        <label>Email *</label>
        <input type="email" value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
          placeholder="votre@email.com" />
      </div>
      <div className="rf-field">
        <label>Téléphone *</label>
        <input value={form.telephone}
          onChange={e => setForm({ ...form, telephone: e.target.value })}
          placeholder="+216 XX XXX XXX" />
      </div>
      <div className="rf-footer">
        <button className="rf-btn-back" onClick={onBack}>← Retour</button>
        <button className="rf-btn-next" disabled={!ok} onClick={onNext}>
          Passer au paiement →
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  ÉTAPE 3 — PAIEMENT
// ══════════════════════════════════════════════════════════
function StepPaiement({ montant, montantOriginal, promoPct, paiement, setPaiement, loading, error, onPay, onBack }) {
  const [showNum, setShowNum] = useState(false);
  const fmtCard   = v => v.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim().slice(0, 19);
  const fmtExpiry = v => {
    const d = v.replace(/\D/g, "");
    return d.length >= 3 ? d.slice(0, 2) + "/" + d.slice(2, 4) : d;
  };

  const hasPromo = promoPct > 0 && montantOriginal && montantOriginal > montant;

  return (
    <div className="rf-step-content">
      <div className="rf-montant-banner">
        <span>Montant à payer</span>
        {hasPromo ? (
          <div className="rf-montant-promo">
            <span className="rf-montant-barre">{montantOriginal.toFixed(2)} DT</span>
            <strong>{montant.toFixed(2)} DT</strong>
            <span className="rf-montant-badge">-{Math.round(promoPct)}%</span>
          </div>
        ) : (
          <strong>{montant?.toFixed(2)} DT</strong>
        )}
      </div>

      {/* Méthodes */}
      <div className="rf-methodes">
        {[
          { id: "CARTE_BANCAIRE", label: "Carte bancaire", icon: "💳" },
          { id: "VIREMENT",       label: "Virement",       icon: "🏦" },
          { id: "ESPECES",        label: "Espèces",        icon: "💵" },
        ].map(m => (
          <label key={m.id} className={`rf-methode ${paiement.methode === m.id ? "on" : ""}`}>
            <input type="radio" name="methode" value={m.id}
              checked={paiement.methode === m.id}
              onChange={() => setPaiement({ ...paiement, methode: m.id })} />
            <span>{m.icon}</span><span>{m.label}</span>
          </label>
        ))}
      </div>

      {/* Carte bancaire */}
      {paiement.methode === "CARTE_BANCAIRE" && (
        <div className="rf-carte-form">
          <div className="rf-test-badge">🧪 Mode TEST — aucune transaction réelle</div>
          <div className="rf-field">
            <label>Nom sur la carte</label>
            <input value={paiement.carte_nom}
              onChange={e => setPaiement({ ...paiement, carte_nom: e.target.value })}
              placeholder="PRÉNOM NOM" />
          </div>
          <div className="rf-field">
            <label>Numéro de carte</label>
            <div className="rf-card-input">
              <input value={paiement.carte_numero}
                onChange={e => setPaiement({ ...paiement, carte_numero: fmtCard(e.target.value) })}
                placeholder="1234 5678 9012 3456" maxLength={19}
                type={showNum ? "text" : "password"} />
              <button type="button" onClick={() => setShowNum(!showNum)} className="rf-eye">
                {showNum ? "🙈" : "👁"}
              </button>
            </div>
            <div className="rf-card-hint">Mode test : n'importe quel numéro est accepté</div>
          </div>
          <div className="rf-row2">
            <div className="rf-field">
              <label>Expiration</label>
              <input value={paiement.carte_expiry}
                onChange={e => setPaiement({ ...paiement, carte_expiry: fmtExpiry(e.target.value) })}
                placeholder="MM/AA" maxLength={5} />
            </div>
            <div className="rf-field">
              <label>CVV</label>
              <input type="password" value={paiement.carte_cvv}
                onChange={e => setPaiement({ ...paiement, carte_cvv: e.target.value.slice(0, 3) })}
                placeholder="***" maxLength={3} />
            </div>
          </div>
        </div>
      )}

      {/* Virement */}
      {paiement.methode === "VIREMENT" && (
        <div className="rf-info-box">
          <p>Virement bancaire vers :</p>
          <div className="rf-iban">RIB : 12 345 0000000123456789 56</div>
          <p className="rf-note">Votre réservation sera confirmée dès réception du virement.</p>
        </div>
      )}

      {/* Espèces */}
      {paiement.methode === "ESPECES" && (
        <div className="rf-info-box">
          <p>💵 Paiement en espèces à la réception de l'hôtel lors de votre arrivée.</p>
        </div>
      )}

      {error && <div className="rf-error">⚠️ {error}</div>}

      <div className="rf-footer">
        <button className="rf-btn-back" onClick={onBack} disabled={loading}>← Retour</button>
        <button className="rf-btn-pay" onClick={onPay} disabled={loading}>
          {loading
            ? <><span className="rf-spin" />Traitement…</>
            : <>🔒 Confirmer et payer {montant?.toFixed(2)} DT</>}
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  ÉTAPE 4 — SUCCÈS
// ══════════════════════════════════════════════════════════
function StepSucces({ result, isClient, onClose }) {
  const [downloading, setDownloading] = useState(false);

  const downloadPdf = async () => {
    setDownloading(true);
    try {
      const token = localStorage.getItem("access_token");
      let url, filename;

      if (isClient) {
        url      = `${API}/reservations/${result.reservation_id}/voucher-pdf`;
        filename = `voucher-${result.facture_numero}.pdf`;
      } else {
        url      = `${API}/reservations/visiteur/${result.numero_voucher}/pdf`;
        filename = `voucher-${result.numero_voucher}.pdf`;
      }

      const res = await fetch(url, {
        headers: isClient ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Erreur ${res.status}${txt ? " : " + txt : ""}`);
      }

      const blob = await res.blob();
      const a    = document.createElement("a");
      a.href     = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      alert("Erreur téléchargement PDF : " + e.message);
    }
    setDownloading(false);
  };

  const rows = isClient
    ? [
        ["N° Réservation",  `#${result.reservation_id}`],
        ["N° Facture",      result.facture_numero],
        ["Hôtel",           result.hotel_nom],
        ["Chambre",         result.chambre_nom],
        ["Arrivée",         result.date_debut],
        ["Départ",          result.date_fin],
        ["Durée",           `${result.nb_nuits} nuit${result.nb_nuits > 1 ? "s" : ""}`],
        ["Montant payé",    `${parseFloat(result.montant_total).toFixed(2)} DT`],
        ["Email",           result.email],
      ]
    : [
        ["N° Voucher",      result.numero_voucher],
        ["Hôtel",           result.hotel_nom],
        ["Chambre",         result.chambre_nom],
        ["Arrivée",         result.date_debut],
        ["Départ",          result.date_fin],
        ["Durée",           `${result.nb_nuits} nuit${result.nb_nuits > 1 ? "s" : ""}`],
        ["Montant payé",    `${parseFloat(result.montant_total).toFixed(2)} DT`],
        ["Email",           result.email],
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
        {downloading
          ? <><span className="rf-spin" />Génération…</>
          : <>📄 Télécharger le voucher PDF</>}
      </button>

      <p className="rf-succes-note">
        Une confirmation vous sera envoyée par email à {result.email}
      </p>
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

  const [step,    setStep]    = useState("recap");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [result,  setResult]  = useState(null);

  const [infos, setInfos] = useState({
    nom:       user?.nom       || "",
    prenom:    user?.prenom    || "",
    email:     user?.email     || "",
    telephone: user?.telephone || "",
  });

  const [paiement, setPaiement] = useState({
    methode:      "CARTE_BANCAIRE",
    carte_nom:    user
      ? `${(user.prenom || "").toUpperCase()} ${(user.nom || "").toUpperCase()}`
      : "",
    carte_numero: "",
    carte_expiry: "",
    carte_cvv:    "",
  });

  // ── Calcul avec promotion ─────────────────────────────
  const promoPct        = (data?.hotel?.promotion_active && data?.hotel?.promotion_pourcentage) || 0;
  const montantOriginal = data?.prix?.total || 0;
  const montant         = applyPromo(montantOriginal, promoPct);

  const stepIdx = steps.indexOf(step);
  const titles  = {
    recap:    "Récapitulatif",
    infos:    "Vos coordonnées",
    paiement: "Paiement",
    succes:   "Confirmation",
  };

  // ── Logique paiement ──────────────────────────────────
  const handlePay = async () => {
    setError(""); setLoading(true);
    try {
      let res;

      if (isClient) {
        // ── CLIENT ──────────────────────────────────────
        // 1. Créer réservation chambre
        // On envoie le pourcentage de promotion pour que le backend l'applique
        const r1 = await fetch(`${API}/reservations/chambres`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            date_debut: data.dateDebut,
            date_fin:   data.dateFin,
            promo_pct:  promoPct || null,  // ← NOUVEAU
            chambres: [{
              id_chambre: data.chambre.id,
              nb_adultes: data.adultes,
              nb_enfants: data.enfants,
            }],
          }),
        });
        const resa = await r1.json();
        if (!r1.ok) throw new Error(resa.detail || "Erreur création réservation");

        // 2. Payer → génère la facture
        const r2 = await fetch(`${API}/reservations/${resa.id}/paiement`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            methode:        paiement.methode,
            transaction_id: "HOT-" + Date.now(),
          }),
        });
        const facture = await r2.json();
        if (!r2.ok) throw new Error(facture.detail || "Erreur paiement");

        res = {
          reservation_id: resa.id,
          facture_numero: facture.numero,
          montant_total:  facture.montant_total,
          email:          user.email,
          hotel_nom:      data.hotel?.nom                 || "—",
          chambre_nom:    data.chambre?.type_chambre?.nom || "Chambre",
          date_debut:     data.dateDebut,
          date_fin:       data.dateFin,
          nb_nuits:       data.nuits,
        };

      } else {
        // ── VISITEUR ─────────────────────────────────────
        const r = await fetch(`${API}/reservations/visiteur`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nom:        infos.nom,
            prenom:     infos.prenom,
            email:      infos.email,
            telephone:  infos.telephone,
            date_debut: data.dateDebut,
            date_fin:   data.dateFin,
            id_chambre: data.chambre.id,
            nb_adultes: data.adultes,
            nb_enfants: data.enfants,
            methode:    paiement.methode,
            promo_pct:  promoPct || null,   // ← NOUVEAU
          }),
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.detail || "Erreur réservation visiteur");
        res = d;
      }

      setResult(res);
      setStep("succes");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="rf-overlay"
      onClick={e => e.target === e.currentTarget && step !== "succes" && onClose()}
    >
      <div className="rf-modal">

        {/* ── Header ── */}
        <div className="rf-header">
          <div>
            <h2 className="rf-title">Réservation</h2>
            <p className="rf-subtitle">{data?.hotel?.nom}</p>
          </div>
          {step !== "succes" && (
            <button className="rf-close" onClick={onClose}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* ── Progression ── */}
        {step !== "succes" && (
          <div className="rf-progress">
            {steps.filter(s => s !== "succes").map((s, i) => (
              <div key={s} className="rf-prog-step">
                <div className={`rf-prog-dot ${stepIdx > i ? "done" : stepIdx === i ? "current" : ""}`}>
                  {stepIdx > i ? "✓" : i + 1}
                </div>
                <span className={stepIdx === i ? "rf-prog-active" : ""}>{titles[s]}</span>
                {i < steps.filter(s => s !== "succes").length - 1 && (
                  <div className={`rf-prog-line ${stepIdx > i ? "done" : ""}`} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Contenu des étapes ── */}
        {step === "recap" && (
          <StepRecap
            data={data} isClient={isClient} user={user}
            onNext={() => setStep(isClient ? "paiement" : "infos")}
            onClose={onClose}
          />
        )}
        {step === "infos" && (
          <StepInfos
            form={infos} setForm={setInfos}
            onNext={() => setStep("paiement")}
            onBack={() => setStep("recap")}
          />
        )}
        {step === "paiement" && (
          <StepPaiement
            montant={montant}
            montantOriginal={montantOriginal}
            promoPct={promoPct}
            paiement={paiement} setPaiement={setPaiement}
            loading={loading} error={error}
            onPay={handlePay}
            onBack={() => setStep(isClient ? "recap" : "infos")}
          />
        )}
        {step === "succes" && (
          <StepSucces result={result} isClient={isClient} onClose={onClose} />
        )}

      </div>
    </div>
  );
}