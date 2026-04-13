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

export function getVotingToken() {
  const usuario = getUsuarioLogueado();

  if (usuario?.id) {
    return `user-${usuario.id}`;
  }

  if (usuario?.email) {
    return `user-${usuario.email}`;
  }

  const key = "votify_anon_token";
  let token = localStorage.getItem(key);

  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(key, token);
  }

  return token;
}