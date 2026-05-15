import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Calendar, Eye, Star, Trophy, Users } from "lucide-react";

import { QuickCard } from "../../components/QuickCard";
import { StatCard }  from "../../components/StatCard";
import { isActiveEvent, formatDate, getEventoFechaInicio, getEventoFechaFin } from "../../components/dashboardUtils";
import { getMiProyectoDashboard } from "../../services/proyectoService";


function DashboardCompetidor({ usuario, eventos }) {
  const [miProyecto,      setMiProyecto]      = useState(null);
  const [loadingProyecto, setLoadingProyecto] = useState(true);

  const eventosActivos = eventos.filter(isActiveEvent);

  useEffect(() => {
    if (!usuario?.id) { setLoadingProyecto(false); return; }
    getMiProyectoDashboard(usuario.id)
      .then(setMiProyecto)
      .catch(() => setMiProyecto(null))
      .finally(() => setLoadingProyecto(false));
  }, [usuario?.id]);

  const posicion       = miProyecto?.posicion   ?? "—";
  const puntuacion     = miProyecto?.puntuacion  ?? "—";
  const totalVotos     = miProyecto?.totalVotos  ?? "—";
  const nombreProyecto = miProyecto?.nombre      ?? null;

  return (
    <div className="dashboard-page">

      {/* Cabecera */}
      <div className="dashboard-header">
        <div>
          <h1>Bienvenido, {usuario?.nombre || "Competidor"} </h1>
          <p>Panel de competidor — Gestiona tu proyecto y revisa tu progreso</p>
        </div>
      </div>

      {/* Estadísticas: card hero de posición + 3 cards normales */}
      <div className="dashboard-stats-grid">
        <div className="dash-stat-card dash-stat-card--hero">
          <Trophy size={32} style={{ opacity: 0.85, marginBottom: 8 }} />
          <p className="dash-stat-label">Tu Posición</p>
          <strong className="dash-stat-value">
            {loadingProyecto ? "…" : `#${posicion}`}
          </strong>
        </div>
        <StatCard
          label="Puntuación"
          value={loadingProyecto ? "…" : puntuacion}
          icon={Star}
          colorClass="orange"
        />
        <StatCard
          label="Votos"
          value={loadingProyecto ? "…" : totalVotos}
          icon={Users}
          colorClass="purple"
        />
        <StatCard
          label="Vistas"
          value="—"
          icon={Eye}
          colorClass="blue"
        />
      </div>

      {/* Acciones rápidas */}
      <div className="dashboard-quick-grid">
        <QuickCard
          to="/configuracion"
          iconColor="purple"
          Icon={Trophy}
          title="Mi Proyecto"
          description="Gestiona tu proyecto y sube material."
        />
        <QuickCard
          to="/eventos"
          iconColor="blue"
          Icon={Calendar}
          title="Ver Eventos"
          description="Explora los eventos en los que participas."
        />
      </div>

      {/* Mis eventos */}
      <section className="dashboard-card">
        <div className="dashboard-card-header">
          <div>
            <h2>Mis Eventos</h2>
            <p>Eventos donde tu proyecto compite.</p>
          </div>
          <Link className="dashboard-link" to="/eventos">Ver todos</Link>
        </div>
        <div className="dashboard-events-list">
          {eventosActivos.length > 0 ? (
            eventosActivos.slice(0, 3).map((ev) => (
              <Link key={ev.id} to={`/eventos/${ev.id}`} className="dashboard-event-row">
                <div>
                  <div className="dashboard-event-title">
                    <h3>{ev.nombre}</h3>
                    <span className="pill pill-green">Activo</span>
                  </div>

                  {nombreProyecto && (
                    <p>Tu proyecto: <strong>{nombreProyecto}</strong></p>
                  )}

                  <div className="dashboard-event-meta">
                    <span>Inicio: {formatDate(getEventoFechaInicio(ev))}</span>
                    <span>•</span>
                    <span>Fin: {formatDate(getEventoFechaFin(ev))}</span>
                  </div>
                </div>
                <ArrowRight size={20} />
              </Link>
            ))
          ) : (
            <div className="dashboard-empty">
              No participas en eventos activos todavía.{" "}
              <Link to="/eventos">Explorar eventos</Link>
            </div>
          )}
        </div>
      </section>

    </div>
  );
}

export default DashboardCompetidor;