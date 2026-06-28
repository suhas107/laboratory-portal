import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineHome,
  HiOutlineUsers,
  HiOutlineFolder,
  HiOutlineDocumentText,
  HiOutlineBeaker,
  HiOutlineChartBar,
  HiOutlineArrowRightOnRectangle,
  HiOutlineBars3,
  HiOutlineXMark,
  HiOutlineUserGroup,
} from 'react-icons/hi2';
import { useState, useEffect } from 'react';

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: HiOutlineHome },
    { path: '/people', label: 'People', icon: HiOutlineUsers },
    { path: '/projects', label: 'Projects', icon: HiOutlineFolder },
    { path: '/publications', label: 'Publications', icon: HiOutlineDocumentText },
    { path: '/inventory', label: 'Inventory', icon: HiOutlineBeaker },
    { path: '/reports', label: 'Reports', icon: HiOutlineChartBar },
    ...(isAdmin ? [{ path: '/users', label: 'User Management', icon: HiOutlineUserGroup }] : []),
  ];

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Close mobile sidebar on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      {/* Mobile toggle button */}
      <button
        className="sidebar-mobile-toggle"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle sidebar"
      >
        {mobileOpen ? <HiOutlineXMark /> : <HiOutlineBars3 />}
      </button>

      {/* Overlay for mobile */}
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''} ${collapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <HiOutlineBeaker className="sidebar-logo-icon" />
          </div>
          {!collapsed && (
            <div className="sidebar-brand-text">
              <h1>LabPortal</h1>
              <span>Laboratory Management</span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="sidebar-divider" />

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
              }
            >
              <item.icon className="sidebar-link-icon" />
              {!collapsed && <span className="sidebar-link-label">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="sidebar-footer">
          <div className="sidebar-divider" />
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            {!collapsed && (
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">{user?.username || 'User'}</span>
                <span className={`badge ${isAdmin ? 'badge-accent' : 'badge-purple'}`}>
                  {user?.role || 'user'}
                </span>
              </div>
            )}
          </div>
          <button className="sidebar-logout" onClick={logout} title="Logout">
            <HiOutlineArrowRightOnRectangle />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <style>{`
        .sidebar-mobile-toggle {
          display: none;
          position: fixed;
          top: 18px;
          left: 16px;
          z-index: 1100;
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          color: var(--text-primary);
          font-size: 1.3rem;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: var(--transition);
        }

        .sidebar-mobile-toggle:hover {
          border-color: var(--accent-primary);
          color: var(--accent-primary);
        }

        .sidebar-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 998;
        }

        .sidebar {
          position: fixed;
          top: 0;
          left: 0;
          width: var(--sidebar-width);
          height: 100vh;
          background: linear-gradient(180deg, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.98));
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-right: 1px solid var(--glass-border);
          display: flex;
          flex-direction: column;
          z-index: 999;
          transition: var(--transition);
          overflow-y: auto;
          overflow-x: hidden;
        }

        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 24px 20px 16px;
        }

        .sidebar-logo {
          width: 42px;
          height: 42px;
          background: var(--accent-gradient);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 15px rgba(6, 182, 212, 0.3);
        }

        .sidebar-logo-icon {
          font-size: 1.3rem;
          color: #fff;
        }

        .sidebar-brand-text h1 {
          font-size: 1.25rem;
          font-weight: 700;
          background: var(--accent-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1.2;
        }

        .sidebar-brand-text span {
          font-size: 0.7rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .sidebar-divider {
          height: 1px;
          background: var(--border);
          margin: 4px 20px 8px;
        }

        .sidebar-nav {
          flex: 1;
          padding: 8px 12px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px 16px;
          border-radius: 10px;
          color: var(--text-secondary);
          font-size: 0.9rem;
          font-weight: 500;
          transition: var(--transition);
          position: relative;
          overflow: hidden;
        }

        .sidebar-link::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 0;
          background: var(--accent-gradient);
          border-radius: 0 4px 4px 0;
          transition: var(--transition);
        }

        .sidebar-link:hover {
          color: var(--text-primary);
          background: rgba(6, 182, 212, 0.05);
        }

        .sidebar-link-active {
          color: var(--accent-primary) !important;
          background: rgba(6, 182, 212, 0.08) !important;
        }

        .sidebar-link-active::before {
          height: 60%;
        }

        .sidebar-link-icon {
          font-size: 1.25rem;
          flex-shrink: 0;
        }

        .sidebar-link-label {
          white-space: nowrap;
        }

        .sidebar-footer {
          margin-top: auto;
          padding-bottom: 16px;
        }

        .sidebar-user {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 20px 8px;
        }

        .sidebar-user-avatar {
          width: 36px;
          height: 36px;
          background: var(--accent-gradient);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.9rem;
          font-weight: 700;
          color: #fff;
          flex-shrink: 0;
        }

        .sidebar-user-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow: hidden;
        }

        .sidebar-user-name {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sidebar-logout {
          display: flex;
          align-items: center;
          gap: 10px;
          width: calc(100% - 24px);
          margin: 4px 12px;
          padding: 10px 16px;
          border-radius: 10px;
          background: transparent;
          border: 1px solid transparent;
          color: var(--text-muted);
          font-size: 0.85rem;
          cursor: pointer;
          transition: var(--transition);
        }

        .sidebar-logout:hover {
          color: var(--danger);
          background: rgba(239, 68, 68, 0.08);
          border-color: rgba(239, 68, 68, 0.2);
        }

        .sidebar-logout svg {
          font-size: 1.2rem;
        }

        @media (max-width: 1024px) {
          .sidebar {
            transform: translateX(-100%);
          }

          .sidebar-open {
            transform: translateX(0);
          }

          .sidebar-mobile-toggle {
            display: flex;
          }

          .sidebar-overlay {
            display: block;
          }
        }
      `}</style>
    </>
  );
}
