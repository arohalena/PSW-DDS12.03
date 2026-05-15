import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Vote, Mail, Lock, Eye, EyeOff, User } from "lucide-react";
import { registerUsuario } from "../../services/authService";
import "../../styles/auth.css";

function RegisterScreen() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      delete next.general;
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (formData.password !== formData.confirmPassword) {
      setErrors({ confirmPassword: "Las contraseñas no coinciden." });
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
      if (err.fieldErrors && Object.keys(err.fieldErrors).length > 0) {
        setErrors(err.fieldErrors);
      } else {
        setErrors({ general: err.message || "Error al registrar el usuario." });
      }
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
          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <div className="auth-field">
              <label htmlFor="nombre">Nombre completo</label>
              <div
                className={`auth-input-wrapper${
                  errors.nombre ? " auth-input-wrapper--error" : ""
                }`}
              >
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
              <div className="auth-hint">Al menos 2 caracteres.</div>
              {errors.nombre && <div className="auth-field-error">{errors.nombre}</div>}
            </div>

            <div className="auth-field">
              <label htmlFor="email">Correo electrónico</label>
              <div
                className={`auth-input-wrapper${
                  errors.email ? " auth-input-wrapper--error" : ""
                }`}
              >
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
              <div className="auth-hint">Formato: nombre@dominio.com</div>
              {errors.email && <div className="auth-field-error">{errors.email}</div>}
            </div>

            <div className="auth-field">
              <label htmlFor="password">Contraseña</label>
              <div
                className={`auth-input-wrapper${
                  errors.password ? " auth-input-wrapper--error" : ""
                }`}
              >
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
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="auth-hint">Mínimo 4 caracteres.</div>
              {errors.password && <div className="auth-field-error">{errors.password}</div>}
            </div>

            <div className="auth-field">
              <label htmlFor="confirmPassword">Confirmar contraseña</label>
              <div
                className={`auth-input-wrapper${
                  errors.confirmPassword ? " auth-input-wrapper--error" : ""
                }`}
              >
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
                  aria-label={
                    showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <div className="auth-field-error">{errors.confirmPassword}</div>
              )}
            </div>

            <div className="auth-helper-text">
              Tu rol se asignará automáticamente como participante.
            </div>

            {errors.general && <div className="auth-error">{errors.general}</div>}

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