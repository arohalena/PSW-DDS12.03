const API_URL = `${'https://psw-dds1203-production.up.railway.app/psw-dds1203-backend-9zd6-production.up.railway.app/' || 'http://localhost:8090'}/api/equipos`;
const EVENTOS_URL = `${'https://psw-dds1203-production.up.railway.app/psw-dds1203-backend-9zd6-production.up.railway.app/' || 'http://localhost:8090'}/api/eventos`;
const PROYECTOS_URL = `${'https://psw-dds1203-production.up.railway.app/psw-dds1203-backend-9zd6-production.up.railway.app/' || 'http://localhost:8090'}/api/proyectos`;

export async function getEquipos() {
  const response = await fetch(API_URL);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "No se pudieron cargar los equipos");
  }

  return response.json();
}

export async function createEquipo(equipo) {
  const response = await fetch(`${API_URL}/crear`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(equipo),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "No se pudo crear el equipo");
  }

  return response.json();
}

export async function getEventosParaEquipo() {
  const response = await fetch(EVENTOS_URL);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "No se pudieron cargar los eventos");
  }


    console.log("GETEVNTOPARAEQUIPO")

    console.log(response)
  return response.json();
}

export async function getProyectosParaEquipo() {
  const response = await fetch(PROYECTOS_URL);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "No se pudieron cargar los proyectos");
  }

    console.log("GETPROYECTOPARAEQUIPO ")
    console.log(response)
  return response.json();
}

export async function getEquiposParaEvento(eventoId) {
  const response = await fetch(`${API_URL}/evento/${eventoId}`);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "No se pudieron cargar los equipos del evento");
  }

  return response.json();
}

export async function deleteEquipo(id) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });
 
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "No se pudo eliminar el equipo");
  }
}