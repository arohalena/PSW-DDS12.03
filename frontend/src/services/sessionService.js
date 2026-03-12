export function getUsuarioLogueado() {
  const data = localStorage.getItem("usuarioLogueado");
  return data ? JSON.parse(data) : null;
}

export function cerrarSesion() {
  localStorage.removeItem("usuarioLogueado");
}

export function esOrganizador() {
  const usuario = getUsuarioLogueado();
  return usuario?.rol === "ORGANIZADOR";
}