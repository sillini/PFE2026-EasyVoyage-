import { useState, useEffect, useRef } from "react";
import "./VoyageImageManager.css";

const CLOUDINARY_CLOUD  = "dzfznxn0q";
const CLOUDINARY_PRESET = "Image_Hotel"; // même preset

async function uploadCloudinary(file) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", CLOUDINARY_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
    method: "POST", body: fd,
  });
  if (!res.ok) throw new Error("Échec upload Cloudinary");
  const data = await res.json();
  return data.secure_url;
}

const BASE = "http://localhost:8000/api/v1";
function authHeaders() {
  return { "Content-Type":"application/json", Authorization:`Bearer ${localStorage.getItem("access_token")}` };
}
async function apiJson(url, options = {}) {
  const res = await fetch(url, { headers: authHeaders(), ...options });
  if (res.status === 204) return null;
  const t = await res.text();
  const d = t ? JSON.parse(t) : {};
  if (!res.ok) throw new Error(d.detail || `Erreur ${res.status}`);
  return d;
}

const TYPE_OPTIONS = ["PRINCIPALE","GALERIE","MINIATURE","BANNIERE"];

export default function VoyageImageManager({ voyage, onClose }) {
  const [images, setImages]         = useState([]);
  const [uploading, setUploading]   = useState(false);
  const [progress, setProgress]     = useState([]);
  const [error, setError]           = useState("");
  const fileRef = useRef();

  useEffect(() => { loadImages(); }, []);

  const loadImages = async () => {
    try {
      const data = await apiJson(`${BASE}/voyages/${voyage.id}/images`);
      const list = Array.isArray(data) ? data : data?.items || [];
      setImages([...list.filter(i=>i.type==="PRINCIPALE"), ...list.filter(i=>i.type!=="PRINCIPALE")]);
      setError("");
    } catch { setImages([]); }
  };

  const handleFiles = async (files) => {
    setError(""); setUploading(true);
    const prog = files.map(f => ({ name: f.name, status: "uploading" }));
    setProgress(prog);

    for (let i = 0; i < files.length; i++) {
      try {
        const url  = await uploadCloudinary(files[i]);
        const type = images.length === 0 && i === 0 ? "PRINCIPALE" : "GALERIE";
        await apiJson(`${BASE}/voyages/${voyage.id}/images`, {
          method: "POST", body: JSON.stringify({ url, type }),
        });
        setProgress(p => p.map((x,j) => j===i ? {...x, status:"done"} : x));
      } catch {
        setProgress(p => p.map((x,j) => j===i ? {...x, status:"error"} : x));
      }
    }

    setUploading(false); setProgress([]);
    loadImages();
  };

  const handleSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length) handleFiles(files);
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    if (files.length) handleFiles(files);
  };

  const handleType = async (imgId, type) => {
    try {
      await apiJson(`${BASE}/voyages/${voyage.id}/images/${imgId}`, {
        method: "PATCH", body: JSON.stringify({ type }),
      });
      loadImages();
    } catch (err) { setError(err.message); }
  };

  const handleDelete = async (imgId) => {
    if (!confirm("Supprimer cette image ?")) return;
    try {
      await apiJson(`${BASE}/voyages/${voyage.id}/images/${imgId}`, { method: "DELETE" });
      setImages(p => p.filter(i => i.id !== imgId));
    } catch (err) { setError(err.message); }
  };

  return (
    <div className="vim-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="vim-box">
        <div className="vim-top-bar" />

        <div className="vim-header">
          <div className="vim-header-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>
          <div>
            <h2>Photos du voyage</h2>
            <p>{voyage.titre} — {images.length} photo{images.length !== 1 ? "s" : ""}</p>
          </div>
          <button className="vim-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="vim-body">
          {/* Zone de drop */}
          <div
            className={`vim-drop ${uploading ? "loading" : ""}`}
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => !uploading && fileRef.current.click()}
          >
            <input ref={fileRef} type="file" accept="image/*" multiple
              onChange={handleSelect} style={{ display:"none" }} />

            {uploading ? (
              <div className="vim-progress-list">
                {progress.map((p,i) => (
                  <div key={i} className={`vim-progress-item ${p.status}`}>
                    <span className="vim-prog-icon">
                      {p.status==="uploading" && <span className="vim-mini-spin"/>}
                      {p.status==="done"      && "✅"}
                      {p.status==="error"     && "❌"}
                    </span>
                    <span className="vim-prog-name">{p.name}</span>
                    <span className="vim-prog-status">
                      {p.status==="uploading" && "Upload en cours..."}
                      {p.status==="done"      && "Terminé"}
                      {p.status==="error"     && "Échec"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="vim-drop-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
                <p className="vim-drop-title">Glissez vos photos ici</p>
                <p className="vim-drop-sub">ou <span>cliquez pour sélectionner</span> — JPG, PNG, WebP</p>
                <p className="vim-drop-hint">La 1ère photo devient automatiquement la principale</p>
              </>
            )}
          </div>

          {error && (
            <div className="vim-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {/* Grille photos */}
          {images.length > 0 ? (
            <div className="vim-grid">
              {images.map(img => (
                <div key={img.id} className="vim-img-card">
                  <div className="vim-img-preview">
                    <img src={img.url} alt="" loading="lazy" />
                    <div className="vim-img-overlay">
                      <button className="vim-img-del" onClick={() => handleDelete(img.id)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/>
                        </svg>
                      </button>
                    </div>
                    {img.type === "PRINCIPALE" && (
                      <div className="vim-img-principal">⭐ Principale</div>
                    )}
                  </div>
                  <div className="vim-img-footer">
                    <select value={img.type}
                      onChange={e => handleType(img.id, e.target.value)}
                      className="vim-type-select">
                      {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="vim-empty">
              <span>📷</span>
              <p>Aucune photo pour ce voyage</p>
              <p>Ajoutez des photos pour attirer les voyageurs</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}