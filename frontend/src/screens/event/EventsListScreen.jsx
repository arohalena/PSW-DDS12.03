import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Calendar,
  FolderKanban,
  Lock,
  Plus,
  Search,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { getEventos, getEventoByCodigo } from "../../services/eventoService";
import { getProyectosByEvento } from "../../services/proyectoService";
import { getVotantesPorEvento } from "../../services/votacionService";
import { esOrganizador } from "../../services/sessionService";
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

function getEventCode(evento) {
  return evento.codigoAccesoPublico || evento.codigoAcceso || "";
}

function hasEventAccess(evento) {
  if (!isPrivateEvent(evento)) return true;
  return localStorage.getItem(`votify_event_access_${evento.id}`) === "true";
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

      setError("Código incorrecto. Por favor, verifica e intenta nuevamente.");
    } catch {
      setError("Código incorrecto. Por favor, verifica e intenta nuevamente.");
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
              <span>Solicita el código al organizador si aún no lo tienes.</span>
            </div>
          </div>

          <label className="event-access-field">
            <span>Ingresa tu código de acceso</span>
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
              {checking ? "Verificando..." : "Acceder al Evento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EventsListScreen() {
  const navigate = useNavigate();
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("TODOS");
  const [proyectosPorEvento, setProyectosPorEvento] = useState({});
  const [votantesPorEvento, setVotantesPorEvento] = useState({});
  const [selectedEvent, setSelectedEvent] = useState(null);

  const puedeGestionarEventos = esOrganizador();

  useEffect(() => {
    async function loadEventos() {
      try {
        setLoading(true);
        setError("");

        const data = await getEventos();
        setEventos(data || []);

        const projectCounts = {};
        const voterCounts = {};

        await Promise.all(
          (data || []).map(async (evento) => {
            const [proyectos, votantes] = await Promise.all([
              getProyectosByEvento(evento.id).catch(() => []),
              getVotantesPorEvento(evento.id).catch(() => 0),
            ]);

            projectCounts[evento.id] = proyectos.length;
            voterCounts[evento.id] = votantes;
          })
        );

        setProyectosPorEvento(projectCounts);
        setVotantesPorEvento(voterCounts);
      } catch (err) {
        setError(err.message || "No se pudieron cargar los eventos");
      } finally {
        setLoading(false);
      }
    }

    loadEventos();
  }, []);

  const filteredEventos = useMemo(() => {
    return eventos.filter((evento) => {
      const status = getEventStatus(evento);

      const text = [
        evento.nombre,
        evento.descripcion,
        evento.codigoAccesoPublico,
        evento.codigoAcceso,
        evento.tipo,
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
    if (isPrivateEvent(evento) && !hasEventAccess(evento)) {
      setSelectedEvent(evento);
      return;
    }

    navigate(`/eventos/${evento.id}`);
  }

  return (
    <main className="events-page events-mock-page">
      <header className="events-header">
        <div>
          <h1>Gestión de Eventos</h1>
          <p>Administra todos tus eventos de votación</p>
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

            <select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)}>
              <option value="TODOS">Todos los estados</option>
              <option value="Votación activa">Votación activa</option>
              <option value="Planificación">Planificación</option>
              <option value="Finalizado">Finalizado</option>
            </select>
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

                return (
                  <article
                    className="event-card event-card-clickable"
                    key={evento.id}
                    onClick={() => handleEventClick(evento)}
                  >
                    <div className="event-card-header">
                      <div>
                        <h3>{evento.nombre}</h3>
                        <p>{evento.descripcion || "Evento de votación y evaluación de proyectos."}</p>
                      </div>
                    </div>

                    <div className="event-card-meta">
                      <div className="event-meta-item">
                        <Calendar size={16} />
                        <span>{formatDate(getEventStart(evento))}</span>
                      </div>

                      {privateEvent ? (
                        <div className="event-meta-item private-meta">
                          <Lock size={16} />
                          <span>Privado</span>
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
                      {privateEvent ? (
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
                          <strong>{proyectosPorEvento[evento.id] ?? 0}</strong>
                        </div>
                      </div>

                      <div className="event-stat-box">
                        <div className="event-stat-icon voters-icon">
                          <Users size={18} />
                        </div>
                        <div>
                          <span className="event-stat-label">Votantes</span>
                          <strong>{votantesPorEvento[evento.id] ?? 0}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="event-card-footer">
                      {privateEvent ? (
                        <>
                          <Lock size={14} />
                          Requiere código de acceso →
                        </>
                      ) : (
                        "Ver proyectos, votaciones y resultados →"
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