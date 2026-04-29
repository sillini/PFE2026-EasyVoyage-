/**
 * src/admin/pages/AdminAdministrateurs.jsx
 * ════════════════════════════════════════════════════════════
 * Page de gestion des administrateurs (Super Admin uniquement).
 *
 *   - Liste des admins avec filtres (recherche, actif/inactif)
 *   - Bouton "Nouvel admin" → ouvre le wizard 3 étapes
 *   - Actions par admin : modifier, activer/désactiver, supprimer
 *   - Badge "Super Admin" + verrou sur les actions destructrices
 *
 * SÉCURITÉ :
 *   Cette page n'est accessible que si user.is_super_admin === true.
 *   Le filtre se fait côté App.jsx (vérif depuis user)
 *   ET côté backend (require_super_admin sur tous les endpoints).
 * ════════════════════════════════════════════════════════════
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { adminsApi } from "../services/api";
import AdminInvitationWizard from "../components/admins/AdminInvitationWizard";
import "./AdminAdministrateurs.css";

// ══════════════════════════════════════════════════════════
//  Helpers
// ══════════════════════════════════════════════════════════
function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function fmtRelative(d) {
  if (!d) return "Jamais";
  const diff = Date.now() - new Date(d);
  if (diff < 60000)    return "À l'instant";
  if (diff < 3600000)  return `il y a ${Math.floor(diff/60000)} min`;
  if (diff < 86400000) return `il y a ${Math.floor(diff/3600000)} h`;
  if (diff < 604800000) return `il y a ${Math.floor(diff/86400000)} j`;
  return fmtDate(d);
}

function Avatar({ prenom, nom, isSuper }) {
  const init = `${(prenom || "?")[0]}${(nom || "")[0] || ""}`.toUpperCase();
  return (
    <div className={`adma-avatar ${isSuper ? "super" : ""}`}>
      {init}
      {isSuper && (
        <span className="adma-avatar-crown" title="Super Admin">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z"/>
          </svg>
        </span>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  MODAL — Édition admin
// ══════════════════════════════════════════════════════════
function EditAdminModal({ admin, onClose, onSaved }) {
  const [form, setForm] = useState({
    nom:       admin.nom    || "",
    prenom:    admin.prenom || "",
    telephone: admin.telephone || "",
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await adminsApi.update(admin.id, form);
      onSaved?.();
      onClose();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="adma-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="adma-modal">
        <div className="adma-modal-topbar"/>
        <div className="adma-modal-header">
          <Avatar prenom={admin.prenom} nom={admin.nom} isSuper={admin.is_super_admin}/>
          <div className="adma-modal-identity">
            <h3>Modifier {admin.prenom} {admin.nom}</h3>
            <p>{admin.email}</p>
          </div>
          <button className="adma-modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <form className="adma-modal-body" onSubmit={handleSave}>
          <div className="adma-form-grid">
            <div className="adma-field">
              <label>Prénom</label>
              <input type="text" value={form.prenom}
                onChange={e => setForm({...form, prenom: e.target.value})}/>
            </div>
            <div className="adma-field">
              <label>Nom</label>
              <input type="text" value={form.nom}
                onChange={e => setForm({...form, nom: e.target.value})}/>
            </div>
            <div className="adma-field adma-field-full">
              <label>Téléphone</label>
              <input type="tel" value={form.telephone}
                onChange={e => setForm({...form, telephone: e.target.value})}
                placeholder="+216 XX XXX XXX"/>
            </div>
            <div className="adma-field adma-field-full">
              <label>Email</label>
              <input type="email" value={admin.email} disabled
                style={{ background: "#F5F7FA", color: "#8A9BB0" }}/>
              <small style={{ color: "#8A9BB0", fontSize: "0.75rem", marginTop: 4 }}>
                L'email ne peut pas être modifié depuis cette page.
              </small>
            </div>
          </div>

          {error && <div className="adma-error">⚠ {error}</div>}

          <div className="adma-modal-actions">
            <button type="button" className="adma-btn-cancel" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="adma-btn-primary" disabled={loading}>
              {loading ? <span className="adma-spin"/> : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  MODAL — Confirmation suppression
// ══════════════════════════════════════════════════════════
function DeleteConfirmModal({ admin, onClose, onConfirmed }) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleDelete = async () => {
    setLoading(true); setError("");
    try {
      await adminsApi.delete(admin.id);
      onConfirmed?.();
      onClose();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="adma-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="adma-modal adma-modal-sm">
        <div className="adma-modal-topbar adma-modal-topbar-danger"/>
        <div className="adma-confirm-body">
          <div className="adma-confirm-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <h3>Supprimer cet administrateur ?</h3>
          <p>
            Vous êtes sur le point de supprimer définitivement le compte
            de <strong>{admin.prenom} {admin.nom}</strong> ({admin.email}).
            <br/><br/>
            Cette action est <strong>irréversible</strong>.
          </p>
          {error && <div className="adma-error">⚠ {error}</div>}
          <div className="adma-modal-actions">
            <button className="adma-btn-cancel" onClick={onClose}>Annuler</button>
            <button className="adma-btn-danger" onClick={handleDelete} disabled={loading}>
              {loading ? <span className="adma-spin"/> : "Supprimer définitivement"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  PAGE PRINCIPALE
// ══════════════════════════════════════════════════════════
export default function AdminAdministrateurs({ currentUser }) {
  const [admins,    setAdmins]   = useState([]);
  const [loading,   setLoading]  = useState(true);
  const [error,     setError]    = useState("");
  const [search,    setSearch]   = useState("");
  const [filterTab, setFilterTab] = useState("all"); // all | active | inactive
  const [showWizard, setShowWizard] = useState(false);
  const [editAdmin,  setEditAdmin]  = useState(null);
  const [deleteAdmin, setDeleteAdmin] = useState(null);

  // ── Chargement ──────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const data = await adminsApi.list({ per_page: 100 });
      setAdmins(data?.items || []);
    } catch (err) {
      setError(err.message || "Impossible de charger la liste");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Filtrage ────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = admins;
    if (filterTab === "active")   list = list.filter(a => a.actif);
    if (filterTab === "inactive") list = list.filter(a => !a.actif);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        (a.nom    || "").toLowerCase().includes(q) ||
        (a.prenom || "").toLowerCase().includes(q) ||
        (a.email  || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [admins, filterTab, search]);

  // ── Stats ──────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:     admins.length,
    actifs:    admins.filter(a => a.actif).length,
    inactifs:  admins.filter(a => !a.actif).length,
    superAdmins: admins.filter(a => a.is_super_admin).length,
  }), [admins]);

  // ── Actions ────────────────────────────────────────────
  const handleToggle = async (admin) => {
    try {
      await adminsApi.toggle(admin.id, !admin.actif);
      load();
    } catch (err) { alert(err.message); }
  };

  // ══════════════════════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════════════════════
  return (
    <div className="adma-page">

      {/* ── Header ─────────────────────────────────────── */}
      <header className="adma-header">
        <div className="adma-header-left">
          <div className="adma-header-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div>
            <h1>Administrateurs</h1>
            <p>Gestion des comptes administrateurs de la plateforme</p>
          </div>
        </div>

        <button className="adma-btn-new" onClick={() => setShowWizard(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nouvel administrateur
        </button>
      </header>

      {/* ── KPI Strip ──────────────────────────────────── */}
      <div className="adma-stats">
        <div className="adma-stat">
          <div className="adma-stat-icon adma-stat-icon-blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div>
            <div className="adma-stat-val">{stats.total}</div>
            <div className="adma-stat-lbl">Total admins</div>
          </div>
        </div>

        <div className="adma-stat">
          <div className="adma-stat-icon adma-stat-icon-green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div>
            <div className="adma-stat-val">{stats.actifs}</div>
            <div className="adma-stat-lbl">Actifs</div>
          </div>
        </div>

        <div className="adma-stat">
          <div className="adma-stat-icon adma-stat-icon-red">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
            </svg>
          </div>
          <div>
            <div className="adma-stat-val">{stats.inactifs}</div>
            <div className="adma-stat-lbl">Inactifs</div>
          </div>
        </div>

        <div className="adma-stat">
          <div className="adma-stat-icon adma-stat-icon-amber">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z"/>
            </svg>
          </div>
          <div>
            <div className="adma-stat-val">{stats.superAdmins}</div>
            <div className="adma-stat-lbl">Super Admins</div>
          </div>
        </div>
      </div>

      {/* ── Toolbar ────────────────────────────────────── */}
      <div className="adma-toolbar">
        <div className="adma-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Rechercher par nom, prénom ou email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="adma-tabs">
          {[
            { id: "all",      label: "Tous",     count: stats.total },
            { id: "active",   label: "Actifs",   count: stats.actifs },
            { id: "inactive", label: "Inactifs", count: stats.inactifs },
          ].map(t => (
            <button
              key={t.id}
              className={`adma-tab ${filterTab === t.id ? "active" : ""}`}
              onClick={() => setFilterTab(t.id)}
            >
              {t.label} <span className="adma-tab-count">{t.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Liste ──────────────────────────────────────── */}
      <div className="adma-list">
        {error && <div className="adma-error">⚠ {error}</div>}

        {loading && admins.length === 0 && (
          <div className="adma-state">
            <span className="adma-spin"/>
            Chargement des administrateurs…
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="adma-empty">
            <div className="adma-empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
              </svg>
            </div>
            <h3>{admins.length === 0 ? "Aucun administrateur" : "Aucun résultat"}</h3>
            <p>
              {admins.length === 0
                ? "Cliquez sur \"Nouvel administrateur\" pour commencer"
                : "Essayez de modifier les filtres ou la recherche"}
            </p>
          </div>
        )}

        {filtered.map(a => {
          const isSelf = currentUser?.id === a.id;
          const isLocked = a.is_super_admin;  // Super Admin → actions verrouillées

          return (
            <article key={a.id} className={`adma-card ${!a.actif ? "inactive" : ""}`}>
              <div className="adma-card-left">
                <Avatar prenom={a.prenom} nom={a.nom} isSuper={a.is_super_admin}/>
                <div className="adma-card-identity">
                  <div className="adma-card-name-row">
                    <h3>{a.prenom} {a.nom}</h3>
                    {a.is_super_admin && (
                      <span className="adma-pill adma-pill-super">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="11" height="11">
                          <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z"/>
                        </svg>
                        Super Admin
                      </span>
                    )}
                    {isSelf && (
                      <span className="adma-pill adma-pill-self">Vous</span>
                    )}
                    <span className={`adma-pill ${a.actif ? "adma-pill-active" : "adma-pill-inactive"}`}>
                      <span className="adma-pill-dot"/>
                      {a.actif ? "Actif" : "Désactivé"}
                    </span>
                  </div>
                  <div className="adma-card-meta">
                    <span className="adma-meta-item">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                      {a.email}
                    </span>
                    {a.telephone && (
                      <span className="adma-meta-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                        </svg>
                        {a.telephone}
                      </span>
                    )}
                    <span className="adma-meta-item">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <rect x="3" y="4" width="18" height="18" rx="2"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      Inscrit le {fmtDate(a.date_inscription)}
                    </span>
                    <span className="adma-meta-item">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                      Dernière connexion : {fmtRelative(a.derniere_connexion)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="adma-card-actions">
                {/* Modifier */}
                <button
                  className="adma-action-btn"
                  onClick={() => setEditAdmin(a)}
                  disabled={isLocked && !isSelf}
                  title={isLocked && !isSelf ? "Action interdite sur Super Admin" : "Modifier"}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Modifier
                </button>

                {/* Toggle actif/inactif */}
                {!isLocked && !isSelf && (
                  <button
                    className={`adma-action-btn ${a.actif ? "warn" : "success"}`}
                    onClick={() => handleToggle(a)}
                    title={a.actif ? "Désactiver" : "Activer"}
                  >
                    {a.actif ? (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="6" y="4" width="4" height="16"/>
                          <rect x="14" y="4" width="4" height="16"/>
                        </svg>
                        Désactiver
                      </>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polygon points="5 3 19 12 5 21 5 3"/>
                        </svg>
                        Activer
                      </>
                    )}
                  </button>
                )}

                {/* Supprimer */}
                {!isLocked && !isSelf && (
                  <button
                    className="adma-action-btn danger"
                    onClick={() => setDeleteAdmin(a)}
                    title="Supprimer définitivement"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    </svg>
                    Supprimer
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* ── Modals ─────────────────────────────────────── */}
      {showWizard && (
        <AdminInvitationWizard
          onClose={() => setShowWizard(false)}
          onSuccess={() => load()}
        />
      )}
      {editAdmin && (
        <EditAdminModal
          admin={editAdmin}
          onClose={() => setEditAdmin(null)}
          onSaved={() => load()}
        />
      )}
      {deleteAdmin && (
        <DeleteConfirmModal
          admin={deleteAdmin}
          onClose={() => setDeleteAdmin(null)}
          onConfirmed={() => load()}
        />
      )}
    </div>
  );
}