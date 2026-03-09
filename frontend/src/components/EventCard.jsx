import React from "react";
import "../styles/EventCard.css";

export default function EventCard({ evento }) {
  return (
    <div className="card">
      <div className="event-card-header">
        <h2 className="event-card-title">{evento.nombre}</h2>
        <span className="event-card-badge">{evento.tipo}</span>
      </div>

      <p className="event-card-desc">{evento.descripcion}</p>

      <div className="event-card-meta">
        <p><strong>Fecha:</strong> {evento.fechaInicio?.substring(0, 10)}</p>
        <p><strong>Código:</strong> {evento.codigoAcceso}</p>
      </div>

      <div className="event-card-actions">
        <button className="btnGray">Editar</button>
        <button className="btnGray">Proyectos</button>
        <button className="btn">Ver Resultados</button>
      </div>
    </div>
  );
}