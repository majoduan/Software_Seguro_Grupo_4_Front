import axios from 'axios';
import { UserRegister, AuthResponse, Rol, PerfilUsuario, Usuario } from '../interfaces/user';
import { cookieUtils } from '../utils/cookieUtils';

// Configuración base de axios
export const API = axios.create({
    baseURL: import.meta.env.VITE_URL_BACKEND,
    withCredentials: true // 🔧 NUEVO: Para enviar cookies automáticamente
});

    /**
     * Objetivo:
     * Hashear la contraseña del usuario utilizando SHA-256 antes de enviarla al backend.
     *
     * Parámetros:
     * - password: string — Contraseña en texto plano proporcionada por el usuario.
     *
     * Operación:
     * Codifica la contraseña como UTF-8, aplica SHA-256 y convierte el resultado a hexadecimal.
     * Evita el envío de contraseñas en texto plano.
     * Reduce el riesgo de exposición accidental si se intercepta el tráfico.
     * Complementa el uso de cookies httpOnly en el backend para una autenticación segura.
     */

// Función para hacer hash de la contraseña
export async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Servicios de autenticación
    /**
     * Objetivo:
     * Realizar el inicio de sesión del usuario.
     *
     * Parámetros:
     * - email: string — Correo electrónico del usuario.
     * - password: string — Contraseña en texto plano.
     *
     * Operación:
     * Hashea la contraseña, realiza una solicitud de tipo form-urlencoded al endpoint `/login`,
     * y luego consulta el perfil del usuario autenticado.
     * La contraseña se transmite hasheada usando SHA-256.
     * El backend responde con una cookie httpOnly.
     * No se expone el token JWT directamente; el token retornado es simbólico.
     */

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
        
        // 🔧 OBTENER DATOS DEL USUARIO (la cookie ya está configurada por el backend)
        const userResponse = await API.get('/perfil');
        const userDetails = userResponse.data;
        
        const userData: Usuario = {
            id: userDetails.id,
            nombre: userDetails.nombre_usuario,
            email: userDetails.email,
            id_rol: userDetails.id_rol,
            rol: userDetails.rol
        };
        
        // 🔧 RETORNAR TOKEN DUMMY (la autenticación real está en la cookie httpOnly)
        return { token: "authenticated", userData };
    },
    
    // Registro de usuario
    /**
     * Objetivo: Registrar un nuevo usuario en el sistema.
     *
     * Parámetros:
     * - userData: objeto con los datos del nuevo usuario, incluyendo la contraseña.
     *
     * Operación:
     * Hashea la contraseña antes de enviarla como JSON al endpoint `/register`.
     * El backend aplica validaciones adicionales y protege contra duplicaciones.
     * Se evita el almacenamiento o transmisión de contraseñas sin cifrado.
     */

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
    /**
     * Objetivo: Cerrar sesión del usuario en el backend.
     *
     * Parámetros:Ninguno.
     *
     * Operación:
     * Envía una solicitud POST al endpoint `/logout`. Si falla, continúa el logout local.
     * Invalida la cookie httpOnly en el servidor, finalizando la sesión segura.
     */

    logout: async (): Promise<void> => {
        try {
            await API.post('/logout');
        } catch (error) {
            // Continuar con logout local aunque falle el servidor
        }
    }
};

// Servicios de usuario
export const userAPI = {
    // Obtener el perfil del usuario actual
    /**
     * Objetivo: Obtener el perfil del usuario actualmente autenticado.
     *
     * Parámetros: Ninguno.
     *
     * Operación:
     * Consulta el endpoint `/perfil` para obtener los datos del usuario desde la cookie.
     * Solo accesible si el usuario tiene una cookie válida y autorizada.
     * La cookie httpOnly evita manipulación desde scripts del lado cliente.
     * Backend verifica sesión activa antes de responder.
     */

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