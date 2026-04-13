const API_URL = "http://localhost:8090/api/equipos";
const EVENTOS_URL = "http://localhost:8090/api/eventos";
const PROYECTOS_URL = "http://localhost:8090/api/proyectos";

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