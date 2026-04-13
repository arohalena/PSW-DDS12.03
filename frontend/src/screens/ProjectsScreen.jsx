import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Plus, Search, MessageCircle, Send, X } from "lucide-react";
import { getProyectosByEvento, createProyectoConEquipo } from "../services/proyectoService";
import { getComentariosByProyecto, crearComentario } from "../services/comentarioService";
import { getEventos } from "../services/eventoService";
import { getCompetidores } from "../services/competidorService";
import {createEquipo, getEquiposParaEvento} from "../services/equipoService";
import {assignCompetidor} from "../services/competidorService";
import { esOrganizador } from "../services/sessionService";
import "../styles/projects.css";


const CATEGORIAS = ["IA", "SOSTENIBILIDAD"];

function ProjectsScreen() {
  const { eventoId } = useParams();
  const [eventos, setEventos] = useState([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState("");
  const [equipos, setEquipos] = useState([]); 
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
    if (eventoId) {
      setEventoSeleccionado(eventoId);
    }
    getEventos()
      .then(setEventos)
      .catch(() => setEventos([]));
  }, [eventoId]);

  useEffect(() => {
    if (!idEfectivo) {
      setProyectos([]);
      setEquipos([]); 
      return;
    }
    const load = async () => {
      try {
        setLoading(true);
        const [proyectosData, equiposData] = await Promise.all([
          getProyectosByEvento(idEfectivo),
          getEquiposParaEvento(idEfectivo)
        ]);
        setProyectos(proyectosData);
        setEquipos(equiposData);
      } catch (err) {
        setError("Error al cargar datos");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [idEfectivo]);

  const filtrados = useMemo(() => {
    return proyectos.map(p => {
      const equipoAsociado = equipos.find(e => e.proyecto?.id === p.id);
      return {
        ...p,
        nombreEquipo: equipoAsociado ? equipoAsociado.nombre : "Sin equipo"
      };
    }).filter((p) =>
      p.nombre?.toLowerCase().includes(search.toLowerCase()) ||
      p.tipoCategoria?.toLowerCase().includes(search.toLowerCase()) ||
      p.nombreEquipo?.toLowerCase().includes(search.toLowerCase())
    );
  }, [proyectos, equipos, search]);

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
              <th style={{ textAlign: 'right' }}>Comentarios</th>
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
                  <button
                    className="btn-comment-pill"
                    onClick={() => setComentarioProyecto(p)}
                  >
                    <MessageCircle size={15} />
                    Comentar
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
    <div className="comment-overlay" onClick={onClose}>
      <div className="comment-modal" onClick={(e) => e.stopPropagation()}>

        <div className="comment-header">
          <div>
            <h2>Comentarios y Feedback</h2>
            <p>Proyecto: {proyecto.nombre}</p>
          </div>
          <button className="comment-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="comment-list">
          {loading ? (
            <p className="comment-loading">Cargando comentarios...</p>
          ) : comentarios.length === 0 ? (
            <div className="comment-empty">
              <MessageCircle size={40} strokeWidth={1.5} />
              <p>No hay comentarios aún</p>
              <span>Sé el primero en dejar tu feedback</span>
            </div>
          ) : (
            <div className="comment-items">
              {comentarios.map((c) => (
                <div key={c.id} className="comment-bubble">
                  <div className="comment-bubble-header">
                    <div className="comment-avatar">A</div>
                    <div>
                      <span className="comment-author">Anónimo</span>
                      <span className="comment-time">
                        {new Date(c.createdAt).toLocaleDateString("es-ES", {
                          day: "2-digit", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                  <p>{c.texto}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="comment-compose">
          {enviado && (
            <div className="comment-success">
              Comentario enviado correctamente
            </div>
          )}
          <textarea
            rows={3}
            placeholder="Escribe tu comentario..."
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />
          <p className="comment-compose-hint">
            Tus comentarios serán compartidos con el equipo de forma anónima
          </p>
          <div className="comment-compose-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button
              className="btn-primary"
              disabled={enviando || !texto.trim()}
              onClick={handleEnviar}
            >
              <Send size={16} />
              {enviando ? "Enviando..." : "Enviar"}
            </button>
          </div>
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

  const [miembros, setMiembros] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [competidoresSugeridos, setCompetidoresSugeridos] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.trim().length > 1) {
        setIsSearching(true);
        try {
          const data = await getCompetidores(); 
          const filtrados = data.filter(u => 
            u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
            u.email.toLowerCase().includes(searchTerm.toLowerCase())
          );
          setCompetidoresSugeridos(filtrados);
        } catch (error) {
          console.error("Error buscando competidores", error);
        }
      } else {
        setCompetidoresSugeridos([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const addMiembro = (competidor) => {
    if (!miembros.find(m => m.id === competidor.id)) {
      setMiembros([...miembros, competidor]);
    }
    setSearchTerm("");
    setCompetidoresSugeridos([]);
  };

  const removeMiembro = (id) => {
    setMiembros(miembros.filter(m => m.id !== id));
  };

    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (submitting) return;

      try {
        setSubmitting(true);

        const nuevoProyecto = await createProyectoConEquipo({
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          tipoCategoria: formData.tipoCategoria,
          nombreEquipo: formData.nombreEquipo,
          miembrosEmails: miembros.map(m => m.email),
          eventoId: eventoId
        });

        onCreado(nuevoProyecto);
        onClose();

      } catch (err) {
        alert("Error: " + err.message);
      } finally {
        setSubmitting(false);
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
                value={formData.nombre}
                onChange={handleChange}
                required 
              />

            </div>

            <div className="form-group">
              <label>Nombre del Equipo *</label>
              <input 
                name="nombreEquipo"
                className="input-field" 
                placeholder="Ej: Tech Innovators"
                value={formData.nombreEquipo}
                onChange={handleChange}
                required 
              />

            </div>

            <div className="form-group">
              <label>Descripción</label>
              <textarea 
                name="descripcion" 
                className="textarea-field" 
                placeholder="Describe el proyecto..."
                value={formData.descripcion}
                onChange={handleChange}
                rows="3"
              />

            </div>

            <div className="form-group">
              <label>Miembros del Equipo *</label>
              <div className="user-search-container">
                <input 
                  className="input-field" 
                  placeholder="Buscar competidor por nombre o correo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoComplete="off"
                />
                
                {competidoresSugeridos.length > 0 && (
                  <div className="user-results-dropdown">
                    {competidoresSugeridos.map((u) => (
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
                
                {searchTerm.length > 1 && competidoresSugeridos.length === 0 && (
                  <div className="user-results-dropdown">
                    <div className="no-results">No se encontraron competidores</div>
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
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Creando..." : "Crear Proyecto"}
            </button>

          </div>
        </form>
      </div>
    </div>
  );
}


export default ProjectsScreen;
