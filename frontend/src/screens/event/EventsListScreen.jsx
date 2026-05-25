import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Calendar,
  Clock,
  FolderKanban,
  Lock,
  Plus,
  Search,
  ShieldCheck,
  Users,
  Vote,
} from "lucide-react";
import { getEventos } from "../../services/eventoService";
import { getProyectosByEvento } from "../../services/proyectoService";
import { getVotantesPorEvento } from "../../services/votacionService";
import { esOrganizador } from "../../services/sessionService";
import EventAccessModal from "./EventAccessModal";
import "../../styles/events.css";

function formatDate(dateValue) {
  if (!dateValue) return "Sin fecha";
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateValue));
}

function getEventStart(evento) {
  return evento.fecha_inicio || evento.fechaInicio || evento.inicio;
}

function getEventEnd(evento) {
  return evento.fecha_fin || evento.fechaFin || evento.fin;
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

  return { label: "Votación activa", className: "status-active" };
}

function getTypeLabel(tipo) {
  switch (tipo) {
    case "HACKATHON":
      return "Hackathon";
    case "FERIA_INOVACION":
      return "Feria de innovación";
    default:
      return tipo || "Evento";
  }
}

function isPrivateEvent(evento) {
  return Boolean(evento.codigoAccesoPublico || evento.codigoAcceso);
}

function hasEventAccess(evento, puedeGestionarEventos) {
  if (!isPrivateEvent(evento) || puedeGestionarEventos) return true;

  return (
    localStorage.getItem(`votify_event_access_${evento.id}`) === "true"
  );
}

