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

function Sidebar() {
  const usuario  = useMemo(() => getUsuarioLogueado(), []);
  const navItems = useMemo(() => getNavItems(usuario?.rol), [usuario?.rol]);

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
    </aside>
  );
}

export default Sidebar;