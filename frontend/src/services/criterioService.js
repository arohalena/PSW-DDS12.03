const CRITERIOS_URL = `${'https://psw-dds1203-backend-9zd6-production.up.railway.app' || 'http://localhost:8090'}/api/criterios`;
const PUNTUACIONES_URL = `${'https://psw-dds1203-backend-9zd6-production.up.railway.app' || 'http://localhost:8090'}/api/puntuaciones`;
const RANKING_URL = `${'https://psw-dds1203-backend-9zd6-production.up.railway.app' || 'http://localhost:8090'}/api/ranking`;

export async function getCriteriosByEvento(eventoId){

  const response = await fetch(`${CRITERIOS_URL}/evento/${eventoId}`);

  if (!response.ok){

    throw new Error("No se pudieron cargar los criterios");

  }

  return response.json();

}

export async function createCriterio(criterio){

  const response = await fetch(CRITERIOS_URL, {

    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(criterio),

  });

  if (!response.ok){

    const errorText = await response.text();

    throw new Error(errorText || "No se pudo crear el criterio");

  }

  return response.json();

}

export async function updateCriterio(id, criterio){

  const response = await fetch(`${CRITERIOS_URL}/${id}`, {

    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(criterio),

  });

  if (!response.ok){

    const errorText = await response.text();

    throw new Error(errorText || "No se pudo actualizar el criterio");

  }

  return response.json();

}

export async function deleteCriterio(id){

  const response = await fetch(`${CRITERIOS_URL}/${id}`, { method: "DELETE" });

  if (!response.ok){

    throw new Error("No se pudo eliminar el criterio");

  }

}

export async function deleteAllCriteriosByEvento(eventoId){

  const response = await fetch(`${CRITERIOS_URL}/evento/${eventoId}`, { method: "DELETE" });

  if (!response.ok){
    throw new Error("No se pudieron eliminar los criterios");
  }

}

export async function puntuarCriterio(puntuacion){

  const response = await fetch(PUNTUACIONES_URL, {

    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(puntuacion),

  });

  if (!response.ok){

    const errorText = await response.text();

    throw new Error(errorText || "No se pudo registrar la puntuación");

  }

  return response.json();

}

export async function getPuntuacionesByVP(votacionProyectoId){

  const response = await fetch(`${PUNTUACIONES_URL}/votacion-proyecto/${votacionProyectoId}`);

  if (!response.ok){
    throw new Error("No se pudieron cargar las puntuaciones");
  }

  return response.json();

}

export async function getRanking(eventoId, votacionId){

  const response = await fetch(`${RANKING_URL}/evento/${eventoId}/votacion/${votacionId}`);

  if (!response.ok){

    throw new Error("No se pudo cargar el ranking");

  }

  return response.json();

}

export async function cambiarModoRanking(eventoId, votacionId, usuarioId, modo){

  const response = await fetch(`${RANKING_URL}/evento/${eventoId}/votacion/${votacionId}/modo`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usuarioId, modo }),
  });

  if (!response.ok){
    const errorText = await response.text();
    throw new Error(errorText || "No se pudo cambiar el modo de ranking");
  }

}

export async function guardarOrdenRanking(eventoId, votacionId, usuarioId, posiciones){

  const response = await fetch(`${RANKING_URL}/evento/${eventoId}/votacion/${votacionId}/orden`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usuarioId, posiciones }),
  });

  if (!response.ok){
    const errorText = await response.text();
    throw new Error(errorText || "No se pudo guardar el orden manual");
  }

}

export async function getPlantillasCriterios(){

  const response = await fetch(`${CRITERIOS_URL}/plantillas`);

  if (!response.ok){

    throw new Error("No se pudieron cargar las plantillas de criterios");

  }

  return response.json();

}

export async function sugerirPlantillaCriterios(descripcion, tipoEvento){

  const params = new URLSearchParams();

  if (descripcion) params.append("descripcion", descripcion);
  if (tipoEvento)  params.append("tipoEvento", tipoEvento);

  const response = await fetch(`${CRITERIOS_URL}/plantillas/sugerencia?${params}`);

  if (!response.ok){

    throw new Error("No se pudo obtener la sugerencia");

  }

  return response.json();

}