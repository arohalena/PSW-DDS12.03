const API_URL = `${'https://psw-dds1203-production.up.railway.app/psw-dds1203-backend-9zd6-production.up.railway.app/' || 'http://localhost:8090'}/api/competidores`;
const COMPETIDOR_EVENTO_URL = `${'https://psw-dds1203-production.up.railway.app/psw-dds1203-backend-9zd6-production.up.railway.app/' || 'http://localhost:8090'}/api/competidor-evento`;

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
    const response = await fetch(`${COMPETIDOR_EVENTO_URL}/asignar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(datos),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "No se pudo asignar el competidor");
    }
  } catch(error) {  
    throw new Error(error.message || "No se pudo asignar el competidor");
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

export async function deleteCompetidor(id) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });
 
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "No se pudo eliminar el competidor");
  }
}
