import { useState, useEffect } from "react";
import "./ProfilModal.css";

const API = "http://localhost:8000/api/v1";
function authHeaders() {
  const t = localStorage.getItem("access_token");
  return { "Content-Type":"application/json", ...(t?{Authorization:"Bearer "+t}:{}) };
}

export default function ProfilModal({ user, onClose, onLogout }) {
  const [tab,     setTab]     = useState("profil");
  const [form,    setForm]    = useState({ nom:user?.nom||"", prenom:user?.prenom||"", telephone:user?.telephone||"" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error,   setError]   = useState("");
  const [reservations, setReservations] = useState([]);

  const initiales = ((user?.prenom?.[0]||"")+(user?.nom?.[0]||"")).toUpperCase();

  useEffect(() => {
    if (tab === "reservations") {
      fetch(`${API}/client/reservations?page=1&per_page=20`, { headers: authHeaders() })
        .then(r=>r.json()).then(d=>setReservations(d?.items||[])).catch(()=>setReservations([]));
    }
  }, [tab]);

  const saveProfile = async (e) => {
    e.preventDefault(); setError(""); setSuccess(""); setLoading(true);
    try {
      const res = await fetch(`${API}/auth/me`, {
        method:"PUT", headers: authHeaders(), body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail||"Erreur");
      setSuccess("Profil mis à jour !");
    } catch(err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const STATUT = { EN_ATTENTE:"⏳ En attente", CONFIRMEE:"✅ Confirmée", ANNULEE:"❌ Annulée", TERMINEE:"🏁 Terminée" };
  const fmt = d => d ? new Date(d).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric"}) : "—";

  return (
    <div className="pm-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="pm-modal">
        {/* Header */}
        <div className="pm-header">
          <div className="pm-avatar">{initiales}</div>
          <div className="pm-header-info">
            <h2>{user?.prenom} {user?.nom}</h2>
            <p>{user?.email}</p>
          </div>
          <button className="pm-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="pm-tabs">
          <button className={`pm-tab ${tab==="profil"?"on":""}`} onClick={()=>setTab("profil")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>
            Mon profil
          </button>
          <button className={`pm-tab ${tab==="reservations"?"on":""}`} onClick={()=>setTab("reservations")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Mes réservations
          </button>
        </div>

        <div className="pm-body">
          {tab === "profil" && (
            <form onSubmit={saveProfile}>
              <div className="pm-row">
                <div className="pm-field"><label>Prénom</label>
                  <input value={form.prenom} onChange={e=>setForm({...form,prenom:e.target.value})} required/>
                </div>
                <div className="pm-field"><label>Nom</label>
                  <input value={form.nom} onChange={e=>setForm({...form,nom:e.target.value})} required/>
                </div>
              </div>
              <div className="pm-field"><label>Email</label>
                <input value={user?.email||""} disabled className="pm-disabled"/>
              </div>
              <div className="pm-field"><label>Téléphone</label>
                <input value={form.telephone} onChange={e=>setForm({...form,telephone:e.target.value})} placeholder="+216 XX XXX XXX"/>
              </div>
              {success && <div className="pm-success">✓ {success}</div>}
              {error   && <div className="pm-error">✗ {error}</div>}
              <button type="submit" className="pm-btn-save" disabled={loading}>
                {loading?<span className="pm-spin"/>:"Enregistrer"}
              </button>
              <button type="button" className="pm-btn-logout" onClick={onLogout}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Se déconnecter
              </button>
            </form>
          )}

          {tab === "reservations" && (
            <div className="pm-reservations">
              {reservations.length === 0 ? (
                <div className="pm-empty">
                  <span>🗓️</span>
                  <p>Aucune réservation pour le moment</p>
                </div>
              ) : reservations.map(r=>(
                <div key={r.id} className="pm-resa">
                  <div className="pm-resa-top">
                    <span className="pm-resa-id">#{r.id}</span>
                    <span className="pm-resa-statut">{STATUT[r.statut]||r.statut}</span>
                  </div>
                  <div className="pm-resa-dates">{fmt(r.date_debut)} → {fmt(r.date_fin)}</div>
                  <div className="pm-resa-prix">{parseFloat(r.total_ttc||0).toFixed(2)} DT</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}