import { getEventoByCodigo } from "../../services/eventoService";
import { getEventAccessStorageKey } from "../../services/sessionService";

import { useRef, useState } from "react";
import {
  Lock,
  ShieldCheck,
  X,
} from "lucide-react";

import { useModalShortcuts } from "../../common/useModalShortcuts";
import "../../styles/events.css";

function getEventCode(evento) {
  return evento.codigoAccesoPublico || evento.codigoAcceso || "";
}

export default function EventAccessModal({ event, onClose, onSuccess }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const formRef = useRef(null);
  const modalRef = useModalShortcuts({
    isOpen: true,
    onClose,
    onSubmit: () => formRef.current?.requestSubmit(),
  });

  async function handleSubmit(e) {
    e.preventDefault();

    if (!code.trim()) return;

    try {
      setChecking(true);
      setError("");

      const expectedCode = getEventCode(event);

      if (expectedCode && code.trim().toUpperCase() === expectedCode.toUpperCase()) {
        localStorage.setItem(getEventAccessStorageKey(event.id), "true");
        onSuccess();
        return;
      }

      const eventoPorCodigo = await getEventoByCodigo(code.trim());

      if (String(eventoPorCodigo.id) === String(event.id)) {
        localStorage.setItem(getEventAccessStorageKey(event.id), "true");
        onSuccess();
        return;
      }

      setError("Código incorrecto. Por favor, verifica e intenta nuevamente.");
    } catch {
      setError("Código incorrecto. Por favor, verifica e intenta nuevamente.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="event-access-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="event-access-modal" ref={modalRef}>
        <div className="event-access-modal-header">
          <div className="event-access-decoration event-access-decoration-one" />
          <div className="event-access-decoration event-access-decoration-two" />

          <div className="event-access-header-content">
            <div className="event-access-title-row">
              <div className="event-access-lock">
                <Lock size={30} />
              </div>

              <div>
                <h2>Acceso Privado</h2>
                <p>{event.nombre}</p>
              </div>
            </div>

            <button className="event-access-close" onClick={onClose} type="button">
              <X size={20} />
            </button>
          </div>
        </div>

        <form className="event-access-modal-body" onSubmit={handleSubmit} ref={formRef}>
          <div className="event-access-info">
            <ShieldCheck size={20} />
            <div>
              <strong>Evento protegido</strong>
              <span>Solicita el código al organizador si aún no lo tienes.</span>
            </div>
          </div>

          <label className="event-access-field">
            <span>Ingresa tu código de acceso</span>
            <input
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError("");
              }}
              placeholder="HACK2026"
              className={error ? "event-access-input input-shake" : "event-access-input"}
              autoFocus
            />
          </label>

          {error ? <div className="event-access-error">{error}</div> : null}

          <div className="event-access-actions">
            <button type="button" className="secondary-btn" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="primary-btn" disabled={!code.trim() || checking}>
              {checking ? "Verificando..." : "Acceder al Evento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}