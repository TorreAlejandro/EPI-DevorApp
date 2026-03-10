import React from 'react';
import { useRegister } from '../controllers/hooks/useRegister';

interface Props {
    onSwitch: () => void;
}

const RegisterPage: React.FC<Props> = ({ onSwitch }) => {
    const {
        form, handleInputChange,
        message, loading, submitRegister
    } = useRegister(onSwitch);

    return (
        <div className="auth-card">
            <div className="auth-header">
                <div className="auth-logo">🍴</div>
                <h1>Crear cuenta</h1>
            </div>

            <form onSubmit={submitRegister} className="auth-form" noValidate>
                <div className="form-group">
                    <label htmlFor="reg-email">Email</label>
                    <input
                        id="reg-email" name="email" type="email"
                        placeholder="tu@email.com"
                        value={form.email} onChange={handleInputChange}
                        required disabled={loading}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="reg-username">Nombre de usuario</label>
                    <input
                        id="reg-username" name="username" type="text"
                        value={form.username} onChange={handleInputChange}
                        required disabled={loading}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="reg-password">Contraseña</label>
                    <input
                        id="reg-password" name="password" type="password"
                        placeholder="Mínimo 8 caracteres, letras y números"
                        value={form.password} onChange={handleInputChange}
                        required disabled={loading}
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="reg-nombre">Nombre</label>
                        <input
                            id="reg-nombre" name="nombre" type="text"
                            value={form.nombre} onChange={handleInputChange}
                            required disabled={loading}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="reg-apellidos">Apellidos</label>
                        <input
                            id="reg-apellidos" name="apellidos" type="text"
                            value={form.apellidos} onChange={handleInputChange}
                            required disabled={loading}
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="reg-ubicacion">Ubicación preferida <span style={{ opacity: 0.5 }}>(opcional)</span></label>
                    <input
                        id="reg-ubicacion" name="ubicacion" type="text"
                        value={form.ubicacion} onChange={handleInputChange}
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

export default RegisterPage;
