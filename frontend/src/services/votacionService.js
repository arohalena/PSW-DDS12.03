const VOTACIONES_URL = "http://localhost:8090/api/votaciones";
const VOTACION_PROYECTOS_URL = "http://localhost:8090/api/votacion-proyectos";
const VOTOS_URL = "http://localhost:8090/api/votos";
const COMPETIDOR_EVENTO_URL = "http://localhost:8090/api/competidor-evento";

export async function getVotacionesByEvento(eventoId) {
  const response = await fetch(`${VOTACIONES_URL}/evento/${eventoId}`);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "No se pudieron cargar las votaciones");
  }

  return response.json();
}

export async function getVotacionProyectosByVotacion(votacionId) {
  const response = await fetch(`${VOTACION_PROYECTOS_URL}/votacion/${votacionId}`);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "No se pudieron cargar los proyectos de la votación");
  }

  return response.json();
}

export async function votarProyecto(votacionProyectoId, anonTokenHash) {
  const response = await fetch(VOTOS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      votacionProyecto: { id: votacionProyectoId },
      anonTokenHash,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "No se pudo registrar el voto");
  }

  return response.json();
}

export async function getAsignacionesCompetidorEvento(eventoId) {
  const response = await fetch(`${COMPETIDOR_EVENTO_URL}/evento/${eventoId}`);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "No se pudieron cargar los miembros de los equipos");
  }

  return response.json();
}

export function getAnonVotingToken() {
  const key = "votify_anon_token";

  let token = localStorage.getItem(key);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(key, token);
  }

  return token;
}