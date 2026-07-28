import { NavLink } from 'react-router-dom';
import { childApps } from '../../config/apps.config';
import { useAuth } from '../../contexts/AuthContext';
import { XSSProtection } from '../../utils/xssProtection';

/**
 * Боковое меню с навигацией
 * 
 * Особенности:
 * - Меню формируется динамически из конфигурации
 * - Поддерживает сворачивание для экономии места
 * - Показывает информацию о пользователе
 */
const Sidebar = ({ collapsed, onLogout }) => {
  const { user } = useAuth();

  return (
    <nav className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Заголовок */}
      <div className="sidebar-header">
        {!collapsed && <h2>Micro Frontend</h2>}
        {collapsed && <span className="logo-small">MF</span>}
      </div>

      {/* Навигационное меню */}
      <ul className="nav-list">
        {childApps.map((app) => (
          <li key={app.id} className="nav-item">
            <NavLink
              to={app.path}
              className={({ isActive }) => 
                `nav-link ${isActive ? 'active' : ''}`
              }
              title={app.name}
            >
              <span className="nav-icon" aria-hidden="true">
                {XSSProtection.escapeHTML(app.icon)}
              </span>
              {!collapsed && (
                <span className="nav-label">
                  {XSSProtection.escapeHTML(app.menuLabel)}
                </span>
              )}
            </NavLink>
          </li>
        ))}
      </ul>

      {/* Информация о пользователе и выход */}
      <div className="sidebar-footer">
        {!collapsed && user && (
          <div className="user-info">
            <span className="user-email">
              {XSSProtection.escapeHTML(user.email)}
            </span>
          </div>
        )}
        <button 
          onClick={onLogout} 
          className="logout-btn"
          title="Logout"
        >
          {collapsed ? '🚪' : 'Logout'}
        </button>
      </div>
    </nav>
  );
};

export default Sidebar;