import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ProjectsScreen.css';

const API_URL = "http://localhost:8080/api/"; 

const ProjectsScreen = () => {
  const { eventoId } = useParams(); // Captura el ID de la URL
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Llamada al servidor filtrando por el evento específico
    const fetchProyectos = async () => {
      try {
        const response = await fetch(API_URL + `${eventoId}/proyectos`);
        const data = await response.json();
        setProjects(data);
      } catch (error) {
        console.error("Error cargando proyectos del evento:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProyectos();
  }, [eventoId]); // Se vuelve a ejecutar si el ID cambia

  if (loading) return <div className="loading">Cargando proyectos del evento...</div>;

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-header">
        <div className="header-text">
          <h1>Proyectos - Evento #{eventoId}</h1>
          <p>Mostrando {projects.length} proyectos registrados en este evento</p>
        </div>
        {/* Al ir a crear, pasamos el ID del evento para que sepa dónde guardarlo */}
        <button 
          className="btn-primary" 
          onClick={() => navigate(`/${eventoId}/nuevo-proyecto`)}
        >
          Crear Proyecto
        </button>
      </div>

      <div className="table-card">
        <div className="table-controls">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input type="text" placeholder="Buscar proyectos por nombre, equipo o categoría..." />
          </div>
          <button className="btn-secondary">
            <Filter size={18} /> Filtros
          </button>
        </div>

        <table className="projects-table">
          <thead>
            <tr>
              <th><input type="checkbox" /></th>
              <th>Proyecto</th>
              <th>Equipo</th>
              <th>Miembros</th>
              <th>Categoría</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {projects.map((proj) => (
              <tr key={proj.id}>
                <td><input type="checkbox" /></td>
                <td className="font-bold">{proj.nombre}</td>
                <td>{proj.equipo}</td>
                <td>
                  <div className="avatar-group">
                    {proj.miembros?.map((m, i) => (
                      <div key={i} className="avatar-circle">{m[0]}</div>
                    ))}
                  </div>
                </td>
                <td><span className="cat-tag">{proj.categoria}</span></td>
                <td>
                  <span className={`status-badge ${proj.estado.toLowerCase().replace(" ", "-")}`}>
                    {proj.estado}
                  </span>
                </td>
                <td className="text-muted">{proj.fecha}</td>
                <td><MoreVertical size={18} className="cursor-pointer" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProjectsScreen;