import { useState, useEffect, useCallback } from 'react';
import { projectsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import {
  HiOutlinePlus,
  HiOutlineExclamationTriangle,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';

const TYPE_OPTIONS = [
  'Research',
  'Development',
  'Consultancy',
  'Sponsored',
  'Internal',
  'Collaborative',
];

const STATUS_OPTIONS = ['Active', 'Completed', 'On Hold'];
const REPORT_STATUS_OPTIONS = ['Pending', 'Submitted', 'Approved', 'Overdue'];

const emptyForm = {
  project_name: '',
  project_code: '',
  type_of_project: '',
  funding_source: '',
  date_of_start: '',
  date_of_closing: '',
  status: 'Ongoing',
  report_status: 'Pending',
};

export default function Projects() {
  const { isAdmin } = useAuth();
  const [data, setData] = useState([]);
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
      const res = await projectsAPI.getAll();
      setData(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const statusColor = (status) => {
    switch (status) {
      case 'Ongoing': return 'badge-info';
      case 'Completed': return 'badge-success';
      case 'Approved': return 'badge-accent';
      case 'Pending': return 'badge-warning';
      case 'Cancelled': return 'badge-danger';
      default: return 'badge-info';
    }
  };

  const reportStatusColor = (status) => {
    switch (status) {
      case 'Submitted': return 'badge-success';
      case 'Pending': return 'badge-warning';
      case 'Overdue': return 'badge-danger';
      case 'Not Required': return 'badge-info';
      default: return 'badge-info';
    }
  };

  const columns = [
    { key: 'project_name', label: 'Project Name' },
    { key: 'project_code', label: 'Code' },
    { key: 'type_of_project', label: 'Type' },
    { key: 'funding_source', label: 'Funding Source' },
    {
      key: 'date_of_start',
      label: 'Start Date',
      render: (val) => val ? new Date(val).toLocaleDateString() : '—',
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <span className={`badge ${statusColor(val)}`}>{val || '—'}</span>,
    },
    {
      key: 'report_status',
      label: 'Report Status',
      render: (val) => <span className={`badge ${reportStatusColor(val)}`}>{val || '—'}</span>,
    },
  ];

  const validate = () => {
    const errs = {};
    if (!form.project_name.trim()) errs.project_name = 'Project name is required';
    if (!form.project_code.trim()) errs.project_code = 'Project code is required';
    if (!form.type_of_project) errs.type_of_project = 'Type is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleOpen = (item = null) => {
    if (item) {
      setSelected(item);
      setForm({
        project_name: item.project_name || '',
        project_code: item.project_code || '',
        type_of_project: item.type_of_project || '',
        funding_source: item.funding_source || '',
        date_of_start: item.date_of_start ? item.date_of_start.substring(0, 10) : '',
        date_of_closing: item.date_of_closing ? item.date_of_closing.substring(0, 10) : '',
        status: item.status || 'Ongoing',
        report_status: item.report_status || 'Pending',
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
      if (!payload.date_of_closing) delete payload.date_of_closing;

      if (selected) {
        await projectsAPI.update(selected._id || selected.id, payload);
        toast.success('Project updated successfully');
      } else {
        await projectsAPI.create(payload);
        toast.success('Project added successfully');
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
      await projectsAPI.delete(selected._id || selected.id);
      toast.success('Project deleted successfully');
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
          <h1>Projects</h1>
          <p>Track and manage research projects</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => handleOpen()}>
            <HiOutlinePlus /> Add Project
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
      <Modal isOpen={modalOpen} onClose={handleClose} title={selected ? 'Edit Project' : 'Add New Project'} size="lg">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Project Name *</label>
            <input className="form-input" name="project_name" value={form.project_name} onChange={handleChange} placeholder="Enter project name" />
            {errors.project_name && <span className="form-error">{errors.project_name}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Project Code *</label>
              <input className="form-input" name="project_code" value={form.project_code} onChange={handleChange} placeholder="e.g., PRJ-001" />
              {errors.project_code && <span className="form-error">{errors.project_code}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Type of Project *</label>
              <select className="form-select" name="type_of_project" value={form.type_of_project} onChange={handleChange}>
                <option value="">Select type</option>
                {TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {errors.type_of_project && <span className="form-error">{errors.type_of_project}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Funding Source</label>
            <input className="form-input" name="funding_source" value={form.funding_source} onChange={handleChange} placeholder="e.g., DST, ICAR, Internal" />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input className="form-input" name="date_of_start" type="date" value={form.date_of_start} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Closing Date</label>
              <input className="form-input" name="date_of_closing" type="date" value={form.date_of_closing} onChange={handleChange} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" name="status" value={form.status} onChange={handleChange}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Report Status</label>
              <select className="form-select" name="report_status" value={form.report_status} onChange={handleChange}>
                {REPORT_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="modal-footer" style={{ padding: '20px 0 0', borderTop: '1px solid var(--border)', marginTop: 4 }}>
            <button type="button" className="btn btn-secondary" onClick={handleClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : selected ? 'Update' : 'Add Project'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={deleteModal} onClose={() => setDeleteModal(false)} title="Confirm Delete" size="sm">
        <div className="confirm-dialog">
          <div className="confirm-dialog-icon"><HiOutlineExclamationTriangle /></div>
          <h3>Delete Project</h3>
          <p>Are you sure you want to delete <strong>{selected?.project_name}</strong>? This action cannot be undone.</p>
          <div className="confirm-dialog-actions">
            <button className="btn btn-secondary" onClick={() => setDeleteModal(false)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
