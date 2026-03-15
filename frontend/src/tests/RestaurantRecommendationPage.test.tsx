import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import RestaurantRecommendationPage from '../views/RestaurantRecommendationPage';

// ── Mocks ───────────────────────────────────────────────────────────────────
vi.mock('../models/api/recommendationService', () => ({
    recommendationService: {
        search: vi.fn(),
    },
}));

vi.mock('../models/api/authService', () => ({
    authService: {
        getMe: vi.fn(),
    },
}));

vi.mock('../core/auth', () => ({
    useAuth: () => ({
        user: { ubicacion: 'Valencia' },
    }),
}));

import { recommendationService } from '../models/api/recommendationService';
import { authService } from '../models/api/authService';

const renderPage = () =>
    render(
        <MemoryRouter>
            <RestaurantRecommendationPage />
        </MemoryRouter>
    );

describe('RestaurantRecommendationPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Mock default for authService.getMe
        (authService.getMe as any).mockResolvedValue({
            ubicacion: 'Valencia'
        });

        // Mock global fetch for Google Maps Geocoding API
        (globalThis as any).fetch = vi.fn().mockResolvedValue({
            json: vi.fn().mockResolvedValue({
                results: [
                    {
                        address_components: [
                            { short_name: 'ES', types: ['country'] }
                        ]
                    }
                ]
            })
        });
    });

    it('debe renderizar el título y el selector de ubicación', async () => {
        renderPage();
        await waitFor(() => {
            expect(screen.getByText(/Recomendador de Restaurantes/i)).toBeInTheDocument();
        });
        expect(screen.getByText(/Usar ubicación preferida/i)).toBeInTheDocument();
        expect(screen.getByText(/Escoger ubicación/i)).toBeInTheDocument();
    });

    it('debe cambiar entre modos de ubicación', async () => {
        renderPage();
        await waitFor(() => {
            expect(screen.getByLabelText(/Escoger ubicación/i)).toBeInTheDocument();
        });
        const customRadio = screen.getByLabelText(/Escoger ubicación/i);
        fireEvent.click(customRadio);
        
        // El input de autocomplete debe ser visible (mockeado en setupTests)
        expect(screen.getByTestId('mock-autocomplete')).toBeInTheDocument();
    });

    it('debe llamar al servicio de recomendación al enviar el formulario', async () => {
        (recommendationService.search as any).mockResolvedValue({
            results: [
                {
                    id: '1',
                    name: 'Pizza Place',
                    rating: 4.5,
                    user_ratings_total: 100,
                    address: 'Calle Falsa 123',
                    main_photo: '',
                }
            ],
            next_page_token: null
        });

        renderPage();
        
        // Esperar a que se cargue la ubicación preferida
        await waitFor(() => {
            expect(screen.getByText(/Usar ubicación preferida/i)).toBeInTheDocument();
        });

        // Simular click en buscar
        const searchBtn = screen.getByRole('button', { name: /Buscar Sugerencias/i });
        fireEvent.click(searchBtn);

        await waitFor(() => {
            expect(recommendationService.search).toHaveBeenCalled();
        });

        expect(screen.getByText(/Pizza Place/i)).toBeInTheDocument();
        expect(screen.getByText(/4\.5/)).toBeInTheDocument();
    });

    it('debe expandir los detalles del restaurante al hacer click', async () => {
        (recommendationService.search as any).mockResolvedValue({
            results: [
                {
                    id: '1',
                    name: 'Pizza Place',
                    summary: 'La mejor pizza de la ciudad',
                    opening_hours: ['Lunes: 9:00-21:00'],
                    google_maps_uri: 'http://maps.google.com',
                }
            ],
            next_page_token: null
        });

        renderPage();
        
        await waitFor(() => {
            expect(screen.getByRole('button', { name: /Buscar Sugerencias/i })).toBeInTheDocument();
        });
        
        fireEvent.click(screen.getByRole('button', { name: /Buscar Sugerencias/i }));

        await waitFor(() => {
            expect(screen.getByText(/Pizza Place/i)).toBeInTheDocument();
        });

        // Click en la tarjeta para expandir
        fireEvent.click(screen.getByText(/Pizza Place/i));

        expect(screen.getByText(/La mejor pizza de la ciudad/i)).toBeInTheDocument();
        expect(screen.getByText(/Horario de apertura/i)).toBeInTheDocument();
        expect(screen.getByText(/SELECCIONAR ESTE RESTAURANTE/i)).toBeInTheDocument();
    });

    it('debe mostrar el botón de "Ver más" si hay token de paginación', async () => {
        (recommendationService.search as any).mockResolvedValueOnce({
            results: [{ id: '1', name: 'Rest 1' }],
            next_page_token: 'token_valido'
        });

        renderPage();
        
        await waitFor(() => {
            expect(screen.getByRole('button', { name: /Buscar Sugerencias/i })).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: /Buscar Sugerencias/i }));

        await waitFor(() => {
            // El componente renderiza "Ver más restaurantes"
            // Buscamos cualquier botón que contenga "Ver más"
            expect(screen.getByText(/Ver más/i)).toBeInTheDocument();
        });
    });
});
