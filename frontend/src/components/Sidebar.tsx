import { NavLink } from 'react-router-dom';

const navItems = [
  { path: '/', label: '智能对话', icon: '💬' },
  { path: '/evaluate', label: '评估功能', icon: '📊' },
  { path: '/history', label: '对话历史', icon: '📋' },
  { path: '/status', label: '系统状态', icon: '🩺' },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-title">🤖 智能问答</h1>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <span className="sidebar-version">v1.0.0</span>
      </div>
    </aside>
  );
}
