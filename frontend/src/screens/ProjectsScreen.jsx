import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { getProyectos, getProyectosByEvento, createProyecto } from "../services/proyectoService";
import { esOrganizador } from "../services/sessionService";

const CATEGORIAS = ["IA", "SOSTENIBILIDAD"];

function ProjectsScreen() {
  const { eventoId } = useParams();
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  const puedeGestionar = esOrganizador();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = eventoId
          ? await getProyectosByEvento(eventoId)
          : await getProyectos();
        setProyectos(data);
      } catch (err) {
        setError(err.message || "No se pudieron cargar los proyectos");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [eventoId]);

  const filtrados = useMemo(() => {
    return proyectos.filter((p) =>
      p.nombre?.toLowerCase().includes(search.toLowerCase()) ||
      p.tipoCategoria?.toLowerCase().includes(search.toLowerCase())
    );
  }, [proyectos, search]);

  const handleProyectoCreado = (nuevo) => {
    setProyectos((prev) => [...prev, nuevo]);
    setShowModal(false);
  };

  return (
    <main style={{ padding: "2rem" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1>Gestión de Proyectos</h1>
          <p>Administra los proyectos participantes del evento</p>
        </div>
        {puedeGestionar && (
          <button className="primary-btn" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Crear Proyecto
          </button>
        )}
      </header>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            placeholder="Buscar proyectos por nombre o categoría..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", paddingLeft: "36px" }}
          />
        </div>
      </div>

      {loading ? (
        <div className="feedback-card">Cargando proyectos...</div>
      ) : error ? (
        <div className="feedback-card error-box">{error}</div>
      ) : filtrados.length === 0 ? (
        <div className="feedback-card">No hay proyectos todavía.</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "0.75rem", borderBottom: "1px solid #e5e7eb" }}>Proyecto</th>
              <th style={{ textAlign: "left", padding: "0.75rem", borderBottom: "1px solid #e5e7eb" }}>Categoría</th>
              <th style={{ textAlign: "left", padding: "0.75rem", borderBottom: "1px solid #e5e7eb" }}>Descripción</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((p) => (
              <tr key={p.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "0.75rem", fontWeight: 600 }}>{p.nombre}</td>
                <td style={{ padding: "0.75rem" }}>{p.tipoCategoria}</td>
                <td style={{ padding: "0.75rem", color: "#6b7280" }}>{p.descripcion || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showModal && (
        <CreateProyectoModal
          eventoId={eventoId}
          onCreado={handleProyectoCreado}
          onClose={() => setShowModal(false)}
        />
      )}
    </main>
  );
}

function CreateProyectoModal({ eventoId, onCreado, onClose }) {
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    tipoCategoria: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre || !formData.tipoCategoria || !eventoId) return;

    try {
      setSubmitting(true);
      setError("");
      const nuevo = await createProyecto({
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim(),
        tipoCategoria: formData.tipoCategoria,
        evento: { id: eventoId },
      });
      onCreado(nuevo);
    } catch (err) {
      setError(err.message || "No se pudo crear el proyecto");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "white", borderRadius: "12px", padding: "2rem", width: "100%", maxWidth: "500px" }}>
        <h2 style={{ marginBottom: "1.5rem" }}>Crear Nuevo Proyecto</h2>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <span>Nombre del Proyecto *</span>
            <input
              type="text"
              name="nombre"
              placeholder="Ej: AI Health Monitor"
              value={formData.nombre}
              onChange={handleChange}
              required
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <span>Descripción</span>
            <textarea
              name="descripcion"
              rows="4"
              placeholder="Describe el proyecto y sus objetivos..."
              value={formData.descripcion}
              onChange={handleChange}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <span>Categoría *</span>
            <select name="tipoCategoria" value={formData.tipoCategoria} onChange={handleChange} required>
              <option value="">Seleccionar categoría</option>
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>

          {!eventoId && (
            <div className="feedback-card warning-box">
              Para crear un proyecto accede desde un evento concreto.
            </div>
          )}

          {error && <div className="feedback-card error-box">{error}</div>}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "0.5rem" }}>
            <button type="button" className="secondary-btn" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="primary-btn" disabled={submitting || !eventoId}>
              {submitting ? "Creando..." : "Crear Proyecto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProjectsScreen;
