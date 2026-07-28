import { useState, useCallback } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import SidebarToggle from './SidebarToggle';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Основной layout приложения
 * 
 * Структура:
 * - Боковое меню (сворачиваемое)
 * - Кнопка сворачивания меню
 * - Основная область контента (через Outlet)
 */
const MainLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  /**
   * Переключение состояния меню
   */
  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  /**
   * Выход из системы
   */
  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/login');
  }, [logout, navigate]);

  return (
    <div className="main-layout">
      {/* Боковая панель */}
      <div className={`sidebar-container ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <Sidebar 
          collapsed={sidebarCollapsed} 
          onLogout={handleLogout}
        />
        <SidebarToggle 
          collapsed={sidebarCollapsed} 
          onToggle={toggleSidebar} 
        />
      </div>
      
      {/* Основной контент */}
      <main className={`main-content ${sidebarCollapsed ? 'expanded' : ''}`}>
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;