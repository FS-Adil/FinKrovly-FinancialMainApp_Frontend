import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import tokenService from '../../services/tokenService';
import { SecurityUtils } from '../../utils/security';
import { CSRFProtection } from '../../utils/csrfProtection';

/**
 * Контекст авторизации
 */
const AuthContext = createContext(null);

/**
 * Провайдер авторизации
 * 
 * Оборачивает все приложение и предоставляет:
 * - Состояние авторизации (user, loading, error)
 * - Методы для входа/выхода
 * - Автоматическое обновление токенов
 * - Проверку сессии при загрузке
 * 
 * ВАЖНО: Провайдер НЕ хранит JWT токены!
 * Только информацию о пользователе (id, email, name, roles)
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const navigate = useNavigate();

  /**
   * Инициализация при загрузке приложения
   * Проверяет существующую сессию
   */
  useEffect(() => {
    let mounted = true;
    let stopAutoRefresh = null;

    const initAuth = async () => {
      try {
        setLoading(true);
        
        // Инициализируем CSRF защиту
        CSRFProtection.init();
        
        // Проверяем существующую сессию
        const result = await authService.checkSession();
        
        if (!mounted) return;

        if (result.success && result.user) {
          // Валидируем данные пользователя
          const validatedUser = {
            id: SecurityUtils.sanitizeInput(String(result.user.id)),
            email: SecurityUtils.validateEmail(result.user.email),
            name: SecurityUtils.sanitizeInput(result.user.name || ''),
            roles: Array.isArray(result.user.roles) 
              ? result.user.roles.map(role => SecurityUtils.sanitizeInput(role))
              : ['ROLE_USER']
          };

          setUser(validatedUser);
          
          // Запускаем автоматическое обновление токенов
          stopAutoRefresh = tokenService.setupAutoRefresh(60000, 5);
        } else {
          setUser(null);
        }
      } catch (err) {
        if (!mounted) return;
        console.error('Auth initialization failed:', err);
        setUser(null);
        setError('Failed to initialize authentication');
      } finally {
        if (mounted) {
          setLoading(false);
          setIsInitialized(true);
        }
      }
    };

    initAuth();

    // Очистка при размонтировании
    return () => {
      mounted = false;
      if (stopAutoRefresh) {
        stopAutoRefresh();
      }
    };
  }, []);

  /**
   * Обработчик активности пользователя
   * Обновляет lastActivity на сервере
   */
  useEffect(() => {
    if (!user) return;

    let activityTimeout;
    
    const handleActivity = () => {
      clearTimeout(activityTimeout);
      activityTimeout = setTimeout(() => {
        // Отправляем информацию об активности на сервер
        authService.checkSession().catch(console.error);
      }, 60000); // Отправляем не чаще раза в минуту
    };

    // Отслеживаем активность пользователя
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      clearTimeout(activityTimeout);
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [user]);

  /**
   * Вход в систему
   * 
   * @param {string} email - Email пользователя
   * @param {string} password - Пароль
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const login = useCallback(async (email, password) => {
    setError(null);
    setLoading(true);

    try {
      // Базовая валидация на клиенте
      if (!email || !password) {
        const errorMsg = 'Email and password are required';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }

      const sanitizedEmail = SecurityUtils.validateEmail(email);
      if (!sanitizedEmail) {
        const errorMsg = 'Invalid email format';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }

      // Выполняем вход
      const result = await authService.login(sanitizedEmail, password);
      
      if (result.success && result.user) {
        // Валидируем данные пользователя перед сохранением
        const validatedUser = {
          id: SecurityUtils.sanitizeInput(String(result.user.id)),
          email: SecurityUtils.validateEmail(result.user.email),
          name: SecurityUtils.sanitizeInput(result.user.name || ''),
          roles: Array.isArray(result.user.roles) 
            ? result.user.roles.map(role => SecurityUtils.sanitizeInput(role))
            : ['ROLE_USER']
        };

        setUser(validatedUser);
        setError(null);
        
        return { success: true };
      } else {
        const errorMsg = result.error || 'Login failed';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'An unexpected error occurred';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Регистрация нового пользователя
   * 
   * @param {object} userData - Данные пользователя
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const register = useCallback(async (userData) => {
    setError(null);
    setLoading(true);

    try {
      // Валидация пароля
      const passwordValidation = SecurityUtils.validatePassword(userData.password);
      if (!passwordValidation.valid) {
        const errorMsg = 'Password does not meet security requirements';
        setError(errorMsg);
        return { 
          success: false, 
          error: errorMsg,
          passwordErrors: passwordValidation.errors 
        };
      }

      const result = await authService.register(userData);
      
      if (result.success && result.user) {
        const validatedUser = {
          id: SecurityUtils.sanitizeInput(String(result.user.id)),
          email: SecurityUtils.validateEmail(result.user.email),
          name: SecurityUtils.sanitizeInput(result.user.name || ''),
          roles: ['ROLE_USER']
        };

        setUser(validatedUser);
        setError(null);
        
        return { success: true };
      } else {
        const errorMsg = result.error || 'Registration failed';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Registration failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Выход из системы
   */
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      
      // Отзываем все сессии на сервере
      await tokenService.revokeAllOtherSessions();
      
      // Выполняем выход
      await authService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // В любом случае очищаем состояние на клиенте
      setUser(null);
      setError(null);
      setLoading(false);
      
      // Перенаправляем на страницу логина
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  /**
   * Очистка ошибки
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Обновление данных пользователя
   */
  const refreshUser = useCallback(async () => {
    try {
      const result = await authService.checkSession();
      if (result.success && result.user) {
        const validatedUser = {
          id: SecurityUtils.sanitizeInput(String(result.user.id)),
          email: SecurityUtils.validateEmail(result.user.email),
          name: SecurityUtils.sanitizeInput(result.user.name || ''),
          roles: Array.isArray(result.user.roles) 
            ? result.user.roles.map(role => SecurityUtils.sanitizeInput(role))
            : ['ROLE_USER']
        };
        setUser(validatedUser);
      }
    } catch (err) {
      console.error('Failed to refresh user data:', err);
    }
  }, []);

  /**
   * Мемоизированное значение контекста
   */
  const contextValue = useMemo(() => ({
    user,
    loading,
    error,
    isAuthenticated: !!user && isInitialized,
    isInitialized,
    login,
    register,
    logout,
    clearError,
    refreshUser
  }), [
    user, 
    loading, 
    error, 
    isInitialized, 
    login, 
    register, 
    logout, 
    clearError, 
    refreshUser
  ]);

  /**
   * Показываем экран загрузки при инициализации
   */
  if (!isInitialized && loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#f5f5f5'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }} />
          <p style={{ color: '#666' }}>Initializing application...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Хук для использования контекста авторизации
 * (дублируется здесь для обратной совместимости)
 */
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;