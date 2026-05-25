const API_URL = `${'https://psw-dds1203-backend-9zd6-production.up.railway.app' || 'http://localhost:8090'}/api/auditoria`;

export async function getRegistrosPorEvento(eventoId, votacionId = null) {
  const url = votacionId
    ? `${API_URL}/eventos/${eventoId}/registros?votacionId=${votacionId}`
    : `${API_URL}/eventos/${eventoId}/registros`;

  const response = await fetch(url);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "No se pudieron cargar los registros de auditoría");
  }
  return response.json();
}

export async function getIntegridadVotacion(votacionId) {
  const response = await fetch(`${API_URL}/votaciones/${votacionId}/integridad`);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "No se pudo comprobar la integridad");
  }
  return response.json();
}