import axios from 'axios';
import { UserRegister, AuthResponse, Rol, PerfilUsuario, Usuario } from '../interfaces/user';
import { cookieUtils } from '../utils/cookieUtils';

// Configuración base de axios
export const API = axios.create({
    baseURL: import.meta.env.VITE_URL_BACKEND,
    withCredentials: true // 🔧 NUEVO: Para enviar cookies automáticamente
});

// Interceptor para incluir el token en todas las peticiones
// API.interceptors.request.use((config) => {
//     // 🔧 CAMBIO: Obtener token de cookies en lugar de localStorage 
//     // const token = localStorage.getItem('token');
    
//     const token = cookieUtils.get('auth_token');

//     if (token) {
//         config.headers = config.headers || {};
//         config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
// });

// Función para hacer hash de la contraseña
export async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Servicios de autenticación
export const authAPI = {
    // Inicio de sesión
    login: async (email: string, password: string): Promise<{ token: string, userData: Usuario }> => {
        // Hash de la contraseña
        const hashedPassword = await hashPassword(password);
        
        // Configurar los datos del formulario
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', hashedPassword);
        
        // Realizar la petición
        const response = await API.post<AuthResponse>('/login', formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
            }
        });
        
        // Extraer el token
        const token = response.data.access_token;
        
        // Obtener datos del usuario
        let userData: Usuario = {
            id: '',
            nombre: email,
            email: email,
            id_rol: '',
        };
        
        try {
            // Configurar el token para la siguiente petición
            //API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            // Obtener el perfil del usuario
            const userResponse = await API.get('/perfil');
            const userDetails = userResponse.data as { id: string; nombre_usuario: string; id_rol: string; email: string; rol: Rol };
            //const userDetails = userResponse.data
            
            userData = {
                id: userDetails.id,
                nombre: userDetails.nombre_usuario,
                email: userDetails.email,
                id_rol: userDetails.id_rol,
                rol:userDetails.rol
            };
        } catch (error) {
            console.error('Error al obtener datos del usuario:', error);
        }
        
        return { token, userData };
    },
    
    // Registro de usuario
    register: async (userData: Omit<UserRegister, 'password'> & { password: string }): Promise<void> => {
        // Hash de la contraseña
        const hashedPassword = await hashPassword(userData.password);
        
        // Crear el objeto con la contraseña hasheada
        const userToRegister: UserRegister = {
            ...userData,
            password: hashedPassword
        };
        
        // Realizar la petición de registro
        await API.post('/register', userToRegister, {
            headers: {
                'Content-Type': 'application/json',
            }
        });
    },

    // Logout
    logout: async (): Promise<void> => {
        try {
            await API.post('/logout');
        } catch (error) {
            console.error('Error en logout:', error);
            // Continuar con logout local aunque falle el servidor
        }
    }
};

// Servicios de usuario
export const userAPI = {
    // Obtener el perfil del usuario actual
    getPerfilUsuario: async (): Promise<PerfilUsuario> => {
        try {
          const response = await API.get('/perfil');
          const data = response.data as { id: string; nombre: string; rol: string };
          return {
            id: data.id,
            nombre: data.nombre,
            id_rol: data.rol
          };
        } catch (error) {
          console.error('Error al cargar el perfil del usuario:', error);
          throw error; // Re-lanzar para manejo en componente
        }
      },
    
};

// Servicios de roles
export const rolAPI = {
    // Obtener todos los roles
    getRoles: async (): Promise<Rol[]> => {
        const response = await API.get('/roles/');
        return response.data as Rol[];
    }
};