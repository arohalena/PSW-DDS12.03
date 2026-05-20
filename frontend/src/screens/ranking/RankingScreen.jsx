import { useEffect, useState, useMemo } from "react";
import { Trophy, Medal, Award, Download, ArrowUp, ArrowDown, Save, FileText, Star, CheckCircle } from "lucide-react";
import { getEventos } from "../../services/eventoService";
import { getVotacionesByEvento, publicarResultadosVotacion } from "../../services/votacionService";
import {
  getRanking,
  getCriteriosByEvento,
  cambiarModoRanking,
  guardarOrdenRanking,
} from "../../services/criterioService";
import { getUsuarioLogueado } from "../../services/sessionService";
import "../../styles/ranking.css";

const MODALIDADES_MULTICRITERIO = ["MULTICRITERIO", "MULTICRITERIO_PONDERADA"];

function RankingScreen() {
  const [eventos, setEventos] = useState([]);
  const [eventoId, setEventoId] = useState("");
  const [votaciones, setVotaciones] = useState([]);
  const [votacionId, setVotacionId] = useState("");
  const [ranking, setRanking] = useState([]);
  const [criterios, setCriterios] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modo, setModo] = useState("AUTOMATICO");
  const [ordenSucio, setOrdenSucio] = useState(false);
  const [guardandoOrden, setGuardandoOrden] = useState(false);
  const [publicandoResultados, setPublicandoResultados] = useState(false);
  const [aviso, setAviso] = useState("");

  const usuario = useMemo(() => getUsuarioLogueado(), []);
  const votacionSeleccionada = useMemo(
    () => votaciones.find((v) => v.id === votacionId) || null,
    [votaciones, votacionId]
  );

  const puedeEditar = useMemo(() => {
    if (!usuario || !votacionSeleccionada) return false;
    if (usuario.rol === "ORGANIZADOR") return true;
    if (usuario.rol === "JURADO" && (votacionSeleccionada.tipo === "JURADO" || votacionSeleccionada.tipo === "MIXTA")) return true;
    return false;
  }, [usuario, votacionSeleccionada]);

  useEffect(() => {
    const loadEventos = async () => {
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

    loadEventos();
  }, []);

  useEffect(() => {
    if (!eventoId) return;

    const loadVotacionesYCriterios = async () => {
      try {
        setLoading(true);
        setError("");

        const [votacionesData, criteriosData] = await Promise.all([
          getVotacionesByEvento(eventoId),
          getCriteriosByEvento(eventoId),
        ]);

        setCriterios(criteriosData);
        setVotaciones(votacionesData);

        if (votacionesData.length > 0) {
          setVotacionId(votacionesData[0].id);
        } else {
          setVotacionId("");
          setRanking([]);
          setSelectedProjectId(null);
        }
      } catch (err) {
        setError(err.message || "No se pudieron cargar las votaciones");
      } finally {
        setLoading(false);
      }
    };

    loadVotacionesYCriterios();
  }, [eventoId]);

  useEffect(() => {
    if (!eventoId || !votacionId) {
      setRanking([]);
      setSelectedProjectId(null);
      return;
    }

    const loadRanking = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getRanking(eventoId, votacionId);
        setRanking(data);
        setOrdenSucio(false);

        if (data.length > 0) {
          setSelectedProjectId(data[0].proyectoId);
          setModo(data[0].modoRanking || "AUTOMATICO");
        } else {
          setSelectedProjectId(null);
          setModo("AUTOMATICO");
        }
      } catch (err) {
        setError(err.message || "No se pudo cargar el ranking");
      } finally {
        setLoading(false);
      }
    };

    loadRanking();
  }, [eventoId, votacionId]);

  const modalidad = votacionSeleccionada?.modalidad ?? null;
  const esMulticriterio = MODALIDADES_MULTICRITERIO.includes(modalidad);
  const esSimple = modalidad === "SIMPLE";
  const esPuntos = modalidad === "PUNTOS";
  const esMixta  = votacionSeleccionada?.tipo === "MIXTA";
  const votacionCerrada = votacionSeleccionada?.estadoActual === "CERRADA" || votacionSeleccionada?.estado === "CERRADA" || ranking[0]?.votacionCerrada;
  const resultadosPublicados = Boolean(votacionSeleccionada?.resultadosPublicados || ranking[0]?.resultadosPublicados);
  const resultadoFinal = Boolean(votacionCerrada && resultadosPublicados);
  const ganadores = useMemo(
    () => ranking.filter((entry) => entry.ganador || entry.posicion <= 3).slice(0, 3),
    [ranking]
  );

  const selectedProject = useMemo(() => {
    return ranking.find((entry) => entry.proyectoId === selectedProjectId) || ranking[0] || null;
  }, [ranking, selectedProjectId]);

  const totalVotosEvento = useMemo(() => {
    return ranking.reduce((sum, entry) => sum + Number(entry.totalVotos || 0), 0);
  }, [ranking]);

  const proyectosEvaluados = ranking.length;

  const votantesActivos = useMemo(() => {
    const values = ranking
      .map((entry) => entry.votantesActivos)
      .filter((value) => value !== undefined && value !== null);

    if (values.length === 0) return "—";
    return Math.max(...values);
  }, [ranking]);

  const participacion = useMemo(() => {
    const values = ranking
      .map((entry) => entry.participacion)
      .filter((value) => value !== undefined && value !== null);

    if (values.length === 0) return "—";
    return `${values[0]}%`;
  }, [ranking]);

  const handleCambiarModo = async (nuevoModo) => {
    if (!puedeEditar || nuevoModo === modo) return;

    try {
      setError("");
      setAviso("");
      await cambiarModoRanking(eventoId, votacionId, usuario.id, nuevoModo);
      setModo(nuevoModo);
      const data = await getRanking(eventoId, votacionId);
      setRanking(data);
      setOrdenSucio(false);
      setAviso(
        nuevoModo === "MANUAL"
          ? "Modo manual activado. Reordena con las flechas y pulsa Guardar."
          : "Modo automático activado. El ranking se ordena por puntuación."
      );
    } catch (err) {
      setError(err.message || "No se pudo cambiar el modo");
    }
  };

  const moverPosicion = (index, delta) => {
    const nuevoIndex = index + delta;
    if (nuevoIndex < 0 || nuevoIndex >= ranking.length) return;

    const copia = [...ranking];
    const [item] = copia.splice(index, 1);
    copia.splice(nuevoIndex, 0, item);
    copia.forEach((entry, i) => {
      entry.posicion = i + 1;
    });
    setRanking(copia);
    setOrdenSucio(true);
  };

  const handleGuardarOrden = async () => {
    if (!puedeEditar) return;

    try {
      setGuardandoOrden(true);
      setError("");
      setAviso("");

      const posiciones = ranking.map((entry, i) => ({
        votacionProyectoId: entry.votacionProyectoId,
        posicion: i + 1,
      }));

      await guardarOrdenRanking(eventoId, votacionId, usuario.id, posiciones);
      setOrdenSucio(false);
      setAviso("Orden manual guardado correctamente.");
      setModo("MANUAL");
    } catch (err) {
      setError(err.message || "No se pudo guardar el orden");
    } finally {
      setGuardandoOrden(false);
    }
  };

  const handlePublicarResultados = async () => {
    if (!puedeEditar || !votacionId || !votacionCerrada) return;

    try {
      setPublicandoResultados(true);
      setError("");
      setAviso("");

      const votacionActualizada = await publicarResultadosVotacion(votacionId);
      setVotaciones((prev) =>
        prev.map((v) => (v.id === votacionId ? { ...v, ...votacionActualizada } : v))
      );

      const data = await getRanking(eventoId, votacionId);
      setRanking(data);
      setAviso("Resultados finales publicados. Ya puedes generar certificados para los ganadores.");
    } catch (err) {
      setError(err.message || "No se pudieron publicar los resultados");
    } finally {
      setPublicandoResultados(false);
    }
  };

  const generarCertificado = (entry) => {
    const fecha = new Date().toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const premio = entry.tipoPremio || (entry.posicion === 1 ? "ORO" : entry.posicion === 2 ? "PLATA" : "BRONCE");
    const puntuacion = formatearNumero(entry.puntuacionTotal ?? entry.totalVotos ?? 0);
    const ventana = window.open("", "_blank", "width=1000,height=720");

    if (!ventana) {
      setError("No se pudo abrir la vista del certificado. Revisa si el navegador bloqueÃ³ la ventana emergente.");
      return;
    }

    ventana.document.write(`
      <!doctype html>
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <title>Certificado ${entry.proyectoNombre}</title>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; font-family: Georgia, "Times New Roman", serif; background: #f3f4f6; color: #111827; }
            .page { min-height: 100vh; display: grid; place-items: center; padding: 32px; }
            .certificate { width: min(980px, 100%); aspect-ratio: 1.414 / 1; background: linear-gradient(135deg, #f8fafc, #eef2ff); border: 10px double #4f46e5; padding: 56px; text-align: center; box-shadow: 0 24px 80px rgba(15, 23, 42, 0.18); }
            .seal { width: 92px; height: 92px; border-radius: 999px; margin: 0 auto 22px; display: grid; place-items: center; background: #facc15; color: #713f12; font-size: 42px; font-family: Arial, sans-serif; font-weight: 800; }
            h1 { margin: 0; font-size: 42px; color: #312e81; }
            .line { width: 140px; height: 4px; background: #4f46e5; margin: 18px auto 30px; border-radius: 999px; }
            .muted { color: #4b5563; font-size: 19px; margin: 0 0 14px; }
            .project { margin: 18px auto; padding: 22px; background: white; border: 1px solid #c7d2fe; border-radius: 14px; max-width: 680px; }
            .project strong { display: block; color: #4338ca; font-size: 34px; margin-bottom: 8px; }
            .project span { font-family: Arial, sans-serif; font-size: 18px; color: #374151; }
            .position { font-size: 30px; font-weight: 800; color: #111827; margin: 14px 0 8px; font-family: Arial, sans-serif; }
            .meta { margin-top: 32px; font-family: Arial, sans-serif; color: #374151; font-size: 15px; }
            .actions { margin-top: 20px; text-align: center; }
            button { border: 0; border-radius: 10px; padding: 12px 18px; background: #4f46e5; color: white; font: 600 14px Arial, sans-serif; cursor: pointer; }
            @media print {
              body { background: white; }
              .page { padding: 0; }
              .certificate { width: 100vw; height: 70.7vw; box-shadow: none; border-width: 8px; }
              .actions { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="page">
            <main>
              <section class="certificate">
                <div class="seal">${entry.posicion}</div>
                <h1>Certificado de Reconocimiento</h1>
                <div class="line"></div>
                <p class="muted">Se otorga a</p>
                <div class="project">
                  <strong>${entry.proyectoNombre}</strong>
                  <span>${entry.equipoNombre || "Equipo no disponible"}</span>
                </div>
                <p class="muted">por alcanzar el</p>
                <div class="position">${entry.posicion}.Âº lugar - Premio ${premio}</div>
                <p class="muted">${votacionSeleccionada?.nombre || "VotaciÃ³n"} · ${eventos.find((ev) => ev.id === eventoId)?.nombre || "Votify"}</p>
                <div class="meta">
                  PuntuaciÃ³n final: ${puntuacion} · Emitido el ${fecha}
                </div>
              </section>
              <div class="actions">
                <button onclick="window.print()">Descargar / imprimir PDF</button>
              </div>
            </main>
          </div>
        </body>
      </html>
    `);
    ventana.document.close();
  };
  
  const getPositionBadge = (posicion) => {
    if (posicion === 1) {
      return (
        <div className="ranking-position-badge gold">
          <Trophy size={18} />
        </div>
      );
    }

    if (posicion === 2) {
      return (
        <div className="ranking-position-badge silver">
          <Medal size={18} />
        </div>
      );
    }

    if (posicion === 3) {
      return (
        <div className="ranking-position-badge bronze">
          <Award size={18} />
        </div>
      );
    }

    return <div className="ranking-position-badge number">{posicion}</div>;
  };

  const normalizarSobreCinco = (valor) => {
    const num = Number(valor || 0);
    return Math.min(Math.max(num, 0), 5);
  };

  const progresoSobreCinco = (valor) => {
    return `${(normalizarSobreCinco(valor) / 5) * 100}%`;
  };

  const formatearNota = (valor) => {
    return normalizarSobreCinco(valor).toFixed(1);
  };

  const formatearNumero = (valor) => {
    const num = Number(valor || 0);
    return Number.isInteger(num) ? String(num) : num.toFixed(2);
  };

  const renderPuntuacionPrincipal = (entry) => {
    if (esSimple) {
      return <strong>{entry.totalVotos ?? 0}</strong>;
    }
    if (esPuntos) {
      return <strong>{formatearNumero(entry.sumaPuntos ?? entry.puntuacionTotal)}</strong>;
    }
    if (esMixta) {
      return <strong>{formatearNumero(entry.puntuacionTotal)}</strong>;
    }
    return <strong>{formatearNota(entry.puntuacionTotal)}</strong>;
  };

  const etiquetaPuntuacion = () => {
    if (esSimple) return "votos";
    if (esPuntos) return "pts";
    if (esMixta) return "pts";
    return "/5";
  };

  const etiquetaModalidad = (mod) => {
    switch (mod) {
      case "SIMPLE":
        return "Simple";
      case "PUNTOS":
        return "Puntos";
      case "MULTICRITERIO":
        return "Multicriterio";
      case "MULTICRITERIO_PONDERADA":
        return "Multicriterio ponderada";
      default:
        return mod || "";
    }
  };

  const exportarResultados = () => {
    if (ranking.length === 0) return;

    let headers;
    let rows;

    if (esSimple) {
      headers = ["Posicion", "Proyecto", "Equipo", "Total votos"];
      rows = ranking.map((entry) => [
        entry.posicion,
        entry.proyectoNombre,
        entry.equipoNombre ?? "",
        entry.totalVotos ?? 0,
      ]);
    } else if (esPuntos) {
      headers = ["Posicion", "Proyecto", "Equipo", "Suma puntos", "Media puntos", "Total votos"];
      rows = ranking.map((entry) => [
        entry.posicion,
        entry.proyectoNombre,
        entry.equipoNombre ?? "",
        entry.sumaPuntos ?? entry.puntuacionTotal ?? 0,
        entry.mediaPuntos ?? "",
        entry.totalVotos ?? 0,
      ]);
    } else {
      headers = [
        "Posicion",
        "Proyecto",
        ...criterios.map((c) =>
          modalidad === "MULTICRITERIO_PONDERADA" ? `${c.nombre} (${c.peso}%)` : c.nombre
        ),
        "Puntuacion total sobre 5",
        "Total votos",
      ];
      rows = ranking.map((entry) => [
        entry.posicion,
        entry.proyectoNombre,
        ...criterios.map((criterio) => {
          const valor = entry.criterios?.find((c) => c.criterioId === criterio.id);
          return valor?.promedio ?? "";
        }),
        entry.puntuacionTotal,
        entry.totalVotos ?? "",
      ]);
    }

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ranking-resultados.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading && eventos.length === 0) {
    return (
      <main className="ranking-page">
        <div className="feedback-card">Cargando...</div>
      </main>
    );
  }

  const enModoManual = modo === "MANUAL";

  return (
    <main className="ranking-page">
      <header className="ranking-header">
        <div>
          <h1>Ranking y Resultados</h1>
          <p>Visualiza los resultados de la votación en tiempo real</p>
        </div>

        <div className="ranking-header-actions">
          {puedeEditar && votacionCerrada && !resultadosPublicados && (
            <button
              type="button"
              className="primary-btn ranking-action-btn"
              onClick={handlePublicarResultados}
              disabled={publicandoResultados || ranking.length === 0}
            >
              <CheckCircle size={16} />
              {publicandoResultados ? "Publicando..." : "Publicar resultados finales"}
            </button>
          )}

          <button
            type="button"
            className="primary-btn ranking-action-btn"
            onClick={exportarResultados}
            disabled={ranking.length === 0}
          >
            <Download size={16} />
            Exportar Resultados
          </button>
        </div>
      </header>

      <section className="ranking-event-selector">
        <label className="ranking-selector-field">
          <span>Evento</span>
          <select value={eventoId} onChange={(e) => setEventoId(e.target.value)}>
            {eventos.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.nombre}
              </option>
            ))}
          </select>
        </label>

        <label className="ranking-selector-field">
          <span>Votación</span>
          <select
            value={votacionId}
            onChange={(e) => setVotacionId(e.target.value)}
            disabled={votaciones.length === 0}
          >
            {votaciones.length === 0 && <option value="">Sin votaciones</option>}
            {votaciones.map((v) => (
              <option key={v.id} value={v.id}>
                {v.nombre} — {v.tipo === "MIXTA"
                  ? `Mixta (Pop.${v.pesoPorcentajePopular ?? "?"}% / Jur.${v.pesoPorcentajeJurado ?? "?"}%)`
                  : v.tipo
                } · {etiquetaModalidad(v.modalidad)}
              </option>
            ))}
          </select>
        </label>
      </section>

      {puedeEditar && ranking.length > 0 && (
        <section className="ranking-mode-bar" style={{
          display: "flex",
          gap: "12px",
          alignItems: "center",
          padding: "12px 16px",
          background: "#f5f5f7",
          borderRadius: "8px",
          marginBottom: "12px",
          flexWrap: "wrap",
        }}>
          <span style={{ fontWeight: 600 }}>Modo de ranking:</span>

          <button
            type="button"
            className={`primary-btn ${modo === "AUTOMATICO" ? "" : "ranking-action-btn"}`}
            onClick={() => handleCambiarModo("AUTOMATICO")}
            disabled={modo === "AUTOMATICO"}
          >
            Automático
          </button>

          <button
            type="button"
            className={`primary-btn ${modo === "MANUAL" ? "" : "ranking-action-btn"}`}
            onClick={() => handleCambiarModo("MANUAL")}
            disabled={modo === "MANUAL"}
          >
            Manual
          </button>

          {enModoManual && (
            <button
              type="button"
              className="primary-btn ranking-action-btn"
              onClick={handleGuardarOrden}
              disabled={!ordenSucio || guardandoOrden}
              style={{ marginLeft: "auto" }}
            >
              <Save size={16} />
              {guardandoOrden ? "Guardando..." : "Guardar orden"}
            </button>
          )}

          <span style={{ flexBasis: "100%", fontSize: "0.85rem", color: "#666" }}>
            {enModoManual
              ? "En modo manual el orden lo deciden el jurado/organizador. Las puntuaciones siguen mostrándose pero no determinan la posición."
              : "En modo automático el orden se calcula a partir de las puntuaciones de los votos."}
          </span>
        </section>
      )}

      {aviso && <div className="feedback-card">{aviso}</div>}
      {error && <div className="feedback-card error-box">{error}</div>}

      {ranking.length > 0 && votacionCerrada && (
        <section className={`ranking-final-status ${resultadoFinal ? "published" : "pending"}`}>
          <div>
            <strong>{resultadoFinal ? "Resultados finales publicados" : "VotaciÃ³n cerrada pendiente de publicaciÃ³n"}</strong>
            <p>
              {resultadoFinal
                ? "El ranking ya es definitivo y los certificados estÃ¡n disponibles para los ganadores."
                : "Revisa el ranking, ajusta el orden si hace falta y publica los resultados finales para activar certificados."}
            </p>
          </div>
          {resultadoFinal && <CheckCircle size={24} />}
        </section>
      )}

      {!loading && votaciones.length === 0 && (
        <div className="feedback-card warning-box">
          Este evento todavía no tiene votaciones configuradas.
        </div>
      )}

      {!loading && esMulticriterio && criterios.length === 0 && (
        <div className="feedback-card warning-box">
          No hay criterios de evaluación configurados para este evento. Ve a “Criterios” para configurarlos.
        </div>
      )}

      {!loading && votacionId && ranking.length === 0 && (
        <div className="feedback-card warning-box">
          Aún no hay puntuaciones registradas para esta votación.
        </div>
      )}

      {ranking.length > 0 && (
        <>
          <section className="ranking-stats-grid">
            <article className="ranking-stat-card">
              <span>Total de Votos</span>
              <strong>{totalVotosEvento}</strong>
            </article>

            <article className="ranking-stat-card">
              <span>Proyectos Evaluados</span>
              <strong>{proyectosEvaluados}</strong>
            </article>

            <article className="ranking-stat-card">
              <span>Votantes Activos</span>
              <strong>{votantesActivos}</strong>
            </article>

            <article className="ranking-stat-card">
              <span>Participación</span>
              <strong>{participacion}</strong>
            </article>
          </section>

          <section className="ranking-main-grid">
            <div className="ranking-list-card">
              <div className="ranking-card-header">
                <h2>Ranking General {enModoManual && <small style={{ fontWeight: 400, color: "#888" }}>(orden manual)</small>}</h2>
              </div>

              <div className="ranking-list">
                {ranking.map((entry, index) => {
                  const estaSeleccionado = selectedProject?.proyectoId === entry.proyectoId;

                  return (
                    <div
                      key={entry.proyectoId}
                      className={`ranking-list-item ${estaSeleccionado ? "selected" : ""}`}
                      onClick={() => setSelectedProjectId(entry.proyectoId)}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="ranking-item-left">
                        {getPositionBadge(entry.posicion)}

                        <div className="ranking-project-meta">
                          <strong>{entry.proyectoNombre}</strong>
                          <span>{entry.equipoNombre || "Equipo no disponible"}</span>
                        </div>
                      </div>

                      <div className="ranking-item-right">
                        <div className="ranking-score-block">
                          {renderPuntuacionPrincipal(entry)}
                          <span className="ranking-score-unit">{etiquetaPuntuacion()}</span>

                          {!esSimple && !esMixta && (
                            <div className="ranking-votes-line">
                              <span>{entry.totalVotos ?? 0} votos</span>
                            </div>
                          )}

                          {esMixta && (
                            <div className="ranking-votes-line" style={{ flexDirection: "column", gap: "2px", alignItems: "flex-end" }}>
                              <span style={{ color: "#4a90d9", fontSize: "0.75rem" }}>
                                🌐 {entry.votosPopular ?? 0}v ({entry.pesoPopular ?? 0}%)
                              </span>
                              <span style={{ color: "#e8a838", fontSize: "0.75rem" }}>
                                ⚖️ {entry.votosJurado ?? 0}v ({entry.pesoJurado ?? 0}%)
                              </span>
                            </div>
                          )}
                        </div>

                        {esMulticriterio && !enModoManual && (
                          <span className="ranking-detail-link">Ver Detalle</span>
                        )}

                        {esMixta && !enModoManual && (
                          <span className="ranking-detail-link">Ver Detalle</span>
                        )}

                        {puedeEditar && enModoManual && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginLeft: "12px" }}>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); moverPosicion(index, -1); }}
                              disabled={index === 0}
                              title="Subir"
                              style={{ padding: "4px", cursor: index === 0 ? "not-allowed" : "pointer" }}
                            >
                              <ArrowUp size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); moverPosicion(index, 1); }}
                              disabled={index === ranking.length - 1}
                              title="Bajar"
                              style={{ padding: "4px", cursor: index === ranking.length - 1 ? "not-allowed" : "pointer" }}
                            >
                              <ArrowDown size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {esMulticriterio && (
              <aside className="ranking-detail-card">
                <div className="ranking-card-header">
                  <div>
                    <h2>
                      Proyecto #{selectedProject?.posicion}: {selectedProject?.proyectoNombre}
                    </h2>
                    <p>Desglose por criterio</p>
                  </div>
                </div>

                <div className="ranking-detail-body">
                  {selectedProject?.criterios?.map((criterio) => (
                    <div key={criterio.criterioId} className="ranking-criterion-row">
                      <div className="ranking-criterion-head">
                        <span>
                          {criterio.criterioNombre}
                          {modalidad === "MULTICRITERIO_PONDERADA" && criterio.peso != null && (
                            <small> ({criterio.peso}%)</small>
                          )}
                        </span>
                        <strong>{formatearNota(criterio.promedio)}/5</strong>
                      </div>

                      <div className="ranking-progress-bar">
                        <div
                          className="ranking-progress-fill"
                          style={{ width: progresoSobreCinco(criterio.promedio) }}
                        />
                      </div>
                    </div>
                  ))}

                  <div className="ranking-final-score-box">
                    <div className="ranking-criterion-head">
                      <span>Puntuación Final</span>
                      <strong className="ranking-final-score">
                        {formatearNota(selectedProject?.puntuacionTotal)}/5
                      </strong>
                    </div>

                    <div className="ranking-progress-bar">
                      <div
                        className="ranking-progress-fill"
                        style={{ width: progresoSobreCinco(selectedProject?.puntuacionTotal) }}
                      />
                    </div>
                  </div>
                </div>
              </aside>
            )}

            {esPuntos && selectedProject && (
              <aside className="ranking-detail-card">
                <div className="ranking-card-header">
                  <div>
                    <h2>
                      Proyecto #{selectedProject.posicion}: {selectedProject.proyectoNombre}
                    </h2>
                    <p>Resumen de puntos</p>
                  </div>
                </div>

                <div className="ranking-detail-body">
                  <div className="ranking-final-score-box">
                    <div className="ranking-criterion-head">
                      <span>Suma total de puntos</span>
                      <strong className="ranking-final-score">
                        {formatearNumero(selectedProject.sumaPuntos ?? selectedProject.puntuacionTotal)}
                      </strong>
                    </div>
                  </div>

                  <div className="ranking-final-score-box">
                    <div className="ranking-criterion-head">
                      <span>Media por votante</span>
                      <strong className="ranking-final-score">
                        {formatearNumero(selectedProject.mediaPuntos ?? 0)}
                      </strong>
                    </div>
                  </div>

                  <div className="ranking-final-score-box">
                    <div className="ranking-criterion-head">
                      <span>Total de votos</span>
                      <strong className="ranking-final-score">
                        {selectedProject.totalVotos ?? 0}
                      </strong>
                    </div>
                  </div>
                </div>
              </aside>
            )}

            {esSimple && selectedProject && (
              <aside className="ranking-detail-card">
                <div className="ranking-card-header">
                  <div>
                    <h2>
                      Proyecto #{selectedProject.posicion}: {selectedProject.proyectoNombre}
                    </h2>
                    <p>Resumen de votación simple</p>
                  </div>
                </div>

                <div className="ranking-detail-body">
                  <div className="ranking-final-score-box">
                    <div className="ranking-criterion-head">
                      <span>Total de votos</span>
                      <strong className="ranking-final-score">
                        {selectedProject.totalVotos ?? 0}
                      </strong>
                    </div>
                  </div>

                  <div className="ranking-final-score-box">
                    <div className="ranking-criterion-head">
                      <span>Votantes activos en el evento</span>
                      <strong className="ranking-final-score">
                        {selectedProject.votantesActivos ?? 0}
                      </strong>
                    </div>
                  </div>
                </div>
              </aside>
            )}

            {esMixta && selectedProject && (
              <aside className="ranking-detail-card">
                <div className="ranking-card-header">
                  <div>
                    <h2>
                      Proyecto #{selectedProject.posicion}: {selectedProject.proyectoNombre}
                    </h2>
                    <p>Desglose votación mixta</p>
                  </div>
                </div>

                <div className="ranking-detail-body">
                  <div className="ranking-final-score-box">
                    <div className="ranking-criterion-head">
                      <span>🌐 Votos populares ({selectedProject.pesoPopular ?? 0}% de peso)</span>
                      <strong className="ranking-final-score">
                        {selectedProject.votosPopular ?? 0} votos
                      </strong>
                    </div>
                    <div className="ranking-progress-bar">
                      <div
                        className="ranking-progress-fill"
                        style={{ width: `${selectedProject.pesoPopular ?? 0}%`, backgroundColor: "#4a90d9" }}
                      />
                    </div>
                    <div className="ranking-criterion-head" style={{ marginTop: "6px" }}>
                      <span style={{ fontSize: "0.82rem", color: "#888" }}>Puntuación popular ponderada</span>
                      <span style={{ fontWeight: 600 }}>
                        {(((selectedProject.puntosPopular ?? 0) * (selectedProject.pesoPopular ?? 0)) / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="ranking-final-score-box">
                    <div className="ranking-criterion-head">
                      <span>⚖️ Votos jurado ({selectedProject.pesoJurado ?? 0}% de peso)</span>
                      <strong className="ranking-final-score">
                        {selectedProject.votosJurado ?? 0} votos
                      </strong>
                    </div>
                    <div className="ranking-progress-bar">
                      <div
                        className="ranking-progress-fill"
                        style={{ width: `${selectedProject.pesoJurado ?? 0}%`, backgroundColor: "#e8a838" }}
                      />
                    </div>
                    <div className="ranking-criterion-head" style={{ marginTop: "6px" }}>
                      <span style={{ fontSize: "0.82rem", color: "#888" }}>Puntuación jurado ponderada</span>
                      <span style={{ fontWeight: 600 }}>
                        {(((selectedProject.puntosJurado ?? 0) * (selectedProject.pesoJurado ?? 0)) / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="ranking-final-score-box">
                    <div className="ranking-criterion-head">
                      <span>🏆 Puntuación total ponderada</span>
                      <strong className="ranking-final-score" style={{ fontSize: "1.3rem" }}>
                        {selectedProject.puntuacionTotal ?? 0}
                      </strong>
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "#888", marginTop: "4px" }}>
                      = (popular × {selectedProject.pesoPopular ?? 0}%) + (jurado × {selectedProject.pesoJurado ?? 0}%)
                    </div>
                  </div>

                  <div className="ranking-final-score-box">
                    <div className="ranking-criterion-head">
                      <span>Total de votos (popular + jurado)</span>
                      <strong className="ranking-final-score">
                        {selectedProject.totalVotos ?? 0}
                      </strong>
                    </div>
                  </div>
                </div>
              </aside>
            )}
          </section>

          {resultadoFinal && ganadores.length > 0 && (
            <section className="ranking-awards-panel">
              <div className="ranking-awards-header">
                <div>
                  <h2>Premios y certificados</h2>
                  <p>Genera certificados para los ganadores de la votaciÃ³n publicada.</p>
                </div>
                <Award size={28} />
              </div>

              <div className="ranking-podium">
                {[2, 1, 3].map((posicion) => {
                  const ganador = ganadores.find((entry) => entry.posicion === posicion);
                  if (!ganador) return null;

                  return (
                    <article key={ganador.votacionProyectoId} className={`ranking-podium-card position-${posicion}`}>
                      <div className="ranking-podium-medal">
                        {getPositionBadge(posicion)}
                      </div>
                      <div className="ranking-podium-step">#{posicion}</div>
                      <div className="ranking-podium-info">
                        <strong>{ganador.proyectoNombre}</strong>
                        <span>{ganador.equipoNombre || "Equipo no disponible"}</span>
                        <div>
                          <Star size={14} />
                          {formatearNumero(ganador.puntuacionTotal ?? ganador.totalVotos)}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="ranking-certificate-list">
                {ganadores.map((ganador) => (
                  <article key={ganador.votacionProyectoId} className="ranking-certificate-row">
                    <div className="ranking-certificate-main">
                      {getPositionBadge(ganador.posicion)}
                      <div>
                        <strong>{ganador.proyectoNombre}</strong>
                        <span>{ganador.equipoNombre || "Equipo no disponible"} Â· Premio {ganador.tipoPremio}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="primary-btn ranking-action-btn"
                      onClick={() => generarCertificado(ganador)}
                    >
                      <FileText size={16} />
                      Generar certificado
                    </button>
                  </article>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}

export default RankingScreen;