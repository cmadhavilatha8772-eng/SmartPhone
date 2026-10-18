import { BarChart3, Database, Gauge, LogOut, MapPinned, Settings, Shield, Smartphone } from 'lucide-react'
import { NavLink } from 'react-router-dom'

// Keep route destinations and their navigation labels/icons in one list.
const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: BarChart3 },
  { label: 'Devices', path: '/devices', icon: Smartphone },
  { label: 'Telemetry', path: '/telemetry', icon: Database },
  { label: 'Map', path: '/map', icon: MapPinned },
  { label: 'Settings', path: '/settings', icon: Settings },
]

export default function Sidebar({ user, onLogout, isAdmin }) {
  const visibleNavItems = isAdmin
    ? [...navItems, { label: 'User activity', path: '/admin/activity', icon: Shield }]
    : navItems

  return (
    <aside className="sidebar">
      <div className="brand-box">
        <div className="brand-icon">
          <Gauge size={18} />
        </div>
        <div>
          <span className="brand-tag">Fleet Monitor</span>
          <strong>Smartphone Telemetry</strong>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Main navigation">
        {visibleNavItems.map(({ label, path, icon: Icon }) => (
          <NavLink key={path} to={path} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-chip">
          <span>{user?.displayName?.charAt(0)?.toUpperCase() || 'U'}</span>
          <div>
            <strong>{user?.displayName || 'User'}</strong>
            <small>{user?.email || 'Connected'}</small>
          </div>
        </div>

        <button type="button" className="logout-button" onClick={onLogout}>
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  )
}
