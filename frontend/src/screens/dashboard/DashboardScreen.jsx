import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Calendar,
  Clock,
  FolderKanban,
  Play,
  Plus,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import { getEventos } from "../../services/eventoService";
import { getProyectos } from "../../services/proyectoService";
import { getUsuarios, usuarioHasProject } from "../../services/usuarioService";
import { getVotingToken, getUsuarioLogueado } from "../../services/sessionService";


function formatDate(value) {
  if (!value) return "Sin fecha";
  return new Date(value).toLocaleDateString("es-ES");
}

function isActiveEvent(evento) {
  const fin = evento.fecha_fin || evento.fechaFin || evento.fin;
  if (!fin) return true;
  return new Date(fin) >= new Date();
}

function getEventoFechaInicio(evento) {
  return evento.fecha_inicio || evento.fechaInicio || evento.inicio;
}

function getEventoFechaFin(evento) {
  return evento.fecha_fin || evento.fechaFin || evento.fin;
}

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="dashboard-stat-card">
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
      <div className={`dashboard-stat-icon ${color}`}>
        <Icon size={24} />
      </div>
    </div>
  );
}

function AlertBanner({ type, title, message }) {
  return (
    <div className={`dashboard-alert ${type}`}>
      <div>
        <strong>{title}</strong>
        <p>{message}</p>
      </div>
    </div>
  );
}

function EventRow({ evento }) {
  return (
    <Link to={`/eventos/${evento.id}`} className="dashboard-event-row">
      <div>
        <div className="dashboard-event-title">
          <h3>{evento.nombre}</h3>
          <span className={isActiveEvent(evento) ? "pill pill-green" : "pill pill-gray"}>
            {isActiveEvent(evento) ? "Activo" : "Finalizado"}
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

function DashboardScreen() {
  const [eventos, setEventos] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userHasProject, setUserHasProject] = useState(false);


  const votingToken = useMemo(() => getVotingToken(), []);
  const usuario = useMemo(() => getUsuarioLogueado(), []);

  useEffect(() => {

    async function verifyProject() {
      const result = await usuarioHasProject(usuario.id);

      console.log("USUARIO" + usuario.id + " HAS PROJECT" + result)

      setUserHasProject(result);
    }

    verifyProject();
  }, [usuario]);

  useEffect(() => {
    async function loadData() {
      try {
        const [eventosData, proyectosData, usuariosData] = await Promise.all([
          getEventos().catch(() => []),
          getProyectos().catch(() => []),
          getUsuarios().catch(() => []),
        ]);

        setEventos(eventosData);
        setProyectos(proyectosData);
        setUsuarios(usuariosData);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const eventosActivos = eventos.filter(isActiveEvent);
  const eventosRecientes = eventos.slice(0, 4);
  const votantes = usuarios.filter((u) =>
    ["PUBLICO", "ESPECTADOR", "COMPETIDOR", "JURADO"].includes(u.rol)
  );

  if (loading) {
    return <div className="dashboard-loading">Cargando dashboard...</div>;
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>Bienvenido</h1>
          <p>Aquí está todo lo que necesitas saber</p>
        </div>

      </div>

      <div className="dashboard-quick-grid">
        <Link to="/eventos" className="dashboard-quick-card">
          <div className="dashboard-quick-icon blue">
            <Calendar size={28} />
          </div>
          <div>
            <h3>Ver Eventos</h3>
            <p>Explora todos los eventos públicos y privados.</p>
          </div>
          <ArrowRight size={22} />
        </Link>

        {userHasProject ? (
        <Link to="/configuracion" className="dashboard-quick-card">
          <div className="dashboard-quick-icon purple">
            <Trophy size={28} />
          </div>
          <div>
            <h3>Mi Proyecto</h3>
            <p>Consulta estadísticas, ranking y feedback recibido.</p>
          </div>
          <ArrowRight size={22} />
        </Link>
          ) : null}
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
              <p>Busca un evento, introduce código privado si hace falta y accede.</p>
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
        </div>
      </section>

      <div className="dashboard-stats-grid">
        <StatCard label="Eventos Activos" value={eventosActivos.length} icon={Calendar} color="blue" />
        <StatCard label="Proyectos Totales" value={proyectos.length} icon={FolderKanban} color="purple" />
        <StatCard label="Votantes" value={votantes.length} icon={Users} color="green" />
        <StatCard label="Métricas" value={eventos.length + proyectos.length} icon={TrendingUp} color="orange" />
      </div>

      <section className="dashboard-card">
        <div className="dashboard-card-header">
          <div>
            <h2>Eventos activos</h2>
            <p>Click en un evento para ir a /eventos/&#123;id&#125;.</p>
          </div>

          <Link className="dashboard-link" to="/eventos">
            Ver todos
          </Link>
        </div>

        <div className="dashboard-events-list">
          {eventosRecientes.length > 0 ? (
            eventosRecientes.map((evento) => <EventRow key={evento.id} evento={evento} />)
          ) : (
            <div className="dashboard-empty">
              No hay eventos todavía.
            </div>
          )}
        </div>
      </section>

      <section className="dashboard-card">
        <div className="dashboard-card-header">
          <div>
            <h2>Actividad reciente</h2>
            <p>Resumen visual de actividad del sistema.</p>
          </div>
          <Clock size={20} />
        </div>
      </section>
    </div>
  );
}

export default DashboardScreen;