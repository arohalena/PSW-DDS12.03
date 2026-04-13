import { useEffect, useMemo, useState } from "react";
import { CalendarDays, FolderKanban, MessageSquare, Trophy, Users, Vote } from "lucide-react";
import { getMiProyectoDashboard } from "../services/proyectoService";
import { getUsuarioLogueado } from "../services/sessionService";
import "../styles/my-project-dashboard.css";

function MyProjectDashboardScreen() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const usuario = useMemo(() => getUsuarioLogueado(), []);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        if (!usuario?.id) {
          throw new Error("No hay usuario autenticado.");
        }

        const data = await getMiProyectoDashboard(usuario.id);
        setDashboard(data);
      } catch (err) {
        setError(err.message || "No se pudo cargar el dashboard del proyecto.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [usuario?.id]);

  if (loading) {
    return (
      <main className="participant-dashboard-page">
        <div className="feedback-card">Cargando dashboard del proyecto...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="participant-dashboard-page">
        <div className="feedback-card error-box">{error}</div>
      </main>
    );
  }

  if (!dashboard?.proyecto) {
    return (
      <main className="participant-dashboard-page">
        <div className="feedback-card warning-box">
          No se ha encontrado un proyecto asociado a tu usuario.
        </div>
      </main>
    );
  }

  return (
    <main className="participant-dashboard-page">
      <div className="participant-dashboard-header">
        <h1>Dashboard del Participante</h1>
        <p>Visualiza la información de tu proyecto, sus votos y los comentarios publicados.</p>
      </div>

      <section className="participant-hero-card">
        <div className="participant-hero-content">
          <div>
            <h2>{dashboard.proyecto.nombre}</h2>
            <p className="participant-hero-subtitle">
              Equipo: {dashboard.equipo?.nombre || "Sin equipo"}
            </p>

            <div className="participant-hero-meta">
              <div>
                <p>Evento</p>
                <strong>{dashboard.evento?.nombre || "Sin evento"}</strong>
              </div>

              <div className="participant-divider" />

              <div>
                <p>Categoría</p>
                <strong>{dashboard.proyecto.tipoCategoria || "Sin categoría"}</strong>
              </div>
            </div>
          </div>

          <div className="participant-trophy-block">
            <div className="participant-trophy-circle">
              <Trophy size={42} />
            </div>
            <span>Mi proyecto</span>
          </div>
        </div>
      </section>

      <section className="participant-stats-grid">
        <article className="participant-stat-card">
          <div className="participant-stat-icon indigo">
            <Vote size={18} />
          </div>
          <div>
            <p>Total de votaciones</p>
            <strong>{dashboard.totalVotos}</strong>
          </div>
        </article>

        <article className="participant-stat-card">
          <div className="participant-stat-icon violet">
            <MessageSquare size={18} />
          </div>
          <div>
            <p>Comentarios publicados</p>
            <strong>{dashboard.comentarios?.length || 0}</strong>
          </div>
        </article>

        <article className="participant-stat-card">
          <div className="participant-stat-icon slate">
            <Users size={18} />
          </div>
          <div>
            <p>Equipo</p>
            <strong>{dashboard.equipo?.nombre || "Sin equipo"}</strong>
          </div>
        </article>

        <article className="participant-stat-card">
          <div className="participant-stat-icon blue">
            <CalendarDays size={18} />
          </div>
          <div>
            <p>Evento</p>
            <strong>{dashboard.evento?.nombre || "Sin evento"}</strong>
          </div>
        </article>
      </section>

      <section className="participant-project-card">
        <div className="participant-card-header">
          <div className="participant-card-title">
            <FolderKanban size={18} />
            <h3>Información del Proyecto</h3>
          </div>
        </div>

        <div className="participant-project-body">
          <div className="participant-project-field">
            <span>Nombre</span>
            <strong>{dashboard.proyecto.nombre}</strong>
          </div>

          <div className="participant-project-field">
            <span>Descripción</span>
            <p>{dashboard.proyecto.descripcion || "Sin descripción disponible."}</p>
          </div>

          <div className="participant-project-inline">
            <div className="participant-project-field">
              <span>Categoría</span>
              <strong>{dashboard.proyecto.tipoCategoria || "Sin categoría"}</strong>
            </div>

            <div className="participant-project-field">
              <span>Equipo</span>
              <strong>{dashboard.equipo?.nombre || "Sin equipo"}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="participant-comments-card">
        <div className="participant-card-header">
          <div className="participant-card-title">
            <MessageSquare size={18} />
            <h3>Comentarios Publicados</h3>
          </div>
          <span className="participant-comments-badge">
            {dashboard.comentarios?.length || 0}
          </span>
        </div>

        {!dashboard.comentarios || dashboard.comentarios.length === 0 ? (
          <div className="feedback-card">Todavía no hay comentarios publicados sobre tu proyecto.</div>
        ) : (
          <div className="participant-comments-list">
            {dashboard.comentarios.map((comentario) => (
              <article key={comentario.id} className="participant-comment-item">
                <div className="participant-comment-top">
                  <div className="participant-comment-avatar">A</div>
                  <div>
                    <p className="participant-comment-author">Anónimo</p>
                    <p className="participant-comment-date">
                      {comentario.createdAt
                        ? new Date(comentario.createdAt).toLocaleString("es-ES")
                        : ""}
                    </p>
                  </div>
                </div>

                <p className="participant-comment-text">{comentario.texto}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default MyProjectDashboardScreen;