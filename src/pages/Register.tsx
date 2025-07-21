import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI, rolAPI } from '../api/userAPI';
import { Rol } from '../interfaces/user';
import { withSanitization } from '../utils/sanitizer';
import '../styles/Login.css';

/**
 * Componente Register
 * 
 * Objetivo:
 *  Permitir a un usuario nuevo registrarse en el sistema mediante un formulario con campos
 *  para nombre, email, contraseña, confirmación de contraseña y selección de rol.
 *  Implementa validaciones de entrada y sanitización para prevenir inyecciones y errores.
 * 
 * Parámetros:
 *  - No recibe props externos. Utiliza hooks internos para manejo de estado y navegación.
 * 
 * Operación:
 *  Carga los roles disponibles desde la API al montarse el componente.
 *  Gestiona el formulario y sus validaciones.
 *  Al enviar el formulario, valida que todos los campos estén completos, que las contraseñas coincidan,
 *  y que el email tenga formato válido.
 *  Luego, llama a la API para registrar el usuario, manejando estados de carga y errores.
 *  Finalmente redirige al login en caso de éxito.
 */
const Register = () => {
    const [nombre_usuario, setNombreUsuario] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [roles, setRoles] = useState<Rol[]>([]);
    const [selectedRol, setSelectedRol] = useState<string>('');
    const [loadingRoles, setLoadingRoles] = useState<boolean>(true);
    const navigate = useNavigate();

    // Versiones sanitizadas de los setters - solo 4 líneas adicionales
    /* Sanitización de entradas
    *  Objetivo:
    *  Prevenir ataques de inyección u otros problemas derivados de entradas maliciosas o incorrectas.
    * 
    * Parámetros:
    *  - Cada setter de estado de entrada utiliza una versión sanitizada mediante la función `withSanitization`.
    * 
    * Operación:
    *  Cada cambio en los inputs es procesado para limpiar o validar el texto antes de guardarlo en el estado,
    */
    const setSanitizedNombreUsuario = withSanitization(setNombreUsuario, 'nombre_usuario');
    const setSanitizedEmail = withSanitization(setEmail, 'email');
    const setSanitizedPassword = withSanitization(setPassword, 'password');
    const setSanitizedConfirmPassword = withSanitization(setConfirmPassword, 'confirmPassword');

    // Cargar roles al montar el componente
    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const rolesData = await rolAPI.getRoles();
                setRoles(rolesData);
                
                // Si hay roles disponibles, seleccionar el primero por defecto
                if (rolesData.length > 0) {
                    setSelectedRol(rolesData[0].id_rol);
                }
            } catch (error) {
                setError('No se pudieron cargar los roles. Por favor intenta más tarde.');
            } finally {
                setLoadingRoles(false);
            }
        };

        fetchRoles();
    }, []);

    /**
 * Función handleRegister
 * 
 * Objetivo:
 *  Validar y procesar el formulario de registro de usuario.
 * 
 * Parámetros:
 *  - e: evento de envío del formulario (FormEvent<HTMLFormElement>)
 * 
 * Operación:
 *  Previene el envío por defecto.
 *  Valida que todos los campos estén completos.
 *  Verifica que las contraseñas coincidan.
 *  Comprueba que el correo tenga un formato válido.
 *  Si pasa todas las validaciones, llama al servicio authAPI.register para crear el usuario.
 *  Maneja estados de carga y muestra mensajes de error o éxito.
 *  En caso de éxito, redirige al login con mensaje de confirmación.
 */
    const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        // Validaciones básicas
        if (!nombre_usuario || !email || !password || !confirmPassword) {
            setError('Por favor completa todos los campos.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        // Validación de formato de correo
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            setError('Por favor ingresa un correo electrónico válido.');
            return;
        }

        try {
            setLoading(true);
            
            // Usar el servicio de autenticación para registrar
            await authAPI.register({
                nombre_usuario,
                email,
                password, // La API se encargará de hashear la contraseña
                id_rol: selectedRol
            });

            // Si todo salió bien, redirigir al login
            navigate('/login', { state: { message: 'Registro exitoso. Por favor inicia sesión.' } });

        } catch (error: unknown) {
            if (error instanceof Error) {
                setError(error.message || 'Error al registrar el usuario');
            } else {
                setError('Error al registrar el usuario');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="bg-image"></div>
            <div className="form-container">
                <form className="login-form" onSubmit={handleRegister}>
                    <h1 className="login-title">Bienvenido</h1>
                    <h2 className="login-subtitle">Regístrate</h2>

                    {error && <div className="error-message">{error}</div>}

                    <div className="input-group">
                        <label htmlFor="nombre_usuario" className="input-label">
                            Nombre de Usuario
                        </label>
                        <input
                            id="nombre_usuario"
                            type="text"
                            placeholder="Nombre y Apellido"
                            value={nombre_usuario}
                            onChange={(e) => setSanitizedNombreUsuario(e.target.value)}
                            required
                            className="input-field"
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="email" className="input-label">
                            Correo Electrónico
                        </label>
                        <input
                            id="email"
                            type="email"
                            placeholder="usuario@epn.edu.ec"
                            value={email}
                            onChange={(e) => setSanitizedEmail(e.target.value)}
                            required
                            className="input-field"
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="password" className="input-label">
                            Contraseña
                        </label>
                        <input
                            id="password"
                            type="password"
                            placeholder=""
                            value={password}
                            onChange={(e) => setSanitizedPassword(e.target.value)}
                            required
                            className="input-field"
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="confirmPassword" className="input-label">
                            Confirmar Contraseña
                        </label>
                        <input
                            id="confirmPassword"
                            type="password"
                            placeholder=""
                            value={confirmPassword}
                            onChange={(e) => setSanitizedConfirmPassword(e.target.value)}
                            required
                            className="input-field"
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="rol" className="input-label">
                            Rol
                        </label>
                        <select 
                            id="rol" 
                            className="input-field"
                            value={selectedRol}
                            onChange={(e) => setSelectedRol(e.target.value)}
                            disabled={loadingRoles || roles.length === 0}
                        >
                            {loadingRoles ? (
                                <option value="">Cargando roles...</option>
                            ) : roles.length === 0 ? (
                                <option value="">No hay roles disponibles</option>
                            ) : (
                                roles.map(rol => (
                                    <option key={rol.id_rol} value={rol.id_rol}>
                                        {rol.nombre_rol}
                                    </option>
                                ))
                            )}
                        </select>
                        {roles.length === 1 && (
                            <small className="text-muted">Actualmente solo está disponible el rol de {roles[0].nombre_rol}</small>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="submit-button"
                        disabled={loading || loadingRoles}
                    >
                        {loading ? 'Procesando...' : 'Registrarse'}
                    </button>
                    
                    <div className="register-link">
                        ¿Ya tienes una cuenta? <Link to="/login">Inicia sesión aquí</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;