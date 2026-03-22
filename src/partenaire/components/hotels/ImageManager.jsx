import { useState, useEffect, useRef } from "react";
import { uploadImageCloudinary, imagesApi } from "../../services/api";
import "./ImageManager.css";

const TYPE_LABELS = {
  PRINCIPALE: { label: "Principale", color: "#C4973A" },
  GALERIE:    { label: "Galerie",    color: "#2B5F8E" },
  MINIATURE:  { label: "Miniature", color: "#4A85B8" },
  BANNIERE:   { label: "Bannière",  color: "#1A3F63" },
};

export default function ImageManager({ hotel, onClose }) {
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState([]);
  const [error, setError] = useState("");
  const fileRef = useRef();

  useEffect(() => { loadImages(); }, []);

  const loadImages = async () => {
    try {
      const data = await imagesApi.list(hotel.id);
      // Gérer tous les formats possibles de réponse
      if (Array.isArray(data)) {
        setImages(data);
      } else if (data?.items) {
        setImages(data.items);
      } else {
        setImages([]);
      }
      setError("");
    } catch (err) {
      console.error("Erreur chargement images:", err);
      setImages([]);
      setError(`Erreur: ${err.message}`);
    }
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setError("");
    setUploading(true);

    const progress = files.map((f) => ({ name: f.name, status: "uploading" }));
    setUploadProgress(progress);

    for (let i = 0; i < files.length; i++) {
      try {
        // 1. Upload vers Cloudinary
        const url = await uploadImageCloudinary(files[i]);

        // 2. Envoyer l'URL au backend
        const type = images.length === 0 && i === 0 ? "PRINCIPALE" : "GALERIE";
        await imagesApi.add(hotel.id, url, type);

        setUploadProgress((prev) =>
          prev.map((p, idx) => idx === i ? { ...p, status: "done" } : p)
        );
      } catch (err) {
        setUploadProgress((prev) =>
          prev.map((p, idx) => idx === i ? { ...p, status: "error" } : p)
        );
      }
    }

    setUploading(false);
    setUploadProgress([]);
    await loadImages();
    e.target.value = "";
  };

  const handleChangeType = async (imageId, newType) => {
    try {
      await imagesApi.updateType(hotel.id, imageId, newType);
      await loadImages();
    } catch (err) {
      setError("Erreur lors du changement de type");
    }
  };

  const handleDelete = async (imageId) => {
    if (!confirm("Supprimer cette image ?")) return;
    try {
      await imagesApi.delete(hotel.id, imageId);
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch (err) {
      setError("Erreur lors de la suppression");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    if (files.length) {
      const dt = new DataTransfer();
      files.forEach((f) => dt.items.add(f));
      fileRef.current.files = dt.files;
      handleFileSelect({ target: fileRef.current });
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="imgmgr-box">
        {/* Header */}
        <div className="imgmgr-header">
          <div className="imgmgr-header-left">
            <div className="modal-icon">🖼️</div>
            <div>
              <h2 className="modal-title">Photos de l'hôtel</h2>
              <p className="modal-subtitle">{hotel.nom} — {images.length} photo{images.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="imgmgr-body">
          {/* Zone de drop */}
          <div
            className={`drop-zone ${uploading ? "uploading" : ""}`}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => !uploading && fileRef.current.click()}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />
            {uploading ? (
              <div className="upload-progress-list">
                {uploadProgress.map((p, i) => (
                  <div key={i} className={`progress-item ${p.status}`}>
                    <span className="progress-icon">
                      {p.status === "uploading" && <span className="mini-spinner" />}
                      {p.status === "done" && "✅"}
                      {p.status === "error" && "❌"}
                    </span>
                    <span className="progress-name">{p.name}</span>
                    <span className="progress-status">
                      {p.status === "uploading" && "Upload en cours..."}
                      {p.status === "done" && "Terminé"}
                      {p.status === "error" && "Échec"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="drop-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
                <p className="drop-title">Glissez vos photos ici</p>
                <p className="drop-sub">ou <span>cliquez pour sélectionner</span> — JPG, PNG, WebP</p>
                <p className="drop-info">La 1ère photo sera définie comme image principale</p>
              </>
            )}
          </div>

          {error && (
            <div className="modal-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {/* Grille images */}
          {images.length > 0 ? (
            <div className="images-grid">
              {images.map((img) => (
                <div key={img.id} className="img-card">
                  <div className="img-preview">
                    <img src={img.url} alt="hotel" loading="lazy" />
                    <div className="img-overlay">
                      <button
                        className="img-delete-btn"
                        onClick={() => handleDelete(img.id)}
                        title="Supprimer"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14H6L5 6"/>
                          <path d="M10 11v6M14 11v6"/>
                          <path d="M9 6V4h6v2"/>
                        </svg>
                      </button>
                    </div>
                    {img.type === "PRINCIPALE" && (
                      <div className="img-principal-badge">⭐ Principale</div>
                    )}
                  </div>
                  <div className="img-footer">
                    <select
                      value={img.type}
                      onChange={(e) => handleChangeType(img.id, e.target.value)}
                      className="img-type-select"
                      style={{ borderColor: TYPE_LABELS[img.type]?.color }}
                    >
                      {Object.entries(TYPE_LABELS).map(([val, { label }]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-images">
              <span>📷</span>
              <p>Aucune photo pour cet hôtel</p>
              <p>Ajoutez des photos pour attirer plus de clients</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}