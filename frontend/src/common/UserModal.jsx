import { useState } from "react";

function UserModal({ isOpen, onClose, onCreate }) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [rol, setRol] = useState("PARTICIPANTE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!nombre.trim() || !email.trim() || !rol) {
      setError("Completa todos los campos obligatorios.");
      return;
    }

    try {
      setLoading(true);

      await onCreate({
        nombre: nombre.trim(),
        email: email.trim(),
        password: "1234",
        rol,
      });

      setNombre("");
      setEmail("");
      setRol("PARTICIPANTE");
      onClose();
    } catch (err) {
      setError(err.message || "No se pudo crear el usuario");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h2>Añadir Nuevo Usuario</h2>
          <button className="ghost-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <label>
            Nombre completo *
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
            Asignar rol *
            <select value={rol} onChange={(e) => setRol(e.target.value)}>
              <option value="ORGANIZADOR">Organizador</option>
              <option value="JURADO">Jurado</option>
              <option value="PARTICIPANTE">Participante</option>
              <option value="PUBLICO">Público</option>
              <option value="ESPECTADOR">Espectador</option>
            </select>
          </label>

          <div className="permissions-box">
            <strong>Permisos adicionales</strong>
            <label className="checkbox-line">
              <input type="checkbox" disabled />
              Puede editar proyectos
            </label>
            <label className="checkbox-line">
              <input type="checkbox" disabled />
              Puede ver resultados anticipados
            </label>

            <p className="helper-text">
              Estos permisos son visuales por ahora. En tu backend actual solo se persiste el rol.
            </p>
          </div>

          {error && <div className="error-box">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="secondary-btn" onClick={onClose}>
              Cancelar
            </button>

            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? "Guardando..." : "Añadir Usuario"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UserModal;