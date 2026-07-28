import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

/**
 * Контекст авторизации
 * Предоставляет информацию о пользователе и методы аутентификации
 * 
 * ВАЖНО: Контекст НЕ хранит токены!
 * Только информацию о пользователе (id, email, name, role)
 */

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Проверяем сессию при загрузке приложения
  useEffect(() => {
    const initAuth = async () => {
      try {
        const result = await authService.checkSession();
        if (result.success) {
          setUser(result.user);
        }
      } catch (err) {
        console.error('Session check failed:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  /**
   * Вход в систему
   */
  const login = useCallback(async (email, password) => {
    setError(null);
    setLoading(true);

    try {
      const result = await authService.login(email, password);
      
      if (result.success) {
        setUser(result.user);
        return { success: true };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Выход из системы
   */
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setError(null);
    }
  }, []);

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Хук для использования контекста авторизации
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;