import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  MessageCircle,
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
import { getRanking } from "../../services/criterioService";
import "../../styles/projects.css";

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

function votingLabel(votacion) {
  return votacion?.nombre || `${votacion?.tipo || "Votación"} + ${votacion?.modalidad || ""}`;
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
  const [voteCountsByRelation, setVoteCountsByRelation] = useState({});
  const [rankingByVotingId, setRankingByVotingId] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedVotingId, setSelectedVotingId] = useState("");

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
          proyectoEncontrado.equipo ||
          equiposData.find(
            (item) => String(item.id) === String(proyectoEncontrado.equipo?.id)
          ) ||
          equiposData.find(
            (item) => String(item.proyecto?.id) === String(idProyecto)
          ) ||
          null;

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

          const miembrosEquipo = equipoEncontrado
            ? asignacionesEvento
                .filter(
                  (asignacion) =>
                    String(asignacion.equipo?.id) === String(equipoEncontrado.id)
                )
                .map((asignacion) => asignacion.competidor)
                .filter(Boolean)
            : [];

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

          const counts = {};
          const rankings = {};
          for (const relacion of relaciones) {
            counts[relacion.id] = Number(await getConteoVotos(relacion.id).catch(() => 0));
            if (relacion.votacion?.id) {
              rankings[relacion.votacion.id] = await getRanking(
                effectiveEventoId,
                relacion.votacion.id
              ).catch(() => []);
            }
          }

          setVoteCountsByRelation(counts);
          setRankingByVotingId(rankings);
          setSelectedVotingId((current) => {
            if (
              current &&
              relaciones.some((relacion) => String(relacion.votacion?.id) === String(current))
            ) {
              return current;
            }

            return relaciones[0]?.votacion?.id || "";
          });
        } else {
          setMiembros([]);
          setVotacionesProyecto([]);
          setVoteCountsByRelation({});
          setRankingByVotingId({});
          setSelectedVotingId("");
        }
      } catch (err) {
        setError(err.message || "No se pudo cargar el proyecto.");
      } finally {
        setLoading(false);
      }
    }

    if (idProyecto) load();
  }, [idProyecto, eventoId]);

  const selectedVotingRelation = useMemo(() => {
    return (
      votacionesProyecto.find(
        (relacion) => String(relacion.votacion?.id) === String(selectedVotingId)
      ) ||
      votacionesProyecto[0] ||
      null
    );
  }, [votacionesProyecto, selectedVotingId]);

  const selectedVoting = selectedVotingRelation?.votacion || null;
  const selectedVotes = selectedVotingRelation
  ? voteCountsByRelation[selectedVotingRelation.id] || 0
  : 0;

const selectedRankingEntry = useMemo(() => {
  if (!selectedVoting?.id || !proyecto?.id) return null;

  const ranking = rankingByVotingId[selectedVoting.id] || [];

  return (
    ranking.find((entry) => String(entry.proyectoId) === String(proyecto.id)) ||
    null
  );
}, [rankingByVotingId, selectedVoting, proyecto]);

function formatScore(value) {
  const num = Number(value || 0);
  return Number.isInteger(num) ? String(num) : num.toFixed(2);
}

function formatFive(value) {
  const num = Number(value || 0);
  return Math.min(Math.max(num, 0), 5).toFixed(1);
}

const selectedScoreLabel = useMemo(() => {
  if (!selectedVoting) return "—";

  if (selectedVoting.modalidad === "SIMPLE") {
    return String(selectedRankingEntry?.totalVotos ?? selectedVotes);
  }

  if (selectedVoting.modalidad === "PUNTOS") {
    return formatScore(
      selectedRankingEntry?.mediaPuntos ??
        selectedRankingEntry?.puntuacionTotal ??
        0
    );
  }

  return selectedRankingEntry?.puntuacionTotal !== undefined
    ? formatFive(selectedRankingEntry.puntuacionTotal)
    : "—";
}, [selectedVoting, selectedRankingEntry, selectedVotes]);

const selectedScoreText = useMemo(() => {
  if (!selectedVoting) return "Sin votación";

  if (selectedVoting.modalidad === "SIMPLE") return "Votos";
  if (selectedVoting.modalidad === "PUNTOS") return "Media /10";
  if (selectedVoting.modalidad === "MULTICRITERIO") return "Media /5";
  if (selectedVoting.modalidad === "MULTICRITERIO_PONDERADA") return "Ponderada /5";

  return "Puntuación";
}, [selectedVoting]);

  const totalVotos = useMemo(() => {
    return Object.values(voteCountsByRelation).reduce(
      (sum, value) => sum + Number(value || 0),
      0
    );
  }, [voteCountsByRelation]);

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
            <strong>{selectedScoreLabel}</strong>
            <span>{selectedScoreText}</span>
          </div>

          <div className="mock-selected-voting">
            <span>Votación seleccionada</span>
            <strong>{selectedVoting ? votingLabel(selectedVoting) : "Sin votación"}</strong>
          </div>

          <div className="mock-score-stats">
            <div>
              <strong>{totalVotos}</strong>
              <span>Total votos</span>
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

          {votacionesProyecto.length > 1 ? (
            <label className="project-vote-select-field">
              <span>Elegir votación</span>
              <select
                value={selectedVotingId}
                onChange={(e) => setSelectedVotingId(e.target.value)}
              >
                {votacionesProyecto.map((relacion) => (
                  <option key={relacion.id} value={relacion.votacion?.id}>
                    {votingLabel(relacion.votacion)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <button
            type="button"
            className="primary-btn full-width-btn"
            disabled={!eventoFinalId || votacionesProyecto.length === 0}
            onClick={() => {
              const votacionId =
                selectedVotingId || votacionesProyecto[0]?.votacion?.id;

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

          {votacionesProyecto.length > 0 ? (
            <button
              type="button"
              className="secondary-btn full-width-btn"
              onClick={() => {
                const votacionId =
                  selectedVotingId || votacionesProyecto[0]?.votacion?.id;

                navigate(`/eventos/${eventoFinalId}/votaciones/${votacionId}/resultados`);
              }}
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
              <span>
                {miembros.length} miembro{miembros.length === 1 ? "" : "s"} registrado
                {miembros.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>

          <div className="mock-members-list">
            {miembros.length === 0 ? (
              <p className="project-muted">No hay competidores asignados al equipo en este evento.</p>
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
              votacionesProyecto.map((relacion) => {
                const active =
                  String(relacion.votacion?.id) === String(selectedVotingId);

                return (
                  <button
                    type="button"
                    className={`mock-voting-row mock-voting-row-button ${active ? "active" : ""}`}
                    key={relacion.id}
                    onClick={() => setSelectedVotingId(relacion.votacion?.id || "")}
                  >
                    <div>
                      <strong>{votingLabel(relacion.votacion)}</strong>
                      <span>
                        {relacion.votacion?.tipo} · {relacion.votacion?.modalidad} ·{" "}
                        {voteCountsByRelation[relacion.id] || 0} votos
                      </span>
                    </div>
                    <Star size={18} />
                  </button>
                );
              })
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