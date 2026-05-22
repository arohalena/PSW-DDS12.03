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

export function esJurado() {
  const usuario = getUsuarioLogueado();
  return usuario?.rol === "JURADO";
}

export function esCompetidor() {
  const usuario = getUsuarioLogueado();
  return usuario?.rol === "COMPETIDOR";
}

export function esPublico() {
  const usuario = getUsuarioLogueado();
  return usuario?.rol === "PUBLICO" || usuario?.rol === "ESPECTADOR";
}

export function getRolUsuario() {
  return getUsuarioLogueado()?.rol || null;
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

export function getEventAccessStorageKey(eventoId) {
  return `votify_event_access_${getVotingToken()}_${eventoId}`;
}