import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

/**
 * Tarjeta de acción rápida con icono, título y descripción.
 */
export function QuickCard({ to, iconColor, Icon, title, description }) {
  return (
    <Link to={to} className="dashboard-quick-card">
      <div className={`dashboard-quick-icon ${iconColor}`}>
        <Icon size={28} />
      </div>
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <ArrowRight
        size={22}
        style={{ marginLeft: "auto", flexShrink: 0, color: "#9ca3af" }}
      />
    </Link>
  );
}