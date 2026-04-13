const API_URL = "http://localhost:8090/api/comentarios";

export async function getComentariosByProyecto(proyectoId) {

    const response = await fetch(`${API_URL}/proyecto/${proyectoId}`);

    if(!response.ok){

        const errorText = await response.text();
        throw new Error(errorText || "No se han podido cargar los mensajes.");

    }

    return response.json();

}

export async function crearComentario(proyectoId, texto){

    const response = await fetch(API_URL, {
        
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({proyectoId, texto}),

    });

    if(!response.ok){

        const errorText = await response.text();
        throw new Error(errorText || "No se ha podido enviar el comentario.");

    }

    return response.json();
    
}