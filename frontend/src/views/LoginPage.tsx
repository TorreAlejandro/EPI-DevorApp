import React from 'react';
import { useLogin } from '../controllers/hooks/useLogin';

interface Props {
    onSwitch: () => void;
    onLoginSuccess?: () => void;
}

const LoginPage: React.FC<Props> = ({ onSwitch, onLoginSuccess }) => {
    const {
        identifier, setIdentifier,
        password, setPassword,
        message, loading,
        submitLogin
    } = useLogin(onLoginSuccess);

    return (
        <div className="auth-card">
            <div className="auth-header">
                <div className="auth-logo">🍴</div>
                <h1>Iniciar sesión</h1>
            </div>

            <form onSubmit={submitLogin} className="auth-form" noValidate>
                <div className="form-group">
                    <label htmlFor="identifier">Email o usuario</label>
                    <input
                        id="identifier"
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        required
                        disabled={loading}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="password">Contraseña</label>
                    <input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                    />
                </div>

                <button
                    type="submit"
                    className={`btn-primary${loading ? ' loading' : ''}`}
                    disabled={loading}
                >
                    {loading ? '' : 'Entrar'}
                </button>
            </form>

            {message && (
                <div className={`message ${message.type}`}>{message.text}</div>
            )}

            <div className="auth-footer">
                ¿No tienes cuenta?{' '}
                <button type="button" onClick={onSwitch}>Regístrate</button>
            </div>
        </div>
    );
};

export default LoginPage;
