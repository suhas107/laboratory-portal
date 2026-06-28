import { useState, useEffect, useCallback } from 'react';
import { peopleAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import {
  HiOutlinePlus,
  HiOutlineExclamationTriangle,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'Lab Admin',
  'Scientist',
  'Technician',
  'Post Doc',
  'RA',
  'SRF',
  'JRF',
  'Project Assistant',
  'PhD Student',
  'MSc Student',
];

const STATUS_OPTIONS = ['Active', 'Relieved'];

const emptyForm = {
  name: '',
  category: '',
  email: '',
  phone: '',
  date_of_joining: '',
  date_of_relieving: '',
  status: 'Active',
};

export default function People() {
  const { isAdmin } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = filterCategory ? { category: filterCategory } : {};
      const res = await peopleAPI.getAll(params);
      setData(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch {
      toast.error('Failed to load people');
    } finally {
      setLoading(false);
    }
  }, [filterCategory]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'category', label: 'Category' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    {
      key: 'date_of_joining',
      label: 'Date of Joining',
      render: (val) => val ? new Date(val).toLocaleDateString() : '—',
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => (
        <span className={`badge ${val === 'Active' ? 'badge-success' : 'badge-danger'}`}>
          {val || '—'}
        </span>
      ),
    },
  ];

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.category) errs.category = 'Category is required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Invalid email format';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleOpen = (item = null) => {
    if (item) {
      setSelected(item);
      setForm({
        name: item.name || '',
        category: item.category || '',
        email: item.email || '',
        phone: item.phone || '',
        date_of_joining: item.date_of_joining ? item.date_of_joining.substring(0, 10) : '',
        date_of_relieving: item.date_of_relieving ? item.date_of_relieving.substring(0, 10) : '',
        status: item.status || 'Active',
      });
    } else {
      setSelected(null);
      setForm({ ...emptyForm });
    }
    setErrors({});
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setSelected(null);
    setForm({ ...emptyForm });
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.date_of_relieving) delete payload.date_of_relieving;

      if (selected) {
        await peopleAPI.update(selected._id || selected.id, payload);
        toast.success('Person updated successfully');
      } else {
        await peopleAPI.create(payload);
        toast.success('Person added successfully');
      }
      handleClose();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (item) => {
    setSelected(item);
    setDeleteModal(true);
  };

  const handleDelete = async () => {
    try {
      await peopleAPI.delete(selected._id || selected.id);
      toast.success('Person deleted successfully');
      setDeleteModal(false);
      setSelected(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>People</h1>
          <p>Manage laboratory personnel and team members</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => handleOpen()}>
            <HiOutlinePlus /> Add Person
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div className="toolbar">
        <select
          className="form-select"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          style={{ maxWidth: 240 }}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={data}
        onEdit={isAdmin ? handleOpen : undefined}
        onDelete={isAdmin ? handleDeleteClick : undefined}
        loading={loading}
      />

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={handleClose} title={selected ? 'Edit Person' : 'Add New Person'} size="md">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Name *</label>
            <input className="form-input" name="name" value={form.name} onChange={handleChange} placeholder="Full name" />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select className="form-select" name="category" value={form.category} onChange={handleChange}>
                <option value="">Select category</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {errors.category && <span className="form-error">{errors.category}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" name="status" value={form.status} onChange={handleChange}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" name="email" type="email" value={form.email} onChange={handleChange} placeholder="email@example.com" />
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" name="phone" value={form.phone} onChange={handleChange} placeholder="Phone number" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Date of Joining</label>
              <input className="form-input" name="date_of_joining" type="date" value={form.date_of_joining} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Date of Relieving</label>
              <input className="form-input" name="date_of_relieving" type="date" value={form.date_of_relieving} onChange={handleChange} />
            </div>
          </div>

          <div className="modal-footer" style={{ padding: '20px 0 0', borderTop: '1px solid var(--border)', marginTop: 4 }}>
            <button type="button" className="btn btn-secondary" onClick={handleClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : selected ? 'Update' : 'Add Person'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={deleteModal} onClose={() => setDeleteModal(false)} title="Confirm Delete" size="sm">
        <div className="confirm-dialog">
          <div className="confirm-dialog-icon"><HiOutlineExclamationTriangle /></div>
          <h3>Delete Person</h3>
          <p>Are you sure you want to delete <strong>{selected?.name}</strong>? This action cannot be undone.</p>
          <div className="confirm-dialog-actions">
            <button className="btn btn-secondary" onClick={() => setDeleteModal(false)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
