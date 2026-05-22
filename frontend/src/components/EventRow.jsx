import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { formatDate, isActiveEvent, getEventoFechaInicio, getEventoFechaFin } from "./dashboardUtils";

/**
 * Fila de evento en el listado del dashboard.
 * Muestra nombre, estado (activo/finalizado), descripción y fechas.
 */
export function EventRow({ evento }) {
  const activo = isActiveEvent(evento);

  return (
    <Link to={`/eventos/${evento.id}`} className="dashboard-event-row">
      <div>
        <div className="dashboard-event-title">
          <h3>{evento.nombre}</h3>
          <span className={activo ? "pill pill-green" : "pill pill-gray"}>
            {activo ? "Activo" : "Finalizado"}
          </span>
        </div>
        <p>{evento.descripcion || "Evento de votación y evaluación de proyectos."}</p>
        <div className="dashboard-event-meta">
          <span>Inicio: {formatDate(getEventoFechaInicio(evento))}</span>
          <span>•</span>
          <span>Fin: {formatDate(getEventoFechaFin(evento))}</span>
        </div>
      </div>
      <ArrowRight size={20} />
    </Link>
  );
}