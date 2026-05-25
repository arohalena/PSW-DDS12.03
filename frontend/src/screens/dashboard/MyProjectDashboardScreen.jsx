import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  CalendarDays,
  Edit3,
  Eye,
  FolderKanban,
  Image,
  MessageSquare,
  Plus,
  Star,
  Target,
  Trophy,
  Users,
  Vote,
  X,
} from "lucide-react";
import {
  createProyectoGestionado,
  getMiProyectoDashboard,
  updateProyectoGestionado,
} from "../../services/proyectoService";
import { asignarProyectoAVotacion, getVotacionesByEvento } from "../../services/votacionService";
import { getUsuarioLogueado } from "../../services/sessionService";
import { ProjectMaterials } from "../../common/ProjectMaterials";
import "../../styles/my-project-dashboard.css";

import { MaterialGallery } from "../../common/MaterialGallery";

const EMPTY_FORM = {
  nombre: "",
  descripcion: "",
  tipoCategoria: "IA",
  equipoId: "",
  eventoId: "",
  votacionIds: [],
};

const DASHBOARD_CACHE_PREFIX = "votify:mi-proyecto-dashboard:";

function votingLabel(votacion) {
  return votacion?.nombre || `${votacion?.tipo || "Votacion"} - ${votacion?.modalidad || ""}`;
}

function getProjectEventId(proyecto) {
  return proyecto?.evento?.id || proyecto?.eventoId || "";
}

function getProjectTeamId(proyecto) {
  return proyecto?.equipo?.id || proyecto?.equipoId || "";
}

function isMulticriterio(votacion) {
  return votacion?.modalidad === "MULTICRITERIO" || votacion?.modalidad === "MULTICRITERIO_PONDERADA";
}

function formatScore(value) {
  if (value === undefined || value === null || value === "") return "-";
  const num = Number(value);
  if (Number.isNaN(num)) return "-";
  return Number.isInteger(num) ? String(num) : num.toFixed(2);
}

function getInitials(value = "") {
  return (
    value
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "P"
  );
}

function normalizeDashboardProject(item) {
  const proyecto = item?.proyecto || item;

  return {
    ...item,
    proyecto,
    equipo: item?.equipo || proyecto?.equipo || null,
    evento: item?.evento || proyecto?.evento || null,
    votaciones: item?.votaciones || [],
    comentarios: item?.comentarios || [],
  };
}

