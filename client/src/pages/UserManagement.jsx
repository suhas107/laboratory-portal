import { useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  HiOutlineUserGroup, 
  HiOutlineCheck, 
  HiOutlineXMark, 
  HiOutlineTrash,
  HiOutlineShieldCheck
} from 'react-icons/hi2';

export default function UserManagement() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authAPI.getUsers();
      setUsers(res.data);
    } catch (err) {
      toast.error('Failed to fetch users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [fetchUsers, isAdmin]);

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleApprove = async (id) => {
    try {
      await authAPI.approveUser(id);
      toast.success('User approved successfully');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to approve user');
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Are you sure you want to reject and delete this request?')) return;
    try {
      await authAPI.rejectUser(id);
      toast.success('User request rejected');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reject user');
    }
  };

  const handleDelete = async (id, username) => {
    if (!window.confirm(`Are you sure you want to delete user ${username}?`)) return;
    try {
      await authAPI.rejectUser(id); // rejectUser endpoint deletes the user
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete user');
    }
  };

  const pendingUsers = users.filter(u => u.is_approved === 0);
  const activeUsers = users.filter(u => u.is_approved === 1);

  if (loading) {
    return (
      <div className="page-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <HiOutlineUserGroup />
            User Management
          </h1>
          <p className="page-subtitle">Manage access requests and active users</p>
        </div>
      </div>

      <div className="users-grid">
        {/* Pending Approvals */}
        <div className="users-section">
          <div className="section-header">
            <h2>Pending Approval</h2>
            <span className="badge badge-warning">{pendingUsers.length}</span>
          </div>
          
          {pendingUsers.length === 0 ? (
            <div className="empty-state card glass-card">
              <p>No pending requests.</p>
            </div>
          ) : (
            <div className="users-list">
              {pendingUsers.map(user => (
                <div key={user.id} className="user-card card glass-card pending-card">
                  <div className="user-info">
                    <div className="user-avatar">{user.username.charAt(0).toUpperCase()}</div>
                    <div className="user-details">
                      <h3>{user.full_name}</h3>
                      <p>@{user.username}</p>
                    </div>
                  </div>
                  <div className="user-actions">
                    <button 
                      className="btn-icon approve-btn" 
                      onClick={() => handleApprove(user.id)}
                      title="Approve User"
                    >
                      <HiOutlineCheck /> Approve
                    </button>
                    <button 
                      className="btn-icon reject-btn" 
                      onClick={() => handleReject(user.id)}
                      title="Reject User"
                    >
                      <HiOutlineXMark /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Users */}
        <div className="users-section">
          <div className="section-header">
            <h2>Active Users</h2>
            <span className="badge badge-success">{activeUsers.length}</span>
          </div>

          <div className="users-list">
            {activeUsers.map(user => (
              <div key={user.id} className="user-card card glass-card">
                <div className="user-info">
                  <div className={`user-avatar ${user.role === 'admin' ? 'admin-avatar' : ''}`}>
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="user-details">
                    <h3>{user.full_name}</h3>
                    <p>@{user.username}</p>
                  </div>
                  <div className="user-badges">
                    <span className={`badge ${user.role === 'admin' ? 'badge-primary' : 'badge-secondary'}`}>
                      {user.role}
                    </span>
                    {user.two_factor_enabled === 1 && (
                      <span className="badge badge-success" title="2FA Enabled">
                        <HiOutlineShieldCheck /> 2FA
                      </span>
                    )}
                  </div>
                </div>
                <div className="user-actions">
                  {user.role !== 'admin' && (
                    <button 
                      className="btn-icon delete-btn" 
                      onClick={() => handleDelete(user.id, user.username)}
                      title="Delete User"
                    >
                      <HiOutlineTrash />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .users-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }

        @media (min-width: 1024px) {
          .users-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .section-header h2 {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .users-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .user-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          transition: transform 0.2s;
        }
        
        .user-card:hover {
          transform: translateY(-2px);
        }

        .pending-card {
          border-left: 4px solid var(--warning);
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .user-avatar {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: var(--bg-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
          border: 1px solid var(--border);
        }

        .admin-avatar {
          background: var(--accent-primary);
          color: white;
          border-color: transparent;
        }

        .user-details h3 {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 4px;
        }

        .user-details p {
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .user-badges {
          display: flex;
          gap: 8px;
          margin-left: 16px;
        }

        .badge {
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .badge-primary { background: rgba(6, 182, 212, 0.1); color: var(--accent-primary); border: 1px solid rgba(6, 182, 212, 0.2); }
        .badge-secondary { background: var(--bg-secondary); color: var(--text-secondary); border: 1px solid var(--border); }
        .badge-success { background: rgba(16, 185, 129, 0.1); color: var(--success); border: 1px solid rgba(16, 185, 129, 0.2); }
        .badge-warning { background: rgba(245, 158, 11, 0.1); color: var(--warning); border: 1px solid rgba(245, 158, 11, 0.2); }

        .user-actions {
          display: flex;
          gap: 8px;
        }

        .btn-icon {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }

        .approve-btn {
          background: rgba(16, 185, 129, 0.1);
          color: var(--success);
        }
        .approve-btn:hover { background: var(--success); color: white; }

        .reject-btn {
          background: rgba(239, 68, 68, 0.1);
          color: var(--danger);
        }
        .reject-btn:hover { background: var(--danger); color: white; }

        .delete-btn {
          background: transparent;
          color: var(--text-muted);
          padding: 8px;
          font-size: 1.25rem;
        }
        .delete-btn:hover { color: var(--danger); background: rgba(239, 68, 68, 0.1); }

        .empty-state {
          padding: 40px;
          text-align: center;
          color: var(--text-muted);
          font-style: italic;
        }
      `}</style>
    </div>
  );
}
