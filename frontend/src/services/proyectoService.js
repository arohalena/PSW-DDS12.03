const API_URL = "http://localhost:8090/api/proyectos";

export async function getProyectosByEvento(eventoId) {

    const response = await fetch(`${API_URL}/evento/${eventoId}`);

    if(!response.ok) {

        const errorText = await response.text();
        throw new Error(errorText || "No se pudieron cargar los proyectos.");

    }

    return response.json();

}

export async function createProyecto(proyecto) {

    const response = await fetch(`${API_URL}/crear`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(proyecto),
    });

    if(!response.ok) {

        const errorText = await response.text();
        throw new Error(errorText || "No se ha podido crear el proyecto.");

    }

    return response.json();

}

export async function getProyectos() {

    const response = await fetch(API_URL);

    if(!response.ok) {

        const errorText = await response.text();
        throw new Error(errorText || "No se pudieron cargar los proyectos.");

    }

    return response.json();
    
}

export async function createProyectoConEquipo(data){

    const response = await fetch(`${API_URL}/crear-con-equipo`, {
        
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    if(!response.ok){

        const errorText = await response.text();
        throw new Error(errorText || "No se ha podido crear el proyecto.");

    }

    return response.json();
    
}
export async function getMiProyectoDashboard(usuarioId) {
  const response = await fetch(`${API_URL}/usuario/${usuarioId}/dashboard`);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "No se pudo cargar el dashboard del proyecto.");
  }

  return response.json();
}