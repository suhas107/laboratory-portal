import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiOutlineBeaker, HiOutlineEye, HiOutlineEyeSlash } from 'react-icons/hi2';
import toast from 'react-hot-toast';

export default function Login() {
  const { login, loginVerify } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '', code: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [shake, setShake] = useState(false);
  
  // 2FA states
  const [is2FA, setIs2FA] = useState(false);
  const [tempToken, setTempToken] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!is2FA) {
      if (!form.username.trim() || !form.password.trim()) {
        setError('Please enter both username and password');
        triggerShake();
        return;
      }

      setLoading(true);
      setError('');
      try {
        const result = await login(form.username, form.password);
        if (result && result.requires2FA) {
          setIs2FA(true);
          setTempToken(result.tempToken);
        } else {
          toast.success('Welcome back!');
          navigate('/');
        }
      } catch (err) {
        const msg = err.response?.data?.message || err.response?.data?.error || 'Invalid credentials. Please try again.';
        setError(msg);
        triggerShake();
      } finally {
        setLoading(false);
      }
    } else {
      if (!form.code.trim() || form.code.length !== 6) {
        setError('Please enter a valid 6-digit code');
        triggerShake();
        return;
      }
      
      setLoading(true);
      setError('');
      try {
        await loginVerify(tempToken, form.code);
        toast.success('Welcome back!');
        navigate('/');
      } catch (err) {
        const msg = err.response?.data?.message || err.response?.data?.error || 'Invalid 2FA code. Please try again.';
        setError(msg);
        triggerShake();
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="login-page">
      {/* Animated background orbs */}
      <div className="login-orb login-orb-1" />
      <div className="login-orb login-orb-2" />
      <div className="login-orb login-orb-3" />

      <div className={`login-card ${shake ? 'animate-shake' : ''}`}>
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">
            <HiOutlineBeaker />
          </div>
          <h1>LabPortal</h1>
          <p>{is2FA ? 'Two-Factor Authentication' : 'Laboratory Management System'}</p>
        </div>

        {/* Error */}
        {error && (
          <div className="login-error">
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          {!is2FA ? (
            <>
              <div className="login-field">
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Enter your username"
                  value={form.username}
                  onChange={handleChange}
                  autoComplete="username"
                  autoFocus
                />
              </div>

              <div className="login-field">
                <label htmlFor="password">Password</label>
                <div className="login-password-wrapper">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="login-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <HiOutlineEyeSlash /> : <HiOutlineEye />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="login-field" style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <label htmlFor="code">Authenticator Code</label>
              <input
                id="code"
                name="code"
                type="text"
                maxLength="6"
                placeholder="000000"
                value={form.code}
                onChange={handleChange}
                autoComplete="one-time-code"
                autoFocus
                style={{ fontSize: '1.5rem', letterSpacing: '8px', textAlign: 'center' }}
              />
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'center' }}>
                Enter the 6-digit code from your authenticator app.
              </p>
            </div>
          )}

          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? (
              <>
                <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                <span>{is2FA ? 'Verifying...' : 'Signing in...'}</span>
              </>
            ) : (
              <span>{is2FA ? 'Verify Code' : 'Sign In'}</span>
            )}
          </button>
        </form>

        <div className="login-footer">
          <span>Don't have an account? <Link to="/signup" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600 }}>Request Access</Link></span>
        </div>
      </div>

      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-primary);
          position: relative;
          overflow: hidden;
          padding: 20px;
        }

        .login-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.15;
          animation: float 8s ease-in-out infinite;
        }

        .login-orb-1 {
          width: 400px;
          height: 400px;
          background: #06b6d4;
          top: -100px;
          right: -100px;
          animation-delay: 0s;
        }

        .login-orb-2 {
          width: 350px;
          height: 350px;
          background: #8b5cf6;
          bottom: -80px;
          left: -80px;
          animation-delay: 2s;
        }

        .login-orb-3 {
          width: 250px;
          height: 250px;
          background: #06b6d4;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation-delay: 4s;
        }

        .login-card {
          width: 100%;
          max-width: 420px;
          background: rgba(30, 41, 59, 0.7);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid var(--glass-border);
          border-radius: 20px;
          padding: 40px 36px;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.4);
          position: relative;
          z-index: 10;
          animation: slideUp 0.6s ease-out;
        }

        .login-logo {
          text-align: center;
          margin-bottom: 32px;
        }

        .login-logo-icon {
          width: 56px;
          height: 56px;
          background: var(--accent-gradient);
          border-radius: 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 1.6rem;
          color: #fff;
          margin-bottom: 16px;
          box-shadow: 0 8px 25px rgba(6, 182, 212, 0.35);
        }

        .login-logo h1 {
          font-size: 1.8rem;
          font-weight: 700;
          background: var(--accent-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 4px;
        }

        .login-logo p {
          color: var(--text-muted);
          font-size: 0.85rem;
        }

        .login-error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.25);
          border-radius: 10px;
          padding: 12px 16px;
          margin-bottom: 20px;
          animation: fadeIn 0.3s ease-out;
        }

        .login-error span {
          color: var(--danger);
          font-size: 0.85rem;
          font-weight: 500;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .login-field label {
          display: block;
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--text-secondary);
          margin-bottom: 8px;
        }

        .login-field input {
          width: 100%;
          padding: 12px 16px;
          background: var(--bg-primary);
          border: 1px solid var(--border);
          border-radius: 10px;
          color: var(--text-primary);
          font-size: 0.9rem;
          transition: var(--transition);
        }

        .login-field input:focus {
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.12);
        }

        .login-field input::placeholder {
          color: var(--text-muted);
        }

        .login-password-wrapper {
          position: relative;
        }

        .login-password-wrapper input {
          padding-right: 44px;
        }

        .login-password-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--text-muted);
          font-size: 1.1rem;
          cursor: pointer;
          padding: 4px;
          transition: var(--transition);
          display: flex;
          align-items: center;
        }

        .login-password-toggle:hover {
          color: var(--accent-primary);
        }

        .login-submit {
          width: 100%;
          padding: 13px;
          background: var(--accent-gradient);
          border: none;
          border-radius: 10px;
          color: #fff;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 15px rgba(6, 182, 212, 0.3);
          margin-top: 4px;
        }

        .login-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(6, 182, 212, 0.4);
        }

        .login-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .login-footer {
          text-align: center;
          margin-top: 28px;
          padding-top: 20px;
          border-top: 1px solid var(--border);
        }

        .login-footer span {
          color: var(--text-muted);
          font-size: 0.75rem;
          letter-spacing: 0.02em;
        }
      `}</style>
    </div>
  );
}
