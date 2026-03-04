import React, { useState } from 'react';

interface Props {
    onSwitch: () => void;
}

const Register: React.FC<Props> = ({ onSwitch }) => {
    const [form, setForm] = useState({
        email: '', password: '', username: '',
        nombre: '', apellidos: '', ubicacion: '',
    });
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [loading, setLoading] = useState(false);

    const handle = (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Evitar solo espacios en blanco en campos obligatorios
        if (!form.email.trim() || !form.username.trim() || !form.password || !form.nombre.trim() || !form.apellidos.trim()) {
            setMessage({ type: 'error', text: 'Rellene todos los campos' });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const response = await fetch('http://localhost:8000/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: form.email.trim(),
                    password: form.password,
                    username: form.username.trim(),
                    nombre: form.nombre.trim(),
                    apellidos: form.apellidos.trim(),
                    ubicacion: form.ubicacion.trim() || null,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Error al crear la cuenta');
            }

            setMessage({
                type: 'success',
                text: `Cuenta creada correctamente. ¡Ya puedes iniciar sesión, ${data.user.nombre}!`,
            });
            setTimeout(() => onSwitch(), 2200);

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
                <h1>Crear cuenta</h1>
            </div>

            <form onSubmit={handleSubmit} className="auth-form" noValidate>
                <div className="form-group">
                    <label htmlFor="reg-email">Email</label>
                    <input
                        id="reg-email" name="email" type="email"
                        placeholder="tu@email.com"
                        value={form.email} onChange={handle}
                        required disabled={loading}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="reg-username">Nombre de usuario</label>
                    <input
                        id="reg-username" name="username" type="text"
                        value={form.username} onChange={handle}
                        required disabled={loading}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="reg-password">Contraseña</label>
                    <input
                        id="reg-password" name="password" type="password"
                        placeholder="Mínimo 8 caracteres, letras y números"
                        value={form.password} onChange={handle}
                        required disabled={loading}
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="reg-nombre">Nombre</label>
                        <input
                            id="reg-nombre" name="nombre" type="text"
                            value={form.nombre} onChange={handle}
                            required disabled={loading}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="reg-apellidos">Apellidos</label>
                        <input
                            id="reg-apellidos" name="apellidos" type="text"
                            value={form.apellidos} onChange={handle}
                            required disabled={loading}
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="reg-ubicacion">Ubicación preferida <span style={{ opacity: 0.5 }}>(opcional)</span></label>
                    <input
                        id="reg-ubicacion" name="ubicacion" type="text"
                        value={form.ubicacion} onChange={handle}
                        disabled={loading}
                    />
                </div>

                <button type="submit" className={`btn-primary${loading ? ' loading' : ''}`} disabled={loading}>
                    {loading ? '' : 'Crear cuenta'}
                </button>
            </form>

            {message && (
                <div className={`message ${message.type}`}>{message.text}</div>
            )}

            <div className="auth-footer">
                ¿Ya tienes cuenta?{' '}
                <button type="button" onClick={onSwitch}>Inicia sesión</button>
            </div>
        </div>
    );
};

export default Register;
