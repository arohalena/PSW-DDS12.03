const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:8090'}/api/material`;

export const uploadFiles = async (files, proyectoId = null) => {
  if (!Array.isArray(files) || files.length === 0) {
    throw new Error('Debes seleccionar al menos un archivo.');
  }

  if (!proyectoId) {
    throw new Error('Debes indicar el proyecto para guardar el material.');
  }

  const formData = new FormData();

  files.forEach((file) => {
    formData.append('files', file);
  });

  formData.append('proyectoId', proyectoId);
  
  try {
    const response = await fetch(`${API_URL}/subida`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error en la subida al servidor');
    }

    const data = await response.json();
    const uploadedItems = Array.isArray(data) ? data : [data];

    return uploadedItems.map((item) => ({
      id: item.id,
      nombre: item.nombre,
      rutaFichero: item.rutaFichero,
      tipoMime: item.tipoMime,
      tamanyo: item.tamanyo,
    }));
  } catch (error) {
    console.error("Error en uploadFiles:", error);
    throw error;
  }
};

export const getMaterialesByProyecto = async (proyectoId) => {
  if (!proyectoId) {
    throw new Error('El proyecto es requerido.');
  }

  try {
    const response = await fetch(`${API_URL}/proyecto/${proyectoId}`);
    if (!response.ok) {
      throw new Error('Error al cargar materiales');
    }

    return await response.json();
  } catch (error) {
    console.error("Error en getMaterialesByProyecto:", error);
    throw error;
  }
};

export const descargarMaterial = (materialId) => {
  if (!materialId) {
    throw new Error('El ID del material es requerido.');
  }

  return `${API_URL}/${materialId}/descargar`;
};
