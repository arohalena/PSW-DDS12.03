import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  Fingerprint,
  Lock,
  Shield,
  ShieldCheck,
  User,
} from "lucide-react";

import { getEventos } from "../../services/eventoService";
import { getVotacionesByEvento } from "../../services/votacionService";
import { getIntegridadVotacion, getRegistrosPorEvento } from "../../services/auditoriaService";
import "../../styles/auditoria.css";

function AuditoriaScreen() {
  const [eventos, setEventos] = useState([]);
  const [eventoId, setEventoId] = useState("");
  const [votaciones, setVotaciones] = useState([]);
  const [votacionId, setVotacionId] = useState("");
  const [registros, setRegistros] = useState([]);
  const [integridad, setIntegridad] = useState(null);
  const [filtro, setFiltro] = useState("TODOS");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getEventos();
        setEventos(data);
        if (data.length > 0) setEventoId(data[0].id);
      } catch {
        setError("No se pudieron cargar los eventos");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    if (!eventoId) return;

    const loadVotaciones = async () => {
      try {
        const data = await getVotacionesByEvento(eventoId);
        setVotaciones(data);
        setVotacionId("");
        setIntegridad(null);
      } catch (err) {
        setError(err.message || "No se pudieron cargar las votaciones");
      }
    };

    loadVotaciones();
  }, [eventoId]);

  useEffect(() => {
    if (!eventoId) return;

    const loadRegistros = async () => {
      try {
        setLoading(true);
        setError("");

        const [registrosData, integridadData] = await Promise.all([
          getRegistrosPorEvento(eventoId, votacionId || null),
          votacionId ? getIntegridadVotacion(votacionId) : Promise.resolve(null),
        ]);

        setRegistros(registrosData);
        setIntegridad(integridadData);
      } catch (err) {
        setError(err.message || "No se pudieron cargar los registros");
      } finally {
        setLoading(false);
      }
    };

    loadRegistros();
  }, [eventoId, votacionId]);

  const registrosFiltrados = useMemo(() => {
    if (filtro === "ANONIMOS") return registros.filter((r) => r.anonimo);
    if (filtro === "VERIFICADOS") return registros.filter((r) => !r.anonimo);
    return registros;
  }, [registros, filtro]);

  const stats = useMemo(() => {
    const total = registros.length;
    const anonimos = registros.filter((r) => r.anonimo).length;
    const verificados = total - anonimos;
    const ultimoRegistro = registros[0]?.timestamp ?? null;
    return { total, anonimos, verificados, ultimoRegistro };
  }, [registros]);

  const eventoSeleccionado = useMemo(
    () => eventos.find((evento) => evento.id === eventoId),
    [eventos, eventoId]
  );

  const votacionSeleccionada = useMemo(
    () => votaciones.find((votacion) => votacion.id === votacionId),
    [votaciones, votacionId]
  );

  const formatearFecha = (iso) => {
    if (!iso) return "-";
    const date = new Date(iso);
    const pad = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  };

  const formatearToken = (hash) => {
    if (!hash) return "-";
    const corto = hash.length > 12 ? hash.substring(0, 12).toUpperCase() : hash.toUpperCase();
    return `VT-${corto.match(/.{1,4}/g)?.join("-") ?? corto}`;
  };

  const formatearIdVotante = (registro) => {
    if (registro.anonimo) {
      const sufijo = registro.anonTokenHash?.substring(0, 6) ?? "------";
      return `voter-${sufijo}`;
    }
    return `user-${registro.votanteId?.substring(0, 4) ?? "-"}`;
  };

  const integridadLabel = !votacionId
    ? "Selecciona una votacion"
    : integridad?.integridadOk
      ? "OK"
      : "Revisar";

  return (
    <main className="auditoria-page">
      <header className="auditoria-header">
        <span className="auditoria-kicker">Seguridad electoral</span>
        <h1>Auditoria y trazabilidad</h1>
        <p>Supervisa votos, anonimato e integridad de cada proceso de votacion.</p>
      </header>

      <section className="auditoria-hero">
        <div className="auditoria-hero-main">
          <div className="auditoria-hero-icon">
            <Shield size={24} />
          </div>
          <div>
            <h2>Registro inmutable de votos</h2>
            <p>
              Cada voto genera una evidencia automatica en base de datos. Los registros
              permiten revisar actividad sin exponer datos sensibles.
            </p>
          </div>
        </div>

        <div className="auditoria-hero-status">
          <span>{votacionSeleccionada ? "Votacion seleccionada" : "Evento seleccionado"}</span>
          <strong>{votacionSeleccionada?.nombre || eventoSeleccionado?.nombre || "Sin seleccion"}</strong>
          <small>{stats.ultimoRegistro ? `Ultimo registro: ${formatearFecha(stats.ultimoRegistro)}` : "Sin registros todavia"}</small>
        </div>
      </section>

      <section className="auditoria-panel auditoria-selectors">
        <div className="auditoria-panel-title">
          <Database size={18} />
          <div>
            <strong>Fuente de auditoria</strong>
            <span>Selecciona evento y, si quieres, una votacion concreta.</span>
          </div>
        </div>

        <div className="auditoria-selector-grid">
          <label>
            <span>Evento</span>
            <select value={eventoId} onChange={(e) => setEventoId(e.target.value)}>
              {eventos.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.nombre}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Votacion</span>
            <select value={votacionId} onChange={(e) => setVotacionId(e.target.value)}>
              <option value="">Todas las votaciones del evento</option>
              {votaciones.map((v) => (
                <option key={v.id} value={v.id}>{v.nombre} - {v.tipo}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="auditoria-stats">
        <article className="auditoria-stat-card">
          <header><CheckCircle2 size={16} /> Votos totales</header>
          <strong>{stats.total}</strong>
          <span>Registros encontrados</span>
        </article>
        <article className="auditoria-stat-card">
          <header><Lock size={16} /> Anonimos</header>
          <strong>{stats.anonimos}</strong>
          <span>Votos protegidos</span>
        </article>
        <article className="auditoria-stat-card">
          <header><ShieldCheck size={16} /> Verificados</header>
          <strong>{stats.verificados}</strong>
          <span>Votos con usuario asociado</span>
        </article>
        <article className={`auditoria-stat-card ${integridad?.integridadOk === false ? "danger" : "success"}`}>
          <header>
            {integridad?.integridadOk === false ? <AlertTriangle size={16} /> : <ShieldCheck size={16} />}
            Integridad
          </header>
          <strong>{integridadLabel}</strong>
          <span>
            {integridad
              ? `${integridad.totalVotosTablaVoto}/${integridad.totalRegistrosAuditoria} votos auditados`
              : "Disponible por votacion"}
          </span>
        </article>
      </section>

      <section className="auditoria-panel auditoria-filtros">
        <span>Filtrar:</span>
        <button className={filtro === "TODOS" ? "chip active" : "chip"} onClick={() => setFiltro("TODOS")}>Todos</button>
        <button className={filtro === "ANONIMOS" ? "chip active" : "chip"} onClick={() => setFiltro("ANONIMOS")}>Anonimos</button>
        <button className={filtro === "VERIFICADOS" ? "chip active" : "chip"} onClick={() => setFiltro("VERIFICADOS")}>Verificados</button>
        <small>{registrosFiltrados.length} de {registros.length} registros visibles</small>
      </section>

      {error && <div className="feedback-card error-box">{error}</div>}

      {loading ? (
        <div className="feedback-card">Cargando registros...</div>
      ) : registrosFiltrados.length === 0 ? (
        <div className="feedback-card warning-box">No hay registros para los filtros seleccionados.</div>
      ) : (
        <section className="auditoria-tabla">
          <header className="auditoria-tabla-head">
            <span>Timestamp</span>
            <span>Votante</span>
            <span>Proyecto</span>
            <span>Token de voto</span>
            <span>Estado</span>
          </header>

          {registrosFiltrados.map((registro) => (
            <article key={registro.id} className="auditoria-fila">
              <div className="celda timestamp">
                <Clock size={14} />
                <span>{formatearFecha(registro.timestamp)}</span>
              </div>

              <div className="celda votante">
                {registro.anonimo ? <Lock size={14} /> : <User size={14} />}
                <div>
                  <strong className={registro.anonimo ? "italic" : ""}>
                    {registro.anonimo ? "Anonimo" : registro.votanteNombre}
                  </strong>
                  <span>ID: {formatearIdVotante(registro)}</span>
                </div>
              </div>

              <div className="celda proyecto">
                <strong>{registro.proyectoNombre}</strong>
                <span>ID: {registro.proyectoId?.substring(0, 4)}</span>
              </div>

              <div className="celda token">
                <Fingerprint size={14} />
                <code>{formatearToken(registro.anonTokenHash)}</code>
              </div>

              <div className="celda estado">
                <span className="badge verificado">
                  <CheckCircle2 size={12} /> Verificado
                </span>
              </div>
            </article>
          ))}
        </section>
      )}

      <section className="auditoria-garantia">
        <Shield size={18} />
        <div>
          <strong>Garantia de seguridad</strong>
          <p>
            Los votos son inmutables y los registros de auditoria son append-only.
            El token permite verificar trazabilidad sin comprometer la privacidad del votante.
          </p>
        </div>
      </section>
    </main>
  );
}

export default AuditoriaScreen;
