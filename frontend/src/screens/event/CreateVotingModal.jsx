import { useMemo, useRef, useState } from "react";
import { Plus, Trash2, Vote, X } from "lucide-react";
import { createVotacion } from "../../services/votacionService";
import SuggestCriteriaPanel from "./SuggestCriteriaPanel";
import BaremoTemplatesPanel from "./BaremoTemplatesPanel";
import { useModalShortcuts } from "../../common/useModalShortcuts";
import "../../styles/events.css";

const tiposVotacion = [
  { value: "POPULAR", label: "Popular" },
  { value: "JURADO", label: "Jurado" },
  { value: "MIXTA", label: "Mixta (Popular + Jurado)" },
];

const modalidades = [
  { value: "SIMPLE", label: "Simple", description: "Voto directo a un proyecto." },
  { value: "PUNTOS", label: "Puntos", description: "Puntuación directa." },
  { value: "MULTICRITERIO", label: "Multicriterio", description: "Evaluación por criterios." },
  {
    value: "MULTICRITERIO_PONDERADA",
    label: "Multicriterio ponderada",
    description: "Evaluación por criterios con peso.",
  },
];

function ahoraLocal() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function ahoraMas7DiasLocal() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
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
      peso: modalidad === "MULTICRITERIO_PONDERADA" ? "" : null,
    },
    {
      id: crypto.randomUUID(),
      nombre: "Impacto",
      descripcion: "Valor aportado y utilidad para usuarios.",
      peso: modalidad === "MULTICRITERIO_PONDERADA" ? "" : null,
    },
    {
      id: crypto.randomUUID(),
      nombre: "Presentación",
      descripcion: "Claridad de la demo y defensa.",
      peso: modalidad === "MULTICRITERIO_PONDERADA" ? "" : null,
    },
  ];
}

function sanitizeWeight(value) {
  const onlyNumbers = value.replace(/\D/g, "");

  if (onlyNumbers === "") return "";

  const withoutLeadingZeros = onlyNumbers.replace(/^0+(?=\d)/, "");
  const numberValue = Math.min(Number(withoutLeadingZeros), 100);

  return String(numberValue);
}

