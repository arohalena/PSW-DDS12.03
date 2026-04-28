import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BarChart3,
  Check,
  Copy,
  Plus,
  Trash2,
  Vote,
} from "lucide-react";
import { createEvento, generarCodigoEvento } from "../../services/eventoService";
import { createVotacion } from "../../services/votacionService";
import { esOrganizador } from "../../services/sessionService";
import "../../styles/events.css";

const tiposVotacion = [
  { value: "POPULAR", label: "Popular" },
  { value: "JURADO", label: "Jurado" },
];

const modalidades = [
  { value: "SIMPLE", label: "Simple", description: "Voto directo a un proyecto." },
  { value: "PUNTOS", label: "Puntos", description: "Puntuación directa de 1 a 10." },
  { value: "MULTICRITERIO", label: "Multicriterio", description: "Evaluación por criterios sin ponderación." },
  { value: "MULTICRITERIO_PONDERADA", label: "Multicriterio ponderada", description: "Evaluación por criterios con pesos." },
];

function toOffsetDateTime(value) {
  if (!value) return null;
  return new Date(value).toISOString();
}

function needsCriteria(modalidad) {
  return modalidad === "MULTICRITERIO" || modalidad === "MULTICRITERIO_PONDERADA";
}

function createDefaultCriteria(modalidad) {
  if (!needsCriteria(modalidad)) return [];

  return [
    {
      id: crypto.randomUUID(),
      nombre: "Innovación",
      descripcion: "Originalidad y creatividad de la solución.",
      peso: modalidad === "MULTICRITERIO_PONDERADA" ? 40 : null,
      escalaMin: 1,
      escalaMax: 5,
      orden: 0,
    },
    {
      id: crypto.randomUUID(),
      nombre: "Impacto",
      descripcion: "Valor aportado y utilidad para usuarios.",
      peso: modalidad === "MULTICRITERIO_PONDERADA" ? 30 : null,
      escalaMin: 1,
      escalaMax: 5,
      orden: 1,
    },
    {
      id: crypto.randomUUID(),
      nombre: "Presentación",
      descripcion: "Claridad de la demo y defensa.",
      peso: modalidad === "MULTICRITERIO_PONDERADA" ? 30 : null,
      escalaMin: 1,
      escalaMax: 5,
      orden: 2,
    },
  ];
}

function createVotingConfig() {
  return {
    id: crypto.randomUUID(),
    nombre: "Nueva votación",
    tipo: "POPULAR",
    modalidad: "SIMPLE",
    maxSelecciones: 1,
    criteria: [],
  };
}

