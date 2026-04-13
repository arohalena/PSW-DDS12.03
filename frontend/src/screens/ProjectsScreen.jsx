import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Plus, Search, Filter, MoreVertical } from "lucide-react";
import { getProyectosByEvento, createProyecto } from "../services/proyectoService";
import { Plus, Search, Filter, MoreVertical } from "lucide-react";
import { getProyectosByEvento, createProyecto } from "../services/proyectoService";
import { getEventos } from "../services/eventoService";
import { getUsuarios } from "../services/usuarioService";
import {createEquipo} from "../services/equipoService";
import {assignCompetidor} from "../services/competidorService";
import { esOrganizador } from "../services/sessionService";
import "../styles/projects.css"; 

const CATEGORIAS = ["IA", "SOSTENIBILIDAD"];

function ProjectsScreen() {
  const { eventoId } = useParams();
  const [eventos, setEventos] = useState([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState("");
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  const puedeGestionar = esOrganizador();
  const desdeEvento = Boolean(eventoId);
  const idEfectivo = eventoId || eventoSeleccionado;

  useEffect(() => {
    if (!eventoId) {
      getEventos().then(setEventos).catch(() => setEventos([]));
      getEventos().then(setEventos).catch(() => setEventos([]));
    }
  }, [eventoId]);

  useEffect(() => {
    if (!idEfectivo) {
      setProyectos([]);
      return;
    }
    const load = async () => {
      try {
        setLoading(true);
        const data = await getProyectosByEvento(idEfectivo);
        setProyectos(data);
      } catch (err) {
        setError("Error al cargar proyectos");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [idEfectivo]);

  const filtrados = useMemo(() => {
    return proyectos.filter((p) =>
      p.nombre?.toLowerCase().includes(search.toLowerCase()) ||
      p.tipoCategoria?.toLowerCase().includes(search.toLowerCase())
    );
  }, [proyectos, search]);

  return (
    <div className="projects-container">
      <header className="page-header">
        <div>
          <h1>Gestión de Proyectos</h1>
          <p>{desdeEvento ? "Proyectos del evento" : "Administra proyectos por evento"}</p>
        </div>
        {!desdeEvento && puedeGestionar && eventoSeleccionado && (
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={20} /> Crear Proyecto
          </button>
        )}
      </header>

      {!desdeEvento && (
        <div className="filters-section">
          <select 
            className="select-field" 
            value={eventoSeleccionado} 
            onChange={(e) => setEventoSeleccionado(e.target.value)}
          >
            <option value="">Selecciona un evento</option>
            {eventos.map(ev => <option key={ev.id} value={ev.id}>{ev.nombre}</option>)}
          </select>
        </div>
      )}

      <div className="filters-section">
        <div className="search-wrapper">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            className="input-field"
            placeholder="      Buscar proyectos por nombre o categoría..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="table-container">
        <table className="projects-table">
          <thead>
            <tr>
              <th>Proyecto</th>
              <th>Categoría</th>
              <th>Descripción</th>
              <th>Equipo</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((p) => (
              <tr key={p.id} className="row-hover">
                <td style={{ fontWeight: 500 }}>{p.nombre}</td>
                <td><span className="badge">{p.tipoCategoria}</span></td>
                <td style={{ color: '#6b7280' }}>{p.descripcion || "—"}</td>
                <td style={{ color: '#6b7280' }}>{p.nombreEquipo}</td>
                <td style={{ textAlign: 'right' }}>
                  <MoreVertical size={18} style={{ cursor: 'pointer', color: '#9ca3af' }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <CreateProyectoModal
          eventoId={idEfectivo}
          onCreado={(n) => { setProyectos([...proyectos, n]); setShowModal(false); }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

function CreateProyectoModal({ eventoId, onCreado, onClose }) {
  const [formData, setFormData] = useState({
    nombre: "",
    nombreEquipo: "",
    descripcion: "",
    tipoCategoria: "",
  });

  const [miembros, setMiembros] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [usuariosSugeridos, setUsuariosSugeridos] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.trim().length > 1) {
        setIsSearching(true);
        try {
          const data = await getUsuarios(); 
          const filtrados = data.filter(u => 
            u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
            u.email.toLowerCase().includes(searchTerm.toLowerCase())
          );
          setUsuariosSugeridos(filtrados);
        } catch (error) {
          console.error("Error buscando usuarios", error);
        }
      } else {
        setUsuariosSugeridos([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const addMiembro = (usuario) => {
    if (!miembros.find(m => m.id === usuario.id)) {
      setMiembros([...miembros, usuario]);
    }
    setSearchTerm("");
    setUsuariosSugeridos([]);
  };

  const removeMiembro = (id) => {
    setMiembros(miembros.filter(m => m.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const nuevoProyecto = await createProyecto({
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        tipoCategoria: formData.tipoCategoria,
        evento: { id: eventoId }
      });

      const equipo = await createEquipo({
        nombre: formData.nombreEquipo,
        evento: { id: eventoId },
        proyecto: { id: nuevoProyecto.id }
      });

      for (const miembro of miembros) {
        await assignCompetidor({
          competidorId: miembro.id,
          eventoId: eventoId,
          equipoId: equipo.id
        });
      }

      onCreado(nuevoProyecto);
      onClose();

    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Crear Nuevo Proyecto</h2>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Nombre del Proyecto *</label>
              <input 
                name="nombre" 
                className="input-field" 
                placeholder="Ej: AI Health Monitor"
                required 
                value={formData.nombre}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Nombre del Equipo *</label>
              <input 
                name="nombreEquipo"
                className="input-field" 
                placeholder="Ej: Tech Innovators"
                required 
                value={formData.nombreEquipo}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Descripción</label>
              <textarea 
                name="descripcion" 
                className="textarea-field" 
                placeholder="Describe el proyecto..."
                rows="3"
                value={formData.descripcion}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Miembros del Equipo *</label>
              <div className="user-search-container">
                <input 
                  className="input-field" 
                  placeholder="Buscar usuario por nombre o correo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoComplete="off"
                />
                
                {usuariosSugeridos.length > 0 && (
                  <div className="user-results-dropdown">
                    {usuariosSugeridos.map((u) => (
                      <div 
                        key={u.id} 
                        className="user-result-item" 
                        onClick={() => addMiembro(u)}
                      >
                        <span className="user-result-name">{u.nombre}</span>
                        <span className="user-result-email">{u.email}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {searchTerm.length > 1 && usuariosSugeridos.length === 0 && (
                  <div className="user-results-dropdown">
                    <div className="no-results">No se encontraron usuarios</div>
                  </div>
                )}
              </div>

              <div className="tags-container">
                {miembros.map((m) => (
                  <span key={m.id} className="tag">
                    {m.nombre} 
                    <button type="button" onClick={() => removeMiembro(m.id)}>×</button>
                  </span>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Categoría *</label>
              <select 
                name="tipoCategoria" 
                className="select-field" 
                required 
                value={formData.tipoCategoria}
                onChange={handleChange}
              >
                <option value="">Seleccionar categoría</option>
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary">Crear Proyecto</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProjectsScreen;