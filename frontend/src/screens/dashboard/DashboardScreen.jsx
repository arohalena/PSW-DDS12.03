import { useEffect, useMemo, useState } from "react";
import { getEventos }    from "../../services/eventoService";
import { getProyectos }  from "../../services/proyectoService";
import { getUsuarios }   from "../../services/usuarioService";
import { getUsuarioLogueado } from "../../services/sessionService";
import "../../styles/dashboard.css";
import "../../styles/dashboard-roles.css";

import DashboardOrganizador from "./DashboardOrganizadorScreen";
import DashboardJurado      from "./DashboardJuradoScreen";
import DashboardCompetidor  from "./DashboardCompetidorScreen";
import DashboardPublico     from "./DashboardPublicoScreen";

function DashboardScreen() {
  const [eventos,   setEventos]   = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [usuarios,  setUsuarios]  = useState([]);
  const [loading,   setLoading]   = useState(true);

  const usuario = useMemo(() => getUsuarioLogueado(), []);
  const rol = usuario?.rol;

  useEffect(() => {
    async function loadData() {
      try {
        const [evs, projs, users] = await Promise.all([
          getEventos().catch(() => []),
          getProyectos().catch(() => []),
          getUsuarios().catch(() => []),
        ]);
        setEventos(evs);
        setProyectos(projs);
        setUsuarios(users);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <div className="dashboard-loading">Cargando dashboard…</div>;
  }

  if (rol === "ORGANIZADOR") {
    return (
      <DashboardOrganizador
        usuario={usuario}
        eventos={eventos}
        proyectos={proyectos}
        usuarios={usuarios}
      />
    );
  }

  if (rol === "JURADO") {
    return <DashboardJurado usuario={usuario} eventos={eventos} />;
  }

  if (rol === "COMPETIDOR") {
    return <DashboardCompetidor usuario={usuario} eventos={eventos} />;
  }

  return <DashboardPublico usuario={usuario} eventos={eventos} />;
}

export default DashboardScreen;