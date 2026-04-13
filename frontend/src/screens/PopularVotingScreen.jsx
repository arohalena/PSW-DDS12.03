import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Users, Vote } from "lucide-react";
import { getEventos } from "../services/eventoService";
import { getProyectosByEvento } from "../services/proyectoService";
import { getEquipos } from "../services/equipoService";
import {
  getAnonVotingToken,
  getAsignacionesCompetidorEvento,
  getVotacionProyectosByVotacion,
  getVotacionesByEvento,
  votarProyecto,
} from "../services/votacionService";
import "../styles/voting.css";

function PopularVotingScreen() {
  const [eventos, setEventos] = useState([]);
  const [eventoId, setEventoId] = useState("");
  const [proyectos, setProyectos] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [votacionPopular, setVotacionPopular] = useState(null);
  const [votacionProyectos, setVotacionProyectos] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);

  const [loading, setLoading] = useState(true);
  const [loadingEvento, setLoadingEvento] = useState(false);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadEventos = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getEventos();
        setEventos(data);
        if (data.length > 0) {
          setEventoId(data[0].id);
        }
      } catch (err) {
        setError(err.message || "No se pudieron cargar los eventos");
      } finally {
        setLoading(false);
      }
    };

    loadEventos();
  }, []);

  useEffect(() => {
    if (!eventoId) return;

    const loadData = async () => {
      try {
        setLoadingEvento(true);
        setError("");
        setSuccess("");
        setSelectedProject(null);

        const [proyectosData, equiposData, asignacionesData, votacionesData] =
          await Promise.all([
            getProyectosByEvento(eventoId),
            getEquipos(),
            getAsignacionesCompetidorEvento(eventoId),
            getVotacionesByEvento(eventoId),
          ]);

        const votacion = votacionesData.find((v) => v.tipo === "POPULAR") || null;
        let votacionProyectosData = [];

        if (votacion) {
          votacionProyectosData = await getVotacionProyectosByVotacion(votacion.id);
        }

        setProyectos(proyectosData);
        setEquipos(equiposData.filter((e) => e.evento?.id === eventoId));
        setAsignaciones(asignacionesData);
        setVotacionPopular(votacion);
        setVotacionProyectos(votacionProyectosData);
      } catch (err) {
        setError(err.message || "No se pudo cargar la votación");
      } finally {
        setLoadingEvento(false);
      }
    };

    loadData();
  }, [eventoId]);

  const proyectosEnriquecidos = useMemo(() => {
    return proyectos.map((proyecto) => {
      const equipo = equipos.find((eq) => eq.proyecto?.id === proyecto.id) || null;

      const miembros = equipo
        ? asignaciones
            .filter((a) => a.equipo?.id === equipo.id)
            .map((a) => a.competidor)
        : [];

      const votacionProyecto = votacionProyectos.find(
        (vp) => vp.proyecto?.id === proyecto.id
      );

      return {
        ...proyecto,
        equipo,
        miembros,
        votacionProyectoId: votacionProyecto?.id || null,
      };
    });
  }, [proyectos, equipos, asignaciones, votacionProyectos]);

  const proyectosPendientes = proyectosEnriquecidos;

  const eventoSeleccionado =
    eventos.find((evento) => evento.id === eventoId) || null;

  const handleVote = async () => {
    if (!selectedProject?.votacionProyectoId) return;

    try {
      setVoting(true);
      setError("");
      setSuccess("");

      const token = getAnonVotingToken();
      await votarProyecto(selectedProject.votacionProyectoId, token);

      setSuccess("Tu voto se ha registrado correctamente.");
    } catch (err) {
      setError(err.message || "No se pudo registrar el voto");
    } finally {
      setVoting(false);
    }
  };

  if (loading) {
    return <main className="voting-panel-page"><div className="feedback-card">Cargando votación...</div></main>;
  }

  return (
    <main className="voting-panel-page">
      <header className="voting-panel-header">
        <div>
          <h1>Votación de Proyectos</h1>
          <p>Evalúa los proyectos participantes del evento seleccionado.</p>
        </div>

        <div className="voting-panel-stats">
          <span className="pill blue">{proyectosPendientes.length} proyectos pendientes</span>
        </div>
      </header>

      <section className="voting-event-selector-card">
        <label className="voting-selector-field">
          <span>Evento</span>
          <select value={eventoId} onChange={(e) => setEventoId(e.target.value)}>
            {eventos.map((evento) => (
              <option key={evento.id} value={evento.id}>
                {evento.nombre}
              </option>
            ))}
          </select>
        </label>
      </section>

      {eventoSeleccionado && (
        <section className="voting-event-summary-card">
          <div className="event-summary-icon">
            <CalendarDays size={18} />
          </div>
          <div>
            <strong>{eventoSeleccionado.nombre}</strong>
            <p>
              Plazo de votación hasta{" "}
              {new Intl.DateTimeFormat("es-ES", {
                day: "numeric",
                month: "long",
                year: "numeric",
              }).format(new Date(eventoSeleccionado.fecha_fin))}
            </p>
          </div>
        </section>
      )}

      {loadingEvento ? (
        <div className="feedback-card">Cargando proyectos...</div>
      ) : (
        <>
          <section className="voting-projects-section">
            <h2>Proyectos Pendientes de Evaluar</h2>

            <div className="voting-project-list">
              {proyectosPendientes.map((proyecto) => (
                <button
                  key={proyecto.id}
                  className={`voting-project-card ${
                    selectedProject?.id === proyecto.id ? "selected" : ""
                  }`}
                  onClick={() => setSelectedProject(proyecto)}
                >
                  <div className="project-card-content">
                    <div className="project-title-row">
                         <strong>{proyecto.nombre}</strong>
                        <span className="project-tag">{proyecto.tipoCategoria}</span>

                        {proyecto.votacionProyectoId ? (
                          <span className="project-status-badge ready">Votable</span>
                        ) : (
                          <span className="project-status-badge disabled">
                            No asignado a votación
                          </span>
                       )}
                    </div>

                    <p>{proyecto.descripcion || "Sin descripción disponible."}</p>

                    <div className="project-meta-row">
                      <Users size={14} />
                      <span>
                        {proyecto.equipo?.nombre || "Sin equipo"} ·{" "}
                        {proyecto.miembros.length} integrantes
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {selectedProject && (
            <section className="voting-project-detail-section">
              <div className="project-detail-card">
                <div className="project-detail-header">
                  <div>
                    <h2>{selectedProject.nombre}</h2>
                    <p>{selectedProject.descripcion || "Sin descripción disponible."}</p>
                  </div>
                </div>

                <div className="project-detail-grid">
                  <div className="detail-card">
                    <span className="detail-label">Evento</span>
                    <strong>{eventoSeleccionado?.nombre}</strong>
                  </div>
                  <div className="detail-card">
                    <span className="detail-label">Categoría</span>
                    <strong>{selectedProject.tipoCategoria}</strong>
                  </div>
                  <div className="detail-card">
                    <span className="detail-label">Equipo</span>
                    <strong>{selectedProject.equipo?.nombre || "Sin equipo asignado"}</strong>
                  </div>
                  <div className="detail-card">
                    <span className="detail-label">Integrantes</span>
                    <strong>{selectedProject.miembros.length}</strong>
                  </div>
                </div>

                <div className="team-members-card">
                  <h3>Miembros del equipo</h3>
                  {selectedProject.miembros.length === 0 ? (
                    <p>No hay miembros asignados.</p>
                  ) : (
                    <ul>
                      {selectedProject.miembros.map((miembro) => (
                        <li key={miembro.id}>
                          <strong>{miembro.nombre}</strong> — {miembro.email}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {error && <div className="feedback-card error-box">{error}</div>}
                {success && <div className="feedback-card success-box">{success}</div>}

                <div className="vote-button-row">
                  <button
                    className="primary-btn"
                    onClick={handleVote}
                    disabled={voting || !selectedProject.votacionProyectoId || !votacionPopular}
                  >
                    {voting ? (
                      <>
                        <CheckCircle2 size={18} />
                        Registrando voto...
                      </>
                    ) : (
                      <>
                        <Vote size={18} />
                        Votar este proyecto
                      </>
                    )}
                  </button>
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}

export default PopularVotingScreen;