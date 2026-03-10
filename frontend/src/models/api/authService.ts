import type { LoginResponse, RegisterResponse, User } from '../types/auth';

const API_URL = 'http://localhost:8000/api';

export const authService = {
    login: async (identifier: string, password: string): Promise<LoginResponse> => {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ identifier, password }),
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.detail || 'Ocurrió un error al iniciar sesión');
        }

        return data;
    },

    register: async (userData: any): Promise<RegisterResponse> => {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.detail || 'Error al crear la cuenta');
        }

        return data;
    },

    checkEmailVerification: async (email: string): Promise<boolean> => {
        const response = await fetch(`${API_URL}/check-verification/${email}`);
        if (!response.ok) {
            return false;
        }
        const data = await response.json();
        return data.verified;
    }
};
