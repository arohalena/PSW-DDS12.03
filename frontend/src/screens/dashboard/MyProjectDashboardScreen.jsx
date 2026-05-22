import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  Edit3,
  Eye,
  FolderKanban,
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
import "../../styles/my-project-dashboard.css";

import { ProjectMaterials } from "../../common/ProjectMaterials";

import { MaterialGallery } from "../../common/MaterialGallery";

const EMPTY_FORM = {
  nombre: "",
  descripcion: "",
  tipoCategoria: "IA",
  equipoId: "",
  eventoId: "",
  votacionIds: [],
};

function votingLabel(votacion) {
  return votacion?.nombre || `${votacion?.tipo || "Votación"} · ${votacion?.modalidad || ""}`;
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

function MiniRadarChart({ data }) {
  const size = 260;
  const center = size / 2;
  const radius = 82;
  const safeData = data.length ? data : [];

  if (safeData.length === 0) return null;

  function point(index, value = 5) {
    const angle = (Math.PI * 2 * index) / safeData.length - Math.PI / 2;
    const currentRadius = radius * (Number(value || 0) / 5);

    return {
      x: center + currentRadius * Math.cos(angle),
      y: center + currentRadius * Math.sin(angle),
    };
  }

  const polygonPoints = safeData
    .map((item, index) => {
      const point = point(index, item.value);
      return `${point.x},${point.y}`;
    })
    .join(" ");

  return (
    <div className="my-project-radar">
      <svg viewBox={`0 0 ${size} ${size}`}>
        {[1, 2, 3, 4, 5].map((level) => {
          const gridPoints = safeData
            .map((_, index) => {
              const point = point(index, level);
              return `${point.x},${point.y}`;
            })
            .join(" ");

          return <polygon key={level} points={gridPoints} className="radar-grid-shape" />;
        })}

        {safeData.map((item, index) => {
          const end = point(index, 5);
          const label = point(index, 6.25);

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
          const point = point(index, item.value);
          return <circle key={item.label} cx={point.x} cy={point.y} r="4" className="radar-point" />;
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
    if (!open || !form.eventoId || editing) {
      setVotaciones([]);
      if (!editing) setForm((prev) => ({ ...prev, votacionIds: [] }));
      return;
    }

    getVotacionesByEvento(form.eventoId)
      .then((data) => setVotaciones(data || []))
      .catch(() => setVotaciones([]));
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
      setError("Si eliges un evento, debes seleccionar al menos una votación.");
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

          <button type="button" onClick={onClose}>
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
            <span>Descripción</span>
            <textarea
              rows="4"
              value={form.descripcion}
              onChange={(e) => setForm((prev) => ({ ...prev, descripcion: e.target.value }))}
              placeholder="Describe tu proyecto..."
            />
          </label>

          <div className="my-project-form-grid">
            <label className="my-project-field">
              <span>Categoría</span>
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
              <span className="my-project-mini-label">Votaciones donde participará</span>

              {votaciones.length === 0 ? (
                <div className="feedback-card warning-box">Este evento todavía no tiene votaciones.</div>
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
                          {votacion.tipo} · {votacion.modalidad}
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
  const usuario = useMemo(() => getUsuarioLogueado(), []);

  const [dashboard, setDashboard] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedVotingId, setSelectedVotingId] = useState("");
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError("");

      if (!usuario?.id) {
        throw new Error("No hay usuario autenticado.");
      }

      const data = await getMiProyectoDashboard(usuario.id);
      setDashboard(data);

      setSelectedProjectId((current) => {
        if (current && data.proyectosDashboard?.some((item) => String(item.proyecto.id) === String(current))) {
          return current;
        }

        return data.proyectosDashboard?.[0]?.proyecto?.id || "";
      });
    } catch (err) {
      setError(err.message || "No se pudo cargar Mi Proyecto.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [usuario?.id]);

  const proyectosDashboard = dashboard?.proyectosDashboard || [];

  const selectedItem = useMemo(
    () =>
      proyectosDashboard.find((item) => String(item.proyecto.id) === String(selectedProjectId)) ||
      proyectosDashboard[0] ||
      null,
    [proyectosDashboard, selectedProjectId]
  );

  const selectedProject = selectedItem?.proyecto || null;
  const selectedVotaciones = selectedItem?.votaciones || [];
  const comentarios = useMemo(() => {
  if (selectedItem?.comentarios) {
    return selectedItem.comentarios;
  }

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
  }, [selectedProjectId, selectedVotaciones.length]);

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

    return rankingEntry.criterios.map((criterio) => ({
      label: criterio.criterioNombre || criterio.nombre || "Criterio",
      value: Number(criterio.promedio || 0),
    }));
  }, [rankingEntry, selectedVotingIsMulti]);

  const posicion = rankingEntry?.posicion || "—";
  const puntuacionFinal =
    rankingEntry?.puntuacionTotal !== undefined && rankingEntry?.puntuacionTotal !== null
      ? Number(rankingEntry.puntuacionTotal).toFixed(2)
      : "—";

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

        for (const votacionId of form.votacionIds || []) {
          await asignarProyectoAVotacion(votacionId, created.id).catch(() => null);
        }

        setSuccess("Proyecto creado correctamente.");
      }

      setProjectModalOpen(false);
      setEditingProject(null);
      await load();
    } catch (err) {
      setError(err.message || "No se pudo guardar el proyecto.");
    }
  }

  if (loading) {
    return (
      <main className="participant-dashboard-page">
        <div className="feedback-card">Cargando Mi Proyecto...</div>
      </main>
    );
  }

  return (
    <main className="participant-dashboard-page">
      <header className="my-project-topbar">
        <div>
          <h1>Mi Proyecto</h1>
          <p>Vista personal del competidor, rendimiento, feedback y contexto de ranking.</p>
        </div>

        <div className="my-project-actions">
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
          <h2>No tienes proyectos todavía</h2>
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
          <section className="my-project-hero">
            <div>
              <span className="my-project-kicker">Proyecto seleccionado</span>
              <h2>{selectedProject.nombre}</h2>
              <p>{selectedProject.descripcion || "Sin descripción disponible."}</p>

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
                  {selectedProject.tipoCategoria || "Sin categoría"}
                </span>
              </div>
            </div>

            <div className="my-project-rank-card">
              {hasEvent ? (
                <>
                  <Trophy size={38} />
                  <span>Posición</span>
                  <strong>{posicion}</strong>
                  <small>
                    {rankingList.length > 0
                      ? `entre ${rankingList.length} proyectos`
                      : "sin ranking todavía"}
                  </small>
                </>
              ) : (
                <>
                  <FolderKanban size={38} />
                  <span>Sin evento</span>
                  <strong>—</strong>
                  <small>Este proyecto aún no compite en ningún evento.</small>
                </>
              )}
            </div>
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
                <p>Puntuación final</p>
                <strong>{hasEvent ? puntuacionFinal : "—"}</strong>
              </div>
            </article>

            <article className="participant-stat-card">
              <div className="participant-stat-icon slate">
                <Eye size={18} />
              </div>
              <div>
                <p>Vistas</p>
                <strong>{selectedItem.vistas || 0}</strong>
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
              <div className="participant-card-header">
                <div className="participant-card-title">
                  <BarChart3 size={18} />
                  <h3>Perfil de evaluación</h3>
                </div>

                {selectedVotaciones.length > 1 ? (
                  <select
                    className="my-project-small-select"
                    value={selectedVotingId}
                    onChange={(e) => setSelectedVotingId(e.target.value)}
                  >
                    {selectedVotaciones.map((item) => (
                      <option key={item.votacionProyectoId} value={item.votacion?.id}>
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
                        ? "Votación sin criterios"
                        : "Sin evaluaciones todavía"}
                  </strong>
                  <p>
                    {!hasEvent
                      ? "Cuando lo metas en un evento aparecerá su evaluación."
                      : !selectedVotingIsMulti
                        ? "Esta votación no es multicriterio, por eso no tiene gráfico radar."
                        : "Cuando haya puntuaciones por criterio se mostrará el perfil de evaluación."}
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
                  <div>
                    <span>Votación analizada</span>
                    <strong>{votingLabel(selectedVotingItem?.votacion)}</strong>
                  </div>

                  <div>
                    <span>Posición actual</span>
                    <strong>{posicion}</strong>
                  </div>

                  <div>
                    <span>Puntuación final</span>
                    <strong>{puntuacionFinal}</strong>
                  </div>

                  <div>
                    <span>Proyectos en ranking</span>
                    <strong>{rankingList.length || "—"}</strong>
                  </div>
                </div>
              ) : (
                <div className="my-project-no-event-panel compact">
                  <strong>Sin ranking disponible</strong>
                  <p>
                    {!hasEvent
                      ? "El proyecto todavía no participa en ningún evento."
                      : "El ranking solo se muestra para votaciones multicriterio."}
                  </p>
                </div>
              )}
            </article>
          </section>
            <section className="mock-card mock-gallery-card">
              <div className="mock-section-heading">
                <div>
                  <h2>Galería del proyecto</h2>
                  <p>Capturas, demo y material visual del proyecto.</p>
                </div>
              </div>

              <MaterialGallery proyectoId={selectedProject?.id} />
            </section>

            <section className="mock-card mock-upload-card">
              <div className="mock-section-heading">
                <div>
                  <h2>Subir material</h2>
                  <p>Adjunta nuevos archivos para este proyecto.</p>
                </div>
              </div>

              <ProjectMaterials proyectoId={selectedProject?.id} />
            </section>

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
              <div className="feedback-card">Todavía no hay feedback sobre este proyecto.</div>
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
                          {comentario.usuario?.nombre || "Anónimo"}
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