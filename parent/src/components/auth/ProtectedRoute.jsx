import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Компонент для защиты маршрутов
 * Если пользователь не авторизован - перенаправляет на /login
 * Если авторизован - показывает дочерние компоненты через Outlet
 */
const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  // Показываем загрузку пока проверяем сессию
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <p>Checking authentication...</p>
      </div>
    );
  }

  // Если не авторизован - на страницу логина
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Если авторизован - показываем защищенный контент
  return <Outlet />;
};

export default ProtectedRoute;