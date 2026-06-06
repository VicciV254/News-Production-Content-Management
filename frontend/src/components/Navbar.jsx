import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, Radio, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, isEditor, isJournalist, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar" aria-label="Main navigation">
      <div className="navbar-inner">
        <NavLink to="/" className="navbar-brand">
          <Radio size={22} style={{ verticalAlign: 'middle', marginRight: 8 }} />
          <span className="gradient-text">Broadcast News CMS</span>
        </NavLink>

        <div className="nav-links">
          <NavLink to="/feed" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            News Feed
          </NavLink>

          {user && isJournalist && (
            <NavLink to="/stories" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              My Stories
            </NavLink>
          )}

          {user && isEditor && (
            <>
              <NavLink to="/review" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                Editorial Review
              </NavLink>
              <NavLink to="/analytics" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                Analytics
              </NavLink>
            </>
          )}

          {user && isAdmin && (
            <NavLink to="/admin" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} style={{ color: '#DC2626' }}>
              Admin
            </NavLink>
          )}

          {user ? (
            <>
              <NavLink to="/profile" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <User size={16} /> Profile
              </NavLink>
              <button className="btn btn-secondary btn-sm" onClick={handleLogout} aria-label="Log out">
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <NavLink to="/login" className="btn btn-primary btn-sm">Login</NavLink>
          )}
        </div>
      </div>
    </nav>
  );
}
