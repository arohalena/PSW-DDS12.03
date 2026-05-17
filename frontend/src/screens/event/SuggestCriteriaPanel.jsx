import { useEffect, useMemo, useState } from "react";
import { Sparkles, Lightbulb, Plus } from "lucide-react";
import {
  getPlantillasCriterios,
  sugerirPlantillaCriterios,
} from "../../services/criterioService";

function SuggestCriteriaPanel({ tipoEvento, onApply }) {
  const [plantillas, setPlantillas]           = useState([]);
  const [plantillaActual, setPlantillaActual] = useState(null);
  const [descripcion, setDescripcion]         = useState("");
  const [seleccionados, setSeleccionados]     = useState(new Set());
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState("");

  useEffect(() => {

    const init = async () => {

      try {

        const [todas, inicial] = await Promise.all([
          getPlantillasCriterios(),
          sugerirPlantillaCriterios("", tipoEvento),
        ]);

        setPlantillas(todas);
        setPlantillaActual(inicial);
        setDescripcion(inicial.label.toLowerCase());

      } catch (err) {

        setError(err.message);

      } finally {

        setLoading(false);

      }
    };

    init();

  }, [tipoEvento]);

  const sugerencias = useMemo(() => plantillaActual?.criterios || [], [plantillaActual]);

  async function handleSugerir() {

    try {

      setError("");
      const detectada = await sugerirPlantillaCriterios(descripcion, tipoEvento);
      setPlantillaActual(detectada);
      setSeleccionados(new Set());

    } catch (err) {

      setError(err.message);

    }
  }

  function handlePlantillaClick(plantilla) {

    setPlantillaActual(plantilla);
    setDescripcion(plantilla.label.toLowerCase());
    setSeleccionados(new Set());

  }

  function toggleSelect(idx) {

    setSeleccionados((prev) => {

      const next = new Set(prev);

      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }

      return next;

    });
  }

  function handleAplicar() {

    if (seleccionados.size === 0) return;

    const elegidos = sugerencias.filter((_, idx) => seleccionados.has(idx));

    onApply(elegidos);
    setSeleccionados(new Set());

  }

  if (loading) {

    return <div className="suggest-criteria-panel">Cargando sugerencias...</div>;

  }

  return (
    <div className="suggest-criteria-panel">
      <div className="suggest-header">
        <span className="suggest-icon">
          <Sparkles size={20} />
        </span>

        <div>
          <strong>Sugerencia Automática de Criterios</strong>
          <p>Obtén criterios recomendados según el tipo de evento</p>
        </div>
      </div>

      <label className="suggest-field">
        <span>Describe tu evento</span>

        <div className="suggest-input-row">
          <input
            type="text"
            value={descripcion}
            placeholder="Ej: hackathon, ia, sostenibilidad..."
            onChange={(e) => setDescripcion(e.target.value)}
          />

          <button type="button" className="suggest-button" onClick={handleSugerir}>
            <Sparkles size={16} />
            Sugerir
          </button>
        </div>
      </label>

      {error ? <div className="feedback-card error-box">{error}</div> : null}

      <div className="suggest-hint">
        <Lightbulb size={14} />
        Criterios sugeridos - Selecciona los que quieras aplicar:
      </div>

      <div className="suggest-list">
        {sugerencias.map((criterio, idx) => {

          const selected = seleccionados.has(idx);

          return (
            <button
              type="button"
              key={`${plantillaActual?.key}-${idx}`}
              className={`suggest-item ${selected ? "selected" : ""}`}
              onClick={() => toggleSelect(idx)}
            >
              <div className="suggest-item-head">
                <strong>{criterio.nombre}</strong>
                <span className="suggest-item-peso">{criterio.peso}%</span>
              </div>
              <p>{criterio.descripcion}</p>
            </button>
          );
        })}
      </div>

      <div className="suggest-footer">
        <span>{seleccionados.size} criterios seleccionados</span>

        <button
          type="button"
          className="suggest-apply-btn"
          onClick={handleAplicar}
          disabled={seleccionados.size === 0}
        >
          <Plus size={15} />
          Aplicar Criterios
        </button>
      </div>

      <div className="suggest-templates">
        <span>Plantillas rápidas:</span>

        <div className="suggest-templates-row">
          {plantillas.map((p) => (
            <button
              type="button"
              key={p.key}
              className={`suggest-template-chip ${plantillaActual?.key === p.key ? "active" : ""}`}
              onClick={() => handlePlantillaClick(p)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SuggestCriteriaPanel;