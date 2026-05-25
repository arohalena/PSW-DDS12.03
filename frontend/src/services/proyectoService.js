const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:8090'}/api/proyectos`;

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

export async function getProyectoById(proyectoId) {
  const response = await fetch(`${API_URL}/${proyectoId}`);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "No se pudo cargar el proyecto.");
  }

  return response.json();
}

export async function createProyectoGestionado(data) {
  const response = await fetch(`${API_URL}/gestion`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "No se pudo crear el proyecto.");
  }

  return response.json();
}

export async function updateProyectoGestionado(id, data) {
  const response = await fetch(`${API_URL}/${id}/gestion`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "No se pudo actualizar el proyecto.");
  }

  return response.json();
}

export async function meterProyectoEnEvento(proyectoId, eventoId) {
  const response = await fetch(`${API_URL}/${proyectoId}/evento/${eventoId}`, {
    method: "POST",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "No se pudo meter el proyecto en el evento.");
  }

  return response.json();
}

export async function quitarProyectoDeEvento(proyectoId) {
  const response = await fetch(`${API_URL}/${proyectoId}/evento`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "No se pudo quitar el proyecto del evento.");
  }

  return response.json();
}

export async function deleteProyecto(id) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "No se pudo eliminar el proyecto.");
  }
}

export async function getVistaGestionProyectos() {
  const response = await fetch(`${API_URL}/gestion/vista`);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "No se pudo cargar la vista de gestión.");
  }

  return response.json();
}