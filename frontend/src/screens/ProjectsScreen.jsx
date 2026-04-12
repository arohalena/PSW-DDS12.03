import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Plus, Search, Filter, MoreVertical } from "lucide-react";
import { getProyectosByEvento, createProyecto } from "../services/proyectoService";
import { getEventos } from "../services/eventoService";
import { esOrganizador } from "../services/sessionService";
import "../styles/projects.css"; 

const CATEGORIAS = ["IA", "SOSTENIBILIDAD"];

function ProjectsScreen() {
  const { eventoId } = useParams();
  const [eventos, setEventos] = useState([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState("");
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  const puedeGestionar = esOrganizador();
<<<<<<< HEAD
  const desdeEvento = Boolean(eventoId);
=======
>>>>>>> 7dc782f (front de proyectos modificado)
  const idEfectivo = eventoId || eventoSeleccionado;

  useEffect(() => {
    if (!eventoId) {
      getEventos().then(setEventos).catch(() => setEventos([]));
<<<<<<< HEAD
    }
  }, [eventoId]);

  useEffect(() => {
    if (!eventoId) {
      getEventos().then(setEventos).catch(() => setEventos([]));
    }
    const load = async () => {
      try {
        setLoading(true);
        const data = await getProyectosByEvento(idEfectivo);
        setProyectos(data);
      } catch (err) {
        setError("Error al cargar proyectos");
      } finally {
        setLoading(false);
      }
    };
    load();
=======
    }
  }, [eventoId]);

  useEffect(() => {
    if (!idEfectivo) { setProyectos([]); return; }
    setLoading(true);
    getProyectosByEvento(idEfectivo)
      .then(setProyectos)
      .finally(() => setLoading(false));
  }, [idEfectivo]);

  const filtrados = useMemo(() => {
    return proyectos.filter((p) =>
      p.nombre?.toLowerCase().includes(search.toLowerCase()) ||
      p.tipoCategoria?.toLowerCase().includes(search.toLowerCase())
    );
  }, [proyectos, search]);

  return (
    <div className="projects-container">
      <header className="page-header">
        <div>
          <h1>Gestión de Proyectos</h1>
          <p>{desdeEvento ? "Proyectos del evento" : "Administra proyectos por evento"}</p>
        </div>
        {!desdeEvento && puedeGestionar && eventoSeleccionado && (
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={20} /> Crear Proyecto
          </button>
        )}
      </header>

      {!desdeEvento && (
        <div className="filters-section">
          <select 
            className="select-field" 
            value={eventoSeleccionado} 
            onChange={(e) => setEventoSeleccionado(e.target.value)}
          >
            <option value="">Selecciona un evento</option>
            {eventos.map(ev => <option key={ev.id} value={ev.id}>{ev.nombre}</option>)}
          </select>
        </div>
      )}

      <div className="filters-section">
        <div className="search-wrapper">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            className="input-field"
            placeholder="Buscar proyectos por nombre o categoría..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="table-container">
        <table className="projects-table">
          <thead>
            <tr>
              <th>Proyecto</th>
              <th>Categoría</th>
              <th>Descripción</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((p) => (
              <tr key={p.id} className="row-hover">
                <td style={{ fontWeight: 500 }}>{p.nombre}</td>
                <td><span className="badge">{p.tipoCategoria}</span></td>
                <td style={{ color: '#6b7280' }}>{p.descripcion || "—"}</td>
                <td style={{ textAlign: 'right' }}>
                  <MoreVertical size={18} style={{ cursor: 'pointer', color: '#9ca3af' }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zUnit: 100 }}>
          <div style={{ backgroundColor: "white", padding: "2rem", borderRadius: "12px", width: "100%", maxWidth: "500px" }}>
            <h2 style={{ marginBottom: "1.5rem" }}>Nuevo Proyecto</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
               <input placeholder="Nombre" style={{ padding: "0.6rem", borderRadius: "6px", border: "1px solid #ddd" }} />
               <select style={{ padding: "0.6rem", borderRadius: "6px", border: "1px solid #ddd" }}>
                  {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
               </select>
               <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1rem" }}>
                  <button onClick={() => setShowModal(false)} style={{ padding: "0.5rem 1rem", border: "1px solid #ddd", borderRadius: "6px", background: "white" }}>Cancelar</button>
                  <button style={{ padding: "0.5rem 1rem", backgroundColor: "#6366f1", color: "white", border: "none", borderRadius: "6px" }}>Guardar</button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectsScreen;