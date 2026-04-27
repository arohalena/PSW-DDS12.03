import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Star, Users, Vote } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getProyectosByEvento } from "../../services/proyectoService";
import { getEquipos } from "../../services/equipoService";
import { getVotingToken } from "../../services/sessionService";
import {
  getAsignacionesCompetidorEvento,
  getConteoVotos,
  getCriteriosByVotacion,
  getVotacionProyectosByVotacion,
  getVotacionesByEvento,
  haAlcanzadoMaximoVotacion,
  votarProyectoMulticriterio,
  votarProyectoSimple,
  yaHaVotadoProyecto,
} from "../../services/votacionService";
import "../../styles/voting-detail.css";

function ProjectVotingDetailScreen() {
  const { eventoId, proyectoId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [proyectos, setProyectos] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);

  const [votacionPopular, setVotacionPopular] = useState(null);
  const [votacionProyectos, setVotacionProyectos] = useState([]);
  const [criterios, setCriterios] = useState([]);

  const [voteCount, setVoteCount] = useState(0);
  const [yaVotado, setYaVotado] = useState(false);
  const [haAlcanzadoMaximo, setHaAlcanzadoMaximo] = useState(false);

  const [comentario, setComentario] = useState("");
  const [ratings, setRatings] = useState({});

  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(location.state?.successMessage || "");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const [proyectosData, equiposData, asignacionesData, votacionesData] =
          await Promise.all([
            getProyectosByEvento(eventoId),
            getEquipos(),
            getAsignacionesCompetidorEvento(eventoId),
            getVotacionesByEvento(eventoId),
          ]);

        const votacion =
          votacionesData.find(
            (v) => v.tipo === "POPULAR" && (v.modalidad === "SIMPLE" || v.modalidad === "MULTICRITERIO")
          ) || null;

        let votacionProyectosData = [];
        let criteriosData = [];
        let count = 0;
        let voted = false;
        let maximo = false;

        if (votacion) {
          votacionProyectosData = await getVotacionProyectosByVotacion(votacion.id);

          const vp = votacionProyectosData.find((item) => item.proyecto?.id === proyectoId);
          if (vp) {
            count = await getConteoVotos(vp.id);
            voted = await yaHaVotadoProyecto(vp.id, getVotingToken());
          }

          maximo = await haAlcanzadoMaximoVotacion(votacion.id, getVotingToken());

          if (votacion.modalidad === "MULTICRITERIO") {
            criteriosData = await getCriteriosByVotacion(votacion.id);
          }
        }

        setProyectos(proyectosData);
        setEquipos(equiposData.filter((e) => e.evento?.id === eventoId));
        setAsignaciones(asignacionesData);
        setVotacionPopular(votacion);
        setVotacionProyectos(votacionProyectosData);
        setCriterios(criteriosData);
        setVoteCount(count);
        setYaVotado(voted);
        setHaAlcanzadoMaximo(maximo);
      } catch (err) {
        setError(err.message || "No se pudo cargar el proyecto.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [eventoId, proyectoId]);

  const proyecto = useMemo(() => {
    const proyectoBase = proyectos.find((p) => p.id === proyectoId);
    if (!proyectoBase) return null;

    const equipo = equipos.find((eq) => eq.proyecto?.id === proyectoId) || null;
    const miembros = equipo
      ? asignaciones.filter((a) => a.equipo?.id === equipo.id).map((a) => a.competidor)
      : [];
    const votacionProyecto = votacionProyectos.find((vp) => vp.proyecto?.id === proyectoId);

    return {
      ...proyectoBase,
      equipo,
      miembros,
      votacionProyectoId: votacionProyecto?.id || null,
    };
  }, [proyectos, equipos, asignaciones, votacionProyectos, proyectoId]);

  const esMulticriterio = votacionPopular?.modalidad === "MULTICRITERIO";
  const esSimple = votacionPopular?.modalidad === "SIMPLE";

  const estadoActual = votacionPopular?.estadoActual || "ABIERTA";
  const admiteVotos = votacionPopular?.admiteVotos === true || estadoActual === "ABIERTA";

  const allRated =
    criterios.length > 0 && criterios.every((criterio) => Number(ratings[criterio.id] || 0) > 0);

  const canSubmitSimple =
    !!proyecto?.votacionProyectoId &&
    !!votacionPopular &&
    esSimple &&
    !yaVotado &&
    !haAlcanzadoMaximo &&
    admiteVotos &&
    comentario.trim().length > 0;

  const canSubmitMulti =
    !!proyecto?.votacionProyectoId &&
    !!votacionPopular &&
    esMulticriterio &&
    !yaVotado &&
    !haAlcanzadoMaximo &&
    admiteVotos &&
    comentario.trim().length > 0 &&
    allRated;

  const gestionarError = (message) => {
    if (message.includes("máximo")) {
      setError("Ya has alcanzado el número máximo de votos permitidos.");
      setHaAlcanzadoMaximo(true);
    } else if (message.includes("Ya habías votado este proyecto")) {
      setError("Ya habías votado este proyecto.");
      setYaVotado(true);
    } else if (message.includes("comentario es obligatorio")) {
      setError("Debes escribir un comentario antes de enviar tu voto.");
    } else if (message.includes("no está abierta")) {
      setError("La votación no está abierta.");
    } else if (message.includes("todavía no ha comenzado")) {
      setError("La votación todavía no ha comenzado.");
    } else if (message.includes("ya ha finalizado")) {
      setError("La votación ya ha finalizado.");
    } else if (message.includes("Debes puntuar todos los criterios")) {
      setError("Debes puntuar todos los criterios antes de enviar la evaluación.");
    } else {
      setError(message || "No se pudo registrar el voto.");
    }
  };

  const handleVoteSimple = async () => {
    if (!canSubmitSimple) return;

    try {
      setVoting(true);
      setError("");
      setSuccess("");

      const token = getVotingToken();

      await votarProyectoSimple(proyecto.votacionProyectoId, token, comentario.trim());

      navigate("/votar", {
        state: {
          successMessage: "Voto recibido correctamente.",
          eventoId,
        },
      });
    } catch (err) {
      gestionarError(err.message || "");
    } finally {
      setVoting(false);
    }
  };

  const handleVoteMulticriterio = async () => {
    if (!canSubmitMulti) return;

    try {
      setVoting(true);
      setError("");
      setSuccess("");

      const token = getVotingToken();

      await votarProyectoMulticriterio({
        votacionProyectoId: proyecto.votacionProyectoId,
        anonTokenHash: token,
        comentario: comentario.trim(),
        puntuaciones: criterios.map((criterio) => ({
          criterioId: criterio.id,
          puntuacion: Number(ratings[criterio.id]),
        })),
      });

      navigate("/votar", {
        state: {
          successMessage: "Evaluación enviada correctamente.",
          eventoId,
        },
      });
    } catch (err) {
      gestionarError(err.message || "");
    } finally {
      setVoting(false);
    }
  };

  if (loading) {
    return (
      <main className="voting-detail-page">
        <div className="feedback-card">Cargando proyecto...</div>
      </main>
    );
  }

  if (!proyecto) {
    return (
      <main className="voting-detail-page">
        <div className="feedback-card error-box">No se ha encontrado el proyecto.</div>
      </main>
    );
  }

  return (
    <main className="voting-detail-page">
      <button
        className="back-link"
        onClick={() =>
          navigate("/votar", {
            state: { eventoId },
          })
        }
      >
        <ArrowLeft size={16} />
        Volver a lista de votación
      </button>

      <header className="detail-page-header">
        <div>
          <h1>Evaluación de Proyecto</h1>
          <p>
            {esMulticriterio
              ? "Evalúa el proyecto según los criterios establecidos."
              : "Emite tu voto para este proyecto y añade un comentario obligatorio."}
          </p>
        </div>
        <span className="project-tag">{proyecto.tipoCategoria}</span>
      </header>

      <section className="detail-main-card">
        <h2>{proyecto.nombre}</h2>
        <p>{proyecto.descripcion || "Sin descripción disponible."}</p>

        <div className="project-meta-inline">
          <Users size={16} />
          <span>
            {proyecto.equipo?.nombre || "Sin equipo"} · {proyecto.miembros.length} integrantes
          </span>
        </div>

        <div className="member-tags">
          {proyecto.miembros.map((miembro) => (
            <span key={miembro.id} className="member-chip">
              {miembro.nombre}
            </span>
          ))}
        </div>
      </section>

      <section className="detail-main-card">
        <h3>
          {esMulticriterio ? "Votación Popular Multicriterio" : "Votación Popular Simple"}
        </h3>

        {esMulticriterio ? (
          <p>Valora este proyecto en cada criterio y deja un comentario obligatorio.</p>
        ) : (
          <p>Registra tu voto simple para este proyecto y añade un comentario obligatorio.</p>
        )}

        <div className="vote-count-box">
          <strong>Votos actuales:</strong> {voteCount}
        </div>

        {yaVotado && (
          <div className="feedback-card warning-box">
            Ya habías votado este proyecto.
          </div>
        )}

        {votacionPopular && (
          <div className="feedback-card">
            <strong>Franja de votación:</strong>{" "}
            {votacionPopular.inicio ? new Date(votacionPopular.inicio).toLocaleString() : "—"} →{" "}
            {votacionPopular.fin ? new Date(votacionPopular.fin).toLocaleString() : "—"}
          </div>
        )}

        {estadoActual === "PENDIENTE" && (
          <div className="feedback-card warning-box">
            La votación todavía no ha comenzado.
          </div>
        )}
        {estadoActual === "PAUSADA" && (
          <div className="feedback-card warning-box">
            La votación está pausada por el organizador.
          </div>
        )}
        {estadoActual === "CERRADA" && (
          <div className="feedback-card error-box">
            La votación ha finalizado. Ya no es posible votar.
          </div>
        )}

        {!yaVotado && haAlcanzadoMaximo && (
          <div className="feedback-card warning-box">
            Ya has alcanzado el número máximo de votos permitidos en esta votación.
          </div>
        )}

        {error && <div className="feedback-card error-box">{error}</div>}
        {success && <div className="feedback-card success-box">{success}</div>}

        {esMulticriterio && criterios.length > 0 && (
          <div style={{ display: "grid", gap: "1rem", marginTop: "1rem" }}>
            {criterios.map((criterio) => (
              <div key={criterio.id} className="voting-project-card">
                <div className="project-card-content">
                  <div className="project-title-row">
                    <strong>{criterio.nombre}</strong>
                    <span className="project-tag">{criterio.peso}%</span>
                  </div>

                  <p>{criterio.descripcion || "Sin descripción disponible."}</p>

                  <div
                    style={{
                      display: "flex",
                      gap: "0.5rem",
                      alignItems: "center",
                      flexWrap: "wrap",
                      marginTop: "0.5rem",
                    }}
                  >
                    {[1, 2, 3, 4, 5].map((valor) => {
                      const activa = Number(ratings[criterio.id] || 0) >= valor;

                      return (
                        <button
                          key={valor}
                          type="button"
                          className="secondary-btn"
                          onClick={() =>
                            setRatings((prev) => ({ ...prev, [criterio.id]: valor }))
                          }
                          disabled={yaVotado || haAlcanzadoMaximo || voting}
                          style={{
                            opacity: activa ? 1 : 0.6,
                            minWidth: "48px",
                          }}
                        >
                          <Star size={16} />
                          {valor}
                        </button>
                      );
                    })}

                    <span>
                      {ratings[criterio.id]
                        ? `Puntuación: ${ratings[criterio.id]}/5`
                        : "Sin puntuar"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {esMulticriterio && criterios.length === 0 && (
          <div className="feedback-card warning-box">
            Esta votación multicriterio no tiene criterios configurados.
          </div>
        )}

        <div style={{ marginTop: "1rem" }}>
          <label className="voting-selector-field">
            <span>Comentario obligatorio</span>
            <textarea
              rows={5}
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Escribe tu valoración del proyecto"
            />
          </label>
        </div>

        <div className="vote-action-row">
          {esSimple && (
            <button
              className="primary-btn"
              onClick={handleVoteSimple}
              disabled={voting || !canSubmitSimple}
            >
              {voting ? (
                <><CheckCircle2 size={18} />Registrando voto...</>
              ) : !admiteVotos ? (
                <><CheckCircle2 size={18} />
                  {estadoActual === "PENDIENTE" ? "Aún no ha comenzado" :
                  estadoActual === "PAUSADA"   ? "Pausada" : "Finalizada"}
                </>
              ) : yaVotado ? (
                <><CheckCircle2 size={18} />Ya votado</>
              ) : haAlcanzadoMaximo ? (
                <><CheckCircle2 size={18} />Máximo alcanzado</>
              ) : (
                <><Vote size={18} />Votar proyecto</>
              )}
            </button>
          )}

          {esMulticriterio && (
            <button
              className="primary-btn"
              onClick={handleVoteMulticriterio}
              disabled={voting || !canSubmitMulti}
            >
              {voting ? (
                <><CheckCircle2 size={18} />Enviando evaluación...</>
              ) : !admiteVotos ? (
                <><CheckCircle2 size={18} />
                  {estadoActual === "PENDIENTE" ? "Aún no ha comenzado" :
                  estadoActual === "PAUSADA"   ? "Pausada" : "Finalizada"}
                </>
              ) : yaVotado ? (
                <><CheckCircle2 size={18} />Ya votado</>
              ) : haAlcanzadoMaximo ? (
                <><CheckCircle2 size={18} />Máximo alcanzado</>
              ) : (
                <><Vote size={18} />Enviar evaluación</>
              )}
            </button>
          )}
        </div>
      </section>
    </main>
  );
}

export default ProjectVotingDetailScreen;