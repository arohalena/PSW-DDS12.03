import { useEffect, useState } from "react";
import {
  createEquipo,
  getEquipos,
  getEventosParaEquipo,
  getProyectosParaEquipo,
} from "../services/equipoService";
import { getCompetidores, assignCompetidor }  from "../services/competidorService";
import "../styles/temp-management.css";

function TeamsScreen() {
  const [equipos, setEquipos] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ nombre: "", eventoId: "", proyectoId: "" });

  const [showModal, setShowModal] = useState(false);
  const [selectedEquipo, setSelectedEquipo] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [competidoresSugeridos, setCompetidoresSugeridos] = useState([]);
  const [miembrosTemporales, setMiembrosTemporales] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
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

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.trim().length > 1) {
        setIsSearching(true);
        try {
          const data = await getCompetidores();
          const filtrados = data.filter(u =>
            u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase())
          );
          setCompetidoresSugeridos(filtrados);
        } catch (error) {
          console.error("Error buscando competidores", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setCompetidoresSugeridos([]);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const openModal = (equipo) => {
    setSelectedEquipo(equipo);
    setMiembrosTemporales(equipo.miembros || []); 
    setShowModal(true);
  };

  const addMiembro = (u) => {
    if (!miembrosTemporales.find(m => m.id === u.id)) {
      setMiembrosTemporales([...miembrosTemporales, u]);
    }
    setSearchTerm("");
  };

  const removeMiembro = (id) => {
    setMiembrosTemporales(miembrosTemporales.filter(m => m.id !== id));
  };

  const handleSaveMiembros = async () => {
    try {
      setSaving(true);
      console.log("Guardando miembros para el equipo:", selectedEquipo.id, miembrosTemporales);
      for (const miembro of miembrosTemporales) {
        await assignCompetidor({
          competidorId: miembro.id,
          eventoId: selectedEquipo.evento.id,
          equipoId: selectedEquipo.id
        });
      }
      setShowModal(false);
      await loadData();
    } catch (err) {
      setError("No se pudieron guardar los cambios");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      await createEquipo({
        nombre: form.nombre.trim(),
        evento: { id: form.eventoId },
        proyecto: { id: form.proyectoId },
      });
      setForm({ nombre: "", eventoId: "", proyectoId: "" });
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
        <h1>Gestión de Equipos</h1>
      </header>

      <section className="temp-card">
        <h2>Crear equipo</h2>
        <form className="temp-form" onSubmit={handleSubmit}>
          <input type="text" name="nombre" placeholder="Nombre" value={form.nombre} onChange={handleChange} required />
          <select name="eventoId" value={form.eventoId} onChange={handleChange} required>
            <option value="">Evento...</option>
            {eventos.map(ev => <option key={ev.id} value={ev.id}>{ev.nombre}</option>)}
          </select>
          <select name="proyectoId" value={form.proyectoId} onChange={handleChange} required>
            <option value="">Proyecto...</option>
            {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
          <button className="primary-btn" type="submit" disabled={saving}>Crear</button>
        </form>
      </section>

      <section className="temp-card">
        <h2>Listado</h2>
        <div className="temp-table-wrapper">
          <table className="temp-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Evento</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {equipos.map((equipo) => (
                <tr key={equipo.id}>
                  <td>{equipo.nombre}</td>
                  <td>{equipo.evento?.nombre}</td>
                  <td>
                    <button className="secondary-btn" onClick={() => openModal(equipo)}>
                      + Miembros
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

     {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <header className="modal-header">
              <h3>Equipo: {selectedEquipo?.nombre}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </header>

            <div className="modal-body">
              <label>Añadir nuevos miembros:</label>
              <div className="user-search-container">
                <input 
                  className="input-field" 
                  placeholder="Escribe nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                
                {competidoresSugeridos.length > 0 && (
                  <div className="user-results-dropdown">
                    {competidoresSugeridos.map((u) => (
                      <div key={u.id} className="user-result-item" onClick={() => addMiembro(u)}>
                        <span>{u.nombre}</span>
                        <small>{u.email}</small>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="selected-members-section">
                <h4>Miembros del equipo ({miembrosTemporales.length}):</h4>
                <div className="tags-container">
                  {miembrosTemporales.length === 0 && <p className="no-data">No hay miembros en este equipo.</p>}
                  {miembrosTemporales.map((m) => (
                    <div key={m.id} className="tag">
                      <div className="tag-info">
                        <span className="tag-email">{m.email}</span>
                      </div>
                      <button 
                        type="button" 
                        className="remove-tag-btn" 
                        onClick={() => removeMiembro(m.id)}
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <footer className="modal-footer" style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
              <button className="primary-btn" onClick={handleSaveMiembros} disabled={saving}>
                {saving ? "Guardando..." : "Guardar Cambios"}
              </button>
              <button className="secondary-btn" onClick={() => setShowModal(false)}>
                Cancelar
              </button>
            </footer>
          </div>
        </div>
      )}
    </main>
  );
}

export default TeamsScreen;