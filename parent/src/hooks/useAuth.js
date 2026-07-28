import { useContext, useCallback } from 'react';
import { AuthContext } from '../contexts/AuthContext';

/**
 * Хук для работы с авторизацией
 * Предоставляет удобный доступ к контексту авторизации
 * 
 * Использование:
 * const { user, isAuthenticated, login, logout, loading, error } = useAuth();
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  
  const {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    logout
  } = context;

  /**
   * Проверка наличия определенной роли у пользователя
   */
  const hasRole = useCallback((role) => {
    if (!user || !user.roles) return false;
    return user.roles.includes(role);
  }, [user]);

  /**
   * Проверка наличия хотя бы одной из указанных ролей
   */
  const hasAnyRole = useCallback((roles) => {
    if (!user || !user.roles) return false;
    return roles.some(role => user.roles.includes(role));
  }, [user]);

  /**
   * Проверка наличия всех указанных ролей
   */
  const hasAllRoles = useCallback((roles) => {
    if (!user || !user.roles) return false;
    return roles.every(role => user.roles.includes(role));
  }, [user]);

  /**
   * Получение полного имени пользователя
   */
  const getUserDisplayName = useCallback(() => {
    if (!user) return '';
    return user.name || user.email || 'User';
  }, [user]);

  /**
   * Проверка, является ли пользователь администратором
   */
  const isAdmin = useCallback(() => {
    return hasRole('ROLE_ADMIN');
  }, [hasRole]);

  return {
    // Основные данные
    user,
    loading,
    error,
    isAuthenticated,
    
    // Методы
    login,
    logout,
    
    // Утилиты для работы с ролями
    hasRole,
    hasAnyRole,
    hasAllRoles,
    isAdmin,
    
    // Утилиты
    getUserDisplayName
  };
};

export default useAuth;