import { NavLink } from "react-router-dom";
import { Calendar, Folder, Home, Settings, Trophy, Users, Vote } from "lucide-react";

const items = [
  { label: "Inicio", to: "/", icon: Home },
  { label: "Eventos", to: "/eventos", icon: Calendar },
  { label: "Proyectos", to: "/proyectos", icon: Folder },
  { label: "Usuarios", to: "/usuarios", icon: Users },
  { label: "Mi Proyecto", to: "/configuracion", icon: Trophy },
];

function Sidebar() {
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
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? "active" : ""}`
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
        <div className="sidebar-link sidebar-link-disabled">
          <Settings size={19} />
          <span>Configuración</span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;