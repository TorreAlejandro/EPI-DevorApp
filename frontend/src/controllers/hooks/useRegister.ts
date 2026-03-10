import { useState } from 'react';
import { authService } from '../../models/api/authService';

export const useRegister = (onSuccessSwitchToLogin: () => void) => {
    const [form, setForm] = useState({
        email: '', password: '', username: '',
        nombre: '', apellidos: '', ubicacion: '',
    });
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [loading, setLoading] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    }

    const submitRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.email.trim() || !form.username.trim() || !form.password || !form.nombre.trim() || !form.apellidos.trim()) {
            setMessage({ type: 'error', text: 'Rellene todos los campos obligatorios' });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const cleanData = {
                email: form.email.trim(),
                password: form.password,
                username: form.username.trim(),
                nombre: form.nombre.trim(),
                apellidos: form.apellidos.trim(),
                ubicacion: form.ubicacion.trim() || null,
            };

            const data = await authService.register(cleanData);

            setMessage({
                type: 'success',
                text: `Cuenta creada correctamente. ¡Ya puedes iniciar sesión, ${data.user.nombre}!`,
            });

            setTimeout(() => onSuccessSwitchToLogin(), 2200);

        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    return {
        form,
        handleInputChange,
        message,
        loading,
        submitRegister
    };
};
