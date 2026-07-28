/**
 * Безопасная работа с postMessage API
 * Проверка origin и структуры сообщений
 */

export class PostMessageSecurity {
  constructor() {
    this.allowedOrigins = new Set();
    this.messageHandlers = new Map();
  }

  /**
   * Добавление разрешенного origin
   */
  addAllowedOrigin(origin) {
    try {
      const url = new URL(origin);
      this.allowedOrigins.add(url.origin);
    } catch (error) {
      console.error('Invalid origin:', origin);
    }
  }

  /**
   * Проверка origin сообщения
   */
  isOriginAllowed(origin) {
    return this.allowedOrigins.has(origin);
  }

  /**
   * Проверка структуры сообщения
   */
  validateMessage(data) {
    // Проверяем что это объект
    if (!data || typeof data !== 'object') return false;
    
    // Проверяем наличие типа сообщения
    if (!data.type || typeof data.type !== 'string') return false;
    
    // Проверяем на инжекции
    if (/[<>'"]/.test(data.type)) return false;
    
    // Проверяем размер сообщения
    const size = JSON.stringify(data).length;
    if (size > 10000) return false; // Максимум 10KB
    
    return true;
  }

  /**
   * Безопасная отправка сообщения
   */
  sendSecureMessage(targetWindow, message, targetOrigin) {
    if (!this.allowedOrigins.has(targetOrigin)) {
      console.error('Attempt to send message to unauthorized origin');
      return false;
    }

    const secureMessage = {
      ...message,
      timestamp: Date.now(),
      id: crypto.randomUUID()
    };

    targetWindow.postMessage(secureMessage, targetOrigin);
    return true;
  }

  /**
   * Подписка на безопасные сообщения
   */
  onMessage(handler) {
    const wrappedHandler = (event) => {
      // Игнорируем свои сообщения
      if (event.source === window) return;
      
      // Проверяем origin
      if (!this.isOriginAllowed(event.origin)) {
        console.warn('Message from unauthorized origin:', event.origin);
        return;
      }
      
      // Проверяем структуру
      if (!this.validateMessage(event.data)) {
        console.warn('Invalid message structure');
        return;
      }
      
      handler(event.data, event.origin, event.source);
    };

    window.addEventListener('message', wrappedHandler);
    return () => window.removeEventListener('message', wrappedHandler);
  }
}