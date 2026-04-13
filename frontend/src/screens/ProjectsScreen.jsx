import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Plus, Search, MessageCircle, Send, X } from "lucide-react";
import { getProyectosByEvento, createProyecto } from "../services/proyectoService";
import { getComentariosByProyecto, crearComentario } from "../services/comentarioService";
import { getEventos } from "../services/eventoService";
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
  const [comentarioProyecto, setComentarioProyecto] = useState(null);

  const puedeGestionar = esOrganizador();
  const desdeEvento = Boolean(eventoId);
  const idEfectivo = eventoId || eventoSeleccionado;

  useEffect(() => {
    if (!eventoId) {
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
                  <button
                    className="btn-comment"
                    title="Dejar comentario"
                    onClick={() => setComentarioProyecto(p)}
                  >
                    <MessageCircle size={16} />
                    <span>Comentar</span>
                  </button>
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

      {comentarioProyecto && (
        <ComentarioModal
          proyecto={comentarioProyecto}
          onClose={() => setComentarioProyecto(null)}
        />
      )}
    </div>
  );
}

function ComentarioModal({ proyecto, onClose }) {
  const [texto, setTexto] = useState("");
  const [comentarios, setComentarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    getComentariosByProyecto(proyecto.id)
      .then(setComentarios)
      .catch(() => setComentarios([]))
      .finally(() => setLoading(false));
  }, [proyecto.id]);

  const handleEnviar = async (e) => {
    e.preventDefault();
    if (!texto.trim()) return;
    try {
      setEnviando(true);
      const nuevo = await crearComentario(proyecto.id, texto.trim());
      setComentarios([...comentarios, nuevo]);
      setTexto("");
      setEnviado(true);
      setTimeout(() => setEnviado(false), 3000);
    } catch (err) {
      alert("Error al enviar comentario: " + err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content comentario-modal">
        {/* Header */}
        <div className="modal-header comentario-modal-header">
          <div>
            <h2 className="comentario-modal-title">Comentarios y Feedback</h2>
            <p className="comentario-modal-subtitle">
              Proyecto: {proyecto.nombre}
            </p>
          </div>
          <button className="comentario-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Comentarios existentes */}
        <div className="modal-body">
          {loading ? (
            <p className="comentario-empty">Cargando comentarios...</p>
          ) : comentarios.length === 0 ? (
            <div className="comentario-empty-state">
              <MessageCircle size={40} className="comentario-empty-icon" />
              <p className="comentario-empty">No hay comentarios aún.</p>
              <p className="comentario-empty-hint">Sé el primero en dejar tu feedback anónimo.</p>
            </div>
          ) : (
            <div className="comentarios-list">
              {comentarios.map((c) => (
                <div key={c.id} className="comentario-item">
                  <div className="comentario-header">
                    <div className="comentario-avatar">A</div>
                    <div className="comentario-meta">
                      <span className="comentario-autor">Anónimo</span>
                      <span className="comentario-fecha">
                        {new Date(c.createdAt).toLocaleDateString('es-ES', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                  <p className="comentario-texto">{c.texto}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Formulario de comentario */}
        <div className="comentario-form-section">
          <label className="comentario-form-label">
            Comentarios y Feedback (opcional)
          </label>
          <textarea
            className="comentario-textarea"
            rows={4}
            placeholder="Comparte tus observaciones, sugerencias o comentarios sobre el proyecto..."
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />
          <p className="comentario-form-hint">
            Tus comentarios serán compartidos con el equipo de forma anónima
          </p>

          {enviado && (
            <div className="comentario-success">
              Comentario enviado correctamente
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn-primary"
            disabled={enviando || !texto.trim()}
            onClick={handleEnviar}
          >
            <Send size={16} />
            {enviando ? "Enviando..." : "Enviar Comentario"}
          </button>
        </div>
      </div>
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
  
  const [miembros, setMiembros] = useState(["Ana García"]);
  const [currentMiembro, setCurrentMiembro] = useState("");

  const handleAddMiembro = (e) => {
    if (e.key === 'Enter' && currentMiembro.trim() !== '') {
      e.preventDefault();
      if (!miembros.includes(currentMiembro.trim())) {
        setMiembros([...miembros, currentMiembro.trim()]);
      }
      setCurrentMiembro("");
    }
  };

  const removeMiembro = (indexToRemove) => {
    setMiembros(miembros.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dataParaEnviar = {
      ...formData,
      miembros,
      evento: { id: eventoId }
    };
    
    try {
      const nuevo = await createProyecto(dataParaEnviar);
      onCreado(nuevo);
    } catch (err) {
      alert("Error al crear: " + err.message);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
            Crear Nuevo Proyecto
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="modal-body">
            <div className="form-group">
              <label>Nombre del Proyecto *</label>
              <input 
                className="input-field" 
                placeholder="Ej: AI Health Monitor"
                required 
              />
            </div>

            <div className="form-group">
              <label>Nombre del Equipo *</label>
              <input 
                className="input-field" 
                placeholder="Ej: Tech Innovators"
                required 
              />
            </div>

            <div className="form-group">
              <label>Descripción</label>
              <textarea 
                className="textarea-field" 
                placeholder="Describe el proyecto..."
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>Miembros del Equipo</label>
              <input 
                className="input-field" 
                placeholder="Nombre + Enter"
                onKeyDown={handleAddMiembro}
              />
              <div className="tags-container">
                {miembros.map((m, index) => (
                  <span key={index} className="tag">
                    {m} <button type="button" onClick={() => removeMiembro(index)}>×</button>
                  </span>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Categoría</label>
              <select className="select-field" required>
                <option value="">Seleccionar categoría</option>
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Crear Proyecto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProjectsScreen;
