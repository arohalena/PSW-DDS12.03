import { useEffect, useState } from "react";
import {
  createEquipo,
  getEquipos,
  getEventosParaEquipo,
  getProyectosParaEquipo,
} from "../services/equipoService";
import "../styles/temp-management.css";

function TeamsScreen() {
  const [equipos, setEquipos] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    nombre: "",
    eventoId: "",
    proyectoId: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [equiposData, eventosData, proyectosData] = await Promise.all([
        getEquipos(),
        getEventosParaEquipo(),
        getProyectosParaEquipo(),
      ]);

      setEquipos(equiposData);
      setEventos(eventosData);
      setProyectos(proyectosData);
    } catch (err) {
      setError(err.message || "No se pudieron cargar los equipos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      await createEquipo({
        nombre: form.nombre.trim(),
        evento: { id: form.eventoId },
        proyecto: { id: form.proyectoId },
      });

      setForm({
        nombre: "",
        eventoId: "",
        proyectoId: "",
      });

      await loadData();
    } catch (err) {
      setError(err.message || "No se pudo crear el equipo");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="temp-page">
      <header className="temp-header">
        <div>
          <h1>Equipos</h1>
          <p>Pantalla temporal para comprobar creación y listado de equipos.</p>
        </div>
      </header>

      <section className="temp-card">
        <h2>Crear equipo</h2>
        <form className="temp-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="nombre"
            placeholder="Nombre del equipo"
            value={form.nombre}
            onChange={handleChange}
            required
          />

          <select
            name="eventoId"
            value={form.eventoId}
            onChange={handleChange}
            required
          >
            <option value="">Selecciona un evento</option>
            {eventos.map((evento) => (
              <option key={evento.id} value={evento.id}>
                {evento.nombre}
              </option>
            ))}
          </select>

          <select
            name="proyectoId"
            value={form.proyectoId}
            onChange={handleChange}
            required
          >
            <option value="">Selecciona un proyecto</option>
            {proyectos.map((proyecto) => (
              <option key={proyecto.id} value={proyecto.id}>
                {proyecto.nombre}
              </option>
            ))}
          </select>

          <button className="primary-btn" type="submit" disabled={saving}>
            {saving ? "Creando..." : "Crear equipo"}
          </button>
        </form>
      </section>

      {loading ? (
        <div className="feedback-card">Cargando equipos...</div>
      ) : error ? (
        <div className="feedback-card error-box">{error}</div>
      ) : (
        <section className="temp-card">
          <h2>Listado</h2>
          {equipos.length === 0 ? (
            <p>No hay equipos creados.</p>
          ) : (
            <div className="temp-table-wrapper">
              <table className="temp-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Evento</th>
                    <th>Proyecto</th>
                    <th>ID</th>
                  </tr>
                </thead>
                <tbody>
                  {equipos.map((equipo) => (
                    <tr key={equipo.id}>
                      <td>{equipo.nombre}</td>
                      <td>{equipo.evento?.nombre || equipo.evento?.id}</td>
                      <td>{equipo.proyecto?.nombre || equipo.proyecto?.id}</td>
                      <td>{equipo.id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

export default TeamsScreen;