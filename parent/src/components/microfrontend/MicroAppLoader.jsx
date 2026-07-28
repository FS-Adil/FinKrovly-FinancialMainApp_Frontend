import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import SecureIframe from './SecureIframe';
import { childApps, defaultAppConfig } from '../../config/apps.config';
import { useSecurePostMessage } from '../../hooks/useSecurePostMessage';
import { SecurityUtils } from '../../utils/security';

/**
 * Загрузчик дочерних приложений
 * 
 * Процесс загрузки:
 * 1. Находит конфигурацию приложения по ID из URL
 * 2. Строит безопасный URL с токеном (если нужно)
 * 3. Загружает приложение в защищенный iframe
 * 4. Передает токен через postMessage после загрузки
 */
const MicroAppLoader = () => {
  const { appId } = useParams();
  const [appConfig, setAppConfig] = useState(null);
  const [error, setError] = useState(null);
  
  const { iframeRef, sendToken } = useSecurePostMessage(appConfig);

  // Находим конфигурацию приложения
  useEffect(() => {
    const config = childApps.find(app => app.id === appId);
    
    if (!config) {
      setError(`Application "${appId}" not found`);
      return;
    }

    if (!SecurityUtils.isValidURL(config.url)) {
      setError(`Invalid URL for application "${appId}"`);
      return;
    }

    setAppConfig(config);
    setError(null);
  }, [appId]);

  /**
   * Построение URL для загрузки приложения
   */
  const buildAppURL = useCallback(() => {
    if (!appConfig) return '';

    const url = new URL(appConfig.url);

    // Если используется query метод передачи токена
    if (appConfig.authConfig.tokenTransferMethod === 'query') {
      // В production НЕ ИСПОЛЬЗОВАТЬ query метод!
      // Токен будет виден в URL и логах сервера
      console.warn('Query token transfer is not secure for production!');
    }

    return url.toString();
  }, [appConfig]);

  /**
   * Обработчик загрузки iframe
   */
  const handleIframeLoad = useCallback(() => {
    if (!appConfig) return;

    // После загрузки iframe отправляем токен через postMessage
    if (appConfig.authConfig.tokenTransferMethod === 'postMessage') {
      // Токен будет получен из cookie сервером дочернего приложения
      // Здесь можно отправить дополнительную информацию
      sendToken('authenticated');
    }
  }, [appConfig, sendToken]);

  if (error) {
    return (
      <div className="app-error">
        <h2>Error Loading Application</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!appConfig) {
    return (
      <div className="app-loading">
        <p>Loading application configuration...</p>
      </div>
    );
  }

  // Собираем sandbox атрибуты
  const sandboxAttributes = Object.entries(defaultAppConfig.sandbox)
    .filter(([, allowed]) => allowed)
    .map(([key]) => `allow-${key.toLowerCase().replace('allow', '')}`)
    .join(' ');

  return (
    <div className="micro-app-container">
      {/* Заголовок приложения */}
      <div className="app-header">
        <h3>{appConfig.name}</h3>
        {appConfig.description && <p>{appConfig.description}</p>}
      </div>

      {/* Безопасный iframe */}
      <SecureIframe
        ref={iframeRef}
        src={buildAppURL()}
        title={appConfig.name}
        sandbox={sandboxAttributes}
        onLoad={handleIframeLoad}
        onError={(err) => setError(err.message)}
      />
    </div>
  );
};

export default MicroAppLoader;