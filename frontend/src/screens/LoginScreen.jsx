import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Vote, Mail, Lock, Eye, EyeOff, Info } from "lucide-react";
import { loginUsuario } from "../services/authService";
import "../styles/auth.css";

function LoginScreen() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showAdminInfo, setShowAdminInfo] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const usuario = await loginUsuario(formData);
      localStorage.setItem("usuarioLogueado", JSON.stringify(usuario));
      navigate("/usuarios");
    } catch (err) {
      setError(err.message || "Error al iniciar sesión");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-wrapper">
        <div className="auth-header">
          <div className="auth-logo-box">
            <Vote className="auth-logo-icon" />
          </div>
          <h1>Bienvenido a Votify</h1>
          <p>Inicia sesión para acceder a tu cuenta</p>
          <div
            className="auth-info-tooltip-wrapper"
            onMouseEnter={() => setShowAdminInfo(true)}
            onMouseLeave={() => setShowAdminInfo(false)}
          >
            <button type="button" className="auth-info-btn" aria-label="Información sobre acceso por defecto">
              <Info size={16} />
            </button>

            {showAdminInfo && (
              <div className="auth-info-tooltip">
                Existe un organizador por defecto.
                <br />
                <strong>Email:</strong> admin@votify.com
                <br />
                <strong>Contraseña:</strong> admin123
              </div>
            )}
          </div>
        </div>

        <div className="auth-card">
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="email">Correo electrónico</label>
              <div className="auth-input-wrapper">
                <Mail className="auth-input-icon" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="password">Contraseña</label>
              <div className="auth-input-wrapper">
                <Lock className="auth-input-icon" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="auth-links-row">
              <span></span>
              <a href="#" className="auth-link-disabled">
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button type="submit" className="auth-primary-btn">
              Iniciar sesión
            </button>
          </form>

          <div className="auth-divider">
            <span>o</span>
          </div>

          <p className="auth-footer-text">
            ¿No tienes una cuenta?{" "}
            <Link to="/registro" className="auth-link">
              Regístrate
            </Link>
          </p>
        </div>

        <div className="auth-copy">
          © 2026 Votify. Todos los derechos reservados.
        </div>
      </div>
    </div>
  );
}

export default LoginScreen;