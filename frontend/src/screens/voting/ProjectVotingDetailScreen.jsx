import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Star,
  Users,
  Vote,
  X,
} from "lucide-react";
import { getProyectosByEvento } from "../../services/proyectoService";
import { getEquipos } from "../../services/equipoService";
import { getVotingToken } from "../../services/sessionService";
import {
  getAsignacionesCompetidorEvento,
  getConteoVotos,
  getCriteriosByVotacion,
  getVotosByVotacionProyecto,
  getVotacionProyectosByVotacion,
  getVotacionesByEvento,
  haAlcanzadoMaximoVotacion,
  votarProyectoMulticriterio,
  votarProyectoPuntos,
  votarProyectoSimple,
  yaHaVotadoProyecto,
} from "../../services/votacionService";
import "../../styles/voting-detail.css";

function formatDateTime(value = new Date()) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function modalityLabel(modalidad) {
  switch (modalidad) {
    case "SIMPLE":
      return "Voto simple";
    case "PUNTOS":
      return "Votacion por puntos";
    case "MULTICRITERIO":
      return "Evaluacion multicriterio";
    case "MULTICRITERIO_PONDERADA":
      return "Evaluacion ponderada";
    default:
      return modalidad || "Votacion";
  }
}

function typeLabel(tipo) {
  switch (tipo) {
    case "POPULAR":
      return "Votacion popular";
    case "JURADO":
      return "Evaluacion de jurado";
    case "MIXTA":
      return "Votacion mixta";
    default:
      return tipo || "Votacion";
  }
}

function stateLabel(estado) {
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

function clampScore(value, min, max) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return min;
  return Math.min(Math.max(parsed, min), max);
}

