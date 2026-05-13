import { NavLink } from "react-router-dom";
import { Calendar, Folder, Home, Settings, Trophy, Users, Vote } from "lucide-react";

import { useState, useEffect, useMemo } from "react";
import { usuarioHasProject } from "../services/usuarioService"; 
import { getUsuarioLogueado } from "../services/sessionService";
import { Shield } from "lucide-react";


const items = [
  { label: "Inicio", to: "/", icon: Home },
  { label: "Eventos", to: "/eventos", icon: Calendar },
  { label: "Proyectos", to: "/proyectos", icon: Folder },
  { label: "Usuarios", to: "/usuarios", icon: Users },
  { label: "Auditoría", to: "/auditoria", icon: Shield },
  { label: "Mi Proyecto", to: "/configuracion", icon: Trophy, private:true },
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
          <div className="sidebar-logo-icon">
            <Vote size={18} />
          </div>
          <span>Votify</span>
        </div>

        <nav className="sidebar-nav">
          {items.map((item) => {
            const Icon = item.icon;
            
            if (item.private && !userHasProject) {
              return null;
            }

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
    </aside>
  );
}

export default Sidebar;