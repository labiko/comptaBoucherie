import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './TabBar.css';

export function TabBar() {
  const { activeModules } = useAuth();

  return (
    <nav className="tab-bar">
      {activeModules.map((module) => (
        <NavLink
          key={module.id}
          to={module.route}
          end={module.route === '/'}
          className={({ isActive }) => `tab-item ${isActive ? 'active' : ''}`}
        >
          <div className="tab-icon">{module.icon}</div>
          <span className="tab-label">{module.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
