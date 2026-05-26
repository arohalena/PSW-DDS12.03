import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  CheckCircle2,
  MessageCircle,
  Star,
  Trophy,
  Image,
  Users,
  Vote,
} from "lucide-react";
import { getProyectoById, getProyectos } from "../../services/proyectoService";
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
import { MaterialGallery } from "../../common/MaterialGallery";
import "../../styles/projects.css";
import "../../styles/my-project-dashboard.css"

const PROJECT_DETAIL_CACHE_PREFIX = "votify:project-detail:";

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
  return votacion?.nombre || `${votacion?.tipo || "Votacion"} - ${votacion?.modalidad || ""}`;
}

function modalityLabel(modalidad) {
  switch (modalidad) {
    case "SIMPLE":
      return "Voto simple";
    case "PUNTOS":
      return "Puntos";
    case "MULTICRITERIO":
      return "Multicriterio";
    case "MULTICRITERIO_PONDERADA":
      return "Multicriterio ponderada";
    default:
      return modalidad || "Sin modalidad";
  }
}

function votingTypeLabel(tipo) {
  switch (tipo) {
    case "POPULAR":
      return "Popular";
    case "JURADO":
      return "Jurado";
    case "MIXTA":
      return "Mixta";
    default:
      return tipo || "Votacion";
  }
}

function votingStateLabel(votacion) {
  const estado = votacion?.estadoActual || votacion?.estado || "ABIERTA";
  switch (estado) {
    case "PENDIENTE":
      return "Pendiente";
    case "PAUSADA":
      return "Pausada";
    case "CERRADA":
      return "Cerrada";
    default:
      return "Abierta";
  }
}

function resolveEquipoForProject(project, equipos = []) {
  if (project?.equipo) return project.equipo;

  return (
    equipos.find((item) => String(item.id) === String(project?.equipoId)) ||
    equipos.find((item) => String(item.proyecto?.id) === String(project?.id)) ||
    null
  );
}

function formatScore(value) {
  const num = Number(value || 0);
  return Number.isInteger(num) ? String(num) : num.toFixed(2);
}

function formatFive(value) {
  const num = Number(value || 0);
  return Math.min(Math.max(num, 0), 5).toFixed(1);
}

