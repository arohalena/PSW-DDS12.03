// ─── Utilidades compartidas entre todas las vistas de dashboard ───────────────

export function formatDate(dateValue) {
  if (!dateValue) return "Sin fecha";
  return new Date(dateValue).toLocaleDateString("es-ES");
}

export function isActiveEvent(evento) {
  const fin = evento.fecha_fin || evento.fechaFin || evento.fin;
  if (!fin) return true;
  return new Date(fin) >= new Date();
}

export function getEventoFechaInicio(evento) {
  return evento.fecha_inicio || evento.fechaInicio || evento.inicio;
}

export function getEventoFechaFin(evento) {
  return evento.fecha_fin || evento.fechaFin || evento.fin;
}