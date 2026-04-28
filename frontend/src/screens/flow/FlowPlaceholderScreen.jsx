import { Link, useParams } from "react-router-dom";
import { BarChart3, FolderKanban, Lock, Vote } from "lucide-react";

function FlowPlaceholderScreen({ type }) {
  const { eventoId, proyectoId, votingId } = useParams();

  if (type === "eventDetail") {
    return (
      <div className="flow-placeholder">
        <div className="flow-breadcrumbs">
          <Link to="/eventos">Eventos</Link> &gt; Evento {eventoId}
        </div>

        <section className="flow-hero">
          <div>
            <span className="pill pill-orange">
              <Lock size={14} />
              Acceso privado preparado
            </span>
            <h1>Detalle de Evento</h1>
            <p>
              Ruta creada: <strong>/eventos/{eventoId}</strong>. Aquí irá la pantalla con header,
              tabs de votaciones, grid de proyectos, modal de código y acceso privado
            </p>
          </div>
        </section>

        <div className="flow-actions">
          <Link className="btn-primary-mock" to={`/eventos/${eventoId}/votaciones/crear`}>
            <Vote size={17} />
            Nueva Votación
          </Link>

          <Link className="btn-secondary-mock" to={`/eventos/${eventoId}/votaciones/${votingId || "demo"}/resultados`}>
            <BarChart3 size={17} />
            Ver Resultados
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flow-placeholder">
      <div className="flow-breadcrumbs">
        <Link to="/eventos">Eventos</Link> &gt;{" "}
        <Link to={`/eventos/${eventoId}`}>Evento {eventoId}</Link> &gt; Proyecto {proyectoId}
      </div>

      <section className="flow-hero">
        <div>
          <span className="pill pill-blue">
            <FolderKanban size={14} />
            Proyecto
          </span>
          <h1>Detalle de Proyecto</h1>
          <p>
            Ruta creada: <strong>/eventos/{eventoId}/proyectos/{proyectoId}</strong>. Aquí irá la
            pantalla con equipo, links, galería y botón de votar
          </p>
        </div>
      </section>

      <Link className="btn-primary-mock" to={`/eventos/${eventoId}/proyectos/${proyectoId}/votar`}>
        <Vote size={17} />
        Votar por este Proyecto
      </Link>
    </div>
  );
}

export default FlowPlaceholderScreen;