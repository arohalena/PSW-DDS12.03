import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Calendar, Eye, Star, Trophy, Users } from "lucide-react";

import { QuickCard } from "../../components/QuickCard";
import { StatCard } from "../../components/StatCard";
import { isActiveEvent, formatDate, getEventoFechaInicio, getEventoFechaFin } from "../../components/dashboardUtils";
import { getMiProyectoDashboard } from "../../services/proyectoService";

function normalizeId(value) {
  return value === undefined || value === null ? "" : String(value);
}

function getProyectoFromDashboardItem(item) {
  return item?.proyecto || item;
}

function DashboardCompetidor({ usuario, eventos }) {
  const [miProyecto, setMiProyecto] = useState(null);
  const [loadingProyecto, setLoadingProyecto] = useState(true);

  useEffect(() => {
    if (!usuario?.id) {
      setLoadingProyecto(false);
      return;
    }

    getMiProyectoDashboard(usuario.id)
      .then(setMiProyecto)
      .catch(() => setMiProyecto(null))
      .finally(() => setLoadingProyecto(false));
  }, [usuario?.id]);

  const proyectosDashboard = useMemo(() => {
    if (Array.isArray(miProyecto?.proyectosDashboard) && miProyecto.proyectosDashboard.length > 0) {
      return miProyecto.proyectosDashboard;
    }

    return miProyecto?.proyecto ? [miProyecto.proyecto] : [];
  }, [miProyecto]);

  const proyectosPorEvento = useMemo(() => {
    const map = new Map();

    proyectosDashboard.forEach((item) => {
      const proyecto = getProyectoFromDashboardItem(item);
      const eventoId =
        proyecto?.evento?.id ||
        proyecto?.eventoId ||
        item?.evento?.id ||
        item?.eventoId ||
        item?.votacion?.evento?.id ||
        item?.votacion?.eventoId;

      if (!eventoId) return;

      const key = normalizeId(eventoId);
      const proyectosEvento = map.get(key) || [];
      proyectosEvento.push(proyecto);
      map.set(key, proyectosEvento);
    });

    return map;
  }, [proyectosDashboard]);

  const eventosCompetidor = useMemo(() => {
    const byId = new Map();
    const addEvento = (evento) => {
      if (evento?.id) byId.set(normalizeId(evento.id), evento);
    };

    if (Array.isArray(miProyecto?.eventos)) {
      miProyecto.eventos.forEach(addEvento);
    }

    [
      miProyecto?.evento,
      miProyecto?.proyecto?.evento,
      miProyecto?.proyectoPrincipal?.evento,
    ].forEach(addEvento);

    proyectosPorEvento.forEach((_, eventoKey) => {
      const evento = eventos.find((item) => normalizeId(item.id) === eventoKey);
      addEvento(evento);
    });

    return Array.from(byId.values());
  }, [eventos, miProyecto, proyectosPorEvento]);

  const eventosActivos = eventosCompetidor.filter(isActiveEvent);
  const proyectoPrincipal = proyectosDashboard[0] || null;
  const rankingEntry = proyectoPrincipal?.votaciones?.find((v) => v.rankingEntry)?.rankingEntry || null;

  const posicion = rankingEntry?.posicion ?? "-";
  const puntuacion = rankingEntry?.puntuacionTotal ?? rankingEntry?.totalVotos ?? "-";
  const totalVotos = proyectosDashboard.reduce((sum, item) => sum + Number(item.totalVotos || 0), 0);
  const vistas = proyectosDashboard.reduce((sum, item) => sum + Number(item.vistas || 0), 0);
  const nombreProyecto = getProyectoFromDashboardItem(proyectoPrincipal)?.nombre ?? null;

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>Bienvenido, {usuario?.nombre || "Competidor"} </h1>
          <p>Panel de competidor - Gestiona tu proyecto y revisa tu progreso</p>
        </div>
      </div>

      <div className="dashboard-stats-grid">
        <div className="dash-stat-card dash-stat-card--hero">
          <Trophy size={32} style={{ opacity: 0.85, marginBottom: 8 }} />
          <p className="dash-stat-label">Tu Posicion</p>
          <strong className="dash-stat-value">
            {loadingProyecto ? "..." : `#${posicion}`}
          </strong>
        </div>
        <StatCard
          label="Puntuacion"
          value={loadingProyecto ? "..." : puntuacion}
          icon={Star}
          colorClass="orange"
        />
        <StatCard
          label="Votos"
          value={loadingProyecto ? "..." : totalVotos}
          icon={Users}
          colorClass="purple"
        />
        <StatCard
          label="Vistas"
          value={loadingProyecto ? "..." : vistas}
          icon={Eye}
          colorClass="blue"
        />
      </div>

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
            eventosActivos.slice(0, 3).map((ev) => {
              const proyectosEvento = proyectosPorEvento.get(normalizeId(ev.id)) || [];
              const nombresProyecto = proyectosEvento
                .map((proyecto) => proyecto?.nombre)
                .filter(Boolean);

              return (
                <Link key={ev.id} to={`/eventos/${ev.id}`} className="dashboard-event-row">
                  <div>
                    <div className="dashboard-event-title">
                      <h3>{ev.nombre}</h3>
                      <span className="pill pill-green">Activo</span>
                    </div>

                    {(nombresProyecto.length > 0 || nombreProyecto) && (
                      <p>
                        Tu proyecto:{" "}
                        <strong>{nombresProyecto.join(", ") || nombreProyecto}</strong>
                      </p>
                    )}

                    <div className="dashboard-event-meta">
                      <span>Inicio: {formatDate(getEventoFechaInicio(ev))}</span>
                      <span>-</span>
                      <span>Fin: {formatDate(getEventoFechaFin(ev))}</span>
                    </div>
                  </div>
                  <ArrowRight size={20} />
                </Link>
              );
            })
          ) : (
            <div className="dashboard-empty">
              No participas en eventos activos todavia.{" "}
              <Link to="/eventos">Explorar eventos</Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default DashboardCompetidor;
