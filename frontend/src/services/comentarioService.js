const API_URL = `${'https://psw-dds1203-production.up.railway.app/psw-dds1203-backend-9zd6-production.up.railway.app/' || 'http://localhost:8090'}/api/comentarios`;

export async function getComentariosByProyecto(proyectoId) {

    const response = await fetch(`${API_URL}/proyecto/${proyectoId}`);

    if(!response.ok){

        const errorText = await response.text();
        throw new Error(errorText || "No se han podido cargar los mensajes.");

    }

    return response.json();

}

export async function crearComentario(proyectoId, texto){

    const usuario = JSON.parse(localStorage.getItem("usuarioLogueado"));


    const response = await fetch(API_URL, {
        
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({proyectoId, usuarioId: usuario?.id, texto}),

    });

    if(!response.ok){

        const errorText = await response.text();
        throw new Error(errorText || "No se ha podido enviar el comentario.");

    }

    return response.json();

}