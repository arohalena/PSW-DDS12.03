import { useEffect, useState } from "react";

import "../../styles/projects.css";

export default function CommentProjectModal({ open, onClose, proyecto, relaciones, onSubmit }) {
  const [texto, setTexto] = useState("");
  const [votacionProyectoId, setVotacionProyectoId] = useState("");

  useEffect(() => {
    if (!open) return;

    setTexto("");
    setVotacionProyectoId(relaciones?.[0]?.id || "");
  }, [open, relaciones]);

  if (!open || !proyecto) return null;

  async function submit(e) {
    e.preventDefault();

    try{

      await onSubmit({ texto });
      onClose();

    } catch {
      
    }
  }

  return (
    <div className="project-modal-backdrop">
      <form className="project-modal" onSubmit={submit}>
        <h2>Añadir comentario</h2>
        <p>
          Añade feedback para el proyecto <strong>{proyecto.nombre}</strong>.
        </p>

        {relaciones.length === 0 ? (
          <div className="project-feedback error-box">
            Este proyecto no está asignado a ninguna votación. Primero asígnalo a una votación.
          </div>
        ) : (
          <>
            <label className="project-field">
              <span>Votación</span>
              <select
                value={votacionProyectoId}
                onChange={(e) => setVotacionProyectoId(e.target.value)}
                required
              >
                {relaciones.map((relacion) => (
                  <option key={relacion.id} value={relacion.id}>
                    {relacion.votacion?.tipo} + {relacion.votacion?.modalidad}
                  </option>
                ))}
              </select>
            </label>

            <label className="project-field">
              <span>Comentario</span>
              <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Escribe un comentario o feedback..."
                rows="5"
                required
              />
            </label>
          </>
        )}

        <div className="project-modal-actions">
          <button type="button" className="secondary-btn" onClick={onClose}>
            Cancelar
          </button>

          <button
            type="submit"
            className="primary-btn"
            disabled={!texto.trim()}
          >
            Guardar comentario
          </button>
        </div>
      </form>
    </div>
  );
}