function formatDate(value) {
  if (!value) return "Sin fecha";
  return new Date(value).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
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
    const cacheKey = `${PROJECT_DETAIL_CACHE_PREFIX}${idProyecto}:${eventoId || "any"}`;

    async function load() {
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          setProyecto(parsed.proyecto || null);
          setEvento(parsed.evento || null);
          setEquipo(parsed.equipo || null);
          setMiembros(parsed.miembros || []);
          setVotacionesProyecto(parsed.votacionesProyecto || []);
          setComentarios(parsed.comentarios || []);
          setVoteCountsByRelation(parsed.voteCountsByRelation || {});
          setRankingByVotingId(parsed.rankingByVotingId || {});
          setSelectedVotingId(parsed.selectedVotingId || "");
          setLoading(false);
        } else {
          setLoading(true);
        }

        setError("");

        const [proyectoById, eventosData, equiposData, comentariosData] = await Promise.all([
          getProyectoById(idProyecto).catch(async () => {
            const proyectosData = await getProyectos().catch(() => []);
            return proyectosData.find((p) => String(p.id) === String(idProyecto)) || null;
          }),
          getEventos().catch(() => []),
          getEquipos().catch(() => []),
          getComentariosByProyecto(idProyecto).catch(() => []),
        ]);

        const proyectoEncontrado = proyectoById;

        if (!proyectoEncontrado) {
          throw new Error("No se encontro el proyecto.");
        }

        const equipoEncontrado = resolveEquipoForProject(proyectoEncontrado, equiposData);
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
        setComentarios(comentariosData || []);

        if (effectiveEventoId) {
          let asignacionesEquipo = [];

          if (equipoEncontrado?.id) {
            const asignacionesEventoActual = await getAsignacionesCompetidorEvento(effectiveEventoId).catch(() => []);

            asignacionesEquipo = asignacionesEventoActual.filter(
              (asignacion) =>
                String(asignacion.equipo?.id || asignacion.equipoId) === String(equipoEncontrado.id)
            );
          }

          const miembrosEquipo = asignacionesEquipo
            .map((asignacion) => asignacion.competidor || asignacion.competidorMO)
            .filter(Boolean)
            .filter(
              (competidor, index, array) =>
                array.findIndex((item) => String(item.id) === String(competidor.id)) === index
            );

          setMiembros(miembrosEquipo);

          const votaciones = await getVotacionesByEvento(effectiveEventoId).catch(() => []);
          const relaciones = (
            await Promise.all(
              (votaciones || []).map(async (votacion) => {
                const proyectosVotacion = await getVotacionProyectosByVotacion(votacion.id).catch(() => []);
                const relacion = proyectosVotacion.find(
              (item) => String(item.proyecto?.id) === String(idProyecto)
            );

                return relacion ? { ...relacion, votacion } : null;
              })
            )
          ).filter(Boolean);

          setVotacionesProyecto(relaciones);

          const countEntries = await Promise.all(
            relaciones.map(async (relacion) => [
              relacion.id,
              Number(await getConteoVotos(relacion.id).catch(() => 0)),
            ])
          );

          const rankingEntries = await Promise.all(
            relaciones
              .filter((relacion) => relacion.votacion?.id)
              .map(async (relacion) => [
                relacion.votacion.id,
                await getRanking(effectiveEventoId, relacion.votacion.id).catch(() => []),
              ])
          );

          const counts = Object.fromEntries(countEntries);
          const rankings = Object.fromEntries(rankingEntries);

          setVoteCountsByRelation(counts);
          setRankingByVotingId(rankings);
          const nextSelectedVotingId =
            selectedVotingId &&
            relaciones.some((relacion) => String(relacion.votacion?.id) === String(selectedVotingId))
              ? selectedVotingId
              : relaciones[0]?.votacion?.id || "";

          setSelectedVotingId((current) => {
            if (
              current &&
              relaciones.some((relacion) => String(relacion.votacion?.id) === String(current))
            ) {
              return current;
            }

            return relaciones[0]?.votacion?.id || "";
          });

          sessionStorage.setItem(
            cacheKey,
            JSON.stringify({
              proyecto: proyectoEncontrado,
              evento: eventoEncontrado,
              equipo: equipoEncontrado,
              miembros: miembrosEquipo,
              votacionesProyecto: relaciones,
              comentarios: comentariosData || [],
              voteCountsByRelation: counts,
              rankingByVotingId: rankings,
              selectedVotingId: nextSelectedVotingId,
            })
          );
        } else {
          setMiembros([]);
          setVotacionesProyecto([]);
          setVoteCountsByRelation({});
          setRankingByVotingId({});
          setSelectedVotingId("");
          sessionStorage.setItem(
            cacheKey,
            JSON.stringify({
              proyecto: proyectoEncontrado,
              evento: eventoEncontrado,
              equipo: equipoEncontrado,
              miembros: [],
              votacionesProyecto: [],
              comentarios: comentariosData || [],
              voteCountsByRelation: {},
              rankingByVotingId: {},
              selectedVotingId: "",
            })
          );
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

  const selectedScoreLabel = useMemo(() => {
    if (!selectedVoting) return "-";

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
      : "-";
  }, [selectedVoting, selectedRankingEntry, selectedVotes]);

  const selectedScoreText = useMemo(() => {
    if (!selectedVoting) return "Sin votacion";

    if (selectedVoting.modalidad === "SIMPLE") return "Votos";
    if (selectedVoting.modalidad === "PUNTOS") return "Media /10";
    if (selectedVoting.modalidad === "MULTICRITERIO") return "Media /5";
    if (selectedVoting.modalidad === "MULTICRITERIO_PONDERADA") return "Ponderada /5";

    return "Puntuacion";
  }, [selectedVoting]);

  const totalVotos = useMemo(() => {
    return Object.values(voteCountsByRelation).reduce(
      (sum, value) => sum + Number(value || 0),
      0
    );
  }, [voteCountsByRelation]);

  const criteriosSeleccionados = selectedRankingEntry?.criterios || [];
  const posicion = selectedRankingEntry?.posicion ? `#${selectedRankingEntry.posicion}` : "-";
  const votacionesAbiertas = votacionesProyecto.filter(
    (relacion) => votingStateLabel(relacion.votacion) === "Abierta"
  ).length;
  const selectedVotingState = selectedVoting ? votingStateLabel(selectedVoting) : "Sin votacion";
  const selectedVotingStateClass = selectedVoting
    ? `state-${(selectedVoting.estadoActual || selectedVoting.estado || "ABIERTA").toLowerCase()}`
    : "state-empty";

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
    <main className="projects-page project-detail-page project-detail-balanced">
      <div className="project-detail-topbar project-balanced-topbar">
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

        <button className="project-back-btn" type="button" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
          Volver
        </button>
      </div>

      <section className="project-balanced-hero">
        <article className="project-balanced-main">
          <div className="project-balanced-tags">
            <span>{getCategoryLabel(proyecto.tipoCategoria)}</span>
            <span className="success">Proyecto activo</span>
            {selectedVoting ? (
              <span className={selectedVotingStateClass}>{selectedVotingState}</span>
            ) : null}
          </div>

          <h1>{proyecto.nombre}</h1>
          <p>{proyecto.descripcion || "Proyecto participante en el evento de votacion."}</p>

          <div className="project-balanced-description">
            <span>Descripcion detallada del proyecto</span>
            <p>{proyecto.descripcion || "Este proyecto todavia no tiene una descripcion detallada registrada."}</p>
          </div>

          <div className="project-balanced-meta">
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
            <div>
              <Calendar size={18} />
              <span>Votaciones abiertas</span>
              <strong>{votacionesAbiertas}</strong>
            </div>
          </div>
        </article>

        <aside className="project-balanced-score-card">
          <div className="project-balanced-score-head">
            <div>
              <span>Votacion seleccionada</span>
              <strong>{selectedVoting ? votingLabel(selectedVoting) : "Sin votacion"}</strong>
            </div>
            <span className={`project-state-pill ${selectedVotingStateClass}`}>
              {selectedVotingState}
            </span>
          </div>

          <div className="project-balanced-score-ring">
            <div>
              <strong>{selectedScoreLabel}</strong>
              <span>{selectedScoreText}</span>
            </div>
          </div>

          <div className="project-balanced-score-stats">
            <article>
              <span>Posicion</span>
              <strong>{posicion}</strong>
            </article>
            <article>
              <span>Total votos</span>
              <strong>{totalVotos}</strong>
            </article>
            <article>
              <span>Miembros</span>
              <strong>{miembros.length}</strong>
            </article>
          </div>

          {selectedVoting ? (
            <div className="project-balanced-voting-meta">
              <span>{votingTypeLabel(selectedVoting.tipo)}</span>
              <span>{modalityLabel(selectedVoting.modalidad)}</span>
              <span>{selectedVotes} votos en esta votacion</span>
            </div>
          ) : null}

          {votacionesProyecto.length > 1 ? (
            <label className="project-balanced-select">
              <span>Elegir votacion</span>
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

          <div className="project-balanced-actions">
            <button
              type="button"
              className="primary-btn full-width-btn"
              disabled={!eventoFinalId || votacionesProyecto.length === 0}
              onClick={() => {
                const votacionId =
                  selectedVotingId || votacionesProyecto[0]?.votacion?.id;

                if (!votacionId) {
                  alert("Este proyecto no esta asignado a ninguna votacion.");
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
          </div>
        </aside>
      </section>

      <section className="project-balanced-content-grid">
        <article className="project-balanced-card">
          <div className="project-balanced-card-heading">
            <div>
              <h2>Informacion del equipo</h2>
              <p>Participantes vinculados al proyecto.</p>
            </div>
          </div>

          <div className="project-balanced-team-summary">
            <div className="project-balanced-team-title">
              <span>
                <Trophy size={21} />
              </span>
              <strong>{equipo?.nombre || "Sin equipo asignado"}</strong>
            </div>
            <span>
              {miembros.length} miembro{miembros.length === 1 ? "" : "s"} registrado
              {miembros.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="project-balanced-members">
            {miembros.length === 0 ? (
              <p className="project-muted">No hay competidores asignados al equipo en este evento.</p>
            ) : (
              miembros.map((miembro) => (
                <div className="project-balanced-member" key={miembro.id}>
                  <div>{initials(miembro.nombre, miembro.email)}</div>
                  <section>
                    <strong>{miembro.nombre || miembro.email}</strong>
                    <span>{miembro.email}</span>
                  </section>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="project-balanced-card">
          <div className="project-balanced-card-heading">
            <div>
              <h2>Votaciones asociadas</h2>
              <p>Selecciona una votacion para ver su puntuacion.</p>
            </div>
            <CheckCircle2 size={22} />
          </div>

          <div className="project-balanced-votings">
            {votacionesProyecto.length === 0 ? (
              <p className="project-muted">Este proyecto todavia no esta asignado a ninguna votacion.</p>
            ) : (
              votacionesProyecto.map((relacion) => {
                const active =
                  String(relacion.votacion?.id) === String(selectedVotingId);
                const estado = votingStateLabel(relacion.votacion);
                const estadoClass = `state-${(relacion.votacion?.estadoActual || relacion.votacion?.estado || "ABIERTA").toLowerCase()}`;

                return (
                  <button
                    type="button"
                    className={`project-balanced-voting-row ${active ? "active" : ""}`}
                    key={relacion.id}
                    onClick={() => setSelectedVotingId(relacion.votacion?.id || "")}
                  >
                    <div>
                      <strong>{votingLabel(relacion.votacion)}</strong>
                      <span>
                        {votingTypeLabel(relacion.votacion?.tipo)} - {modalityLabel(relacion.votacion?.modalidad)}
                      </span>
                    </div>
                    <div className="project-balanced-voting-side">
                      <span className={`project-state-pill ${estadoClass}`}>{estado}</span>
                      <strong>{voteCountsByRelation[relacion.id] || 0} votos</strong>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </article>
      </section>

      {criteriosSeleccionados.length > 0 ? (
        <section className="project-balanced-card">
          <div className="project-balanced-card-heading">
            <div>
              <h2>Desglose por criterio</h2>
              <p>Promedios actuales de la votacion seleccionada.</p>
            </div>
            <Star size={22} />
          </div>

          <div className="project-balanced-criteria">
            {criteriosSeleccionados.map((criterio) => {
              const promedio = Number(criterio.promedio || 0);
              const width = `${(Math.min(Math.max(promedio, 0), 5) / 5) * 100}%`;

              return (
                <article key={criterio.criterioId || criterio.criterioNombre || criterio.nombre}>
                  <div>
                    <span>{criterio.criterioNombre || criterio.nombre || "Criterio"}</span>
                    <strong>{formatFive(promedio)}/5</strong>
                  </div>
                  <div className="project-balanced-bar">
                    <span style={{ width }} />
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="project-balanced-card project-balanced-gallery">
        <div className="participant-card-header">
          <div className="participant-card-title">
            <Image size={18} />
            <h3>Galeria del proyecto</h3>
          </div>
        </div>
        <div className="my-project-material-body">
          <MaterialGallery proyectoId={proyecto.id} />
        </div>
      </section>

      <section className="project-balanced-card">
        <div className="project-balanced-card-heading">
          <div>
            <h2>Feedback y comentarios</h2>
            <p>Comentarios generales y comentarios asociados a criterios.</p>
          </div>
          <span className="feedback-count">{comentarios.length}</span>
        </div>

        <div className="project-balanced-comments">
          {comentarios.length === 0 ? (
            <div className="project-balanced-empty">
              <MessageCircle size={24} />
              <strong>Todavia no hay feedback</strong>
              <span>Cuando el jurado o los votantes comenten, aparecera aqui.</span>
            </div>
          ) : (
            comentarios.map((comentario) => (
              <article className="project-balanced-comment" key={comentario.id}>
                <div className="project-comment-icon">
                  <MessageCircle size={18} />
                </div>

                <div>
                  <div className="project-comment-header">
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
