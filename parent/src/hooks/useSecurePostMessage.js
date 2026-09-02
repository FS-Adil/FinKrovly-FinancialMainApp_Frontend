// import { useEffect, useRef, useCallback } from 'react';
// import { PostMessageSecurity } from '../utils/postMessageSecurity';

// /**
//  * Хук для безопасной работы с postMessage
//  * Используется для передачи токенов дочерним приложениям
//  */
// export const useSecurePostMessage = (appConfig) => {
//   const securityRef = useRef(new PostMessageSecurity());
//   const iframeRef = useRef(null);

//   // Настраиваем разрешенные origins при изменении конфигурации
//   useEffect(() => {
//     if (appConfig?.url) {
//       try {
//         const origin = new URL(appConfig.url).origin;
//         securityRef.current.addAllowedOrigin(origin);
//       } catch (e) {
//         console.error('Invalid app URL:', appConfig.url);
//       }
//     }
//   }, [appConfig?.url]);

//   /**
//    * Отправка токена дочернему приложению
//    */
//   const sendToken = useCallback((token) => {
//     if (!iframeRef.current || !appConfig?.url) return;

//     const origin = new URL(appConfig.url).origin;
    
//     const message = {
//       type: 'PARENT_AUTH_TOKEN',
//       token: token,
//       tokenKey: appConfig.authConfig.tokenKey,
//       timestamp: Date.now()
//     };

//     securityRef.current.sendSecureMessage(
//       iframeRef.current.contentWindow,
//       message,
//       origin
//     );
//   }, [appConfig]);

//   /**
//    * Подписка на сообщения от дочернего приложения
//    */
//   const onMessage = useCallback((handler) => {
//     return securityRef.current.onMessage((data, origin) => {
//       // Фильтруем сообщения от дочерних приложений
//       if (data.type === 'CHILD_READY' || data.type === 'CHILD_ERROR') {
//         handler(data, origin);
//       }
//     });
//   }, []);

//   return {
//     iframeRef,
//     sendToken,
//     onMessage
//   };
// };

// useSecurePostMessage.js
import { useEffect, useRef, useCallback } from 'react';
import { PostMessageSecurity } from '../utils/postMessageSecurity';

/**
 * Хук для безопасной работы с postMessage
 * Используется для передачи токенов дочерним приложениям
 */
export const useSecurePostMessage = (appConfig) => {
  const securityRef = useRef(new PostMessageSecurity());
  const iframeRef = useRef(null);

  // Настраиваем разрешенные origins при изменении конфигурации
  useEffect(() => {
    if (appConfig?.url) {
      try {
        const origin = new URL(appConfig.url).origin;
        securityRef.current.addAllowedOrigin(origin);
        console.log('🔒 Добавлен разрешенный origin:', origin);
      } catch (e) {
        console.error('Invalid app URL:', appConfig.url);
      }
    }
  }, [appConfig?.url]);

  /**
   * Отправка токена дочернему приложению
   */
  const sendToken = useCallback((token, userData = null) => {
    if (!iframeRef.current || !appConfig?.url) {
      console.warn('Iframe или URL приложения не найдены');
      return false;
    }

    const origin = new URL(appConfig.url).origin;
    
    const message = {
      type: 'PARENT_AUTH_TOKEN',
      token: token,
      user: userData?.user || null,
      organization: userData?.organization || null,
      tokenKey: appConfig.authConfig?.tokenKey || 'auth_token',
      timestamp: Date.now()
    };

    console.log('🔑 Отправка токена в дочернее приложение:', appConfig.name);
    
    return securityRef.current.sendSecureMessage(
      iframeRef.current.contentWindow,
      message,
      origin
    );
  }, [appConfig]);

  /**
   * Подписка на сообщения от дочернего приложения
   */
  const onMessage = useCallback((handler) => {
    return securityRef.current.onMessage((data, origin) => {
      console.log('📨 Получено сообщение от дочернего приложения:', data.type);
      
      // Фильтруем сообщения от дочерних приложений
      if (data.type === 'CHILD_READY' || 
          data.type === 'CHILD_ERROR' || 
          data.type === 'CHILD_AUTH_REQUEST' ||
          data.type === 'CHILD_STATUS' ||
          data.type === 'CHILD_LOGOUT') {
        handler(data, origin);
      }
    });
  }, []);

  return {
    iframeRef,
    sendToken,
    onMessage
  };
};