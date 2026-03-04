import React, { useState } from 'react';

interface Props {
    onSwitch: () => void;
}

const Login: React.FC<Props> = ({ onSwitch }) => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Evitar submit vacío
        if (!identifier.trim() || !password) {
            setMessage({ type: 'error', text: 'Rellene todos los campos' });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const response = await fetch('http://localhost:8000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ identifier: identifier.trim(), password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Ocurrió un error al iniciar sesión');
            }

            setMessage({ type: 'success', text: `¡Bienvenido de nuevo, ${data.user.nombre}!` });

        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-card">
            <div className="auth-header">
                <div className="auth-logo">🍴</div>
                <h1>Iniciar sesión</h1>
            </div>

            <form onSubmit={handleSubmit} className="auth-form" noValidate>
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

export default Login;
