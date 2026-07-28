import { useEffect, useState, useCallback } from 'react';
import { SecurityUtils } from '../../utils/security';

/**
 * Безопасный iframe для загрузки дочерних приложений
 * 
 * Меры безопасности:
 * - Sandbox атрибуты ограничивают возможности iframe
 * - Проверка URL перед загрузкой
 * - Обработка ошибок загрузки
 * - Защита от clickjacking
 */
const SecureIframe = ({ 
  src, 
  title,
  sandbox = 'allow-scripts allow-forms',
  onLoad,
  onError 
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Проверяем URL перед загрузкой
  useEffect(() => {
    if (!SecurityUtils.isValidURL(src)) {
      setError('Invalid application URL');
      setLoading(false);
      if (onError) onError(new Error('Invalid URL'));
    }
  }, [src, onError]);

  /**
   * Обработчик успешной загрузки
   */
  const handleLoad = useCallback(() => {
    setLoading(false);
    setError(null);
    if (onLoad) onLoad();
  }, [onLoad]);

  /**
   * Обработчик ошибки загрузки
   */
  const handleError = useCallback((e) => {
    setLoading(false);
    setError('Failed to load application');
    if (onError) onError(e);
  }, [onError]);

  if (error) {
    return (
      <div className="iframe-error">
        <h3>Application Error</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="secure-iframe-container">
      {/* Индикатор загрузки */}
      {loading && (
        <div className="iframe-loading">
          <div className="spinner" />
          <p>Loading application...</p>
        </div>
      )}

      {/* Безопасный iframe */}
      <iframe
        src={src}
        title={title || 'Application'}
        sandbox={sandbox}
        onLoad={handleLoad}
        onError={handleError}
        referrerPolicy="no-referrer"
        loading="lazy"
        style={{ 
          display: loading ? 'none' : 'block',
          width: '100%',
          height: '100%',
          border: 'none'
        }}
      />
    </div>
  );
};

export default SecureIframe;