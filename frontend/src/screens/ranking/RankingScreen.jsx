import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Trophy,
  Medal,
  Award,
  Download,
  ArrowUp,
  ArrowDown,
  Save,
  FileText,
  Eye,
  Settings2,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Star,
  Scale,
  Users,
  Gavel,
} from "lucide-react";
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
  const [selectedCategory, setSelectedCategory] = useState("all");

  const usuario = useMemo(() => getUsuarioLogueado(), []);
  const eventoSeleccionado = useMemo(
    () => eventos.find((ev) => ev.id === eventoId) || null,
    [eventos, eventoId]
  );
  const votacionSeleccionada = useMemo(
    () => votaciones.find((v) => v.id === votacionId) || null,
    [votaciones, votacionId]
  );

  const modalidad = votacionSeleccionada?.modalidad ?? null;
  const esMulticriterio = MODALIDADES_MULTICRITERIO.includes(modalidad);
  const esSimple = modalidad === "SIMPLE";
  const esPuntos = modalidad === "PUNTOS";
  const esMixta = votacionSeleccionada?.tipo === "MIXTA";
  const enModoManual = modo === "MANUAL";
  const rankingTieneCriterios = ranking.some((entry) => entry.criterios?.length > 0);
  const puedeFiltrarPorCriterio = esMulticriterio && criterios.length > 0 && rankingTieneCriterios;
  const filtroCriterioActivo = puedeFiltrarPorCriterio && selectedCategory !== "all";
  const vistaFiltrada = filtroCriterioActivo;

  const votacionCerrada =
    votacionSeleccionada?.estadoActual === "CERRADA" ||
    votacionSeleccionada?.estado === "CERRADA" ||
    ranking[0]?.votacionCerrada;

  const resultadosPublicados = Boolean(
    votacionSeleccionada?.resultadosPublicados || ranking[0]?.resultadosPublicados
  );
  const resultadoFinal = Boolean(votacionCerrada && resultadosPublicados);

  const puedeEditar = useMemo(() => {
    if (!usuario || !votacionSeleccionada) return false;
    if (usuario.rol === "ORGANIZADOR") return true;
    return usuario.rol === "JURADO" && (votacionSeleccionada.tipo === "JURADO" || votacionSeleccionada.tipo === "MIXTA");
  }, [usuario, votacionSeleccionada]);

  useEffect(() => {
    const loadEventos = async () => {
      try {
        const data = await getEventos();
        setEventos(data || []);
        if (data?.length > 0) setEventoId(data[0].id);
      } catch {
        setError("No se pudieron cargar los eventos.");
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

        setCriterios(criteriosData || []);
        setVotaciones(votacionesData || []);
        setSelectedCategory("all");

        if (votacionesData?.length > 0) {
          setVotacionId(votacionesData[0].id);
        } else {
          setVotacionId("");
          setRanking([]);
          setSelectedProjectId(null);
        }
      } catch (err) {
        setError(err.message || "No se pudieron cargar las votaciones.");
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
        const ordenado = [...(data || [])].sort((a, b) => Number(a.posicion || 0) - Number(b.posicion || 0));

        setRanking(ordenado);
        setOrdenSucio(false);
        setSelectedCategory("all");

        if (ordenado.length > 0) {
          setSelectedProjectId(ordenado[0].proyectoId);
          setModo(ordenado[0].modoRanking || "AUTOMATICO");
        } else {
          setSelectedProjectId(null);
          setModo("AUTOMATICO");
        }
      } catch (err) {
        setError(err.message || "No se pudo cargar el ranking.");
      } finally {
        setLoading(false);
      }
    };

    loadRanking();
  }, [eventoId, votacionId]);

  const selectedProject = useMemo(
    () => ranking.find((entry) => entry.proyectoId === selectedProjectId) || ranking[0] || null,
    [ranking, selectedProjectId]
  );

  const categorias = useMemo(
    () => [
      { id: "all", name: "General" },
      ...criterios.map((criterio) => ({ id: criterio.id, name: criterio.nombre })),
    ],
    [criterios]
  );

  const totalVotosEvento = useMemo(
    () => ranking.reduce((sum, entry) => sum + Number(entry.totalVotos || 0), 0),
    [ranking]
  );

  const votantesActivos = useMemo(() => {
    const values = ranking
      .map((entry) => entry.votantesActivos)
      .filter((value) => value !== undefined && value !== null);
    return values.length === 0 ? "-" : Math.max(...values);
  }, [ranking]);

  const participacion = useMemo(() => {
    const values = ranking
      .map((entry) => entry.participacion)
      .filter((value) => value !== undefined && value !== null);
    return values.length === 0 ? "-" : `${values[0]}%`;
  }, [ranking]);

  const rankingFiltrado = useMemo(() => {
    const base = [...ranking];

    if (filtroCriterioActivo) {
      base.sort((a, b) => {
        const valorA = getCriterioValue(a, selectedCategory);
        const valorB = getCriterioValue(b, selectedCategory);
        return Number(valorB) - Number(valorA);
      });
    }

    return base.map((entry, index) => ({
      ...entry,
      posicionVista: index + 1,
    }));
  }, [ranking, selectedCategory, filtroCriterioActivo]);

  const podiumOrden = useMemo(() => {
    return [2, 1, 3]
      .map((posicion) => rankingFiltrado.find((entry) => entry.posicionVista === posicion))
      .filter(Boolean);
  }, [rankingFiltrado]);

  const ganadores = useMemo(
    () => ranking.filter((entry) => entry.ganador || Number(entry.posicion) <= 3).slice(0, 3),
    [ranking]
  );

  function getCriterioValue(entry, criterioId) {
    return entry.criterios?.find((criterio) => criterio.criterioId === criterioId)?.promedio ?? 0;
  }

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
        return mod || "Sin modalidad";
    }
  };

  const etiquetaTipo = (tipo) => {
    switch (tipo) {
      case "POPULAR":
        return "Votacion Popular";
      case "JURADO":
        return "Evaluacion Jurado";
      case "MIXTA":
        return "Mixta";
      default:
        return tipo || "Votacion";
    }
  };

  const etiquetaPuntuacion = () => {
    if (esSimple) return "votos";
    if (esPuntos || esMixta) return "puntos";
    return "/5";
  };

  const formatearNumero = (valor) => {
    const num = Number(valor || 0);
    return Number.isInteger(num) ? String(num) : num.toFixed(1);
  };

  const normalizarSobreCinco = (valor) => Math.min(Math.max(Number(valor || 0), 0), 5);
  const formatearNota = (valor) => normalizarSobreCinco(valor).toFixed(1);
  const progresoSobreCinco = (valor) => `${(normalizarSobreCinco(valor) / 5) * 100}%`;

  const calcularMediaCriterios = (entry) => {
    const detalle = entry?.criterios || [];
    if (detalle.length === 0) return 0;

    if (modalidad === "MULTICRITERIO_PONDERADA") {
      const totalPeso = detalle.reduce((sum, criterio) => sum + Number(criterio.peso || 0), 0);
      if (totalPeso > 0) {
        return detalle.reduce(
          (sum, criterio) => sum + Number(criterio.promedio || 0) * (Number(criterio.peso || 0) / totalPeso),
          0
        );
      }
    }

    return detalle.reduce((sum, criterio) => sum + Number(criterio.promedio || 0), 0) / detalle.length;
  };

  const getScorePrincipal = (entry) => {
    if (!entry) return 0;
    if (filtroCriterioActivo) return getCriterioValue(entry, selectedCategory);
    if (esSimple) return entry.totalVotos ?? 0;
    if (esPuntos) return entry.sumaPuntos ?? entry.puntuacionTotal ?? 0;
    if (esMulticriterio) return entry.puntuacionTotal ?? calcularMediaCriterios(entry);
    return entry.puntuacionTotal ?? entry.sumaPuntos ?? entry.totalVotos ?? 0;
  };

  const formatearScorePrincipal = (entry) => {
    const score = getScorePrincipal(entry);
    if (filtroCriterioActivo || esMulticriterio) return formatearNota(score);
    return formatearNumero(score);
  };

  const etiquetaScorePrincipal = () => {
    if (filtroCriterioActivo || esMulticriterio) return "/5";
    return etiquetaPuntuacion();
  };

  const getPopularScore = (entry) =>
    entry?.puntuacionPopular ?? entry?.puntosPopular ?? entry?.popularScore ?? entry?.votosPopular ?? 0;

  const getJuradoScore = (entry) =>
    entry?.puntuacionJurado ?? entry?.puntosJurado ?? entry?.juryScore ?? entry?.votosJurado ?? 0;

  const getPositionBadge = (posicion) => {
    if (posicion === 1) {
      return (
        <div className="ranking-medal ranking-medal-gold">
          <Trophy size={18} />
        </div>
      );
    }

    if (posicion === 2) {
      return (
        <div className="ranking-medal ranking-medal-silver">
          <Medal size={18} />
        </div>
      );
    }

    if (posicion === 3) {
      return (
        <div className="ranking-medal ranking-medal-bronze">
          <Award size={18} />
        </div>
      );
    }

    return <div className="ranking-medal ranking-medal-default">{posicion}</div>;
  };

  const handleCambiarModo = async (nuevoModo) => {
    if (!puedeEditar || nuevoModo === modo) return;

    try {
      setError("");
      setAviso("");
      await cambiarModoRanking(eventoId, votacionId, usuario.id, nuevoModo);
      setModo(nuevoModo);

      const data = await getRanking(eventoId, votacionId);
      const ordenado = [...(data || [])].sort((a, b) => Number(a.posicion || 0) - Number(b.posicion || 0));
      setRanking(ordenado);
      setSelectedCategory("all");
      setOrdenSucio(false);

      setAviso(
        nuevoModo === "MANUAL"
          ? "Modo manual activado. Reordena con las flechas y pulsa Guardar."
          : "Modo automatico activado. El ranking se ordena por puntuacion."
      );
    } catch (err) {
      setError(err.message || "No se pudo cambiar el modo.");
    }
  };

  const moverPosicion = (index, delta) => {
    if (vistaFiltrada) return;

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
      setError(err.message || "No se pudo guardar el orden.");
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
      const ordenado = [...(data || [])].sort((a, b) => Number(a.posicion || 0) - Number(b.posicion || 0));
      setRanking(ordenado);
      setAviso("Resultados finales publicados. Ya puedes generar certificados para los ganadores.");
    } catch (err) {
      setError(err.message || "No se pudieron publicar los resultados.");
    } finally {
      setPublicandoResultados(false);
    }
  };

  const exportarResultados = () => {
    if (rankingFiltrado.length === 0) return;

    const headers = ["Posicion", "Proyecto", "Equipo", "Puntuacion", "Votos"];
    const rows = rankingFiltrado.map((entry) => [
      entry.posicionVista,
      entry.proyectoNombre,
      entry.equipoNombre ?? "",
      getScorePrincipal(entry),
      entry.totalVotos ?? 0,
    ]);

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

  const generarCertificado = (entry) => {
    const fecha = new Date().toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const puntuacion = formatearScorePrincipal(entry);
    const ventana = window.open("", "_blank", "width=1000,height=720");

    if (!ventana) {
      setError("No se pudo abrir el certificado. Revisa si el navegador bloqueo la ventana emergente.");
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
            body { margin: 0; font-family: Arial, sans-serif; background: #f3f4f6; color: #111827; }
            .page { min-height: 100vh; display: grid; place-items: center; padding: 32px; }
            .certificate { width: min(980px, 100%); background: linear-gradient(135deg, #f8fafc, #eef2ff); border: 10px double #6366f1; padding: 56px; text-align: center; box-shadow: 0 24px 80px rgba(15, 23, 42, 0.18); }
            .seal { width: 92px; height: 92px; border-radius: 999px; margin: 0 auto 22px; display: grid; place-items: center; background: #facc15; color: #713f12; font-size: 42px; font-weight: 800; }
            h1 { margin: 0; font-size: 42px; color: #312e81; }
            .line { width: 140px; height: 4px; background: #6366f1; margin: 18px auto 30px; border-radius: 999px; }
            .muted { color: #4b5563; font-size: 19px; margin: 0 0 14px; }
            .project { margin: 18px auto; padding: 22px; background: white; border: 1px solid #c7d2fe; border-radius: 14px; max-width: 680px; }
            .project strong { display: block; color: #4338ca; font-size: 34px; margin-bottom: 8px; }
            .position { font-size: 30px; font-weight: 800; margin: 14px 0 8px; }
            .meta { margin-top: 32px; color: #374151; font-size: 15px; }
            .actions { margin-top: 20px; text-align: center; }
            button { border: 0; border-radius: 10px; padding: 12px 18px; background: #6366f1; color: white; font-weight: 700; cursor: pointer; }
            @media print { .actions { display: none; } }
          </style>
        </head>
        <body>
          <div class="page">
            <main>
              <section class="certificate">
                <div class="seal">${entry.posicionVista || entry.posicion}</div>
                <h1>Certificado de Reconocimiento</h1>
                <div class="line"></div>
                <p class="muted">Se otorga a</p>
                <div class="project">
                  <strong>${entry.proyectoNombre}</strong>
                  <span>${entry.equipoNombre || "Equipo no disponible"}</span>
                </div>
                <p class="muted">por alcanzar el</p>
                <div class="position">${entry.posicionVista || entry.posicion} lugar</div>
                <p class="muted">${votacionSeleccionada?.nombre || "Votacion"} - ${eventoSeleccionado?.nombre || "Votify"}</p>
                <div class="meta">Puntuacion final: ${puntuacion} - Emitido el ${fecha}</div>
              </section>
              <div class="actions"><button onclick="window.print()">Descargar / imprimir PDF</button></div>
            </main>
          </div>
        </body>
      </html>
    `);

    ventana.document.close();
  };

  const seleccionarProyecto = (proyectoId) => {
    setSelectedProjectId(proyectoId);
  };

  if (loading && eventos.length === 0) {
    return (
      <main className="ranking-page ranking-results-page">
        <div className="feedback-card">Cargando...</div>
      </main>
    );
  }

  return (
    <main className="ranking-page ranking-results-page">
      <div className="ranking-results-container">
        <nav className="ranking-breadcrumbs">
          <Link to="/eventos">Eventos</Link>
          <span>/</span>
          {eventoSeleccionado?.id ? (
            <Link to={`/eventos/${eventoSeleccionado.id}`}>
              {eventoSeleccionado.nombre || "Evento"}
            </Link>
          ) : (
            <span>Evento</span>
          )}
          <span>/</span>
          <strong>Resultados</strong>
        </nav>

        <section className="ranking-context-header">
          <div>
            <span className="ranking-context-label">Contexto de votacion</span>
            <h1>{eventoSeleccionado?.nombre || "Ranking y Resultados"}</h1>
            <p>{votacionSeleccionada?.nombre || "Selecciona una votacion"}</p>
          </div>

          <div className="ranking-context-info">
            <span className={`ranking-status ${votacionCerrada ? "closed" : "open"}`}>
              {votacionCerrada ? "Cerrada" : "Abierta"}
            </span>
            <span>{etiquetaTipo(votacionSeleccionada?.tipo)}</span>
            <span>{etiquetaModalidad(modalidad)}</span>
          </div>
        </section>

        {ordenSucio && (
          <section className="ranking-manual-warning">
            <AlertTriangle size={20} />
            <div>
              <strong>Ranking ajustado manualmente</strong>
              <p>Hay cambios pendientes de guardar. Pulsa Guardar orden para aplicar el resultado decisivo.</p>
            </div>
          </section>
        )}

        {vistaFiltrada && enModoManual && (
          <section className="ranking-manual-warning ranking-manual-warning-info">
            <AlertTriangle size={20} />
            <div>
              <strong>Vista filtrada por criterio</strong>
              <p>La reordenacion manual solo esta disponible en la vista General.</p>
            </div>
          </section>
        )}

        <section className="ranking-page-header">
          <div>
            <h2>Ranking y Resultados</h2>
            <div className="ranking-header-subtitle">
              <p>Visualiza los resultados de la votacion en tiempo real</p>
              <span>Total: {totalVotosEvento} votos</span>
            </div>
          </div>

          <div className="ranking-header-actions">
            {puedeEditar && (
              <button
                type="button"
                className="ranking-button ranking-button-outline"
                onClick={() => handleCambiarModo(enModoManual ? "AUTOMATICO" : "MANUAL")}
              >
                <Settings2 size={16} />
                {enModoManual ? "Modo automatico" : "Ajustar Ranking"}
              </button>
            )}

            {puedeEditar && enModoManual && (
              <button
                type="button"
                className="ranking-button ranking-button-dark"
                onClick={handleGuardarOrden}
                disabled={!ordenSucio || guardandoOrden}
              >
                <Save size={16} />
                {guardandoOrden ? "Guardando..." : "Guardar orden"}
              </button>
            )}

            {puedeEditar && votacionCerrada && !resultadosPublicados && (
              <button
                type="button"
                className="ranking-button ranking-button-success"
                onClick={handlePublicarResultados}
                disabled={publicandoResultados || ranking.length === 0}
              >
                <CheckCircle size={16} />
                {publicandoResultados ? "Publicando..." : "Publicar resultados"}
              </button>
            )}

            <button
              type="button"
              className="ranking-button ranking-button-primary"
              onClick={exportarResultados}
              disabled={ranking.length === 0}
            >
              <Download size={16} />
              Exportar Resultados
            </button>
          </div>
        </section>

        <section className="ranking-selectors">
          <label>
            <span>Evento</span>
            <select value={eventoId} onChange={(e) => setEventoId(e.target.value)}>
              {eventos.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.nombre}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Votacion</span>
            <select
              value={votacionId}
              onChange={(e) => setVotacionId(e.target.value)}
              disabled={votaciones.length === 0}
            >
              {votaciones.length === 0 && <option value="">Sin votaciones</option>}
              {votaciones.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nombre} - {etiquetaTipo(v.tipo)} - {etiquetaModalidad(v.modalidad)}
                </option>
              ))}
            </select>
          </label>
        </section>

        {esMixta && (
          <section className="ranking-mixed-panel">
            <div className="ranking-mixed-title">
              <div className="ranking-mixed-icon">
                <Scale size={22} />
              </div>
              <div>
                <h3>Votacion Mixta Activa</h3>
                <p>Los resultados combinan votacion popular y evaluacion del jurado.</p>
              </div>
            </div>

            <div className="ranking-mixed-grid">
              <div>
                <div className="ranking-mixed-row">
                  <span><Users size={15} /> Votacion Popular</span>
                  <strong>{votacionSeleccionada?.pesoPorcentajePopular ?? "?"}%</strong>
                </div>
                <div className="ranking-progress">
                  <span style={{ width: `${votacionSeleccionada?.pesoPorcentajePopular ?? 0}%` }} />
                </div>
              </div>

              <div>
                <div className="ranking-mixed-row">
                  <span><Gavel size={15} /> Evaluacion Jurado</span>
                  <strong>{votacionSeleccionada?.pesoPorcentajeJurado ?? "?"}%</strong>
                </div>
                <div className="ranking-progress">
                  <span style={{ width: `${votacionSeleccionada?.pesoPorcentajeJurado ?? 0}%` }} />
                </div>
              </div>
            </div>

            <div className="ranking-formula">
              <strong>Formula de calculo:</strong> Puntuacion final = popular y jurado segun los pesos configurados.
            </div>
          </section>
        )}

        {puedeFiltrarPorCriterio && (
          <section className="ranking-category-filter">
            <div className="ranking-category-title">
              <Award size={20} />
              <h3>Filtrar por Categoria</h3>
            </div>

            <div className="ranking-category-buttons">
              {categorias.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className={selectedCategory === category.id ? "active" : ""}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </section>
        )}

        {error && <div className="ranking-alert ranking-alert-error">{error}</div>}
        {aviso && <div className="ranking-alert ranking-alert-ok">{aviso}</div>}

        {loading && ranking.length === 0 ? (
          <div className="feedback-card">Cargando ranking...</div>
        ) : ranking.length === 0 ? (
          <div className="feedback-card">No hay resultados disponibles para esta votacion.</div>
        ) : (
          <>
            <section className="ranking-stats-grid">
              <article>
                <span>Total de Votos</span>
                <strong>{totalVotosEvento}</strong>
              </article>
              <article>
                <span>Proyectos Evaluados</span>
                <strong>{ranking.length}</strong>
              </article>
              <article>
                <span>Votantes Activos</span>
                <strong>{votantesActivos}</strong>
              </article>
              {/* No funciona lo de participacion asi q lo comento
              <article>
                <span>Participacion</span>
                <strong>{participacion}</strong>
              </article>
              */}
            </section>

            <section className="ranking-top-podium">
              {podiumOrden.map((entry) => (
                <article
                  key={entry.votacionProyectoId || entry.proyectoId}
                  className={`ranking-top-card position-${entry.posicionVista}`}
                >
                  <div className="ranking-top-content">
                    <div className="ranking-top-medal">{getPositionBadge(entry.posicionVista)}</div>
                    <div className="ranking-top-position">{entry.posicionVista}º</div>
                    <h3>{entry.proyectoNombre}</h3>
                    <p>{entry.equipoNombre || "Equipo no disponible"}</p>
                    <strong>{formatearScorePrincipal(entry)}</strong>
                    <span>{entry.totalVotos ?? 0} votos</span>
                  </div>
                </article>
              ))}
            </section>

            <section className="ranking-content-grid">
              <article className="ranking-table-card">
                <div className="ranking-card-title">
                  <h2>Ranking Completo</h2>
                </div>

                <div className="ranking-table-list">
                  {rankingFiltrado.map((entry, index) => (
                    <div
                      key={entry.votacionProyectoId || entry.proyectoId}
                      className={`ranking-row ${selectedProjectId === entry.proyectoId ? "selected" : ""}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => seleccionarProyecto(entry.proyectoId)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") seleccionarProyecto(entry.proyectoId);
                      }}
                    >
                      <div className="ranking-row-position">{getPositionBadge(entry.posicionVista)}</div>

                      <div className="ranking-row-project">
                        <h3>{entry.proyectoNombre}</h3>
                        <p>{entry.equipoNombre || "Equipo no disponible"}</p>
                      </div>

                      {esMixta ? (
                        <div className="ranking-row-split">
                          <div>
                            <span><Users size={13} /> Popular</span>
                            <strong>{formatearNumero(getPopularScore(entry))}</strong>
                          </div>
                          <div>
                            <span><Gavel size={13} /> Jurado</span>
                            <strong>{formatearNumero(getJuradoScore(entry))}</strong>
                          </div>
                        </div>
                      ) : esMulticriterio && criterios.length > 0 ? (
                        <div className="ranking-row-criteria">
                          {criterios.slice(0, 4).map((criterio) => {
                            const valor = getCriterioValue(entry, criterio.id);
                            return (
                              <div key={criterio.id}>
                                <span>{criterio.nombre}</span>
                                <strong>{formatearNota(valor)}</strong>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="ranking-row-criteria empty" />
                      )}

                      <div className="ranking-row-votes">
                        <span>Votos</span>
                        <strong>{entry.totalVotos ?? 0}</strong>
                      </div>

                      <div className="ranking-row-score">
                        <div>
                          <strong>{formatearScorePrincipal(entry)}</strong>
                        </div>
                        <span>{etiquetaScorePrincipal()}</span>
                      </div>

                      {enModoManual && puedeEditar && !vistaFiltrada && (
                        <div className="ranking-reorder-actions" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => moverPosicion(index, -1)}
                            disabled={index === 0}
                            title="Subir"
                          >
                            <ArrowUp size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => moverPosicion(index, 1)}
                            disabled={index === ranking.length - 1}
                            title="Bajar"
                          >
                            <ArrowDown size={15} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </article>

              {selectedProject && (
                <aside className="ranking-breakdown-card">
                  <div className="ranking-breakdown-header">
                    <h2>
                      Proyecto #{selectedProject.posicion}: {selectedProject.proyectoNombre}
                    </h2>
                    <p>{esMulticriterio ? "Desglose por criterio" : "Resumen de resultados"}</p>
                  </div>

                  <div className="ranking-breakdown-body">
                    {esMulticriterio && criterios.length > 0 ? (
                      criterios.map((criterio) => {
                        const promedio = getCriterioValue(selectedProject, criterio.id);

                        return (
                          <div className="ranking-breakdown-item" key={criterio.id}>
                            <div>
                              <span>
                                {criterio.nombre}
                                {modalidad === "MULTICRITERIO_PONDERADA" && criterio.peso != null ? ` (${criterio.peso}%)` : ""}
                              </span>
                              <strong>{formatearNota(promedio)}/5</strong>
                            </div>
                            <div className="ranking-progress">
                              <span style={{ width: progresoSobreCinco(promedio) }} />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="ranking-breakdown-empty">
                        <Star size={28} />
                        <span>Puntuacion principal</span>
                        <strong>{formatearScorePrincipal(selectedProject)}</strong>
                      </div>
                    )}

                    {esMixta && (
                      <div className="ranking-mixed-breakdown">
                        <div>
                          <span><Users size={15} /> Popular</span>
                          <strong>{formatearNumero(getPopularScore(selectedProject))}</strong>
                        </div>
                        <div>
                          <span><Gavel size={15} /> Jurado</span>
                          <strong>{formatearNumero(getJuradoScore(selectedProject))}</strong>
                        </div>
                      </div>
                    )}

                    <div className="ranking-final-score-panel">
                      <div>
                        <span>Puntuacion Final</span>
                        <strong>{formatearScorePrincipal(selectedProject)}</strong>
                      </div>
                      {esMulticriterio && (
                        <div className="ranking-progress ranking-progress-large">
                          <span style={{ width: progresoSobreCinco(getScorePrincipal(selectedProject)) }} />
                        </div>
                      )}
                    </div>
                  </div>
                </aside>
              )}
            </section>

            {resultadosPublicados && ganadores.length > 0 && (
              <>
                <section className="ranking-awards-panel">
                  <div className="ranking-awards-heading">
                    <div className="ranking-awards-icon">
                      <Award size={22} />
                    </div>
                    <div>
                      <h2>Premios y Reconocimientos</h2>
                      <p>Genera certificados para los ganadores</p>
                    </div>
                  </div>

                  <div className="ranking-awards-podium">
                    {podiumOrden.map((entry) => (
                      <article
                        key={entry.votacionProyectoId || entry.proyectoId}
                        className={`ranking-award-card position-${entry.posicionVista}`}
                      >
                        <div className="ranking-award-ribbon">{getPositionBadge(entry.posicionVista)}</div>
                        <div className="ranking-award-top">#{entry.posicionVista}</div>
                        <h3>{entry.proyectoNombre}</h3>
                        <p>{entry.equipoNombre || "Equipo no disponible"}</p>
                        <strong><Star size={14} /> {formatearScorePrincipal(entry)}</strong>
                      </article>
                    ))}
                  </div>

                  <div className="ranking-awards-list-title">Todos los Proyectos</div>

                  <div className="ranking-awards-list">
                    {rankingFiltrado.map((entry) => (
                      <article
                        key={entry.votacionProyectoId || entry.proyectoId}
                        className={entry.posicionVista <= 3 ? "winner" : ""}
                      >
                        <div className="ranking-awards-main">
                          {getPositionBadge(entry.posicionVista)}
                          <div>
                            <h3>{entry.proyectoNombre}</h3>
                            <p>{entry.equipoNombre || "Equipo no disponible"}</p>
                          </div>
                        </div>

                        <div className="ranking-awards-score">
                          <strong>{formatearScorePrincipal(entry)}</strong>
                          <span>{etiquetaScorePrincipal()}</span>
                        </div>

                        <button
                          type="button"
                          className="ranking-button ranking-button-primary"
                          onClick={() => generarCertificado(entry)}
                        >
                          <FileText size={16} />
                          Certificado
                        </button>
                      </article>
                    ))}
                  </div>
                </section>

                <div className="ranking-alert ranking-alert-ok">
                  Resultados finales publicados. Hay {ganadores.length} ganador{ganadores.length > 1 ? "es" : ""} listo{ganadores.length > 1 ? "s" : ""} para certificado.
                </div>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default RankingScreen;
