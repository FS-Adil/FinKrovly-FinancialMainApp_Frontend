/**
 * Общие утилиты безопасности
 */

export class SecurityUtils {
  /**
   * Санитизация пользовательского ввода
   */
  static sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    
    // Удаляем потенциально опасные символы
    return input
      .replace(/[<>]/g, '')           // Удаляем HTML теги
      .replace(/javascript:/gi, '')    // Удаляем javascript: протокол
      .replace(/on\w+=/gi, '')        // Удаляем обработчики событий
      .trim()
      .substring(0, 500);             // Ограничиваем длину
  }

  /**
   * Валидация email
   */
  static validateEmail(email) {
    const sanitized = this.sanitizeInput(email);
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(sanitized) ? sanitized : null;
  }

  /**
   * Валидация пароля
   */
  static validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return {
      valid: password.length >= minLength &&
             hasUpperCase &&
             hasLowerCase &&
             hasNumbers &&
             hasSpecialChar,
      errors: {
        length: password.length < minLength,
        upperCase: !hasUpperCase,
        lowerCase: !hasLowerCase,
        numbers: !hasNumbers,
        specialChar: !hasSpecialChar
      }
    };
  }

  /**
   * Проверка URL на безопасность
   */
  static isValidURL(url) {
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }

  /**
   * Генерация криптографически безопасного токена
   */
  static generateSecureToken(length = 32) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
}