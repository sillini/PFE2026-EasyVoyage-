// ══════════════════════════════════════════════════════════
//  src/admin/pages/marketing/ImageUploader.jsx
//  Upload Cloudinary + gestion URLs manuelles
// ══════════════════════════════════════════════════════════
import { useRef, useState } from "react";
import { uploadToCloudinary } from "./marketingUtils";

export default function ImageUploader({ urls, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState(null);
  const fileRef = useRef();

  const validUrls = urls.filter((u) => u.startsWith("https://"));

  /* ── Ajouter une ligne URL vide ── */
  const addRow = () => onChange([...urls, ""]);

  /* ── Modifier une URL ── */
  const setUrl = (i, val) => {
    const copy = [...urls];
    copy[i] = val;
    onChange(copy);
  };

  /* ── Supprimer une ligne ── */
  const removeRow = (i) => onChange(urls.filter((_, idx) => idx !== i));

  /* ── Upload fichier → Cloudinary → URL auto-remplie ── */
  const handleFiles = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploading(true);

    for (let i = 0; i < files.length; i++) {
      setUploadingIdx(i);
      try {
        const url = await uploadToCloudinary(files[i]);

        // Remplir le premier champ vide OU ajouter une nouvelle ligne
        onChange((prev) => {
          const emptyIdx = prev.findIndex((u) => !u);
          if (emptyIdx !== -1) {
            const copy = [...prev];
            copy[emptyIdx] = url;
            return copy;
          }
          return [...prev, url];
        });
      } catch (err) {
        console.error("Upload échoué :", err.message);
        alert(`Erreur upload : ${err.message}`);
      }
    }

    setUploading(false);
    setUploadingIdx(null);
    e.target.value = "";
  };

  return (
    <div className="mkt-field">
      <label className="mkt-label">Images Cloudinary</label>

      {/* Lignes URLs */}
      {urls.map((url, i) => (
        <div key={i} className="mkt-url-row">
          {/* Miniature si URL valide */}
          {url.startsWith("https://") ? (
            <div className="mkt-url-thumb">
              <img src={url} alt={`img-${i + 1}`} />
            </div>
          ) : (
            <div className="mkt-url-thumb mkt-url-thumb--empty">
              <span>{i + 1}</span>
            </div>
          )}

          <input
            className="mkt-input"
            type="url"
            placeholder="https://res.cloudinary.com/dzfznxn0q/..."
            value={url}
            onChange={(e) => setUrl(i, e.target.value)}
          />

          {urls.length > 1 && (
            <button className="mkt-url-del" onClick={() => removeRow(i)} title="Supprimer">
              ✕
            </button>
          )}
        </div>
      ))}

      {/* Actions */}
      <div className="mkt-url-actions">
        <button className="mkt-btn mkt-btn--ghost-sm" onClick={addRow} type="button">
          + Ajouter une URL
        </button>

        <label className={`mkt-btn mkt-btn--upload ${uploading ? "uploading" : ""}`}>
          {uploading ? (
            <><span className="mkt-spin" /> Upload en cours...</>
          ) : (
            <><UploadIcon /> Uploader des images</>
          )}
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleFiles}
            disabled={uploading}
          />
        </label>
      </div>

      {/* Aperçus */}
      {validUrls.length > 0 && (
        <div className="mkt-previews">
          {validUrls.map((u, i) => (
            <div key={i} className="mkt-preview-item">
              <img src={u} alt={`preview-${i + 1}`} />
              <span className="mkt-preview-n">{i + 1}</span>
            </div>
          ))}
          <div className="mkt-previews-info">
            {validUrls.length} image{validUrls.length > 1 ? "s" : ""} sélectionnée{validUrls.length > 1 ? "s" : ""}
            {validUrls.length > 1 && " — sera publiée en album"}
          </div>
        </div>
      )}
    </div>
  );
}

function UploadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  );
}