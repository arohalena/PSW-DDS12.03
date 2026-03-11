function StatCard({ title, value }) {
  return (
    <div className="stat-card">
      <span className="stat-title">{title}</span>
      <strong className="stat-value">{value}</strong>
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
      <StatCard title="Jurados" value={jurados} />
      <StatCard title="Participantes" value={participantes} />
      <StatCard title="Organizadores" value={organizadores} />
    </section>
  );
}

export default UserStats;