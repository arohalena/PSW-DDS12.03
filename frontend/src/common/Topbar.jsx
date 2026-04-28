import { ChevronDown, LogOut, Search, User } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { cerrarSesion, getUsuarioLogueado } from "../services/sessionService";

function getRoleLabel(rol) {
  switch (rol) {
    case "ORGANIZADOR":
      return "Organizador";
    case "JURADO":
      return "Jurado";
    case "COMPETIDOR":
      return "Competidor";
    case "PUBLICO":
      return "Público";
    case "ESPECTADOR":
      return "Espectador";
    default:
      return rol || "Usuario";
  }
}

function getInitials(nombre = "", email = "") {
  const base = nombre || email || "Usuario";
  return base
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function Topbar() {
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState(false);
  const usuario = useMemo(() => getUsuarioLogueado(), []);
  const initials = getInitials(usuario?.nombre, usuario?.email);

  function handleLogout() {
    cerrarSesion();
    navigate("/login");
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        <span className="topbar-status-dot" />
        <span className="topbar-title">Votify</span>
      </div>


      <div className="topbar-user-wrapper">
        <button className="topbar-user" onClick={() => setOpenMenu((value) => !value)}>
          <div className="topbar-user-avatar">
            {initials || <User size={16} />}
          </div>

          <div className="topbar-user-info">
            <div className="topbar-user-name">{usuario?.nombre || usuario?.email || "Usuario"}</div>
            <div className="topbar-user-role">{getRoleLabel(usuario?.rol)}</div>
          </div>

          <ChevronDown size={16} />
        </button>

        {openMenu ? (
          <div className="topbar-dropdown">
            <button className="topbar-dropdown-item" onClick={handleLogout}>
              <LogOut size={16} />
              Cerrar sesión
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}

export default Topbar;