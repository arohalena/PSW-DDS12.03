const CRITERIOS_URL = "http://localhost:8090/api/criterios";
const PUNTUACIONES_URL = "http://localhost:8090/api/puntuaciones";
const RANKING_URL = "http://localhost:8090/api/ranking";

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
