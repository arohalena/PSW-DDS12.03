import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, FolderKanban, Plus, Search, Users } from "lucide-react";
import { getEventos } from "../services/eventoService";
import { esOrganizador } from "../services/sessionService";
import "../styles/events.css";
import { getProyectosByEvento } from "../services/proyectoService";
import { getVotantesPorEvento } from "../services/votacionService";

function formatDate(dateValue) {
  if (!dateValue) return "Sin fecha";

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateValue));
}

function getEventStatus(evento) {
  const now = new Date();
  const start = new Date(evento.fecha_inicio);
  const end = new Date(evento.fecha_fin);

  if (now < start) {
    return { label: "Planificación", className: "status-planning" };
  }

  if (now > end) {
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
      return tipo || "Sin tipo";
  }
}

function EventsListScreen() {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("TODOS");
  const [proyectosPorEvento, setProyectosPorEvento] = useState({});
  const [votantesPorEvento, setVotantesPorEvento] = useState({});

  const puedeGestionarEventos = esOrganizador();

  useEffect(() => {
    const loadEventos = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getEventos();
        setEventos(data);

        const counts = {};
        const voterCounts = {};
        await Promise.all(
          data.map(async (evento) => {
            const [proyectos, votantes] = await Promise.all([
              getProyectosByEvento(evento.id),
              getVotantesPorEvento(evento.id),
            ]);
            counts[evento.id] = proyectos.length;
            voterCounts[evento.id] = votantes;
          })
        );
        setProyectosPorEvento(counts);
        setVotantesPorEvento(voterCounts);
      } catch (err) {
        setError(err.message || "No se pudieron cargar los eventos");
      } finally {
        setLoading(false);
      }
    };

    loadEventos();
  }, []);

  const filteredEventos = useMemo(() => {
    return eventos.filter((evento) => {
      const status = getEventStatus(evento);
      const matchesSearch =
        evento.nombre?.toLowerCase().includes(search.toLowerCase()) ||
        evento.descripcion?.toLowerCase().includes(search.toLowerCase()) ||
        evento.codigoAccesoPublico?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        selectedStatus === "TODOS" || status.label === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [eventos, search, selectedStatus]);

  return (
    <main className="events-page">
      <header className="events-header">
        <div>
          <h1>Gestión de Eventos</h1>
          <p>Administra todos tus eventos de votación</p>
        </div>

        {puedeGestionarEventos && (
          <Link className="primary-btn events-create-btn" to="/eventos/crear">
            <Plus size={18} />
            Crear Evento
          </Link>
        )}
      </header>

      {!puedeGestionarEventos && (
        <div className="feedback-card warning-box">
          Solo los organizadores pueden crear y configurar eventos.
        </div>
      )}

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

            <select
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}
            >
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

                return (
                  <article className="event-card" key={evento.id}>
                    <div className="event-card-header">
                      <div>
                        <h3>{evento.nombre}</h3>
                        <p>{evento.descripcion}</p>
                      </div>
                      <span className={`event-status ${status.className}`}>
                        {status.label}
                      </span>
                    </div>

                    <div className="event-card-meta">
                      <div className="event-meta-item">
                        <Calendar size={16} />
                        <span>{formatDate(evento.fecha_inicio)}</span>
                      </div>
                      <div className="event-meta-item code-item">
                        <span className="event-code-label">Código:</span>
                        <span className="event-code-value">
                          {evento.codigoAccesoPublico}
                        </span>
                      </div>
                    </div>

                    <div className="event-type-chip">{getTypeLabel(evento.tipoEvento)}</div>

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

                    <div className="event-card-actions">
                      <button className="secondary-btn" disabled>
                        Editar
                      </button>
                      <Link className="secondary-btn" to={`/eventos/${evento.id}/proyectos`}>
                        Proyectos
                      </Link>
                      <button className="primary-btn" disabled>
                        Ver Resultados
                      </button>
                    </div>
                  </article>
                );
              })}
            </section>
          )}
        </>
      )}
    </main>
  );
}

export default EventsListScreen;
