import { useEffect, useMemo, useState } from "react";
import { getEventos } from "../../services/eventoService";
import { getProyectos, getProyectosByEvento } from "../../services/proyectoService";
import { getUsuarios } from "../../services/usuarioService";
import {
  getVotacionProyectosByVotacion,
  getVotacionesByEvento,
  getVotosByVotacionProyecto,
} from "../../services/votacionService";
import { getUsuarioLogueado } from "../../services/sessionService";
import "../../styles/dashboard.css";
import "../../styles/dashboard-roles.css";

import DashboardOrganizador from "./DashboardOrganizadorScreen";
import DashboardJurado from "./DashboardJuradoScreen";
import DashboardCompetidor from "./DashboardCompetidorScreen";
import DashboardPublico from "./DashboardPublicoScreen";

const DASHBOARD_EVENTS_CACHE_PREFIX = "votify:dashboard-eventos:";

function readSessionJson(key, fallback) {
  if (!key) return fallback;

  try {
    const cached = sessionStorage.getItem(key);
    return cached ? JSON.parse(cached) : fallback;
  } catch {
    sessionStorage.removeItem(key);
    return fallback;
  }
}

function DashboardScreen() {
  const usuario = useMemo(() => getUsuarioLogueado(), []);
  const rol = usuario?.rol;
  const eventsCacheKey =
    rol === "COMPETIDOR" || rol === "PUBLICO"
      ? `${DASHBOARD_EVENTS_CACHE_PREFIX}${rol}`
      : "";
  const cachedEventos = useMemo(
    () => readSessionJson(eventsCacheKey, []),
    [eventsCacheKey]
  );

  const [eventos, setEventos] = useState(cachedEventos);
  const [proyectos, setProyectos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [juradoEventData, setJuradoEventData] = useState([]);
  const [loading, setLoading] = useState(cachedEventos.length === 0);

  useEffect(() => {
    async function loadData() {
      try {
        if (rol === "ORGANIZADOR") {
          const [evs, projs, users] = await Promise.all([
            getEventos().catch(() => []),
            getProyectos().catch(() => []),
            getUsuarios().catch(() => []),
          ]);
          setEventos(evs);
          setProyectos(projs);
          setUsuarios(users);
          setJuradoEventData([]);
        } else if (rol === "JURADO") {
          const evs = await getEventos().catch(() => []);
          const eventData = await Promise.all(
            evs.map(async (evento) => {
              const [votaciones, proyectosEvento] = await Promise.all([
                getVotacionesByEvento(evento.id).catch(() => []),
                getProyectosByEvento(evento.id).catch(() => []),
              ]);

              const votacionesJurado = (votaciones || []).filter(
                (votacion) => votacion.tipo === "JURADO" || votacion.tipo === "MIXTA"
              );

              const relacionesPorVotacion = await Promise.all(
                votacionesJurado.map(async (votacion) => {
                  const relaciones = await getVotacionProyectosByVotacion(votacion.id).catch(() => []);
                  const relacionesConVotos = await Promise.all(
                    (relaciones || []).map(async (relacion) => ({
                      relacion,
                      votos: await getVotosByVotacionProyecto(relacion.id).catch(() => []),
                    }))
                  );

                  return { votacion, relaciones: relacionesConVotos };
                })
              );

              const evaluacionesUsuario = relacionesPorVotacion.flatMap(({ votacion, relaciones }) =>
                relaciones.flatMap(({ relacion, votos }) =>
                  (votos || [])
                    .filter((voto) => {
                      const votoUsuarioId =
                        voto.usuario?.id ||
                        voto.usuarioId ||
                        voto.votante?.id ||
                        voto.votanteId ||
                        voto.jurado?.id ||
                        voto.juradoId;

                      return usuario?.id && String(votoUsuarioId) === String(usuario.id);
                    })
                    .map((voto) => ({ votacion, relacion, voto }))
                )
              );

              return {
                evento,
                votaciones,
                proyectos: proyectosEvento,
                votacionesJurado,
                relacionesPorVotacion,
                evaluacionesUsuario,
              };
            })
          );

          const eventosJurado = eventData
            .filter(({ votacionesJurado }) => votacionesJurado.length > 0)
            .map(({ evento }) => evento);

          setEventos(eventosJurado);
          setJuradoEventData(eventData);
        } else {
          const evs = await getEventos().catch(() => []);
          setEventos(evs);
          if (eventsCacheKey) {
            sessionStorage.setItem(eventsCacheKey, JSON.stringify(evs));
          }
          setJuradoEventData([]);
        }
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [eventsCacheKey, rol, usuario?.id]);

  if (loading) {
    return <div className="dashboard-loading">Cargando dashboard...</div>;
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
    return <DashboardJurado usuario={usuario} eventos={eventos} eventData={juradoEventData} />;
  }

  if (rol === "COMPETIDOR") {
    return <DashboardCompetidor usuario={usuario} eventos={eventos} />;
  }

  return <DashboardPublico usuario={usuario} eventos={eventos} />;
}

export default DashboardScreen;
