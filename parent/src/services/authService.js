import axiosInstance from '../api/axiosInstance';
import { SecurityUtils } from '../utils/security';

/**
 * Сервис аутентификации
 * 
 * ВАЖНО: Мы НЕ храним JWT токены на клиенте!
 * Токены передаются в HttpOnly cookies автоматически.
 */
class AuthService {
  // Приватные константы для валидации
  #REQUIRED_USER_FIELDS = ['id', 'email', 'role'];
  #MAX_LOGIN_ATTEMPTS = 5;
  #LOGIN_TIMEOUT_MS = 30000;
  
  // Счетчик попыток входа (в памяти, сбрасывается при перезагрузке)
  #loginAttempts = new Map();
  #lastAttemptTime = new Map();

  /**
   * Проверка на превышение лимита попыток входа
   * @private
   */
  #checkRateLimit(email) {
    const now = Date.now();
    const attempts = this.#loginAttempts.get(email) || 0;
    const lastTime = this.#lastAttemptTime.get(email) || 0;
    
    // Сброс счетчика если прошло больше 15 минут
    if (now - lastTime > 15 * 60 * 1000) {
      this.#loginAttempts.set(email, 0);
      return true;
    }
    
    return attempts < this.#MAX_LOGIN_ATTEMPTS;
  }

  /**
   * Увеличение счетчика попыток
   * @private
   */
  #incrementAttempts(email) {
    const attempts = (this.#loginAttempts.get(email) || 0) + 1;
    this.#loginAttempts.set(email, attempts);
    this.#lastAttemptTime.set(email, Date.now());
  }

  /**
   * Сброс счетчика попыток
   * @private
   */
  #resetAttempts(email) {
    this.#loginAttempts.delete(email);
    this.#lastAttemptTime.delete(email);
  }

  /**
   * Валидация объекта пользователя
   * @private
   */
  #validateUserObject(userData) {
    if (!userData || typeof userData !== 'object') {
      return false;
    }

    // Проверяем наличие всех обязательных полей
    const hasAllFields = this.#REQUIRED_USER_FIELDS.every(field => 
      Object.prototype.hasOwnProperty.call(userData, field)
    );

    if (!hasAllFields) {
      return false;
    }

    // Валидация типов данных
    if (typeof userData.id !== 'number' && typeof userData.id !== 'string') {
      return false;
    }

    if (typeof userData.email !== 'string' || !userData.email.includes('@')) {
      return false;
    }

    if (typeof userData.role !== 'string' || userData.role.length === 0) {
      return false;
    }

    // Проверка на инъекции в строковых полях
    const stringFields = ['email', 'name', 'role'];
    for (const field of stringFields) {
      if (userData[field] && typeof userData[field] === 'string') {
        if (/[<>{}]/.test(userData[field])) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Безопасное извлечение данных пользователя из ответа
   * @private
   */
  #extractUserData(responseData) {
    if (!responseData || typeof responseData !== 'object') {
      return null;
    }

    let userData = null;

    // Проверяем оба возможных формата ответа
    if (Object.prototype.hasOwnProperty.call(responseData, 'user') && 
        typeof responseData.user === 'object') {
      userData = responseData.user;
    } else if (Object.prototype.hasOwnProperty.call(responseData, 'id')) {
      userData = responseData;
    } else {
      return null;
    }

    // Валидируем извлеченные данные
    if (!this.#validateUserObject(userData)) {
      return null;
    }

    // Создаем новый объект только с разрешенными полями
    return {
      id: userData.id,
      email: SecurityUtils.validateEmail(userData.email) || userData.email,
      name: userData.name ? SecurityUtils.sanitizeInput(userData.name) : '',
      role: userData.role
    };
  }

  /**
   * Вход в систему
   * @param {string} email - Email пользователя
   * @param {string} password - Пароль (никогда не логируется и не сохраняется)
   * @returns {Promise<{success: boolean, user?: object, error?: string}>}
   */
  async login(email, password) {
    // Проверка входных параметров
    if (!email || !password) {
      return { success: false, error: 'Credentials required' };
    }

    // Проверка лимита попыток
    if (!this.#checkRateLimit(email)) {
      return { 
        success: false, 
        error: 'Too many attempts. Try again later.' 
      };
    }

    try {
      // Санитизируем email
      const sanitizedEmail = SecurityUtils.validateEmail(email);
      if (!sanitizedEmail) {
        this.#incrementAttempts(email);
        return { success: false, error: 'Invalid credentials' };
      }

      // Создаем AbortController для таймаута
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.#LOGIN_TIMEOUT_MS);

      // Отправляем запрос на логин
      const response = await axiosInstance.post('/api/auth/login', {
        email: sanitizedEmail,
        password: password
      }, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Извлекаем и валидируем данные пользователя
      const userData = this.#extractUserData(response.data);

      if (!userData) {
        this.#incrementAttempts(email);
        return { success: false, error: 'Invalid credentials' };
      }

      // 🔑 Достаём accessToken из ответа 8383
      const accessToken = response.data?.accessToken || null;

      if (!accessToken) {
        console.warn('8383 did not return accessToken');
      }

      this.#resetAttempts(email);

      return {
        success: true,
        user: userData,
        accessToken                    // ← возвращаем наружу
      };

    } catch (error) {
      this.#incrementAttempts(email);

      // Не раскрываем детали ошибки
      if (error.name === 'AbortError') {
        return { 
          success: false, 
          error: 'Request timeout' 
        };
      }

      // Всегда возвращаем одинаковое сообщение об ошибке
      return {
        success: false,
        error: 'Invalid credentials'
      };
    }
  }

  /**
   * Регистрация нового пользователя
   */
  async register(userData) {
    if (!userData || !userData.email || !userData.password) {
      return { success: false, error: 'Invalid registration data' };
    }

    try {
      const sanitizedData = {
        email: SecurityUtils.validateEmail(userData.email),
        name: SecurityUtils.sanitizeInput(userData.name || ''),
        password: userData.password
      };

      if (!sanitizedData.email) {
        return { success: false, error: 'Invalid registration data' };
      }

      if (!sanitizedData.name || sanitizedData.name.length === 0) {
        return { success: false, error: 'Invalid registration data' };
      }

      const response = await axiosInstance.post('/api/auth/register', sanitizedData);

      const user = this.#extractUserData(response.data);
      
      if (!user) {
        return { success: false, error: 'Registration failed' };
      }

      return {
        success: true,
        user: user
      };

    } catch (error) {
      return {
        success: false,
        error: 'Registration failed'
      };
    }
  }

  /**
   * Выход из системы
   */
  async logout() {
    try {
      await axiosInstance.post('/api/auth/logout');
    } catch (error) {
      // Игнорируем ошибки при выходе
    } finally {
      return { success: true };
    }
  }

  /**
   * Проверка текущей сессии
   */
  // async checkSession() {
  //   try {
  //     const response = await axiosInstance.get('/api/auth/me');
      
  //     const userData = this.#extractUserData(response.data);
      
  //     if (!userData) {
  //       return {
  //         success: false,
  //         user: null
  //       };
  //     }

  //     return {
  //       success: true,
  //       user: userData
  //     };
  //   } catch (error) {
  //     // При ошибке проверки сессии всегда возвращаем null пользователя
  //     return {
  //       success: false,
  //       user: null
  //     };
  //   }
  // }

  async checkSession() {
    try {
      const response = await axiosInstance.get('/api/auth/me');
      const userData = this.#extractUserData(response.data);

      if (!userData) {
        return { success: false, user: null };
      }

      return {
        success: true,
        user: userData,
        accessToken: response.data?.accessToken || null   // ← если 8383 отдаёт
      };
    } catch (error) {
      return { success: false, user: null };
    }
  }

  /**
   * Обновление токенов
   */
  async refreshTokens() {
    try {
      await axiosInstance.post('/api/auth/refresh');
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  }
}

// Экспортируем замороженный singleton для предотвращения модификаций
const authService = new AuthService();
export default Object.freeze(authService);