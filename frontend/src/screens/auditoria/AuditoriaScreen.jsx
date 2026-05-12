import { useEffect, useMemo, useState } from "react";
import { Shield, ShieldCheck, Lock, User, CheckCircle2, Clock } from "lucide-react";
import { getEventos } from "../../services/eventoService";
import { getVotacionesByEvento } from "../../services/votacionService";
import { getRegistrosPorEvento } from "../../services/auditoriaService";
import "../../styles/auditoria.css";

function AuditoriaScreen() {
  const [eventos, setEventos] = useState([]);
  const [eventoId, setEventoId] = useState("");
  const [votaciones, setVotaciones] = useState([]);
  const [votacionId, setVotacionId] = useState("");
  const [registros, setRegistros] = useState([]);
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
        const data = await getRegistrosPorEvento(eventoId, votacionId || null);
        setRegistros(data);
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
    return { total, anonimos, verificados: total };
  }, [registros]);

  const formatearFecha = (iso) => {
    if (!iso) return "—";
    const date = new Date(iso);
    const pad = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  };

  const formatearToken = (hash) => {
    if (!hash) return "—";
    const corto = hash.length > 12 ? hash.substring(0, 12).toUpperCase() : hash.toUpperCase();
    return `VT-${corto.match(/.{1,4}/g)?.join("-") ?? corto}`;
  };

  const formatearIdVotante = (registro) => {
    if (registro.anonimo) {
      const sufijo = registro.anonTokenHash?.substring(0, 6) ?? "------";
      return `voter-${sufijo}`;
    }
    return `user-${registro.votanteId?.substring(0, 4) ?? "—"}`;
  };

  return (
    <main className="auditoria-page">
      <header className="auditoria-header">
        <h1>Auditoría y Trazabilidad</h1>
        <p>Monitoreo completo de votaciones con registro inmutable y seguro</p>
      </header>

      <section className="auditoria-hero">
        <div className="auditoria-hero-icon">
          <Shield size={22} />
        </div>
        <div>
          <h2>Auditoría y Trazabilidad</h2>
          <p>Registro completo de votaciones para garantizar transparencia</p>
        </div>
      </section>

      <section className="auditoria-selectors">
        <label>
          <span>Evento</span>
          <select value={eventoId} onChange={(e) => setEventoId(e.target.value)}>
            {eventos.map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.nombre}</option>
            ))}
          </select>
        </label>

        <label>
          <span>Votación</span>
          <select value={votacionId} onChange={(e) => setVotacionId(e.target.value)}>
            <option value="">Todas las votaciones del evento</option>
            {votaciones.map((v) => (
              <option key={v.id} value={v.id}>{v.nombre} — {v.tipo}</option>
            ))}
          </select>
        </label>
      </section>

      <section className="auditoria-stats">
        <article className="auditoria-stat-card">
          <header><CheckCircle2 size={16} /> Votos Totales</header>
          <strong>{stats.total}</strong>
        </article>
        <article className="auditoria-stat-card">
          <header><Lock size={16} /> Anónimos</header>
          <strong>{stats.anonimos}</strong>
        </article>
        <article className="auditoria-stat-card">
          <header><ShieldCheck size={16} /> Verificados</header>
          <strong>{stats.verificados}</strong>
        </article>
      </section>

      <section className="auditoria-filtros">
        <span>Filtrar:</span>
        <button className={filtro === "TODOS" ? "chip active" : "chip"} onClick={() => setFiltro("TODOS")}>Todos</button>
        <button className={filtro === "ANONIMOS" ? "chip active" : "chip"} onClick={() => setFiltro("ANONIMOS")}>Anónimos</button>
        <button className={filtro === "VERIFICADOS" ? "chip active" : "chip"} onClick={() => setFiltro("VERIFICADOS")}>Verificados</button>
      </section>

      {error && <div className="feedback-card error-box">{error}</div>}

      {loading ? (
        <div className="feedback-card">Cargando registros…</div>
      ) : registrosFiltrados.length === 0 ? (
        <div className="feedback-card warning-box">No hay registros para los filtros seleccionados.</div>
      ) : (
        <section className="auditoria-tabla">
          <header className="auditoria-tabla-head">
            <span>TIMESTAMP</span>
            <span>VOTANTE</span>
            <span>PROYECTO</span>
            <span>TOKEN DE VOTO</span>
            <span>ESTADO</span>
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
                    {registro.anonimo ? "Anónimo" : registro.votanteNombre}
                  </strong>
                  <span>ID: {formatearIdVotante(registro)}</span>
                </div>
              </div>

              <div className="celda proyecto">
                <strong>{registro.proyectoNombre}</strong>
                <span>ID: {registro.proyectoId?.substring(0, 4)}</span>
              </div>

              <div className="celda token">
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
          <strong>🔒 Garantía de Seguridad</strong>
          <p>
            Todos los votos están encriptados y son inmutables. Los votos anónimos
            protegen la identidad del votante incluso ante los organizadores. Cada voto
            tiene un token único para verificación sin comprometer la privacidad.
          </p>
        </div>
      </section>
    </main>
  );
}

export default AuditoriaScreen;