import { useEffect, useRef, useState } from "react";
import { useModalShortcuts } from "./useModalShortcuts";

function UserModal({ isOpen, onClose, onSubmit, initialData }) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [rol, setRol] = useState("COMPETIDOR");
  const [error, setError] = useState("");

  const isEditMode = Boolean(initialData);

  const formRef = useRef(null);
  const modalRef = useModalShortcuts({
    isOpen,
    onClose,
    onSubmit: () => formRef.current?.requestSubmit(),
  });

  useEffect(() => {
    if (initialData) {
      setNombre(initialData.nombre || "");
      setEmail(initialData.email || "");
      setRol(initialData.rol || "COMPETIDOR");
    } else {
      setNombre("");
      setEmail("");
      setRol("COMPETIDOR");
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!nombre.trim() || !email.trim() || !rol) {
      setError("Completa todos los campos obligatorios.");
      return;
    }

    try {
      await onSubmit({
        nombre: nombre.trim(),
        email: email.trim(),
        rol,
      });

      onClose();
    } catch (err) {
      setError(err.message || "No se pudo guardar el usuario");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" ref={modalRef}>
        <div className="modal-header">
          <h2>{isEditMode ? "Editar Usuario" : "Añadir Nuevo Usuario"}</h2>
          <button className="ghost-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit} ref={formRef}>
          <label>
            Nombre Completo *
            <input
              type="text"
              placeholder="Ej: Juan Pérez"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </label>

          <label>
            Email *
            <input
              type="email"
              placeholder="juan.perez@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label>
            Asignar Rol *
            <select value={rol} onChange={(e) => setRol(e.target.value)}>
              <option value="ORGANIZADOR">Organizador</option>
              <option value="JURADO">Jurado</option>
              <option value="COMPETIDOR">Competidor</option>
              <option value="PUBLICO">Público</option>
              <option value="ESPECTADOR">Espectador</option>
            </select>
          </label>


          {error && <div className="error-box">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="secondary-btn" onClick={onClose}>
              Cancelar
            </button>

            <button type="submit" className="primary-btn">
              {isEditMode ? "Guardar Cambios" : "Añadir Usuario"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UserModal;