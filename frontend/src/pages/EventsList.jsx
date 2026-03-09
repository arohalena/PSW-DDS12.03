import React from "react";
import { useEffect, useState } from "react";
import { getEventos } from "../api/eventsApi";
import EventCard from "../components/EventCard";
import { useNavigate } from "react-router-dom";
import Input from "../components/Input";
import "../styles/EventsList.css";

export default function EventsList() {
  const [eventos, setEventos] = useState([]);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    getEventos().then((res) => setEventos(res.data));
  }, []);

  const filtered = eventos.filter((e) =>
    e.nombre?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <div className="events-header">
        <h1 style={{ margin: 0 }}>Gestión de Eventos</h1>

        <div className="events-search">
          <Input
            name="q"
            placeholder="Buscar eventos..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <button className="btn" onClick={() => navigate("/eventos/nuevo")}>
          + Crear Evento
        </button>
      </div>

      <div className="events-grid">
        {filtered.map((e) => (
          <EventCard key={e.id} evento={e} />
        ))}
      </div>
    </>
  );
}