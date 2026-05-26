import "../../styles/events.css";
import { Star, Users, Vote } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function EventProjectCard({ eventoId, votingId, proyecto, votacionProyecto, votes, votingOpen }) {
  const navigate = useNavigate();

  return (
    <article className="event-detail-project-card">
      <div className="event-detail-project-cover">
        {proyecto.nombre?.charAt(0)?.toUpperCase() || "P"}
      </div>

      <div className="event-detail-project-body">
        <div className="event-detail-project-header">
          <div>
            <h3>{proyecto.nombre}</h3>
            <p>{proyecto.descripcion || "Proyecto participante del evento."}</p>
          </div>

          <span className="event-detail-project-badge">
            {votes ?? 0} votos
          </span>
        </div>

        <div className="event-detail-project-meta">
          <span>
            <Star size={14} />
            Evaluación abierta
          </span>
        </div>

        <div className="event-detail-project-actions">
          <button
            type="button"
            className="secondary-btn"
            onClick={() => navigate(`/eventos/${eventoId}/proyectos/${proyecto.id}`)}
          >
            Ver detalle
          </button>

          {votacionProyecto ? (
            <button
              type="button"
              className="primary-btn"
              onClick={() =>
                navigate(`/eventos/${eventoId}/votaciones/${votingId}/proyectos/${proyecto.id}/votar`)
              }
            >
              <Vote size={16} />
              {votingOpen ? "Votar" : "Votación no activa"}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}