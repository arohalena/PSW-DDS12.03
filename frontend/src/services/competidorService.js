const API_URL = "http://localhost:8090/api/competidores";
const COMPETIDOR_EVENTO_URL = "http://localhost:8090/api/competidor-evento/asignar";

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
    await fetch(COMPETIDOR_EVENTO_URL, {
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