import { useEffect, useMemo, useState } from "react";
import {
  Edit,
  Mail,
  Plus,
  Search,
  Shield,
  Trash2,
  Trophy,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import {
  createUsuario,
  deleteUsuario,
  getUsuarios,
  updateUsuario,
} from "../../services/usuarioService";
import {
  assignCompetidor,
  createCompetidor,
  deleteAsignacionCompetidor,
  deleteCompetidor,
  getCompetidores,
} from "../../services/competidorService";
import { getEquipos, deleteEquipo } from "../../services/equipoService";
import { getEventos } from "../../services/eventoService";
import { createProyectoConEquipo, getProyectos } from "../../services/proyectoService";
import {
  asignarProyectoAVotacion,
  getAsignacionesCompetidorEvento,
  getVotacionesByEvento,
} from "../../services/votacionService";
import { esOrganizador } from "../../services/sessionService";
import "../../styles/user-management.css";

const ROLES = ["ORGANIZADOR", "JURADO", "COMPETIDOR", "PUBLICO"];

function roleLabel(role) {
  return {
    ORGANIZADOR: "Organizador",
    JURADO: "Jurado",
    COMPETIDOR: "Competidor",
    PUBLICO: "Público",
  }[role] || role;
}

function roleClass(role) {
  return `role-badge role-${String(role || "").toLowerCase()}`;
}

function initials(name = "", email = "") {
  const base = name || email || "Usuario";
  return (
    base
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U"
  );
}

function getUsuarioVinculado(competidor, usuarios) {
  if (competidor.usuario) return competidor.usuario;

  return usuarios.find(
    (usuario) =>
      usuario.email &&
      competidor.email &&
      usuario.email.toLowerCase() === competidor.email.toLowerCase()
  );
}

function UserModal({ open, onClose, onSubmit, initialData }) {
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    rol: "PUBLICO",
  });

  useEffect(() => {
    if (!open) return;

    setForm({
      nombre: initialData?.nombre || "",
      email: initialData?.email || "",
      rol: initialData?.rol || "PUBLICO",
    });
  }, [open, initialData]);

  if (!open) return null;

  async function submit(e) {
    e.preventDefault();

    try {
      await onSubmit(form);
      onClose();
    } catch {
      // El aviso se muestra en la pantalla principal; dejamos el modal abierto para corregir la selección.
    }
  }

  return (
    <div className="users-modal-backdrop">
      <form className="users-modal" onSubmit={submit}>
        <h2>{initialData ? "Editar usuario" : "Crear usuario"}</h2>
        <p>{initialData ? "Actualiza los datos." : "La contraseña inicial será 1234."}</p>

        <label className="user-field">
          <span>Nombre</span>
          <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
        </label>

        <label className="user-field">
          <span>Email</span>
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </label>

        <label className="user-field">
          <span>Rol</span>
          <select value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}>
            {ROLES.map((role) => (
              <option key={role} value={role}>{roleLabel(role)}</option>
            ))}
          </select>
        </label>

        <div className="users-modal-actions">
          <button type="button" className="secondary-btn" onClick={onClose}>Cancelar</button>
          <button type="submit" className="primary-btn">Guardar</button>
        </div>
      </form>
    </div>
  );
}

function CompetidorModal({ open, onClose, onSubmit }) {
  const [form, setForm] = useState({ nombre: "", email: "" });

  useEffect(() => {
    if (open) setForm({ nombre: "", email: "" });
  }, [open]);

  if (!open) return null;

  async function submit(e) {
    e.preventDefault();
    await onSubmit(form);
    onClose();
  }

  return (
    <div className="users-modal-backdrop">
      <form className="users-modal" onSubmit={submit}>
        <h2>Crear competidor</h2>

        <div className="feedback-card warning-box">
          ⚠️ Debe existir antes un usuario con el mismo email. El competidor se vinculará automáticamente a ese usuario.
        </div>

        <label className="user-field">
          <span>Nombre</span>
          <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
        </label>

        <label className="user-field">
          <span>Email del usuario vinculado</span>
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </label>

        <div className="users-modal-actions">
          <button type="button" className="secondary-btn" onClick={onClose}>Cancelar</button>
          <button type="submit" className="primary-btn">Crear competidor</button>
        </div>
      </form>
    </div>
  );
}

