import { useEffect, useState, useMemo } from "react";
import { Trophy, Medal, Award, Download } from "lucide-react";
import { getEventos } from "../../services/eventoService";
import { getVotacionesByEvento } from "../../services/votacionService";
import { getRanking, getCriteriosByEvento } from "../../services/criterioService";
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

        if (data.length > 0) {
          setSelectedProjectId(data[0].proyectoId);
        } else {
          setSelectedProjectId(null);
        }
      } catch (err) {
        setError(err.message || "No se pudo cargar el ranking");
      } finally {
        setLoading(false);
      }
    };

    loadRanking();
  }, [eventoId, votacionId]);

  const votacionSeleccionada = useMemo(
    () => votaciones.find((v) => v.id === votacionId) || null,
    [votaciones, votacionId]
  );

  const modalidad = votacionSeleccionada?.modalidad ?? null;
  const esMulticriterio = MODALIDADES_MULTICRITERIO.includes(modalidad);
  const esSimple = modalidad === "SIMPLE";
  const esPuntos = modalidad === "PUNTOS";

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
    return <strong>{formatearNota(entry.puntuacionTotal)}</strong>;
  };

  const etiquetaPuntuacion = () => {
    if (esSimple) return "votos";
    if (esPuntos) return "pts";
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

  return (
    <main className="ranking-page">
      <header className="ranking-header">
        <div>
          <h1>Ranking y Resultados</h1>
          <p>Visualiza los resultados de la votación en tiempo real</p>
        </div>

        <div className="ranking-header-actions">
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
                {v.nombre} — {v.tipo} · {etiquetaModalidad(v.modalidad)}
              </option>
            ))}
          </select>
        </label>
      </section>

      {error && <div className="feedback-card error-box">{error}</div>}

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
                <h2>Ranking General</h2>
              </div>

              <div className="ranking-list">
                {ranking.map((entry) => {
                  const estaSeleccionado = selectedProject?.proyectoId === entry.proyectoId;

                  return (
                    <button
                      key={entry.proyectoId}
                      type="button"
                      className={`ranking-list-item ${estaSeleccionado ? "selected" : ""}`}
                      onClick={() => setSelectedProjectId(entry.proyectoId)}
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

                          {!esSimple && (
                            <div className="ranking-votes-line">
                              <span>{entry.totalVotos ?? 0} votos</span>
                            </div>
                          )}
                        </div>

                        {esMulticriterio && (
                          <span className="ranking-detail-link">Ver Detalle</span>
                        )}
                      </div>
                    </button>
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
          </section>
        </>
      )}
    </main>
  );
}

export default RankingScreen;