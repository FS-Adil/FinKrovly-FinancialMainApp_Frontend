# FinKrovly-FinancialMainApp_Frontend

secure-micro-frontend/
├── frontend/                    # React + Vite приложение
│   ├── src/
│   │   ├── api/
│   │   │   └── axiosInstance.js        # Настроенный axios
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   ├── LoginForm.jsx       # Форма логина
│   │   │   │   ├── ProtectedRoute.jsx  # Защита маршрутов
│   │   │   │   └── AuthProvider.jsx    # Провайдер авторизации
│   │   │   ├── layout/
│   │   │   │   ├── MainLayout.jsx      # Основной layout
│   │   │   │   ├── Sidebar.jsx         # Боковое меню
│   │   │   │   └── SidebarToggle.jsx   # Кнопка сворачивания
│   │   │   └── microfrontend/
│   │   │       ├── MicroAppLoader.jsx  # Загрузчик дочерних приложений
│   │   │       └── SecureIframe.jsx    # Безопасный iframe
│   │   ├── config/
│   │   │   └── apps.config.js          # Конфигурация дочерних приложений
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx         # Контекст авторизации
│   │   ├── hooks/
│   │   │   ├── useAuth.js             # Хук авторизации
│   │   │   └── useSecurePostMessage.js # Хук безопасного postMessage
│   │   ├── services/
│   │   │   ├── authService.js          # Сервис авторизации
│   │   │   └── tokenService.js         # Сервис работы с токенами
│   │   ├── utils/
│   │   │   ├── csrfProtection.js       # CSRF защита
│   │   │   ├── deviceFingerprint.js    # Fingerprint устройства
│   │   │   ├── postMessageSecurity.js  # Безопасность postMessage
│   │   │   ├── security.js             # Общие утилиты безопасности
│   │   │   └── xssProtection.js        # Защита от XSS
│   │   ├── App.jsx                     # Главный компонент
│   │   ├── main.jsx                    # Точка входа
│   │   └── index.css                   # Глобальные стили
│   ├── .env                            # Переменные окружения
│   ├── vite.config.js                  # Конфигурация Vite
│   ├── index.html                      # HTML шаблон с CSP
│   └── package.json                    # Зависимости
