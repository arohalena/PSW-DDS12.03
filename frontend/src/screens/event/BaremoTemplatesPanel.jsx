import { useState } from "react";
import { FileText, Check, Lightbulb } from "lucide-react";

const PLANTILLAS_BAREMOS = [
  {
    key: "hackathon-tec",
    icon: "💻",
    label: "Hackathon Tecnológico",
    descripcion: "Evaluación completa para competencias de desarrollo tecnológico",
    escalaMin: 1,
    escalaMax: 5,
    escalaLabel: "Estrellas (1-5)",
    criterios: [
      { nombre: "Innovación", descripcion: "Originalidad y creatividad de la solución", peso: 25 },
      { nombre: "Calidad Técnica", descripcion: "Solidez y limpieza de la implementación", peso: 25 },
      { nombre: "Impacto", descripcion: "Utilidad y valor aportado", peso: 20 },
      { nombre: "Presentación", descripcion: "Calidad de la demo y del pitch", peso: 15 },
      { nombre: "Trabajo en Equipo", descripcion: "Cohesión y coordinación del equipo", peso: 15 },
    ],
  },
  {
    key: "investigacion",
    icon: "🔬",
    label: "Investigación Académica",
    descripcion: "Baremo para evaluación de proyectos de investigación científica",
    escalaMin: 1,
    escalaMax: 10,
    escalaLabel: "Numérico (1-10)",
    criterios: [
      { nombre: "Rigor Metodológico", descripcion: "Solidez del método y del análisis", peso: 35 },
      { nombre: "Originalidad del Aporte", descripcion: "Novedad y aportación al área", peso: 30 },
      { nombre: "Relevancia del Tema", descripcion: "Importancia del problema abordado", peso: 20 },
      { nombre: "Calidad de la Redacción", descripcion: "Claridad y precisión de la escritura", peso: 15 },
    ],
  },
  {
    key: "startup-pitch",
    icon: "🚀",
    label: "Startup Pitch Competition",
    descripcion: "Evaluación enfocada en viabilidad de negocio y presentación",
    escalaMin: 1,
    escalaMax: 10,
    escalaLabel: "Numérico (1-10)",
    criterios: [
      { nombre: "Modelo de Negocio", descripcion: "Claridad y solidez del modelo", peso: 30 },
      { nombre: "Mercado", descripcion: "Tamaño y oportunidad de mercado", peso: 20 },
      { nombre: "Innovación", descripcion: "Diferenciación frente a la competencia", peso: 20 },
      { nombre: "Equipo", descripcion: "Capacidad del equipo para ejecutar", peso: 15 },
      { nombre: "Presentación", descripcion: "Calidad del pitch", peso: 15 },
    ],
  },
  {
    key: "ux-ui",
    icon: "🎨",
    label: "Diseño UX/UI",
    descripcion: "Criterios específicos para evaluación de diseño de experiencia de usuario",
    escalaMin: 1,
    escalaMax: 5,
    escalaLabel: "Estrellas (1-5)",
    criterios: [
      { nombre: "Usabilidad", descripcion: "Facilidad de uso y eficiencia", peso: 25 },
      { nombre: "Estética", descripcion: "Atractivo visual y coherencia gráfica", peso: 20 },
      { nombre: "Investigación de Usuario", descripcion: "Base en datos y necesidades reales", peso: 20 },
      { nombre: "Accesibilidad", descripcion: "Inclusividad y soporte a diversidad", peso: 20 },
      { nombre: "Innovación", descripcion: "Originalidad en interacción o concepto", peso: 15 },
    ],
  },
  {
    key: "sostenibilidad",
    icon: "🌱",
    label: "Sostenibilidad e Impacto Ambiental",
    descripcion: "Evaluación de proyectos ecológicos y sostenibles",
    escalaMin: 1,
    escalaMax: 10,
    escalaLabel: "Numérico (1-10)",
    criterios: [
      { nombre: "Impacto Ambiental", descripcion: "Contribución a la sostenibilidad", peso: 35 },
      { nombre: "Viabilidad", descripcion: "Factibilidad económica y técnica", peso: 25 },
      { nombre: "Innovación", descripcion: "Originalidad de la solución", peso: 20 },
      { nombre: "Escalabilidad", descripcion: "Potencial de crecimiento", peso: 20 },
    ],
  },
  {
    key: "ia-ml",
    icon: "🤖",
    label: "Inteligencia Artificial y Machine Learning",
    descripcion: "Baremo especializado en proyectos de IA y ML",
    escalaMin: 1,
    escalaMax: 10,
    escalaLabel: "Numérico (1-10)",
    criterios: [
      { nombre: "Innovación del Modelo", descripcion: "Originalidad del enfoque de IA", peso: 25 },
      { nombre: "Rendimiento y Precisión", descripcion: "Calidad de resultados y robustez", peso: 25 },
      { nombre: "Aplicabilidad Práctica", descripcion: "Caso de uso real y utilidad", peso: 20 },
      { nombre: "Ética y Manejo de Datos", descripcion: "Tratamiento responsable y sesgos", peso: 15 },
      { nombre: "Calidad del Código", descripcion: "Mantenibilidad y buenas prácticas", peso: 15 },
    ],
  },
];

