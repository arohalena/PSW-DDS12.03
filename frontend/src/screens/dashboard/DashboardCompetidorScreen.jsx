import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Calendar, FolderKanban } from "lucide-react";

import { QuickCard } from "../../components/QuickCard";
import { isActiveEvent, formatDate, getEventoFechaInicio, getEventoFechaFin } from "../../components/dashboardUtils";
import { getMiProyectoDashboard } from "../../services/proyectoService";

const COMPETITOR_DASHBOARD_CACHE_PREFIX = "votify:dashboard-competidor:v3:";

function normalizeId(value) {
  return value === undefined || value === null ? "" : String(value);
}

function getProyectoFromDashboardItem(item) {
  return item?.proyecto || item;
}

function normalizeDashboardItem(item) {
  const proyecto = getProyectoFromDashboardItem(item);

  return {
    ...item,
    proyecto,
    evento: item?.evento || proyecto?.evento || null,
  };
}

function getEventRefsFromProjectItem(item) {
  const proyecto = getProyectoFromDashboardItem(item);
  const refs = [
    item?.evento,
    proyecto?.evento,
    item?.eventoId,
    proyecto?.eventoId,
    item?.votacion?.evento,
    item?.votacion?.eventoId,
  ];

  (item?.votaciones || []).forEach((votacionItem) => {
    refs.push(
      votacionItem?.evento,
      votacionItem?.eventoId,
      votacionItem?.votacion?.evento,
      votacionItem?.votacion?.eventoId
    );
  });

  return refs.filter(Boolean);
}

function getEventIdFromRef(ref) {
  return normalizeId(typeof ref === "object" ? ref.id : ref);
}

function DashboardCompetidor({ usuario, eventos }) {
  const cacheKey = usuario?.id ? `${COMPETITOR_DASHBOARD_CACHE_PREFIX}${usuario.id}` : "";
  const [miProyecto, setMiProyecto] = useState(() => {
    if (!cacheKey) return null;

    try {
      const cached = sessionStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : null;
    } catch {
      sessionStorage.removeItem(cacheKey);
      return null;
    }
  });
  const [loadingProyecto, setLoadingProyecto] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!usuario?.id) {
      setLoadingProyecto(false);
      return;
    }

    let cancelled = false;
    const hasCachedData = Boolean(miProyecto);

    setLoadingProyecto(!hasCachedData);
    setRefreshing(hasCachedData);

    getMiProyectoDashboard(usuario.id)
      .then((data) => {
        if (cancelled) return;
        setMiProyecto(data);
        if (cacheKey) sessionStorage.setItem(cacheKey, JSON.stringify(data));
      })
      .catch(() => {
        if (!cancelled && !hasCachedData) setMiProyecto(null);
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingProyecto(false);
          setRefreshing(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [cacheKey, usuario?.id]);

  const proyectosDashboard = useMemo(() => {
    if (Array.isArray(miProyecto?.proyectosDashboard) && miProyecto.proyectosDashboard.length > 0) {
      return miProyecto.proyectosDashboard.map(normalizeDashboardItem);
    }

    return miProyecto?.proyecto ? [normalizeDashboardItem(miProyecto.proyecto)] : [];
  }, [miProyecto]);

  const proyectosPorEvento = useMemo(() => {
    const map = new Map();

    proyectosDashboard.forEach((item) => {
      const proyecto = getProyectoFromDashboardItem(item);
      const eventIds = Array.from(
        new Set(getEventRefsFromProjectItem(item).map(getEventIdFromRef).filter(Boolean))
      );

      eventIds.forEach((key) => {
        const proyectosEvento = map.get(key) || [];

        if (!proyectosEvento.some((current) => normalizeId(current?.id) === normalizeId(proyecto?.id))) {
          proyectosEvento.push(proyecto);
        }

        map.set(key, proyectosEvento);
      });
    });

    return map;
  }, [proyectosDashboard]);

  const eventosCompetidor = useMemo(() => {
    const byId = new Map();
    const addEvento = (evento) => {
      if (evento?.id) byId.set(normalizeId(evento.id), evento);
    };

    proyectosPorEvento.forEach((_, eventoKey) => {
      const matchingProjectItem = proyectosDashboard.find((item) =>
        getEventRefsFromProjectItem(item).some((ref) => getEventIdFromRef(ref) === eventoKey)
      );

      const eventRefFromProject = getEventRefsFromProjectItem(matchingProjectItem).find(
        (ref) => getEventIdFromRef(ref) === eventoKey && typeof ref === "object"
      );

      addEvento(
        eventRefFromProject ||
          eventos.find((item) => normalizeId(item.id) === eventoKey)
      );
    });

    return Array.from(byId.values());
  }, [eventos, proyectosDashboard, proyectosPorEvento]);

  const eventosOrdenados = useMemo(
    () =>
      [...eventosCompetidor].sort((a, b) =>
        String(getEventoFechaInicio(a) || "").localeCompare(String(getEventoFechaInicio(b) || ""))
      ),
    [eventosCompetidor]
  );

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>Bienvenido, {usuario?.nombre || "Competidor"} </h1>
          <p>Panel de competidor - Gestiona tus proyectos y entra a tus eventos.</p>
        </div>
        {refreshing ? <span className="dashboard-refresh-pill">Actualizando...</span> : null}
      </div>

      <div className="dashboard-quick-grid">
        <QuickCard
          to="/configuracion"
          iconColor="purple"
          Icon={FolderKanban}
          title="Mis Proyectos"
          description="Gestiona tus proyectos, material y feedback."
        />
        <QuickCard
          to="/eventos"
          iconColor="blue"
          Icon={Calendar}
          title="Eventos"
          description="Revisa los eventos donde participa alguno de tus proyectos."
        />
      </div>

      <section className="dashboard-card">
        <div className="dashboard-card-header">
          <div>
            <h2>Mis Eventos</h2>
            <p>Solo aparecen eventos donde tienes un proyecto participando.</p>
          </div>
          <Link className="dashboard-link" to="/eventos">Ver todos</Link>
        </div>
        <div className="dashboard-events-list">
          {loadingProyecto && proyectosDashboard.length === 0 ? (
            <div className="dashboard-empty">Cargando tus eventos...</div>
          ) : eventosOrdenados.length > 0 ? (
            eventosOrdenados.map((ev) => {
              const proyectosEvento = proyectosPorEvento.get(normalizeId(ev.id)) || [];
              const nombresProyecto = proyectosEvento
                .map((proyecto) => proyecto?.nombre)
                .filter(Boolean);

              return (
                <Link key={ev.id} to={`/eventos/${ev.id}`} className="dashboard-event-row">
                  <div>
                    <div className="dashboard-event-title">
                      <h3>{ev.nombre}</h3>
                      <span className={`pill ${isActiveEvent(ev) ? "pill-green" : "pill-gray"}`}>
                        {isActiveEvent(ev) ? "Activo" : "No activo"}
                      </span>
                    </div>

                    {nombresProyecto.length > 0 && (
                      <p>
                        {nombresProyecto.length === 1 ? "Proyecto" : "Proyectos"}:{" "}
                        <strong>{nombresProyecto.join(", ")}</strong>
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
              No participas en eventos con proyectos todavia.{" "}
              <Link to="/eventos">Explorar eventos</Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default DashboardCompetidor;
