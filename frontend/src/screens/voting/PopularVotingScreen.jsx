import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Users, Plus, Trash2, SlidersHorizontal, Vote, CheckCircle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { getEventos } from "../../services/eventoService";
import { getProyectosByEvento } from "../../services/proyectoService";
import { getEquipos } from "../../services/equipoService";
import { esOrganizador } from "../../services/sessionService";
import { getCriteriosByEvento } from "../../services/criterioService";
import {
  asignarProyectoAVotacion,
  createVotacion,
  getAsignacionesCompetidorEvento,
  getConteoVotos,
  getVotacionProyectosByVotacion,
  getVotacionesByEvento,
} from "../../services/votacionService";
import "../../styles/voting.css";

const CRITERIO_INICIAL = {
  nombre: "",
  descripcion: "",
  peso: "",
};

function PopularVotingScreen() {
  const navigate = useNavigate();
  const location = useLocation();

  const [eventos, setEventos] = useState([]);
  const [eventoId, setEventoId] = useState(location.state?.eventoId || "");
  const [proyectos, setProyectos] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);

  const [votacionPopularSimple, setVotacionPopularSimple] = useState(null);
  const [votacionPopularMulticriterio, setVotacionPopularMulticriterio] = useState(null);
  const [votacionActiva, setVotacionActiva] = useState(null);

  const [votacionProyectos, setVotacionProyectos] = useState([]);
  const [voteCounts, setVoteCounts] = useState({});

  const [loading, setLoading] = useState(true);
  const [loadingEvento, setLoadingEvento] = useState(false);
  const [creatingVoting, setCreatingVoting] = useState(false);
  const [assigningProjectId, setAssigningProjectId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(location.state?.successMessage || "");

  const [tipoCreacion, setTipoCreacion] = useState("SIMPLE");
  const [criterios, setCriterios] = useState([]);
  const [criteriosExistentes, setCriteriosExistentes] = useState([]);
  const [nuevoCriterio, setNuevoCriterio] = useState(CRITERIO_INICIAL);

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

        const [proyectosData, equiposData, asignacionesData, votacionesData, criteriosData] = await Promise.all([
          getProyectosByEvento(eventoId),
          getEquipos(),
          getAsignacionesCompetidorEvento(eventoId),
          getVotacionesByEvento(eventoId),
          getCriteriosByEvento(eventoId),
        ]);

        const votacionSimple =
          votacionesData.find(
            (v) => v.tipo === "POPULAR" && v.modalidad === "SIMPLE"
          ) || null;

        const votacionMulticriterio =
          votacionesData.find(
            (v) => v.tipo === "POPULAR" && v.modalidad === "MULTICRITERIO"
          ) || null;

        const activa = votacionMulticriterio || votacionSimple || null;

        let votacionProyectosData = [];
        let counts = {};

        if (activa) {
          votacionProyectosData = await getVotacionProyectosByVotacion(activa.id);
          const countEntries = await Promise.all(
            votacionProyectosData.map(async (vp) => [vp.id, await getConteoVotos(vp.id)])
          );
          counts = Object.fromEntries(countEntries);
        }

        setProyectos(proyectosData);
        setEquipos(equiposData.filter((e) => e.evento?.id === eventoId));
        setAsignaciones(asignacionesData);
        setVotacionPopularSimple(votacionSimple);
        setVotacionPopularMulticriterio(votacionMulticriterio);
        setVotacionActiva(activa);
        setVotacionProyectos(votacionProyectosData);
        setVoteCounts(counts);
        setCriteriosExistentes(criteriosData || []);

        if (!votacionSimple && !votacionMulticriterio) {
          setTipoCreacion("SIMPLE");
        } else if (votacionMulticriterio) {
          setTipoCreacion("MULTICRITERIO");
        } else {
          setTipoCreacion("SIMPLE");
        }
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

  const tieneCriteriosDelSidebar = criteriosExistentes.length > 0;

  const totalPeso = useMemo(() => {
    return criterios.reduce((acc, criterio) => acc + Number(criterio.peso || 0), 0);
  }, [criterios]);

  const totalPesoExistentes = useMemo(() => {
    return criteriosExistentes.reduce((acc, criterio) => acc + Number(criterio.peso || 0), 0);
  }, [criteriosExistentes]);

  const puedeCrearMulticriterio = tieneCriteriosDelSidebar
    ? totalPesoExistentes === 100
    : criterios.length > 0 && totalPeso === 100;

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

  const limpiarFormularioCriterio = () => {
    setNuevoCriterio(CRITERIO_INICIAL);
  };

  const handleAgregarCriterio = () => {
    const nombre = nuevoCriterio.nombre.trim();
    const descripcion = nuevoCriterio.descripcion.trim();
    const peso = Number(nuevoCriterio.peso);

    if (!nombre) {
      setError("El criterio debe tener nombre.");
      return;
    }

    if (!peso || peso <= 0 || peso > 100) {
      setError("El peso del criterio debe ser un número entre 1 y 100.");
      return;
    }

    setError("");
    setCriterios((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        nombre,
        descripcion,
        peso,
      },
    ]);
    limpiarFormularioCriterio();
  };

  const handleEliminarCriterio = (criterioId) => {
    setCriterios((prev) => prev.filter((criterio) => criterio.id !== criterioId));
  };

  const recargarDatosEvento = async (nuevaVotacion) => {
    const votacionProyectosData = await getVotacionProyectosByVotacion(nuevaVotacion.id);
    const countEntries = await Promise.all(
      votacionProyectosData.map(async (vp) => [vp.id, await getConteoVotos(vp.id)])
    );

    setVotacionActiva(nuevaVotacion);
    setVotacionProyectos(votacionProyectosData);
    setVoteCounts(Object.fromEntries(countEntries));
  };

  const handleCrearVotacionSimple = async () => {
    try {
      setCreatingVoting(true);
      setError("");
      setSuccess("");

      const ahora = new Date();
      const fin = new Date(ahora);
      fin.setDate(fin.getDate() + 7);

      const nueva = await createVotacion({
        eventoId,
        tipo: "POPULAR",
        modalidad: "SIMPLE",
        maxSelecciones: 3,
        inicio: ahora.toISOString(),
        fin: fin.toISOString(),
        estado: "ABIERTA",
      });

      setVotacionPopularSimple(nueva);
      setVotacionPopularMulticriterio(null);
      await recargarDatosEvento(nueva);
      setSuccess("Votación popular simple creada correctamente.");
    } catch (err) {
      setError(err.message || "No se pudo crear la votación popular simple");
    } finally {
      setCreatingVoting(false);
    }
  };

  const handleCrearVotacionMulticriterio = async () => {
    if (!puedeCrearMulticriterio) {
      setError("La votación multicriterio requiere al menos un criterio y los pesos deben sumar 100%.");
      return;
    }

    try {
      setCreatingVoting(true);
      setError("");
      setSuccess("");

      const ahora = new Date();
      const fin = new Date(ahora);
      fin.setDate(fin.getDate() + 7);

      const payload = {
        eventoId,
        tipo: "POPULAR",
        modalidad: "MULTICRITERIO",
        maxSelecciones: 3,
        inicio: ahora.toISOString(),
        fin: fin.toISOString(),
        estado: "ABIERTA",
      };

      // Solo enviar criterios si NO existen del sidebar
      if (!tieneCriteriosDelSidebar) {
        payload.criterios = criterios.map((criterio) => ({
          nombre: criterio.nombre,
          descripcion: criterio.descripcion,
          peso: Number(criterio.peso),
        }));
      }

      const nueva = await createVotacion(payload);

      setVotacionPopularSimple(null);
      setVotacionPopularMulticriterio(nueva);
      await recargarDatosEvento(nueva);
      setSuccess("Votación popular multicriterio creada correctamente.");
    } catch (err) {
      setError(err.message || "No se pudo crear la votación popular multicriterio");
    } finally {
      setCreatingVoting(false);
    }
  };

  const handleAsignarProyecto = async (proyectoId) => {
    if (!votacionActiva) return;

    try {
      setAssigningProjectId(proyectoId);
      setError("");
      setSuccess("");

      const asignado = await asignarProyectoAVotacion(votacionActiva.id, proyectoId);
      setVotacionProyectos((prev) => [...prev, asignado]);
      setSuccess("Proyecto asignado a la votación correctamente.");
    } catch (err) {
      setError(err.message || "No se pudo asignar el proyecto");
    } finally {
      setAssigningProjectId("");
    }
  };

  const renderResumenVotacion = () => {
    if (votacionPopularMulticriterio) {
      return (
        <div className="feedback-card success-box">
          Existe una votación <strong>POPULAR MULTICRITERIO</strong> para este evento.
        </div>
      );
    }

    if (votacionPopularSimple) {
      return (
        <div className="feedback-card success-box">
          Existe una votación <strong>POPULAR SIMPLE</strong> para este evento.
        </div>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <main className="voting-panel-page">
        <div className="feedback-card">Cargando votación...</div>
      </main>
    );
  }

  return (
    <main className="voting-panel-page">
      <header className="voting-panel-header">
        <div>
          <h1>Votación de Proyectos</h1>
          <p>
            Selecciona un evento y crea una votación popular simple o multicriterio.
          </p>
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
              setCriterios([]);
              setCriteriosExistentes([]);
              limpiarFormularioCriterio();
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

      {renderResumenVotacion()}

      {!votacionActiva && puedeGestionar && (
        <section className="detail-main-card">
          <h2>Crear votación popular</h2>
          <p>Elige si la votación popular del evento será simple o multicriterio.</p>

          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              flexWrap: "wrap",
              marginTop: "1rem",
              marginBottom: "1rem",
            }}
          >
            <button
              type="button"
              className={`secondary-btn ${tipoCreacion === "SIMPLE" ? "active" : ""}`}
              onClick={() => {
                setTipoCreacion("SIMPLE");
                setError("");
                setSuccess("");
              }}
            >
              <Vote size={16} />
              Crear votación simple
            </button>

            <button
              type="button"
              className={`secondary-btn ${tipoCreacion === "MULTICRITERIO" ? "active" : ""}`}
              onClick={() => {
                setTipoCreacion("MULTICRITERIO");
                setError("");
                setSuccess("");
              }}
            >
              <SlidersHorizontal size={16} />
              Crear votación multicriterio
            </button>
          </div>

          {tipoCreacion === "SIMPLE" && (
            <div className="feedback-card warning-box">
              La votación popular simple permitirá votar proyectos con un comentario obligatorio,
              sin puntuaciones por criterio.
              <div style={{ marginTop: "0.75rem" }}>
                <button
                  className="primary-btn"
                  onClick={handleCrearVotacionSimple}
                  disabled={creatingVoting}
                >
                  {creatingVoting ? "Creando..." : "Crear votación popular simple"}
                </button>
              </div>
            </div>
          )}

          {tipoCreacion === "MULTICRITERIO" && (
            <div style={{ display: "grid", gap: "1rem" }}>

              {tieneCriteriosDelSidebar ? (
                <>
                  <div className="feedback-card success-box">
                    <CheckCircle size={16} style={{ display: "inline", verticalAlign: "middle", marginRight: "0.5rem" }} />
                    Este evento ya tiene <strong>{criteriosExistentes.length} criterios</strong> configurados
                    desde el panel de Criterios. Se usarán automáticamente.
                  </div>

                  <div className="voting-project-list">
                    {criteriosExistentes.map((criterio, index) => (
                      <div key={criterio.id} className="voting-project-card">
                        <div className="project-card-content">
                          <div className="project-title-row">
                            <strong>
                              {index + 1}. {criterio.nombre}
                            </strong>
                            <span className="project-tag">{criterio.peso}%</span>
                          </div>
                          <p>{criterio.descripcion || "Sin descripción disponible."}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="vote-count-box">
                    <strong>Peso total:</strong> {totalPesoExistentes}%
                  </div>

                  {totalPesoExistentes !== 100 && (
                    <div className="feedback-card error-box">
                      La suma de los pesos de los criterios existentes no es 100%.
                      Ajústalos desde el panel de <strong>Criterios</strong> en el sidebar antes de crear la votación.
                    </div>
                  )}

                  <div>
                    <button
                      className="primary-btn"
                      onClick={handleCrearVotacionMulticriterio}
                      disabled={creatingVoting || !puedeCrearMulticriterio}
                    >
                      {creatingVoting ? "Creando..." : "Crear votación popular multicriterio"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="feedback-card warning-box">
                    No hay criterios configurados para este evento. Defínelos aquí o desde el panel
                    de <strong>Criterios</strong> en el sidebar. El peso total debe sumar 100%.
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gap: "0.75rem",
                      gridTemplateColumns: "2fr 2fr 1fr auto",
                      alignItems: "end",
                    }}
                  >
                    <label className="voting-selector-field">
                      <span>Nombre del criterio</span>
                      <input
                        type="text"
                        value={nuevoCriterio.nombre}
                        onChange={(e) =>
                          setNuevoCriterio((prev) => ({ ...prev, nombre: e.target.value }))
                        }
                        placeholder="Ej. Innovación"
                      />
                    </label>

                    <label className="voting-selector-field">
                      <span>Descripción</span>
                      <input
                        type="text"
                        value={nuevoCriterio.descripcion}
                        onChange={(e) =>
                          setNuevoCriterio((prev) => ({ ...prev, descripcion: e.target.value }))
                        }
                        placeholder="Qué se evalúa en este criterio"
                      />
                    </label>

                    <label className="voting-selector-field">
                      <span>Peso (%)</span>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={nuevoCriterio.peso}
                        onChange={(e) =>
                          setNuevoCriterio((prev) => ({ ...prev, peso: e.target.value }))
                        }
                        placeholder="25"
                      />
                    </label>

                    <button type="button" className="primary-btn" onClick={handleAgregarCriterio}>
                      <Plus size={16} />
                      Añadir
                    </button>
                  </div>

                  <div className="vote-count-box">
                    <strong>Peso total:</strong> {totalPeso}%
                  </div>

                  {criterios.length > 0 ? (
                    <div className="voting-project-list">
                      {criterios.map((criterio, index) => (
                        <div key={criterio.id} className="voting-project-card">
                          <div className="project-card-content">
                            <div className="project-title-row">
                              <strong>
                                {index + 1}. {criterio.nombre}
                              </strong>
                              <span className="project-tag">{criterio.peso}%</span>
                            </div>

                            <p>{criterio.descripcion || "Sin descripción disponible."}</p>

                            <div className="assign-button-row">
                              <button
                                type="button"
                                className="secondary-btn"
                                onClick={() => handleEliminarCriterio(criterio.id)}
                              >
                                <Trash2 size={16} />
                                Eliminar criterio
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="feedback-card">Todavía no has añadido criterios.</div>
                  )}

                  {totalPeso !== 100 && criterios.length > 0 && (
                    <div className="feedback-card error-box">
                      La suma de los pesos debe ser exactamente 100%.
                    </div>
                  )}

                  <div>
                    <button
                      className="primary-btn"
                      onClick={handleCrearVotacionMulticriterio}
                      disabled={creatingVoting || !puedeCrearMulticriterio}
                    >
                      {creatingVoting ? "Creando..." : "Crear votación popular multicriterio"}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </section>
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

                {puedeGestionar && votacionActiva && !proyecto.votacionProyectoId && (
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