function ConfirmSubmitModal({ open, onCancel, onConfirm, loading }) {
  if (!open) return null;

  return (
    <div className="vote-modal-backdrop">
      <div className="vote-confirm-modal">
        <button type="button" className="vote-modal-close" onClick={onCancel}>
          <X size={18} />
        </button>

        <div className="vote-confirm-icon">
          <Vote size={30} />
        </div>

        <h2>Enviar evaluacion</h2>

        <p>
          Una vez enviada, tu evaluacion quedara registrada. Revisa tus datos
          antes de continuar.
        </p>

        <div className="vote-modal-actions">
          <button type="button" className="secondary-btn" onClick={onCancel}>
            Cancelar
          </button>

          <button
            type="button"
            className="primary-btn"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Enviando..." : "Enviar evaluacion"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ErrorModal({ open, title, message, onClose }) {
  if (!open) return null;

  return (
    <div className="vote-modal-backdrop">
      <div className="vote-confirm-modal">
        <button type="button" className="vote-modal-close" onClick={onClose}>
          <X size={18} />
        </button>

        <div
          className="vote-confirm-icon"
          style={{ background: "#fee2e2", color: "#b91c1c" }}
        >
          <AlertTriangle size={30} />
        </div>

        <h2>{title}</h2>

        <p>{message}</p>

        <div className="vote-modal-actions">
          <button type="button" className="primary-btn" onClick={onClose}>
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}

function SuccessScreen({
  proyecto,
  equipo,
  modalidad,
  criterios,
  ratings,
  puntuacion,
  confirmationCode,
  onBack,
  onResults,
}) {
  const total = useMemo(() => {
    if (modalidad === "PUNTOS") {
      return Number(puntuacion || 0);
    }

    if (modalidad === "SIMPLE") {
      return 1;
    }

    if (!criterios.length) {
      return 0;
    }

    if (modalidad === "MULTICRITERIO_PONDERADA") {
      return criterios.reduce((acc, criterio) => {
        const valor = Number(ratings[criterio.id] || 0);
        const peso = Number(criterio.peso || 0);

        return acc + valor * (peso / 100);
      }, 0);
    }

    const suma = criterios.reduce((acc, criterio) => {
      return acc + Number(ratings[criterio.id] || 0);
    }, 0);

    return suma / criterios.length;
  }, [modalidad, criterios, ratings, puntuacion]);

  return (
    <main className="vote-success-page">
      <section className="vote-success-hero">
        <div className="vote-success-icon">
          <Check size={34} />
        </div>

        <h1>Voto registrado correctamente</h1>
        <p>Tu evaluacion ha sido enviada y registrada en el sistema.</p>
      </section>

      <section className="vote-success-content">
        <h2>Resumen de tu evaluacion</h2>

        <div className="vote-summary-list">
          <div>
            <span>Proyecto evaluado:</span>
            <strong>{proyecto?.nombre}</strong>
          </div>

          <div>
            <span>Equipo:</span>
            <strong>{equipo?.nombre || "Sin equipo"}</strong>
          </div>

          <div>
            <span>Fecha y hora:</span>
            <strong>{formatDateTime()}</strong>
          </div>

          <div>
            <span>Codigo de confirmacion:</span>
            <strong className="vote-confirm-code">{confirmationCode}</strong>
          </div>
        </div>

        {(modalidad === "MULTICRITERIO" ||
          modalidad === "MULTICRITERIO_PONDERADA") && (
          <div className="vote-score-box">
            <h3>Calificaciones otorgadas</h3>

            {criterios.map((criterio) => (
              <div className="vote-score-row" key={criterio.id}>
                <span>
                  {criterio.nombre}
                  {modalidad === "MULTICRITERIO_PONDERADA"
                    ? ` (${criterio.peso}%)`
                    : ""}
                </span>

                <strong>
                  {ratings[criterio.id] || 0}/5 <Star size={15} />
                </strong>
              </div>
            ))}

            <div className="vote-total-row">
              <span>Puntuacion total:</span>
              <strong>{total.toFixed(2)}/5.00</strong>
            </div>
          </div>
        )}

        {modalidad === "PUNTOS" && (
          <div className="vote-score-box">
            <h3>Puntuacion otorgada</h3>

            <div className="vote-total-row">
              <span>Puntuacion total:</span>
              <strong>{puntuacion}/10</strong>
            </div>
          </div>
        )}

        {modalidad === "SIMPLE" && (
          <div className="vote-score-box">
            <h3>Voto simple</h3>

            <div className="vote-total-row">
              <span>Estado:</span>
              <strong>Voto registrado</strong>
            </div>
          </div>
        )}

        <div className="vote-success-actions">
          <button type="button" className="primary-btn" onClick={onBack}>
            Volver al evento
            <ArrowRight size={17} />
          </button>

          <button type="button" className="secondary-btn" onClick={onResults}>
            Ver resultados
          </button>
        </div>

        <button type="button" className="vote-dashboard-link" onClick={onBack}>
          Volver al dashboard
        </button>
      </section>
    </main>
  );
}

function StarsInput({ value, onChange, disabled }) {
  return (
    <div className="stars-input">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          aria-label={`${star} estrellas`}
          className={Number(value || 0) >= star ? "active" : ""}
          onClick={() => onChange(star)}
        >
          <Star size={22} />
        </button>
      ))}
    </div>
  );
}

