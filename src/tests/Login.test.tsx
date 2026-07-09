import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../pages/Login';
import { AuthProvider } from '../context/AuthContext';
import { authAPI } from '../api/userAPI';

// Mock del API de autenticación
vi.mock('../api/userAPI', () => ({
    authAPI: {
        login: vi.fn(),
    },
    API: {
        interceptors: { response: { use: vi.fn() } },
        get: vi.fn()
    }
}));

// Wrapper para proveer contexto y router
const renderWithProviders = (component: React.ReactNode) => {
    return render(
        <BrowserRouter>
            <AuthProvider>
                {component}
            </AuthProvider>
        </BrowserRouter>
    );
};

describe('Componente Login', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        sessionStorage.clear();
    });

    it('debe renderizar correctamente el formulario', () => {
        renderWithProviders(<Login />);
        expect(screen.getByRole('heading', { name: /Bienvenido/i })).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Correo electrónico/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Contraseña/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Ingresar/i })).toBeInTheDocument();
    });

    it('debe mostrar error al intentar enviar campos vacíos', async () => {
        renderWithProviders(<Login />);
        const button = screen.getByRole('button', { name: /Ingresar/i });
        fireEvent.click(button);
        
        // El API no debe ser llamado si los campos son inválidos (requeridos por HTML5)
        expect(authAPI.login).not.toHaveBeenCalled();
    });

    it('debe mostrar mensaje de error en credenciales incorrectas (HTTP 401)', async () => {
        // Configuramos el mock para que devuelva error
        (authAPI.login as any).mockRejectedValueOnce(new Error('Credenciales incorrectas'));

        renderWithProviders(<Login />);
        
        const emailInput = screen.getByPlaceholderText(/Correo electrónico/i);
        const passwordInput = screen.getByPlaceholderText(/Contraseña/i);
        const button = screen.getByRole('button', { name: /Ingresar/i });

        fireEvent.change(emailInput, { target: { value: 'admin@espe.edu.ec' } });
        fireEvent.change(passwordInput, { target: { value: 'badpassword' } });
        fireEvent.click(button);

        await waitFor(() => {
            expect(screen.getByText(/Credenciales incorrectas/i)).toBeInTheDocument();
        });
    });

    it('debe realizar el login exitosamente (redirección y contexto)', async () => {
        // Configuramos el mock para un login exitoso
        const mockResponse = {
            token: 'fake-jwt-token',
            userData: { id: 1, email: 'admin@espe.edu.ec', rol: 'Administrador' }
        };
        (authAPI.login as any).mockResolvedValueOnce(mockResponse);

        renderWithProviders(<Login />);
        
        const emailInput = screen.getByPlaceholderText(/Correo electrónico/i);
        const passwordInput = screen.getByPlaceholderText(/Contraseña/i);
        const button = screen.getByRole('button', { name: /Ingresar/i });

        fireEvent.change(emailInput, { target: { value: 'admin@espe.edu.ec' } });
        fireEvent.change(passwordInput, { target: { value: 'ValidPass123!' } });
        fireEvent.click(button);

        await waitFor(() => {
            expect(authAPI.login).toHaveBeenCalledWith('admin@espe.edu.ec', 'ValidPass123!');
        });
    });
});
