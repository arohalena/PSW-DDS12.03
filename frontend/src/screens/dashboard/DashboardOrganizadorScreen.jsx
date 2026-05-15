import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Calendar, FolderKanban, Play, TrendingUp, Users } from "lucide-react";

import { AlertBanner } from "../../components/AlertBanner";
import { QuickCard }   from "../../components/QuickCard";
import { StatCard }    from "../../components/StatCard";
import { EventRow }    from "../../components/EventRow";
import { isActiveEvent } from "../../components/dashboardUtils";

function DashboardOrganizador({ usuario, eventos, proyectos, usuarios }) {
  const [showAlert, setShowAlert] = useState(true);

  const eventosActivos = eventos.filter(isActiveEvent);
  const votantes = usuarios.filter((u) =>
    ["PUBLICO", "ESPECTADOR", "COMPETIDOR", "JURADO"].includes(u.rol)
  );

  return (
    <div className="dashboard-page">

      {/* Cabecera */}
      <div className="dashboard-header">
        <div>
          <h1>Bienvenido, {usuario?.nombre || "Organizador"} </h1>
          <p>Panel de organizador — Gestiona tus eventos y votaciones</p>
        </div>
      </div>

      {/* Alerta dismissible */}
      {showAlert && (
        <AlertBanner
          type="warning"
          title="Votación próxima a cerrar"
          message="Revisa las votaciones activas y asegúrate de que los participantes han enviado sus evaluaciones."
          actionLabel="Ver Eventos"
          actionHref="/eventos"
          dismissible
        />
      )}

      {/* Acciones rápidas */}
      <div className="dashboard-quick-grid">
        <QuickCard
          to="/eventos"
          iconColor="blue"
          Icon={Calendar}
          title="Ver Eventos"
          description="Explora todos los eventos públicos y privados."
        />
        <QuickCard
          to="/proyectos"
          iconColor="purple"
          Icon={FolderKanban}
          title="Proyectos"
          description="Gestiona y revisa todos los proyectos registrados."
        />
      </div>

      {/* Continuar donde lo dejaste */}
      <section className="dashboard-card">
        <div className="dashboard-card-header">
          <div>
            <h2>Continuar donde lo dejaste</h2>
            <p>Accesos directos del flujo principal.</p>
          </div>
          <Play size={20} />
        </div>
        <div className="dashboard-continue-list">
          <Link to="/eventos" className="dashboard-continue-row">
            <span />
            <div>
              <strong>Entrar a eventos disponibles</strong>
              <p>Busca un evento e introduce el código privado si hace falta.</p>
            </div>
            <ArrowRight size={19} />
          </Link>
          <Link to="/proyectos" className="dashboard-continue-row">
            <span />
            <div>
              <strong>Gestionar proyectos globales</strong>
              <p>Revisa proyectos asignados o pendientes de asignación.</p>
            </div>
            <ArrowRight size={19} />
          </Link>
          <Link to="/usuarios" className="dashboard-continue-row">
            <span />
            <div>
              <strong>Gestión de usuarios</strong>
              <p>Administra jurados, competidores y espectadores.</p>
            </div>
            <ArrowRight size={19} />
          </Link>
        </div>
      </section>

      {/* Estadísticas */}
      <div className="dashboard-stats-grid">
        <StatCard label="Eventos Activos"   value={eventosActivos.length} icon={Calendar}    colorClass="blue"   />
        <StatCard label="Proyectos Totales" value={proyectos.length}      icon={FolderKanban} colorClass="purple" />
        <StatCard label="Votantes"          value={votantes.length}       icon={Users}        colorClass="green"  />
        <StatCard label="Total Usuarios"    value={usuarios.length}       icon={TrendingUp}   colorClass="orange" />
      </div>

      {/* Eventos activos */}
      <section className="dashboard-card">
        <div className="dashboard-card-header">
          <div>
            <h2>Eventos activos</h2>
            <p>Click en un evento para ir a su detalle.</p>
          </div>
          <Link className="dashboard-link" to="/eventos">Ver todos</Link>
        </div>
        <div className="dashboard-events-list">
          {eventosActivos.length > 0
            ? eventosActivos.slice(0, 4).map((ev) => <EventRow key={ev.id} evento={ev} />)
            : <div className="dashboard-empty">No hay eventos activos todavía.</div>
          }
        </div>
      </section>

    </div>
  );
}

export default DashboardOrganizador;