import { NavLink } from 'react-router-dom';
import './TabBar.css';

export function TabBar() {
  return (
    <nav className="tab-bar">
      <NavLink to="/" end className={({ isActive }) => `tab-item ${isActive ? 'active' : ''}`}>
        <div className="tab-icon">📊</div>
        <span className="tab-label">Dashboard</span>
      </NavLink>

      <NavLink to="/encaissements" className={({ isActive }) => `tab-item ${isActive ? 'active' : ''}`}>
        <div className="tab-icon">💰</div>
        <span className="tab-label">Encaissements</span>
      </NavLink>

      <NavLink to="/factures" className={({ isActive }) => `tab-item ${isActive ? 'active' : ''}`}>
        <div className="tab-icon">📄</div>
        <span className="tab-label">Factures</span>
      </NavLink>

      <NavLink to="/administration" className={({ isActive }) => `tab-item ${isActive ? 'active' : ''}`}>
        <div className="tab-icon">⚙️</div>
        <span className="tab-label">Administration</span>
      </NavLink>
    </nav>
  );
}
