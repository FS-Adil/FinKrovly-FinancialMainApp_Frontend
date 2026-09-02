import { useState, useCallback } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import SidebarToggle from './SidebarToggle';
import { useAuth } from '../../contexts/AuthContext';

const MainLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/login');
  }, [logout, navigate]);

  return (
    <div className="main-layout">
      <div className={`sidebar-container ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <Sidebar collapsed={sidebarCollapsed} onLogout={handleLogout} />
        <SidebarToggle collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      </div>
      
      <main className={`main-content ${sidebarCollapsed ? 'expanded' : ''}`}>
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;