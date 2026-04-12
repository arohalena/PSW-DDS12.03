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
import "../styles/projects.css"; // Importación del CSS separado

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
            placeholder="Buscar proyectos por nombre o categoría..."
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
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((p) => (
              <tr key={p.id} className="row-hover">
                <td style={{ fontWeight: 500 }}>{p.nombre}</td>
                <td><span className="badge">{p.tipoCategoria}</span></td>
                <td style={{ color: '#6b7280' }}>{p.descripcion || "—"}</td>
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
  const [formData, setFormData] = useState({ nombre: "", descripcion: "", tipoCategoria: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nuevo = await createProyecto({ ...formData, evento: { id: eventoId } });
    onCreado(nuevo);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header"><h2>Nuevo Proyecto</h2></div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Nombre</label>
              <input 
                className="input-field" 
                style={{ paddingLeft: '0.75rem' }} 
                onChange={e => setFormData({...formData, nombre: e.target.value})}
                required 
              />
            </div>
            <div className="form-group">
              <label>Categoría</label>
              <select 
                className="select-field" 
                style={{ maxWidth: '100%' }}
                onChange={e => setFormData({...formData, tipoCategoria: e.target.value})}
                required
              >
                <option value="">Seleccionar...</option>
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary">Guardar Proyecto</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProjectsScreen;