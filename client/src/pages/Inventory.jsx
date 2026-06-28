import { useState, useEffect, useCallback } from 'react';
import { inventoryAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import {
  HiOutlinePlus,
  HiOutlineExclamationTriangle,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';

const INVENTORY_CLASSES = [
  'Permanent Equipment',
  'Semi-Permanent',
  'Chemicals',
  'Glassware',
  'Plastic Ware',
  'Miscellaneous',
];

const emptyForm = {
  item_name: '',
  inventory_class: '',
  date_of_purchase: '',
  make: '',
  model: '',
  cat_no: '',
  qty: '',
  price: '',
  total_qty_in_stock: '',
};

export default function Inventory() {
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
      const res = await inventoryAPI.getAll();
      setData(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const columns = [
    { key: 'item_name', label: 'Item Name' },
    {
      key: 'inventory_class',
      label: 'Class',
      render: (val) => val ? <span className="badge badge-purple">{val}</span> : '—',
    },
    { key: 'make', label: 'Make' },
    { key: 'model', label: 'Model' },
    { key: 'cat_no', label: 'Cat No' },
    { key: 'qty', label: 'Qty' },
    {
      key: 'price',
      label: 'Price',
      render: (val) => val != null ? `₹${Number(val).toLocaleString()}` : '—',
    },
    {
      key: 'total_qty_in_stock',
      label: 'Stock',
      render: (val) => {
        const num = Number(val);
        if (isNaN(num)) return '—';
        return (
          <span className={`badge ${num < 5 ? 'badge-warning' : 'badge-success'}`}>
            {num}
          </span>
        );
      },
    },
  ];

  const validate = () => {
    const errs = {};
    if (!form.item_name.trim()) errs.item_name = 'Item name is required';
    if (!form.inventory_class) errs.inventory_class = 'Class is required';
    if (form.qty && isNaN(form.qty)) errs.qty = 'Must be a number';
    if (form.price && isNaN(form.price)) errs.price = 'Must be a number';
    if (form.total_qty_in_stock && isNaN(form.total_qty_in_stock)) errs.total_qty_in_stock = 'Must be a number';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleOpen = (item = null) => {
    if (item) {
      setSelected(item);
      setForm({
        item_name: item.item_name || '',
        inventory_class: item.inventory_class || '',
        date_of_purchase: item.date_of_purchase ? item.date_of_purchase.substring(0, 10) : '',
        make: item.make || '',
        model: item.model || '',
        cat_no: item.cat_no || '',
        qty: item.qty ?? '',
        price: item.price ?? '',
        total_qty_in_stock: item.total_qty_in_stock ?? '',
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
        qty: form.qty ? parseInt(form.qty, 10) : undefined,
        price: form.price ? parseFloat(form.price) : undefined,
        total_qty_in_stock: form.total_qty_in_stock ? parseInt(form.total_qty_in_stock, 10) : undefined,
      };

      if (selected) {
        await inventoryAPI.update(selected._id || selected.id, payload);
        toast.success('Item updated successfully');
      } else {
        await inventoryAPI.create(payload);
        toast.success('Item added successfully');
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
      await inventoryAPI.delete(selected._id || selected.id);
      toast.success('Item deleted successfully');
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
          <h1>Inventory</h1>
          <p>Track laboratory equipment and consumables</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => handleOpen()}>
            <HiOutlinePlus /> Add Item
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
      <Modal isOpen={modalOpen} onClose={handleClose} title={selected ? 'Edit Item' : 'Add New Item'} size="lg">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Item Name *</label>
              <input className="form-input" name="item_name" value={form.item_name} onChange={handleChange} placeholder="Item name" />
              {errors.item_name && <span className="form-error">{errors.item_name}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Inventory Class *</label>
              <select className="form-select" name="inventory_class" value={form.inventory_class} onChange={handleChange}>
                <option value="">Select class</option>
                {INVENTORY_CLASSES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {errors.inventory_class && <span className="form-error">{errors.inventory_class}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Date of Purchase</label>
            <input className="form-input" name="date_of_purchase" type="date" value={form.date_of_purchase} onChange={handleChange} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Make</label>
              <input className="form-input" name="make" value={form.make} onChange={handleChange} placeholder="Manufacturer" />
            </div>
            <div className="form-group">
              <label className="form-label">Model</label>
              <input className="form-input" name="model" value={form.model} onChange={handleChange} placeholder="Model number" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Catalogue No.</label>
              <input className="form-input" name="cat_no" value={form.cat_no} onChange={handleChange} placeholder="Catalogue number" />
            </div>
            <div className="form-group">
              <label className="form-label">Quantity</label>
              <input className="form-input" name="qty" type="number" value={form.qty} onChange={handleChange} placeholder="0" min="0" />
              {errors.qty && <span className="form-error">{errors.qty}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Price (₹)</label>
              <input className="form-input" name="price" type="number" step="0.01" value={form.price} onChange={handleChange} placeholder="0.00" min="0" />
              {errors.price && <span className="form-error">{errors.price}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Total Qty in Stock</label>
              <input className="form-input" name="total_qty_in_stock" type="number" value={form.total_qty_in_stock} onChange={handleChange} placeholder="0" min="0" />
              {errors.total_qty_in_stock && <span className="form-error">{errors.total_qty_in_stock}</span>}
            </div>
          </div>

          <div className="modal-footer" style={{ padding: '20px 0 0', borderTop: '1px solid var(--border)', marginTop: 4 }}>
            <button type="button" className="btn btn-secondary" onClick={handleClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : selected ? 'Update' : 'Add Item'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={deleteModal} onClose={() => setDeleteModal(false)} title="Confirm Delete" size="sm">
        <div className="confirm-dialog">
          <div className="confirm-dialog-icon"><HiOutlineExclamationTriangle /></div>
          <h3>Delete Item</h3>
          <p>Are you sure you want to delete <strong>{selected?.item_name}</strong>? This action cannot be undone.</p>
          <div className="confirm-dialog-actions">
            <button className="btn btn-secondary" onClick={() => setDeleteModal(false)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