function EventsListScreen() {
  const navigate = useNavigate();
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCounts, setLoadingCounts] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("TODOS");
  const [proyectosPorEvento, setProyectosPorEvento] = useState({});
  const [votantesPorEvento, setVotantesPorEvento] = useState({});
  const [selectedEvent, setSelectedEvent] = useState(null);

  const puedeGestionarEventos = esOrganizador();

  useEffect(() => {
    let cancelled = false;

    async function loadEventos() {
      try {
        setLoading(true);
        setError("");

        const data = await getEventos();
        if (cancelled) return;

        const safeEventos = Array.isArray(data) ? data : [];
        setEventos(safeEventos);
        setLoading(false);
        setLoadingCounts(true);

        const projectCounts = {};
        const voterCounts = {};

        await Promise.all(
          safeEventos.map(async (evento) => {
            const [proyectos, votantes] = await Promise.all([
              getProyectosByEvento(evento.id).catch(() => []),
              getVotantesPorEvento(evento.id).catch(() => 0),
            ]);

            projectCounts[evento.id] = proyectos.length;
            voterCounts[evento.id] = votantes;
          })
        );

        if (cancelled) return;
        setProyectosPorEvento(projectCounts);
        setVotantesPorEvento(voterCounts);
      } catch (err) {
        if (!cancelled) setError(err.message || "No se pudieron cargar los eventos");
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadingCounts(false);
        }
      }
    }

    loadEventos();

    return () => {
      cancelled = true;
    };
  }, []);

  const eventSummary = useMemo(() => {
    return eventos.reduce(
      (summary, evento) => {
        const status = getEventStatus(evento);

        return {
          total: summary.total + 1,
          active: summary.active + (status.className === "status-active" ? 1 : 0),
          planning: summary.planning + (status.className === "status-planning" ? 1 : 0),
          private: summary.private + (isPrivateEvent(evento) ? 1 : 0),
        };
      },
      { total: 0, active: 0, planning: 0, private: 0 }
    );
  }, [eventos]);

  const statusFilterOptions = [
    { value: "TODOS", label: "Todos" },
    { value: "Votación activa", label: "Activos" },
    { value: "Planificación", label: "Planificados" },
    { value: "Finalizado", label: "Finalizados" },
  ];

  const filteredEventos = useMemo(() => {
    return [...eventos]
      .sort((a, b) => String(getEventStart(a) || "").localeCompare(String(getEventStart(b) || "")))
      .filter((evento) => {
        const status = getEventStatus(evento);

        const text = [
          evento.nombre,
          evento.descripcion,
          evento.codigoAccesoPublico,
          evento.codigoAcceso,
          evento.tipo,
          evento.tipoEvento,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchesSearch = text.includes(search.toLowerCase());
        const matchesStatus = selectedStatus === "TODOS" || status.label === selectedStatus;

        return matchesSearch && matchesStatus;
      });
  }, [eventos, search, selectedStatus]);

  function handleEventClick(evento) {
    if (!hasEventAccess(evento, puedeGestionarEventos)) {
      setSelectedEvent(evento);
      return;
    }

    navigate(`/eventos/${evento.id}`);
  }

  return (
    <main className="events-page events-mock-page">
      <header className="events-header">
        <div>
          <h1>{puedeGestionarEventos ? "Gestión de eventos" : "Eventos"}</h1>
          <p>
            {puedeGestionarEventos
              ? "Administra eventos, votaciones, proyectos y resultados."
              : "Explora eventos disponibles y participa en sus votaciones."}
          </p>
        </div>

        {puedeGestionarEventos ? (
          <Link className="primary-btn events-create-btn" to="/eventos/crear">
            <Plus size={18} />
            Nuevo Evento
          </Link>
        ) : null}
      </header>

      {!puedeGestionarEventos ? (
        <div className="feedback-card warning-box">
          Solo los organizadores pueden crear y configurar eventos.
        </div>
      ) : null}

      <section className="events-summary-strip">
        <article className="events-summary-card summary-total">
          <div className="events-summary-icon">
            <Calendar size={18} />
          </div>
          <span>Total eventos</span>
          <strong>{eventSummary.total}</strong>
        </article>
        <article className="events-summary-card summary-active">
          <div className="events-summary-icon">
            <Vote size={18} />
          </div>
          <span>En votación</span>
          <strong>{eventSummary.active}</strong>
        </article>
        <article className="events-summary-card summary-planning">
          <div className="events-summary-icon">
            <Clock size={18} />
          </div>
          <span>Planificados</span>
          <strong>{eventSummary.planning}</strong>
        </article>
        <article className="events-summary-card summary-private">
          <div className="events-summary-icon">
            <Lock size={18} />
          </div>
          <span>Privados</span>
          <strong>{eventSummary.private}</strong>
        </article>
      </section>

      {loading ? (
        <div className="feedback-card">Cargando eventos...</div>
      ) : error ? (
        <div className="feedback-card error-box">{error}</div>
      ) : (
        <>
          <section className="events-filters">
            <div className="events-search-wrapper">
              <Search size={18} className="events-search-icon" />
              <input
                type="text"
                placeholder="Buscar eventos..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <div className="events-status-segment" role="group" aria-label="Filtrar eventos por estado">
              {statusFilterOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={selectedStatus === option.value ? "active" : ""}
                  onClick={() => setSelectedStatus(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {loadingCounts ? <span className="events-counts-loading">Actualizando datos...</span> : null}
          </section>

          {filteredEventos.length === 0 ? (
            <div className="feedback-card">
              No hay eventos que coincidan con la búsqueda actual.
            </div>
          ) : (
            <section className="events-grid">
              {filteredEventos.map((evento) => {
                const status = getEventStatus(evento);
                const privateEvent = isPrivateEvent(evento);
                const unlocked = hasEventAccess(evento, puedeGestionarEventos);

                return (
                  <article
                    className="event-card event-card-clickable"
                    key={evento.id}
                    onClick={() => handleEventClick(evento)}
                  >
                    <div className="event-card-header">
                      <div>
                        <div className="event-card-title-row">
                          <h3>{evento.nombre}</h3>
                          <span className={`event-status ${status.className}`}>{status.label}</span>
                        </div>
                        <p>{evento.descripcion || "Evento de votación y evaluación de proyectos."}</p>
                      </div>
                    </div>

                    <div className="event-card-meta">
                      <div className="event-meta-item event-date-range">
                        <Calendar size={16} />
                        <span>{formatDate(getEventStart(evento))}</span>
                        <span className="date-separator">-</span>
                        <span>{formatDate(getEventEnd(evento))}</span>
                      </div>

                      {privateEvent ? (
                        <div className="event-meta-item private-meta">
                          <Lock size={16} />
                          <span>{unlocked ? "Privado desbloqueado" : "Privado"}</span>
                        </div>
                      ) : (
                        <div className="event-meta-item public-meta">
                          <ShieldCheck size={16} />
                          <span>Público</span>
                        </div>
                      )}
                    </div>

                    <div className="event-type-row">
                      <span className="event-type-chip">{getTypeLabel(evento.tipo || evento.tipoEvento)}</span>
                      {privateEvent && !unlocked ? (
                        <span className="event-private-chip">
                          <Lock size={13} />
                          Requiere código
                        </span>
                      ) : null}
                    </div>

                    <div className="event-card-stats">
                      <div className="event-stat-box">
                        <div className="event-stat-icon projects-icon">
                          <FolderKanban size={18} />
                        </div>
                        <div>
                          <span className="event-stat-label">Proyectos</span>
                          <strong>{proyectosPorEvento[evento.id] ?? "..."}</strong>
                        </div>
                      </div>

                      <div className="event-stat-box">
                        <div className="event-stat-icon voters-icon">
                          <Users size={18} />
                        </div>
                        <div>
                          <span className="event-stat-label">Votantes</span>
                          <strong>{votantesPorEvento[evento.id] ?? "..."}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="event-card-footer">
                      {privateEvent && !unlocked ? (
                        <>
                          <Lock size={14} />
                          Introducir código de acceso
                        </>
                      ) : (
                        <>
                          Ver proyectos, votaciones y resultados
                          <ArrowRight size={15} />
                        </>
                      )}
                    </div>
                  </article>
                );
              })}
            </section>
          )}
        </>
      )}

      {selectedEvent ? (
        <EventAccessModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onSuccess={() => {
            const id = selectedEvent.id;
            setSelectedEvent(null);
            navigate(`/eventos/${id}`);
          }}
        />
      ) : null}
    </main>
  );
}

export default EventsListScreen;