function BaremoTemplatesPanel({ onApply }) {
  const [selectedKey, setSelectedKey] = useState(null);
  const seleccionada = PLANTILLAS_BAREMOS.find((p) => p.key === selectedKey) || null;

  function handleAplicar() {
    if (!seleccionada) return;
    onApply(seleccionada);
  }

  return (
    <div
      style={{
        border: "1px solid var(--color-border, #e2e2e2)",
        borderRadius: "10px",
        padding: "16px",
        background: "var(--color-surface, #fff)",
        marginBottom: "16px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
        <span style={{ color: "#4f46e5" }}>
          <FileText size={20} />
        </span>
        <div>
          <strong>Plantillas de Baremos</strong>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "#666" }}>
            Selecciona una plantilla predefinida para tu tipo de evento
          </p>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "12px",
        }}
      >
        {PLANTILLAS_BAREMOS.map((p) => {
          const isSelected = selectedKey === p.key;

          return (
            <button
              type="button"
              key={p.key}
              onClick={() => setSelectedKey(p.key)}
              style={{
                textAlign: "left",
                border: isSelected ? "2px solid #111827" : "1px solid #e5e7eb",
                borderRadius: "10px",
                padding: "14px",
                background: "#fff",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "1.4rem" }}>{p.icon}</span>
                  <strong style={{ fontSize: "1rem" }}>{p.label}</strong>
                </div>
                {isSelected ? <Check size={18} color="#4f46e5" /> : null}
              </div>

              <p style={{ margin: 0, fontSize: "0.85rem", color: "#555" }}>{p.descripcion}</p>

              <div style={{ fontSize: "0.78rem", color: "#777" }}>
                {p.escalaLabel} • {p.criterios.length} criterios
              </div>

              {isSelected ? (
                <div style={{ marginTop: "8px", borderTop: "1px solid #eee", paddingTop: "8px" }}>
                  {p.criterios.map((c) => (
                    <div
                      key={c.nombre}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.82rem",
                        padding: "2px 0",
                      }}
                    >
                      <span>{c.nombre}</span>
                      <span style={{ fontWeight: 600 }}>{c.peso}%</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </button>
          );
        })}
      </div>

      {seleccionada ? (
        <div
          style={{
            marginTop: "14px",
            background: "#eef2ff",
            border: "1px solid #c7d2fe",
            borderRadius: "8px",
            padding: "10px 14px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "0.9rem" }}>
            <Check size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
            Plantilla seleccionada: <strong>{seleccionada.label}</strong>
          </span>

          <button
            type="button"
            className="primary-btn"
            onClick={handleAplicar}
            style={{ padding: "6px 14px" }}
          >
            Aplicar Plantilla
          </button>
        </div>
      ) : null}

      <div
        style={{
          marginTop: "12px",
          background: "#f9fafb",
          border: "1px solid #e5e7eb",
          borderRadius: "6px",
          padding: "8px 12px",
          fontSize: "0.8rem",
          color: "#555",
          display: "flex",
          gap: "6px",
          alignItems: "center",
        }}
      >
        <Lightbulb size={14} />
        <span>
          <strong>Tip:</strong> Las plantillas incluyen criterios y pesos predefinidos que puedes personalizar después de aplicarlas.
        </span>
      </div>
    </div>
  );
}

export default BaremoTemplatesPanel;