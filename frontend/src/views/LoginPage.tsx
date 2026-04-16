import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useLogin } from '../controllers/hooks/useLogin';
import { usePasswordReset } from '../controllers/hooks/usePasswordReset';
import TopBar from '../components/TopBar';

/* ─── Google SVG logo ─────────────────────────────── */
const GoogleLogo: React.FC = () => (
  <svg
    className="google-icon"
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

/* ─── LoginPage ───────────────────────────────────── */
const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const handleLoginSuccess = () => navigate('/home');

  const {
    identifier, setIdentifier,
    password, setPassword,
    message: loginMessage,
    loading: loginLoading,
    submitLogin,
  } = useLogin(handleLoginSuccess);

  const [showPassword, setShowPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const {
    identifier: resetEmail,
    setIdentifier: setResetEmail,
    message: resetMessage,
    setMessage: setResetMessage,
    loading: resetLoading,
    submitPasswordReset,
  } = usePasswordReset();

  const handleToggleReset = () => {
    setIsResettingPassword((prev) => !prev);
    setResetMessage(null);
    if (!isResettingPassword && identifier) setResetEmail(identifier);
  };

  const handleGoogleLogin = () => {
    const apiBase = import.meta.env.VITE_API_URL ?? '';
    window.location.href = `${apiBase}/auth/google`;
  };

  return (
    <div className="page-screen">
      <TopBar />

      <main className="auth-screen-body" role="main">
        <div className="auth-content">

          {/* ── Título de sección ── */}
          <div className="auth-heading">
            {isResettingPassword ? (
              <>
                <h1>Recuperar contraseña</h1>
                <p>Introduce tu correo y te enviaremos un enlace para restablecer tu contraseña.</p>
              </>
            ) : (
              <>
                <h1>Iniciar sesión</h1>
                <p>Bienvenido de nuevo</p>
              </>
            )}
          </div>

          {/* ══ RESET FORM ══ */}
          {isResettingPassword ? (
            <form
              id="reset-form"
              onSubmit={submitPasswordReset}
              className="auth-form"
              noValidate
              aria-label="Formulario de recuperación de contraseña"
            >
              <div className="form-group">
                <label htmlFor="resetEmail" className="form-label">
                  Correo electrónico
                </label>
                <div className="form-input-wrap">
                  <span className="form-input-icon" aria-hidden="true">
                    <Mail size={18} />
                  </span>
                  <input
                    id="resetEmail"
                    type="email"
                    className="form-input has-icon-left"
                    placeholder="tu@email.com"
                    autoComplete="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    disabled={resetLoading}
                    aria-required="true"
                  />
                </div>
              </div>

              <button
                type="submit"
                id="reset-submit-btn"
                className={`btn-primary${resetLoading ? ' loading' : ''}`}
                disabled={resetLoading}
              >
                {!resetLoading && 'Enviar enlace'}
              </button>

              {resetMessage && (
                <div className={`message ${resetMessage.type}`} role="alert" aria-live="polite">
                  {resetMessage.type === 'error'
                    ? <AlertCircle size={16} aria-hidden="true" />
                    : <CheckCircle2 size={16} aria-hidden="true" />}
                  {resetMessage.text}
                </div>
              )}

              <button
                type="button"
                id="back-to-login-btn"
                className="btn-back"
                onClick={handleToggleReset}
              >
                <ArrowLeft size={16} aria-hidden="true" />
                Volver al inicio de sesión
              </button>
            </form>

          ) : (

            /* ══ LOGIN FORM ══ */
            <>
              <form
                id="login-form"
                onSubmit={submitLogin}
                className="auth-form"
                noValidate
                aria-label="Formulario de inicio de sesión"
              >
                {/* Email / usuario */}
                <div className="form-group">
                  <label htmlFor="identifier" className="form-label">
                    Email o usuario
                  </label>
                  <div className="form-input-wrap">
                    <span className="form-input-icon" aria-hidden="true">
                      <Mail size={18} />
                    </span>
                    <input
                      id="identifier"
                      type="text"
                      className="form-input has-icon-left"
                      placeholder="tu@email.com"
                      autoComplete="username"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      required
                      disabled={loginLoading}
                      aria-required="true"
                    />
                  </div>
                </div>

                {/* Contraseña */}
                <div className="form-group">
                  <div className="form-label-row">
                    <label htmlFor="password" className="form-label">
                      Contraseña
                    </label>
                    <button
                      type="button"
                      id="forgot-password-btn"
                      className="forgot-link"
                      onClick={handleToggleReset}
                      aria-label="Recuperar contraseña olvidada"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <div className="form-input-wrap">
                    <span className="form-input-icon" aria-hidden="true">
                      <Lock size={18} />
                    </span>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      className="form-input has-icon-left has-icon-right"
                      placeholder="••••••••"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loginLoading}
                      aria-required="true"
                    />
                    <button
                      type="button"
                      id="toggle-password-btn"
                      className="input-action-btn"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword
                        ? <EyeOff size={18} aria-hidden="true" />
                        : <Eye size={18} aria-hidden="true" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  id="login-submit-btn"
                  className={`btn-primary${loginLoading ? ' loading' : ''}`}
                  disabled={loginLoading}
                >
                  {!loginLoading && 'Entrar'}
                </button>

                {loginMessage && (
                  <div className={`message ${loginMessage.type}`} role="alert" aria-live="polite">
                    {loginMessage.type === 'error'
                      ? <AlertCircle size={16} aria-hidden="true" />
                      : <CheckCircle2 size={16} aria-hidden="true" />}
                    {loginMessage.text}
                  </div>
                )}
              </form>

              {/* Social auth */}
              <div className="auth-divider" aria-hidden="true">
                <span className="line" />
                <span>o</span>
                <span className="line" />
              </div>

              <button
                type="button"
                id="google-login-btn"
                className="btn-social"
                onClick={handleGoogleLogin}
                disabled={loginLoading}
                aria-label="Iniciar sesión con Google"
              >
                <GoogleLogo />
                Continuar con Google
              </button>

              <p className="auth-footer">
                ¿No tienes cuenta?{' '}
                <Link to="/register" id="go-register-link">
                  Regístrate
                </Link>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
