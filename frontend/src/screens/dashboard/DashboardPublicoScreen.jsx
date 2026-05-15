import { Link } from "react-router-dom";
import { ArrowRight, Calendar, Vote } from "lucide-react";

import { QuickCard } from "../../components/QuickCard";
import { isActiveEvent, formatDate, getEventoFechaFin } from "../../components/dashboardUtils";

function DashboardPublico({ usuario, eventos }) {
  const eventosActivos = eventos.filter(isActiveEvent);

  return (
    <div className="dashboard-page">

      {/* Cabecera */}
      <div className="dashboard-header">
        <div>
          <h1>Bienvenido, {usuario?.nombre || "Visitante"} </h1>
          <p>Explora eventos y vota por tus proyectos favoritos</p>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="dashboard-quick-grid">
        <QuickCard
          to="/eventos"
          iconColor="blue"
          Icon={Calendar}
          title="Ver Eventos"
          description="Explora todos los eventos disponibles."
        />
        <QuickCard
          to="/eventos"
          iconColor="green"
          Icon={Vote}
          title="Ir a Votar"
          description="Vota por tus proyectos favoritos en los eventos activos."
        />
      </div>

      {/* Eventos disponibles */}
      <section className="dashboard-card">
        <div className="dashboard-card-header">
          <div>
            <h2>Eventos disponibles para votar</h2>
            <p>Entra a un evento y participa con tu voto.</p>
          </div>
          <Link className="dashboard-link" to="/eventos">Ver todos</Link>
        </div>
        <div className="dashboard-events-list">
          {eventosActivos.length > 0 ? (
            eventosActivos.slice(0, 4).map((ev) => (
              <Link key={ev.id} to={`/eventos/${ev.id}`} className="dashboard-event-row">
                <div>
                  <div className="dashboard-event-title">
                    <h3>{ev.nombre}</h3>
                    <span className="pill pill-green">Votación activa</span>
                  </div>
                  <p>{ev.descripcion || "Evento de votación abierto al público."}</p>
                  <div className="dashboard-event-meta">
                    <span>Fin: {formatDate(getEventoFechaFin(ev))}</span>
                  </div>
                </div>
                <ArrowRight size={20} />
              </Link>
            ))
          ) : (
            <div className="dashboard-empty">
              No hay eventos con votación activa en este momento.
            </div>
          )}
        </div>
      </section>

    </div>
  );
}

export default DashboardPublico;