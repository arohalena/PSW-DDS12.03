import { Link } from "react-router-dom";
import { Calendar, CheckCircle, Gavel, Star } from "lucide-react";

import { QuickCard } from "../../components/QuickCard";
import { StatCard } from "../../components/StatCard";
import { isActiveEvent } from "../../components/dashboardUtils";

function DashboardJurado({ usuario, eventos, eventData = [] }) {
  const totalEventosActivos =
    eventData.length > 0
      ? eventData.filter(({ evento }) => isActiveEvent(evento)).length
      : eventos.filter(isActiveEvent).length;

  const datosEvaluables = eventData.filter(({ evento, votacionesJurado, votaciones }) => {
    const votacionesEvaluables =
      votacionesJurado || (votaciones || []).filter((v) => v.tipo === "JURADO" || v.tipo === "MIXTA");

    return isActiveEvent(evento) && votacionesEvaluables.length > 0;
  });

  const getProyectoIdsEvaluables = ({ relacionesPorVotacion, proyectos }) => {
    const ids = new Set();

    (relacionesPorVotacion || []).forEach(({ relaciones }) => {
      (relaciones || []).forEach(({ relacion }) => {
        const proyectoId = relacion?.proyecto?.id || relacion?.proyectoId;
        if (proyectoId) ids.add(String(proyectoId));
      });
    });

    if (ids.size === 0) {
      (proyectos || []).forEach((proyecto) => {
        if (proyecto?.id) ids.add(String(proyecto.id));
      });
    }

    return ids;
  };

  const proyectosEvaluables = new Set(
    datosEvaluables.flatMap((item) => Array.from(getProyectoIdsEvaluables(item)))
  ).size;

  const evaluacionesUsuario = eventData.flatMap((item) => item.evaluacionesUsuario || []);
  const proyectosEvaluados = new Set(
    evaluacionesUsuario
      .map(({ relacion }) => relacion?.proyecto?.id || relacion?.proyectoId || relacion?.id)
      .filter(Boolean)
      .map(String)
  ).size;

  const puntuacionesOtorgadas = evaluacionesUsuario
    .map(({ voto }) => Number(voto.puntuacionTotal ?? voto.puntuacion ?? voto.mediaPuntos ?? 0))
    .filter((value) => value > 0);

  const promedioOtorgado =
    puntuacionesOtorgadas.length > 0
      ? (
          puntuacionesOtorgadas.reduce((sum, value) => sum + value, 0) /
          puntuacionesOtorgadas.length
        ).toFixed(1)
      : "-";

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>Bienvenido, {usuario?.nombre || "Jurado"} </h1>
          <p>Panel de jurado - Revisa eventos con votaciones de jurado o mixtas</p>
        </div>
      </div>

      <div className="dashboard-quick-grid">
        <QuickCard
          to="/eventos"
          iconColor="purple"
          Icon={Gavel}
          title="Evaluar proyectos"
          description="Entra a eventos con votaciones de jurado o mixtas."
        />
        <QuickCard
          to="/eventos"
          iconColor="blue"
          Icon={Calendar}
          title="Ver eventos"
          description="Consulta fechas, proyectos y votaciones disponibles."
        />
      </div>

      <div className="dashboard-stats-grid">
        <StatCard label="Eventos Activos" value={totalEventosActivos} icon={Calendar} colorClass="blue" />
        <StatCard label="Eventos Evaluables" value={datosEvaluables.length} icon={Gavel} colorClass="purple" />
        <StatCard label="Proyectos Evaluables" value={proyectosEvaluables} icon={Star} colorClass="orange" />
        <StatCard label="Evaluados" value={proyectosEvaluados} icon={CheckCircle} colorClass="green" />
      </div>

      <section className="dashboard-card">
        <div className="dashboard-card-header">
          <div>
            <h2>Eventos con evaluacion de jurado</h2>
            <p>Votaciones de tipo jurado o mixtas disponibles para revisar.</p>
          </div>
          <Gavel size={20} style={{ color: "#6366f1" }} />
        </div>
        <div className="dashboard-events-list">
          {datosEvaluables.length > 0 ? (
            datosEvaluables.slice(0, 5).map((item) => {
              const { evento, votacionesJurado, votaciones } = item;
              const votacionesEvaluables =
                votacionesJurado || (votaciones || []).filter((v) => v.tipo === "JURADO" || v.tipo === "MIXTA");
              const tipos = Array.from(new Set(votacionesEvaluables.map((v) => v.tipo))).join(" / ");
              const proyectosEvento = getProyectoIdsEvaluables(item).size;

              return (
                <Link
                  key={evento.id}
                  to={`/eventos/${evento.id}`}
                  className="dashboard-event-row dash-jury-project-row"
                >
                  <div>
                    <div className="dashboard-event-title">
                      <h3>{evento.nombre}</h3>
                      <span className="pill pill-blue">
                        {votacionesEvaluables.length} votacion
                        {votacionesEvaluables.length === 1 ? "" : "es"}
                      </span>
                    </div>
                    <p>
                      {proyectosEvento} proyecto{proyectosEvento === 1 ? "" : "s"} disponible
                      {proyectosEvento === 1 ? "" : "s"} para votaciones {tipos || "de jurado"}.
                    </p>
                  </div>
                  <span className="dash-btn-evaluar">Abrir evento</span>
                </Link>
              );
            })
          ) : (
            <div className="dashboard-empty">
              No hay eventos activos con votaciones de jurado o mixtas.
            </div>
          )}
        </div>
      </section>

      <section className="dashboard-card">
        <div className="dashboard-card-header">
          <div>
            <h2>Resumen de tus evaluaciones</h2>
            <p>Actividad registrada con tu usuario de jurado.</p>
          </div>
          <Star size={20} style={{ color: "#f97316" }} />
        </div>
        <div className="dashboard-jury-summary">
          <div>
            <span>Proyectos evaluados</span>
            <strong>{proyectosEvaluados}</strong>
          </div>
          <div>
            <span>Promedio otorgado</span>
            <strong>{promedioOtorgado}</strong>
          </div>
          <Link className="dashboard-link" to="/eventos">Ir a eventos</Link>
        </div>
      </section>
    </div>
  );
}

export default DashboardJurado;
