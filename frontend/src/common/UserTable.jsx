function getRoleLabel(rol) {
  switch (rol) {
    case "ORGANIZADOR":
      return "Organizador";
    case "JURADO":
      return "Jurado";
    case "PARTICIPANTE":
      return "Participante";
    case "PUBLICO":
      return "Público";
    case "ESPECTADOR":
      return "Espectador";
    default:
      return rol;
  }
}

function getInitials(nombre = "") {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function UserTable({ usuarios }) {
  return (
    <section className="table-card">
      <table className="users-table">
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Rol</th>
            <th>Email</th>
            <th>Estado</th>
          </tr>
        </thead>

        <tbody>
          {usuarios.length === 0 ? (
            <tr>
              <td colSpan="4" className="empty-row">
                No hay usuarios para mostrar.
              </td>
            </tr>
          ) : (
            usuarios.map((usuario) => (
              <tr key={usuario.id}>
                <td>
                  <div className="user-cell">
                    <div className="avatar">{getInitials(usuario.nombre)}</div>
                    <div>
                      <div className="user-name">{usuario.nombre}</div>
                      <div className="user-subtext">{usuario.email}</div>
                    </div>
                  </div>
                </td>

                <td>
                  <span className={`role-pill role-${usuario.rol?.toLowerCase()}`}>
                    {getRoleLabel(usuario.rol)}
                  </span>
                </td>

                <td>{usuario.email}</td>

                <td>
                  <span className="status-pill active">Activo</span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </section>
  );
}

export default UserTable;