/**
 * КОНФИГУРАЦИЯ ДОЧЕРНИХ ПРИЛОЖЕНИЙ
 * 
 * Здесь добавляются новые микрофронтенды.
 * Каждое приложение загружается в iframe с ограниченными правами.
 * 
 * ДЛЯ ДОБАВЛЕНИЯ НОВОГО ПРИЛОЖЕНИЯ:
 * 1. Добавьте новый объект в массив childApps
 * 2. Запустите дочернее приложение
 * 3. Готово! Меню и роутинг обновятся автоматически
 */

export const childApps = [
  {
    // Уникальный идентификатор
    id: 'app1',
    // Название приложения
    name: 'CRM System',
    // Описание
    description: 'Customer Relationship Management',
    // Иконка для меню
    icon: '👥',
    // URL дочернего приложения
    url: import.meta.env.VITE_APP1_URL || 'http://localhost:3001',
    // Путь в роутере родительского приложения
    path: '/app1',
    // Название в меню
    menuLabel: 'CRM',
    // Требуется ли авторизация родителя
    requireParentAuth: true,
    // Настройки передачи токена
    authConfig: {
      // Метод передачи токена дочернему приложению
      tokenTransferMethod: 'postMessage', // 'postMessage' | 'query' | 'header'
      // Ключ для передачи токена
      tokenKey: 'parent_token'
    }
  },
  {
    id: 'app2',
    name: 'Analytics Dashboard',
    description: 'Data Analytics Platform',
    icon: '📊',
    url: import.meta.env.VITE_APP2_URL || 'http://localhost:3002',
    path: '/app2',
    menuLabel: 'Analytics',
    requireParentAuth: true,
    authConfig: {
      tokenTransferMethod: 'postMessage',
      tokenKey: 'auth_token'
    }
  }
  
  // ПРИМЕР ДОБАВЛЕНИЯ НОВОГО ПРИЛОЖЕНИЯ:
  // Раскомментируйте и настройте под свое приложение
  /*
  {
    id: 'app3',
    name: 'Document Manager',
    description: 'Document Management System',
    icon: '📄',
    url: import.meta.env.VITE_APP3_URL || 'http://localhost:3003',
    path: '/app3',
    menuLabel: 'Documents',
    requireParentAuth: true,
    authConfig: {
      tokenTransferMethod: 'postMessage',
      tokenKey: 'token'
    }
  }
  */
];

/**
 * Настройки по умолчанию для всех приложений
 */
export const defaultAppConfig = {
  // Таймаут загрузки iframe
  timeout: 10000,
  // Количество попыток загрузки
  retryAttempts: 3,
  // Настройки sandbox для iframe
  sandbox: {
    allowScripts: true,
    allowForms: true,
    allowPopups: false,
    allowSameOrigin: false,
    allowTopNavigation: false
  }
};