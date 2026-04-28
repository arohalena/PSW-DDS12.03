import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  ExternalLink,
  Github,
  MessageCircle,
  Presentation,
  Star,
  Trophy,
  Users,
  Vote,
} from "lucide-react";
import { getProyectos } from "../../services/proyectoService";
import { getEventos } from "../../services/eventoService";
import { getEquipos } from "../../services/equipoService";
import { getComentariosByProyecto } from "../../services/comentarioService";
import {
  getAsignacionesCompetidorEvento,
  getConteoVotos,
  getVotacionProyectosByVotacion,
  getVotacionesByEvento,
} from "../../services/votacionService";
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

function getEventEnd(evento) {
  return evento?.fecha_fin || evento?.fechaFin || evento?.fin;
}

function initials(name = "", email = "") {
  const base = name || email || "P";
  return (
    base
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "P"
  );
}

function getCategoryLabel(category) {
  if (category === "IA") return "Inteligencia Artificial";
  if (category === "SOSTENIBILIDAD") return "Sostenibilidad";
  return category || "Proyecto";
}

function ProjectDetailScreen() {
  const { eventoId, proyectoId, projectId } = useParams();
  const navigate = useNavigate();
  const idProyecto = proyectoId || projectId;

  const [proyecto, setProyecto] = useState(null);
  const [evento, setEvento] = useState(null);
  const [equipo, setEquipo] = useState(null);
  const [miembros, setMiembros] = useState([]);
  const [votacionesProyecto, setVotacionesProyecto] = useState([]);
  const [comentarios, setComentarios] = useState([]);
  const [totalVotos, setTotalVotos] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const eventoFinalId = eventoId || proyecto?.evento?.id || evento?.id;

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");

        const [proyectosData, eventosData, equiposData] = await Promise.all([
          getProyectos().catch(() => []),
          getEventos().catch(() => []),
          getEquipos().catch(() => []),
        ]);

        const proyectoEncontrado = proyectosData.find(
          (p) => String(p.id) === String(idProyecto)
        );

        if (!proyectoEncontrado) {
          throw new Error("No se encontró el proyecto.");
        }

        const equipoEncontrado =
          equiposData.find(
            (item) => String(item.proyecto?.id) === String(idProyecto)
          ) || null;

        const effectiveEventoId =
          eventoId ||
          proyectoEncontrado?.evento?.id ||
          equipoEncontrado?.evento?.id ||
          "";

        const eventoEncontrado =
          eventosData.find((item) => String(item.id) === String(effectiveEventoId)) ||
          proyectoEncontrado.evento ||
          equipoEncontrado?.evento ||
          null;

        setProyecto(proyectoEncontrado);
        setEvento(eventoEncontrado);
        setEquipo(equipoEncontrado);

        const comentariosData = await getComentariosByProyecto(idProyecto).catch(() => []);
        setComentarios(comentariosData || []);

        if (effectiveEventoId) {
          const asignacionesEvento = await getAsignacionesCompetidorEvento(effectiveEventoId).catch(() => []);

          const miembrosEquipo = asignacionesEvento
            .filter((asignacion) => String(asignacion.equipo?.id) === String(equipoEncontrado?.id))
            .map((asignacion) => asignacion.competidor)
            .filter(Boolean);

          setMiembros(miembrosEquipo);

          const votaciones = await getVotacionesByEvento(effectiveEventoId).catch(() => []);
          const relaciones = [];

          for (const votacion of votaciones || []) {
            const proyectosVotacion = await getVotacionProyectosByVotacion(votacion.id).catch(() => []);
            const relacion = proyectosVotacion.find(
              (item) => String(item.proyecto?.id) === String(idProyecto)
            );

            if (relacion) {
              relaciones.push({ ...relacion, votacion });
            }
          }

          setVotacionesProyecto(relaciones);

          let votos = 0;
          for (const relacion of relaciones) {
            votos += Number(await getConteoVotos(relacion.id).catch(() => 0));
          }

          setTotalVotos(votos);
        }
      } catch (err) {
        setError(err.message || "No se pudo cargar el proyecto.");
      } finally {
        setLoading(false);
      }
    }

    if (idProyecto) load();
  }, [idProyecto, eventoId]);

  const promedioMock = useMemo(() => {
    if (votacionesProyecto.length === 0) return "—";
    return totalVotos > 0 ? "4.6" : "—";
  }, [totalVotos, votacionesProyecto]);

  if (loading) {
    return (
      <main className="projects-page">
        <div className="project-feedback">Cargando proyecto...</div>
      </main>
    );
  }

  if (error || !proyecto) {
    return (
      <main className="projects-page">
        <div className="project-feedback error-box">{error || "Proyecto no encontrado."}</div>
      </main>
    );
  }

  return (
    <main className="projects-page project-detail-page mock-project-detail">
      <div className="project-breadcrumbs">
        <Link to="/eventos">Eventos</Link>
        <span>/</span>
        {eventoFinalId ? (
          <Link to={`/eventos/${eventoFinalId}`}>{evento?.nombre || "Evento"}</Link>
        ) : (
          <Link to="/proyectos">Proyectos</Link>
        )}
        <span>/</span>
        <strong>{proyecto.nombre}</strong>
      </div>

      <section className="mock-project-hero">
        <div className="mock-project-hero-main">
          <button className="project-back-btn" type="button" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} />
            Volver
          </button>

          <div className="mock-project-tags">
            <span>{getCategoryLabel(proyecto.tipoCategoria)}</span>
            <span className="success">Proyecto activo</span>
          </div>

          <h1>{proyecto.nombre}</h1>
          <p>{proyecto.descripcion || "Proyecto participante en el evento de votación."}</p>

          <div className="mock-project-meta-grid">
            <div>
              <Trophy size={18} />
              <span>Evento</span>
              <strong>{evento?.nombre || "Sin evento"}</strong>
            </div>

            <div>
              <Users size={18} />
              <span>Equipo</span>
              <strong>{equipo?.nombre || "Sin equipo"}</strong>
            </div>

          </div>
        </div>

        <aside className="mock-project-score-card">
          <div className="mock-score-ring">
            <strong>{promedioMock}</strong>
            <span>Puntuación</span>
          </div>

          <div className="mock-score-stats">
            <div>
              <strong>{totalVotos}</strong>
              <span>Votos</span>
            </div>
            <div>
              <strong>{miembros.length}</strong>
              <span>Miembros</span>
            </div>
            <div>
              <strong>{votacionesProyecto.length}</strong>
              <span>Votaciones</span>
            </div>
          </div>

          <button
            type="button"
            className="primary-btn full-width-btn"
            disabled={!eventoFinalId}
            onClick={() => {
  const votacionId = votacionesProyecto[0]?.votacion?.id;

  if (!votacionId) {
    alert("Este proyecto no está asignado a ninguna votación.");
    return;
  }

  navigate(
    `/eventos/${eventoFinalId}/votaciones/${votacionId}/proyectos/${proyecto.id}/votar`
  );
}}
          >
            <Vote size={17} />
            Votar por este proyecto
          </button>

          {votacionesProyecto[0]?.votacion?.id ? (
            <button
              type="button"
              className="secondary-btn full-width-btn"
              onClick={() =>
                navigate(`/eventos/${eventoFinalId}/votaciones/${votacionesProyecto[0].votacion.id}/resultados`)
              }
            >
              <BarChart3 size={17} />
              Ver resultados
            </button>
          ) : null}
        </aside>
      </section>

      <section className="mock-project-content-grid">
        <article className="mock-card">
          <h2>Información del equipo</h2>

          <div className="mock-team-summary">
            <div className="mock-team-avatar">{initials(equipo?.nombre)}</div>
            <div>
              <strong>{equipo?.nombre || "Sin equipo asignado"}</strong>
              <span>{miembros.length} miembro{miembros.length === 1 ? "" : "s"} registrados</span>
            </div>
          </div>

          <div className="mock-members-list">
            {miembros.length === 0 ? (
              <p className="project-muted">No hay competidores asignados al equipo.</p>
            ) : (
              miembros.map((miembro) => (
                <div className="mock-member-row" key={miembro.id}>
                  <div>{initials(miembro.nombre, miembro.email)}</div>
                  <section>
                    <strong>{miembro.nombre}</strong>
                    <span>{miembro.email}</span>
                  </section>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="mock-card">
          <h2>Votaciones asociadas</h2>

          <div className="mock-votings-list">
            {votacionesProyecto.length === 0 ? (
              <p className="project-muted">Este proyecto todavía no está asignado a ninguna votación.</p>
            ) : (
              votacionesProyecto.map((relacion) => (
                <div className="mock-voting-row" key={relacion.id}>
                  <div>
                    <strong>{relacion.votacion?.tipo} + {relacion.votacion?.modalidad}</strong>
                    <span>Máximo {relacion.votacion?.maxSelecciones || 1} selección/es</span>
                  </div>
                  <Star size={18} />
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="mock-card mock-gallery-card">
        <div className="mock-section-heading">
          <div>
            <h2>Galería del proyecto</h2>
            <p>Capturas, demo y material visual del proyecto.</p>
          </div>
        </div>

        <div className="mock-gallery-grid">
          <div>
            <span>Preview</span>
          </div>
          <div>
            <span>Demo</span>
          </div>
          <div>
            <span>Pitch deck</span>
          </div>
        </div>
      </section>

      <section className="mock-card mock-feedback-section">
        <div className="mock-section-heading">
          <div>
            <h2>Feedback y comentarios</h2>
            <p>Comentarios generales y comentarios asociados a criterios.</p>
          </div>
          <span className="feedback-count">{comentarios.length}</span>
        </div>

        <div className="mock-comments-list">
          {comentarios.length === 0 ? (
            <div className="mock-empty-feedback">
              <MessageCircle size={24} />
              <strong>Todavía no hay feedback</strong>
              <span>Cuando el jurado o los votantes comenten, aparecerá aquí.</span>
            </div>
          ) : (
            comentarios.map((comentario) => (
              <article className="mock-comment-card" key={comentario.id}>
                <div className="mock-comment-icon">
                  <MessageCircle size={18} />
                </div>

                <div>
                  <div className="mock-comment-header">
                    <strong>
                      {comentario.criterio?.nombre
                        ? `Criterio: ${comentario.criterio.nombre}`
                        : "Comentario general"}
                    </strong>
                    {comentario.createdAt ? (
                      <span>{new Date(comentario.createdAt).toLocaleString("es-ES")}</span>
                    ) : null}
                  </div>

                  <p>{comentario.texto}</p>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

export default ProjectDetailScreen;