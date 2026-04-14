import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Copy, RefreshCw } from "lucide-react";
import { createEvento, generarCodigoEvento } from "../../services/eventoService";
import { esOrganizador } from "../../services/sessionService";
import "../../styles/events.css";

function toOffsetDateTime(dateTimeValue) {
  if (!dateTimeValue) return null;
  return new Date(dateTimeValue).toISOString();
}

function CreateEventScreen() {
  const navigate = useNavigate();
  const puedeGestionarEventos = esOrganizador();
  const [loadingCode, setLoadingCode] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    tipo: "HACKATHON",
    nombre: "",
    descripcion: "",
    codigoAccesoPublico: "",
    fecha_inicio: "",
    fecha_fin: "",
    tipoVotacion: "Evaluación multicriterio",
    numeroCategorias: "1",
    mostrarResultadosTiempoReal: false,
    permitirFeedbackPublico: true,
    permitirVotacionAnonima: false,
  });

  const canSubmit = useMemo(() => {
    return (
      puedeGestionarEventos &&
      formData.nombre.trim() &&
      formData.descripcion.trim() &&
      formData.fecha_inicio &&
      formData.fecha_fin &&
      formData.codigoAccesoPublico
    );
  }, [formData, puedeGestionarEventos]);

  const cargarCodigo = async () => {
    try {
      setLoadingCode(true);
      const codigo = await generarCodigoEvento();
      setFormData((prev) => ({ ...prev, codigoAccesoPublico: codigo }));
    } catch (err) {
      setError(err.message || "No se pudo generar el código del evento");
    } finally {
      setLoadingCode(false);
    }
  };

  useEffect(() => {
    cargarCodigo();
  }, []);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCopyCode = async () => {
    if (!formData.codigoAccesoPublico) return;

    await navigator.clipboard.writeText(formData.codigoAccesoPublico);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      await createEvento({
        tipo: formData.tipo,
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim(),
        codigoAccesoPublico: formData.codigoAccesoPublico,
        fecha_inicio: toOffsetDateTime(formData.fecha_inicio),
        fecha_fin: toOffsetDateTime(formData.fecha_fin),
      });

      setSuccess("Evento creado correctamente.");
      setTimeout(() => navigate("/eventos"), 800);
    } catch (err) {
      setError(err.message || "No se pudo crear el evento");
    } finally {
      setSubmitting(false);
    }
  };

  if (!puedeGestionarEventos) {
    return (
      <main className="events-page">
        <div className="feedback-card warning-box">
          Solo los organizadores pueden crear eventos.
        </div>
      </main>
    );
  }

  return (
    <main className="events-page create-event-page">
      <div className="events-back-link-row">
        <Link to="/eventos" className="back-link">
          <ArrowLeft size={16} />
          Volver a eventos
        </Link>
      </div>

      <header className="events-header create-event-header">
        <div>
          <h1>Crear Nuevo Evento</h1>
          <p>Configura los detalles básicos de tu evento</p>
        </div>
      </header>

      <form className="event-form-card" onSubmit={handleSubmit}>
        <section className="event-form-section">
          <h2>Información General</h2>

          <label className="event-field">
            <span>Tipo de Evento *</span>
            <select name="tipo" value={formData.tipo} onChange={handleChange}>
              <option value="HACKATHON">Hackathon</option>
              <option value="FERIA_INOVACION">Feria de innovación</option>
            </select>
          </label>

          <label className="event-field">
            <span>Nombre del Evento *</span>
            <input
              type="text"
              name="nombre"
              placeholder="Ej: Hackathon Tech Innovation 2026"
              value={formData.nombre}
              onChange={handleChange}
              required
            />
          </label>

          <label className="event-field">
            <span>Descripción *</span>
            <textarea
              name="descripcion"
              rows="4"
              placeholder="Describe el objetivo y las características principales del evento..."
              value={formData.descripcion}
              onChange={handleChange}
              required
            />
          </label>

          <div className="event-grid two-columns">
            <label className="event-field">
              <span>Fecha de Inicio *</span>
              <input
                type="datetime-local"
                name="fecha_inicio"
                value={formData.fecha_inicio}
                onChange={handleChange}
                required
              />
            </label>
            <label className="event-field">
              <span>Fecha de Fin *</span>
              <input
                type="datetime-local"
                name="fecha_fin"
                value={formData.fecha_fin}
                onChange={handleChange}
                required
              />
            </label>
          </div>

          <div className="event-field">
            <span>Código de Acceso</span>
            <div className="code-row">
              <input
                type="text"
                name="codigoAccesoPublico"
                value={formData.codigoAccesoPublico}
                readOnly
                disabled={loadingCode}
                className="code-input"
              />
              <button
                type="button"
                className="secondary-btn icon-btn"
                onClick={cargarCodigo}
                disabled={loadingCode}
              >
                <RefreshCw size={16} />
                Regenerar
              </button>
              <button
                type="button"
                className="secondary-btn icon-btn"
                onClick={handleCopyCode}
                disabled={loadingCode || !formData.codigoAccesoPublico}
              >
                {codeCopied ? <Check size={16} /> : <Copy size={16} />}
                {codeCopied ? "Copiado" : "Copiar"}
              </button>
            </div>
            <p className="field-help-text">
              El código se genera automáticamente para que el público pueda acceder al evento,
              visualizarlo y votar cuando se habilite.
            </p>
          </div>
        </section>

        <section className="event-form-section event-form-section-disabled">
          <h2>Configuración de Votación</h2>
          <p className="field-help-text section-note">
            Estos campos aparecen en el mockup, pero quedan deshabilitados hasta completar la
            siguiente iteración del proyecto.
          </p>

          <label className="event-field">
            <span>Tipo de Votación</span>
            <select name="tipoVotacion" value={formData.tipoVotacion} disabled>
              <option>Evaluación multicriterio</option>
            </select>
          </label>

          <label className="event-field">
            <span>Número de Categorías</span>
            <input type="number" value={formData.numeroCategorias} disabled />
          </label>

          <label className="event-checkbox-row disabled-row">
            <input type="checkbox" checked={formData.mostrarResultadosTiempoReal} disabled readOnly />
            <div>
              <strong>Mostrar resultados en tiempo real</strong>
              <span>Los participantes podrán ver el ranking actualizado durante la votación.</span>
            </div>
          </label>

          <label className="event-checkbox-row disabled-row">
            <input type="checkbox" checked={formData.permitirFeedbackPublico} disabled readOnly />
            <div>
              <strong>Permitir feedback público</strong>
              <span>Los comentarios del jurado podrán ser visibles para los participantes.</span>
            </div>
          </label>

          <label className="event-checkbox-row disabled-row">
            <input type="checkbox" checked={formData.permitirVotacionAnonima} disabled readOnly />
            <div>
              <strong>Permitir votación anónima</strong>
              <span>Los votantes no verán quién emitió cada evaluación.</span>
            </div>
          </label>
        </section>

        {error && <div className="feedback-card error-box">{error}</div>}
        {success && <div className="feedback-card success-box">{success}</div>}

        <div className="event-form-actions">
          <Link to="/eventos" className="secondary-btn">
            Cancelar
          </Link>
          <div className="event-form-actions-right">
            <button type="button" className="secondary-btn" disabled>
              Guardar como Borrador
            </button>
            <button type="submit" className="primary-btn" disabled={!canSubmit || submitting}>
              {submitting ? "Creando..." : "Crear Evento"}
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}

export default CreateEventScreen;