// MicroAppLoader.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { childApps, defaultAppConfig } from '../../config/apps.config';
import { useAuth } from '../../contexts/AuthContext';
import { PostMessageSecurity } from '../../utils/postMessageSecurity';

const appContainers = {};
const securityManager = new PostMessageSecurity();

childApps.forEach(app => {
  try {
    const origin = new URL(app.url).origin;
    securityManager.addAllowedOrigin(origin);
  } catch (e) {
    console.error('Invalid app URL:', app.url);
  }
});

const MicroAppLoader = () => {
  const location = useLocation();
  const [currentApp, setCurrentApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);
  const { user, organization, isAuthenticated } = useAuth();

  const sendAuthTokenToChild = useCallback((appId, origin) => {
    let container = appContainers[appId];
    
    if (!container && appId === 'unknown-app') {
      const firstAppId = Object.keys(appContainers)[0];
      if (firstAppId) {
        container = appContainers[firstAppId];
        appId = firstAppId;
      }
    }
    
    if (!container) {
      console.warn(`Container for ${appId} not found`);
      return;
    }

    const iframe = container.querySelector('iframe');
    if (!iframe || !iframe.contentWindow) {
      console.warn(`Iframe for ${appId} not found`);
      return;
    }

    const token = localStorage.getItem('auth_token') || 
                  document.cookie.match(/access_token=([^;]+)/)?.[1] ||
                  getTokenFromCookie();
    
    if (token || user) {
      const message = {
        type: 'PARENT_AUTH_TOKEN',
        token: token,
        user: user,
        organization: organization,
        timestamp: Date.now()
      };

      securityManager.sendSecureMessage(
        iframe.contentWindow,
        message,
        origin
      );
    }
  }, [user, organization]);

  useEffect(() => {
    const cleanup = securityManager.onMessage((data, origin) => {
      if (data.type === 'CHILD_READY' || data.type === 'CHILD_AUTH_REQUEST') {
        sendAuthTokenToChild(data.app || 'unknown-app', origin);
      }
      
      if (data.type === 'CHILD_LOGOUT') {
        console.log('Child app logged out');
      }
    });

    return cleanup;
  }, [sendAuthTokenToChild]);

  useEffect(() => {
    const app = childApps.find(a => location.pathname.startsWith(a.path));
    setCurrentApp(app);
    
    if (app && appContainers[app.id]) {
      setLoading(false);
    } else {
      setLoading(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!currentApp) return;

    Object.keys(appContainers).forEach(id => {
      if (appContainers[id]) {
        appContainers[id].style.display = 'none';
      }
    });

    if (appContainers[currentApp.id]) {
      appContainers[currentApp.id].style.display = 'block';
      setLoading(false);
      
      const origin = new URL(currentApp.url).origin;
      sendAuthTokenToChild(currentApp.id, origin);
    }
  }, [currentApp, sendAuthTokenToChild]);

  const createIframe = (app) => {
    if (!containerRef.current || appContainers[app.id]) return;

    const wrapper = document.createElement('div');
    wrapper.setAttribute('data-app', app.id);
    wrapper.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: block;
      background: white;
    `;

    // const sandboxAttrs = ['allow-scripts', 'allow-forms', 'allow-same-origin', 'allow-downloads']
    //   .filter(attr => {
    //     const key = attr.replace('allow-', 'allow').replace(/-./g, x => x[1].toUpperCase());
    //     return defaultAppConfig.sandbox?.[key] !== false;
    //   })
    //   .join(' ');

    const sandboxAttrs = [
      defaultAppConfig.sandbox?.allowScripts && 'allow-scripts',
      defaultAppConfig.sandbox?.allowForms && 'allow-forms',
      defaultAppConfig.sandbox?.allowSameOrigin && 'allow-same-origin',
      defaultAppConfig.sandbox?.allowDownloads && 'allow-downloads',
      defaultAppConfig.sandbox?.allowPopups && 'allow-popups',
      defaultAppConfig.sandbox?.allowTopNavigation && 'allow-top-navigation',
    ]
      .filter(Boolean)
      .join(' ');

    const iframe = document.createElement('iframe');
    iframe.src = app.url;
    iframe.title = app.name;
    iframe.setAttribute('sandbox', sandboxAttrs);
    iframe.setAttribute('referrerPolicy', 'no-referrer');
    iframe.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
      display: block;
    `;

    iframe.onload = () => {
      setLoading(false);
      
      setTimeout(() => {
        const origin = new URL(app.url).origin;
        sendAuthTokenToChild(app.id, origin);
      }, 200);
    };

    iframe.onerror = (e) => {
      console.error(`Error loading ${app.id}:`, e);
      setLoading(false);
    };

    wrapper.appendChild(iframe);
    containerRef.current.appendChild(wrapper);
    appContainers[app.id] = wrapper;
  };

  useEffect(() => {
    if (currentApp && !appContainers[currentApp.id]) {
      createIframe(currentApp);
    }
  }, [currentApp]);

  const reloadApp = (appId) => {
    const oldContainer = appContainers[appId];
    if (oldContainer && oldContainer.parentElement) {
      oldContainer.parentElement.removeChild(oldContainer);
    }
    delete appContainers[appId];
    
    setLoading(true);
    
    setTimeout(() => {
      if (currentApp && currentApp.id === appId) {
        createIframe(currentApp);
      }
    }, 100);
  };

  if (!currentApp) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Приложение не найдено</p>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '10px 20px',
        background: 'white',
        borderBottom: '1px solid #eee',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        minHeight: '50px'
      }}>
        <h3 style={{ margin: 0, fontSize: '16px' }}>{currentApp.name}</h3>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{
            padding: '3px 10px',
            borderRadius: '10px',
            fontSize: '11px',
            background: loading ? '#fff3cd' : '#d4edda',
            color: loading ? '#856404' : '#155724'
          }}>
            {loading ? 'Загрузка...' : 'Готово'}
          </span>
          
          <button 
            onClick={() => reloadApp(currentApp.id)}
            style={{
              padding: '4px 12px',
              background: '#f8f9fa',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            🔄 Обновить
          </button>
        </div>
      </div>

      <div 
        ref={containerRef}
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          background: '#f5f5f5'
        }}
      >
        {loading && !appContainers[currentApp.id] && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'white',
            zIndex: 10
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid #f3f3f3',
              borderTop: '3px solid #3498db',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: '15px'
            }} />
            <p style={{ color: '#666' }}>Загрузка {currentApp.name}...</p>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}
      </div>
    </div>
  );
};

function getTokenFromCookie() {
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'session_id' || name === 'auth_token') {
      return value;
    }
  }
  return null;
}

export default MicroAppLoader;