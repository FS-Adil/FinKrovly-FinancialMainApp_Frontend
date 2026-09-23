import { useEffect, useRef, useState } from 'react';

/**
 * Безопасный iframe с надежным кешированием
 * 
 * 🔥 АРХИТЕКТУРА:
 * - Все iframe живут в глобальном контейнере ВНЕ React
 * - React только управляет видимостью через display
 * - Кеш не зависит от монтирования/размонтирования компонентов
 */

// Глобальные переменные (вне React)
const iframeCache = new Map();           // appId -> { container, iframe }
let globalContainer = null;              // Единый контейнер для всех iframe
let containerMounted = false;            // Флаг монтирования в DOM

/**
 * Инициализация глобального контейнера (вызывается один раз)
 */
function initGlobalContainer() {
  if (globalContainer) return globalContainer;
  
  globalContainer = document.createElement('div');
  globalContainer.id = 'apps-global-container';
  globalContainer.style.cssText = `
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #fff;
  `;
  
  console.log('[SecureIframe] 🌍 Global container created');
  return globalContainer;
}

/**
 * Создание iframe для приложения (вызывается один раз для каждого appId)
 */
function createAppIframe(appId, src, title, sandbox, onLoad, onError) {
  console.log(`[SecureIframe] 🔨 Creating iframe for: ${appId}`);
  
  // Создаем контейнер приложения
  const appContainer = document.createElement('div');
  appContainer.className = 'app-iframe-container';
  appContainer.setAttribute('data-app-id', appId);
  appContainer.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: none;
    background: white;
  `;

  // Создаем iframe
  const iframe = document.createElement('iframe');
  iframe.src = src;
  iframe.title = title || 'Application';
  iframe.setAttribute('sandbox', sandbox);
  iframe.setAttribute('referrerPolicy', 'no-referrer');
  iframe.style.cssText = `
    width: 100%;
    height: 100%;
    border: none;
    display: block;
  `;

  // Обработчик загрузки
  iframe.onload = () => {
    console.log(`[SecureIframe] ✅ Iframe loaded: ${appId}`);
    if (onLoad) onLoad();
  };

  // Обработчик ошибки
  iframe.onerror = (e) => {
    console.error(`[SecureIframe] ❌ Iframe error: ${appId}`, e);
    if (onError) onError(e);
  };

  appContainer.appendChild(iframe);
  
  // Сохраняем в кеш
  iframeCache.set(appId, {
    container: appContainer,
    iframe: iframe,
    loaded: false
  });

  // Добавляем в глобальный контейнер
  const global = initGlobalContainer();
  global.appendChild(appContainer);

  return { container: appContainer, iframe: iframe };
}

/**
 * Показать приложение и скрыть остальные
 */
function showApp(appId) {
  console.log(`[SecureIframe] 👁️ Showing app: ${appId}`);
  
  iframeCache.forEach((data, id) => {
    if (data.container) {
      data.container.style.display = id === appId ? 'block' : 'none';
    }
  });
}

const SecureIframe = ({ 
  src, 
  title,
  appId,
  sandbox = 'allow-scripts allow-forms allow-same-origin allow-downloads',
  onLoad,
  onError 
}) => {
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
  const containerRef = useRef(null);
  
  // 🔥 Главный эффект: управление приложением
  useEffect(() => {
    console.log(`[SecureIframe] ⚡ Effect for: ${appId}`);
    
    if (!appId || !src) {
      setStatus('error');
      return;
    }

    // Проверяем валидность URL
    try {
      new URL(src);
    } catch (e) {
      console.error(`[SecureIframe] ❌ Invalid URL: ${src}`);
      setStatus('error');
      return;
    }

    // Если приложение уже в кеше - просто показываем
    if (iframeCache.has(appId)) {
      console.log(`[SecureIframe] ✅ ${appId} already in cache`);
      showApp(appId);
      setStatus('ready');
      return;
    }

    // Создаем новое приложение
    console.log(`[SecureIframe] 🆕 Creating new app: ${appId}`);
    
    const handleLoad = () => {
      console.log(`[SecureIframe] ✅ Loaded callback: ${appId}`);
      setStatus('ready');
      if (onLoad) onLoad();
    };

    const handleError = (err) => {
      console.error(`[SecureIframe] ❌ Error callback: ${appId}`, err);
      setStatus('error');
      if (onError) onError(err);
    };

    const { container } = createAppIframe(appId, src, title, sandbox, handleLoad, handleError);
    
    // Показываем новое приложение
    container.style.display = 'block';
    
    // Монтируем глобальный контейнер в DOM
    if (containerRef.current && !containerMounted) {
      containerRef.current.appendChild(initGlobalContainer());
      containerMounted = true;
      console.log('[SecureIframe] 📌 Global container mounted to DOM');
    }

  }, [appId, src, title, sandbox, onLoad, onError]);

  // 🔥 Эффект для монтирования глобального контейнера
  useEffect(() => {
    if (containerRef.current && globalContainer && !containerMounted) {
      containerRef.current.appendChild(globalContainer);
      containerMounted = true;
      console.log('[SecureIframe] 📌 Global container mounted (mount effect)');
    }
  });

  // 🔥 При изменении appId показываем нужное приложение
  useEffect(() => {
    if (appId && iframeCache.has(appId)) {
      showApp(appId);
    }
  }, [appId]);

  // Ошибка
  if (status === 'error') {
    return (
      <div style={{
        padding: '30px',
        textAlign: 'center',
        background: '#fde8e8',
        margin: '20px',
        borderRadius: '8px'
      }}>
        <h3 style={{ color: '#c0392b' }}>Application Error</h3>
        <p style={{ color: '#666' }}>Failed to load: {appId}</p>
        <button onClick={() => {
          if (appId) {
            const data = iframeCache.get(appId);
            if (data?.container?.parentElement) {
              data.container.parentElement.removeChild(data.container);
            }
            iframeCache.delete(appId);
          }
          setStatus('loading');
        }} style={{
          marginTop: '10px',
          padding: '8px 20px',
          background: '#3498db',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}>
          Retry
        </button>
      </div>
    );
  }

  // Загрузка
  if (status === 'loading') {
    return (
      <div ref={containerRef} style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 15px'
          }} />
          <p>Loading: {title || appId}</p>
        </div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Готово - показываем контейнер
  return (
    <div ref={containerRef} style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      overflow: 'hidden'
    }}>
      {/* Глобальный контейнер монтируется сюда */}
      {/* Отладочная метка */}
      <div style={{
        position: 'absolute',
        bottom: '5px',
        right: '5px',
        background: 'rgba(0,0,0,0.5)',
        color: 'white',
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '10px',
        zIndex: 9999,
        pointerEvents: 'none'
      }}>
        {appId} | {iframeCache.has(appId) ? 'Active' : '...'}
      </div>
    </div>
  );
};

// Утилиты
export const reloadApp = (appId) => {
  const data = iframeCache.get(appId);
  if (data) {
    if (data.container?.parentElement) {
      data.container.parentElement.removeChild(data.container);
    }
    iframeCache.delete(appId);
  }
};

export const isAppLoaded = (appId) => iframeCache.has(appId);

export const clearAllApps = () => {
  iframeCache.forEach((data) => {
    if (data.container?.parentElement) {
      data.container.parentElement.removeChild(data.container);
    }
  });
  iframeCache.clear();
  if (globalContainer?.parentElement) {
    globalContainer.parentElement.removeChild(globalContainer);
  }
  globalContainer = null;
  containerMounted = false;
};

// export default SecureIframe;