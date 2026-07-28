/**
 * Защита от CSRF атак
 * Double Submit Cookie паттерн
 */

export class CSRFProtection {
  static TOKEN_KEY = 'csrf_token';

  /**
   * Инициализация CSRF защиты
   */
  static init() {
    // Генерируем токен если его нет
    if (!this.getToken()) {
      this.generateToken();
    }
  }

  /**
   * Генерация CSRF токена
   */
  static generateToken() {
    const token = this.createSecureToken();
    
    // Сохраняем в cookie (не HttpOnly, чтобы JS мог читать)
    document.cookie = `${this.TOKEN_KEY}=${token}; path=/; SameSite=Strict; Secure`;
    
    // Сохраняем в мета-тег для доступа из JS
    this.updateMetaToken(token);
    
    return token;
  }

  /**
   * Получение CSRF токена
   */
  static getToken() {
    // Пытаемся получить из cookie
    const cookies = document.cookie.split('; ');
    const tokenCookie = cookies.find(c => c.startsWith(`${this.TOKEN_KEY}=`));
    
    if (tokenCookie) {
      return tokenCookie.split('=')[1];
    }
    
    return null;
  }

  /**
   * Получение заголовка с CSRF токеном
   */
  static getHeader() {
    return {
      'X-CSRF-Token': this.getToken()
    };
  }

  /**
   * Обновление мета-тега с токеном
   */
  static updateMetaToken(token) {
    let meta = document.querySelector('meta[name="csrf-token"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'csrf-token';
      document.head.appendChild(meta);
    }
    meta.content = token;
  }

  /**
   * Создание криптографически безопасного токена
   */
  static createSecureToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
}