import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Vote, Mail, Lock, Eye, EyeOff, User } from "lucide-react";
import { registerUsuario } from "../services/authService";
import "../styles/auth.css";

function RegisterScreen() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    try {
    const usuario = await registerUsuario({
      nombre: formData.nombre,
      email: formData.email,
      password: formData.password,
    });

    localStorage.setItem("usuarioLogueado", JSON.stringify(usuario));
    navigate("/usuarios");
  } catch (err) {
    setError(err.message || "Error al registrar el usuario");
  }
  };

  return (
    <div className="auth-page">
      <div className="auth-wrapper">
        <div className="auth-header">
          <div className="auth-logo-box">
            <Vote className="auth-logo-icon" />
          </div>
          <h1>Crear cuenta</h1>
          <p>Completa tus datos para registrarte en Votify</p>
        </div>

        <div className="auth-card">
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="nombre">Nombre completo</label>
              <div className="auth-input-wrapper">
                <User className="auth-input-icon" />
                <input
                  id="nombre"
                  name="nombre"
                  type="text"
                  placeholder="Juan Pérez"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

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
                  minLength={4}
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

            <div className="auth-field">
              <label htmlFor="confirmPassword">Confirmar contraseña</label>
              <div className="auth-input-wrapper">
                <Lock className="auth-input-icon" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="auth-helper-text">
              Tu rol se asignará automáticamente como participante.
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button type="submit" className="auth-primary-btn">
              Crear cuenta
            </button>
          </form>

          <div className="auth-divider">
            <span>o</span>
          </div>

          <p className="auth-footer-text">
            ¿Ya tienes una cuenta?{" "}
            <Link to="/login" className="auth-link">
              Inicia sesión
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

export default RegisterScreen;