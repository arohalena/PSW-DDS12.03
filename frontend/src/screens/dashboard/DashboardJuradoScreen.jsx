import { Link } from "react-router-dom";
import { Calendar, CheckCircle, Gavel, Star } from "lucide-react";

import { AlertBanner } from "../../components/AlertBanner";
import { StatCard }    from "../../components/StatCard";
import { EventRow }    from "../../components/EventRow";
import { isActiveEvent } from "../../components/dashboardUtils";

function DashboardJurado({ usuario, eventos }) {
  const eventosActivos = eventos.filter(isActiveEvent);

  // Lista de proyectos pendientes de evaluar derivada de los eventos activos.
  // En producción esto vendría de un endpoint dedicado al jurado.
  const proyectosPendientes = eventosActivos
    .flatMap((ev) => [
      { id: `${ev.id}-1`, nombre: "AI Health Monitor",        evento: ev.nombre, eventoId: ev.id },
      { id: `${ev.id}-2`, nombre: "Green Energy Dashboard",   evento: ev.nombre, eventoId: ev.id },
      { id: `${ev.id}-3`, nombre: "EdTech Learning Platform", evento: ev.nombre, eventoId: ev.id },
    ])
    .slice(0, 5);

  return (
    <div className="dashboard-page">

      {/* Cabecera */}
      <div className="dashboard-header">
        <div>
          <h1>Bienvenido, {usuario?.nombre || "Jurado"} </h1>
          <p>Panel de jurado — Evalúa los proyectos pendientes</p>
        </div>
      </div>

      {/* Alerta de pendientes */}
      {proyectosPendientes.length > 0 && (
        <AlertBanner
          type="warning"
          title="Evaluaciones pendientes"
          message={`Tienes ${proyectosPendientes.length} proyecto${proyectosPendientes.length > 1 ? "s" : ""} pendiente${proyectosPendientes.length > 1 ? "s" : ""} de evaluar.`}
          actionLabel="Ir a Eventos"
          actionHref="/eventos"
        />
      )}

      {/* Estadísticas de evaluación */}
      <div className="dashboard-stats-grid">
        <StatCard label="Pendientes"      value={proyectosPendientes.length} icon={Gavel}      colorClass="blue"   />
        <StatCard label="Evaluados"       value={13}                         icon={CheckCircle} colorClass="green"  />
        <StatCard label="Eventos Activos" value={eventosActivos.length}      icon={Calendar}   colorClass="purple" />
        <StatCard label="Prom. Otorgado"  value="87.5"                       icon={Star}        colorClass="orange" />
      </div>

      {/* Lista de proyectos pendientes */}
      <section className="dashboard-card">
        <div className="dashboard-card-header">
          <div>
            <h2>Proyectos pendientes de evaluar</h2>
            <p>Accede directamente a la pantalla de evaluación.</p>
          </div>
          <Gavel size={20} style={{ color: "#6366f1" }} />
        </div>
        <div className="dashboard-events-list">
          {proyectosPendientes.length > 0 ? (
            proyectosPendientes.map((proj) => (
              <Link
                key={proj.id}
                to={`/eventos/${proj.eventoId}`}
                className="dashboard-event-row dash-jury-project-row"
              >
                <div>
                  <div className="dashboard-event-title">
                    <h3>{proj.nombre}</h3>
                    <span className="pill pill-orange">Pendiente</span>
                  </div>
                  <p>{proj.evento}</p>
                </div>
                <span className="dash-btn-evaluar">Evaluar →</span>
              </Link>
            ))
          ) : (
            <div className="dashboard-empty">
              ✅ No tienes proyectos pendientes de evaluar.
            </div>
          )}
        </div>
      </section>

      {/* Eventos donde participa como jurado */}
      <section className="dashboard-card">
        <div className="dashboard-card-header">
          <div>
            <h2>Eventos donde participas</h2>
            <p>Como jurado en estos eventos.</p>
          </div>
          <Link className="dashboard-link" to="/eventos">Ver todos</Link>
        </div>
        <div className="dashboard-events-list">
          {eventosActivos.length > 0
            ? eventosActivos.slice(0, 3).map((ev) => <EventRow key={ev.id} evento={ev} />)
            : <div className="dashboard-empty">No hay eventos activos.</div>
          }
        </div>
      </section>

    </div>
  );
}

export default DashboardJurado;