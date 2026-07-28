/**
 * Кнопка сворачивания/разворачивания бокового меню
 */
const SidebarToggle = ({ collapsed, onToggle }) => {
  return (
    <button 
      className="sidebar-toggle"
      onClick={onToggle}
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      title={collapsed ? 'Expand menu' : 'Collapse menu'}
    >
      {collapsed ? '→' : '←'}
    </button>
  );
};

export default SidebarToggle;