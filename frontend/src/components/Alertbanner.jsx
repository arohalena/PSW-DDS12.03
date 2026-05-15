import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle, Vote, X } from "lucide-react";
import { useState } from "react";

const CONFIG = {
  warning: {
    bg: "#fffbeb", border: "#fde68a", color: "#92400e",
    Icon: AlertTriangle, iconColor: "#d97706",
    btnBg: "#d97706", btnHover: "#b45309",
  },
  success: {
    bg: "#ecfdf5", border: "#a7f3d0", color: "#065f46",
    Icon: CheckCircle, iconColor: "#16a34a",
    btnBg: "#16a34a", btnHover: "#15803d",
  },
  info: {
    bg: "#eff6ff", border: "#bfdbfe", color: "#1e40af",
    Icon: Vote, iconColor: "#3b82f6",
    btnBg: "#3b82f6", btnHover: "#2563eb",
  },
};

export function AlertBanner({ type = "info", title, message, actionLabel, actionHref, dismissible = false }) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  const { bg, border, color, Icon, iconColor, btnBg } = CONFIG[type] || CONFIG.info;

  return (
    <div
      className="dash-alert-banner"
      style={{ background: bg, borderColor: border, color }}
    >
      <Icon size={18} style={{ color: iconColor, flexShrink: 0, marginTop: 2 }} />

      <div style={{ flex: 1 }}>
        {title && <strong style={{ display: "block", marginBottom: 2 }}>{title}</strong>}
        <span style={{ fontSize: 14 }}>{message}</span>
      </div>

      {actionLabel && actionHref && (
        <Link
          to={actionHref}
          className="dash-alert-action"
          style={{ background: btnBg }}
        >
          {actionLabel}
        </Link>
      )}

      {dismissible && (
        <button
          className="dash-alert-dismiss"
          onClick={() => setVisible(false)}
          aria-label="Cerrar"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}