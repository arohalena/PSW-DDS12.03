import React, { useState, useRef } from 'react';
import { Upload, Image, FileText, Video, CheckCircle2, X } from 'lucide-react';
import { uploadFiles } from '../services/fileService';

import '../styles/material.css';

export function ProjectMaterials ({ proyectoId }) {
  const [files, setFiles] = useState([]);
  const [newFiles, setNewFiles] = useState([]); 
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const saveFiles = async () => { 
    if (newFiles.length === 0) return;
    
    console.log("Guardando los siguientes archivos: ", newFiles);

    try {
      const actualFiles = newFiles.map(f => f.file);

      const uploadedItems = await uploadFiles(actualFiles, proyectoId);

      const updatedFiles = uploadedItems.map((item, index) => ({
        id: item.id ?? Date.now() + index,
        name: item.nombre,
        rutaFichero: item.rutaFichero,
        size: formatSize(newFiles[index]?.file?.size ?? 0),
        type: newFiles[index]?.type ?? 'pdf',
        status: 'Subido',
      }));

      setFiles((prev) => [...prev, ...updatedFiles]);
      setNewFiles([]);

    } catch (err) {
      alert("Hubo un problema al subir los archivos: " + err.message);
    }
  };

  // Formatear tamaño de archivo
  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Manejar la adición de archivos
  const handleFiles = (filesFromEvent) => {
    const fileArray = Array.from(filesFromEvent);
    const uploadedFiles = fileArray.map((file, index) => ({
      id: Date.now() + index,
      file: file,
      name: file.name,
      size: formatSize(file.size),
      type: file.type.split('/')[0] === 'image' ? 'image' : 
            file.type.split('/')[0] === 'video' ? 'video' : 'pdf',
      status: 'Pendiente'
    }));
    setNewFiles((prev) => [...uploadedFiles, ...prev]);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (id) => {
    setNewFiles(newFiles.filter(f => f.id !== id));
  };

  return (
    <div className="container">
      <header className="header">
        <div className="title-section">
          <h2>Material del Proyecto</h2>
          <p>Imágenes, documentos, videos y enlaces demo</p>
        </div>
        {/* Input oculto para activar con el botón */}
        <input 
          type="file" 
          multiple 
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={(e) => handleFiles(e.target.files)}
        />
        <button className="btn-upload" onClick={() => saveFiles()}>
          <Upload size={18} /> Guardar Material
        </button>
      </header>

      <div 
        className={`dropzone ${isDragging ? 'dragging' : ''}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current.click()}
      >
        <Upload size={48} className="upload-icon" />
        <p>
          <span className="purple-text">Haz click para subir</span> o arrastra archivos aquí
        </p>
        <span className="file-hint">PNG, JPG, PDF, DOC hasta 50MB</span>
      </div>

      <div className="file-grid">
        {files.map((file) => (
          <div key={file.id} className="file-card">
            <div className={`icon-wrapper ${file.type}`}>
              {file.type === 'image' ? <Image size={20} /> : 
               file.type === 'video' ? <Video size={20} /> : <FileText size={20} />}
            </div>
            <div className="file-info">
              <span className="file-name">{file.name}</span>
              <span className="file-meta">{file.rutaFichero}</span>
              <div className="meta-row">
                <span className="file-meta">{file.size}</span>
                <span className="file-meta">•</span>
                <span className="file-meta">{file.status}</span>
              </div>
            </div>
            <div className="file-actions">
              <CheckCircle2 size={20} className="check-icon" />
            </div>
          </div>
        ))}
      </div>

      <div className="file-grid">
        {newFiles.map((file) => (
          <div key={file.id} className="file-card">
            <div className={`icon-wrapper ${file.type}`}>
              {file.type === 'image' ? <Image size={20} /> : 
               file.type === 'video' ? <Video size={20} /> : <FileText size={20} />}
            </div>
            <div className="file-info">
              <span className="file-name">{file.name}</span>
              <div className="meta-row">
                <span className="file-meta">{file.size}</span>
                <span className="file-meta">•</span>
                <span className="file-meta">{file.status}</span>
              </div>
            </div>
            <div className="file-actions">
              <X size={20} className="close-icon" onClick={(e) => {
                e.stopPropagation(); // Evita que el clic abra el explorador
                removeFile(file.id);
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
