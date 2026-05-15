const API_URL = "http://localhost:8090/api/auth";

export async function loginUsuario(credentials) {
  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "No se pudo iniciar sesión");
  }

  return response.json();
}

export async function registerUsuario(data) {
  const response = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    const err = new Error("No se pudo registrar el usuario");
    err.fieldErrors = payload && typeof payload === "object" ? payload : {};
    throw err;
  }

  return response.json();
}