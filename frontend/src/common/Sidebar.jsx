import { NavLink } from "react-router-dom";

const items = [
  { label: "Dashboard", to: "/", disabled: true },
  { label: "Eventos", to: "/eventos" },
  { label: "Equipos", to: "/equipos" },
  { label: "Competidores", to: "/competidores" },
  { label: "Proyectos", to: "/proyectos" },
  { label: "Asignación", to: "/", disabled: true },
  { label: "Criterios", to: "/criterios" },
  { label: "Votación", to: "/votar" },
  { label: "Usuarios", to: "/usuarios" },
  { label: "Resultados", to: "/resultados" },
  { label: "Mi Proyecto", to: "/", disabled: true },
];

function Sidebar() {
  return (
    <aside className="sidebar">
      <div>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">V</div>
          <span>Votify</span>
        </div>

        <nav className="sidebar-nav">
          {items.map((item) => {
            if (item.disabled) {
              return (
                <button key={item.label} className="sidebar-link" disabled>
                  {item.label}
                </button>
              );
            }

            return (
              <NavLink
                key={item.label}
                to={item.to}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? "active" : ""}`
                }
              >
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="sidebar-footer">
        <button className="sidebar-link" disabled>
          Configuración
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;