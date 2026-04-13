import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Users, Plus } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { getEventos } from "../services/eventoService";
import { getProyectosByEvento } from "../services/proyectoService";
import { getEquipos } from "../services/equipoService";
import { esOrganizador } from "../services/sessionService";
import {
  asignarProyectoAVotacion,
  createVotacion,
  getAsignacionesCompetidorEvento,
  getConteoVotos,
  getVotacionProyectosByVotacion,
  getVotacionesByEvento,
} from "../services/votacionService";
import "../styles/voting.css";

function PopularVotingScreen() {
  const navigate = useNavigate();
  const location = useLocation();

  const [eventos, setEventos] = useState([]);
  const [eventoId, setEventoId] = useState(location.state?.eventoId || "");
  const [proyectos, setProyectos] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [votacionPopular, setVotacionPopular] = useState(null);
  const [votacionProyectos, setVotacionProyectos] = useState([]);
  const [voteCounts, setVoteCounts] = useState({});

  const [loading, setLoading] = useState(true);
  const [loadingEvento, setLoadingEvento] = useState(false);
  const [creatingVoting, setCreatingVoting] = useState(false);
  const [assigningProjectId, setAssigningProjectId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(location.state?.successMessage || "");

  const puedeGestionar = esOrganizador();

  useEffect(() => {
    const loadEventos = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getEventos();
        setEventos(data);

        if (!eventoId && data.length > 0) {
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

        const [proyectosData, equiposData, asignacionesData, votacionesData] = await Promise.all([
          getProyectosByEvento(eventoId),
          getEquipos(),
          getAsignacionesCompetidorEvento(eventoId),
          getVotacionesByEvento(eventoId),
        ]);

        const votacion = votacionesData.find((v) => v.tipo === "POPULAR") || null;

        let votacionProyectosData = [];
        let counts = {};

        if (votacion) {
          votacionProyectosData = await getVotacionProyectosByVotacion(votacion.id);
          const countEntries = await Promise.all(
            votacionProyectosData.map(async (vp) => [vp.id, await getConteoVotos(vp.id)])
          );
          counts = Object.fromEntries(countEntries);
        }

        setProyectos(proyectosData);
        setEquipos(equiposData.filter((e) => e.evento?.id === eventoId));
        setAsignaciones(asignacionesData);
        setVotacionPopular(votacion);
        setVotacionProyectos(votacionProyectosData);
        setVoteCounts(counts);
      } catch (err) {
        setError(err.message || "No se pudo cargar la votación");
      } finally {
        setLoadingEvento(false);
      }
    };

    loadData();
  }, [eventoId]);

  useEffect(() => {
    if (location.state?.successMessage || location.state?.eventoId) {
      window.history.replaceState({}, document.title);
    }
  }, []);

  const proyectosEnriquecidos = useMemo(() => {
    return proyectos.map((proyecto) => {
      const equipo = equipos.find((eq) => eq.proyecto?.id === proyecto.id) || null;
      const miembros = equipo
        ? asignaciones.filter((a) => a.equipo?.id === equipo.id).map((a) => a.competidor)
        : [];

      const votacionProyecto = votacionProyectos.find((vp) => vp.proyecto?.id === proyecto.id);

      return {
        ...proyecto,
        equipo,
        miembros,
        votacionProyectoId: votacionProyecto?.id || null,
        totalVotos: votacionProyecto ? voteCounts[votacionProyecto.id] || 0 : 0,
      };
    });
  }, [proyectos, equipos, asignaciones, votacionProyectos, voteCounts]);

  const eventoSeleccionado = eventos.find((evento) => evento.id === eventoId) || null;

  const handleCrearVotacion = async () => {
    try {
      setCreatingVoting(true);
      setError("");
      setSuccess("");

      const ahora = new Date();
      const fin = new Date(ahora);
      fin.setDate(fin.getDate() + 7);

      const nueva = await createVotacion({
        evento: { id: eventoId },
        tipo: "POPULAR",
        maxSelecciones: 3,
        inicio: ahora.toISOString(),
        fin: fin.toISOString(),
        estado: "ABIERTA",
      });

      setVotacionPopular(nueva);
      setSuccess("Votación popular creada correctamente.");
    } catch (err) {
      setError(err.message || "No se pudo crear la votación popular");
    } finally {
      setCreatingVoting(false);
    }
  };

  const handleAsignarProyecto = async (proyectoId) => {
    if (!votacionPopular) return;

    try {
      setAssigningProjectId(proyectoId);
      setError("");
      setSuccess("");

      const asignado = await asignarProyectoAVotacion(votacionPopular.id, proyectoId);
      setVotacionProyectos((prev) => [...prev, asignado]);
      setSuccess("Proyecto asignado a la votación correctamente.");
    } catch (err) {
      setError(err.message || "No se pudo asignar el proyecto");
    } finally {
      setAssigningProjectId("");
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
          <p>Selecciona un evento y accede al detalle de cada proyecto para votar.</p>
        </div>
      </header>

      <section className="voting-event-selector-card">
        <label className="voting-selector-field">
          <span>Evento</span>
          <select
            value={eventoId}
            onChange={(e) => {
              setEventoId(e.target.value);
              setSuccess("");
              setError("");
            }}
          >
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
            <p>{eventoSeleccionado.descripcion}</p>
          </div>
        </section>
      )}

      {!votacionPopular && puedeGestionar && (
        <div className="feedback-card warning-box">
          Este evento todavía no tiene votación popular.
          <div style={{ marginTop: "0.75rem" }}>
            <button className="primary-btn" onClick={handleCrearVotacion} disabled={creatingVoting}>
              {creatingVoting ? "Creando..." : "Crear votación popular"}
            </button>
          </div>
        </div>
      )}

      {error && <div className="feedback-card error-box">{error}</div>}
      {success && <div className="feedback-card success-box">{success}</div>}

      {loadingEvento ? (
        <div className="feedback-card">Cargando proyectos...</div>
      ) : (
        <section className="voting-projects-section">
          <h2>Proyectos del evento</h2>

          <div className="voting-project-list">
            {proyectosEnriquecidos.map((proyecto) => (
              <div key={proyecto.id} className="voting-project-card">
                <button
                  className="project-card-button"
                  onClick={() => navigate(`/votar/${eventoId}/proyecto/${proyecto.id}`)}
                >
                  <div className="project-card-content">
                    <div className="project-title-row">
                      <strong>{proyecto.nombre}</strong>
                      <span className="project-tag">{proyecto.tipoCategoria}</span>
                      {proyecto.votacionProyectoId ? (
                        <span className="project-status-badge ready">Votable</span>
                      ) : (
                        <span className="project-status-badge disabled">No asignado</span>
                      )}
                    </div>

                    <p>{proyecto.descripcion || "Sin descripción disponible."}</p>

                    <div className="project-meta-row">
                      <Users size={14} />
                      <span>
                        {proyecto.equipo?.nombre || "Sin equipo"} · {proyecto.miembros.length} integrantes
                      </span>
                    </div>

                    {proyecto.votacionProyectoId && (
                      <div className="vote-counter">Votos: {proyecto.totalVotos}</div>
                    )}
                  </div>
                </button>

                {puedeGestionar && votacionPopular && !proyecto.votacionProyectoId && (
                  <div className="assign-button-row">
                    <button
                      className="secondary-btn"
                      onClick={() => handleAsignarProyecto(proyecto.id)}
                      disabled={assigningProjectId === proyecto.id}
                    >
                      <Plus size={16} />
                      {assigningProjectId === proyecto.id ? "Asignando..." : "Asignar a votación"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

export default PopularVotingScreen;