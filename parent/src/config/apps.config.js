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
    name: 'Махачкала ФК',
    // Описание
    description: 'Махачкала ФК',
    // Иконка для меню
    icon: '📊',
    // URL дочернего приложения
    url: import.meta.env.VITE_APP1_URL,
    // Путь в роутере родительского приложения
    path: '/app1',
    // Название в меню
    menuLabel: 'Махачкала ФК',
    // Название в меню
    smallMenuLabel: 'М ФК',
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
    name: 'Махачкала НК',
    description: 'Махачкала НК',
    icon: '📊',
    url: import.meta.env.VITE_APP1_URL,
    path: '/app2',
    menuLabel: 'Махачкала НК',
    smallMenuLabel: 'М НК',
    requireParentAuth: true,
    authConfig: {
      tokenTransferMethod: 'postMessage',
      tokenKey: 'parent_token'
    }
  },
  {
    id: 'app3',
    name: 'Дербент НК',
    description: 'Дербент НК',
    icon: '📊',
    url: import.meta.env.VITE_APP1_URL,
    path: '/app3',
    menuLabel: 'Дербент НК',
    smallMenuLabel: 'Д НК',
    requireParentAuth: true,
    authConfig: {
      tokenTransferMethod: 'postMessage',
      tokenKey: 'parent_token'
    }
  },
  {
    id: 'app4',
    name: 'Астрахань ФК',
    description: 'Астрахань ФК',
    icon: '📊',
    url: import.meta.env.VITE_APP4_URL,
    path: '/app4',
    menuLabel: 'Астрахань ФК',
    smallMenuLabel: 'А ФК',
    requireParentAuth: true,
    authConfig: {
      tokenTransferMethod: 'postMessage',
      tokenKey: 'parent_token'
    }
  },
  {
    id: 'app5',
    name: 'Астрахань СД',
    description: 'Астрахань СД',
    icon: '📊',
    url: import.meta.env.VITE_APP5_URL,
    path: '/app5',
    menuLabel: 'Астрахань СД',
    smallMenuLabel: 'А СД',
    requireParentAuth: true,
    authConfig: {
      tokenTransferMethod: 'postMessage',
      tokenKey: 'parent_token'
    }
  },
  {
    id: 'app6',
    name: 'Пятигорск Кровля',
    description: 'Пятигорск Кровля',
    icon: '📊',
    url: import.meta.env.VITE_APP6_URL,
    path: '/app6',
    menuLabel: 'Пятигорск Кровля',
    smallMenuLabel: 'ПК',
    requireParentAuth: true,
    authConfig: {
      tokenTransferMethod: 'postMessage',
      tokenKey: 'parent_token'
    }
  },
    {
    id: 'app7',
    name: 'Пятигорск Вентиляция',
    description: 'Пятигорск Вентиляция',
    icon: '📊',
    url: import.meta.env.VITE_APP7_URL,
    path: '/app7',
    menuLabel: 'Пятигорск Вентиляция',
    smallMenuLabel: 'ПВ',
    requireParentAuth: true,
    authConfig: {
      tokenTransferMethod: 'postMessage',
      tokenKey: 'parent_token'
    }
  },
  {
    id: 'app8',
    name: 'Ростов',
    description: 'Ростов',
    icon: '📊',
    url: import.meta.env.VITE_APP8_URL,
    path: '/app8',
    menuLabel: 'Ростов',
    smallMenuLabel: 'Р',
    requireParentAuth: true,
    authConfig: {
      tokenTransferMethod: 'postMessage',
      tokenKey: 'parent_token'
    }
  },
  {
    id: 'app9',
    name: 'Москва',
    description: 'Москва',
    icon: '📊',
    url: import.meta.env.VITE_APP9_URL,
    path: '/app9',
    menuLabel: 'Москва',
    smallMenuLabel: 'М',
    requireParentAuth: true,
    authConfig: {
      tokenTransferMethod: 'postMessage',
      tokenKey: 'parent_token'
    }
  }

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
    allowSameOrigin: true,
    allowTopNavigation: false,
    allowDownloads: true
  }
};