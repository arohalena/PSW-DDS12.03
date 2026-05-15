import { NavLink } from "react-router-dom";
import { Calendar, Folder, Home, Trophy, Users, Vote, Shield, Gavel, UserCog } from "lucide-react";
import { useMemo } from "react";
import { getUsuarioLogueado } from "../services/sessionService";

// Navegación por rol
function getNavItems(rol) {
  switch (rol) {
    case "ORGANIZADOR":
      return [
        { label: "Inicio",    to: "/",           icon: Home,     end: true },
        { label: "Eventos",   to: "/eventos",     icon: Calendar  },
        { label: "Proyectos", to: "/proyectos",   icon: Folder    },
        { label: "Usuarios",  to: "/usuarios",    icon: Users     },
        { label: "Auditoría", to: "/auditoria",   icon: Shield    },
      ];

    case "JURADO":
      return [
        { label: "Inicio",       to: "/",          icon: Home,    end: true },
        { label: "Eventos",      to: "/eventos",   icon: Calendar },
        { label: "Evaluaciones", to: "/eventos",   icon: Gavel    },
        { label: "Auditoría",    to: "/auditoria", icon: Shield   },
      ];

    case "COMPETIDOR":
      return [
        { label: "Inicio",      to: "/",              icon: Home,    end: true },
        { label: "Mi Proyecto", to: "/configuracion", icon: Trophy   },
        { label: "Eventos",     to: "/eventos",       icon: Calendar },
      ];

    case "PUBLICO":
    case "ESPECTADOR":
    default:
      return [
        { label: "Inicio",  to: "/",        icon: Home,    end: true },
        { label: "Eventos", to: "/eventos", icon: Calendar },
      ];
  }
}

function getRolBadge(rol) {
  switch (rol) {
    case "ORGANIZADOR": return { label: "Organizador", color: "#6366f1", bg: "#eef2ff" };
    case "JURADO":      return { label: "Jurado",      color: "#7c3aed", bg: "#f5f3ff" };
    case "COMPETIDOR":  return { label: "Competidor",  color: "#ea580c", bg: "#fff7ed" };
    case "PUBLICO":     return { label: "Público",     color: "#16a34a", bg: "#f0fdf4" };
    case "ESPECTADOR":  return { label: "Espectador",  color: "#16a34a", bg: "#f0fdf4" };
    default:            return { label: rol || "Usuario", color: "#6b7280", bg: "#f3f4f6" };
  }
}

function getInitials(nombre = "", email = "") {
  const base = nombre || email || "U";
  return base
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function Sidebar() {
  const usuario  = useMemo(() => getUsuarioLogueado(), []);
  const navItems = useMemo(() => getNavItems(usuario?.rol), [usuario?.rol]);
  const badge    = useMemo(() => getRolBadge(usuario?.rol), [usuario?.rol]);
  const initials = getInitials(usuario?.nombre, usuario?.email);

  return (
    <aside className="sidebar">
      <div>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Vote size={18} />
          </div>
          <span>Votify</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.label + item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `sidebar-link${isActive ? " active" : ""}`
                }
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            {initials || <UserCog size={16} />}
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">
              {usuario?.nombre || usuario?.email || "Usuario"}
            </span>
            <span
              className="sidebar-user-badge"
              style={{ color: badge.color, background: badge.bg }}
            >
              {badge.label}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;