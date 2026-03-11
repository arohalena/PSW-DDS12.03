const API_URL = "http://localhost:8080/api/usuarios";

export async function getUsuarios() {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error("No se pudieron cargar los usuarios");
  }

  return response.json();
}

export async function createUsuario(usuario) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(usuario),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "No se pudo crear el usuario");
  }

  return response.json();
}