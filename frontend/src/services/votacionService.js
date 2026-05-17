const VOTACIONES_URL = "http://localhost:8090/api/votaciones";
const VOTACION_PROYECTOS_URL = "http://localhost:8090/api/votacion-proyectos";
const VOTOS_URL = "http://localhost:8090/api/votos";
const COMPETIDOR_EVENTO_URL = "http://localhost:8090/api/competidor-evento";

export async function getVotacionesByEvento(eventoId) {
  const response = await fetch(`${VOTACIONES_URL}/evento/${eventoId}`);
  if (!response.ok) throw new Error("No se pudieron cargar las votaciones");
  return response.json();
}

export async function createVotacion(votacion) {
  const payload = {
    eventoId: votacion.eventoId || votacion.evento?.id,
    nombre: votacion.nombre,
    tipo: votacion.tipo,
    modalidad: votacion.modalidad,
    estado: votacion.estado || "ABIERTA",
    maxSelecciones: Number(votacion.maxSelecciones || 1),
    inicio: votacion.inicio || null,
    fin: votacion.fin || null,
    comentariosActivos: votacion.comentariosActivos,
    comentarioObligatorio: votacion.comentariosActivos ? votacion.comentarioObligatorio : false,
    criterios: votacion.criterios || [],
    pesoPorcentajePopular: votacion.pesoPorcentajePopular ?? null,
    pesoPorcentajeJurado:  votacion.pesoPorcentajeJurado  ?? null,
  };

  const response = await fetch(VOTACIONES_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "No se pudo crear la votación");
  }

  return response.json();
}

export async function getVotacionProyectosByVotacion(votacionId) {
  const response = await fetch(`${VOTACION_PROYECTOS_URL}/votacion/${votacionId}`);
  if (!response.ok) throw new Error("No se pudieron cargar los proyectos de la votación");
  return response.json();
}

export async function asignarProyectoAVotacion(votacionId, proyectoId) {
  const response = await fetch(VOTACION_PROYECTOS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      votacion: { id: votacionId },
      proyecto: { id: proyectoId },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "No se pudo asignar el proyecto a la votación");
  }

  return response.json();
}

export async function getConteoVotos(votacionProyectoId) {
  const response = await fetch(`${VOTOS_URL}/votacion-proyecto/${votacionProyectoId}/count`);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "No se pudo cargar el conteo de votos");
  }
  return response.json();
}

export async function yaHaVotadoProyecto(votacionProyectoId, token) {
  const response = await fetch(
    `${VOTOS_URL}/votacion-proyecto/${votacionProyectoId}/ya-votado?token=${encodeURIComponent(token)}`
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "No se pudo comprobar si ya había votado");
  }

  return response.json();
}

export async function haAlcanzadoMaximoVotacion(votacionId, token) {
  const response = await fetch(
    `${VOTOS_URL}/votacion/${votacionId}/ha-alcanzado-maximo?token=${encodeURIComponent(token)}`
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "No se pudo comprobar el máximo de votos");
  }

  return response.json();
}

export async function getAsignacionesCompetidorEvento(eventoId) {
  const response = await fetch(`${COMPETIDOR_EVENTO_URL}/evento/${eventoId}`);
  if (!response.ok) throw new Error("No se pudieron cargar los miembros del equipo");
  return response.json();
}

export async function getCriteriosByVotacion(votacionId) {
  const response = await fetch(`${VOTACIONES_URL}/${votacionId}/criterios`);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "No se pudieron cargar los criterios");
  }
  return response.json();
}

export async function getVotantesPorEvento(eventoId) {
  const response = await fetch(`${VOTOS_URL}/evento/${eventoId}/votantes`);
  if (!response.ok) {
    return 0;
  }
  return response.json();
}

export async function abrirVotacion(id) {

  const r = await fetch(`${VOTACIONES_URL}/${id}/abrir`, { method: "POST" });

  if (!r.ok){

    throw new Error((await r.text()) || "No se pudo abrir la votación");

  }

  return r.json();

}

export async function pausarVotacion(id) {

  const r = await fetch(`${VOTACIONES_URL}/${id}/pausar`, { method: "POST" });

  if (!r.ok){

    throw new Error((await r.text()) || "No se pudo pausar la votación");

  }

  return r.json();

}

export async function reanudarVotacion(id) {

  const r = await fetch(`${VOTACIONES_URL}/${id}/reanudar`, { method: "POST" });

  if (!r.ok){
    
    throw new Error((await r.text()) || "No se pudo reanudar la votación");

  }

  return r.json();

}

export async function cerrarVotacion(id) {

  const r = await fetch(`${VOTACIONES_URL}/${id}/cerrar`, { method: "POST" });

  if (!r.ok){
    
    throw new Error((await r.text()) || "No se pudo cerrar la votación");
  
  }
  
  return r.json();
}

export async function deleteVotacion(id) {
  const response = await fetch(`${VOTACIONES_URL}/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "No se pudo eliminar la votación");
  }
}

async function extraerMensajeError(response, fallback) {
  const texto = await response.text();
  try {
    const json = JSON.parse(texto);
    return json.message || json.error || fallback;
  } catch {
    return texto || fallback;
  }
}

export async function votarProyectoSimple(votacionProyectoId, anonTokenHash, comentario, usuarioId) {
  const response = await fetch(`${VOTOS_URL}/simple`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      votacionProyectoId,
      anonTokenHash,
      usuarioId,
      comentario,
    }),
  });

  if (!response.ok) {
    throw new Error(await extraerMensajeError(response, "No se pudo registrar el voto"));
  }

  return response.json();
}

export async function votarProyectoMulticriterio(payload) {
  const response = await fetch(`${VOTOS_URL}/multicriterio`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await extraerMensajeError(response, "No se pudo registrar la evaluación"));
  }

  return response.json();
}

export async function votarProyectoPuntos(payload) {
  const response = await fetch(`${VOTOS_URL}/puntos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await extraerMensajeError(response, "No se pudo registrar el voto por puntos"));
  }

  return response.json();
}

export async function getVotacionProyectosByProyecto(proyectoId) {
  const response = await fetch(`${VOTACION_PROYECTOS_URL}/proyecto/${proyectoId}`);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "No se pudieron cargar las votaciones del proyecto.");
  }

  return response.json();
}

export async function deleteVotacionProyecto(id) {
  const response = await fetch(`${VOTACION_PROYECTOS_URL}/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "No se pudo quitar el proyecto de la votación.");
  }
}