function CompetitorSearchPicker({ competidores, selectedIds, onChange, placeholder = "Buscar competidor..." }) {
  const [query, setQuery] = useState("");

  const selected = competidores.filter((competidor) => selectedIds.includes(competidor.id));

  const results = competidores
    .filter((competidor) => !selectedIds.includes(competidor.id))
    .filter((competidor) => {
      const text = `${competidor.nombre || ""} ${competidor.email || ""}`.toLowerCase();
      return text.includes(query.toLowerCase());
    })
    .slice(0, 6);

  function add(id) {
    onChange([...selectedIds, id]);
    setQuery("");
  }

  function remove(id) {
    onChange(selectedIds.filter((item) => item !== id));
  }

  return (
    <div className="competitor-search-picker">
      <div className="selected-competitors">
        {selected.length === 0 ? (
          <span className="selected-empty">Aún no has seleccionado competidores.</span>
        ) : (
          selected.map((competidor) => (
            <span className="selected-competitor-chip" key={competidor.id}>
              <span>{initials(competidor.nombre, competidor.email)}</span>
              {competidor.nombre}
              <button type="button" onClick={() => remove(competidor.id)}>
                <X size={13} />
              </button>
            </span>
          ))
        )}
      </div>

      <div className="competitor-search-box">
        <Search size={17} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
        />
      </div>

      {query.trim() ? (
        <div className="competitor-search-results">
          {results.length === 0 ? (
            <div className="competitor-result-empty">No se encontró ningún competidor.</div>
          ) : (
            results.map((competidor) => (
              <button
                type="button"
                className="competitor-result"
                key={competidor.id}
                onClick={() => add(competidor.id)}
              >
                <div className="competitor-result-avatar">
                  {initials(competidor.nombre, competidor.email)}
                </div>
                <div>
                  <strong>{competidor.nombre}</strong>
                  <small>{competidor.email}</small>
                </div>
                <Plus size={17} />
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

function EquipoModal({ open, onClose, onSubmit, eventos, competidores }) {
  const [form, setForm] = useState({
    nombreEquipo: "",
    nombreProyecto: "",
    descripcionProyecto: "",
    tipoCategoria: "IA",
    eventoId: "",
    votacionId: "",
    competidorIds: [],
  });
  const [votaciones, setVotaciones] = useState([]);
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (!open) return;

    const firstEventoId = eventos[0]?.id || "";

    setForm({
      nombreEquipo: "",
      nombreProyecto: "",
      descripcionProyecto: "",
      tipoCategoria: "IA",
      eventoId: firstEventoId,
      votacionId: "",
      competidorIds: [],
    });
    setLocalError("");
  }, [open, eventos]);

  useEffect(() => {
    if (!open || !form.eventoId) {
      setVotaciones([]);
      return;
    }

    getVotacionesByEvento(form.eventoId)
      .then((data) => {
        setVotaciones(data || []);
        setForm((prev) => ({ ...prev, votacionId: data?.[0]?.id || "" }));
      })
      .catch(() => {
        setVotaciones([]);
        setForm((prev) => ({ ...prev, votacionId: "" }));
      });
  }, [open, form.eventoId]);

  if (!open) return null;

  async function submit(e) {
    e.preventDefault();

    try {
      setLocalError("");
      await onSubmit(form);
      onClose();
    } catch {
      setLocalError("No se pudo crear el equipo: algún competidor seleccionado ya participa en este evento.");
    }
  }

  return (
    <div className="users-modal-backdrop">
      <form className="users-modal users-modal-wide" onSubmit={submit}>
        <h2>Crear equipo + proyecto</h2>
        <p>Crea el equipo, crea su proyecto, selecciona el evento y la votación donde participará.</p>

        <div className="users-form-grid">
          <label className="user-field">
            <span>Nombre del equipo</span>
            <input value={form.nombreEquipo} onChange={(e) => setForm({ ...form, nombreEquipo: e.target.value })} required />
          </label>

          <label className="user-field">
            <span>Nombre del proyecto</span>
            <input value={form.nombreProyecto} onChange={(e) => setForm({ ...form, nombreProyecto: e.target.value })} required />
          </label>
        </div>

        <label className="user-field">
          <span>Descripción del proyecto</span>
          <textarea value={form.descripcionProyecto} onChange={(e) => setForm({ ...form, descripcionProyecto: e.target.value })} rows="3" required />
        </label>

        <div className="users-form-grid">
          <label className="user-field">
            <span>Categoría</span>
            <select value={form.tipoCategoria} onChange={(e) => setForm({ ...form, tipoCategoria: e.target.value })}>
              <option value="IA">IA</option>
              <option value="SOSTENIBILIDAD">Sostenibilidad</option>
            </select>
          </label>

          <label className="user-field">
            <span>Evento donde estará el proyecto</span>
            <select value={form.eventoId} onChange={(e) => setForm({ ...form, eventoId: e.target.value })} required>
              <option value="">Selecciona evento</option>
              {eventos.map((evento) => (
                <option key={evento.id} value={evento.id}>{evento.nombre}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="user-field">
          <span>Votación donde participará el proyecto</span>
          <select value={form.votacionId} onChange={(e) => setForm({ ...form, votacionId: e.target.value })} required>
            <option value="">Selecciona votación</option>
            {votaciones.map((votacion) => (
              <option key={votacion.id} value={votacion.id}>
                {votacion.tipo} + {votacion.modalidad}
              </option>
            ))}
          </select>
        </label>

        <div className="user-field">
          <span>Competidores del equipo</span>
          <CompetitorSearchPicker
            competidores={competidores}
            selectedIds={form.competidorIds}
            onChange={(ids) => setForm({ ...form, competidorIds: ids })}
          />
        </div>

        {localError ? <div className="feedback-card error-box">{localError}</div> : null}

        <div className="users-modal-actions">
          <button type="button" className="secondary-btn" onClick={onClose}>Cancelar</button>
          <button type="submit" className="primary-btn">Crear equipo</button>
        </div>
      </form>
    </div>
  );
}

function AssignCompetitorsModal({ open, onClose, equipo, competidores, currentAsignaciones, onSubmit }) {
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    if (!open || !equipo) return;

    setSelectedIds(
      currentAsignaciones
        .map((asignacion) => asignacion.competidor?.id)
        .filter(Boolean)
    );
  }, [open, equipo, currentAsignaciones]);

  if (!open || !equipo) return null;

  async function submit(e) {
    e.preventDefault();

    try {
      await onSubmit(equipo, selectedIds, currentAsignaciones);
      onClose();
    } catch {
      onClose();
    }
  }

  return (
    <div className="users-modal-backdrop">
      <form className="users-modal" onSubmit={submit}>
        <h2>Asignar competidores</h2>
        <p>Añade o quita competidores del equipo {equipo.nombre}.</p>

        <CompetitorSearchPicker
          competidores={competidores}
          selectedIds={selectedIds}
          onChange={setSelectedIds}
          placeholder="Buscar competidor para añadir..."
        />

        <div className="users-modal-actions">
          <button type="button" className="secondary-btn" onClick={onClose}>Cancelar</button>
          <button type="submit" className="primary-btn">Guardar cambios</button>
        </div>
      </form>
    </div>
  );
}

function ConfirmDeleteModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
}) {
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function handleConfirm() {
    try {
      setLoading(true);
      await onConfirm();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="users-modal-backdrop">
      <div className="users-modal users-modal-small">
        <h2>{title}</h2>

        <p>{message}</p>

        <div className="users-modal-actions">
          <button
            type="button"
            className="secondary-btn"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>

          <button
            type="button"
            className="danger-btn"
            onClick={handleConfirm}
            disabled={loading}
          >
            <Trash2 size={16} />
            {loading ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function UserManagementScreen() {
  const [activeTab, setActiveTab] = useState("usuarios");
  const [usuarios, setUsuarios] = useState([]);
  const [competidores, setCompetidores] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [proyectos, setProyectos] = useState([]);

  const [asignacionesPorEquipo, setAsignacionesPorEquipo] = useState({});
  const [asignacionesPorCompetidor, setAsignacionesPorCompetidor] = useState({});

  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("TODOS");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [competidorModalOpen, setCompetidorModalOpen] = useState(false);
  const [equipoModalOpen, setEquipoModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedEquipo, setSelectedEquipo] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfig, setDeleteConfig] = useState(null);

  const puedeGestionar = esOrganizador();

  async function loadAll() {
  try {
    setLoading(true);
    setError("");

    const [
      usuariosData,
      competidoresData,
      equiposData,
      eventosData,
      proyectosData,
    ] = await Promise.all([
      getUsuarios().catch(() => []),
      getCompetidores().catch(() => []),
      getEquipos().catch(() => []),
      getEventos().catch(() => []),
      getProyectos().catch(() => []),
    ]);

    setUsuarios(usuariosData || []);
    setCompetidores(competidoresData || []);
    setEquipos(equiposData || []);
    setEventos(eventosData || []);
    setProyectos(proyectosData || []);

    const todasAsignaciones = [];

    await Promise.all(
      (eventosData || []).map(async (evento) => {
        const asignacionesEvento = await getAsignacionesCompetidorEvento(evento.id).catch(() => []);
        todasAsignaciones.push(...asignacionesEvento);
      })
    );

    const equipoAsignaciones = {};
    const competidorAsignaciones = {};

    for (const asignacion of todasAsignaciones) {
      const equipoId = asignacion.equipo?.id;
      const competidorId = asignacion.competidor?.id;

      if (equipoId) {
        if (!equipoAsignaciones[equipoId]) {
          equipoAsignaciones[equipoId] = [];
        }

        equipoAsignaciones[equipoId].push(asignacion);
      }

      if (competidorId) {
        if (!competidorAsignaciones[competidorId]) {
          competidorAsignaciones[competidorId] = [];
        }

        competidorAsignaciones[competidorId].push(asignacion);
      }
    }

    setAsignacionesPorEquipo(equipoAsignaciones);
    setAsignacionesPorCompetidor(competidorAsignaciones);
  } catch (err) {
    setError(err.message || "No se pudieron cargar los datos");
  } finally {
    setLoading(false);
  }
}

  useEffect(() => {
    loadAll();
  }, []);

  const filteredUsuarios = useMemo(() => {
    return usuarios.filter((usuario) => {
      const text = `${usuario.nombre || ""} ${usuario.email || ""}`.toLowerCase();
      const matchesSearch = text.includes(search.toLowerCase());
      const matchesRole = selectedRole === "TODOS" || usuario.rol === selectedRole;
      return matchesSearch && matchesRole;
    });
  }, [usuarios, search, selectedRole]);

  const filteredCompetidores = useMemo(() => {
    return competidores.filter((competidor) => {
      const equiposTexto = (asignacionesPorCompetidor[competidor.id] || [])
        .map((a) => a.equipo?.nombre)
        .join(" ");

      const text = `${competidor.nombre || ""} ${competidor.email || ""} ${equiposTexto}`.toLowerCase();
      return text.includes(search.toLowerCase());
    });
  }, [competidores, search, asignacionesPorCompetidor]);

  const getProyectosDelEquipo = (equipo) => {
    return proyectos.filter(
      (proyecto) =>
        String(proyecto.equipo?.id) === String(equipo.id) ||
        String(equipo.proyecto?.id) === String(proyecto.id)
    );
  };
  
  const filteredEquipos = useMemo(() => {
    return equipos.filter((equipo) => {
      const miembrosTexto = (asignacionesPorEquipo[equipo.id] || [])
        .map((a) => `${a.competidor?.nombre || ""} ${a.competidor?.email || ""}`)
        .join(" ");

      const proyectosTexto = getProyectosDelEquipo(equipo)
        .map((proyecto) => proyecto.nombre)
        .join(" ");

      const text = `${equipo.nombre || ""} ${equipo.evento?.nombre || ""} ${proyectosTexto} ${miembrosTexto}`.toLowerCase();
      return text.includes(search.toLowerCase());
    });
  }, [equipos, search, asignacionesPorEquipo, proyectos]);

  const tabOptions = [
    { value: "usuarios", label: "Usuarios", count: filteredUsuarios.length },
    { value: "competidores", label: "Competidores", count: filteredCompetidores.length },
    { value: "equipos", label: "Equipos", count: filteredEquipos.length },
  ];

  const activePanel = tabOptions.find((tab) => tab.value === activeTab) || tabOptions[0];

  const roleFilterOptions = [
    { value: "TODOS", label: "Todos" },
    ...ROLES.map((role) => ({ value: role, label: roleLabel(role) })),
  ];

  async function handleSubmitUser(data) {
    if (editingUser) {
      await updateUsuario(editingUser.id, data);
    } else {
      await createUsuario({ ...data, password: "1234" });
    }
    await loadAll();
  }

  async function handleDeleteUser(usuario) {
  await deleteUsuario(usuario.id);
  await loadAll();
  }

  async function handleDeleteCompetidor(competidor) {
  await deleteCompetidor(competidor.id);
  await loadAll();
}

async function handleDeleteEquipo(equipo) {
  await deleteEquipo(equipo.id);
  await loadAll();
}

  async function handleCreateCompetidor(data) {
    await createCompetidor({
      nombre: data.nombre.trim(),
      email: data.email.trim(),
    });
    await loadAll();
  }

  async function handleCreateEquipo(data) {
    setError("");
    setSuccess("");

    const selectedCompetidores = competidores.filter((competidor) =>
      data.competidorIds.includes(competidor.id)
    );

    try {
      const proyectoCreado = await createProyectoConEquipo({
        nombre: data.nombreProyecto.trim(),
        descripcion: data.descripcionProyecto.trim(),
        tipoCategoria: data.tipoCategoria,
        nombreEquipo: data.nombreEquipo.trim(),
        miembrosEmails: selectedCompetidores.map((competidor) => competidor.email),
        eventoId: data.eventoId,
      });

      await asignarProyectoAVotacion(data.votacionId, proyectoCreado.id);
      await loadAll();
      setSuccess("Equipo y proyecto creados correctamente.");
    } catch (err) {
      const message =
        "No se pudo crear el equipo. Revisa que los competidores seleccionados no participen ya en otro equipo de este evento.";
      setError(message);
      throw new Error(message);
    }
  }

  async function handleAssignCompetitors(equipo, selectedIds, currentAsignaciones) {
    const eventoId = equipo.evento?.id;
    setError("");
    setSuccess("");

    if (!eventoId) {
      const message = "El equipo no tiene evento asociado.";
      setError(message);
      throw new Error(message);
    }

    const currentIds = currentAsignaciones
      .map((asignacion) => asignacion.competidor?.id)
      .filter(Boolean);

    const toAdd = selectedIds.filter((id) => !currentIds.includes(id));
    const toRemove = currentAsignaciones.filter(
      (asignacion) => asignacion.competidor?.id && !selectedIds.includes(asignacion.competidor.id)
    );

    try {
      for (const competidorId of toAdd) {
        await assignCompetidor({ competidorId, eventoId, equipoId: equipo.id });
      }

      for (const asignacion of toRemove) {
        await deleteAsignacionCompetidor(asignacion.id);
      }

      await loadAll();
      setSuccess("Competidores actualizados correctamente.");
    } catch (err) {
      const message =
        "No se pudo actualizar el equipo. Revisa que el competidor no esté ya asignado a otro equipo del mismo evento.";
      setError(message);
      throw new Error(message);
    }
  }

  return (
    <main className="users-page users-mock-page">
      <header className="users-header">
        <div>
          <h1>Usuarios, Competidores y Equipos</h1>
          <p>Gestiona usuarios, competidores registrados y equipos del sistema.</p>
        </div>

        {puedeGestionar ? (
          <div className="users-header-actions">
            {activeTab === "usuarios" ? (
              <button className="primary-btn" onClick={() => { setEditingUser(null); setUserModalOpen(true); }}>
                <UserPlus size={17} /> Añadir Usuario
              </button>
            ) : null}

            {activeTab === "competidores" ? (
              <button className="primary-btn" onClick={() => setCompetidorModalOpen(true)}>
                <Plus size={17} /> Crear Competidor
              </button>
            ) : null}

            {activeTab === "equipos" ? (
              <button className="primary-btn" onClick={() => setEquipoModalOpen(true)}>
                <Plus size={17} /> Crear Equipo
              </button>
            ) : null}
          </div>
        ) : null}
      </header>

      <section className="users-stats-grid">
        <div className="users-stat-card stat-users"><div className="users-stat-icon blue"><Users size={23} /></div><div><strong>{usuarios.length}</strong><span>Usuarios</span></div></div>
        <div className="users-stat-card stat-jury"><div className="users-stat-icon purple"><Shield size={23} /></div><div><strong>{usuarios.filter((u) => u.rol === "JURADO").length}</strong><span>Jurado</span></div></div>
        <div className="users-stat-card stat-competitors"><div className="users-stat-icon green"><UserPlus size={23} /></div><div><strong>{competidores.length}</strong><span>Competidores</span></div></div>
        <div className="users-stat-card stat-teams"><div className="users-stat-icon orange"><Trophy size={23} /></div><div><strong>{equipos.length}</strong><span>Equipos</span></div></div>
      </section>

      {error ? <div className="feedback-card error-box users-page-feedback">{error}</div> : null}
      {success ? <div className="feedback-card success-box users-page-feedback">{success}</div> : null}

      <section className="users-card">
        <div className="users-tabs">
          {tabOptions.map((tab) => (
            <button
              type="button"
              key={tab.value}
              className={activeTab === tab.value ? "active" : ""}
              onClick={() => setActiveTab(tab.value)}
            >
              {tab.label}
              <span className="users-tab-count">{tab.count}</span>
            </button>
          ))}
        </div>

        <div className="users-card-header">
          <div>
            <h2>{activePanel.label}</h2>
            <p>{activePanel.count} resultados visibles con los filtros actuales.</p>
          </div>
        </div>

        <div className="users-toolbar">
          <div className="users-search">
            <Search size={17} />
            <input placeholder="Buscar por nombre, email, evento, proyecto o equipo..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          {activeTab === "usuarios" ? (
            <div className="users-role-segment" role="group" aria-label="Filtrar usuarios por rol">
              {roleFilterOptions.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  className={selectedRole === option.value ? "active" : ""}
                  onClick={() => setSelectedRole(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {loading ? (
          <div className="feedback-card">Cargando datos...</div>
        ) : (
          <>
            {activeTab === "usuarios" ? (
              <div className="users-table-wrapper">
                <table className="users-table">
                  <thead>
                    <tr><th>Usuario</th><th>Email</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr>
                  </thead>
                  <tbody>
                    {filteredUsuarios.map((usuario) => (
                      <tr key={usuario.id}>
                        <td><div className="user-cell"><div className="user-avatar">{initials(usuario.nombre, usuario.email)}</div><strong>{usuario.nombre}</strong></div></td>
                        <td><span className="email-cell"><Mail size={15} />{usuario.email}</span></td>
                        <td><span className={roleClass(usuario.rol)}>{roleLabel(usuario.rol)}</span></td>
                        <td><span className="status-pill active">Activo</span></td>
                        <td>
                          <div className="table-actions">
                            <button disabled={!puedeGestionar} onClick={() => { setEditingUser(usuario); setUserModalOpen(true); }}><Edit size={16} /></button>
                            <button
                              disabled={!puedeGestionar}
                              className="danger-action-btn"
                              onClick={() => {
                                setDeleteConfig({
                                  title: "Eliminar usuario",
                                  message: `¿Seguro que deseas eliminar a ${usuario.nombre}?`,
                                  action: () => handleDeleteUser(usuario),
                                });

                                setDeleteModalOpen(true);
                              }}
                              >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            {activeTab === "competidores" ? (
              <div className="competidores-list">
                <div className="feedback-card warning-box">
                  ⚠️ Un competidor queda vinculado cuando existe un usuario con el mismo email.
                </div>

                {filteredCompetidores.map((competidor) => {
                  const usuarioVinculado = getUsuarioVinculado(competidor, usuarios);
                  const asignaciones = asignacionesPorCompetidor[competidor.id] || [];

                  return (
                    <article className="competidor-card" key={competidor.id}>
                      <div className="user-avatar large">{initials(competidor.nombre, competidor.email)}</div>

                      <div className="competidor-info">
                        <h3>{competidor.nombre}</h3>
                        <p>{competidor.email}</p>

                        <div className="competidor-badges">
                          <span className="role-badge role-competidor">Competidor</span>
                          {usuarioVinculado ? <span className="status-pill linked">Vinculado a usuario</span> : <span className="status-pill not-linked">No vinculado</span>}
                        </div>

                        {usuarioVinculado ? (
                          <small className="helper-text">Vinculado con: {usuarioVinculado.email || usuarioVinculado.nombre}</small>
                        ) : (
                          <small className="helper-text error-text">No existe un usuario con este email.</small>
                        )}

                        <div className="competidor-teams">
                          <strong>Equipos:</strong>
                          {asignaciones.length === 0 ? (
                            <span>Sin equipo asignado</span>
                          ) : (
                            asignaciones.map((a) => (
                              <span className="team-chip" key={a.id}>
                                {a.equipo?.nombre || "Equipo"} · {a.evento?.nombre || "Evento"}
                              </span>
                            ))
                          )}
                        </div>
                        {puedeGestionar ? (
                          <div className="table-actions">
                            <button
                              className="danger-action-btn"
                              onClick={() => {
                                setDeleteConfig({
                                  title: "Eliminar competidor",
                                  message: `¿Seguro que deseas eliminar al competidor ${competidor.nombre}?`,
                                  action: () => handleDeleteCompetidor(competidor),
                                });

                                setDeleteModalOpen(true);
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </article>
                  );
                })}

                {filteredCompetidores.length === 0 ? <div className="feedback-card">No hay competidores.</div> : null}
              </div>
            ) : null}

            {activeTab === "equipos" ? (
              <div className="equipos-grid">
                {filteredEquipos.map((equipo) => {
                  const asignaciones = asignacionesPorEquipo[equipo.id] || [];
                  const proyectosEquipo = getProyectosDelEquipo(equipo);

                  return (
                    <article className="equipo-card" key={equipo.id}>
                      <div className="equipo-card-header">
                        <div className="equipo-icon"><Trophy size={24} /></div>
                        <div>
                          <h3>{equipo.nombre}</h3>
                          <p>{equipo.evento?.nombre || "Sin evento"}</p>
                        </div>
                      </div>

                      <div className="equipo-project">
                        <span>Proyectos asociados</span>
                        {proyectosEquipo.length > 0 ? (
                          <strong>{proyectosEquipo.map((proyecto) => proyecto.nombre).join(", ")}</strong>
                        ) : (
                          <strong>Sin proyecto</strong>
                        )}
                      </div>

                      <div className="equipo-members">
                        <div className="equipo-members-summary">
                          <span>{asignaciones.length} miembro{asignaciones.length === 1 ? "" : "s"}</span>
                        </div>

                        {asignaciones.length > 0 ? (
                          <div className="equipo-members-list">
                            {asignaciones.map((a) => (
                              <div className="equipo-member-row" key={a.id}>
                                <div className="mini-avatar">
                                  {initials(a.competidor?.nombre, a.competidor?.email)}
                                </div>
                                <div>
                                  <strong>{a.competidor?.nombre || "Competidor"}</strong>
                                  <small>{a.competidor?.email || "Sin email"}</small>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="equipo-member-empty">Sin competidores asignados</span>
                        )}
                      </div>

                      <button
                        type="button"
                        className="secondary-btn full-width-btn"
                        onClick={() => {
                          setSelectedEquipo(equipo);
                          setAssignModalOpen(true);
                        }}
                      >
                        <Plus size={16} />
                        Gestionar miembros
                      </button>
                      {puedeGestionar ? (
                        <button
                          type="button"
                          className="danger-btn full-width-btn"
                          onClick={() => {
                            setDeleteConfig({
                              title: "Eliminar equipo",
                              message: `¿Seguro que deseas eliminar el equipo ${equipo.nombre}?`,
                              action: () => handleDeleteEquipo(equipo),
                            });

                            setDeleteModalOpen(true);
                          }}
                        >
                          <Trash2 size={16} />
                          Eliminar equipo
                        </button>
                      ) : null}
                    </article>
                  );
                })}

                {filteredEquipos.length === 0 ? <div className="feedback-card">No hay equipos.</div> : null}
              </div>
            ) : null}
          </>
        )}
      </section>

      <UserModal
        open={userModalOpen}
        initialData={editingUser}
        onClose={() => { setUserModalOpen(false); setEditingUser(null); }}
        onSubmit={handleSubmitUser}
      />

      <CompetidorModal
        open={competidorModalOpen}
        onClose={() => setCompetidorModalOpen(false)}
        onSubmit={handleCreateCompetidor}
      />

      <EquipoModal
        open={equipoModalOpen}
        onClose={() => setEquipoModalOpen(false)}
        onSubmit={handleCreateEquipo}
        eventos={eventos}
        competidores={competidores}
      />

      <AssignCompetitorsModal
        open={assignModalOpen}
        onClose={() => { setAssignModalOpen(false); setSelectedEquipo(null); }}
        equipo={selectedEquipo}
        competidores={competidores}
        currentAsignaciones={selectedEquipo ? asignacionesPorEquipo[selectedEquipo.id] || [] : []}
        onSubmit={handleAssignCompetitors}
      />
      
      <ConfirmDeleteModal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeleteConfig(null);
        }}
        title={deleteConfig?.title}
        message={deleteConfig?.message}
        onConfirm={deleteConfig?.action || (async () => {})}
      />
    </main>
  );
}

export default UserManagementScreen;