function CreateVotingModal({ eventoId, eventoNombre, tipoEvento, onClose, onCreated }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const formRef = useRef(null);
  const modalRef = useModalShortcuts({
    isOpen: true,
    onClose,
    onSubmit: () => formRef.current?.requestSubmit(),
  });

  const [config, setConfig] = useState({
    nombre: "Nueva votación",
    tipo: "POPULAR",
    modalidad: "SIMPLE",
    maxSelecciones: 1,
    inicio: ahoraLocal(),
    fin: ahoraMas7DiasLocal(),
    comentariosActivos: true,
    comentarioObligatorio: true,
    criteria: [],
    pesoPorcentajePopular: 50,
    pesoPorcentajeJurado: 50,
  });

  const totalPeso = useMemo(() => {
    return config.criteria.reduce((sum, criterion) => {
      return sum + Number(criterion.peso || 0);
    }, 0);
  }, [config.criteria]);

  const canSubmit = useMemo(() => {
    return (
      config.nombre.trim() &&
      Number(config.maxSelecciones || 0) >= 1 &&
      config.inicio &&
      config.fin &&
      !submitting
    );
  }, [config, submitting]);

  function updateConfig(updates) {
    setConfig((prev) => {
      const modalidadChanged = updates.modalidad && updates.modalidad !== prev.modalidad;

      return {
        ...prev,
        ...updates,
        criteria: modalidadChanged
          ? createDefaultCriteria(updates.modalidad)
          : updates.criteria || prev.criteria,
      };
    });

    setError("");
  }

  function updateCriterion(criterionId, updates) {
    setConfig((prev) => ({
      ...prev,
      criteria: prev.criteria.map((criterion) =>
        criterion.id === criterionId ? { ...criterion, ...updates } : criterion
      ),
    }));

    setError("");
  }

  function addCriterion() {
    setConfig((prev) => ({
      ...prev,
      criteria: [
        ...prev.criteria,
        {
          id: crypto.randomUUID(),
          nombre: "",
          descripcion: "",
          peso: prev.modalidad === "MULTICRITERIO_PONDERADA" ? "" : null,
        },
      ],
    }));
  }

  function removeCriterion(criterionId) {
    setConfig((prev) => ({
      ...prev,
      criteria: prev.criteria.filter((criterion) => criterion.id !== criterionId),
    }));
  }

  function applySuggestions(criteriosSugeridos) {
    setConfig((prev) => ({
      ...prev,
      criteria: criteriosSugeridos.map((c) => ({
        id: crypto.randomUUID(),
        nombre: c.nombre,
        descripcion: c.descripcion,
        peso: prev.modalidad === "MULTICRITERIO_PONDERADA" ? String(c.peso) : null,
      })),
    }));

    setError("");
  }

  function applyBaremoTemplate(plantilla) {
    setConfig((prev) => ({
      ...prev,
      modalidad: "MULTICRITERIO_PONDERADA",
      criteria: plantilla.criterios.map((c) => ({
        id: crypto.randomUUID(),
        nombre: c.nombre,
        descripcion: c.descripcion,
        peso: String(c.peso),
      })),
    }));

    setError("");
  }

  function validate() {
    if (!config.nombre.trim()) {
      return "La votación debe tener nombre.";
    }

    if (Number(config.maxSelecciones || 0) < 1) {
      return "El máximo de votos debe ser al menos 1.";
    }

    if (!config.inicio || !config.fin) {
      return "Debes indicar el inicio y el fin de la votación.";
    }

    const inicio = new Date(config.inicio);
    const fin = new Date(config.fin);

    if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime())) {
      return "Las fechas introducidas no son válidas.";
    }

    if (fin <= inicio) {
      return "La fecha/hora de fin debe ser posterior a la de inicio.";
    }

    if (config.tipo === "MIXTA") {
      const pp = Number(config.pesoPorcentajePopular || 0);
      const pj = Number(config.pesoPorcentajeJurado  || 0);
      if (pp < 0 || pp > 100 || pj < 0 || pj > 100) {
        return "Los pesos deben estar entre 0 y 100.";
      }
      if (pp + pj !== 100) {
        return `Los pesos de popular (${pp}%) y jurado (${pj}%) deben sumar 100%.`;
      }
    }

    if (needsCriteria(config.modalidad)) {
      const validCriteria = config.criteria.filter((criterion) => criterion.nombre.trim());
      const zeroWeight = config.criteria.filter((criterion) => criterion.peso == 0);

      if (validCriteria.length === 0) {
        return "Esta modalidad necesita al menos un criterio.";
      }

      if (config.modalidad === "MULTICRITERIO_PONDERADA") {

        if (totalPeso !== 100) {
          return `La suma de pesos de los criterios deben sumar 100%. Ahora suman ${totalPeso}%.`;
        }

        if (zeroWeight.length > 0) {
          return "No puede haber un criterio con peso 0%";
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

      const inicio = new Date(config.inicio);
      const fin = new Date(config.fin);

      await createVotacion({
        eventoId,
        nombre: config.nombre.trim(),
        tipo: config.tipo,
        modalidad: config.modalidad,
        estado: "PENDIENTE",
        maxSelecciones: Number(config.maxSelecciones || 1),
        inicio: inicio.toISOString(),
        fin: fin.toISOString(),
        comentariosActivos: config.comentariosActivos,
        comentarioObligatorio: config.comentariosActivos ? config.comentarioObligatorio : false,
        criterios: needsCriteria(config.modalidad)
          ? config.criteria
              .filter((criterion) => criterion.nombre.trim())
              .map((criterion, index) => ({
                nombre: criterion.nombre.trim(),
                descripcion: criterion.descripcion?.trim() || "",
                peso:
                  config.modalidad === "MULTICRITERIO_PONDERADA"
                    ? Number(criterion.peso || 0)
                    : null,
                escalaMin: 1,
                escalaMax: 5,
                orden: index,
              }))
          : [],
        pesoPorcentajePopular: config.tipo === "MIXTA" ? Number(config.pesoPorcentajePopular) : null,
        pesoPorcentajeJurado:  config.tipo === "MIXTA" ? Number(config.pesoPorcentajeJurado)  : null,
      });

      onCreated();
    } catch (err) {
      setError(err.message || "No se pudo crear la votación.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="voting-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form
        className="voting-modal"
        onSubmit={handleSubmit}
        ref={(node) => {
          formRef.current = node;
          modalRef.current = node;
        }}
      >
        <div className="voting-modal-header">
          <div>
            <span className="voting-modal-icon">
              <Vote size={22} />
            </span>
            <h2>Nueva votación</h2>
            <p>{eventoNombre}</p>
          </div>

          <button type="button" className="voting-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="voting-modal-body">
          <label className="event-field">
            <span>Nombre</span>
            <input
              value={config.nombre}
              onChange={(event) => updateConfig({ nombre: event.target.value })}
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
                    onClick={() => updateConfig({ tipo: tipo.value })}
                  >
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
                onChange={(event) => updateConfig({ maxSelecciones: event.target.value })}
              />
            </label>
          </div>

          {config.tipo === "MIXTA" && (
            <div className="event-field" style={{ marginTop: "8px" }}>
              <span className="mini-label">Pesos de la votación mixta</span>
              <p style={{ fontSize: "0.82rem", color: "var(--color-text-secondary, #666)", marginBottom: "8px" }}>
                Define qué porcentaje contribuye el voto popular y el de jurado al resultado final. Deben sumar 100%.
              </p>
              <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                <label className="event-field" style={{ flex: 1 }}>
                  <span>Peso Voto Popular (%)</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={config.pesoPorcentajePopular}
                    onChange={(e) => {
                      const sanitized = sanitizeWeight(e.target.value);
                      const val = sanitized === "" ? 0 : Number(sanitized);
                      updateConfig({
                        pesoPorcentajePopular: val,
                        pesoPorcentajeJurado: 100 - val,
                      });
                    }}
                  />
                </label>
                <label className="event-field" style={{ flex: 1 }}>
                  <span>Peso Voto Jurado (%)</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={config.pesoPorcentajeJurado}
                    onChange={(e) => {
                      const sanitized = sanitizeWeight(e.target.value);
                      const val = sanitized === "" ? 0 : Number(sanitized);
                      updateConfig({
                        pesoPorcentajeJurado: val,
                        pesoPorcentajePopular: 100 - val,
                      });
                    }}
                  />
                </label>
                <div style={{ textAlign: "center", minWidth: "80px" }}>
                  <span style={{
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    color: Number(config.pesoPorcentajePopular) + Number(config.pesoPorcentajeJurado) === 100
                      ? "green" : "red"
                  }}>
                    Total: {Number(config.pesoPorcentajePopular || 0) + Number(config.pesoPorcentajeJurado || 0)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="event-grid two-columns">
            <label className="event-field">
              <span>Inicio de la votación</span>
              <input
                type="datetime-local"
                value={config.inicio}
                onChange={(event) => updateConfig({ inicio: event.target.value })}
              />
            </label>

            <label className="event-field">
              <span>Fin de la votación</span>
              <input
                type="datetime-local"
                value={config.fin}
                onChange={(event) => updateConfig({ fin: event.target.value })}
              />
            </label>
          </div>

          <div className="voting-comments-config">
            <label className="voting-toggle-row">
              <input
                type="checkbox"
                checked={config.comentariosActivos}
                onChange={(e) =>
                  updateConfig({
                    comentariosActivos: e.target.checked,
                    comentarioObligatorio: e.target.checked ? config.comentarioObligatorio : false,
                  })
                }
              />
              <div>
                <strong>Permitir comentarios</strong>
                <span>Los votantes podrán dejar feedback al votar</span>
              </div>
            </label>

            <label className={`voting-toggle-row ${!config.comentariosActivos ? "disabled" : ""}`}>
              <input
                type="checkbox"
                checked={config.comentarioObligatorio}
                disabled={!config.comentariosActivos}
                onChange={(e) =>
                  updateConfig({
                    comentarioObligatorio: e.target.checked,
                  })
                }
              />
              <div>
                <strong>Comentario obligatorio</strong>
                <span>El voto no se podrá enviar sin comentario.</span>
              </div>
              </label>
          </div>

          <div>
            <span className="mini-label">Modalidad</span>
            <div className="modalidad-grid">
              {modalidades.map((modalidad) => (
                <button
                  type="button"
                  key={modalidad.value}
                  className={`modalidad-card ${config.modalidad === modalidad.value ? "selected" : ""}`}
                  onClick={() => updateConfig({ modalidad: modalidad.value })}
                >
                  <strong>{modalidad.label}</strong>
                  <span>{modalidad.description}</span>
                </button>
              ))}
            </div>
          </div>

          {needsCriteria(config.modalidad) ? (
            <div className="criteria-configurator">
              <BaremoTemplatesPanel onApply={applyBaremoTemplate} />

              <SuggestCriteriaPanel
                tipoEvento={tipoEvento}
                onApply={applySuggestions}
              />

              <div className="criteria-configurator-header">
                <div>
                  <h4>Criterios</h4>
                  <p>Define los criterios que se usarán para evaluar.</p>
                </div>

                <button type="button" className="secondary-btn" onClick={addCriterion}>
                  <Plus size={16} />
                  Añadir
                </button>
              </div>

              {config.modalidad === "MULTICRITERIO_PONDERADA" ? (
                <div className={`criteria-weight-alert ${totalPeso === 100 ? "success" : "error"}`}>
                  Peso actual: {totalPeso}%. Los porcentajes tienen que sumar 100%.
                </div>
              ) : null}

              <div className="criteria-list">
                {config.criteria.map((criterion, index) => (
                  <div className="criterion-card" key={criterion.id}>
                    <div className="criterion-number">{index + 1}</div>

                    <div className="criterion-fields">
                      <label className="event-field">
                        <span>Nombre</span>
                        <input
                          value={criterion.nombre}
                          onChange={(event) =>
                            updateCriterion(criterion.id, { nombre: event.target.value })
                          }
                        />
                      </label>

                      <label className="event-field">
                        <span>Descripción</span>
                        <input
                          value={criterion.descripcion}
                          onChange={(event) =>
                            updateCriterion(criterion.id, { descripcion: event.target.value })
                          }
                        />
                      </label>

                      {config.modalidad === "MULTICRITERIO_PONDERADA" ? (
                        <label className="event-field">
                          <span>Peso (%)</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={criterion.peso}
                            placeholder="0"
                            onChange={(event) =>
                              updateCriterion(criterion.id, {
                                peso: sanitizeWeight(event.target.value),
                              })
                            }
                          />
                        </label>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      className="criterion-remove"
                      onClick={() => removeCriterion(criterion.id)}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {error ? <div className="feedback-card error-box">{error}</div> : null}
        </div>

        <div className="voting-modal-actions">
          <button type="button" className="secondary-btn" onClick={onClose}>
            Cancelar
          </button>

          <button type="submit" className="primary-btn" disabled={!canSubmit}>
            {submitting ? "Creando..." : "Crear votación"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateVotingModal;