import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import MainLayout from './components/layout/MainLayout';
import MicroAppLoader from './components/microfrontend/MicroAppLoader';
import LoginForm from './components/auth/LoginForm';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { childApps } from './config/apps.config';

/**
 * Главный компонент приложения
 * 
 * Структура роутинга:
 * /login - страница входа (публичная)
 * / - защищенная область
 *   /app1, /app2, ... - дочерние приложения
 * 
 * Все защищенные маршруты требуют авторизации
 * Токены никогда не передаются в URL или localStorage
 */
function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Публичный маршрут - страница входа */}
          <Route path="/login" element={<LoginForm />} />
          
          {/* Защищенные маршруты */}
          <Route element={<ProtectedRoute />}>
            {/* Основной layout с боковым меню */}
            <Route element={<MainLayout />}>
              {/* Главная страница - редирект на первое приложение */}
              <Route 
                path="/" 
                element={
                  <Navigate 
                    to={childApps[0]?.path || '/login'} 
                    replace 
                  />
                } 
              />
              
              {/* Динамические маршруты для дочерних приложений */}
              {childApps.map((app) => (
                <Route
                  key={app.id}
                  path={`${app.path}/*`}
                  element={<MicroAppLoader />}
                />
              ))}
              
              {/* 404 для неизвестных маршрутов */}
              <Route path="*" element={
                <div className="not-found">
                  <h2>Page not found</h2>
                  <p>The requested page does not exist.</p>
                </div>
              } />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;