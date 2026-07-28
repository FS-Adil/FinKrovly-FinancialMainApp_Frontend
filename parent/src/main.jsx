import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

/**
 * Точка входа в приложение
 * 
 * Инициализация безопасности:
 * - CSRF защита инициализируется в axiosInstance
 * - CSP настраивается в index.html
 * - Frame busting в index.html
 */
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);