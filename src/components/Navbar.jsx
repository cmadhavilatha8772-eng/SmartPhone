import { Bell, LogOut, Moon, Sun, UserCircle2 } from 'lucide-react'

export default function Navbar({ user, onLogout, onToggleTheme, theme }) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Overview</p>
        <h1>Smartphone Telemetry</h1>
      </div>

      <div className="topbar-actions">
        <button type="button" className="icon-button" onClick={onToggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button type="button" className="icon-button" aria-label="Notifications">
          <Bell size={18} />
        </button>

        <div className="profile-pill">
          <div className="profile-avatar">
            <UserCircle2 size={18} />
          </div>
          <div>
            <strong>{user?.displayName || user?.email || 'User'}</strong>
            <small>{user?.email || 'No email provided'}</small>
          </div>
        </div>

        <button type="button" className="logout-button-inline" onClick={onLogout}>
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </header>
  )
}
