/**
 * Генерация fingerprint устройства для привязки токенов
 * Этот fingerprint отправляется в заголовке X-Device-Fingerprint
 * и проверяется на сервере при обновлении токенов
 */

export class DeviceFingerprint {
  /**
   * Получение fingerprint устройства
   * Использует стабильные характеристики браузера/устройства
   */
  static getFingerprint() {
    const components = [
      navigator.userAgent,                    // Информация о браузере
      navigator.language,                     // Язык браузера
      screen.colorDepth,                      // Глубина цвета
      screen.width + 'x' + screen.height,     // Разрешение экрана
      new Date().getTimezoneOffset(),         // Часовой пояс
      navigator.hardwareConcurrency || 'unknown', // Количество ядер CPU
      navigator.platform,                     // Платформа
      this.getCanvasFingerprint()             // Canvas fingerprint
    ];

    // Создаем хеш из компонентов
    return this.hashString(components.join('|'));
  }

  /**
   * Canvas fingerprinting для большей уникальности
   * Разные устройства по-разному рендерят canvas
   */
  static getCanvasFingerprint() {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 50;
      
      const ctx = canvas.getContext('2d');
      
      // Рисуем текст с уникальным шрифтом
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('Device Fingerprint', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('Device Fingerprint', 4, 17);
      
      return canvas.toDataURL();
    } catch (e) {
      return 'canvas-not-supported';
    }
  }

  /**
   * Простое хеширование строки
   */
  static hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Получение заголовков для запроса
   */
  static getHeaders() {
    return {
      'X-Device-Fingerprint': this.getFingerprint(),
      'X-Requested-With': 'XMLHttpRequest'
    };
  }
}