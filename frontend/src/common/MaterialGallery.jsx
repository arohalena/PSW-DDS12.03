import React, { useState, useEffect } from 'react';
import { X, Download, FileText, Image, Video, Eye } from 'lucide-react';
import { getMaterialesByProyecto, descargarMaterial } from '../services/fileService';
import '../styles/material-gallery.css';

export function MaterialGallery({ proyectoId }) {
  const [materiales, setMateriales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [error, setError] = useState(null);
  const [lastInfo, setLastInfo] = useState(null);

  useEffect(() => {
    const cargarMateriales = async () => {
      try {
        console.debug('[MaterialGallery] solicitando materiales para proyectoId=', proyectoId);
        const data = await getMaterialesByProyecto(proyectoId);
        console.debug('[MaterialGallery] respuesta materiales:', data);
        setMateriales(Array.isArray(data) ? data : []);
        setLastInfo({ count: Array.isArray(data) ? data.length : 0 });
        setError(null);
      } catch (err) {
        console.error('Error cargando materiales:', err);
        setMateriales([]);
        setError(err?.message || String(err));
        setLastInfo(null);
      } finally {
        setLoading(false);
      }
    };

    if (proyectoId) cargarMateriales();
  }, [proyectoId]);

  const getIcono = (tipoMime) => {
    if (!tipoMime) return <FileText size={24} />;
    if (tipoMime.startsWith('image/')) return <Image size={24} />;
    if (tipoMime.startsWith('video/')) return <Video size={24} />;
    return <FileText size={24} />;
  };

  const getTipo = (tipoMime) => {
    if (!tipoMime) return 'archivo';
    if (tipoMime.startsWith('image/')) return 'imagen';
    if (tipoMime.startsWith('video/')) return 'video';
    if (tipoMime === 'application/pdf') return 'pdf';
    return 'archivo';
  };

  const obtenerPreview = (material) => {
    const url = descargarMaterial(material.id);
    const tipo = getTipo(material.tipoMime);

    if (tipo === 'imagen') {
      return (
        <div className="media-preview-container">
          <img src={url} alt={material.nombre} />
        </div>
      );
    }

    if (tipo === 'video') {
      return (
        <div className="media-preview-container">
          <video controls style={{ maxWidth: '100%', maxHeight: '500px' }}>
            <source src={url} type={material.tipoMime} />
            Tu navegador no soporta video.
          </video>
        </div>
      );
    }

    if (tipo === 'pdf') {
      return (
        <div className="media-preview-container">
          <iframe 
            src={url} 
            style={{ width: '100%', height: '500px', border: 'none' }}
            title={material.nombre}
          />
        </div>
      );
    }

    return (
      <div className="media-preview-container">
        <p className="media-no-preview">No hay vista previa disponible para este archivo</p>
        <a href={url} download={material.nombre} className="btn-download">
          <Download size={18} /> Descargar
        </a>
      </div>
    );
  };

  const obtenerMiniatura = (material) => {
    const url = descargarMaterial(material.id);
    const tipo = getTipo(material.tipoMime);

    if (tipo === 'imagen') {
      return (
        <div className="material-thumb">
          <img src={url} alt={material.nombre} loading="lazy" />
        </div>
      );
    }

    return (
      <div className="material-icon">
        {getIcono(material.tipoMime)}
      </div>
    );
  };

  if (loading) {
    return <div className="material-gallery">Cargando materiales...</div>;
  }

  if (error) {
    return (
      <div className="material-gallery-error">
        <div>Error cargando materiales: {error}</div>
        <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>proyectoId: {String(proyectoId)}</div>
      </div>
    );
  }

  if (materiales.length === 0) {
    return (
      <div className="material-gallery-empty">
        <div>No hay materiales para este proyecto aún.</div>
        <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
          proyectoId: {String(proyectoId)}{lastInfo ? ` — count: ${lastInfo.count}` : ''}
        </div>
      </div>
    );
  }

  return (
    <div className="material-gallery">
      <div className="material-grid">
        {materiales.map((material) => {
          const tipo = getTipo(material.tipoMime);
          
          return (
            <div 
              key={material.id} 
              className={`material-card material-${tipo}`}
              onClick={() => setSelectedMedia(material)}
            >
              {obtenerMiniatura(material)}
              <div className="material-info">
                <strong>{material.nombre}</strong>
                <span className="material-type">{tipo}</span>
              </div>
              <button type="button" className="material-view-btn">
                <Eye size={18} />
              </button>
            </div>
          );
        })}
      </div>

      {selectedMedia && (
        <div className="material-modal-overlay" onClick={() => setSelectedMedia(null)}>
          <div className="material-modal" onClick={(e) => e.stopPropagation()}>
            <div className="material-modal-header">
              <h3>{selectedMedia.nombre}</h3>
              <div className="material-modal-actions">
                <a
                  href={descargarMaterial(selectedMedia.id)}
                  download={selectedMedia.nombre}
                  className="btn-download-modal"
                  title="Descargar"
                >
                  <Download size={18} />
                </a>
                <button
                  className="btn-close-modal"
                  onClick={() => setSelectedMedia(null)}
                  title="Cerrar"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="material-modal-content">
              {obtenerPreview(selectedMedia)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
