import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, LogOut } from "lucide-react";
import { cerrarSesion, getUsuarioLogueado } from "../services/sessionService";

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
      return rol || "";
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

function TopBar() {
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState(false);

  const usuario = useMemo(() => getUsuarioLogueado(), []);
  const initials = getInitials(usuario?.nombre || "");

  const handleLogout = () => {
    cerrarSesion();
    navigate("/login");
  };

  return (
    <header className="topbar">
      <div className="topbar-event">
        <span className="topbar-dot" />
        <span>Nombre del Evento</span>
      </div>

      <div className="topbar-user-wrapper">
        <button
          className="topbar-user"
          onClick={() => setOpenMenu((prev) => !prev)}
        >
          <div className="topbar-user-avatar">
            {initials || <User size={16} />}
          </div>

          <div className="topbar-user-info">
            <div className="topbar-user-name">{usuario?.nombre || ""}</div>
            <div className="topbar-user-role">{getRoleLabel(usuario?.rol)}</div>
          </div>
        </button>

        {openMenu && (
          <div className="topbar-dropdown">
            <button className="topbar-dropdown-item" onClick={handleLogout}>
              <LogOut size={16} />
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default TopBar;