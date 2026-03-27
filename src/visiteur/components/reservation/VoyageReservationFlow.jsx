import { useState } from "react";
import "./ReservationFlow.css";

const API = "http://localhost:8000/api/v1";

function authHeaders() {
  const t = localStorage.getItem("access_token");
  return { "Content-Type": "application/json", ...(t ? { Authorization: "Bearer " + t } : {}) };
}

// ══════════════════════════════════════════════════════════
//  ÉTAPE 1 — RÉCAPITULATIF VOYAGE
// ══════════════════════════════════════════════════════════
function StepRecap({ data, user, onNext, onClose }) {
  const nbPersonnes = data.adultes + data.enfants;
  return (
    <div className="rf-step-content">
      <div className="rf-recap-hero">
        <div className="rf-recap-hotel">✈️ {data.voyage?.titre}</div>
        <div className="rf-recap-row">
          <span>📍 {data.voyage?.destination}</span>
        </div>
        <div className="rf-recap-row">
          <span>📅 {data.voyage?.date_depart}</span>
          <span className="rf-arrow">→</span>
          <span>{data.voyage?.date_retour}</span>
          <span className="rf-nuits">{data.voyage?.duree} j</span>
        </div>
        <div className="rf-recap-row">
          👥 {data.adultes} adulte{data.adultes > 1 ? "s" : ""}
          {data.enfants > 0 ? `, ${data.enfants} enfant${data.enfants > 1 ? "s" : ""}` : ""}
          &nbsp;·&nbsp; <strong>{nbPersonnes} personne{nbPersonnes > 1 ? "s" : ""}</strong>
        </div>
        <div className="rf-recap-prix">
          <span>Total ({nbPersonnes} pers. × {parseFloat(data.voyage?.prix_base || 0).toFixed(2)} DT) :</span>
          <strong>{data.prix?.total?.toFixed(2)} DT</strong>
        </div>
      </div>

      <div className="rf-notice green">
        ✓ Connecté en tant que <strong>{user?.prenom} {user?.nom}</strong>
      </div>

      <div className="rf-footer">
        <button className="rf-btn-back" onClick={onClose}>Annuler</button>
        <button className="rf-btn-next" onClick={onNext}>Passer au paiement →</button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  ÉTAPE 2 — PAIEMENT
// ══════════════════════════════════════════════════════════
function StepPaiement({ montant, paiement, setPaiement, onPay, onBack, loading, error }) {
  const [showNum, setShowNum] = useState(false);
  const fmtCard   = v => v.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim().slice(0, 19);
  const fmtExpiry = v => { const d = v.replace(/\D/g, ""); return d.length >= 3 ? d.slice(0,2)+"/"+d.slice(2,4) : d; };

  return (
    <div className="rf-step-content">
      <div className="rf-montant-banner">
        <span>Montant à payer</span>
        <strong>{montant?.toFixed(2)} DT</strong>
      </div>

      {/* Méthode de paiement */}
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

      {paiement.methode === "VIREMENT" && (
        <div className="rf-info-box">
          <p>Virement bancaire vers :</p>
          <div className="rf-iban">RIB : 12 345 0000000123456789 56</div>
          <p className="rf-note">Votre réservation sera confirmée dès réception du virement.</p>
        </div>
      )}

      {paiement.methode === "ESPECES" && (
        <div className="rf-info-box">
          <p>💵 Paiement en espèces à l'agence avant le départ.</p>
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
//  ÉTAPE 3 — SUCCÈS
// ══════════════════════════════════════════════════════════
function StepSucces({ result, onClose }) {
  const [downloading, setDownloading] = useState(false);

  const downloadPdf = async () => {
    setDownloading(true);
    try {
      const token = localStorage.getItem("access_token");
      const url   = `${API}/reservations/${result.reservation_id}/voucher-pdf`;
      const res   = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Erreur téléchargement PDF");
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `voucher-${result.facture_numero}.pdf`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) { alert("Erreur : " + e.message); }
    setDownloading(false);
  };

  return (
    <div className="rf-step-content rf-succes">
      <div className="rf-succes-icon">🎉</div>
      <h3>Voyage réservé !</h3>
      <p>Votre réservation a bien été confirmée.</p>

      <div className="rf-succes-details">
        {[
          ["N° Réservation",  `#${result.reservation_id}`],
          ["N° Facture",      result.facture_numero],
          ["Voyage",          result.voyage_titre],
          ["Destination",     result.destination],
          ["Départ",          result.date_debut],
          ["Retour",          result.date_fin],
          ["Durée",           `${result.duree} jour${result.duree > 1 ? "s" : ""}`],
          ["Voyageurs",       `${result.nb_personnes} personne${result.nb_personnes > 1 ? "s" : ""}`],
          ["Montant payé",    `${parseFloat(result.montant_total).toFixed(2)} DT`],
          ["Email",           result.email],
        ].map(([l, v]) => (
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
//  FLOW PRINCIPAL — CLIENT UNIQUEMENT
// ══════════════════════════════════════════════════════════
export default function VoyageReservationFlow({ data, user, onClose }) {
  // Seul un CLIENT authentifié peut réserver un voyage
  const steps   = ["recap", "paiement", "succes"];
  const [step,    setStep]    = useState("recap");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [result,  setResult]  = useState(null);

  const [paiement, setPaiement] = useState({
    methode:      "CARTE_BANCAIRE",
    carte_nom:    user ? `${(user.prenom||"").toUpperCase()} ${(user.nom||"").toUpperCase()}` : "",
    carte_numero: "",
    carte_expiry: "",
    carte_cvv:    "",
  });

  const montant = data?.prix?.total;
  const stepIdx = steps.indexOf(step);
  const titles  = { recap: "Récapitulatif", paiement: "Paiement", succes: "Confirmation" };

  const handlePay = async () => {
    setError(""); setLoading(true);
    try {
      // 1. Créer réservation voyage (CLIENT uniquement via token JWT)
      const r1 = await fetch(`${API}/reservations/voyage`, {
        method:  "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          id_voyage:  data.voyage.id,
          date_debut: data.voyage.date_depart,
          date_fin:   data.voyage.date_retour,
        }),
      });
      const resa = await r1.json();
      if (!r1.ok) throw new Error(resa.detail || "Erreur création réservation");

      // 2. Payer → génère la facture
      const r2 = await fetch(`${API}/reservations/${resa.id}/paiement`, {
        method:  "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          methode:        paiement.methode,
          transaction_id: "VG-" + Date.now(),
        }),
      });
      const facture = await r2.json();
      if (!r2.ok) throw new Error(facture.detail || "Erreur paiement");

      const nbPersonnes = data.adultes + data.enfants;
      setResult({
        reservation_id: resa.id,
        facture_numero: facture.numero,
        montant_total:  facture.montant_total,
        email:          user.email,
        voyage_titre:   data.voyage?.titre       || "—",
        destination:    data.voyage?.destination || "—",
        date_debut:     data.voyage?.date_depart,
        date_fin:       data.voyage?.date_retour,
        duree:          data.voyage?.duree       || 0,
        nb_personnes:   nbPersonnes,
      });
      setStep("succes");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rf-overlay"
      onClick={e => e.target === e.currentTarget && step !== "succes" && onClose()}>
      <div className="rf-modal">

        {/* Header */}
        <div className="rf-header">
          <div>
            <h2 className="rf-title">Réservation voyage</h2>
            <p className="rf-subtitle">{data?.voyage?.titre}</p>
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

        {/* Progress */}
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

        {/* Contenu */}
        {step === "recap"    && <StepRecap    data={data} user={user} onNext={() => setStep("paiement")} onClose={onClose} />}
        {step === "paiement" && <StepPaiement montant={montant} paiement={paiement} setPaiement={setPaiement} onPay={handlePay} onBack={() => setStep("recap")} loading={loading} error={error} />}
        {step === "succes"   && <StepSucces   result={result} onClose={onClose} />}
      </div>
    </div>
  );
}