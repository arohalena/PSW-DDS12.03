import { useEffect, useState } from "react";
import { getCompetidores } from "../../services/competidorService";
import { createProyectoConEquipo } from "../../services/proyectoService";

const CATEGORIAS = ["IA", "SOSTENIBILIDAD"];

function CreateProjectModal({ eventoId, onCreado, onClose }) {
  const [formData, setFormData] = useState({
    nombre: "",
    nombreEquipo: "",
    descripcion: "",
    tipoCategoria: "",
  });

  const [miembros, setMiembros] = useState([]);
  const [search, setSearch] = useState("");
  const [resultados, setResultados] = useState([]);

  useEffect(() => {
    if (search.length > 1) {
      getCompetidores().then(data => {
        setResultados(
          data.filter(u =>
            u.nombre.toLowerCase().includes(search.toLowerCase())
          )
        );
      });
    } else {
      setResultados([]);
    }
  }, [search]);

  const addMiembro = (u) => {
    if (!miembros.find(m => m.id === u.id)) {
      setMiembros([...miembros, u]);
    }
  };

  const submit = async (e) => {
    e.preventDefault();

    await createProyectoConEquipo({
      ...formData,
      miembrosEmails: miembros.map(m => m.email),
      eventoId
    });

    onCreado();
    onClose();
  };

  return (
    <div className="modal">
      <h2>Crear Proyecto</h2>

      <form onSubmit={submit}>
        <input
          placeholder="Nombre"
          value={formData.nombre}
          onChange={e => setFormData({...formData, nombre: e.target.value})}
        />

        <input
          placeholder="Equipo"
          value={formData.nombreEquipo}
          onChange={e => setFormData({...formData, nombreEquipo: e.target.value})}
        />

        <textarea
          placeholder="Descripción"
          onChange={e => setFormData({...formData, descripcion: e.target.value})}
        />

        <input
          placeholder="Buscar miembros"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {resultados.map(u => (
          <div key={u.id} onClick={() => addMiembro(u)}>
            {u.nombre}
          </div>
        ))}

        <select
          onChange={e => setFormData({...formData, tipoCategoria: e.target.value})}
        >
          <option value="">Categoría</option>
          {CATEGORIAS.map(c => (
            <option key={c}>{c}</option>
          ))}
        </select>

        <button type="submit">Crear</button>
      </form>

      <button onClick={onClose}>Cerrar</button>
    </div>
  );
}

export default CreateProjectModal;