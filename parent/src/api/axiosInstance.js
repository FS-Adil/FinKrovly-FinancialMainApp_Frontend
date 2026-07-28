import axios from 'axios';
import { CSRFProtection } from '../utils/csrfProtection';
import { DeviceFingerprint } from '../utils/deviceFingerprint';

/**
 * Настроенный экземпляр axios
 * 
 * ВАЖНО: Мы НЕ храним JWT токены на клиенте!
 * Токены передаются в HttpOnly cookies автоматически.
 * Axios настроен на отправку cookies с каждым запросом.
 */

// Инициализируем CSRF защиту
CSRFProtection.init();

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // КРИТИЧНО: автоматическая отправка cookies
  headers: {
    'Content-Type': 'application/json',
    ...CSRFProtection.getHeader(),
    ...DeviceFingerprint.getHeaders()
  }
});

// Флаг для предотвращения множественных запросов на обновление
let isRefreshing = false;
let failedQueue = [];

/**
 * Обработка очереди запросов после обновления токена
 */
const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

/**
 * Перехватчик запросов
 * Добавляет CSRF токен и fingerprint устройства
 */
axiosInstance.interceptors.request.use(
  (config) => {
    // Добавляем CSRF токен в заголовки
    const csrfToken = CSRFProtection.getToken();
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
    
    // Добавляем fingerprint устройства
    config.headers['X-Device-Fingerprint'] = DeviceFingerprint.getFingerprint();
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Перехватчик ответов
 * Автоматически обновляет токены при 401 ошибке
 */
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Если ошибка 401 и это не запрос на обновление токена
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/api/auth/refresh') &&
      !originalRequest.url.includes('/api/auth/login')
    ) {
      // Предотвращаем множественные запросы на обновление
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return axiosInstance(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Пытаемся обновить токены
        // Refresh token автоматически отправится в cookie
        await axiosInstance.post('/api/auth/refresh');
        
        // Обновление успешно - повторяем очередь
        processQueue(null);
        
        // Повторяем оригинальный запрос
        return axiosInstance(originalRequest);
        
      } catch (refreshError) {
        // Не удалось обновить - разлогиниваем
        processQueue(refreshError, null);
        
        // Перенаправляем на страницу логина
        window.location.href = '/login';
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;