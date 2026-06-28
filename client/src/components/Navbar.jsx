import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { HiOutlineArrowRightOnRectangle, HiOutlineSun, HiOutlineMoon, HiOutlineShieldCheck } from 'react-icons/hi2';
import Modal from './Modal';
import toast from 'react-hot-toast';

const pageTitles = {
  '/': 'Dashboard',
  '/people': 'People Management',
  '/projects': 'Project Management',
  '/publications': 'Publications',
  '/inventory': 'Inventory Management',
  '/reports': 'Reports & Analytics',
};

export default function Navbar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [show2FA, setShow2FA] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const title = pageTitles[location.pathname] || 'LabPortal';

  const handleSetup2FA = async () => {
    try {
      setShow2FA(true);
      setLoading(true);
      const { authAPI } = await import('../services/api');
      const res = await authAPI.setup2FA();
      setQrCode(res.data.qrCodeUrl);
      setSecret(res.data.secret);
    } catch (err) {
      toast.error('Failed to initiate 2FA setup');
    } finally {
      setLoading(false);
    }
  };

  const handleEnable2FA = async (e) => {
    e.preventDefault();
    if (!code || code.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    try {
      setLoading(true);
      const { authAPI } = await import('../services/api');
      await authAPI.enable2FA({ code });
      toast.success('Two-Factor Authentication enabled successfully!');
      setShow2FA(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <header className="navbar">
      <div className="navbar-left">
        <h2 className="navbar-title">{title}</h2>
      </div>

      <div className="navbar-right">
        <button 
          className="theme-toggle" 
          onClick={toggleTheme}
          title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === 'dark' ? <HiOutlineSun style={{ color: '#facc15' }} /> : <HiOutlineMoon style={{ color: '#334155' }} />}
        </button>

        <div className="navbar-user">
          <div className="navbar-avatar">
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="navbar-user-details">
            <span className="navbar-user-name">{user?.username || 'User'}</span>
            <span className="navbar-user-role">{user?.role || 'user'}</span>
          </div>
          <button 
            className="navbar-logout-btn" 
            onClick={handleSetup2FA} 
            title="Setup 2FA Security"
            style={{ color: 'var(--success)' }}
          >
            <HiOutlineShieldCheck />
          </button>
          <button className="navbar-logout-btn" onClick={logout} title="Logout">
            <HiOutlineArrowRightOnRectangle />
          </button>
        </div>
      </div>

      <style>{`
        .navbar {
          position: fixed;
          top: 0;
          left: var(--sidebar-width);
          right: 0;
          height: var(--navbar-height);
          background: var(--glass-bg);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--glass-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px;
          z-index: 900;
          transition: var(--transition);
        }

        .navbar-title {
          font-size: 1.2rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .navbar-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .theme-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          color: var(--text-primary);
          font-size: 1.25rem;
          cursor: pointer;
          transition: var(--transition);
        }
        
        .theme-toggle:hover {
          border-color: var(--accent-primary);
          color: var(--accent-primary);
        }

        .navbar-user {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 6px 8px 6px 6px;
          border-radius: 12px;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
        }

        .navbar-avatar {
          width: 34px;
          height: 34px;
          background: var(--accent-gradient);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.85rem;
          font-weight: 700;
          color: #fff;
        }

        .navbar-user-details {
          display: flex;
          flex-direction: column;
        }

        .navbar-user-name {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-primary);
          line-height: 1.2;
        }

        .navbar-user-role {
          font-size: 0.7rem;
          color: var(--text-muted);
          text-transform: capitalize;
        }

        .navbar-logout-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 1.15rem;
          cursor: pointer;
          transition: var(--transition);
        }

        .navbar-logout-btn:hover {
          color: var(--danger);
          background: rgba(239, 68, 68, 0.1);
        }

        @media (max-width: 1024px) {
          .navbar {
            left: 0;
            padding: 0 16px 0 64px;
          }
        }

        @media (max-width: 480px) {
          .navbar-user-details {
            display: none;
          }
        }
      `}</style>
    </header>

    {show2FA && createPortal(
      <Modal isOpen={show2FA} onClose={() => setShow2FA(false)} title="Two-Factor Authentication Setup">
        <div style={{ textAlign: 'center', padding: '20px 10px' }}>
          <p style={{ marginBottom: '24px', color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>
            Scan the QR code below with your authenticator app (e.g., Google Authenticator, Authy) to link your account.
          </p>
          
          {qrCode ? (
            <div style={{ background: 'white', padding: '16px', borderRadius: '16px', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', marginBottom: '24px', boxShadow: '0 8px 30px rgba(0,0,0,0.2)' }}>
              <img src={qrCode} alt="2FA QR Code" style={{ width: '180px', height: '180px', display: 'block' }} />
            </div>
          ) : (
            <div className="spinner" style={{ margin: '0 auto 30px', width: '40px', height: '40px', borderWidth: '3px' }}></div>
          )}
          
          <form onSubmit={handleEnable2FA} style={{ maxWidth: '280px', margin: '0 auto' }}>
            <div style={{ marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength="6"
                style={{ 
                  width: '100%', 
                  padding: '14px', 
                  background: 'rgba(15, 23, 42, 0.6)', 
                  border: '1px solid var(--border)', 
                  borderRadius: '12px', 
                  color: 'white',
                  textAlign: 'center', 
                  letterSpacing: '8px', 
                  fontSize: '1.5rem',
                  fontFamily: 'monospace',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading || !qrCode}
              style={{ width: '100%', padding: '14px', fontSize: '1rem', fontWeight: '600' }}
            >
              {loading ? 'Verifying...' : 'Verify & Enable 2FA'}
            </button>
          </form>
        </div>
      </Modal>,
      document.body
    )}
    </>
  );
}