function CreateEventScreen() {
  const navigate = useNavigate();
  const puedeGestionarEventos = esOrganizador();

  const [codeCopied, setCodeCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    tipo: "HACKATHON",
    nombre: "",
    descripcion: "",
    codigoAccesoPublico: "",
    usaCodigoAcceso: true,
    fecha_inicio: "",
    fecha_fin: "",
    autoVotacion: false,
  });

  const [votingConfigs, setVotingConfigs] = useState([]);

  useEffect(() => {
  if (!formData.usaCodigoAcceso) return;

  generarCodigoEvento()
    .then((codigo) => {
      setFormData((prev) => ({ ...prev, codigoAccesoPublico: codigo }));
    })
    .catch(() => {});
}, [formData.usaCodigoAcceso]);

  const canSubmit = useMemo(() => {
    return (
      puedeGestionarEventos &&
      formData.nombre.trim() &&
      formData.descripcion.trim() &&
      formData.fecha_inicio &&
      formData.fecha_fin
    );
  }, [formData, puedeGestionarEventos]);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleRegenerateCode() {
    try {
      const codigo = await generarCodigoEvento();
      setFormData((prev) => ({ ...prev, codigoAccesoPublico: codigo }));
    } catch {
      setError("No se pudo generar un código nuevo.");
    }
  }

  function handleCopyCode() {
    navigator.clipboard.writeText(formData.codigoAccesoPublico);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 1500);
  }

  function addVotingConfig() {
    setVotingConfigs((prev) => [...prev, createVotingConfig()]);
  }

  function removeVotingConfig(id) {
    setVotingConfigs((prev) => prev.filter((config) => config.id !== id));
  }

  function updateVotingConfig(id, updates) {
    setVotingConfigs((prev) =>
      prev.map((config) => {
        if (config.id !== id) return config;

        const nextModalidad = updates.modalidad || config.modalidad;
        const modalidadChanged = updates.modalidad && updates.modalidad !== config.modalidad;

        return {
          ...config,
          ...updates,
          criteria: modalidadChanged ? createDefaultCriteria(nextModalidad) : updates.criteria || config.criteria,
        };
      })
    );
  }

  function updateCriterion(votingId, criterionId, updates) {
    setVotingConfigs((prev) =>
      prev.map((config) => {
        if (config.id !== votingId) return config;

        return {
          ...config,
          criteria: config.criteria.map((criterion) =>
            criterion.id === criterionId ? { ...criterion, ...updates } : criterion
          ),
        };
      })
    );
  }

  function addCriterion(votingId) {
    setVotingConfigs((prev) =>
      prev.map((config) => {
        if (config.id !== votingId) return config;

        return {
          ...config,
          criteria: [
            ...config.criteria,
            {
              id: crypto.randomUUID(),
              nombre: "",
              descripcion: "",
              peso: config.modalidad === "MULTICRITERIO_PONDERADA" ? 0 : null,
              escalaMin: 1,
              escalaMax: 5,
              orden: config.criteria.length,
            },
          ],
        };
      })
    );
  }

  function removeCriterion(votingId, criterionId) {
    setVotingConfigs((prev) =>
      prev.map((config) => {
        if (config.id !== votingId) return config;

        return {
          ...config,
          criteria: config.criteria.filter((criterion) => criterion.id !== criterionId),
        };
      })
    );
  }

  function validate() {
    for (const config of votingConfigs) {
      if (!config.nombre.trim()) {
        return "Todas las votaciones deben tener nombre.";
      }

      if (needsCriteria(config.modalidad)) {
        const validCriteria = config.criteria.filter((criterion) => criterion.nombre.trim());

        if (validCriteria.length === 0) {
          return `La votación "${config.nombre}" necesita al menos un criterio.`;
        }

        if (config.modalidad === "MULTICRITERIO_PONDERADA") {
          const total = validCriteria.reduce((sum, criterion) => sum + Number(criterion.peso || 0), 0);

          if (total !== 100) {
            return `La votación "${config.nombre}" es ponderada y sus pesos deben sumar 100%. Ahora suman ${total}%.`;
          }
        }
      }
    }

    return "";
  }

  async function handleSubmit(event) {
  event.preventDefault();

  const validationError = validate();

  if (validationError) {
    setError(validationError);
    return;
  }

  try {
    setSubmitting(true);
    setError("");

    const eventoCreado = await createEvento({
      tipo: formData.tipo,
      nombre: formData.nombre.trim(),
      descripcion: formData.descripcion.trim(),
      codigoAccesoPublico: formData.usaCodigoAcceso ? formData.codigoAccesoPublico.trim() : null,
      fecha_inicio: toOffsetDateTime(formData.fecha_inicio),
      fecha_fin: toOffsetDateTime(formData.fecha_fin),
      autoVotacion: formData.autoVotacion,
    });

    for (const config of votingConfigs) {
      await createVotacion({
        eventoId: eventoCreado.id,
        tipo: config.tipo,
        modalidad: config.modalidad,
        estado: "ABIERTA",
        maxSelecciones: Number(config.maxSelecciones || 1),
        inicio: toOffsetDateTime(formData.fecha_inicio),
        fin: toOffsetDateTime(formData.fecha_fin),
        criterios: needsCriteria(config.modalidad)
          ? config.criteria
              .filter((criterion) => criterion.nombre.trim())
              .map((criterion, index) => ({
                nombre: criterion.nombre.trim(),
                descripcion: criterion.descripcion?.trim() || "",
                peso: config.modalidad === "MULTICRITERIO_PONDERADA"
                  ? Number(criterion.peso || 0)
                  : null,
                escalaMin: 1,
                escalaMax: 5,
                orden: index,
              }))
          : [],
      });
    }

    navigate("/eventos");
  } catch (err) {
    const message = err.message || "No se pudo crear el evento";

    if (message.includes("409") || message.includes("código")) {
      setError(
        "Ya existe un evento con ese código de acceso. Pulsa “Regenerar” y vuelve a crear el evento."
      );
    } else {
      setError(message);
    }
  } finally {
    setSubmitting(false);
  }
}

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
    <main className="events-page create-event-mock-page">
      <header className="events-header">
        <div>
          <Link className="back-link" to="/eventos">
            <ArrowLeft size={16} />
            Volver a eventos
          </Link>
          <h1>Crear Nuevo Evento</h1>
          <p>Configura el evento y todas sus formas de evaluación.</p>
        </div>
      </header>

      <form className="create-event-layout" onSubmit={handleSubmit}>
        <section className="event-form-card">
          <div className="event-form-section">
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
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej: Hackathon Tech Innovation 2026"
                required
              />
            </label>

            <label className="event-field">
              <span>Descripción *</span>
              <textarea
                name="descripcion"
                rows="4"
                value={formData.descripcion}
                onChange={handleChange}
                placeholder="Describe el objetivo del evento..."
                required
              />
            </label>

            <div className="event-grid two-columns">
              <label className="event-field">
                <span>Fecha y hora de inicio *</span>
                <input
                  type="datetime-local"
                  name="fecha_inicio"
                  value={formData.fecha_inicio}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="event-field">
                <span>Fecha y hora de fin *</span>
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
                <span>Acceso al evento</span>

      <label className="event-checkbox-row compact-checkbox">
        <input
        type="checkbox"
        name="usaCodigoAcceso"
        checked={formData.usaCodigoAcceso}
        onChange={(event) => {
        const checked = event.target.checked;

        setFormData((prev) => ({
          ...prev,
          usaCodigoAcceso: checked,
          codigoAccesoPublico: checked ? prev.codigoAccesoPublico : "",
        }));
      }}
    />
    <div>
      <strong>Usar código de acceso privado</strong>
      <span>
        Si está activado, el evento aparecerá como privado y pedirá código.
      </span>
    </div>
  </label>

  {formData.usaCodigoAcceso ? (
    <>
      <div className="code-row">
        <input
          className="code-input"
          name="codigoAccesoPublico"
          value={formData.codigoAccesoPublico}
          onChange={handleChange}
          placeholder="Ej: HACK2026"
        />

        <button type="button" className="secondary-btn icon-btn" onClick={handleRegenerateCode}>
          Regenerar
        </button>

        <button type="button" className="secondary-btn icon-btn" onClick={handleCopyCode}>
          {codeCopied ? <Check size={16} /> : <Copy size={16} />}
          {codeCopied ? "Copiado" : "Copiar"}
        </button>
      </div>

      <p className="field-help-text">
        Comparte este código con participantes o jurado.
      </p>
    </>
    ) : (
    <p className="field-help-text">
      El evento será público y cualquier usuario podrá abrirlo desde la lista.
    </p>
  )}
          </div>

            <label className="event-checkbox-row">
              <input
                type="checkbox"
                name="autoVotacion"
                checked={formData.autoVotacion}
                onChange={handleChange}
              />
              <div>
                <strong>Permitir auto-votación</strong>
                <span>Los participantes podrán votar su propio proyecto.</span>
              </div>
            </label>
          </div>
        </section>

        <section className="event-form-card">
          <div className="event-form-section">
            <div className="voting-config-header">
              <div>
                <h2>Votaciones</h2>
                <p className="field-help-text">
                  Elige el tipo de votación Popular/Jurado y la Modalidad
                </p>
              </div>

              <button type="button" className="primary-btn" onClick={addVotingConfig}>
                <Plus size={17} />
                Añadir votación
              </button>
            </div>

            <div className="voting-config-list">
              {/* Aqui pongo un aviso por si se crea sin votaciones */}
              {votingConfigs.length === 0 ? (
                <div className="feedback-card">
                  Este evento se creará sin votaciones. Después podrás entrar al evento y pulsar “Nueva Votación”.
                </div>
              ) : null}
              {votingConfigs.map((config, index) => {
                const total = config.criteria.reduce((sum, criterion) => sum + Number(criterion.peso || 0), 0);

                return (
                  <article className="voting-config-card" key={config.id}>
                    <div className="voting-config-card-header">
                      <div>
                        <span className="voting-config-number">Votación {index + 1}</span>
                        <h3>
                          {config.tipo} + {config.modalidad}
                        </h3>
                      </div>

                      {votingConfigs.length > 1 ? (
                        <button
                          type="button"
                          className="danger-icon-btn"
                          onClick={() => removeVotingConfig(config.id)}
                        >
                          <Trash2 size={18} />
                        </button>
                      ) : null}
                    </div>

                    <label className="event-field">
                      <span>Nombre de la votación</span>
                      <input
                        value={config.nombre}
                        onChange={(event) =>
                          updateVotingConfig(config.id, { nombre: event.target.value })
                        }
                      />
                    </label>

                    <div className="event-grid two-columns">
                      <div>
                        <span className="mini-label">Quién vota</span>
                        <div className="option-grid">
                          {tiposVotacion.map((tipo) => (
                            <button
                              type="button"
                              key={tipo.value}
                              className={`option-card ${config.tipo === tipo.value ? "selected" : ""}`}
                              onClick={() => updateVotingConfig(config.id, { tipo: tipo.value })}
                            >
                              <Vote size={18} />
                              {tipo.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <label className="event-field">
                        <span>Máximo de votos por usuario</span>
                        <input
                          type="number"
                          min="1"
                          value={config.maxSelecciones}
                          onChange={(event) =>
                            updateVotingConfig(config.id, { maxSelecciones: event.target.value })
                          }
                        />
                      </label>
                    </div>

                    <div>
                      <span className="mini-label">Cómo se evalúa</span>
                      <div className="modalidad-grid">
                        {modalidades.map((modalidad) => (
                          <button
                            type="button"
                            key={modalidad.value}
                            className={`modalidad-card ${config.modalidad === modalidad.value ? "selected" : ""}`}
                            onClick={() =>
                              updateVotingConfig(config.id, { modalidad: modalidad.value })
                            }
                          >
                            <strong>{modalidad.label}</strong>
                            <span>{modalidad.description}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {needsCriteria(config.modalidad) ? (
                      <div className="criteria-configurator">
                        <div className="criteria-configurator-header">
                          <div>
                            <h4>Criterios de evaluación</h4>
                            <p>En la votación se podrán añadir comentarios por criterio.</p>
                          </div>

                          <button
                            type="button"
                            className="secondary-btn"
                            onClick={() => addCriterion(config.id)}
                          >
                            <Plus size={16} />
                            Añadir criterio
                          </button>
                        </div>

                        {config.modalidad === "MULTICRITERIO_PONDERADA" ? (
                          <div className={`criteria-weight-alert ${total === 100 ? "success" : "error"}`}>
                            Peso total: {total}%. Debe sumar 100%.
                          </div>
                        ) : null}

                        <div className="criteria-list">
                          {config.criteria.map((criterion, criterionIndex) => (
                            <div className="criterion-card" key={criterion.id}>
                              <div className="criterion-number">{criterionIndex + 1}</div>

                              <div className="criterion-fields">
                                <label className="event-field">
                                  <span>Nombre</span>
                                  <input
                                    value={criterion.nombre}
                                    onChange={(event) =>
                                      updateCriterion(config.id, criterion.id, {
                                        nombre: event.target.value,
                                      })
                                    }
                                  />
                                </label>

                                <label className="event-field">
                                  <span>Descripción</span>
                                  <input
                                    value={criterion.descripcion}
                                    onChange={(event) =>
                                      updateCriterion(config.id, criterion.id, {
                                        descripcion: event.target.value,
                                      })
                                    }
                                  />
                                </label>

                                {config.modalidad === "MULTICRITERIO_PONDERADA" ? (
  <label className="event-field">
    <span>Peso (%)</span>
    <input
      type="number"
      min="0"
      max="100"
      value={criterion.peso}
      onChange={(event) =>
        updateCriterion(config.id, criterion.id, {
          peso: Number(event.target.value),
        })
      }
    />
  </label>
) : null}
                              </div>

                              <button
                                type="button"
                                className="criterion-remove"
                                onClick={() => removeCriterion(config.id, criterion.id)}
                              >
                                <Trash2 size={17} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="criteria-empty">
                        Esta modalidad no necesita criterios.
                      </div>
                    )}
                  </article>
                );
              })}
            </div>

            {error ? <div className="feedback-card error-box">{error}</div> : null}

            <div className="event-form-actions">
              <Link to="/eventos" className="secondary-btn">
                Cancelar
              </Link>

              <button type="submit" className="primary-btn" disabled={!canSubmit || submitting}>
                {submitting ? "Creando..." : "Crear Evento"}
              </button>
            </div>
          </div>
        </section>
      </form>
    </main>
  );
}

export default CreateEventScreen;