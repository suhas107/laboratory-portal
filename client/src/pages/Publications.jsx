import { useState, useEffect, useCallback } from 'react';
import { publicationsAPI, projectsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import {
  HiOutlinePlus,
  HiOutlineExclamationTriangle,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';

const emptyForm = {
  title: '',
  project_id: '',
  year: '',
  journal: '',
  naas_score: '',
  authors: '',
};

export default function Publications() {
  const { isAdmin } = useAuth();
  const [data, setData] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [pubRes, projRes] = await Promise.all([
        publicationsAPI.getAll(),
        projectsAPI.getAll(),
      ]);
      setData(Array.isArray(pubRes.data) ? pubRes.data : pubRes.data.data || []);
      setProjects(Array.isArray(projRes.data) ? projRes.data : projRes.data.data || []);
    } catch {
      toast.error('Failed to load publications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getProjectName = (projectId) => {
    if (!projectId) return '—';
    const proj = projects.find((p) => (p._id || p.id) === projectId);
    return proj ? proj.project_name : projectId;
  };

  const columns = [
    { key: 'title', label: 'Title' },
    {
      key: 'project_id',
      label: 'Project',
      render: (val) => getProjectName(val),
    },
    { key: 'year', label: 'Year' },
    { key: 'journal', label: 'Journal' },
    {
      key: 'naas_score',
      label: 'NAAS Score',
      render: (val) => val != null ? (
        <span className={`badge ${parseFloat(val) >= 6 ? 'badge-success' : 'badge-info'}`}>
          {val}
        </span>
      ) : '—',
    },
    {
      key: 'authors',
      label: 'Authors',
      render: (val) => val ? (
        <span style={{ maxWidth: 200, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={val}>
          {val}
        </span>
      ) : '—',
    },
  ];

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.year) errs.year = 'Year is required';
    else if (isNaN(form.year) || form.year < 1900 || form.year > 2100) errs.year = 'Invalid year';
    if (form.naas_score && isNaN(form.naas_score)) errs.naas_score = 'Must be a number';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleOpen = (item = null) => {
    if (item) {
      setSelected(item);
      setForm({
        title: item.title || '',
        project_id: item.project_id || '',
        year: item.year || '',
        journal: item.journal || '',
        naas_score: item.naas_score ?? '',
        authors: item.authors || '',
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
      const payload = {
        ...form,
        year: parseInt(form.year, 10),
        naas_score: form.naas_score ? parseFloat(form.naas_score) : undefined,
      };
      if (!payload.project_id) delete payload.project_id;

      if (selected) {
        await publicationsAPI.update(selected._id || selected.id, payload);
        toast.success('Publication updated successfully');
      } else {
        await publicationsAPI.create(payload);
        toast.success('Publication added successfully');
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
      await publicationsAPI.delete(selected._id || selected.id);
      toast.success('Publication deleted successfully');
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
          <h1>Publications</h1>
          <p>Manage research publications and papers</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => handleOpen()}>
            <HiOutlinePlus /> Add Publication
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={data}
        onEdit={isAdmin ? handleOpen : undefined}
        onDelete={isAdmin ? handleDeleteClick : undefined}
        loading={loading}
      />

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={handleClose} title={selected ? 'Edit Publication' : 'Add New Publication'} size="lg">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" name="title" value={form.title} onChange={handleChange} placeholder="Publication title" />
            {errors.title && <span className="form-error">{errors.title}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Project</label>
              <select className="form-select" name="project_id" value={form.project_id} onChange={handleChange}>
                <option value="">Select project (optional)</option>
                {projects.map((p) => (
                  <option key={p._id || p.id} value={p._id || p.id}>{p.project_name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Year *</label>
              <input className="form-input" name="year" type="number" value={form.year} onChange={handleChange} placeholder="e.g., 2025" min="1900" max="2100" />
              {errors.year && <span className="form-error">{errors.year}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Journal</label>
              <input className="form-input" name="journal" value={form.journal} onChange={handleChange} placeholder="Journal name" />
            </div>
            <div className="form-group">
              <label className="form-label">NAAS Score</label>
              <input className="form-input" name="naas_score" type="number" step="0.01" value={form.naas_score} onChange={handleChange} placeholder="e.g., 6.5" />
              {errors.naas_score && <span className="form-error">{errors.naas_score}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Authors</label>
            <input className="form-input" name="authors" value={form.authors} onChange={handleChange} placeholder="Author names (comma separated)" />
          </div>

          <div className="modal-footer" style={{ padding: '20px 0 0', borderTop: '1px solid var(--border)', marginTop: 4 }}>
            <button type="button" className="btn btn-secondary" onClick={handleClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : selected ? 'Update' : 'Add Publication'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={deleteModal} onClose={() => setDeleteModal(false)} title="Confirm Delete" size="sm">
        <div className="confirm-dialog">
          <div className="confirm-dialog-icon"><HiOutlineExclamationTriangle /></div>
          <h3>Delete Publication</h3>
          <p>Are you sure you want to delete <strong>{selected?.title}</strong>? This action cannot be undone.</p>
          <div className="confirm-dialog-actions">
            <button className="btn btn-secondary" onClick={() => setDeleteModal(false)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
