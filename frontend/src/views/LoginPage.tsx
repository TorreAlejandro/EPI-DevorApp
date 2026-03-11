import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLogin } from '../controllers/hooks/useLogin';
import { usePasswordReset } from '../controllers/hooks/usePasswordReset';

const LoginPage: React.FC = () => {
    const navigate = useNavigate();

    const handleLoginSuccess = () => {
        navigate('/home');
    };

    const [isResettingPassword, setIsResettingPassword] = useState(false);

    const {
        identifier, setIdentifier,
        password, setPassword,
        message: loginMessage, loading: loginLoading,
        submitLogin
    } = useLogin(handleLoginSuccess);

    const {
        identifier: resetEmail,
        setIdentifier: setResetEmail,
        message: resetMessage,
        setMessage: setResetMessage,
        loading: resetLoading,
        submitPasswordReset
    } = usePasswordReset();

    const handleToggleReset = () => {
        setIsResettingPassword(!isResettingPassword);
        setResetMessage(null);
        if (!isResettingPassword && identifier) {
            setResetEmail(identifier);
        }
    };

    return (
        <div className="auth-card">
            <div className="auth-header">
                <div className="auth-logo">🍴</div>
                <h1>{isResettingPassword ? 'Restablecer contraseña' : 'Iniciar sesión'}</h1>
            </div>

            {isResettingPassword ? (
                <form onSubmit={submitPasswordReset} className="auth-form" noValidate>
                    <p style={{ textAlign: 'center', marginBottom: '1rem', fontSize: '0.9rem', color: '#666' }}>
                        Introduce tu correo electrónico y te enviaremos un enlace para que puedas crear una nueva contraseña.
                    </p>
                    <div className="form-group">
                        <label htmlFor="resetEmail">Correo electrónico</label>
                        <input
                            id="resetEmail"
                            type="email"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            required
                            disabled={resetLoading}
                        />
                    </div>
                    
                    <button
                        type="submit"
                        className={`btn-primary${resetLoading ? ' loading' : ''}`}
                        disabled={resetLoading}
                    >
                        {resetLoading ? '' : 'Enviar enlace'}
                    </button>
                    
                    <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                        <button 
                            type="button" 
                            onClick={handleToggleReset}
                            style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                            Volver al login
                        </button>
                    </div>
                </form>
            ) : (
                <form onSubmit={submitLogin} className="auth-form" noValidate>
                    <div className="form-group">
                        <label htmlFor="identifier">Email o usuario</label>
                        <input
                            id="identifier"
                            type="text"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            required
                            disabled={loginLoading}
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
                            disabled={loginLoading}
                        />
                        <div style={{ textAlign: 'right', marginTop: '0.25rem' }}>
                            <button 
                                type="button" 
                                onClick={handleToggleReset}
                                style={{ background: 'none', border: 'none', fontSize: '0.8rem', color: '#ff6b6b', cursor: 'pointer' }}
                            >
                                ¿Olvidaste tu contraseña?
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className={`btn-primary${loginLoading ? ' loading' : ''}`}
                        disabled={loginLoading}
                    >
                        {loginLoading ? '' : 'Entrar'}
                    </button>
                </form>
            )}

            {loginMessage && !isResettingPassword && (
                <div className={`message ${loginMessage.type}`}>{loginMessage.text}</div>
            )}
            
            {resetMessage && isResettingPassword && (
                <div className={`message ${resetMessage.type}`}>{resetMessage.text}</div>
            )}

            <div className="auth-footer">
                ¿No tienes cuenta?{' '}
                <Link to="/register">Regístrate</Link>
            </div>
        </div>
    );
};

export default LoginPage;
