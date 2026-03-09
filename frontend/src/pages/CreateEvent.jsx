
import React, { useState } from "react";
import { createEvento } from "../api/eventsApi";
import { useNavigate } from "react-router-dom";
import Input from "../components/Input";
import "../styles/CreateEvent.css";
import "../styles/Input.css";

export default function CreateEvent() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    fechaInicio: "",
    fechaFin: "",
    organizadorId: "",
    tipoEvento: "PUBLICO",
  });

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...form,
      fechaInicio: form.fechaInicio ? `${form.fechaInicio}T00:00:00` : null,
      fechaFin: form.fechaFin ? `${form.fechaFin}T00:00:00` : null,
    };

    await createEvento(payload);
    navigate("/");
  };

  return (
    <div className="create-event-wrapper container">
      <h1 className="create-event-title">Crear Nuevo Evento</h1>

      <form onSubmit={handleSubmit}>
        <Input
          label="Nombre del Evento"
          name="nombre"
          value={form.nombre}
          onChange={handleChange}
          placeholder="Ej. Hackathon Valencia"
        />

        <div className="input-wrapper">
          <label className="input-label">Descripción</label>
          <textarea
            name="descripcion"
            value={form.descripcion}
            onChange={handleChange}
            placeholder="Describe el evento..."
            rows={4}
            className="textarea"
          />
        </div>

        <div className="create-event-row2">
          <Input
            label="Fecha de Inicio"
            name="fechaInicio"
            type="date"
            value={form.fechaInicio}
            onChange={handleChange}
          />

          <Input
            label="Fecha de Fin"
            name="fechaFin"
            type="date"
            value={form.fechaFin}
            onChange={handleChange}
          />
        </div>

        <div className="input-wrapper">
          <label className="input-label">Tipo de Votación</label>
          <select
            name="tipoEvento"
            value={form.tipoEvento}
            onChange={handleChange}
            className="select"
          >
            <option value="PUBLICO">Público</option>
            <option value="JURADO">Jurado</option>
            <option value="MIXTO">Mixto</option>
          </select>
        </div>

        <Input
          label="Organizador ID (temporal)"
          name="organizadorId"
          value={form.organizadorId}
          onChange={handleChange}
          placeholder="Pega aquí el UUID del organizador"
        />

        <button type="submit" className="create-event-submit">
          Crear Evento
        </button>
      </form>
    </div>
  );
}