function ProjectVotingDetailScreen() {
  const { eventoId, proyectoId, votingId } = useParams();
  const navigate = useNavigate();

  const [proyectos, setProyectos] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);

  const [votacion, setVotacion] = useState(null);
  const [votacionProyectoId, setVotacionProyectoId] = useState(null);
  const [criterios, setCriterios] = useState([]);

  const [voteCount, setVoteCount] = useState(0);
  const [yaVotado, setYaVotado] = useState(false);
  const [haAlcanzadoMaximo, setHaAlcanzadoMaximo] = useState(false);
  const [votoRegistrado, setVotoRegistrado] = useState(null);

  const [comentario, setComentario] = useState("");
  const [comentariosCriterio, setComentariosCriterio] = useState({});
  const [ratings, setRatings] = useState({});
  const [puntuacion, setPuntuacion] = useState(5);

  const [errorModal, setErrorModal] = useState({ open: false, title: "", message: "" });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successData, setSuccessData] = useState(null);

  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState("");

  const usuario = JSON.parse(localStorage.getItem("usuarioLogueado"));
  const token = getVotingToken();

  useEffect(() => {
    async function loadData() {
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

        const votacionActual = votacionesData.find(
          (item) => String(item.id) === String(votingId)
        );

        if (!votacionActual) {
          throw new Error("No se ha encontrado la votacion.");
        }

        const relaciones = await getVotacionProyectosByVotacion(votingId);

        const relacion = relaciones.find(
          (item) => String(item.proyecto?.id) === String(proyectoId)
        );

        if (!relacion) {
          throw new Error("Este proyecto no pertenece a esta votacion.");
        }

        let criteriosData = [];

        if (
          votacionActual.modalidad === "MULTICRITERIO" ||
          votacionActual.modalidad === "MULTICRITERIO_PONDERADA"
        ) {
          criteriosData = await getCriteriosByVotacion(votacionActual.id);
        }

        setProyectos(proyectosData || []);
        setEquipos((equiposData || []).filter((e) => String(e.evento?.id) === String(eventoId)));
        setAsignaciones(asignacionesData || []);
        setVotacion(votacionActual);
        setVotacionProyectoId(relacion.id);
        setCriterios(criteriosData || []);

        setVoteCount(await getConteoVotos(relacion.id));

        const votoPrevio = await yaHaVotadoProyecto(relacion.id, token);
        setYaVotado(votoPrevio);

        if (votoPrevio) {
          const votos = await getVotosByVotacionProyecto(relacion.id).catch(() => []);
          setVotoRegistrado(
            votos.find((voto) => String(voto.anonTokenHash) === String(token)) || null
          );
        } else {
          setVotoRegistrado(null);
        }

        setHaAlcanzadoMaximo(
          await haAlcanzadoMaximoVotacion(votacionActual.id, token)
        );
      } catch (err) {
        setError(err.message || "No se pudo cargar la votacion.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [eventoId, proyectoId, votingId]);

  const proyecto = useMemo(() => {
    const proyectoBase = proyectos.find(
      (item) => String(item.id) === String(proyectoId)
    );

    if (!proyectoBase) return null;

    const equipo =
      proyectoBase.equipo ||
      equipos.find((eq) => String(eq.id) === String(proyectoBase.equipoId)) ||
      equipos.find((eq) => String(eq.proyecto?.id) === String(proyectoId)) ||
      null;

    const miembros = equipo
      ? asignaciones
          .filter((a) => String(a.equipo?.id || a.equipoId) === String(equipo.id))
          .map((a) => a.competidor || a.competidorMO)
          .filter(Boolean)
      : [];

    return {
      ...proyectoBase,
      equipo,
      miembros,
    };
  }, [proyectos, equipos, asignaciones, proyectoId]);

  const modalidad = votacion?.modalidad;
  const tipo = votacion?.tipo;

  const esPopular = tipo === "POPULAR";
  const esJurado = tipo === "JURADO";

  const esSimple = modalidad === "SIMPLE";
  const esPuntos = modalidad === "PUNTOS";
  const esMulticriterio = modalidad === "MULTICRITERIO";
  const esPonderada = modalidad === "MULTICRITERIO_PONDERADA";
  const comentariosActivos = votacion?.comentariosActivos !== false;
  const comentarioObligatorio = votacion?.comentarioObligatorio === true;
  const comentarioCumplido =
    !comentariosActivos || !comentarioObligatorio || comentario.trim().length > 0;

  const puedeVotar =
    !esJurado || usuario?.rol === "JURADO" || usuario?.rol === "ORGANIZADOR";

  const estadoActual = votacion?.estadoActual || "ABIERTA";
  const admiteVotos = votacion?.admiteVotos === true || estadoActual === "ABIERTA";

  const allRated =
    criterios.length > 0 &&
    criterios.every((criterio) => Number(ratings[criterio.id] || 0) > 0);

  const canSubmitSimple =
    !!votacionProyectoId &&
    !!votacion &&
    esSimple &&
    !yaVotado &&
    !haAlcanzadoMaximo &&
    admiteVotos &&
    comentarioCumplido;

  const canSubmitMulti =
    !!votacionProyectoId &&
    !!votacion &&
    !yaVotado &&
    !haAlcanzadoMaximo &&
    admiteVotos &&
    comentarioCumplido &&
    (esSimple ||
      esPuntos ||
      ((esMulticriterio || esPonderada) && allRated));

  const ratedCount = criterios.filter((criterio) => Number(ratings[criterio.id] || 0) > 0).length;
  const progressPercent = criterios.length > 0 ? Math.round((ratedCount / criterios.length) * 100) : 0;

  const votoRegistradoLabel = useMemo(() => {
    if (!votoRegistrado) return "";

    const total = Number(votoRegistrado.puntuacionTotal || 0);

    if (esSimple) return "1 voto";
    if (esPuntos) return `${Number.isInteger(total) ? total : total.toFixed(2)}/10`;
    if (esMulticriterio || esPonderada) return `${total.toFixed(2)}/5`;

    return Number.isInteger(total) ? String(total) : total.toFixed(2);
  }, [esMulticriterio, esPonderada, esPuntos, esSimple, votoRegistrado]);

  const scorePreview = useMemo(() => {
    if (yaVotado) return votoRegistradoLabel || "Voto registrado";
    if (!puedeVotar) return "Sin permiso";
    if (!admiteVotos || haAlcanzadoMaximo) return "-";
    if (esSimple) return "Sin votar";
    if (esPuntos) return `${puntuacion}/10`;
    if (!criterios.length) return "-";

    if (esPonderada) {
      const total = criterios.reduce((sum, criterio) => {
        const valor = Number(ratings[criterio.id] || 0);
        const peso = Number(criterio.peso || 0);
        return sum + valor * (peso / 100);
      }, 0);
      return `${total.toFixed(2)}/5`;
    }

    const total = criterios.reduce((sum, criterio) => sum + Number(ratings[criterio.id] || 0), 0);
    return `${(total / criterios.length).toFixed(2)}/5`;
  }, [
    admiteVotos,
    criterios,
    esPonderada,
    esPuntos,
    esSimple,
    haAlcanzadoMaximo,
    puedeVotar,
    puntuacion,
    ratings,
    votoRegistradoLabel,
    yaVotado,
  ]);

  const scoreMetricLabel = useMemo(() => {
    if (yaVotado) return "Tu voto";
    if (!puedeVotar) return "Estado";
    if (esSimple) return "Estado";
    return "Tu puntuacion";
  }, [esSimple, puedeVotar, yaVotado]);

  const puedeRellenarFormulario =
    puedeVotar && !yaVotado && !haAlcanzadoMaximo && admiteVotos;

  function handleError(message) {
    if (message.includes("propio proyecto") || message.includes("auto-votacion")) {
      setErrorModal({
        open: true,
        title: "No puedes votar a tu propio proyecto",
        message:
          "El organizador del evento ha configurado esta votacion para no permitir que los participantes voten a su propio proyecto.",
      });
      return;
    }

    if (message.includes("maximo")) {
      setHaAlcanzadoMaximo(true);
      setError("Ya has alcanzado el numero maximo de votos permitidos.");
    } else if (message.includes("Ya habias votado")) {
      setYaVotado(true);
      setError("Ya habias votado este proyecto.");
    } else if (message.includes("jurado") || message.includes("JURADO")) {
      setError("Solo jurado u organizador puede votar en esta votacion.");
    } else {
      setError(message || "No se pudo registrar el voto.");
    }
  }

  async function submitVote() {
    if (!comentarioCumplido) {
      setError("El comentario es obligatorio en esta votacion.");
      return;
    }

    try {
      setVoting(true);
      setError("");

      if (esSimple) {
        await votarProyectoSimple(
          votacionProyectoId,
          token,
          comentariosActivos ? comentario.trim() : "",
          usuario?.id
        );
      }

      if (esPuntos) {
        await votarProyectoPuntos({
          votacionProyectoId,
          anonTokenHash: token,
          usuarioId: usuario?.id,
          puntuacion: Number(puntuacion),
          comentario: comentariosActivos ? comentario.trim() : "",
        });
      }

      if (esMulticriterio || esPonderada) {
        await votarProyectoMulticriterio({
          votacionProyectoId,
          anonTokenHash: token,
          usuarioId: usuario?.id,
          comentario: comentariosActivos ? comentario.trim() : "",
          puntuaciones: criterios.map((criterio) => ({
            criterioId: criterio.id,
            puntuacion: Number(ratings[criterio.id]),
            comentario: comentariosActivos ? comentariosCriterio[criterio.id] || "" : "",
          })),
        });
      }

      setConfirmOpen(false);
      setSuccessData({
        confirmationCode: `#VOTE-${new Date().getFullYear()}-${String(
          Date.now()
        ).slice(-3)}`,
      });
    } catch (err) {
      setConfirmOpen(false);
      handleError(err.message || "");
    } finally {
      setVoting(false);
    }
  }

  if (loading) {
    return (
      <main className="voting-detail-page">
        <div className="feedback-card">Cargando votacion...</div>
      </main>
    );
  }

  if (error && !proyecto) {
    return (
      <main className="voting-detail-page">
        <div className="feedback-card error-box">{error}</div>
      </main>
    );
  }

  if (successData) {
    return (
      <SuccessScreen
        proyecto={proyecto}
        equipo={proyecto?.equipo}
        modalidad={modalidad}
        criterios={criterios}
        ratings={ratings}
        puntuacion={puntuacion}
        confirmationCode={successData.confirmationCode}
        onBack={() => navigate(`/eventos/${eventoId}`)}
        onResults={() =>
          navigate(`/eventos/${eventoId}/votaciones/${votingId}/resultados`)
        }
      />
    );
  }

  return (
    <main className="voting-detail-page voting-pro-page">
      <button
        type="button"
        className="back-link"
        onClick={() => navigate(`/eventos/${eventoId}/proyectos/${proyectoId}`)}
      >
        <ArrowLeft size={16} />
        Volver al proyecto
      </button>

      <section className="vote-project-hero">
        <div>
          <div className="vote-hero-tags">
            <span>{typeLabel(tipo)}</span>
            <span>{modalityLabel(modalidad)}</span>
            <span className={`state-${estadoActual.toLowerCase()}`}>
              {stateLabel(estadoActual)}
            </span>
          </div>

          <h1>{proyecto?.nombre}</h1>
          <p>{proyecto?.descripcion || "Sin descripcion disponible."}</p>

          <div className="vote-project-meta-grid">
            <div>
              <Users size={17} />
              <span>Equipo</span>
              <strong>{proyecto?.equipo?.nombre || "Sin equipo"}</strong>
            </div>
            <div>
              <Vote size={17} />
              <span>Votos actuales</span>
              <strong>{voteCount}</strong>
            </div>
            <div>
              <Star size={17} />
              <span>{scoreMetricLabel}</span>
              <strong>{scorePreview}</strong>
            </div>
          </div>
        </div>

        <aside className="vote-side-summary">
          <span>Estado de participacion</span>
          <strong>
            {yaVotado
              ? "Ya votado"
              : !puedeVotar
                ? "Sin permiso"
                : haAlcanzadoMaximo
                  ? "Maximo alcanzado"
                  : admiteVotos
                    ? "Listo para votar"
                    : stateLabel(estadoActual)}
          </strong>
          <p>
            {votacion?.inicio ? formatDateTime(votacion.inicio) : "Sin inicio"} -{" "}
            {votacion?.fin ? formatDateTime(votacion.fin) : "Sin fin"}
          </p>
        </aside>
      </section>

      <section className="vote-workspace-grid">
        <section className="vote-form-panel">
          <div className="vote-panel-heading">
            <div>
              <h2>{modalityLabel(modalidad)}</h2>
              <p>
                {esPopular ? "Votacion popular" : "Evaluacion de jurado"} para este proyecto.
              </p>
            </div>
            <span>{tipo} / {modalidad}</span>
          </div>

          {!puedeVotar && (
            <div className="feedback-card error-box">
              Esta votacion es de jurado. Solo pueden votar usuarios con rol JURADO u ORGANIZADOR.
            </div>
          )}

          {yaVotado && (
            <div className="feedback-card warning-box vote-status-message">
              <strong>Ya habias votado este proyecto.</strong>
            </div>
          )}

          {estadoActual === "PENDIENTE" && (
            <div className="feedback-card warning-box">
              La votacion todavia no ha comenzado.
            </div>
          )}
          {estadoActual === "PAUSADA" && (
            <div className="feedback-card warning-box">
              La votacion esta pausada por el organizador.
            </div>
          )}
          {estadoActual === "CERRADA" && (
            <div className="feedback-card error-box">
              La votacion ha finalizado. Ya no es posible votar.
            </div>
          )}

          {!yaVotado && haAlcanzadoMaximo && (
            <div className="feedback-card warning-box">
              Ya has alcanzado el numero maximo de votos permitidos.
            </div>
          )}

          {error && <div className="feedback-card error-box">{error}</div>}

          {yaVotado && (
            <div className="vote-registered-score-card">
              <CheckCircle2 size={26} />
              <div>
                <span>Tu voto registrado</span>
                <strong>{votoRegistradoLabel || "Registrado"}</strong>
              </div>
            </div>
          )}

          {puedeRellenarFormulario && esSimple && (
            <div className="simple-vote-box vote-simple-card">
              <CheckCircle2 size={30} />
              <strong>Voto simple</strong>
              <span>Tu voto contara como una seleccion directa para este proyecto.</span>
            </div>
          )}

          {puedeRellenarFormulario && esPuntos && (
            <div className="vote-points-card">
              <div className="vote-points-header">
                <span>Puntuacion del 1 al 10</span>
                <strong>{puntuacion}/10</strong>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={puntuacion}
                disabled={!puedeRellenarFormulario || voting}
                onChange={(e) => setPuntuacion(clampScore(e.target.value, 1, 10))}
              />
              <input
                type="number"
                min="1"
                max="10"
                value={puntuacion}
                disabled={!puedeRellenarFormulario || voting}
                onChange={(e) => setPuntuacion(clampScore(e.target.value, 1, 10))}
              />
            </div>
          )}

          {puedeRellenarFormulario && (esMulticriterio || esPonderada) && (
            <div className="criteria-rating-list vote-criteria-list">
              {criterios.map((criterio) => (
                <article className="criteria-rating-card vote-criteria-card" key={criterio.id}>
                  <div className="criteria-rating-header">
                    <div>
                      <strong>{criterio.nombre}</strong>
                      <p>{criterio.descripcion || "Sin descripcion disponible."}</p>
                    </div>

                    <div className="criteria-score-chip">
                      {ratings[criterio.id] || 0}/5
                      {esPonderada && <small>{criterio.peso}%</small>}
                    </div>
                  </div>

                  <StarsInput
                    value={ratings[criterio.id]}
                    disabled={!puedeRellenarFormulario || voting}
                    onChange={(value) =>
                      setRatings((prev) => ({
                        ...prev,
                        [criterio.id]: value,
                      }))
                    }
                  />

                  {comentariosActivos ? (
                    <textarea
                      rows={3}
                      value={comentariosCriterio[criterio.id] || ""}
                      disabled={!puedeRellenarFormulario || voting}
                      onChange={(e) =>
                        setComentariosCriterio((prev) => ({
                          ...prev,
                          [criterio.id]: e.target.value,
                        }))
                      }
                      placeholder="Comentario opcional para este criterio..."
                    />
                  ) : null}
                </article>
              ))}
            </div>
          )}

          {comentariosActivos && puedeRellenarFormulario ? (
            <label className="voting-selector-field vote-comment-field vote-comment-pro">
              <span>
                Comentario {comentarioObligatorio ? "obligatorio" : "opcional"}
              </span>
              <textarea
                rows={5}
                value={comentario}
                disabled={!puedeRellenarFormulario || voting}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Escribe tu valoracion del proyecto"
              />
            </label>
          ) : !comentariosActivos ? (
            <div className="vote-comments-disabled">
              Esta votacion no permite comentarios.
            </div>
          ) : null}

          <div className="vote-action-row">
            <button
              className="primary-btn"
              onClick={() => setConfirmOpen(true)}
              disabled={
                voting ||
                !puedeVotar ||
                (esSimple ? !canSubmitSimple : !canSubmitMulti)
              }
            >
              {voting ? (
                <><CheckCircle2 size={18} />Enviando...</>
              ) : !admiteVotos ? (
                <><CheckCircle2 size={18} />
                  {estadoActual === "PENDIENTE" ? "Aun no ha comenzado" :
                   estadoActual === "PAUSADA" ? "Pausada" : "Finalizada"}
                </>
              ) : yaVotado ? (
                <><CheckCircle2 size={18} />Ya votado</>
              ) : haAlcanzadoMaximo ? (
                <><CheckCircle2 size={18} />Maximo alcanzado</>
              ) : esSimple ? (
                <><Vote size={18} />Votar proyecto</>
              ) : (
                <><Vote size={18} />Enviar evaluacion</>
              )}
            </button>
          </div>
        </section>

        <aside className="vote-guidance-card">
          <h3>Resumen</h3>
          <div className="vote-preview-score">
            <strong>{scorePreview}</strong>
            <span>{yaVotado ? "Registrado" : puedeRellenarFormulario ? "Vista previa" : "No editable"}</span>
          </div>

          {puedeRellenarFormulario && (esMulticriterio || esPonderada) && (
            <>
              <div className="vote-progress-row">
                <span>Criterios completados</span>
                <strong>{ratedCount}/{criterios.length}</strong>
              </div>
              <div className="vote-progress-bar">
                <div style={{ width: `${progressPercent}%` }} />
              </div>
            </>
          )}

          <div className="vote-requirements-list">
            <div className={puedeVotar ? "ok" : ""}>
              <CheckCircle2 size={16} />
              <span>Permiso de voto</span>
            </div>
            <div className={!yaVotado ? "ok" : ""}>
              <CheckCircle2 size={16} />
              <span>No votado previamente</span>
            </div>
            {comentariosActivos && comentarioObligatorio && (
              <div className={comentarioCumplido ? "ok" : ""}>
                <CheckCircle2 size={16} />
                <span>Comentario obligatorio</span>
              </div>
            )}
            <div className={admiteVotos ? "ok" : ""}>
              <CheckCircle2 size={16} />
              <span>Votacion abierta</span>
            </div>
          </div>
        </aside>
      </section>

      <ConfirmSubmitModal
        open={confirmOpen}
        loading={voting}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={submitVote}
      />

      <ErrorModal
        open={errorModal.open}
        title={errorModal.title}
        message={errorModal.message}
        onClose={() => setErrorModal({ open: false, title: "", message: "" })}
      />
    </main>
  );
}

export default ProjectVotingDetailScreen;
