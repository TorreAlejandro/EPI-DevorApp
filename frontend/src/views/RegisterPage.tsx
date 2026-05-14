import React, { useState } from 'react';
import Autocomplete from 'react-google-autocomplete';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail, User, Lock, Eye, EyeOff,
  MapPin, Navigation, AlertCircle, CheckCircle2, Loader2, ArrowLeft, Search,
} from 'lucide-react';
import { useRegister } from '../controllers/hooks/useRegister';
import { authService } from '../models/api/authService';
import TopBar from '../components/TopBar';
import { useGoogleLogin } from '@react-oauth/google';

/* ─── Google SVG logo ─────────────────────────────── */
const GoogleLogo: React.FC = () => (
  <svg className="google-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

/* ─── Step progress bar ─────────────────────────────── */
interface StepBarProps { current: number; total: number; }
const StepBar: React.FC<StepBarProps> = ({ current, total }) => (
  <div className="step-bar" aria-label={`Paso ${current} de ${total}`} role="progressbar"
    aria-valuenow={current} aria-valuemin={1} aria-valuemax={total}>
    {Array.from({ length: total }).map((_, i) => (
      <div key={i} className={`step-segment${i < current ? ' active' : ''}`} />
    ))}
  </div>
);

/* ─── RegisterPage ───────────────────────────────────── */
const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const handleSwitchToLogin = () => navigate('/login');

  const { form, handleInputChange, setFieldValue, message, loading, isWaitingVerification, submitRegister } =
    useRegister(handleSwitchToLogin);

  const [step, setStep] = useState<1 | 2>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; username?: string }>({});
  const [checkLoading, setCheckLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsLabel, setGpsLabel] = useState<string | null>(null);

  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newUbicacion, setNewUbicacion] = useState('');
  const [googleToken, setGoogleToken] = useState<string | null>(null);

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      setGoogleError(null);
      try {
        const res = await authService.loginWithGoogle(tokenResponse.access_token);
        if (res.require_username) {
          setGoogleToken(tokenResponse.access_token);
          setShowUsernameModal(true);
        } else {
          handleSwitchToLogin();
        }
      } catch (err: any) {
        setGoogleError(err.message);
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => setGoogleError('Error al conectar con Google'),
  });

  const submitGoogleUsername = async () => {
    if (!newUsername.trim() || !googleToken) return;
    setGoogleLoading(true);
    setGoogleError(null);
    try {
      await authService.registerWithGoogle(googleToken, newUsername.trim(), newUbicacion.trim());
      setShowUsernameModal(false);
      handleSwitchToLogin(); // Redirigir al inicio de sesión
    } catch (err: any) {
      setGoogleError(err.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  /* ── Step 1 validation + availability check ── */
  const handleContinue = async () => {
    setStepError(null);
    setFieldErrors({});

    // Local validation first (fast, no network)
    if (!form.email.trim())       return setStepError('El email es obligatorio.');
    if (!/\S+@\S+\.\S+/.test(form.email)) return setStepError('Introduce un email válido.');
    if (!form.username.trim())    return setStepError('El nombre de usuario es obligatorio.');
    if (form.username.length < 3) return setStepError('El usuario debe tener al menos 3 caracteres.');
    if (!form.password)           return setStepError('La contraseña es obligatoria.');
    if (form.password.length < 8) return setStepError('La contraseña debe tener al menos 8 caracteres.');
    if (!form.nombre.trim())      return setStepError('El nombre es obligatorio.');
    if (!form.apellidos.trim())   return setStepError('Los apellidos son obligatorios.');

    // Remote availability check
    setCheckLoading(true);
    try {
      const { email_taken, username_taken } = await authService.checkAvailability(
        form.email.trim(),
        form.username.trim()
      );

      const errs: { email?: string; username?: string } = {};
      if (email_taken)    errs.email    = 'Este email ya está registrado.';
      if (username_taken) errs.username = 'Este nombre de usuario ya está en uso.';

      if (Object.keys(errs).length > 0) {
        setFieldErrors(errs);
        return;
      }
    } catch {
      // Si la comprobación falla por red, dejamos pasar (el backend lo filtrará)
    } finally {
      setCheckLoading(false);
    }

    setStep(2);
  };

  /* ── GPS detection ── */
  const handleUseGPS = () => {
    if (!navigator.geolocation) {
      setStepError('Tu dispositivo no soporta geolocalización.');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${import.meta.env.VITE_GOOGLE_API_KEY}&language=es`
          );
          const data = await res.json();
          if (data.results?.[0]) {
            const address = data.results[0].formatted_address;
            setFieldValue('ubicacion', address);
            setGpsLabel(address);
          }
        } catch {
          setStepError('No se pudo obtener la dirección. Intenta buscarla manualmente.');
        } finally {
          setGpsLoading(false);
        }
      },
      () => {
        setStepError('Permiso de ubicación denegado. Busca tu ubicación manualmente.');
        setGpsLoading(false);
      },
      { timeout: 10000 }
    );
  };

  /* ── Password strength ── */
  const pwStrength = (() => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8)  s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s; // 0-4
  })();
  const pwStrengthLabel = ['', 'Débil', 'Regular', 'Buena', 'Fuerte'][pwStrength];
  const pwStrengthClass = ['', 'weak', 'fair', 'good', 'strong'][pwStrength];

  /* ═══════════════════════════════════
     WAITING FOR VERIFICATION
  ═══════════════════════════════════ */
  if (isWaitingVerification) {
    return (
      <div className="page-screen">
        <TopBar />
        <main className="auth-screen-body">
          <div className="auth-content" style={{ alignItems: 'center', textAlign: 'center' }}>
            <div className="auth-heading">
              <h1>Verifica tu correo</h1>
              <p>
                Hemos enviado un enlace a{' '}
                <strong style={{ color: 'var(--text)' }}>{form.email}</strong>.
                {' '}Revisa tu bandeja de entrada y la carpeta de spam.
              </p>
            </div>
            <Loader2 size={44} strokeWidth={1.5} aria-hidden="true"
              style={{ color: 'var(--accent)', animation: 'spin 1.2s linear infinite' }} />
            <p className="text-muted text-sm">Esperando confirmación…</p>
            {message && (
              <div className={`message ${message.type}`} role="alert">
                {message.type === 'error'
                  ? <AlertCircle size={16} aria-hidden="true" />
                  : <CheckCircle2 size={16} aria-hidden="true" />}
                {message.text}
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="page-screen">
      <TopBar />
      <main className="auth-screen-body">
        <div className="auth-content">

          {/* ── Header ── */}
          <div className="auth-heading">
            <h1>Crear cuenta</h1>
            <p>
              {step === 1
                ? 'Paso 1 de 2 · Datos de acceso'
                : 'Paso 2 de 2 · Tu ubicación'}
            </p>
            <StepBar current={step} total={2} />
          </div>

          {/* ════════════════════════
              STEP 1 — Datos de acceso
          ════════════════════════ */}
          {step === 1 && (
            <>
              <div className="auth-form">
                {/* Email */}
                <div className="form-group">
                  <label htmlFor="reg-email" className="form-label">Email</label>
                  <div className="form-input-wrap">
                    <span className="form-input-icon" aria-hidden="true"><Mail size={18} /></span>
                    <input
                      id="reg-email" name="email" type="email"
                      className={`form-input has-icon-left${fieldErrors.email ? ' input-error' : ''}`}
                      placeholder="tu@email.com"
                      autoComplete="email"
                      value={form.email} onChange={(e) => { handleInputChange(e); setFieldErrors(fe => ({ ...fe, email: undefined })); }}
                      aria-required="true"
                      aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                    />
                  </div>
                  {fieldErrors.email && (
                    <p id="email-error" className="field-error" role="alert">
                      <AlertCircle size={13} aria-hidden="true" />{fieldErrors.email}
                    </p>
                  )}
                </div>

                {/* Username */}
                <div className="form-group">
                  <label htmlFor="reg-username" className="form-label">Nombre de usuario</label>
                  <div className="form-input-wrap">
                    <span className="form-input-icon" aria-hidden="true"><User size={18} /></span>
                    <input
                      id="reg-username" name="username" type="text"
                      className={`form-input has-icon-left${fieldErrors.username ? ' input-error' : ''}`}
                      placeholder="@usuario"
                      autoComplete="username"
                      value={form.username} onChange={(e) => { handleInputChange(e); setFieldErrors(fe => ({ ...fe, username: undefined })); }}
                      aria-required="true"
                      aria-describedby={fieldErrors.username ? 'username-error' : undefined}
                    />
                  </div>
                  {fieldErrors.username && (
                    <p id="username-error" className="field-error" role="alert">
                      <AlertCircle size={13} aria-hidden="true" />{fieldErrors.username}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="form-group">
                  <label htmlFor="reg-password" className="form-label">Contraseña</label>
                  <div className="form-input-wrap">
                    <span className="form-input-icon" aria-hidden="true"><Lock size={18} /></span>
                    <input
                      id="reg-password" name="password"
                      type={showPassword ? 'text' : 'password'}
                      className="form-input has-icon-left has-icon-right"
                      placeholder="Mínimo 8 caracteres"
                      autoComplete="new-password"
                      value={form.password} onChange={handleInputChange}
                      aria-required="true"
                    />
                    <button
                      type="button" id="toggle-reg-password-btn"
                      className="input-action-btn"
                      onClick={() => setShowPassword(v => !v)}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                    </button>
                  </div>

                  {/* Password strength */}
                  {form.password && (
                    <div className="pw-strength" aria-live="polite">
                      <div className="pw-strength-bar">
                        {[1, 2, 3, 4].map(n => (
                          <div key={n} className={`pw-seg${pwStrength >= n ? ` ${pwStrengthClass}` : ''}`} />
                        ))}
                      </div>
                      <span className={`pw-label ${pwStrengthClass}`}>{pwStrengthLabel}</span>
                    </div>
                  )}
                </div>

                {/* Nombre + Apellidos */}
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="reg-nombre" className="form-label">Nombre</label>
                    <input
                      id="reg-nombre" name="nombre" type="text"
                      className="form-input"
                      autoComplete="given-name"
                      value={form.nombre} onChange={handleInputChange}
                      aria-required="true"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="reg-apellidos" className="form-label">Apellidos</label>
                    <input
                      id="reg-apellidos" name="apellidos" type="text"
                      className="form-input"
                      autoComplete="family-name"
                      value={form.apellidos} onChange={handleInputChange}
                      aria-required="true"
                    />
                  </div>
                </div>

                {/* Step error */}
                {stepError && (
                  <div className="message error" role="alert" aria-live="polite">
                    <AlertCircle size={16} aria-hidden="true" />
                    {stepError}
                  </div>
                )}

                <button
                  type="button" id="register-continue-btn"
                  className={`btn-primary${checkLoading ? ' loading' : ''}`}
                  onClick={handleContinue}
                  disabled={checkLoading}
                >
                  {!checkLoading && 'Continuar'}
                </button>
              </div>

              {/* Social auth */}
              <div className="auth-divider" aria-hidden="true" style={{ marginTop: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span className="line" style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                <span style={{ color: 'var(--text-muted)' }}>o</span>
                <span className="line" style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              </div>

              {googleError && (
                <div className="message error" role="alert" style={{ marginBottom: '1rem' }}>
                  <AlertCircle size={16} /> {googleError}
                </div>
              )}
              
              <button
                type="button"
                id="google-login-btn"
                className="btn-social"
                onClick={() => handleGoogleLogin()}
                disabled={googleLoading}
                aria-label="Iniciar sesión con Google"
              >
                {googleLoading ? 'Cargando...' : (
                  <>
                    <GoogleLogo />
                    Continuar con Google
                  </>
                )}
              </button>

              <p className="auth-footer" style={{ marginTop: '1.5rem' }}>
                ¿Ya tienes cuenta?{' '}
                <Link to="/login" id="go-login-link">Inicia sesión</Link>
              </p>
            </>
          )}

          {/* ════════════════════════
              STEP 2 — Ubicación
          ════════════════════════ */}
          {step === 2 && (
            <form id="register-form" onSubmit={submitRegister} className="auth-form" noValidate>

              {/* Info card */}
              <div className="location-info-card">
                <span className="location-info-icon" aria-hidden="true">
                  <MapPin size={20} />
                </span>
                <div>
                  <p className="location-info-title">Tu ubicación preferida</p>
                  <p className="location-info-desc">
                    Usaremos esta zona para mostrarte restaurantes cercanos. Podrás cambiarla después desde tu perfil.
                  </p>
                </div>
              </div>

              {/* Search + GPS row */}
              <div className="form-group">
                <label htmlFor="reg-ubicacion" className="form-label">Busca tu ubicación</label>
                <div className="location-search-row">
                  <div className="form-input-wrap" style={{ flex: 1 }}>
                    <span className="form-input-icon" aria-hidden="true"><Search size={18} /></span>
                    <Autocomplete
                      id="reg-ubicacion"
                      apiKey={import.meta.env.VITE_GOOGLE_API_KEY}
                      onChange={() => {
                        setFieldValue('ubicacion', '');
                        setGpsLabel(null);
                      }}
                      onPlaceSelected={(place) => {
                        if (place?.formatted_address) {
                          setFieldValue('ubicacion', place.formatted_address);
                          setGpsLabel(place.formatted_address);
                        }
                      }}
                      options={{ types: [] }}
                      className="form-input has-icon-left"
                      placeholder="Ciudad, barrio o dirección..."
                      defaultValue={gpsLabel ?? form.ubicacion}
                    />
                  </div>

                  <button
                    type="button" id="use-gps-btn"
                    className={`btn-gps${gpsLoading ? ' loading' : ''}`}
                    onClick={handleUseGPS}
                    disabled={gpsLoading}
                    aria-label="Usar mi ubicación actual"
                    title="Usar mi ubicación"
                  >
                    {gpsLoading
                      ? <Loader2 size={16} className="spin-icon" aria-hidden="true" />
                      : <Navigation size={16} aria-hidden="true" />}
                    <span>Usar mi ubicación</span>
                  </button>
                </div>
              </div>

              {/* GPS detected result */}
              {gpsLabel && (
                <div className="location-detected" role="status" aria-live="polite">
                  <span className="location-detected-icon" aria-hidden="true"><MapPin size={16} /></span>
                  <div className="location-detected-text">
                    <span className="location-detected-name">{gpsLabel}</span>
                    <span className="location-detected-sub">Ubicación detectada automáticamente</span>
                  </div>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => { setGpsLabel(null); setFieldValue('ubicacion', ''); }}
                    aria-label="Cambiar ubicación"
                  >
                    Cambiar
                  </button>
                </div>
              )}

              {/* API error */}
              {message && (
                <div className={`message ${message.type}`} role="alert" aria-live="polite">
                  {message.type === 'error'
                    ? <AlertCircle size={16} aria-hidden="true" />
                    : <CheckCircle2 size={16} aria-hidden="true" />}
                  {message.text}
                </div>
              )}

              <button
                type="submit" id="register-submit-btn"
                className={`btn-primary${loading ? ' loading' : ''}`}
                disabled={loading}
              >
                {!loading && 'Crear cuenta'}
              </button>

              <button
                type="button" id="register-back-btn"
                className="btn-back"
                onClick={() => { setStep(1); setStepError(null); }}
                style={{ alignSelf: 'center' }}
              >
                <ArrowLeft size={16} aria-hidden="true" />
                Volver
              </button>
            </form>
          )}

        </div>
      </main>

      {/* Modal para nuevo nombre de usuario */}
      {showUsernameModal && (
        <div className="sidemenu-overlay open" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="sidemenu-backdrop" onClick={() => setShowUsernameModal(false)} />
          <div className="auth-content" style={{ position: 'relative', zIndex: 10000, background: 'var(--bg)', padding: '2rem', borderRadius: '1rem', width: '90%', maxWidth: '400px' }}>
            <h2>Elige tu nombre de usuario</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
              Ya casi terminamos. Solo necesitas elegir un nombre de usuario y tu ubicación preferida para completar tu registro con Google.
            </p>
            <div className="form-group">
              <input
                type="text"
                className="form-input"
                placeholder="@usuario"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ marginTop: '0.75rem' }}>
              <Autocomplete
                apiKey={import.meta.env.VITE_GOOGLE_API_KEY}
                onPlaceSelected={(place) => {
                  if (place?.formatted_address) {
                    setNewUbicacion(place.formatted_address);
                  }
                }}
                onChange={(e: any) => setNewUbicacion(e.target.value)}
                options={{ types: [] }}
                className="form-input"
                placeholder="Ubicación favorita (ej. Madrid)"
                defaultValue={newUbicacion}
              />
            </div>
            {googleError && (
              <div className="message error" role="alert" style={{ marginBottom: '1rem' }}>
                <AlertCircle size={16} /> {googleError}
              </div>
            )}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button className="btn-back" onClick={() => setShowUsernameModal(false)} disabled={googleLoading}>Cancelar</button>
              <button className={`btn-primary${googleLoading ? ' loading' : ''}`} onClick={submitGoogleUsername} disabled={googleLoading || !newUsername.trim()}>
                {!googleLoading && 'Completar registro'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterPage;
