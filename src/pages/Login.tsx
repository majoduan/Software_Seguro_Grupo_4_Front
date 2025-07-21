import { useState, FormEvent, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api/userAPI';
import { withSanitization } from '../utils/sanitizer';
import '../styles/Login.css';

// Configuración del sistema de límite de intentos
const LOGIN_ATTEMPT_CONFIG = {
    MAX_ATTEMPTS: 5,           // Máximo 5 intentos
    WINDOW_TIME: 15 * 60 * 1000, // Ventana de 15 minutos
    LOCKOUT_TIME: 15 * 60 * 1000, // Bloqueo inicial de 15 minutos
    PROGRESSIVE_MULTIPLIER: 2,  // Multiplica el tiempo de bloqueo por cada fallo adicional
};

interface LoginAttempt {
    timestamp: number;
    count: number;
    lockedUntil?: number;
    progressiveMultiplier: number;
}

const Login = () => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [isBlocked, setIsBlocked] = useState<boolean>(false);
    const [blockTimeRemaining, setBlockTimeRemaining] = useState<number>(0);
    const [attemptsRemaining, setAttemptsRemaining] = useState<number>(LOGIN_ATTEMPT_CONFIG.MAX_ATTEMPTS);
    const { login } = useAuth();

    /** 
 * Sanitización de entradas de usuario
 *
 * Objetivo:
 *     Prevenir ataques XSS u otras formas de inyección limpiando los datos ingresados
 *     por el usuario antes de almacenarlos en el estado.
 *
 * Parámetros:
 *     - setEmail / setPassword: funciones que almacenan los valores del formulario.
 *     - 'email' / 'password': identificador del tipo de entrada a sanitizar.
 *
 * Operación:
 *     - Envuelve los setters con `withSanitization` para limpiar los valores antes 
 * de su uso.
 *
 * Retorna:
 *     - void (actualiza el estado del componente con valores seguros).
 */

    // Versiones sanitizadas de los setters
    const setSanitizedEmail = withSanitization(setEmail, 'email');
    const setSanitizedPassword = withSanitization(setPassword, 'password');


    
/**
 * Obtener el estado de intentos de login desde sessionStorage
 *
 * Objetivo:
 *     Recuperar los datos de intentos fallidos almacenados en la sesión del navegador
 *     para controlar bloqueos por fuerza bruta.
 *
 * Parámetros:
 *     - Ninguno directamente.
 *
 * Operación:
 *     - Lee sessionStorage.
 *     - Si no existe, devuelve un estado inicial limpio.
 *
 * Retorna:
 *     - LoginAttempt: estructura con datos de timestamp, count y bloqueo.
 */
    const getLoginAttempts = (): LoginAttempt => {
        const stored = sessionStorage.getItem('loginAttempts');
        if (!stored) {
            return {
                timestamp: Date.now(),
                count: 0,
                progressiveMultiplier: 1
            };
        }
        return JSON.parse(stored);
    };

    /**
 * Guardar el estado de intentos de login en sessionStorage
 *
 * Objetivo:
 *     Registrar en el almacenamiento temporal el número de intentos fallidos y tiempos 
 * de bloqueo.
 *
 * Parámetros:
 *     - attempts: objeto LoginAttempt con los datos actualizados.
 *
 * Operación:
 *     - Serializa el objeto y lo almacena en sessionStorage.
 */
    const saveLoginAttempts = (attempts: LoginAttempt) => {
        sessionStorage.setItem('loginAttempts', JSON.stringify(attempts));
    };

    /*
 * Verificar si el usuario se encuentra actualmente bloqueado
 *
 * Objetivo:
 *     Determinar si debe impedirse el login por haberse alcanzado el número máximo de intentos.
 *
 * Parámetros:
 *     - Ninguno.
 *
 * Operación:
 *     - Compara el tiempo actual con `lockedUntil`.
 *     - Si el bloqueo expiró o la ventana se cerró, reinicia los valores.
 *
 * Retorna:
 *     - boolean: true si el usuario sigue bloqueado, false si puede intentar iniciar sesión.
 */

    const checkIfBlocked = (): boolean => {
        const attempts = getLoginAttempts();
        const now = Date.now();

        // Si hay un bloqueo activo
        if (attempts.lockedUntil && now < attempts.lockedUntil) {
            const timeRemaining = Math.ceil((attempts.lockedUntil - now) / 1000);
            setBlockTimeRemaining(timeRemaining);
            setIsBlocked(true);
            return true;
        }

        // Si el bloqueo ha expirado, resetear
        if (attempts.lockedUntil && now >= attempts.lockedUntil) {
            const resetAttempts: LoginAttempt = {
                timestamp: now,
                count: 0,
                progressiveMultiplier: 1
            };
            saveLoginAttempts(resetAttempts);
            setIsBlocked(false);
            setAttemptsRemaining(LOGIN_ATTEMPT_CONFIG.MAX_ATTEMPTS);
            return false;
        }

        // Verificar si la ventana de tiempo ha expirado
        if (now - attempts.timestamp > LOGIN_ATTEMPT_CONFIG.WINDOW_TIME) {
            const resetAttempts: LoginAttempt = {
                timestamp: now,
                count: 0,
                progressiveMultiplier: 1
            };
            saveLoginAttempts(resetAttempts);
            setAttemptsRemaining(LOGIN_ATTEMPT_CONFIG.MAX_ATTEMPTS);
        } else {
            setAttemptsRemaining(LOGIN_ATTEMPT_CONFIG.MAX_ATTEMPTS - attempts.count);
        }

        setIsBlocked(false);
        return false;
    };

    /*
 * Registrar un intento de login fallido
 *
 * Objetivo:
 *     Aumentar el contador de intentos y aplicar bloqueo si se excede el límite configurado.
 *
 * Parámetros:
 *     - Ninguno.
 *
 * Operación:
 *     - Incrementa `count` y aplica bloqueo si se llega al máximo.
 *     - Calcula duración progresiva con `progressiveMultiplier`.
 *
 */
    const registerFailedAttempt = () => {
        const attempts = getLoginAttempts();
        const now = Date.now();
        
        const newCount = attempts.count + 1;
        
        // Si se alcanzó el máximo de intentos
        if (newCount >= LOGIN_ATTEMPT_CONFIG.MAX_ATTEMPTS) {
            const lockoutDuration = LOGIN_ATTEMPT_CONFIG.LOCKOUT_TIME * attempts.progressiveMultiplier;
            const newAttempts: LoginAttempt = {
                timestamp: now,
                count: newCount,
                lockedUntil: now + lockoutDuration,
                progressiveMultiplier: attempts.progressiveMultiplier * LOGIN_ATTEMPT_CONFIG.PROGRESSIVE_MULTIPLIER
            };
            
            saveLoginAttempts(newAttempts);
            setIsBlocked(true);
            setBlockTimeRemaining(Math.ceil(lockoutDuration / 1000));
            setAttemptsRemaining(0);
            
            const minutes = Math.ceil(lockoutDuration / (1000 * 60));
            setError(`Demasiados intentos fallidos. Bloqueado por ${minutes} minutos.`);
        } else {
            const newAttempts: LoginAttempt = {
                ...attempts,
                count: newCount,
                timestamp: attempts.timestamp // Mantener el timestamp original de la ventana
            };
            saveLoginAttempts(newAttempts);
            setAttemptsRemaining(LOGIN_ATTEMPT_CONFIG.MAX_ATTEMPTS - newCount);
            setError(`Credenciales incorrectas. Intentos restantes: ${LOGIN_ATTEMPT_CONFIG.MAX_ATTEMPTS - newCount}`);
        }
    };

    /**
 * Limpiar los intentos de login tras autenticación exitosa
 *
 * Objetivo:
 *     Eliminar rastros de intentos fallidos y resetear el estado.
 *
 * Parámetros:
 *     - Ninguno.
 *
 * Operación:
 *     - Borra la clave 'loginAttempts' de sessionStorage.
 *     - Restablece el estado local del componente.
 *
 */

    const clearLoginAttempts = () => {
        sessionStorage.removeItem('loginAttempts');
        setIsBlocked(false);
        setAttemptsRemaining(LOGIN_ATTEMPT_CONFIG.MAX_ATTEMPTS);
        setBlockTimeRemaining(0);
    };

   /**
 * Temporizador de cuenta regresiva durante el estado de bloqueo
 *
 * Objetivo: Mostrar visualmente el tiempo restante de bloqueo al usuario.
 *
 * Parámetros: Ninguno.
 *
 * Operación:
 *     - Ejecuta un intervalo cada segundo para reducir `blockTimeRemaining`.
 *     - Finaliza el temporizador automáticamente y verifica el estado.
 */
    const updateBlockTimer = () => {
        if (isBlocked && blockTimeRemaining > 0) {
            const timer = setInterval(() => {
                setBlockTimeRemaining(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        checkIfBlocked(); // Verificar de nuevo el estado
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(timer);
        }
    };

    // Verificar el estado de bloqueo al cargar el componente
    useEffect(() => {
        checkIfBlocked();
    }, []);

    // Manejar el timer de bloqueo
    useEffect(() => {
        const cleanup = updateBlockTimer();
        return cleanup;
    }, [isBlocked, blockTimeRemaining]);

    const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        // Verificar si el usuario está bloqueado antes de proceder
        if (checkIfBlocked()) {
            const minutes = Math.ceil(blockTimeRemaining / 60);
            const seconds = blockTimeRemaining % 60;
            const timeString = minutes > 0 
                ? `${minutes} minutos y ${seconds} segundos` 
                : `${seconds} segundos`;
            setError(`Cuenta bloqueada. Tiempo restante: ${timeString}`);
            return;
        }

        // Validar campos
        if (!email || !password) {
            setError('Por favor completa ambos campos.');
            return;
        }

        try {
            setLoading(true);

            // Usar el servicio de autenticación
            const { token, userData } = await authAPI.login(email, password);

            // Login exitoso - limpiar intentos
            clearLoginAttempts();
            
            // Usar la función login del contexto
            login(token, userData);

        } catch (error: any) {
            // Registrar el intento fallido
            registerFailedAttempt();
            
            // No mostrar el mensaje genérico si ya hay un mensaje específico de bloqueo
            if (!error.message?.includes('bloqueado') && !isBlocked) {
                // El mensaje específico ya se establece en registerFailedAttempt
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="bg-image"></div>
            <div className="form-container">
                <form className="login-form" onSubmit={handleLogin}>
                    <h1 className="login-title">Bienvenido</h1>
                    <h2 className="login-subtitle">Inicia sesión</h2>

                    {error && (
                        <div className={`error-message ${isBlocked ? 'blocked-message' : ''}`}>
                            {error}
                        </div>
                    )}

                    {/* Mostrar información de intentos restantes */}
                    {!isBlocked && attemptsRemaining < LOGIN_ATTEMPT_CONFIG.MAX_ATTEMPTS && attemptsRemaining > 0 && (
                        <div className="warning-message">
                            ⚠️ Intentos restantes: {attemptsRemaining}
                        </div>
                    )}

                    {/* Mostrar contador de bloqueo */}
                    {isBlocked && blockTimeRemaining > 0 && (
                        <div className="blocked-timer">
                            🔒 Tiempo de bloqueo restante: {Math.floor(blockTimeRemaining / 60)}:{String(blockTimeRemaining % 60).padStart(2, '0')}
                        </div>
                    )}

                    <div className="input-group">
                        <label htmlFor="email" className="input-label">
                            Usuario
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
                    <button
                        type="submit"
                        className={`submit-button ${isBlocked ? 'blocked' : ''}`}
                        disabled={loading || isBlocked}
                    >
                        {loading ? 'Procesando...' : 
                         isBlocked ? `Bloqueado (${Math.floor(blockTimeRemaining / 60)}:${String(blockTimeRemaining % 60).padStart(2, '0')})` : 
                         'Ingresar'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;