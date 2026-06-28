import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { HiOutlineUser, HiOutlineLockClosed, HiOutlineIdentification, HiOutlineEye, HiOutlineEyeSlash } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authAPI.signup(form);
      setSuccess(true);
      toast.success('Registration submitted successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="login-container">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="login-card" style={{ textAlign: 'center', padding: '40px 30px' }}>
          <div className="login-header">
            <h2>Registration Successful</h2>
            <p>Your account has been created and is pending admin approval.</p>
          </div>
          <div style={{ marginTop: '20px' }}>
            <Link to="/login" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-block', width: '100%', boxSizing: 'border-box' }}>
              Back to Login
            </Link>
          </div>
        </div>
        <style>{`
          .login-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #020617;
            position: relative;
            overflow: hidden;
            padding: 20px;
          }
          .orb {
            position: absolute;
            border-radius: 50%;
            filter: blur(80px);
            opacity: 0.5;
            animation: float 10s infinite ease-in-out alternate;
            z-index: 0;
          }
          .orb-1 {
            width: 400px;
            height: 400px;
            background: var(--accent-primary);
            top: -100px;
            left: -100px;
          }
          .orb-2 {
            width: 300px;
            height: 300px;
            background: #8b5cf6;
            bottom: -50px;
            right: -50px;
            animation-delay: -5s;
          }
          .login-card {
            background: rgba(15, 23, 42, 0.7);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 24px;
            padding: 40px 32px;
            width: 100%;
            max-width: 420px;
            z-index: 1;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          }
          .login-header {
            margin-bottom: 32px;
          }
          .login-header h2 {
            font-size: 1.75rem;
            font-weight: 700;
            color: #fff;
            margin-bottom: 8px;
            background: linear-gradient(135deg, #fff 0%, #94a3b8 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          .login-header p {
            color: #94a3b8;
            font-size: 0.95rem;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      
      <div className="login-card">
        <div className="login-header">
          <h2>Request Access</h2>
          <p>Register for the LabPortal</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Full Name</label>
            <div className="input-with-icon">
              <HiOutlineIdentification className="input-icon" />
              <input
                type="text"
                className="form-input"
                placeholder="Dr. Jane Doe"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Username</label>
            <div className="input-with-icon">
              <HiOutlineUser className="input-icon" />
              <input
                type="text"
                className="form-input"
                placeholder="Enter a username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-with-icon">
              <HiOutlineLockClosed className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                className="form-input"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
              />
              <button 
                type="button" 
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? <HiOutlineEyeSlash /> : <HiOutlineEye />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary login-btn"
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Register'}
          </button>
        </form>

        <div className="login-footer">
          <span>Already have an account? <Link to="/login" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600 }}>Login here</Link></span>
        </div>
      </div>

      <style>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #020617;
          position: relative;
          overflow: hidden;
          padding: 20px;
        }

        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.5;
          animation: float 10s infinite ease-in-out alternate;
          z-index: 0;
        }

        .orb-1 {
          width: 400px;
          height: 400px;
          background: var(--accent-primary);
          top: -100px;
          left: -100px;
        }

        .orb-2 {
          width: 300px;
          height: 300px;
          background: #8b5cf6;
          bottom: -50px;
          right: -50px;
          animation-delay: -5s;
        }

        @keyframes float {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(30px, 30px) scale(1.1); }
        }

        .login-card {
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          padding: 40px 32px;
          width: 100%;
          max-width: 420px;
          z-index: 1;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .login-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .login-header h2 {
          font-size: 1.75rem;
          font-weight: 700;
          color: #fff;
          margin-bottom: 8px;
          background: linear-gradient(135deg, #fff 0%, #94a3b8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .login-header p {
          color: #94a3b8;
          font-size: 0.95rem;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          font-size: 0.85rem;
          font-weight: 500;
          color: #cbd5e1;
          margin-left: 4px;
        }

        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 16px;
          font-size: 1.25rem;
          color: #64748b;
          pointer-events: none;
        }

        .form-input {
          width: 100%;
          padding: 12px 16px 12px 48px;
          background: rgba(2, 6, 23, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: #f8fafc;
          font-size: 0.95rem;
          transition: all 0.2s ease;
        }

        .form-input:focus {
          outline: none;
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.15);
        }

        .form-input::placeholder {
          color: #475569;
        }

        .password-toggle {
          position: absolute;
          right: 16px;
          background: none;
          border: none;
          color: #64748b;
          font-size: 1.25rem;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
          transition: color 0.2s;
        }

        .password-toggle:hover {
          color: #cbd5e1;
        }

        .login-btn {
          margin-top: 8px;
          padding: 14px;
          font-size: 1rem;
          font-weight: 600;
          border-radius: 12px;
          letter-spacing: 0.5px;
          position: relative;
          overflow: hidden;
        }

        .login-btn::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 100%);
          pointer-events: none;
        }

        .login-footer {
          margin-top: 24px;
          text-align: center;
          font-size: 0.85rem;
          color: #64748b;
        }
      `}</style>
    </div>
  );
}
