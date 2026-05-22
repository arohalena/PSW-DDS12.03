// Tarjeta de estadística reutilizable en todas las vistas del dashboard

export function StatCard({ label, value, icon: Icon, colorClass }) {
  return (
    <div className="dash-stat-card">
      <div className={`dash-stat-icon ${colorClass}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="dash-stat-label">{label}</p>
        <strong className="dash-stat-value">{value}</strong>
      </div>
    </div>
  );
}