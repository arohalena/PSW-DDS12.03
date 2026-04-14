import { useEffect, useState } from "react";
import { createCompetidor, getCompetidores } from "../../services/competidorService";
import "../../styles/temp-management.css";

function CompetitorsScreen() {
  const [competidores, setCompetidores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    password: "",
  });

  const loadCompetidores = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getCompetidores();
      setCompetidores(data);
    } catch (err) {
      setError(err.message || "No se pudieron cargar los competidores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompetidores();
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

      await createCompetidor({
        nombre: form.nombre.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      setForm({
        nombre: "",
        email: "",
        password: "",
      });

      await loadCompetidores();
    } catch (err) {
      setError(err.message || "No se pudo crear el competidor");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="temp-page">
      <header className="temp-header">
        <div>
          <h1>Competidores</h1>
          <p>Pantalla temporal para comprobar creación y listado de competidores.</p>
        </div>
      </header>

      <section className="temp-card">
        <h2>Crear competidor</h2>
        <form className="temp-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="nombre"
            placeholder="Nombre"
            value={form.nombre}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Contraseña"
            value={form.password}
            onChange={handleChange}
            required
          />
          <button className="primary-btn" type="submit" disabled={saving}>
            {saving ? "Creando..." : "Crear competidor"}
          </button>
        </form>
      </section>

      {loading ? (
        <div className="feedback-card">Cargando competidores...</div>
      ) : error ? (
        <div className="feedback-card error-box">{error}</div>
      ) : (
        <section className="temp-card">
          <h2>Listado</h2>
          {competidores.length === 0 ? (
            <p>No hay competidores creados.</p>
          ) : (
            <div className="temp-table-wrapper">
              <table className="temp-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>ID</th>
                  </tr>
                </thead>
                <tbody>
                  {competidores.map((competidor) => (
                    <tr key={competidor.id}>
                      <td>{competidor.nombre}</td>
                      <td>{competidor.email}</td>
                      <td>{competidor.id}</td>
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

export default CompetitorsScreen;