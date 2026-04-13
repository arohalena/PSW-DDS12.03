import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Users, Vote } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getProyectosByEvento } from "../services/proyectoService";
import { getEquipos } from "../services/equipoService";
import { getVotingToken } from "../services/sessionService";
import {
  getAsignacionesCompetidorEvento,
  getConteoVotos,
  getVotacionProyectosByVotacion,
  getVotacionesByEvento,
  haAlcanzadoMaximoVotacion,
  votarProyecto,
  yaHaVotadoProyecto,
} from "../services/votacionService";
import "../styles/voting-detail.css";

function ProjectVotingDetailScreen() {
  const { eventoId, proyectoId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [proyectos, setProyectos] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [votacionPopular, setVotacionPopular] = useState(null);
  const [votacionProyectos, setVotacionProyectos] = useState([]);
  const [voteCount, setVoteCount] = useState(0);
  const [yaVotado, setYaVotado] = useState(false);
  const [haAlcanzadoMaximo, setHaAlcanzadoMaximo] = useState(false);

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

        const votacion = votacionesData.find((v) => v.tipo === "POPULAR") || null;

        let votacionProyectosData = [];
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
        }

        setProyectos(proyectosData);
        setEquipos(equiposData.filter((e) => e.evento?.id === eventoId));
        setAsignaciones(asignacionesData);
        setVotacionPopular(votacion);
        setVotacionProyectos(votacionProyectosData);
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

  const handleVote = async () => {
    if (!proyecto?.votacionProyectoId || yaVotado || haAlcanzadoMaximo) return;

    try {
      setVoting(true);
      setError("");
      setSuccess("");

      const token = getVotingToken();
      await votarProyecto(proyecto.votacionProyectoId, token);

      navigate("/votar", {
        state: {
          successMessage: "Voto recibido correctamente.",
          eventoId,
        },
      });
    } catch (err) {
      const message = err.message || "";

      if (message.includes("máximo")) {
        setError("Ya has alcanzado el número máximo de votos permitidos.");
        setHaAlcanzadoMaximo(true);
      } else if (message.includes("Ya habías votado este proyecto")) {
        setError("Ya habías votado este proyecto.");
        setYaVotado(true);
      } else if (message.includes("no está abierta")) {
        setError("La votación no está abierta.");
      } else if (message.includes("todavía no ha comenzado")) {
        setError("La votación todavía no ha comenzado.");
      } else if (message.includes("ya ha finalizado")) {
        setError("La votación ya ha finalizado.");
      } else {
        setError(message || "No se pudo registrar el voto.");
      }
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
          <p>Evalúa el proyecto según los criterios establecidos</p>
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
        <h3>Votación Popular</h3>
        <p>Pulsa el botón para registrar tu voto a este proyecto.</p>

        <div className="vote-count-box">
          <strong>Votos actuales:</strong> {voteCount}
        </div>

        {yaVotado && (
          <div className="feedback-card warning-box">
            Ya habías votado este proyecto.
          </div>
        )}

        {!yaVotado && haAlcanzadoMaximo && (
          <div className="feedback-card warning-box">
            Ya has alcanzado el número máximo de votos permitidos en esta votación.
          </div>
        )}

        {error && <div className="feedback-card error-box">{error}</div>}
        {success && <div className="feedback-card success-box">{success}</div>}

        <div className="vote-action-row">
          <button
            className="primary-btn"
            onClick={handleVote}
            disabled={
              voting ||
              !proyecto.votacionProyectoId ||
              !votacionPopular ||
              yaVotado ||
              haAlcanzadoMaximo
            }
          >
            {voting ? (
              <>
                <CheckCircle2 size={18} />
                Registrando voto...
              </>
            ) : yaVotado ? (
              <>
                <CheckCircle2 size={18} />
                Ya votado
              </>
            ) : haAlcanzadoMaximo ? (
              <>
                <CheckCircle2 size={18} />
                Máximo alcanzado
              </>
            ) : (
              <>
                <Vote size={18} />
                Votar proyecto
              </>
            )}
          </button>
        </div>
      </section>
    </main>
  );
}

export default ProjectVotingDetailScreen;