import { useEffect, useMemo, useState } from "react";
import {
  createUsuario,
  deleteUsuario,
  getUsuarios,
  updateUsuario,
} from "../services/usuarioService";
import { esOrganizador } from "../services/sessionService";
import UserStats from "../common/UserStats";
import UserFilters from "../common/UserFilters";
import UserTable from "../common/UserTable";
import UserModal from "../common/UserModal";
import "../styles/user-management.css";

function UserManagementScreen() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("TODOS");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [usuarioEnEdicion, setUsuarioEnEdicion] = useState(null);

  const puedeGestionarUsuarios = esOrganizador();

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getUsuarios();
      setUsuarios(data);
    } catch (err) {
      setError(err.message || "No se pudieron cargar los usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsuarios();
  }, []);

  const filteredUsuarios = useMemo(() => {
    return usuarios.filter((usuario) => {
      const matchesSearch =
        usuario.nombre?.toLowerCase().includes(search.toLowerCase()) ||
        usuario.email?.toLowerCase().includes(search.toLowerCase());

      const matchesRole =
        selectedRole === "TODOS" || usuario.rol === selectedRole;

      return matchesSearch && matchesRole;
    });
  }, [usuarios, search, selectedRole]);

  const handleOpenCreate = () => {
    if (!puedeGestionarUsuarios) return;
    setUsuarioEnEdicion(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (usuario) => {
    if (!puedeGestionarUsuarios) return;
    setUsuarioEnEdicion(usuario);
    setIsModalOpen(true);
  };

  const handleSubmitUser = async (usuarioData) => {
    if (!puedeGestionarUsuarios) return;

    if (usuarioEnEdicion) {
      await updateUsuario(usuarioEnEdicion.id, usuarioData);
    } else {
      await createUsuario({
        ...usuarioData,
        password: "1234",
      });
    }

    await loadUsuarios();
  };

  const handleDeleteUser = async (usuario) => {
    if (!puedeGestionarUsuarios) return;

    const confirmacion = window.confirm(`¿Seguro que quieres borrar a ${usuario.nombre}?`);
    if (!confirmacion) return;

    try {
      await deleteUsuario(usuario.id);
      await loadUsuarios();
    } catch (err) {
      alert(err.message || "No se pudo borrar el usuario");
    }
  };

  return (
    <main className="users-page">
      <header className="users-header">
        <div>
          <h1>Gestión de Usuarios</h1>
          <p>Administra roles y permisos de los participantes</p>
        </div>

        {puedeGestionarUsuarios && (
          <button className="primary-btn" onClick={handleOpenCreate}>
            Añadir Usuario
          </button>
        )}
      </header>

      {!puedeGestionarUsuarios && (
        <div className="feedback-card warning-box">
          Solo los organizadores pueden crear, editar o eliminar usuarios.
        </div>
      )}

      {loading ? (
        <div className="feedback-card">Cargando usuarios...</div>
      ) : error ? (
        <div className="feedback-card error-box">{error}</div>
      ) : (
        <>
          <UserStats usuarios={usuarios} />

          <UserFilters
            search={search}
            setSearch={setSearch}
            selectedRole={selectedRole}
            setSelectedRole={setSelectedRole}
          />

          <UserTable
            usuarios={filteredUsuarios}
            onEdit={handleOpenEdit}
            onDelete={handleDeleteUser}
            canManage={puedeGestionarUsuarios}
          />

          <section className="roles-info">
            <h3>Descripción de Roles</h3>
            <div className="roles-grid">
              <p>
                <strong>Organizador:</strong> Gestión completa del evento, usuarios y configuración
              </p>
              <p>
                <strong>Jurado:</strong> Puede evaluar proyectos y emitir votos
              </p>
              <p>
                <strong>Participante:</strong> Puede ver su proyecto y recibir feedback
              </p>
              <p>
                <strong>Espectador:</strong> Solo puede visualizar información pública
              </p>
            </div>
          </section>
        </>
      )}

      <UserModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setUsuarioEnEdicion(null);
        }}
        onSubmit={handleSubmitUser}
        initialData={usuarioEnEdicion}
      />
    </main>
  );
}

export default UserManagementScreen;