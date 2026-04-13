import { useEffect, useState } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { getEventos } from "../services/eventoService";
import {
  getCriteriosByEvento,
  createCriterio,
  updateCriterio,
  deleteCriterio,
} from "../services/criterioService";
import { esOrganizador } from "../services/sessionService";
import "../styles/criterios.css";

const ESCALAS = [
  { label: "1-5", min: 1, max: 5 },
  { label: "1-10", min: 1, max: 10 },
  { label: "1-20", min: 1, max: 20 },
];

const CRITERIOS_DEFAULT = [
  { nombre: "Innovación", peso: 40, escalaMin: 1, escalaMax: 10, descripcion: "" },
  { nombre: "Impacto Social", peso: 30, escalaMin: 1, escalaMax: 10, descripcion: "" },
  { nombre: "Viabilidad Técnica", peso: 20, escalaMin: 1, escalaMax: 10, descripcion: "" },
  { nombre: "Presentación", peso: 10, escalaMin: 1, escalaMax: 10, descripcion: "" },
];

function CriteriosScreen() {
  const [eventos, setEventos] = useState([]);
  const [eventoId, setEventoId] = useState("");
  const [criterios, setCriterios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoPeso, setNuevoPeso] = useState("");
  const [nuevaEscala, setNuevaEscala] = useState("1-10");
  const [nuevaDescripcion, setNuevaDescripcion] = useState("");

  const puedeGestionar = esOrganizador();

  useEffect(() => {
    const loadEventos = async () => {
      try {

        const data = await getEventos();
        setEventos(data);

        if (data.length > 0) setEventoId(data[0].id);

      } catch (err) {

        setError("No se pudieron cargar los eventos");

      } finally {

        setLoading(false);

      }
    };

    loadEventos();

  }, []);

  useEffect(() => {

    if (!eventoId) return;

    const loadCriterios = async () => {

      try {

        setLoading(true);
        const data = await getCriteriosByEvento(eventoId);
        setCriterios(data);

      } catch (err) {

        setError("No se pudieron cargar los criterios");

      } finally {

        setLoading(false);

      }
    };

    loadCriterios();
  }, [eventoId]);

  const pesoTotal = criterios.reduce((sum, c) => sum + c.peso, 0);
  const pesoDisponible = 100 - pesoTotal;

  const handleAddCriterio = async () => {
    const escala = ESCALAS.find((e) => e.label === nuevaEscala) || ESCALAS[1];

    try {

      setError("");

      const nuevo = await createCriterio({
        evento: { id: eventoId },
        nombre: nuevoNombre,
        peso: parseInt(nuevoPeso),
        escalaMin: escala.min,
        escalaMax: escala.max,
        descripcion: nuevaDescripcion || null,
        orden: criterios.length,

      });

      setCriterios([...criterios, nuevo]);
      setShowModal(false);
      setNuevoNombre("");
      setNuevoPeso("");
      setNuevaDescripcion("");
      setSuccess("Criterio añadido correctamente");ç

    } catch (err){

      setError(err.message);

    }
  };

  const handleDeleteCriterio = async (id) => {

    try {

      await deleteCriterio(id);
      setCriterios(criterios.filter((c) => c.id !== id));
      setSuccess("Criterio eliminado");

    } catch (err){

      setError(err.message);
      
    }
  };

  const handlePesoChange = async (id, newPeso) => {
    const parsed = parseInt(newPeso);
    if (isNaN(parsed) || parsed < 1 || parsed > 100) return;

    setCriterios(criterios.map((c) => (c.id === id ? { ...c, peso: parsed } : c)));
  };

  const handleGuardarConfiguracion = async () => {

    try {

      setSaving(true);
      setError("");

      for (const criterio of criterios){

        await updateCriterio(criterio.id, criterio);

      }

      setSuccess("Configuración guardada correctamente");

    } catch(err) {

      setError(err.message);

    } finally {

      setSaving(false);

    }
  };

  const handleRestablecer = async () => {
    try {

      setSaving(true);
      setError("");

      for (const c of criterios) {

        await deleteCriterio(c.id);

      }

      const nuevos = [];

      for (let i = 0; i < CRITERIOS_DEFAULT.length; i++) {

        const nuevo = await createCriterio({
          evento: { id: eventoId },
          ...CRITERIOS_DEFAULT[i],
          orden: i,

        });

        nuevos.push(nuevo);

      }

      setCriterios(nuevos);
      setSuccess("Criterios restablecidos a valores por defecto");

    } catch (err) {

      setError(err.message);

    } finally {

      setSaving(false);

    }
  };

  if(loading && eventos.length === 0){

    return <main className="criterios-page"><div className="feedback-card">Cargando...</div></main>;

  }

  return (
    <main className="criterios-page">
      <header className="criterios-header">
        <div>
          <h1>Configuración de Criterios de Evaluación</h1>
          <p>Define los criterios y sus pesos para la evaluación de proyectos</p>
        </div>
      </header>

      <section className="criterios-event-selector">
        <label>
          <span>Evento</span>
          <select value={eventoId} onChange={(e) => setEventoId(e.target.value)}>
            {eventos.map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.nombre}</option>
            ))}
          </select>
        </label>
      </section>

      <section className="criterios-resumen-card">
        <div className="resumen-header">
          <strong>Resumen</strong>
          <span className={`peso-total ${pesoTotal === 100 ? "balanced" : "unbalanced"}`}>
            Peso total: {pesoTotal}%
          </span>
        </div>
        <div className={`resumen-status ${pesoTotal === 100 ? "success" : "warning"}`}>
          {pesoTotal === 100
            ? "✓ Los pesos están correctamente balanceados"
            : `⚠ Los pesos suman ${pesoTotal}%. Deben sumar 100%`}
        </div>
      </section>

      {error && <div className="feedback-card error-box">{error}</div>}
      {success && <div className="feedback-card success-box">{success}</div>}

      <section className="criterios-lista-card">
        <div className="criterios-lista-header">
          <div>
            <strong>Criterios de Evaluación</strong>
            <span className="criterios-count">{criterios.length} criterios configurados</span>
          </div>
          {puedeGestionar && (
            <button className="primary-btn" onClick={() => { setShowModal(true); setError(""); setSuccess(""); }}>
              <Plus size={16} /> Añadir Criterio
            </button>
          )}
        </div>

        <div className="criterios-list">
          {criterios.map((criterio, index) => (
            <div key={criterio.id} className="criterio-item">
              <div className="criterio-orden">
                <GripVertical size={16} className="grip-icon" />
                <span className="criterio-number">{index + 1}</span>
              </div>
              <div className="criterio-info">
                <strong>{criterio.nombre}</strong>
                <span>Peso: {criterio.peso}% · Escala: {criterio.escalaMin}-{criterio.escalaMax}</span>
              </div>
              <div className="criterio-slider">
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={criterio.peso}
                  onChange={(e) => handlePesoChange(criterio.id, e.target.value)}
                  disabled={!puedeGestionar}
                />
                <span className="peso-value">{criterio.peso}%</span>
              </div>
              {puedeGestionar && (
                <button className="delete-btn" onClick={() => handleDeleteCriterio(criterio.id)}>
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="criterios-tips-card">
        <h3>💡 Consejos de Configuración</h3>
        <ul>
          <li>Los criterios con mayor peso tendrán más influencia en la puntuación final</li>
          <li>La escala recomendada es de 1-10 para facilitar la evaluación</li>
          <li>Considera usar entre 3 y 5 criterios para no sobrecargar a los evaluadores</li>
        </ul>
      </section>

      {puedeGestionar && (
        <div className="criterios-actions">
          <button className="secondary-btn" onClick={handleRestablecer} disabled={saving}>
            Restablecer
          </button>
          <button
            className="primary-btn"
            onClick={handleGuardarConfiguracion}
            disabled={saving || pesoTotal !== 100}
          >
            {saving ? "Guardando..." : "Guardar Configuración"}
          </button>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Añadir Nuevo Criterio</h2>
            <hr />

            <label className="modal-field">
              <span>Nombre del Criterio *</span>
              <input
                type="text"
                placeholder="Ej: Innovación, Impacto, Viabilidad..."
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
              />
            </label>

            <label className="modal-field">
              <span>Peso (%) *</span>
              <input
                type="number"
                placeholder="Ej: 40"
                value={nuevoPeso}
                onChange={(e) => setNuevoPeso(e.target.value)}
                min="1"
                max={pesoDisponible}
              />
              <small>Peso disponible: {pesoDisponible}%</small>
            </label>

            <label className="modal-field">
              <span>Escala de Puntuación</span>
              <select value={nuevaEscala} onChange={(e) => setNuevaEscala(e.target.value)}>
                {ESCALAS.map((e) => (
                  <option key={e.label} value={e.label}>{e.label}</option>
                ))}
              </select>
            </label>

            <label className="modal-field">
              <span>Descripción (opcional)</span>
              <textarea
                placeholder="Describe qué evalúa este criterio..."
                value={nuevaDescripcion}
                onChange={(e) => setNuevaDescripcion(e.target.value)}
                rows={3}
              />
            </label>

            <div className="modal-actions">
              <button className="secondary-btn" onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button
                className="primary-btn"
                onClick={handleAddCriterio}
                disabled={!nuevoNombre || !nuevoPeso || parseInt(nuevoPeso) > pesoDisponible}
              >
                Añadir Criterio
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default CriteriosScreen;
