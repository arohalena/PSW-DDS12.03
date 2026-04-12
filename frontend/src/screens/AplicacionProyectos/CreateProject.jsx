import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './CreateProject.css';

const API_URL = "http://localhost:8080/api/"; 

const CreateProject = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nombre: '', equipo: '', categoria: '', descripcion: '' });

  const handleSave = async (e) => {
    e.preventDefault();
    // Ejemplo de envío al servidor
    try {
      const res = await fetch(API_URL + `/${eventoId}/nuevo-proyecto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) navigate('/proyectos');
    } catch (err) { alert("Error al guardar"); }
  };

  return (
    <div className="form-container">
      <div className="form-card">
        <div className="form-header">
          <h2>Crear Nuevo Proyecto</h2>
          <X className="close-icon" onClick={() => navigate('/proyectos')} />
        </div>

        <form onSubmit={handleSave}>
          <div className="input-group">
            <label>Nombre del Proyecto *</label>
            <input type="text" placeholder="Ej: AI Health Monitor" required 
              onChange={e => setForm({...form, nombre: e.target.value})} />
          </div>

          <div className="input-group">
            <label>Nombre del Equipo *</label>
            <input type="text" placeholder="Ej: Tech Innovators" required
              onChange={e => setForm({...form, equipo: e.target.value})} />
          </div>

          <div className="input-group">
            <label>Categoría</label>
            <select onChange={e => setForm({...form, categoria: e.target.value})}>
              <option value="">Seleccionar categoría</option>
              <option value="Salud">Salud</option>
              <option value="Sostenibilidad">Sostenibilidad</option>
            </select>
          </div>

          <div className="input-group">
            <label>Descripción</label>
            <textarea placeholder="Describe el proyecto..."
              onChange={e => setForm({...form, descripcion: e.target.value})} />
          </div>

          <div className="upload-area">
            <Upload size={24} />
            <p>Haz clic para cargar o arrastra y suelta</p>
            <span>PDF, DOCX o Imágenes (Máx. 10MB)</span>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={() => navigate('/proyectos')}>Cancelar</button>
            <button type="submit" className="btn-primary">Crear Proyecto</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProject;