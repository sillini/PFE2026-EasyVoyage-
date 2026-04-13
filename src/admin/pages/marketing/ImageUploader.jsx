// src/admin/pages/marketing/ImageUploader.jsx
import { useRef, useState } from "react";
import { uploadToCloudinary } from "./marketingUtils";
import "./ImageUploader.css";  // ← CSS isolé, rien dans AdminMarketing.css

export default function ImageUploader({ urls, onChange }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const validUrls = urls.filter((u) => u && u.startsWith("https://"));

  const addRow    = () => onChange([...urls, ""]);
  const setUrl    = (i, val) => { const c = [...urls]; c[i] = val; onChange(c); };
  const removeRow = (i) => onChange(urls.filter((_, idx) => idx !== i));

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      try {
        const url = await uploadToCloudinary(file);
        onChange((prev) => {
          const emptyIdx = prev.findIndex((u) => !u);
          if (emptyIdx !== -1) {
            const c = [...prev]; c[emptyIdx] = url; return c;
          }
          return [...prev, url];
        });
      } catch (err) {
        alert(`Erreur upload : ${err.message}`);
      }
    }
    setUploading(false);
    e.target.value = "";
  };

  return (
    <div className="mkt-field">
      <label className="mkt-label">Images Cloudinary</label>

      {/* ── Lignes URL — pastille numéro seulement (pas de thumbnail) ── */}
      {urls.map((url, i) => (
        <div key={i} className="imu-row">
          <div className="imu-num">{i + 1}</div>
          <input
            className="imu-input"
            type="url"
            placeholder="https://res.cloudinary.com/..."
            value={url}
            onChange={(e) => setUrl(i, e.target.value)}
          />
          {urls.length > 1 && (
            <button type="button" className="imu-del" onClick={() => removeRow(i)} title="Supprimer">
              ✕
            </button>
          )}
        </div>
      ))}

      {/* ── Actions ── */}
      <div className="imu-actions">
        <button type="button" className="imu-btn-add" onClick={addRow}>
          + Ajouter une URL
        </button>
        <label className={`imu-btn-upload ${uploading ? "uploading" : ""}`}>
          {uploading
            ? <><span className="mkt-spin" /> Upload en cours...</>
            : <><UploadIcon /> Uploader des images</>}
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

      {/* ── Previews : UNE seule fois, rangée horizontale ── */}
      {validUrls.length > 0 && (
        <div className="imu-previews-wrap">
          <span className="imu-count">
            ✅ {validUrls.length} image{validUrls.length > 1 ? "s" : ""} sélectionnée{validUrls.length > 1 ? "s" : ""}
          </span>
          <div className="imu-thumbs">
            {validUrls.map((u, i) => (
              <div key={i} className="imu-thumb">
                <img src={u} alt={`img-${i + 1}`} />
                <span className="imu-thumb-n">{i + 1}</span>
              </div>
            ))}
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