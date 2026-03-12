import '@testing-library/jest-dom';
import { vi } from 'vitest';

vi.stubEnv('VITE_GOOGLE_API_KEY', 'test_api_key');

import React from 'react';

// Mockear el Autocomplete de Google Maps porque usa funciones/hooks que fallan en jsdom
vi.mock('react-google-autocomplete', () => {
    return {
        default: ({ onPlaceSelected, ...props }: any) => {
            return React.createElement('input', {
                ...props,
                'data-testid': 'mock-autocomplete',
                onChange: (e: any) => {
                    if (onPlaceSelected) {
                        onPlaceSelected({ formatted_address: e.target.value });
                    }
                }
            });
        }
    };
});
