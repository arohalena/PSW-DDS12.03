const API_URL = "http://localhost:8090/api/competidores";
const COMPETIDOR_EVENTO_URL = "http://localhost:8090/api/competidor-evento";

export async function getCompetidores() {
  const response = await fetch(API_URL);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "No se pudieron cargar los competidores");
  }

  return response.json();
}

export async function createCompetidor(competidor) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(competidor),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "No se pudo crear el competidor");
  }

  return response.json();
}

export async function assignCompetidor(datos) {
  try { 
    await fetch(`${COMPETIDOR_EVENTO_URL}/asignar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(datos),
    });
  } catch(error) {  
    throw new Error(error || "No se pudo asignar el competidor");
  }
}

export async function getCompetidoresByEquipo(equipoId) {
  const response = await fetch(`${COMPETIDOR_EVENTO_URL}/competidores/${equipoId}`);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "No se pudieron cargar los competidores del equipo");
  }

  return response.json();
}

export async function deleteAsignacionCompetidor(asignacionId) {
  const response = await fetch(`${COMPETIDOR_EVENTO_URL}/${asignacionId}`, {
    method: "DELETE",
  });

  if (!response.ok) throw new Error(await response.text() || "No se pudo quitar el competidor del equipo");
}
