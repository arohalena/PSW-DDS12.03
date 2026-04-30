import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle,
  FolderKanban,
  Plus,
  Search,
  Users,
  Vote,
  MessageCircle,
} from "lucide-react";

import { getEquipos } from "../../services/equipoService";
import { getEventos } from "../../services/eventoService";
import {
  asignarProyectoAVotacion,
  getAsignacionesCompetidorEvento,
  getVotacionProyectosByVotacion,
  getVotacionesByEvento,
} from "../../services/votacionService";
import { crearComentario } from "../../services/comentarioService";
import { getProyectos, getProyectosByEvento } from "../../services/proyectoService";
import { esOrganizador } from "../../services/sessionService";
import CommentProjectModal from "./CommentProjectModal";

import "../../styles/projects.css";

function formatDate(value) {
  if (!value) return "Sin fecha";

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getEventStart(evento) {
  return evento?.fecha_inicio || evento?.fechaInicio || evento?.inicio;
}

function getCategoriaLabel(categoria) {
  if (categoria === "IA") return "IA";
  if (categoria === "SOSTENIBILIDAD") return "Sostenibilidad";
  return categoria || "Sin categoría";
}

function getProjectEventoId(proyecto) {
  return proyecto.evento?.id || proyecto.eventoId || "";
}

function AssignProjectModal({ open, onClose, proyecto, eventos, onSubmit }) {
  const [eventoId, setEventoId] = useState("");
  const [votacionId, setVotacionId] = useState("");
  const [votaciones, setVotaciones] = useState([]);

  useEffect(() => {
    if (!open || !proyecto) return;

    const firstEventoId = proyecto.evento?.id || eventos[0]?.id || "";
    setEventoId(firstEventoId);
  }, [open, proyecto, eventos]);

  useEffect(() => {
    if (!open || !eventoId) {
      setVotaciones([]);
      setVotacionId("");
      return;
    }

    getVotacionesByEvento(eventoId)
      .then((data) => {
        setVotaciones(data || []);
        setVotacionId(data?.[0]?.id || "");
      })
      .catch(() => {
        setVotaciones([]);
        setVotacionId("");
      });
  }, [open, eventoId]);

  if (!open || !proyecto) return null;

  async function submit(e) {
    e.preventDefault();
    await onSubmit({ eventoId, votacionId });
    onClose();
  }

  return (
    <div className="project-modal-backdrop">
      <form className="project-modal" onSubmit={submit}>
        <h2>Asignar proyecto a votación</h2>
        <p>Selecciona el evento y la votación donde participará {proyecto.nombre}.</p>

        <label className="project-field">
          <span>Evento</span>
          <select value={eventoId} onChange={(e) => setEventoId(e.target.value)} required>
            <option value="">Selecciona evento</option>
            {eventos.map((evento) => (
              <option key={evento.id} value={evento.id}>
                {evento.nombre}
              </option>
            ))}
          </select>
        </label>

        <label className="project-field">
          <span>Votación</span>
          <select value={votacionId} onChange={(e) => setVotacionId(e.target.value)} required>
            <option value="">Selecciona votación</option>
            {votaciones.map((votacion) => (
              <option key={votacion.id} value={votacion.id}>
                {votacion.tipo} + {votacion.modalidad}
              </option>
            ))}
          </select>
        </label>

        <div className="project-modal-actions">
          <button type="button" className="secondary-btn" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="primary-btn">
            Asignar
          </button>
        </div>
      </form>
    </div>
  );
}


function ProjectsScreen() {
  const { eventoId } = useParams();
  const navigate = useNavigate();

  const [proyectos, setProyectos] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [asignacionesPorEquipo, setAsignacionesPorEquipo] = useState({});
  const [votacionesPorProyecto, setVotacionesPorProyecto] = useState({});
  const [search, setSearch] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(eventoId || "TODOS");
  const [selectedStatus, setSelectedStatus] = useState("TODOS");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [commentProject, setCommentProject] = useState(null);

  const puedeGestionar = esOrganizador();
  const desdeEvento = Boolean(eventoId);

  async function handleCreateComment({ texto }) {

    if (!commentProject) return;

    try {

      await crearComentario(commentProject.id, texto.trim());
      await load();
      
    } catch (err) {

      let mensaje = "No se ha podido enviar el comentario.";
      
      try {

        const parsed = JSON.parse(err.message);

        if (parsed.status === 403) {

          mensaje = "No puedes comentar en este proyecto porque no formas parte del evento.";

        } else if (parsed.message) {

          mensaje = parsed.message;
        }

      } catch {
        
      }

      alert(mensaje);

      throw err; 
    }
  }

  async function load() {
    try {
      setLoading(true);
      setError("");

      const [eventosData, equiposData, proyectosData] = await Promise.all([
        getEventos().catch(() => []),
        getEquipos().catch(() => []),
        eventoId ? getProyectosByEvento(eventoId).catch(() => []) : getProyectos().catch(() => []),
      ]);

      setEventos(eventosData || []);
      setEquipos(equiposData || []);
      setProyectos(proyectosData || []);

      const asignacionesEquipo = {};

      await Promise.all(
        (eventosData || []).map(async (evento) => {
          const asignaciones = await getAsignacionesCompetidorEvento(evento.id).catch(() => []);

          asignaciones.forEach((asignacion) => {
            const equipoId = asignacion.equipo?.id;
            if (!equipoId) return;

            if (!asignacionesEquipo[equipoId]) {
              asignacionesEquipo[equipoId] = [];
            }

            asignacionesEquipo[equipoId].push(asignacion);
          });
        })
      );

      setAsignacionesPorEquipo(asignacionesEquipo);

      const votacionesProyectoMap = {};

      for (const evento of eventosData || []) {
        const votaciones = await getVotacionesByEvento(evento.id).catch(() => []);

        for (const votacion of votaciones || []) {
          const relaciones = await getVotacionProyectosByVotacion(votacion.id).catch(() => []);

          relaciones.forEach((relacion) => {
            const proyectoId = relacion.proyecto?.id;
            if (!proyectoId) return;

            if (!votacionesProyectoMap[proyectoId]) {
              votacionesProyectoMap[proyectoId] = [];
            }

            votacionesProyectoMap[proyectoId].push({
              ...relacion,
              votacion,
            });
          });
        }
      }

      setVotacionesPorProyecto(votacionesProyectoMap);
    } catch (err) {
      setError(err.message || "No se pudieron cargar los proyectos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [eventoId]);

  const projectsWithData = useMemo(() => {
    return proyectos.map((proyecto) => {
      const equipo = equipos.find((item) => String(item.proyecto?.id) === String(proyecto.id));
      const evento = eventos.find((item) => String(item.id) === String(getProjectEventoId(proyecto)));
      const asignaciones = equipo ? asignacionesPorEquipo[equipo.id] || [] : [];
      const votaciones = votacionesPorProyecto[proyecto.id] || [];

      return {
        ...proyecto,
        equipo,
        evento: proyecto.evento || evento,
        miembrosCount: asignaciones.length,
        votaciones,
        asignado: votaciones.length > 0,
      };
    });
  }, [proyectos, equipos, eventos, asignacionesPorEquipo, votacionesPorProyecto]);

  const filteredProjects = useMemo(() => {
    return projectsWithData.filter((proyecto) => {
      const text = [
        proyecto.nombre,
        proyecto.descripcion,
        proyecto.tipoCategoria,
        proyecto.equipo?.nombre,
        proyecto.evento?.nombre,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = text.includes(search.toLowerCase());
      const matchesEvent =
        selectedEvent === "TODOS" ||
        String(getProjectEventoId(proyecto)) === String(selectedEvent);
      const matchesStatus =
        selectedStatus === "TODOS" ||
        (selectedStatus === "ASIGNADO" && proyecto.asignado) ||
        (selectedStatus === "NO_ASIGNADO" && !proyecto.asignado);

      return matchesSearch && matchesEvent && matchesStatus;
    });
  }, [projectsWithData, search, selectedEvent, selectedStatus]);

  const stats = useMemo(() => {
    return {
      total: projectsWithData.length,
      assigned: projectsWithData.filter((p) => p.asignado).length,
      unassigned: projectsWithData.filter((p) => !p.asignado).length,
      teams: projectsWithData.filter((p) => p.equipo).length,
    };
  }, [projectsWithData]);

  async function handleAssign({ votacionId }) {
    if (!selectedProject || !votacionId) return;

    await asignarProyectoAVotacion(votacionId, selectedProject.id);
    await load();
  }

  return (
    <main className="projects-page projects-management-page">
      <header className="projects-header">
        <div>
          <h1>Gestión de Proyectos</h1>
          <p>
            {desdeEvento
              ? "Proyectos participantes del evento seleccionado."
              : "Administra todos los proyectos del sistema."}
          </p>
        </div>

        {puedeGestionar ? (
          <button
            className="primary-btn"
            onClick={() => navigate("/usuarios")}
          >
            <Plus size={17} />
            Crear desde Equipo
          </button>
        ) : null}
      </header>

      <section className="projects-stats-grid">
        <div className="project-stat-card">
          <FolderKanban size={22} />
          <strong>{stats.total}</strong>
          <span>Total proyectos</span>
        </div>
        <div className="project-stat-card">
          <CheckCircle size={22} />
          <strong>{stats.assigned}</strong>
          <span>Asignados</span>
        </div>
        <div className="project-stat-card">
          <Vote size={22} />
          <strong>{stats.unassigned}</strong>
          <span>Sin votación</span>
        </div>
        <div className="project-stat-card">
          <Users size={22} />
          <strong>{stats.teams}</strong>
          <span>Con equipo</span>
        </div>
      </section>

      <section className="projects-card">
        <div className="projects-toolbar">
          <div className="projects-search">
            <Search size={17} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar proyecto, equipo, evento o categoría..."
            />
          </div>

          {!desdeEvento ? (
            <select value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)}>
              <option value="TODOS">Todos los eventos</option>
              {eventos.map((evento) => (
                <option key={evento.id} value={evento.id}>
                  {evento.nombre}
                </option>
              ))}
            </select>
          ) : null}

          <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
            <option value="TODOS">Todos los estados</option>
            <option value="ASIGNADO">Asignado a votación</option>
            <option value="NO_ASIGNADO">Sin votación</option>
          </select>
        </div>

        {loading ? (
          <div className="project-feedback">Cargando proyectos...</div>
        ) : error ? (
          <div className="project-feedback error-box">{error}</div>
        ) : filteredProjects.length === 0 ? (
          <div className="project-feedback">No hay proyectos que coincidan con la búsqueda.</div>
        ) : (
          <div className="projects-table-wrapper">
            <table className="projects-table">
              <thead>
                <tr>
                  <th>Proyecto</th>
                  <th>Evento</th>
                  <th>Equipo</th>
                  <th>Miembros</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                  {filteredProjects.map((proyecto) => (
                  <tr
                    key={proyecto.id}
                    className="project-clickable-row"
                    onClick={() =>
                      navigate(
                        proyecto.evento?.id
                          ? `/eventos/${proyecto.evento.id}/proyectos/${proyecto.id}`
                          : `/proyectos/${proyecto.id}`
                      )
                    }
                  >
                  <td>
                    <div className="project-name-cell">
                      <div className="project-table-avatar">
                      {proyecto.nombre?.charAt(0)?.toUpperCase() || "P"}
                      </div>

                      <div>
                        <strong>{proyecto.nombre}</strong>
                        <span>{getCategoriaLabel(proyecto.tipoCategoria)}</span>
                      </div>
                    </div>
                  </td>

                  <td>
                    <div className="project-event-cell">
                      <strong>{proyecto.evento?.nombre || "Sin evento"}</strong>
                      <span>{formatDate(getEventStart(proyecto.evento))}</span>
                    </div>
                  </td>

                  <td>{proyecto.equipo?.nombre || "Sin equipo"}</td>

                  <td>
                    <span className="project-members-pill">
                      <Users size={14} />
                      {proyecto.miembrosCount}
                   </span>
                  </td>

                  <td>
                    {proyecto.asignado ? (
                      <span className="project-status-chip assigned">
                        Asignado
                      </span>
                    ) : (
                      <span className="project-status-chip unassigned">
                        No asignado
                      </span>
                    )}
                  </td>
                    <td>
                      <div className="project-actions-cell">
                        {!proyecto.asignado && puedeGestionar ? (
                          <button
                            type="button"
                            className="project-assign-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProject(proyecto);
                            }}
                          >
                            Asignar a votación
                          </button>
                        ) : null}

                        <button
                          type="button"
                          className="project-comment-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCommentProject(proyecto);
                          }}
                        >
                          <MessageCircle size={15} />
                          Comentar
                        </button>

                        <button
                          type="button"
                          className="project-view-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(
                              proyecto.evento?.id
                                ? `/eventos/${proyecto.evento.id}/proyectos/${proyecto.id}`
                                : `/proyectos/${proyecto.id}`
                            );
                          }}
                        >
                          Ver
                          <ArrowRight size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <AssignProjectModal
        open={Boolean(selectedProject)}
        proyecto={selectedProject}
        eventos={eventos}
        onClose={() => setSelectedProject(null)}
        onSubmit={handleAssign}
      />
      <CommentProjectModal
        open={Boolean(commentProject)}
        proyecto={commentProject}
        relaciones={commentProject ? votacionesPorProyecto[commentProject.id] || [] : []}
        onClose={() => setCommentProject(null)}
        onSubmit={handleCreateComment}
/>
    </main>
  );
}

export default ProjectsScreen;