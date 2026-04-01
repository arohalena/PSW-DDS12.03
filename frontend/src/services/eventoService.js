const API_URL = "http://localhost:8090/api/eventos";

export async function getEventos() {
  const response = await fetch(API_URL);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "No se pudieron cargar los eventos");
  }

  return response.json();
}

export async function generarCodigoEvento() {
  const response = await fetch(`${API_URL}/generar-codigo`);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "No se pudo generar el código del evento");
  }

  return response.text();
}

export async function createEvento(evento) {
  const response = await fetch(`${API_URL}/crear`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(evento),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "No se pudo crear el evento");
  }

  return response.json();
}

export async function getEventoByCodigo(codigo) {
  const response = await fetch(`${API_URL}/codigo/${codigo}`);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "No se pudo cargar el evento");
  }

  return response.json();
}