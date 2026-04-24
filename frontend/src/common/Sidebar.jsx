import { useState, useEffect, useMemo } from "react";
import { NavLink } from "react-router-dom";
import { usuarioHasProject } from "../services/usuarioService"; 
import { getUsuarioLogueado } from "../services/sessionService";

const items = [
  { label: "Home", to: "/", disabled: true },
  { label: "Eventos", to: "/eventos" },
  { label: "Equipos", to: "/equipos" },
  { label: "Competidores", to: "/competidores" },
  { label: "Proyectos", to: "/proyectos" },
  { label: "Criterios", to: "/criterios" },
  { label: "Votación", to: "/votar" },
  { label: "Usuarios", to: "/usuarios" },
  { label: "Resultados", to: "/resultados" },
  { label: "Mi Proyecto", to: "/mi-proyecto", private: true },
];

function Sidebar() {
  const [userHasProject, setUserHasProject] = useState(false);

  const usuario = useMemo(() => getUsuarioLogueado(), []);

  useEffect(() => {
    async function verifyProject() {
      const result = await usuarioHasProject(usuario.id);
      console.log("USUARIO" + usuario.id + " HAS PROJECT" + result)
      setUserHasProject(result);
    }

    verifyProject();
  }, [usuario]);

  return (
    <aside className="sidebar">
      <div>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">V</div>
          <span>Votify</span>
        </div>

        <nav className="sidebar-nav">
          {items.map((item) => {
            if (item.private && !userHasProject) {
              return null;
            }

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