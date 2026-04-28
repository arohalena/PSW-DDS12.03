import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  FolderKanban,
  Lock,
  Plus,
  ShieldCheck,
  Star,
  Trophy,
  Users,
  Vote,
  X,
} from "lucide-react";
import { getEventos, getEventoByCodigo } from "../../services/eventoService";
import { getProyectosByEvento } from "../../services/proyectoService";
import {
  getConteoVotos,
  getVotacionProyectosByVotacion,
  getVotacionesByEvento,
} from "../../services/votacionService";
import { esOrganizador } from "../../services/sessionService";
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

function isPrivateEvent(evento) {
  return Boolean(evento.codigoAccesoPublico || evento.codigoAcceso);
}

function getEventCode(evento) {
  return evento?.codigoAccesoPublico || evento?.codigoAcceso || "";
}

function hasEventAccess(eventoId, evento) {
  if (!isPrivateEvent(evento)) return true;
  return localStorage.getItem(`votify_event_access_${eventoId}`) === "true";
}

function votingLabel(votacion) {
  const tipo = votacion?.tipo === "JURADO" ? "Jurado" : "Popular";

  const modalidadMap = {
    SIMPLE: "Simple",
    PUNTOS: "Puntos",
    MULTICRITERIO: "Multicriterio",
    MULTICRITERIO_PONDERADA: "Ponderada",
  };

  return `${tipo} · ${modalidadMap[votacion?.modalidad] || votacion?.modalidad}`;
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
        localStorage.setItem(`votify_event_access_${event.id}`, "true");
        onSuccess();
        return;
      }

      const eventoPorCodigo = await getEventoByCodigo(code.trim());

      if (String(eventoPorCodigo.id) === String(event.id)) {
        localStorage.setItem(`votify_event_access_${event.id}`, "true");
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
    <div className="event-access-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
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

function ProjectCard({ eventoId, proyecto, votacionProyecto, votes }) {
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

          <span className="event-detail-project-badge">
            {votes ?? 0} votos
          </span>
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
              onClick={() =>
                navigate(
                  `/eventos/${eventoId}/votaciones/${votacionProyecto.votacion.id}/proyectos/${proyecto.id}/votar`
                )
              }
            >
              <Vote size={16} />
              Votar
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
  const [loading, setLoading] = useState(true);
  const [accessModalOpen, setAccessModalOpen] = useState(false);

  const puedeGestionar = esOrganizador();

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        const eventos = await getEventos();
        const found = eventos.find((item) => String(item.id) === String(eventoId));

        setEvento(found || null);

        const [proyectosData, votacionesData] = await Promise.all([
          getProyectosByEvento(eventoId).catch(() => []),
          getVotacionesByEvento(eventoId).catch(() => []),
        ]);

        setProyectos(proyectosData || []);
        setVotaciones(votacionesData || []);
        setSelectedVotingId(votacionesData?.[0]?.id || "");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [eventoId]);

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

  const selectedVoting = useMemo(
    () => votaciones.find((v) => String(v.id) === String(selectedVotingId)),
    [votaciones, selectedVotingId]
  );

  const relacionesByProjectId = useMemo(() => {
    const map = new Map();

    votacionProyectos.forEach((relacion) => {
      if (relacion.proyecto?.id) {
        map.set(String(relacion.proyecto.id), relacion);
      }
    });

    return map;
  }, [votacionProyectos]);

  if (loading) {
    return <main className="events-page"><div className="feedback-card">Cargando evento...</div></main>;
  }

  if (!evento) {
    return <main className="events-page"><div className="feedback-card error-box">Evento no encontrado.</div></main>;
  }

  const privateEvent = isPrivateEvent(evento);
  const canView = hasEventAccess(eventoId, evento);

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

            <span className="event-status status-active">Votación activa</span>
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
            <button
              className="primary-btn"
              onClick={() => navigate(`/eventos/${eventoId}/votaciones/crear`)}
            >
              <Plus size={17} />
              Nueva Votación
            </button>
          ) : null}

          {selectedVotingId ? (
            <button
              className="secondary-btn"
              onClick={() =>
                navigate(`/eventos/${eventoId}/votaciones/${selectedVotingId}/resultados`)
              }
            >
              <BarChart3 size={17} />
              Ver Resultados
            </button>
          ) : null}
        </div>
      </section>

      <section className="event-detail-stats">
        <div>
          <Trophy size={22} />
          <strong>{proyectos.length}</strong>
          <span>Proyectos</span>
        </div>

        <div>
          <Vote size={22} />
          <strong>{votaciones.length}</strong>
          <span>Votaciones</span>
        </div>

        <div>
          <Users size={22} />
          <strong>
            {Object.values(voteCounts).reduce((sum, value) => sum + Number(value || 0), 0)}
          </strong>
          <span>Votos emitidos</span>
        </div>

        <div>
          <CheckCircle size={22} />
          <strong>{selectedVoting ? selectedVoting.estado : "—"}</strong>
          <span>Estado actual</span>
        </div>
      </section>

      <section className="event-detail-votings-card">
        <div className="event-detail-section-header">
          <div>
            <h2>Votaciones del evento</h2>
            <p>Selecciona una votación para ver sus proyectos y resultados.</p>
          </div>
        </div>

        {votaciones.length === 0 ? (
          <div className="feedback-card">
            Este evento todavía no tiene votaciones configuradas.
          </div>
        ) : (
          <div className="event-detail-tabs">
            {votaciones.map((votacion) => (
              <button
                key={votacion.id}
                className={`event-detail-tab ${String(selectedVotingId) === String(votacion.id) ? "active" : ""}`}
                onClick={() => setSelectedVotingId(votacion.id)}
              >
                <span>{votingLabel(votacion)}</span>
                <small>Máx. {votacion.maxSelecciones || 1} selección/es</small>
              </button>
            ))}
          </div>
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

        {proyectos.length === 0 ? (
          <div className="feedback-card">No hay proyectos asignados a este evento.</div>
        ) : (
          <div className="event-detail-project-grid">
            {proyectos.map((proyecto) => {
              const relation = relacionesByProjectId.get(String(proyecto.id));

              return (
                <ProjectCard
                  key={proyecto.id}
                  eventoId={eventoId}
                  proyecto={proyecto}
                  votacionProyecto={relation}
                  votes={relation ? voteCounts[relation.id] : 0}
                />
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export default EventDetailScreen;