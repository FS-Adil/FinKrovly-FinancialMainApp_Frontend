import axiosInstance from '../api/axiosInstance';
import { SecurityUtils } from '../utils/security';

/**
 * Сервис для работы с токенами
 * 
 * ВАЖНО: Этот сервис НЕ хранит токены на клиенте!
 * Все операции с токенами выполняются через HttpOnly cookies.
 * 
 * Сервис предоставляет методы для:
 * - Проверки валидности токенов
 * - Принудительного обновления токенов
 * - Получения информации о токенах (из ответов сервера)
 */

class TokenService {
  /**
   * Проверка валидности текущего access токена
   * Сервер проверяет токен из cookie и возвращает статус
   * 
   * @returns {Promise<{valid: boolean, expiresAt?: number, user?: object}>}
   */
  async validateToken() {
    try {
      const response = await axiosInstance.get('/api/auth/validate');
      return {
        valid: true,
        expiresAt: response.data.expiresAt,
        user: response.data.user
      };
    } catch (error) {
      return {
        valid: false,
        error: error.response?.data?.error || 'Token validation failed'
      };
    }
  }

  /**
   * Принудительное обновление токенов
   * Использует refresh token из cookie для получения новой пары токенов
   * 
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async refreshToken() {
    try {
      const response = await axiosInstance.post('/api/auth/refresh');
      return {
        success: true,
        message: response.data.message || 'Tokens refreshed successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Token refresh failed'
      };
    }
  }

  /**
   * Получение информации о времени жизни токенов
   * 
   * @returns {Promise<{accessTokenExpiry?: number, refreshTokenExpiry?: number}>}
   */
  async getTokenExpiry() {
    try {
      const response = await axiosInstance.get('/api/auth/token-info');
      return {
        accessTokenExpiry: response.data.accessTokenExpiry,
        refreshTokenExpiry: response.data.refreshTokenExpiry
      };
    } catch (error) {
      console.error('Failed to get token info:', error);
      return {};
    }
  }

  /**
   * Проверка, истекает ли токен скоро
   * 
   * @param {number} thresholdMinutes - Порог в минутах (по умолчанию 5)
   * @returns {Promise<boolean>}
   */
  async isTokenExpiringSoon(thresholdMinutes = 5) {
    try {
      const { accessTokenExpiry } = await this.getTokenExpiry();
      
      if (!accessTokenExpiry) return true;
      
      const now = Date.now();
      const timeUntilExpiry = accessTokenExpiry - now;
      const thresholdMs = thresholdMinutes * 60 * 1000;
      
      return timeUntilExpiry <= thresholdMs;
    } catch {
      return true; // В случае ошибки считаем, что токен истекает
    }
  }

  /**
   * Автоматическое обновление токена если он скоро истечет
   * 
   * @param {number} thresholdMinutes - Порог в минутах
   * @returns {Promise<void>}
   */
  async refreshIfNeeded(thresholdMinutes = 5) {
    const isExpiring = await this.isTokenExpiringSoon(thresholdMinutes);
    
    if (isExpiring) {
      console.log('Token is expiring soon, refreshing...');
      await this.refreshToken();
    }
  }

  /**
   * Настройка автоматического обновления токенов
   * Запускает интервал для проверки и обновления токенов
   * 
   * @param {number} checkIntervalMs - Интервал проверки в мс (по умолчанию 1 минута)
   * @param {number} thresholdMinutes - Порог обновления в минутах (по умолчанию 5)
   * @returns {Function} - Функция для остановки интервала
   */
  setupAutoRefresh(checkIntervalMs = 60000, thresholdMinutes = 5) {
    const intervalId = setInterval(async () => {
      try {
        await this.refreshIfNeeded(thresholdMinutes);
      } catch (error) {
        console.error('Auto-refresh failed:', error);
      }
    }, checkIntervalMs);

    // Возвращаем функцию для очистки интервала
    return () => {
      clearInterval(intervalId);
    };
  }

  /**
   * Получение информации о текущей сессии
   * Включает информацию об устройстве и времени входа
   * 
   * @returns {Promise<object|null>}
   */
  async getSessionInfo() {
    try {
      const response = await axiosInstance.get('/api/auth/session-info');
      return {
        device: response.data.device,
        ipAddress: response.data.ipAddress,
        loginTime: response.data.loginTime,
        lastActivity: response.data.lastActivity
      };
    } catch (error) {
      console.error('Failed to get session info:', error);
      return null;
    }
  }

  /**
   * Завершение всех сессий пользователя (кроме текущей)
   * Полезно при смене пароля или обнаружении подозрительной активности
   * 
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async revokeAllOtherSessions() {
    try {
      await axiosInstance.post('/api/auth/revoke-sessions');
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to revoke sessions'
      };
    }
  }

  /**
   * Получение списка активных сессий
   * 
   * @returns {Promise<Array<{id: string, device: string, lastActivity: number}>>}
   */
  async getActiveSessions() {
    try {
      const response = await axiosInstance.get('/api/auth/sessions');
      return response.data.sessions || [];
    } catch (error) {
      console.error('Failed to get active sessions:', error);
      return [];
    }
  }

  /**
   * Завершение конкретной сессии по ID
   * 
   * @param {string} sessionId
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async revokeSession(sessionId) {
    try {
      await axiosInstance.delete(`/api/auth/sessions/${sessionId}`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to revoke session'
      };
    }
  }
}

// Экспортируем singleton
export default new TokenService();