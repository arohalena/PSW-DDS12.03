import { getUsuarioLogueado } from "./sessionService";

const API_URL = "http://localhost:8090/api/usuarios";

function buildHeaders() {
  const usuario = getUsuarioLogueado();

  return {
    "Content-Type": "application/json",
    "X-User-Role": usuario?.rol || "",
  };
}

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
    headers: buildHeaders(),
    body: JSON.stringify(usuario),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "No se pudo crear el usuario");
  }

  return response.json();
}

export async function updateUsuario(id, usuario) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: buildHeaders(),
    body: JSON.stringify(usuario),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "No se pudo editar el usuario");
  }

  return response.json();
}

export async function deleteUsuario(id) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
    headers: {
      "X-User-Role": getUsuarioLogueado()?.rol || "",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "No se pudo borrar el usuario");
  }
}