/**
 * Защита от XSS атак
 * Все данные, которые приходят от пользователя или API,
 * должны проходить через эти функции перед отображением
 */

export class XSSProtection {
  /**
   * Экранирование HTML символов
   * Использовать перед вставкой данных в HTML
   */
  static escapeHTML(str) {
    if (!str) return '';
    
    const htmlEscapes = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    };
    
    return String(str).replace(/[&<>"'\/]/g, char => htmlEscapes[char]);
  }

  /**
   * Санитизация URL
   * Проверяет и очищает URL от вредоносного кода
   */
  static sanitizeURL(url) {
    if (!url) return '';
    
    // Удаляем потенциально опасные протоколы
    const dangerous = /^(javascript|data|vbscript):/i;
    if (dangerous.test(url)) {
      return '';
    }
    
    return url;
  }

  /**
   * Безопасное создание HTML элементов
   */
  static createSafeElement(tag, attributes = {}, textContent = '') {
    const element = document.createElement(tag);
    
    // Безопасно устанавливаем атрибуты
    Object.entries(attributes).forEach(([key, value]) => {
      if (key.startsWith('on')) return; // Пропускаем обработчики событий
      if (key === 'href' || key === 'src') {
        element.setAttribute(key, this.sanitizeURL(value));
      } else {
        element.setAttribute(key, value);
      }
    });
    
    // Безопасно устанавливаем текст
    element.textContent = textContent;
    
    return element;
  }
}