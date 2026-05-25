import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  FolderKanban,
  Lock,
  Pause,
  Play,
  Plus,
  RefreshCw,
  ShieldCheck,
  Square,
  Star,
  Trash2,
  Trophy,
  Users,
  Vote,
  X,
} from "lucide-react";
import { deleteEvento, getEventos, getEventoByCodigo } from "../../services/eventoService";
import { getProyectosByEvento } from "../../services/proyectoService";
import {
  abrirVotacion,
  cerrarVotacion,
  deleteVotacion,
  getConteoVotos,
  getVotacionProyectosByVotacion,
  getVotacionesByEvento,
  pausarVotacion,
  reanudarVotacion,
} from "../../services/votacionService";
import { esOrganizador, getEventAccessStorageKey } from "../../services/sessionService";
import CreateVotingModal from "./CreateVotingModal";
import EventProjectCard from "./EventProjectCard";
import "../../styles/events.css";

function formatDate(value) {
  if (!value) return "Sin fecha";

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getEventStart(evento) {
  return evento?.fecha_inicio || evento?.fechaInicio || evento?.inicio;
}

function getEventEnd(evento) {
  return evento?.fecha_fin || evento?.fechaFin || evento?.fin;
}

function getVotingStart(votacion) {
  return votacion?.inicio || votacion?.fechaInicio || votacion?.fecha_inicio;
}

function getVotingEnd(votacion) {
  return votacion?.fin || votacion?.fechaFin || votacion?.fecha_fin;
}

function getVotingEstado(votacion) {
  return votacion?.estadoActual || votacion?.estado || "PENDIENTE";
}

function getVotingEstadoClass(estado) {
  if (estado === "ABIERTA") return "voting-status-open";
  if (estado === "PAUSADA") return "voting-status-paused";
  if (estado === "CERRADA") return "voting-status-closed";
  return "voting-status-pending";
}

function getVotingEstadoLabel(estado) {
  if (estado === "ABIERTA") return "Abierta";
  if (estado === "PAUSADA") return "Pausada";
  if (estado === "CERRADA") return "Cerrada";
  return "Pendiente";
}

function isPrivateEvent(evento) {
  return Boolean(evento.codigoAccesoPublico || evento.codigoAcceso);
}

function getEventCode(evento) {
  return evento?.codigoAccesoPublico || evento?.codigoAcceso || "";
}

function hasEventAccess(eventoId, evento, puedeGestionar) {
  if (!isPrivateEvent(evento) || puedeGestionar) return true;
  return (
    localStorage.getItem(`votify_event_access_${eventoId}`) === "true"
  );
}

function getEventStatus(evento) {
  const now = new Date();
  const start = getEventStart(evento) ? new Date(getEventStart(evento)) : null;
  const end = getEventEnd(evento) ? new Date(getEventEnd(evento)) : null;

  if (start && now < start) {
    return { label: "Planificación", className: "status-planning" };
  }

  if (end && now > end) {
    return { label: "Finalizado", className: "status-finished" };
  }

  return { label: "Evento activo", className: "status-active" };
}

function votingLabel(votacion) {
  return votacion?.nombre || "Votación sin nombre";
}

function votingSubtitle(votacion) {
  const modalidadMap = {
    SIMPLE: "Simple",
    PUNTOS: "Puntos",
    MULTICRITERIO: "Multicriterio",
    MULTICRITERIO_PONDERADA: "Ponderada",
  };

  const tipo = votacion?.tipo === "MIXTA" ? "Mixta" : votacion?.tipo === "JURADO" ? "Jurado" : "Popular";
  const modalidad = modalidadMap[votacion?.modalidad] || votacion?.modalidad || "Sin modalidad";

  return `${tipo} · ${modalidad} · Máx. ${votacion?.maxSelecciones || 1}`;
}

function getVotingCommentsLabel(votacion) {
  if (votacion?.comentariosActivos === false) {
    return "Comentarios desactivados";
  }

  if (votacion?.comentarioObligatorio === true) {
    return "Comentario obligatorio";
  }

  return "Comentario opcional";
}

function getVotingCommentsClass(votacion) {
  if (votacion?.comentariosActivos === false) {
    return "comments-disabled";
  }

  if (votacion?.comentarioObligatorio === true) {
    return "comments-required";
  }

  return "comments-optional";
}

function EventAccessModal({ event, onClose, onSuccess }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!code.trim()) return;

    try {
      setChecking(true);
      setError("");

      const expectedCode = getEventCode(event);

      if (expectedCode && code.trim().toUpperCase() === expectedCode.toUpperCase()) {
        localStorage.setItem(getEventAccessStorageKey(event.id), "true");
        onSuccess();
        return;
      }

      const eventoPorCodigo = await getEventoByCodigo(code.trim());

      if (String(eventoPorCodigo.id) === String(event.id)) {
        localStorage.setItem(getEventAccessStorageKey(event.id), "true");
        onSuccess();
        return;
      }

      setError("Código incorrecto.");
    } catch {
      setError("Código incorrecto.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div
      className="event-access-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="event-access-modal">
        <div className="event-access-modal-header">
          <div className="event-access-decoration event-access-decoration-one" />
          <div className="event-access-decoration event-access-decoration-two" />

          <div className="event-access-header-content">
            <div className="event-access-title-row">
              <div className="event-access-lock">
                <Lock size={30} />
              </div>

              <div>
                <h2>Acceso Privado</h2>
                <p>{event.nombre}</p>
              </div>
            </div>

            <button className="event-access-close" onClick={onClose} type="button">
              <X size={20} />
            </button>
          </div>
        </div>

        <form className="event-access-modal-body" onSubmit={handleSubmit}>
          <div className="event-access-info">
            <ShieldCheck size={20} />
            <div>
              <strong>Evento protegido</strong>
              <span>Introduce el código de acceso para ver proyectos y votaciones.</span>
            </div>
          </div>

          <label className="event-access-field">
            <span>Código de acceso</span>
            <input
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError("");
              }}
              placeholder="HACK2026"
              className={error ? "event-access-input input-shake" : "event-access-input"}
              autoFocus
            />
          </label>

          {error ? <div className="event-access-error">{error}</div> : null}

          <div className="event-access-actions">
            <button type="button" className="secondary-btn" onClick={onClose}>
              Cancelar
            </button>

            <button type="submit" className="primary-btn" disabled={!code.trim() || checking}>
              {checking ? "Verificando..." : "Acceder"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProjectCard({ eventoId, votingId, proyecto, votacionProyecto, votes, votingOpen }) {
  const navigate = useNavigate();

  return (
    <article className="event-detail-project-card">
      <div className="event-detail-project-cover">
        {proyecto.nombre?.charAt(0)?.toUpperCase() || "P"}
      </div>

      <div className="event-detail-project-body">
        <div className="event-detail-project-header">
          <div>
            <h3>{proyecto.nombre}</h3>
            <p>{proyecto.descripcion || "Proyecto participante del evento."}</p>
          </div>

          <span className="event-detail-project-badge">{votes ?? 0} votos</span>
        </div>

        <div className="event-detail-project-meta">
          <span>
            <Users size={14} />
            Equipo participante
          </span>
          <span>
            <Star size={14} />
            Evaluación abierta
          </span>
        </div>

        <div className="event-detail-project-actions">
          <button
            type="button"
            className="secondary-btn"
            onClick={() => navigate(`/eventos/${eventoId}/proyectos/${proyecto.id}`)}
          >
            Ver detalle
          </button>

          {votacionProyecto ? (
            <button
              type="button"
              className="primary-btn"
              disabled={!votingOpen}
              onClick={() => {
                if (!votingOpen) return;
                navigate(`/eventos/${eventoId}/votaciones/${votingId}/proyectos/${proyecto.id}/votar`);
              }}
            >
              <Vote size={16} />
              {votingOpen ? "Votar" : "Votación no activa"}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function EventDetailScreen() {
  const { eventoId } = useParams();
  const navigate = useNavigate();

  const [evento, setEvento] = useState(null);
  const [proyectos, setProyectos] = useState([]);
  const [votaciones, setVotaciones] = useState([]);
  const [selectedVotingId, setSelectedVotingId] = useState("");
  const [votacionProyectos, setVotacionProyectos] = useState([]);
  const [voteCounts, setVoteCounts] = useState({});
  const [votesByVotingId, setVotesByVotingId] = useState({});
  const [loading, setLoading] = useState(true);
  const [accessModalOpen, setAccessModalOpen] = useState(false);
  const [createVotingModalOpen, setCreateVotingModalOpen] = useState(false);
  const [deleteEventModalOpen, setDeleteEventModalOpen] = useState(false);
  const [deleteVotingModalOpen, setDeleteVotingModalOpen] = useState(false);
  const [votingToDelete, setVotingToDelete] = useState(null);
  const [deletingEvent, setDeletingEvent] = useState(false);
  const [deletingVoting, setDeletingVoting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const puedeGestionar = esOrganizador();

  const loadEventData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const eventos = await getEventos();
      const found = eventos.find((item) => String(item.id) === String(eventoId));

      setEvento(found || null);

      const [proyectosData, votacionesData] = await Promise.all([
        getProyectosByEvento(eventoId).catch(() => []),
        getVotacionesByEvento(eventoId).catch(() => []),
      ]);

      setProyectos(proyectosData || []);
      setVotaciones(votacionesData || []);

      setSelectedVotingId((current) => {
        if (current && votacionesData?.some((v) => String(v.id) === String(current))) {
          return current;
        }

        return votacionesData?.[0]?.id || "";
      });
    } catch (err) {
      setError(err.message || "No se pudo cargar el evento.");
    } finally {
      setLoading(false);
    }
  }, [eventoId]);

  useEffect(() => {
    loadEventData();
  }, [loadEventData]);

  useEffect(() => {
    async function loadVotingProjects() {
      if (!selectedVotingId) {
        setVotacionProyectos([]);
        setVoteCounts({});
        return;
      }

      const relaciones = await getVotacionProyectosByVotacion(selectedVotingId).catch(() => []);
      setVotacionProyectos(relaciones || []);

      const counts = {};

      await Promise.all(
        (relaciones || []).map(async (relacion) => {
          counts[relacion.id] = await getConteoVotos(relacion.id).catch(() => 0);
        })
      );

      setVoteCounts(counts);
    }

    loadVotingProjects();
  }, [selectedVotingId]);

  useEffect(() => {
    async function loadAllVotingCounts() {
      if (!votaciones.length) {
        setVotesByVotingId({});
        return;
      }

      const countsByVoting = {};

      await Promise.all(
        votaciones.map(async (votacion) => {
          const relaciones = await getVotacionProyectosByVotacion(votacion.id).catch(() => []);
          const total = await (relaciones || []).reduce(async (sumPromise, relacion) => {
            const sum = await sumPromise;
            const count = await getConteoVotos(relacion.id).catch(() => 0);
            return sum + Number(count || 0);
          }, Promise.resolve(0));

          countsByVoting[votacion.id] = total;
        })
      );

      setVotesByVotingId(countsByVoting);
    }

    loadAllVotingCounts();
  }, [votaciones]);
  
  const selectedVoting = useMemo(
    () => votaciones.find((v) => String(v.id) === String(selectedVotingId)),
    [votaciones, selectedVotingId]
  );

  const selectedVotingEstado = getVotingEstado(selectedVoting);
  const eventHasVotes = Object.values(votesByVotingId).some((value) => Number(value || 0) > 0);
  const selectedVotingVotes = Object.values(voteCounts).reduce(
    (sum, value) => sum + Number(value || 0),
    0
  );
  const totalEventVotes = Object.values(votesByVotingId).reduce(
    (sum, value) => sum + Number(value || 0),
    0
  );
  const openVotingCount = votaciones.filter(
    (votacion) => getVotingEstado(votacion) === "ABIERTA"
  ).length;

  const relacionesByProjectId = useMemo(() => {
    const map = new Map();

    votacionProyectos.forEach((relacion) => {
      if (relacion.proyecto?.id) {
        map.set(String(relacion.proyecto.id), relacion);
      }
    });

    return map;
  }, [votacionProyectos]);

  const displayedProjects = useMemo(() => {
    if (!selectedVoting) return proyectos;

    return proyectos.filter((proyecto) =>
      relacionesByProjectId.has(String(proyecto.id))
    );
  }, [proyectos, relacionesByProjectId, selectedVoting]);

  async function confirmDeleteEvento() {
    if (eventHasVotes) {
      setError("No se puede eliminar un evento con votos emitidos.");
      setDeleteEventModalOpen(false);
      return;
    }

    try {
      setDeletingEvent(true);
      setError("");
      setSuccess("");

      await deleteEvento(eventoId);

      navigate("/eventos", {
        state: {
          successMessage:
            "Evento eliminado correctamente. Los proyectos se han conservado sin evento asignado.",
        },
      });
    } catch (err) {
      setError(err.message || "No se pudo eliminar el evento.");
    } finally {
      setDeletingEvent(false);
      setDeleteEventModalOpen(false);
    }
  }

  function openDeleteVotingModal(votacion) {
    if (Number(votesByVotingId[votacion.id] || 0) > 0) {
      setError("No se puede eliminar una votacion con votos emitidos.");
      return;
    }

    setVotingToDelete(votacion);
    setDeleteVotingModalOpen(true);
  }

  async function confirmDeleteVotacion() {
    if (!votingToDelete) return;

    try {
      setDeletingVoting(true);
      setError("");
      setSuccess("");

      await deleteVotacion(votingToDelete.id);

      setSuccess("Votación eliminada correctamente.");
      setSelectedVotingId("");
      setVotingToDelete(null);
      setDeleteVotingModalOpen(false);

      await loadEventData();
    } catch (err) {
      setError(err.message || "No se pudo eliminar la votación.");
    } finally {
      setDeletingVoting(false);
    }
  }

  async function handleCambiarEstadoVotacion(action, votacionId) {
    try {
      setError("");
      setSuccess("");

      const fnMap = {
        abrir: abrirVotacion,
        pausar: pausarVotacion,
        reanudar: reanudarVotacion,
        cerrar: cerrarVotacion,
      };

      await fnMap[action](votacionId);

      const votacionesActualizadas = await getVotacionesByEvento(eventoId);
      setVotaciones(votacionesActualizadas || []);

      setSuccess(
        `Votación ${
          action === "abrir"
            ? "abierta"
            : action === "pausar"
              ? "pausada"
              : action === "reanudar"
                ? "reanudada"
                : "cerrada"
        } correctamente.`
      );
    } catch (err) {
      setError(err.message || "No se pudo cambiar el estado de la votación.");
    }
  }

  if (loading) {
    return (
      <main className="events-page">
        <div className="feedback-card">Cargando evento...</div>
      </main>
    );
  }

  if (!evento) {
    return (
      <main className="events-page">
        <div className="feedback-card error-box">Evento no encontrado.</div>
      </main>
    );
  }

  const privateEvent = isPrivateEvent(evento);
  const canView = hasEventAccess(eventoId, evento, puedeGestionar);
  const eventStatus = getEventStatus(evento);

  if (!canView) {
    return (
      <main className="events-page event-detail-page">
        <Link className="back-link" to="/eventos">
          <ArrowLeft size={16} />
          Volver a eventos
        </Link>

        <section className="event-locked-hero">
          <div className="event-locked-icon">
            <Lock size={38} />
          </div>

          <span className="event-private-chip">
            <Lock size={13} />
            Evento privado
          </span>

          <h1>{evento.nombre}</h1>
          <p>{evento.descripcion || "Este evento requiere código de acceso."}</p>

          <div className="event-locked-meta">
            <span>
              <Calendar size={16} />
              {formatDate(getEventStart(evento))}
            </span>
            <span>
              <Clock size={16} />
              {formatDate(getEventEnd(evento))}
            </span>
          </div>

          <button className="primary-btn" onClick={() => setAccessModalOpen(true)}>
            Acceder al Evento
          </button>
        </section>

        {accessModalOpen ? (
          <EventAccessModal
            event={evento}
            onClose={() => setAccessModalOpen(false)}
            onSuccess={() => setAccessModalOpen(false)}
          />
        ) : null}
      </main>
    );
  }

  return (
    <main className="events-page event-detail-page">
      <div className="event-detail-breadcrumbs">
        <Link to="/eventos">Eventos</Link>
        <span>/</span>
        <strong>{evento.nombre}</strong>
      </div>

      <section className="event-detail-hero">
        <div>
          <div className="event-detail-hero-top">
            {privateEvent ? (
              <span className="event-private-chip">
                <Lock size={13} />
                Privado
              </span>
            ) : (
              <span className="event-public-chip">
                <ShieldCheck size={13} />
                Público
              </span>
            )}

            <span className={`event-status ${eventStatus.className}`}>
              {eventStatus.label}
            </span>

            {/* No me gusta que se muestre arriba el estado la votacion seleccionada pq ya se ve abajo me parece redundante
            <span className={`voting-status-chip ${getVotingEstadoClass(selectedVotingEstado)}`}>
              {selectedVoting
                ? `Votación ${getVotingEstadoLabel(selectedVotingEstado)}`
                : "Sin votación"}
            </span>
            */}

            {privateEvent ? (
              <span className="event-code-chip">
                <Star size={13} />
                Código: {getEventCode(evento)}
              </span>
            ): null}
            
          </div>

          <h1>{evento.nombre}</h1>
          <p>{evento.descripcion || "Evento de votación y evaluación de proyectos."}</p>

          <div className="event-detail-meta">
            <span>
              <Calendar size={16} />
              Inicio: {formatDate(getEventStart(evento))}
            </span>
            <span>
              <Clock size={16} />
              Fin: {formatDate(getEventEnd(evento))}
            </span>
            <span>
              <FolderKanban size={16} />
              {proyectos.length} proyectos
            </span>
            <span>
              <Vote size={16} />
              {votaciones.length} votaciones
            </span>
          </div>
        </div>

        <div className="event-detail-actions">
          {puedeGestionar ? (
            <>
              <button
                className="primary-btn"
                type="button"
                onClick={() => setCreateVotingModalOpen(true)}
              >
                <Plus size={17} />
                Nueva Votación
              </button>

              <button
                className="danger-btn"
                type="button"
                onClick={() => setDeleteEventModalOpen(true)}
                disabled={eventHasVotes}
                title={eventHasVotes ? "No se puede eliminar un evento con votos emitidos" : "Eliminar evento"}
              >
                <Trash2 size={17} />
                Eliminar Evento
              </button>
            </>
          ) : null}

          {votaciones.length > 0 ? (
            <button
              className="secondary-btn"
              type="button"
              onClick={() => {
                const rankingVotingId = selectedVotingId || votaciones[0]?.id;
                if (rankingVotingId) {
                  navigate(`/eventos/${eventoId}/votaciones/${rankingVotingId}/resultados`);
                }
              }}
            >
              <BarChart3 size={17} />
              Ver Resultados
            </button>
          ) : null}
        </div>
      </section>

      {error ? <div className="feedback-card error-box">{error}</div> : null}
      {success ? <div className="feedback-card success-box">{success}</div> : null}

      <section className="event-detail-stats">
        <div>
          <Trophy size={22} />
          <strong>{proyectos.length}</strong>
          <span>Proyectos</span>
        </div>

        <div>
          <Vote size={22} />
          <strong>{openVotingCount}</strong>
          <span>Votaciones abiertas</span>
        </div>

        <div>
          <Users size={22} />
          <strong>
            {selectedVotingVotes}
          </strong>
          <span>Votos en selección</span>
        </div>

        <div>
          <CheckCircle size={22} />
          <strong>{totalEventVotes}</strong>
          <span>Votos totales</span>
        </div>
      </section>

      <section className="event-detail-votings-card">
        <div className="event-detail-section-header">
          <div>
            <h2>Votaciones del evento</h2>
            <p>Selecciona una votación para ver sus proyectos, fechas y controles.</p>
          </div>
        </div>

        {votaciones.length === 0 ? (
          <div className="feedback-card">
            Este evento todavía no tiene votaciones configuradas.
          </div>
        ) : (
          <>
          <div className="event-detail-tabs">
            {votaciones.map((votacion) => {
              const estado = getVotingEstado(votacion);

              return (
                <div
                  key={votacion.id}
                  className={`event-detail-tab-wrapper ${
                    String(selectedVotingId) === String(votacion.id) ? "active" : ""
                  }`}
                >
                  <button
                    type="button"
                    className="event-detail-tab"
                    onClick={() => setSelectedVotingId(votacion.id)}
                  >
                    <div className="voting-tab-title-row">
                      <span>{votingLabel(votacion)}</span>

                      <strong className={`voting-status-chip ${getVotingEstadoClass(estado)}`}>
                        {getVotingEstadoLabel(estado)}
                      </strong>
                    </div>

                    <small>{votingSubtitle(votacion)}</small>
                    <div className="voting-comments-badges">
                      <span className={`voting-comments-chip ${getVotingCommentsClass(votacion)}`}>
                        {getVotingCommentsLabel(votacion)}
                      </span>
                    </div>
                    <small>Inicio: {formatDate(getVotingStart(votacion))}</small>
                    <small>Fin: {formatDate(getVotingEnd(votacion))}</small>
                  </button>

                  {puedeGestionar ? (
                    <div className="voting-control-buttons">
                      {estado === "PENDIENTE" ? (
                        <button
                          type="button"
                          className="voting-control-btn open"
                          onClick={() => handleCambiarEstadoVotacion("abrir", votacion.id)}
                          title="Abrir votación"
                        >
                          <Play size={15} />
                        </button>
                      ) : null}

                      {estado === "ABIERTA" ? (
                        <button
                          type="button"
                          className="voting-control-btn pause"
                          onClick={() => handleCambiarEstadoVotacion("pausar", votacion.id)}
                          title="Pausar votación"
                        >
                          <Pause size={15} />
                        </button>
                      ) : null}

                      {estado === "PAUSADA" ? (
                        <button
                          type="button"
                          className="voting-control-btn resume"
                          onClick={() => handleCambiarEstadoVotacion("reanudar", votacion.id)}
                          title="Reanudar votación"
                        >
                          <RefreshCw size={15} />
                        </button>
                      ) : null}

                      {estado !== "CERRADA" ? (
                        <button
                          type="button"
                          className="voting-control-btn close"
                          onClick={() => handleCambiarEstadoVotacion("cerrar", votacion.id)}
                          title="Cerrar votación"
                        >
                          <Square size={15} />
                        </button>
                      ) : null}

                      <button
                        type="button"
                        className="delete-voting-btn"
                        onClick={() => openDeleteVotingModal(votacion)}
                        disabled={Number(votesByVotingId[votacion.id] || 0) > 0}
                        title="Eliminar votación"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          {selectedVoting ? (
            <div className="event-voting-overview">
              <div className="event-voting-overview-main">
                <div className="event-voting-overview-icon">
                  <Vote size={20} />
                </div>
                <div>
                  <span className="event-voting-overview-eyebrow">Votacion seleccionada</span>
                  <h3>{votingLabel(selectedVoting)}</h3>
                  <p>{votingSubtitle(selectedVoting)}</p>
                </div>
              </div>

              <div className="event-voting-overview-metrics">
                <span>
                  <Calendar size={15} />
                  {formatDate(getVotingStart(selectedVoting))} - {formatDate(getVotingEnd(selectedVoting))}
                </span>
                <span>
                  <FolderKanban size={15} />
                  {displayedProjects.length} proyectos
                </span>
                <span>
                  <CheckCircle size={15} />
                  {selectedVotingVotes} votos
                </span>
              </div>

              <button
                className="secondary-btn"
                type="button"
                onClick={() => navigate(`/eventos/${eventoId}/votaciones/${selectedVoting.id}/resultados`)}
              >
                <BarChart3 size={17} />
                Ver resultados
              </button>
            </div>
          ) : null}
          </>
        )}
      </section>

      <section className="event-detail-projects-section">
        <div className="event-detail-section-header">
          <div>
            <h2>Proyectos participantes</h2>
            <p>
              {selectedVoting
                ? `Mostrando proyectos para ${votingLabel(selectedVoting)}.`
                : "Selecciona una votación para ver los proyectos."}
            </p>
          </div>

          {selectedVoting ? (
            <span className="event-selected-voting-chip">
              {selectedVoting.tipo} + {selectedVoting.modalidad}
            </span>
          ) : null}
        </div>

        {displayedProjects.length === 0 ? (
          <div className="feedback-card">
            {selectedVoting
              ? "No hay proyectos asignados a esta votación."
              : "No hay proyectos asignados a este evento."}
          </div>
        ) : (
          <div className="event-detail-project-grid">
            {displayedProjects.map((proyecto) => {
              const relation = relacionesByProjectId.get(String(proyecto.id));

              return (
                <EventProjectCard
                  key={proyecto.id}
                  eventoId={eventoId}
                  votingId={selectedVotingId}
                  proyecto={proyecto}
                  votacionProyecto={relation}
                  votes={relation ? voteCounts[relation.id] : 0}
                  votingOpen={selectedVotingEstado === "ABIERTA"}
                />
              );
            })}
          </div>
        )}
      </section>

      {createVotingModalOpen ? (
        <CreateVotingModal
          eventoId={eventoId}
          eventoNombre={evento.nombre}
          tipoEvento={evento.tipoEvento || evento.tipo_evento}
          onClose={() => setCreateVotingModalOpen(false)}
          onCreated={async () => {
            setCreateVotingModalOpen(false);
            setSuccess("Votación creada correctamente.");
            await loadEventData();
          }}
        />
      ) : null}

      {deleteEventModalOpen ? (
        <div
          className="delete-event-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setDeleteEventModalOpen(false);
            }
          }}
        >
          <div className="delete-event-modal">
            <div className="delete-event-icon">
              <Trash2 size={30} />
            </div>

            <h2>Eliminar evento</h2>

            <p>
              Vas a eliminar <strong>{evento.nombre}</strong>. Se eliminarán sus
              votaciones, votos, criterios, inscripciones y asignaciones.
            </p>

            <div className="delete-event-warning">
              Los proyectos NO se eliminarán. Se conservarán sin evento asignado.
            </div>

            <div className="delete-event-actions">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setDeleteEventModalOpen(false)}
                disabled={deletingEvent}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="danger-btn"
                onClick={confirmDeleteEvento}
                disabled={deletingEvent || eventHasVotes}
              >
                <Trash2 size={17} />
                {deletingEvent ? "Eliminando..." : "Eliminar evento"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteVotingModalOpen ? (
        <div
          className="delete-event-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setDeleteVotingModalOpen(false);
              setVotingToDelete(null);
            }
          }}
        >
          <div className="delete-event-modal">
            <div className="delete-event-icon">
              <Trash2 size={30} />
            </div>

            <h2>Eliminar votación</h2>

            <p>
              Vas a eliminar <strong>{votingLabel(votingToDelete)}</strong>. Se eliminarán
              sus relaciones con proyectos, votos y resultados asociados.
            </p>

            <div className="delete-event-warning">
              El evento y los proyectos NO se eliminarán.
            </div>

            <div className="delete-event-actions">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => {
                  setDeleteVotingModalOpen(false);
                  setVotingToDelete(null);
                }}
                disabled={deletingVoting}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="danger-btn"
                onClick={confirmDeleteVotacion}
                disabled={deletingVoting}
              >
                <Trash2 size={17} />
                {deletingVoting ? "Eliminando..." : "Eliminar votación"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default EventDetailScreen;