function MiniRadarChart({ data }) {
  const size = 260;
  const center = size / 2;
  const radius = 82;
  const safeData = Array.isArray(data) ? data : [];

  if (safeData.length === 0) return null;

  function getPoint(index, value = 5) {
    const angle = (Math.PI * 2 * index) / safeData.length - Math.PI / 2;
    const currentRadius = radius * (Number(value || 0) / 5);

    return {
      x: center + currentRadius * Math.cos(angle),
      y: center + currentRadius * Math.sin(angle),
    };
  }

  const polygonPoints = safeData
    .map((item, index) => {
      const chartPoint = getPoint(index, item.value);
      return `${chartPoint.x},${chartPoint.y}`;
    })
    .join(" ");

  return (
    <div className="my-project-radar">
      <svg viewBox={`0 0 ${size} ${size}`} aria-label="Grafico radar de evaluacion">
        {[1, 2, 3, 4, 5].map((level) => {
          const gridPoints = safeData
            .map((_, index) => {
              const chartPoint = getPoint(index, level);
              return `${chartPoint.x},${chartPoint.y}`;
            })
            .join(" ");

          return <polygon key={level} points={gridPoints} className="radar-grid-shape" />;
        })}

        {safeData.map((item, index) => {
          const end = getPoint(index, 5);
          const label = getPoint(index, 6.25);

          return (
            <g key={item.label}>
              <line x1={center} y1={center} x2={end.x} y2={end.y} className="radar-axis" />
              <text
                x={label.x}
                y={label.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="radar-label"
              >
                {item.label}
              </text>
            </g>
          );
        })}

        <polygon points={polygonPoints} className="radar-value-shape" />

        {safeData.map((item, index) => {
          const chartPoint = getPoint(index, item.value);
          return <circle key={item.label} cx={chartPoint.x} cy={chartPoint.y} r="4" className="radar-point" />;
        })}
      </svg>
    </div>
  );
}

function ProjectModal({ open, editingProject, equipos, eventos, proyectos, onClose, onSubmit }) {
  const editing = Boolean(editingProject);
  const [form, setForm] = useState(EMPTY_FORM);
  const [votaciones, setVotaciones] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    setForm({
      nombre: editingProject?.nombre || "",
      descripcion: editingProject?.descripcion || "",
      tipoCategoria: editingProject?.tipoCategoria || "IA",
      equipoId: getProjectTeamId(editingProject) || equipos[0]?.id || "",
      eventoId: getProjectEventId(editingProject) || "",
      votacionIds: [],
    });

    setError("");
  }, [open, editingProject, equipos]);

  useEffect(() => {
    let cancelled = false;

    if (!open || !form.eventoId || editing) {
      setVotaciones([]);
      if (!editing) setForm((prev) => ({ ...prev, votacionIds: [] }));
      return undefined;
    }

    getVotacionesByEvento(form.eventoId)
      .then((data) => {
        if (!cancelled) setVotaciones(data || []);
      })
      .catch(() => {
        if (!cancelled) setVotaciones([]);
      });

    return () => {
      cancelled = true;
    };
  }, [open, form.eventoId, editing]);

  if (!open) return null;

  function equipoTieneOtroProyectoEnEvento() {
    if (!form.equipoId || !form.eventoId) return false;

    return proyectos.some((proyecto) => {
      const sameTeam = String(getProjectTeamId(proyecto)) === String(form.equipoId);
      const sameEvent = String(getProjectEventId(proyecto)) === String(form.eventoId);
      const differentProject = !editingProject || String(proyecto.id) !== String(editingProject.id);

      return sameTeam && sameEvent && differentProject;
    });
  }

  async function submit(event) {
    event.preventDefault();

    if (!form.nombre.trim()) {
      setError("El proyecto debe tener nombre.");
      return;
    }

    if (!form.equipoId) {
      setError("Debes elegir uno de tus equipos.");
      return;
    }

    if (!editing && form.eventoId && form.votacionIds.length === 0) {
      setError("Si eliges un evento, debes seleccionar al menos una votacion.");
      return;
    }

    if (equipoTieneOtroProyectoEnEvento()) {
      setError("Ese equipo ya tiene un proyecto en ese evento.");
      return;
    }

    await onSubmit(form);
  }

  return (
    <div className="my-project-modal-backdrop">
      <form className="my-project-modal" onSubmit={submit}>
        <div className="my-project-modal-header">
          <div>
            <h2>{editing ? "Editar Proyecto" : "Crear Proyecto"}</h2>
            <p>Solo puedes elegir equipos en los que participas. El evento es opcional.</p>
          </div>

          <button type="button" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        <div className="my-project-modal-body">
          <label className="my-project-field">
            <span>Nombre</span>
            <input
              value={form.nombre}
              onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
              placeholder="Ej. Votify AI"
            />
          </label>

          <label className="my-project-field">
            <span>Descripcion</span>
            <textarea
              rows="4"
              value={form.descripcion}
              onChange={(e) => setForm((prev) => ({ ...prev, descripcion: e.target.value }))}
              placeholder="Describe tu proyecto..."
            />
          </label>

          <div className="my-project-form-grid">
            <label className="my-project-field">
              <span>Categoria</span>
              <select
                value={form.tipoCategoria}
                onChange={(e) => setForm((prev) => ({ ...prev, tipoCategoria: e.target.value }))}
              >
                <option value="IA">IA</option>
                <option value="SOSTENIBILIDAD">Sostenibilidad</option>
              </select>
            </label>

            <label className="my-project-field">
              <span>Equipo</span>
              <select
                value={form.equipoId}
                onChange={(e) => setForm((prev) => ({ ...prev, equipoId: e.target.value }))}
              >
                <option value="">Selecciona equipo</option>
                {equipos.map((equipo) => (
                  <option key={equipo.id} value={equipo.id}>
                    {equipo.nombre}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {editing ? (
            <div className="my-project-readonly">
              <span>Evento actual</span>
              <strong>{editingProject?.evento?.nombre || "Sin evento asignado"}</strong>
              <small>Para cambiar evento o votaciones usa la ventana de Proyectos.</small>
            </div>
          ) : (
            <label className="my-project-field">
              <span>Evento opcional</span>
              <select
                value={form.eventoId}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    eventoId: e.target.value,
                    votacionIds: [],
                  }))
                }
              >
                <option value="">Sin evento</option>
                {eventos.map((evento) => (
                  <option key={evento.id} value={evento.id}>
                    {evento.nombre}
                  </option>
                ))}
              </select>
            </label>
          )}

          {!editing && form.eventoId ? (
            <div>
              <span className="my-project-mini-label">Votaciones donde participara</span>

              {votaciones.length === 0 ? (
                <div className="feedback-card warning-box">Este evento todavia no tiene votaciones.</div>
              ) : (
                <div className="my-project-voting-grid">
                  {votaciones.map((votacion) => {
                    const selected = form.votacionIds.includes(votacion.id);

                    return (
                      <button
                        type="button"
                        key={votacion.id}
                        className={`my-project-voting-card ${selected ? "selected" : ""}`}
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            votacionIds: selected
                              ? prev.votacionIds.filter((id) => id !== votacion.id)
                              : [...prev.votacionIds, votacion.id],
                          }))
                        }
                      >
                        <strong>{votingLabel(votacion)}</strong>
                        <span>
                          {votacion.tipo} - {votacion.modalidad}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}

          {error ? <div className="feedback-card error-box">{error}</div> : null}
        </div>

        <div className="my-project-modal-actions">
          <button type="button" className="secondary-btn" onClick={onClose}>
            Cancelar
          </button>

          <button type="submit" className="primary-btn">
            {editing ? "Guardar cambios" : "Crear proyecto"}
          </button>
        </div>
      </form>
    </div>
  );
}

function MyProjectDashboardScreen() {
  const navigate = useNavigate();
  const usuario = useMemo(() => getUsuarioLogueado(), []);
  const cacheKey = usuario?.id ? `${DASHBOARD_CACHE_PREFIX}${usuario.id}` : "";

  const [dashboard, setDashboard] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedVotingId, setSelectedVotingId] = useState("");
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const applyDashboard = useCallback((data) => {
    setDashboard(data);
    setSelectedProjectId((current) => {
      const projects = data?.proyectosDashboard || [];
      if (current && projects.some((item) => String(item.proyecto?.id || item.id) === String(current))) {
        return current;
      }

      return projects[0]?.proyecto?.id || projects[0]?.id || "";
    });
  }, []);

  const load = useCallback(
    async ({ silent = false } = {}) => {
      try {
        if (!usuario?.id) {
          throw new Error("No hay usuario autenticado.");
        }

        if (!silent) setLoading(true);
        setRefreshing(silent);
        setError("");

        const data = await getMiProyectoDashboard(usuario.id);
        applyDashboard(data);
        if (cacheKey) sessionStorage.setItem(cacheKey, JSON.stringify(data));
      } catch (err) {
        setError(err.message || "No se pudo cargar Mi Proyecto.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [applyDashboard, cacheKey, usuario?.id]
  );

  useEffect(() => {
    let hasCache = false;

    if (cacheKey) {
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          applyDashboard(JSON.parse(cached));
          setLoading(false);
          hasCache = true;
        }
      } catch {
        sessionStorage.removeItem(cacheKey);
      }
    }

    load({ silent: hasCache });
  }, [applyDashboard, cacheKey, load]);

  const proyectosDashboard = useMemo(
    () => (dashboard?.proyectosDashboard || []).map(normalizeDashboardProject),
    [dashboard]
  );

  const selectedItem = useMemo(
    () =>
      proyectosDashboard.find((item) => String(item.proyecto?.id) === String(selectedProjectId)) ||
      proyectosDashboard[0] ||
      null,
    [proyectosDashboard, selectedProjectId]
  );

  const selectedProject = selectedItem?.proyecto || null;
  const selectedVotaciones = useMemo(() => selectedItem?.votaciones || [], [selectedItem]);

  const comentarios = useMemo(() => {
    if (selectedItem?.comentarios?.length) return selectedItem.comentarios;

    if (
      dashboard?.comentarios &&
      dashboard?.proyecto?.id &&
      selectedProject?.id &&
      String(dashboard.proyecto.id) === String(selectedProject.id)
    ) {
      return dashboard.comentarios;
    }

    return [];
  }, [selectedItem, dashboard, selectedProject]);

  useEffect(() => {
    setSelectedVotingId((current) => {
      if (current && selectedVotaciones.some((item) => String(item.votacion?.id) === String(current))) {
        return current;
      }

      return selectedVotaciones[0]?.votacion?.id || "";
    });
  }, [selectedProjectId, selectedVotaciones]);

  const selectedVotingItem = useMemo(
    () =>
      selectedVotaciones.find((item) => String(item.votacion?.id) === String(selectedVotingId)) ||
      selectedVotaciones[0] ||
      null,
    [selectedVotaciones, selectedVotingId]
  );

  const hasEvent = Boolean(selectedItem?.evento);
  const selectedVotingIsMulti = isMulticriterio(selectedVotingItem?.votacion);
  const rankingEntry = selectedVotingItem?.rankingEntry || null;
  const rankingList = selectedVotingItem?.ranking || [];

  const radarData = useMemo(() => {
    if (!selectedVotingIsMulti || !rankingEntry?.criterios?.length) return [];

    return rankingEntry.criterios.slice(0, 8).map((criterio) => ({
      label: criterio.criterioNombre || criterio.nombre || "Criterio",
      value: Math.min(Math.max(Number(criterio.promedio || 0), 0), 5),
    }));
  }, [rankingEntry, selectedVotingIsMulti]);

  const posicion = rankingEntry?.posicion || "-";
  const posicionNumero = Number(rankingEntry?.posicion || 0);
  const puntuacionFinal = formatScore(rankingEntry?.puntuacionTotal);
  const eventId = selectedItem?.evento?.id || getProjectEventId(selectedProject);
  const votingId = selectedVotingItem?.votacion?.id;

  async function handleSubmitProject(form) {
    try {
      setError("");
      setSuccess("");

      const payload = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim(),
        tipoCategoria: form.tipoCategoria,
        equipoId: form.equipoId,
        eventoId: editingProject ? null : form.eventoId || null,
        votacionIds: editingProject ? [] : form.votacionIds,
      };

      if (editingProject) {
        await updateProyectoGestionado(editingProject.id, payload);
        setSuccess("Proyecto actualizado correctamente.");
      } else {
        const created = await createProyectoGestionado(payload);

        for (const formVotingId of form.votacionIds || []) {
          await asignarProyectoAVotacion(formVotingId, created.id).catch(() => null);
        }

        setSuccess("Proyecto creado correctamente.");
      }

      setProjectModalOpen(false);
      setEditingProject(null);
      await load({ silent: true });
    } catch (err) {
      setError(err.message || "No se pudo guardar el proyecto.");
    }
  }

  if (loading) {
    return (
      <main className="participant-dashboard-page">
        <section className="my-project-loading-card">
          <div />
          <strong>Cargando Mi Proyecto...</strong>
          <span>Preparando tus datos de proyecto y ranking.</span>
        </section>
      </main>
    );
  }

  return (
    <main className="participant-dashboard-page">
      <header className="my-project-topbar">
        <div>
          <h1>Mi Proyecto</h1>
          <p>Gestiona tu proyecto, material, rendimiento y feedback desde un solo sitio.</p>
        </div>

        <div className="my-project-actions">
          {refreshing ? <span className="my-project-refresh-pill">Actualizando...</span> : null}

          {proyectosDashboard.length > 1 ? (
            <select
              className="my-project-selector"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
            >
              {proyectosDashboard.map((item) => (
                <option key={item.proyecto.id} value={item.proyecto.id}>
                  {item.proyecto.nombre}
                </option>
              ))}
            </select>
          ) : null}

          <button
            type="button"
            className="secondary-btn"
            onClick={() => {
              setEditingProject(selectedProject);
              setProjectModalOpen(true);
            }}
            disabled={!selectedProject}
          >
            <Edit3 size={16} />
            Editar Proyecto
          </button>

          <button
            type="button"
            className="primary-btn"
            onClick={() => {
              setEditingProject(null);
              setProjectModalOpen(true);
            }}
          >
            <Plus size={16} />
            Crear Proyecto
          </button>
        </div>
      </header>

      {error ? <div className="feedback-card error-box">{error}</div> : null}
      {success ? <div className="feedback-card success-box">{success}</div> : null}

      {!selectedItem ? (
        <section className="my-project-empty-card">
          <FolderKanban size={34} />
          <h2>No tienes proyectos todavia</h2>
          <p>Puedes crear uno usando uno de tus equipos.</p>
          <button
            type="button"
            className="primary-btn"
            onClick={() => {
              setEditingProject(null);
              setProjectModalOpen(true);
            }}
          >
            <Plus size={16} />
            Crear Proyecto
          </button>
        </section>
      ) : (
        <>
          <section className="my-project-hero-row">
            <div className="my-project-hero">
              <div className="my-project-hero-main">
                <h2>{selectedProject.nombre}</h2>

                <div className="my-project-hero-meta">
                  <span>
                    <Users size={15} />
                    {selectedItem.equipo?.nombre || "Sin equipo"}
                  </span>
                  <span>
                    <CalendarDays size={15} />
                    {selectedItem.evento?.nombre || "Sin evento"}
                  </span>
                  <span>
                    <Target size={15} />
                    {selectedProject.tipoCategoria || "Sin categoria"}
                  </span>
                </div>

                <div className="my-project-hero-actions">
                  <button
                    type="button"
                    className="my-project-hero-button light"
                    disabled={!eventId}
                    onClick={() => navigate(`/eventos/${eventId}/proyectos/${selectedProject.id}`)}
                  >
                    <Eye size={16} />
                    Ver detalle
                  </button>
                  <button
                    type="button"
                    className="my-project-hero-button"
                    disabled={!eventId || !votingId}
                    onClick={() => navigate(`/eventos/${eventId}/votaciones/${votingId}/resultados`)}
                  >
                    <BarChart3 size={16} />
                    Ver resultados
                  </button>
                </div>
              </div>
            </div>

            <aside className={`my-project-rank-card rank-${posicionNumero > 0 && posicionNumero <= 3 ? posicionNumero : "default"}`}>
              {hasEvent ? (
                <>
                  <Trophy size={34} />
                  <span>Posicion</span>
                  <strong>{posicion}</strong>
                  <small>
                    {rankingList.length > 0
                      ? `entre ${rankingList.length} proyectos`
                      : "sin ranking todavia"}
                  </small>
                </>
              ) : (
                <>
                  <FolderKanban size={34} />
                  <span>Sin evento</span>
                  <strong>-</strong>
                  <small>Este proyecto aun no compite en ningun evento.</small>
                </>
              )}
            </aside>
          </section>

          <section className="my-project-description-card">
            <span>Descripcion del proyecto</span>
            <p>{selectedProject.descripcion || "Sin descripcion disponible."}</p>
          </section>

          <section className="participant-stats-grid">
            <article className="participant-stat-card">
              <div className="participant-stat-icon indigo">
                <Vote size={18} />
              </div>
              <div>
                <p>Votos</p>
                <strong>{selectedItem.totalVotos || 0}</strong>
              </div>
            </article>

            <article className="participant-stat-card">
              <div className="participant-stat-icon violet">
                <Star size={18} />
              </div>
              <div>
                <p>Puntuacion final</p>
                <strong>{hasEvent ? puntuacionFinal : "-"}</strong>
              </div>
            </article>

            <article className="participant-stat-card">
              <div className="participant-stat-icon blue">
                <BarChart3 size={18} />
              </div>
              <div>
                <p>Evaluaciones</p>
                <strong>{selectedItem.totalEvaluaciones || 0}</strong>
              </div>
            </article>
          </section>

          <section className="my-project-main-grid">
            <article className="my-project-card">
              <div className="participant-card-header my-project-evaluation-header">
                <div className="participant-card-title">
                  <BarChart3 size={18} />
                  <h3>Perfil de evaluacion</h3>
                </div>

                {selectedVotaciones.length > 1 ? (
                  <select
                    className="my-project-small-select"
                    value={selectedVotingId}
                    onChange={(e) => setSelectedVotingId(e.target.value)}
                  >
                    {selectedVotaciones.map((item) => (
                      <option key={item.votacionProyectoId || item.votacion?.id} value={item.votacion?.id}>
                        {votingLabel(item.votacion)}
                      </option>
                    ))}
                  </select>
                ) : null}
              </div>

              {hasEvent && selectedVotingIsMulti && radarData.length > 0 ? (
                <MiniRadarChart data={radarData} />
              ) : (
                <div className="my-project-no-event-panel">
                  <FolderKanban size={28} />
                  <strong>
                    {!hasEvent
                      ? "Proyecto sin evento"
                      : !selectedVotingIsMulti
                        ? "Votacion sin criterios"
                        : "Sin evaluaciones todavia"}
                  </strong>
                  <p>
                    {!hasEvent
                      ? "Cuando lo metas en un evento aparecera su evaluacion."
                      : !selectedVotingIsMulti
                        ? "Esta votacion no es multicriterio, por eso no tiene grafico radar."
                        : "Cuando haya puntuaciones por criterio se mostrara el perfil de evaluacion."}
                  </p>
                </div>
              )}
            </article>

            <article className="my-project-card">
              <div className="participant-card-header">
                <div className="participant-card-title">
                  <Trophy size={18} />
                  <h3>Contexto del ranking</h3>
                </div>
              </div>

              {hasEvent ? (
                <div className="my-project-ranking-context">
                  <div className="my-project-ranking-row wide">
                    <span>Votacion analizada</span>
                    <strong>{votingLabel(selectedVotingItem?.votacion)}</strong>
                  </div>

                  <div className="my-project-ranking-row">
                    <span>Posicion actual</span>
                    <strong>{posicion}</strong>
                  </div>

                  <div className="my-project-score-highlight">
                    <span>Puntuacion final</span>
                    <strong>{puntuacionFinal}</strong>
                  </div>

                  <div className="my-project-ranking-row">
                    <span>Proyectos en ranking</span>
                    <strong>{rankingList.length || "-"}</strong>
                  </div>
                </div>
              ) : (
                <div className="my-project-no-event-panel compact">
                  <strong>Sin ranking disponible</strong>
                  <p>El proyecto todavia no participa en ningun evento.</p>
                </div>
              )}
            </article>

          </section> 
          <article className="my-project-card">
            <div className="participant-card-header">
              <div className="participant-card-title">
                <Image size={18} />
                <h3>Galeria del proyecto</h3>
              </div>
            </div>
            <div className="my-project-material-body">
              <MaterialGallery proyectoId={selectedProject?.id} />
            </div>
          </article>

          <article className="my-project-card">
            <div className="participant-card-header">
              <div className="participant-card-title">
                <Plus size={18} />
                <h3>Subir material</h3>
              </div>
            </div>
            <div className="my-project-material-body">
              <ProjectMaterials proyectoId={selectedProject?.id} />
            </div>
          </article>

          <section className="participant-comments-card">
            <div className="participant-card-header">
              <div className="participant-card-title">
                <MessageSquare size={18} />
                <h3>Feedback recibido</h3>
              </div>

              <span className="participant-comments-badge">
                {comentarios.length || 0}
              </span>
            </div>

            {comentarios.length === 0 ? (
              <div className="feedback-card">Todavia no hay feedback sobre este proyecto.</div>
            ) : (
              <div className="participant-comments-list">
                {comentarios.map((comentario) => (
                  <article key={comentario.id} className="participant-comment-item">
                    <div className="participant-comment-top">
                      <div className="participant-comment-avatar">
                        {getInitials(comentario.usuario?.nombre || "A")}
                      </div>
                      <div>
                        <p className="participant-comment-author">
                          {comentario.usuario?.nombre || "Anonimo"}
                        </p>
                        <p className="participant-comment-date">
                          {comentario.createdAt
                            ? new Date(comentario.createdAt).toLocaleString("es-ES")
                            : ""}
                        </p>
                      </div>
                    </div>

                    <p className="participant-comment-text">{comentario.texto}</p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <ProjectModal
        open={projectModalOpen}
        editingProject={editingProject}
        equipos={dashboard?.equipos || []}
        eventos={dashboard?.eventos || []}
        proyectos={dashboard?.proyectos || []}
        onClose={() => {
          setProjectModalOpen(false);
          setEditingProject(null);
        }}
        onSubmit={handleSubmitProject}
      />
    </main>
  );
}

export default MyProjectDashboardScreen;
