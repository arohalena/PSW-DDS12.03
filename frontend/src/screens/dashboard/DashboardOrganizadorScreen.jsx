import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, Calendar, FolderKanban, Play, TrendingUp, Users } from "lucide-react";

import { AlertBanner } from "../../components/AlertBanner";
import { QuickCard } from "../../components/QuickCard";
import { StatCard } from "../../components/StatCard";
import { EventRow } from "../../components/EventRow";
import { isActiveEvent } from "../../components/dashboardUtils";

function DashboardOrganizador({ usuario, eventos, proyectos, usuarios }) {
  const eventosActivos = eventos.filter(isActiveEvent);
  const votantes = usuarios.filter((u) =>
    ["PUBLICO", "ESPECTADOR", "COMPETIDOR", "JURADO"].includes(u.rol)
  );

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>Bienvenido, {usuario?.nombre || "Organizador"} </h1>
          <p>Panel de organizador - Gestiona eventos, votaciones y resultados</p>
        </div>
      </div>

      <div className="dashboard-quick-grid">
        <QuickCard
          to="/eventos"
          iconColor="blue"
          Icon={Calendar}
          title="Ver Eventos"
          description="Explora todos los eventos publicos y privados."
        />
        <QuickCard
          to="/proyectos"
          iconColor="purple"
          Icon={FolderKanban}
          title="Proyectos"
          description="Gestiona y revisa todos los proyectos registrados."
        />
        <QuickCard
          to="/eventos"
          iconColor="green"
          Icon={BarChart3}
          title="Resultados"
          description="Abre un evento y consulta sus rankings publicados."
        />
      </div>

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
              <p>Busca un evento e introduce el codigo privado si hace falta.</p>
            </div>
            <ArrowRight size={19} />
          </Link>
          <Link to="/proyectos" className="dashboard-continue-row">
            <span />
            <div>
              <strong>Gestionar proyectos globales</strong>
              <p>Revisa proyectos asignados o pendientes de asignacion.</p>
            </div>
            <ArrowRight size={19} />
          </Link>
          <Link to="/usuarios" className="dashboard-continue-row">
            <span />
            <div>
              <strong>Gestion de usuarios</strong>
              <p>Administra jurados, competidores y espectadores.</p>
            </div>
            <ArrowRight size={19} />
          </Link>
        </div>
      </section>

      <div className="dashboard-stats-grid">
        <StatCard label="Eventos Activos" value={eventosActivos.length} icon={Calendar} colorClass="blue" />
        <StatCard label="Proyectos Totales" value={proyectos.length} icon={FolderKanban} colorClass="purple" />
        <StatCard label="Votantes" value={votantes.length} icon={Users} colorClass="green" />
        <StatCard label="Total Usuarios" value={usuarios.length} icon={TrendingUp} colorClass="orange" />
      </div>

      <section className="dashboard-card">
        <div className="dashboard-card-header">
          <div>
            <h2>Eventos activos</h2>
            <p>Click en un evento para ir a su detalle.</p>
          </div>
          <Link className="dashboard-link" to="/eventos">Ver todos</Link>
        </div>
        <div className="dashboard-events-list">
          {eventosActivos.length > 0 ? (
            eventosActivos.slice(0, 4).map((ev) => <EventRow key={ev.id} evento={ev} />)
          ) : (
            <div className="dashboard-empty">No hay eventos activos todavia.</div>
          )}
        </div>
      </section>
    </div>
  );
}

export default DashboardOrganizador;
