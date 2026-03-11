function StatCard({ title, value, accentClass = "" }) {
  return (
    <div className="stat-card">
      <span className="stat-title">{title}</span>
      <strong className={`stat-value ${accentClass}`}>{value}</strong>
    </div>
  );
}

function UserStats({ usuarios }) {
  const total = usuarios.length;
  const jurados = usuarios.filter((u) => u.rol === "JURADO").length;
  const participantes = usuarios.filter((u) => u.rol === "PARTICIPANTE").length;
  const organizadores = usuarios.filter((u) => u.rol === "ORGANIZADOR").length;

  return (
    <section className="stats-grid">
      <StatCard title="Total Usuarios" value={total} />
      <StatCard title="Jurados" value={jurados} accentClass="accent-blue" />
      <StatCard title="Participantes" value={participantes} accentClass="accent-green" />
      <StatCard title="Organizadores" value={organizadores} accentClass="accent-purple" />
    </section>
  );
}

export default UserStats;