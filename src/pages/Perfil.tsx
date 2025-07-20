import React, { useEffect, useState } from 'react';
import { rolAPI } from '../api/userAPI';
import { useAuth } from '../context/AuthContext';
import '../styles/Perfil.css'; // Importamos los estilos

const Perfil: React.FC = () => {
  const { usuario } = useAuth();
  const [nombreRol, setNombreRol] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Efecto para obtener el nombre del rol - igual que en SidebarContent
  useEffect(() => {
    const obtenerNombreRol = async () => {
      if (usuario?.id_rol) {
        try {
          const roles = await rolAPI.getRoles();
          const rolEncontrado = roles.find(rol => rol.id_rol === usuario.id_rol);
          setNombreRol(rolEncontrado?.nombre_rol || usuario.id_rol);
        } catch (error) {
          setNombreRol(usuario.id_rol); // Fallback al ID si hay error
          setError('Error al cargar el rol');
        } finally {
          setLoading(false);
        }
      } else {
        setError('No hay usuario activo');
        setLoading(false);
      }
    };
    obtenerNombreRol();
  }, [usuario?.id_rol]);

  if (loading) {
    return (
      <div className="perfil-wrapper">
        <h1 className="perfil-title">Perfil de Usuario</h1>
        <div className="loading-message">Cargando perfil...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="perfil-wrapper">
        <h1 className="perfil-title">Perfil de Usuario</h1>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="perfil-wrapper">
        <h1 className="perfil-title">Perfil de Usuario</h1>
        <div className="empty-message">No hay usuario activo</div>
      </div>
    );
  }

  return (
    <div className="perfil-wrapper">
      <h1 className="perfil-title">Perfil de Usuario</h1>
      
      <div className="perfil-card">
        <div className="perfil-datos">
          <div className="perfil-campo">
            <span className="perfil-etiqueta">Nombre</span>
            <span className="perfil-valor">{usuario.nombre}</span>
          </div>
          
          <div className="perfil-campo">
            <span className="perfil-etiqueta">Rol</span>
            <span className="perfil-valor">{nombreRol}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Perfil;