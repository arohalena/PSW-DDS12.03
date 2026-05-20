import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle,
  Edit3,
  FolderKanban,
  Link2,
  Plus,
  Search,
  Trash2,
  Unlink,
  Users,
  Vote,
  X,
} from "lucide-react";
import {
  createProyectoGestionado,
  deleteProyecto,
  getVistaGestionProyectos,
  meterProyectoEnEvento,
  quitarProyectoDeEvento,
  updateProyectoGestionado,
} from "../../services/proyectoService";
import { getEquipos } from "../../services/equipoService";
import { getEventos } from "../../services/eventoService";
import {
  asignarProyectoAVotacion,
  deleteVotacionProyecto,
  getVotacionProyectosByVotacion,
  getVotacionesByEvento,
} from "../../services/votacionService";
import { esOrganizador } from "../../services/sessionService";
import CommentProjectModal from "./CommentProjectModal";

import "../../styles/projects.css";

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
  return proyecto.evento?.id || proyecto.eventoId || "";
}

function getProjectTeamId(proyecto) {
  return proyecto.equipo?.id || proyecto.equipoId || "";
}

function ProjectFormModal({
  open,
  proyecto,
  equipos,
  eventos,
  allProjects,
  onClose,
  onSubmit,
}) {
  const editing = Boolean(proyecto);
  const [form, setForm] = useState(EMPTY_FORM);
  const [votaciones, setVotaciones] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    setForm({
      nombre: proyecto?.nombre || "",
      descripcion: proyecto?.descripcion || "",
      tipoCategoria: proyecto?.tipoCategoria || "IA",
      equipoId: getProjectTeamId(proyecto || {}) || "",
      eventoId: getProjectEventId(proyecto || {}) || "",
      votacionIds: [],
    });

    setError("");
  }, [open, proyecto]);

  useEffect(() => {
    if (!open || !form.eventoId) {
      setVotaciones([]);
      setForm((prev) => ({ ...prev, votacionIds: [] }));
      return;
    }

    getVotacionesByEvento(form.eventoId)
      .then((data) => setVotaciones(data || []))
      .catch(() => setVotaciones([]));
  }, [open, form.eventoId]);

  if (!open) return null;

  function equipoTieneOtroProyectoEnEvento() {
    if (!form.equipoId || !form.eventoId) return false;

    return allProjects.some((item) => {
      const sameTeam = String(getProjectTeamId(item)) === String(form.equipoId);
      const sameEvent = String(getProjectEventId(item)) === String(form.eventoId);
      const differentProject = !proyecto || String(item.id) !== String(proyecto.id);

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
      setError("Debes asignar un equipo al proyecto.");
      return;
    }

    if (form.eventoId && form.votacionIds.length === 0 && !editing) {
      setError("Si eliges un evento al crear el proyecto, debes elegir al menos una votación.");
      return;
    }

    if (equipoTieneOtroProyectoEnEvento()) {
      setError("Este equipo ya tiene otro proyecto en ese evento.");
      return;
    }

    await onSubmit(form);
  }

  return (
    <div className="project-modal-backdrop">
      <form className="project-pro-modal" onSubmit={submit}>
        <div className="project-pro-modal-header">
          <div>
            <h2>{editing ? "Editar proyecto" : "Crear proyecto"}</h2>
            <p>
              El equipo es obligatorio. El evento es opcional, pero si lo eliges al crear,
              debes asignar el proyecto a una o varias votaciones.
            </p>
          </div>

          <button type="button" className="project-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="project-pro-modal-body">
          <label className="project-field">
            <span>Nombre</span>
            <input
              value={form.nombre}
              onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
              placeholder="Ej. Votify AI"
            />
          </label>

          <label className="project-field">
            <span>Descripción</span>
            <textarea
              rows="4"
              value={form.descripcion}
              onChange={(e) => setForm((prev) => ({ ...prev, descripcion: e.target.value }))}
              placeholder="Describe el proyecto..."
            />
          </label>

          <div className="project-modal-grid">
            <label className="project-field">
              <span>Categoría</span>
              <select
                value={form.tipoCategoria}
                onChange={(e) => setForm((prev) => ({ ...prev, tipoCategoria: e.target.value }))}
              >
                <option value="IA">IA</option>
                <option value="SOSTENIBILIDAD">Sostenibilidad</option>
              </select>
            </label>

            <label className="project-field">
              <span>Equipo *</span>
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
              <div className="project-readonly-field">
                <span>Evento actual</span>
                <strong>{proyecto?.evento?.nombre || "Sin evento asignado"}</strong>
                <small>Para cambiar el evento usa el botón “Participación”.</small>
              </div>
            ) : (
            <label className="project-field">
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
              disabled={editing}
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
          {form.eventoId && !editing ? (
            <div>
              <span className="project-mini-label">Votaciones donde participa *</span>

              {votaciones.length === 0 ? (
                <div className="project-feedback warning-box">
                  Este evento no tiene votaciones. Crea una votación antes de meter el proyecto.
                </div>
              ) : (
                <div className="project-voting-choice-grid">
                  {votaciones.map((votacion) => {
                    const selected = form.votacionIds.includes(votacion.id);

                    return (
                      <button
                        type="button"
                        key={votacion.id}
                        className={`project-voting-choice ${selected ? "selected" : ""}`}
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

          {error ? <div className="project-feedback error-box">{error}</div> : null}
        </div>

        <div className="project-pro-modal-actions">
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

function ParticipationModal({
  open,
  proyecto,
  eventos,
  allProjects,
  currentRelations,
  onClose,
  onEnterEvent,
  onLeaveEvent,
  onAddVoting,
  onRemoveVoting,
}) {
  const [eventoId, setEventoId] = useState("");
  const [votaciones, setVotaciones] = useState([]);
  const [selectedVotingIds, setSelectedVotingIds] = useState([]);
  const [error, setError] = useState("");

  const currentEventId = getProjectEventId(proyecto || {});
  const currentTeamId = getProjectTeamId(proyecto || {});
  const hasEvent = Boolean(currentEventId);

  useEffect(() => {
    if (!open || !proyecto) return;

    setEventoId(currentEventId || eventos[0]?.id || "");
    setSelectedVotingIds([]);
    setError("");
  }, [open, proyecto, currentEventId, eventos]);

  useEffect(() => {
    if (!open || !eventoId) {
      setVotaciones([]);
      return;
    }

    getVotacionesByEvento(eventoId)
      .then((data) => setVotaciones(data || []))
      .catch(() => setVotaciones([]));
  }, [open, eventoId]);

  if (!open || !proyecto) return null;

  const relationVotingIds = currentRelations.map((rel) => rel.votacion?.id).filter(Boolean);

  function equipoTieneOtroProyectoEnEvento() {
    if (!currentTeamId || !eventoId) return false;

    return allProjects.some((item) => {
      const sameTeam = String(getProjectTeamId(item)) === String(currentTeamId);
      const sameEvent = String(getProjectEventId(item)) === String(eventoId);
      const differentProject = String(item.id) !== String(proyecto.id);

      return sameTeam && sameEvent && differentProject;
    });
  }

  async function submitEnterEvent(event) {
    event.preventDefault();

    if (!eventoId) {
      setError("Debes elegir un evento.");
      return;
    }

    if (selectedVotingIds.length === 0) {
      setError("Debes elegir al menos una votación.");
      return;
    }

    if (equipoTieneOtroProyectoEnEvento()) {
      setError("Este equipo ya tiene otro proyecto en ese evento.");
      return;
    }

    await onEnterEvent(proyecto, eventoId, selectedVotingIds);
  }

  return (
    <div className="project-modal-backdrop">
      <div className="project-pro-modal">
        <div className="project-pro-modal-header">
          <div>
            <h2>Participación</h2>
            <p>
              Gestiona el evento y las votaciones de <strong>{proyecto.nombre}</strong>.
            </p>
          </div>

          <button type="button" className="project-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="project-pro-modal-body">
          <div className="project-participation-summary">
            <div>
              <span>Equipo</span>
              <strong>{proyecto.equipo?.nombre || "Sin equipo"}</strong>
            </div>

            <div>
              <span>Evento actual</span>
              <strong>{proyecto.evento?.nombre || "Sin evento"}</strong>
            </div>

            <div>
              <span>Votaciones</span>
              <strong>{currentRelations.length}</strong>
            </div>
          </div>

          {hasEvent ? (
            <>
              <div className="project-section-title">
                <h3>Votaciones actuales</h3>
                <p>Este proyecto puede estar en varias votaciones del mismo evento.</p>
              </div>

              {currentRelations.length === 0 ? (
                <div className="project-feedback">No está en ninguna votación.</div>
              ) : (
                <div className="project-voting-list">
                  {currentRelations.map((relacion) => (
                    <div className="project-voting-row" key={relacion.id}>
                      <div>
                        <strong>{votingLabel(relacion.votacion)}</strong>
                        <span>
                          {relacion.votacion?.tipo} · {relacion.votacion?.modalidad}
                        </span>
                      </div>

                      <button
                        type="button"
                        className="project-danger-btn"
                        onClick={() => onRemoveVoting(relacion.id)}
                      >
                        <Unlink size={15} />
                        Quitar
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="project-section-title">
                <h3>Añadir a más votaciones</h3>
              </div>

              <div className="project-voting-choice-grid">
                {votaciones
                  .filter((votacion) => !relationVotingIds.includes(votacion.id))
                  .map((votacion) => (
                    <button
                      type="button"
                      key={votacion.id}
                      className="project-voting-choice"
                      onClick={() => onAddVoting(proyecto, votacion.id)}
                    >
                      <strong>{votingLabel(votacion)}</strong>
                      <span>
                        {votacion.tipo} · {votacion.modalidad}
                      </span>
                    </button>
                  ))}
              </div>

              <div className="project-danger-zone">
                <div>
                  <strong>Quitar del evento</strong>
                  <span>También se quitará de todas sus votaciones del evento.</span>
                </div>

                <button type="button" className="project-danger-btn" onClick={() => onLeaveEvent(proyecto)}>
                  <Trash2 size={15} />
                  Quitar del evento
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={submitEnterEvent} className="project-enter-event-form">
              <div className="project-section-title">
                <h3>Meter en evento</h3>
                <p>Al meterlo en un evento debes elegir al menos una votación.</p>
              </div>

              <label className="project-field">
                <span>Evento</span>
                <select value={eventoId} onChange={(e) => setEventoId(e.target.value)}>
                  <option value="">Selecciona evento</option>
                  {eventos.map((evento) => (
                    <option key={evento.id} value={evento.id}>
                      {evento.nombre}
                    </option>
                  ))}
                </select>
              </label>

              <div>
                <span className="project-mini-label">Votaciones</span>

                <div className="project-voting-choice-grid">
                  {votaciones.map((votacion) => {
                    const selected = selectedVotingIds.includes(votacion.id);

                    return (
                      <button
                        type="button"
                        key={votacion.id}
                        className={`project-voting-choice ${selected ? "selected" : ""}`}
                        onClick={() =>
                          setSelectedVotingIds((prev) =>
                            selected
                              ? prev.filter((id) => id !== votacion.id)
                              : [...prev, votacion.id]
                          )
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
              </div>

              {error ? <div className="project-feedback error-box">{error}</div> : null}

              <button type="submit" className="primary-btn">
                <Link2 size={16} />
                Meter en evento
              </button>
            </form>
          )}
        </div>

        <div className="project-pro-modal-actions">
          <button type="button" className="secondary-btn" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ open, title, message, warning, onCancel, onConfirm }) {
  if (!open) return null;

  return (
    <div className="project-modal-backdrop">
      <div className="project-confirm-modal">
        <div className="project-confirm-icon">
          <Trash2 size={28} />
        </div>

        <h2>{title}</h2>
        <p>{message}</p>

        {warning ? <div className="project-confirm-warning">{warning}</div> : null}

        <div className="project-pro-modal-actions">
          <button type="button" className="secondary-btn" onClick={onCancel}>
            Cancelar
          </button>

          <button type="button" className="project-danger-btn" onClick={onConfirm}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

function ProjectsScreen() {
  const [proyectos, setProyectos] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [relationsByProject, setRelationsByProject] = useState({});

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [participationProject, setParticipationProject] = useState(null);
  const [confirmLeaveProject, setConfirmLeaveProject] = useState(null);
  const [confirmDeleteProject, setConfirmDeleteProject] = useState(null);

  const puedeGestionar = esOrganizador();

  async function load() {
    try {
      setLoading(true);
      setError("");

      const [vistaProyectos, equiposData, eventosData] = await Promise.all([
        getVistaGestionProyectos().catch(() => []),
        getEquipos().catch(() => []),
        getEventos().catch(() => []),
      ]);

      const proyectosNormalizados = (vistaProyectos || []).map((p) => ({
        id: p.id,
        nombre: p.nombre,
        descripcion: p.descripcion,
        tipoCategoria: p.tipoCategoria,
        equipo: p.equipo,   
        evento: p.evento,   
      }));

      const map = {};
      (vistaProyectos || []).forEach((p) => {
        map[p.id] = (p.votaciones || []).map((v) => ({
          id: v.relacionId,
          votacion: {
            id: v.votacionId,
            nombre: v.nombre,
            tipo: v.tipo,
            modalidad: v.modalidad,
          },
        }));
      });

      setProyectos(proyectosNormalizados);
      setEquipos(equiposData || []);
      setEventos(eventosData || []);
      setRelationsByProject(map);
    } catch (err) {
      setError(err.message || "No se pudieron cargar los proyectos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const enrichedProjects = useMemo(() => {
    return proyectos.map((proyecto) => {
      const equipo =
        proyecto.equipo ||
        equipos.find((equipoItem) => String(equipoItem.proyecto?.id) === String(proyecto.id));

      return {
        ...proyecto,
        equipo,
        relations: relationsByProject[proyecto.id] || [],
      };
    });
  }, [proyectos, equipos, relationsByProject]);

  const filteredProjects = useMemo(() => {
    return enrichedProjects.filter((proyecto) => {
      const text = [
        proyecto.nombre,
        proyecto.descripcion,
        proyecto.tipoCategoria,
        proyecto.equipo?.nombre,
        proyecto.evento?.nombre,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = text.includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "TODOS" ||
        (statusFilter === "CON_EVENTO" && proyecto.evento) ||
        (statusFilter === "SIN_EVENTO" && !proyecto.evento) ||
        (statusFilter === "CON_VOTACIONES" && proyecto.relations.length > 0) ||
        (statusFilter === "SIN_VOTACIONES" && proyecto.relations.length === 0);

      return matchesSearch && matchesStatus;
    });
  }, [enrichedProjects, search, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: enrichedProjects.length,
      withEvent: enrichedProjects.filter((p) => p.evento).length,
      withoutEvent: enrichedProjects.filter((p) => !p.evento).length,
      withVoting: enrichedProjects.filter((p) => p.relations.length > 0).length,
    };
  }, [enrichedProjects]);

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
        await createProyectoGestionado(payload);
        setSuccess("Proyecto creado correctamente.");
      }

      setProjectModalOpen(false);
      setEditingProject(null);
      await load();
    } catch (err) {
      setError(err.message || "No se pudo guardar el proyecto.");
    }
  }

  async function handleEnterEvent(project, eventId, votingIds) {
    try {
      setError("");
      setSuccess("");

      await meterProyectoEnEvento(project.id, eventId);

      for (const votingId of votingIds) {
        await asignarProyectoAVotacion(votingId, project.id).catch(() => null);
      }

      setParticipationProject(null);
      setSuccess("Proyecto añadido al evento y a las votaciones.");
      await load();
    } catch (err) {
      setError(err.message || "No se pudo meter el proyecto en el evento.");
    }
  }

  async function handleLeaveEvent(project) {
    try {
      setError("");
      setSuccess("");

      await quitarProyectoDeEvento(project.id);

      setConfirmLeaveProject(null);
      setParticipationProject(null);
      setSuccess("Proyecto quitado del evento. El proyecto se ha conservado.");
      await load();
    } catch (err) {
      setError(err.message || "No se pudo quitar el proyecto del evento.");
    }
  }

  async function handleDeleteProject(project) {
    try {
      setError("");
      setSuccess("");

      await deleteProyecto(project.id);

      setConfirmDeleteProject(null);
      setParticipationProject(null);
      setSuccess("Proyecto eliminado correctamente.");

      await load();
    } catch (err) {
      setError(err.message || "No se pudo eliminar el proyecto.");
    }
  }

  async function handleAddVoting(project, votingId) {
    try {
      setError("");
      setSuccess("");

      await asignarProyectoAVotacion(votingId, project.id);
      setSuccess("Proyecto añadido a la votación.");
      await load();
    } catch (err) {
      setError(err.message || "No se pudo añadir a la votación.");
    }
  }

  async function handleRemoveVoting(relationId) {
    try {
      setError("");
      setSuccess("");

      await deleteVotacionProyecto(relationId);
      setSuccess("Proyecto quitado de la votación.");
      await load();
    } catch (err) {
      setError(err.message || "No se pudo quitar de la votación.");
    }
  }

  return (
    <main className="projects-page projects-pro-page">
      <header className="projects-header">
        <div>
          <h1>Gestión de Proyectos</h1>
          <p>
            Crea proyectos con equipo obligatorio, mételos en eventos y asígnalos a varias votaciones.
          </p>
        </div>

        {puedeGestionar ? (
          <button
            type="button"
            className="primary-btn"
            onClick={() => {
              setEditingProject(null);
              setProjectModalOpen(true);
            }}
          >
            <Plus size={17} />
            Crear proyecto
          </button>
        ) : null}
      </header>

      <section className="projects-stats-grid">
        <div className="project-stat-card">
          <FolderKanban size={22} />
          <strong>{stats.total}</strong>
          <span>Total</span>
        </div>

        <div className="project-stat-card">
          <CheckCircle size={22} />
          <strong>{stats.withEvent}</strong>
          <span>En evento</span>
        </div>

        <div className="project-stat-card">
          <Vote size={22} />
          <strong>{stats.withVoting}</strong>
          <span>Con votaciones</span>
        </div>

        <div className="project-stat-card">
          <Users size={22} />
          <strong>{stats.withoutEvent}</strong>
          <span>Sin evento</span>
        </div>
      </section>

      {error ? <div className="project-feedback error-box">{error}</div> : null}
      {success ? <div className="project-feedback success-box">{success}</div> : null}

      <section className="projects-card">
        <div className="projects-toolbar">
          <div className="projects-search">
            <Search size={17} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar proyecto, equipo, evento..."
            />
          </div>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="TODOS">Todos</option>
            <option value="CON_EVENTO">Con evento</option>
            <option value="SIN_EVENTO">Sin evento</option>
            <option value="CON_VOTACIONES">Con votaciones</option>
            <option value="SIN_VOTACIONES">Sin votaciones</option>
          </select>
        </div>

        {loading ? (
          <div className="project-feedback">Cargando proyectos...</div>
        ) : filteredProjects.length === 0 ? (
          <div className="project-feedback">No hay proyectos que coincidan.</div>
        ) : (
          <div className="projects-pro-grid">
            {filteredProjects.map((proyecto) => (
              <article className="project-pro-card" key={proyecto.id}>
                <div className="project-pro-card-header">
                  <div className="project-pro-avatar">
                    {proyecto.nombre?.charAt(0)?.toUpperCase() || "P"}
                  </div>

                  <div>
                    <h3>{proyecto.nombre}</h3>
                    <span>{proyecto.tipoCategoria}</span>
                  </div>
                </div>

                <p>{proyecto.descripcion || "Sin descripción."}</p>

                <div className="project-pro-info">
                  <div>
                    <span>Equipo</span>
                    <strong>{proyecto.equipo?.nombre || "Sin equipo"}</strong>
                  </div>

                  <div>
                    <span>Evento</span>
                    <strong>{proyecto.evento?.nombre || "Sin evento"}</strong>
                  </div>

                  <div>
                    <span>Votaciones</span>
                    <strong>{proyecto.relations.length}</strong>
                  </div>
                </div>

                {proyecto.relations.length > 0 ? (
                  <div className="project-pro-voting-tags">
                    {proyecto.relations.map((rel) => (
                      <span key={rel.id}>{votingLabel(rel.votacion)}</span>
                    ))}
                  </div>
                ) : (
                  <div className="project-feedback compact">Sin votaciones asignadas.</div>
                )}

                {puedeGestionar ? (
                  <div className="project-pro-actions">
                    <button
                      type="button"
                      className="project-edit-btn"
                      onClick={() => {
                        setEditingProject(proyecto);
                        setProjectModalOpen(true);
                      }}
                    >
                      <Edit3 size={15} />
                      Editar
                    </button>

                    <button
                      type="button"
                      className="project-assign-btn"
                      onClick={() => setParticipationProject(proyecto)}
                    >
                      <Link2 size={15} />
                      Participación
                    </button>
                    <button
                      type="button"
                      className="project-danger-btn"
                      onClick={() => setConfirmDeleteProject(proyecto)}
                    >
                      <Trash2 size={15} />
                      Eliminar
                    </button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>

      <ProjectFormModal
        open={projectModalOpen}
        proyecto={editingProject}
        equipos={equipos}
        eventos={eventos}
        allProjects={enrichedProjects}
        onClose={() => {
          setProjectModalOpen(false);
          setEditingProject(null);
        }}
        onSubmit={handleSubmitProject}
      />

      <ParticipationModal
        open={Boolean(participationProject)}
        proyecto={participationProject}
        eventos={eventos}
        allProjects={enrichedProjects}
        currentRelations={
          participationProject ? relationsByProject[participationProject.id] || [] : []
        }
        onClose={() => setParticipationProject(null)}
        onEnterEvent={handleEnterEvent}
        onLeaveEvent={(project) => setConfirmLeaveProject(project)}
        onAddVoting={handleAddVoting}
        onRemoveVoting={handleRemoveVoting}
      />

      <ConfirmModal
        open={Boolean(confirmLeaveProject)}
        title="Quitar proyecto del evento"
        message={`Vas a quitar "${confirmLeaveProject?.nombre}" del evento actual.`}
        warning="El proyecto no se eliminará. Solo saldrá del evento y de sus votaciones."
        onCancel={() => setConfirmLeaveProject(null)}
        onConfirm={() => handleLeaveEvent(confirmLeaveProject)}
      />
      <ConfirmModal
        open={Boolean(confirmDeleteProject)}
        title="Eliminar proyecto"
        message={`Vas a eliminar "${confirmDeleteProject?.nombre}".`}
        warning="Se eliminarán sus comentarios, votos, evaluaciones y relaciones con votaciones. También desaparecerá de los rankings."
        onCancel={() => setConfirmDeleteProject(null)}
        onConfirm={() => handleDeleteProject(confirmDeleteProject)}
      />
    </main>
  );
}

export default ProjectsScreen;