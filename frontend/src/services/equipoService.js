const API_URL = "http://localhost:8090/api/equipos";
const EVENTOS_URL = "http://localhost:8090/api/eventos";
const PROYECTOS_URL = "http://localhost:8090/api/proyectos";

export async function getEquipos() {
  const response = await fetch(API_URL);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "No se pudieron cargar los equipos");
  }

    console.log("GETEQUIPOSSS ")

    console.log(response)

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

export async function getProyectosParaEquipo() {
  const response = await fetch(PROYECTOS_URL);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "No se pudieron cargar los proyectos");
  }

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