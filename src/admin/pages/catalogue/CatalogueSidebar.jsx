// src/admin/pages/catalogue/CatalogueSidebar.jsx
import "./CatalogueSidebar.css";
import { ago } from "./utils";
import { StatutBadge, Spinner } from "./CatalogueUI";

export default function CatalogueSidebar({ catalogues, loading, activeId, onSelect, onNew, onDelete }) {
  return (
    <aside className="cat-sidebar">

      {/* ── En-tête ──────────────────────────────────── */}
      <div className="cat-sidebar__header">
        <div className="cat-sidebar__header-row">
          <div>
            <h2 className="cat-sidebar__title">Catalogues Email</h2>
            <p className="cat-sidebar__count">
              {catalogues.length} catalogue{catalogues.length > 1 ? "s" : ""}
            </p>
          </div>
          <button className="cat-sidebar__btn-new" onClick={onNew}>
            <span className="cat-sidebar__btn-new__icon">+</span>
            Nouveau
          </button>
        </div>
      </div>

      {/* ── Liste ─────────────────────────────────────── */}
      <div className="cat-sidebar__list">

        {loading && (
          <div className="cat-loading-center">
            <Spinner size="md" />
            Chargement...
          </div>
        )}

        {!loading && catalogues.length === 0 && (
          <div className="cat-sidebar__empty">
            <p className="cat-sidebar__empty-icon">📭</p>
            <p className="cat-sidebar__empty-title">Aucun catalogue</p>
            <p className="cat-sidebar__empty-sub">Créez votre premier catalogue</p>
          </div>
        )}

        {catalogues.map(cat => {
          const isActive = cat.id === activeId;
          return (
            <div
              key={cat.id}
              className={`cat-card${isActive ? " cat-card--active" : ""}`}
              onClick={() => onSelect(cat)}
            >
              <div className="cat-card__top">
                <div className="cat-card__meta">
                  <p className="cat-card__titre">{cat.titre}</p>
                  <StatutBadge statut={cat.statut} />
                </div>
                <button
                  className="cat-card__delete"
                  onClick={e => { e.stopPropagation(); onDelete(cat.id); }}
                  title="Supprimer"
                >✕</button>
              </div>

              <div className="cat-card__footer">
                {cat.nb_envoyes > 0 && (
                  <span className="cat-card__footer-envoyes">✓ {cat.nb_envoyes} envoyés</span>
                )}
                {cat.nb_echecs > 0 && (
                  <span className="cat-card__footer-echecs">✗ {cat.nb_echecs} échecs</span>
                )}
                <span className="cat-card__footer-date">{ago(cat.created_at)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}