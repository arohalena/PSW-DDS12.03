import React from "react";
import { NavLink } from "react-router-dom";
import "../styles/Navbar.css";

export default function Navbar() {
  return (
    <nav className="nav">
      <div className="brand">Votify</div>

      <NavLink
        to="/"
        className={({ isActive }) => `link ${isActive ? "active" : ""}`}
      >
        Eventos
      </NavLink>

      <NavLink
        to="/eventos/nuevo"
        className={({ isActive }) => `link ${isActive ? "active" : ""}`}
      >
        Crear evento
      </NavLink>
    </nav>
  );
}