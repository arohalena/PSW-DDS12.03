import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Plus, Search, Filter, MoreVertical } from "lucide-react";
import { getProyectosByEvento, createProyecto } from "../services/proyectoService";
import { Plus, Search, Filter, MoreVertical } from "lucide-react";
import { getProyectosByEvento, createProyecto } from "../services/proyectoService";
import { getEventos } from "../services/eventoService";
import { getUsuarios } from "../services/usuarioService";
import {createEquipo} from "../services/equipoService";
import {assignCompetidor} from "../services/competidorService";
import { esOrganizador } from "../services/sessionService";
import "../styles/projects.css"; 

const CATEGORIAS = ["IA", "SOSTENIBILIDAD"];

function ProjectsScreen() {
  const { eventoId } = useParams();
  const [eventos, setEventos] = useState([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState("");
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  const puedeGestionar = esOrganizador();
  const idEfectivo = eventoId || eventoSeleccionado;

  useEffect(() => {
    if (!eventoId) {
      getEventos().then(setEventos).catch(() => setEventos([]));
      getEventos().then(setEventos).catch(() => setEventos([]));
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
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem", fontFamily: "sans-serif", color: "#111827" }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "600", margin: 0 }}>Gestión de Proyectos</h1>
          <p style={{ color: "#6b7280", marginTop: "0.25rem" }}>Administra los proyectos participantes del evento</p>
        </div>
        {(eventoId || eventoSeleccionado) && puedeGestionar && (
          <button 
            onClick={() => setShowModal(true)}
            style={{ backgroundColor: "#6366f1", color: "white", border: "none", padding: "0.6rem 1.2rem", borderRadius: "8px", display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontWeight: "500" }}
          >
            <Plus size={18} /> Crear Proyecto
          </button>
        )}
      </div>

      {/* Selector de Evento */}
      {!eventoId && (
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", marginBottom: "0.5rem" }}>Selecciona un evento</label>
          <select 
            value={eventoSeleccionado} 
            onChange={(e) => setEventoSeleccionado(e.target.value)}
            style={{ width: "100%", maxWidth: "400px", padding: "0.6rem", borderRadius: "8px", border: "1px solid #d1d5db", outline: "none" }}
          >
            <option value="">Seleccionar un evento</option>
            {eventos.map(ev => <option key={ev.id} value={ev.id}>{ev.nombre}</option>)}
          </select>
        </div>
      )}

      {/* Barra de Búsqueda */}
      <div style={{ backgroundColor: "white", padding: "1rem", borderRadius: "10px", border: "1px solid #e5e7eb", marginBottom: "1.5rem", display: "flex", gap: "1rem" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
          <input 
            type="text" 
            placeholder="Buscar proyectos..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", padding: "0.6rem 0.6rem 0.6rem 2.5rem", borderRadius: "8px", border: "1px solid #d1d5db", outline: "none" }}
          />
        </div>
        <button style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1rem", backgroundColor: "white", border: "1px solid #d1d5db", borderRadius: "8px", cursor: "pointer", color: "#374151" }}>
          <Filter size={16} /> Filtros
        </button>
      </div>

      {/* Tabla */}
      <div style={{ backgroundColor: "white", borderRadius: "10px", border: "1px solid #e5e7eb", overflow: "hidden shadow-sm" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
            <tr>
              <th style={{ padding: "1rem", fontSize: "0.75rem", color: "#6b7280", textTransform: "uppercase" }}>Proyecto</th>
              <th style={{ padding: "1rem", fontSize: "0.75rem", color: "#6b7280", textTransform: "uppercase" }}>Categoría</th>
              <th style={{ padding: "1rem", fontSize: "0.75rem", color: "#6b7280", textTransform: "uppercase" }}>Descripción</th>
              <th style={{ padding: "1rem", fontSize: "0.75rem", color: "#6b7280", textTransform: "uppercase" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((p) => (
              <tr key={p.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "1rem", fontWeight: "500" }}>{p.nombre}</td>
                <td style={{ padding: "1rem" }}>
                  <span style={{ backgroundColor: "#eff6ff", color: "#1d4ed8", padding: "0.25rem 0.6rem", borderRadius: "99px", fontSize: "0.75rem", fontWeight: "500" }}>
                    {p.tipoCategoria}
                  </span>
                </td>
                <td style={{ padding: "1rem", color: "#6b7280", fontSize: "0.875rem" }}>{p.descripcion || "—"}</td>
                <td style={{ padding: "1rem" }}>
                  <button style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}><MoreVertical size={20} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtrados.length === 0 && (
          <div style={{ padding: "3rem", textAlign: "center", color: "#9ca3af" }}>No se encontraron proyectos.</div>
        )}
      </div>

      {/* Modal simplificado */}
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