function Sidebar() {
  const items = [
    "Dashboard",
    "Eventos",
    "Proyectos",
    "Asignación",
    "Criterios",
    "Votación",
    "Usuarios",
    "Resultados",
    "Mi Proyecto",
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">V</div>
        <span>Votify</span>
      </div>

      <nav className="sidebar-nav">
        {items.map((item) => (
          <button
            key={item}
            className={`sidebar-link ${item === "Usuarios" ? "active" : ""}`}
          >
            {item}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="sidebar-link">Configuración</button>
      </div>
    </aside>
  );
}

export default Sidebar;