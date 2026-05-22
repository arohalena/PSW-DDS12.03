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

        <h2>¿Enviar evaluación?</h2>

        <p>
          Una vez enviada, tu evaluación será registrada. ¿Estás seguro de
          continuar?
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
            {loading ? "Enviando..." : "Sí, enviar evaluación"}
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

        <h1>¡Voto Registrado Correctamente!</h1>
        <p>Tu evaluación ha sido enviada y registrada en el sistema</p>
      </section>

      <section className="vote-success-content">
        <h2>Resumen de tu Evaluación</h2>

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
            <span>Código de confirmación:</span>
            <strong className="vote-confirm-code">{confirmationCode}</strong>
          </div>
        </div>

        {(modalidad === "MULTICRITERIO" ||
          modalidad === "MULTICRITERIO_PONDERADA") && (
          <div className="vote-score-box">
            <h3>Calificaciones Otorgadas</h3>

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
              <span>Puntuación Total:</span>
              <strong>{total.toFixed(2)}/5.00</strong>
            </div>
          </div>
        )}

        {modalidad === "PUNTOS" && (
          <div className="vote-score-box">
            <h3>Puntuación Otorgada</h3>

            <div className="vote-total-row">
              <span>Puntuación Total:</span>
              <strong>{puntuacion}/10</strong>
            </div>
          </div>
        )}

        {modalidad === "SIMPLE" && (
          <div className="vote-score-box">
            <h3>Voto Simple</h3>

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
            Ver Resultados
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
          throw new Error("No se ha encontrado la votación.");
        }

        const relaciones = await getVotacionProyectosByVotacion(votingId);

        const relacion = relaciones.find(
          (item) => String(item.proyecto?.id) === String(proyectoId)
        );

        if (!relacion) {
          throw new Error("Este proyecto no pertenece a esta votación.");
        }

        let criteriosData = [];

        if (
          votacionActual.modalidad === "MULTICRITERIO" ||
          votacionActual.modalidad === "MULTICRITERIO_PONDERADA"
        ) {
          criteriosData = await getCriteriosByVotacion(votacionActual.id);
        }

        setProyectos(proyectosData || []);
        setEquipos((equiposData || []).filter((e) => e.evento?.id === eventoId));
        setAsignaciones(asignacionesData || []);
        setVotacion(votacionActual);
        setVotacionProyectoId(relacion.id);
        setCriterios(criteriosData || []);

        setVoteCount(await getConteoVotos(relacion.id));
        setYaVotado(await yaHaVotadoProyecto(relacion.id, token));
        setHaAlcanzadoMaximo(
          await haAlcanzadoMaximoVotacion(votacionActual.id, token)
        );
      } catch (err) {
        setError(err.message || "No se pudo cargar la votación.");
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
      equipos.find((eq) => String(eq.id) === String(proyectoBase.equipo?.id)) ||
      equipos.find((eq) => String(eq.proyecto?.id) === String(proyectoId)) ||
      null;

    const miembros = equipo
      ? asignaciones
          .filter((a) => String(a.equipo?.id) === String(equipo.id))
          .map((a) => a.competidor)
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

  function handleError(message) {
    if (message.includes("propio proyecto") || message.includes("auto-votación")) {
      setErrorModal({
        open: true,
        title: "No puedes votar a tu propio proyecto",
        message:
          "El organizador del evento ha configurado esta votación para no permitir que los participantes voten a su propio proyecto.",
      });
      return;
    }

    if (message.includes("máximo")) {

      setHaAlcanzadoMaximo(true);
      setError("Ya has alcanzado el número máximo de votos permitidos.");

    } else if (message.includes("Ya habías votado")) {

      setYaVotado(true);
      setError("Ya habías votado este proyecto.");

    } else if (message.includes("jurado") || message.includes("JURADO")) {

      setError("Solo jurado u organizador puede votar en esta votación.");
      
    } else {

      setError(message || "No se pudo registrar el voto.");

    }
  }

  async function submitVote() {

    if (!comentarioCumplido) {
    setError("El comentario es obligatorio en esta votación.");
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
        <div className="feedback-card">Cargando votación...</div>
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
    <main className="voting-detail-page">
      <button
        type="button"
        className="back-link"
        onClick={() => navigate(`/eventos/${eventoId}/proyectos/${proyectoId}`)}
      >
        <ArrowLeft size={16} />
        Volver al proyecto
      </button>

      <header className="detail-page-header">
        <div>
          <h1>Evaluación de Proyecto</h1>
          <p>
            {esPopular ? "Votación popular" : "Evaluación de jurado"} ·{" "}
            {modalidad}
          </p>
        </div>

        <span className="project-tag">
          {tipo} + {modalidad}
        </span>
      </header>

      <section className="detail-main-card">
        <h2>{proyecto?.nombre}</h2>
        <p>{proyecto?.descripcion || "Sin descripción disponible."}</p>

        <div className="project-meta-inline">
          <Users size={16} />
          <span>
            {proyecto?.equipo?.nombre || "Sin equipo"} ·{" "}
            {proyecto?.miembros?.length || 0} integrantes
          </span>
        </div>

        <div className="vote-count-box">
          <strong>Votos actuales:</strong> {voteCount}
        </div>
      </section>

      <section className="detail-main-card">
        <h3>
          {esSimple && "Voto simple"}
          {esPuntos && "Votación por puntos"}
          {esMulticriterio && "Evaluación multicriterio"}
          {esPonderada && "Evaluación multicriterio ponderada"}
        </h3>

        {!puedeVotar && (
          <div className="feedback-card error-box">
            Esta votación es de jurado. Solo pueden votar usuarios con rol
            JURADO u ORGANIZADOR.
          </div>
        )}

        {yaVotado && (
          <div className="feedback-card warning-box">
            Ya habías votado este proyecto.
          </div>
        )}

        {votacion && (
          <div className="feedback-card">
            <strong>Franja de votación:</strong>{" "}
            {votacion.inicio ? new Date(votacion.inicio).toLocaleString() : "—"} →{" "}
            {votacion.fin ? new Date(votacion.fin).toLocaleString() : "—"}
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
            Ya has alcanzado el número máximo de votos permitidos.
          </div>
        )}

        {error && <div className="feedback-card error-box">{error}</div>}

        {esSimple && (
          <div className="simple-vote-box">
            <CheckCircle2 size={30} />
            <strong>Voto simple</strong>
            <span>
              Tu voto contará como una selección directa para este proyecto.
            </span>
          </div>
        )}

        {esPuntos && (
          <label className="voting-selector-field">
            <span>Puntuación del 1 al 10</span>
            <input
              type="number"
              min="1"
              max="10"
              value={puntuacion}
              disabled={!puedeVotar || yaVotado || haAlcanzadoMaximo || voting}
              onChange={(e) => setPuntuacion(Number(e.target.value))}
            />
          </label>
        )}

        {(esMulticriterio || esPonderada) && (
          <div className="criteria-rating-list">
            {criterios.map((criterio) => (
              <article className="criteria-rating-card" key={criterio.id}>
                <div className="criteria-rating-header">
                  <div>
                    <strong>{criterio.nombre}</strong>
                    <p>{criterio.descripcion || "Sin descripción disponible."}</p>
                  </div>

                  {esPonderada && (
                    <span className="criteria-weight">{criterio.peso}%</span>
                  )}
                </div>

                <StarsInput
                  value={ratings[criterio.id]}
                  disabled={!puedeVotar || yaVotado || haAlcanzadoMaximo || voting}
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
                  disabled={!puedeVotar || yaVotado || haAlcanzadoMaximo || voting}
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

        {comentariosActivos ? (
        <label className="voting-selector-field vote-comment-field">
          <span>
            Comentario {comentarioObligatorio ? "obligatorio" : "opcional"}
          </span>
          <textarea
            rows={5}
            value={comentario}
            disabled={!puedeVotar || yaVotado || haAlcanzadoMaximo || voting}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Escribe tu valoración del proyecto"
          />
        </label>
        ) : (
          <div className="vote-comments-disabled">
            Esta votación no permite comentarios.
          </div>
        )}

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
                {estadoActual === "PENDIENTE" ? "Aún no ha comenzado" :
                 estadoActual === "PAUSADA"   ? "Pausada" : "Finalizada"}
              </>
            ) : yaVotado ? (
              <><CheckCircle2 size={18} />Ya votado</>
            ) : haAlcanzadoMaximo ? (
              <><CheckCircle2 size={18} />Máximo alcanzado</>
            ) : esSimple ? (
              <><Vote size={18} />Votar proyecto</>
            ) : (
              <><Vote size={18} />Enviar evaluación</>
            )}
          </button>
        </div>
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