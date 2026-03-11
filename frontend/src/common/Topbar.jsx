function Topbar() {
  return (
    <header className="topbar">
      <div className="topbar-event">
        <span className="topbar-dot" />
        <span>Nombre del Evento</span>
      </div>

      <div className="topbar-user">
        <div className="topbar-user-avatar" />
        <div className="topbar-user-info">
          <div className="topbar-user-name"></div>
          <div className="topbar-user-role"></div>
        </div>
      </div>
    </header>
  );
}

export default Topbar;