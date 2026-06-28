import React, { useState, useEffect, useCallback } from 'react';
import { HiOutlineArrowDownTray, HiOutlineDocumentText, HiOutlineFunnel, HiOutlineMagnifyingGlass } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import { peopleAPI, projectsAPI, publicationsAPI, inventoryAPI, reportsAPI } from '../services/api';
import DataTable from '../components/DataTable';

const FILTER_OPTIONS = {
  people: {
    category: ['All Categories', 'Lab Admin', 'Scientist', 'Technician', 'Post Doc', 'RA', 'SRF', 'JRF', 'Project Assistant', 'PhD Student', 'MSc Student'],
    status: ['All Status', 'Active', 'Relieved'],
  },
  projects: {
    status: ['All Status', 'Active', 'Completed', 'On Hold'],
    report_status: ['All Report Status', 'Pending', 'Submitted', 'Approved', 'Overdue'],
  },
  publications: {
    year: [], // dynamically populated
  },
  inventory: {
    inventory_class: ['All Classes', 'Permanent Equipment', 'Semi-Permanent', 'Chemicals', 'Glassware', 'Plastic Ware', 'Miscellaneous'],
  },
};

const Reports = () => {
  const [activeTab, setActiveTab] = useState('people');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});

  const resetFilters = useCallback(() => {
    setSearch('');
    setFilters({});
  }, []);

  useEffect(() => {
    resetFilters();
  }, [activeTab, resetFilters]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { search };
      // Add active filters to params
      Object.entries(filters).forEach(([key, value]) => {
        if (value && !value.startsWith('All')) {
          params[key] = value;
        }
      });

      let res;
      switch (activeTab) {
        case 'people':
          res = await peopleAPI.getAll(params);
          break;
        case 'projects':
          res = await projectsAPI.getAll(params);
          break;
        case 'publications':
          res = await publicationsAPI.getAll(params);
          break;
        case 'inventory':
          res = await inventoryAPI.getAll(params);
          break;
      }
      setData(res?.data?.data || res?.data || []);
    } catch (error) {
      toast.error(`Failed to load ${activeTab} data`);
    } finally {
      setLoading(false);
    }
  }, [activeTab, search, filters]);

  useEffect(() => {
    const debounce = setTimeout(() => loadData(), 300);
    return () => clearTimeout(debounce);
  }, [loadData]);

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const params = { search };
      Object.entries(filters).forEach(([key, value]) => {
        if (value && !value.startsWith('All')) params[key] = value;
      });
      const response = await reportsAPI.exportExcel(activeTab, params);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${activeTab}_report_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Excel report exported successfully!');
    } catch (error) {
      toast.error('Failed to export Excel report');
    } finally {
      setExporting(false);
    }
  };

  const handleExportWord = async () => {
    setExporting(true);
    try {
      const params = { search };
      Object.entries(filters).forEach(([key, value]) => {
        if (value && !value.startsWith('All')) params[key] = value;
      });
      const response = await reportsAPI.exportWord(activeTab, params);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${activeTab}_report_${new Date().toISOString().split('T')[0]}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Word report exported successfully!');
    } catch (error) {
      toast.error('Failed to export Word report');
    } finally {
      setExporting(false);
    }
  };

  const handleTestEmail = async () => {
    try {
      const { data } = await reportsAPI.triggerTestAlert();
      if (data.success && data.htmlContent) {
        toast.success('Test email generated! Opening preview...');
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.document.write(data.htmlContent);
          newWindow.document.close();
        } else {
          toast.error('Popup blocked! Please allow popups to see the email.');
        }
      } else {
        toast.error('Failed to send test email');
      }
    } catch (error) {
      toast.error('Error triggering test email');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Build columns per tab
  let columns = [];
  if (activeTab === 'people') {
    columns = [
      { key: 'name', label: 'Name' },
      { key: 'category', label: 'Category' },
      { key: 'email', label: 'Email' },
      { key: 'date_of_joining', label: 'Joined' },
      { key: 'status', label: 'Status' },
    ];
  } else if (activeTab === 'projects') {
    columns = [
      { key: 'project_name', label: 'Project Name' },
      { key: 'project_code', label: 'Code' },
      { key: 'type_of_project', label: 'Type' },
      { key: 'status', label: 'Status' },
      { key: 'report_status', label: 'Report Status' },
    ];
  } else if (activeTab === 'publications') {
    columns = [
      { key: 'title', label: 'Title' },
      { key: 'journal', label: 'Journal' },
      { key: 'year', label: 'Year' },
      { key: 'naas_score', label: 'NAAS Score' },
    ];
  } else if (activeTab === 'inventory') {
    columns = [
      { key: 'item_name', label: 'Item Name' },
      { key: 'inventory_class', label: 'Class' },
      { key: 'make', label: 'Make' },
      { key: 'qty', label: 'Qty' },
      { key: 'total_qty_in_stock', label: 'In Stock' },
    ];
  }

  // Get current filter options for active tab
  const currentFilters = FILTER_OPTIONS[activeTab] || {};
  const activeFilterCount = Object.values(filters).filter(v => v && !v.startsWith('All')).length;

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Analytics & Reports</h1>
          <p>Generate and export custom reports by resource class</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={handleTestEmail}
            className="btn btn-secondary"
            style={{ background: 'var(--info)', border: 'none', color: 'white' }}
          >
            ✉️ Test Alert Email
          </button>
          <button
            onClick={handleExportWord}
            disabled={exporting || data.length === 0}
            className="btn btn-secondary"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          >
            <HiOutlineDocumentText style={{ fontSize: '1.2rem' }} />
            Export to Word
          </button>
          <button
            onClick={handleExportExcel}
            disabled={exporting || data.length === 0}
            className="btn btn-primary"
          >
            <HiOutlineArrowDownTray style={{ fontSize: '1.2rem' }} />
            Export to Excel
          </button>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '24px' }}>
        {/* Resource Tabs */}
        <div className="reports-tabs">
          {['people', 'projects', 'publications', 'inventory'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`reports-tab-btn ${activeTab === tab ? 'active' : ''}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Filters Row */}
        <div className="reports-filters">
          <div className="search-input-wrapper">
            <HiOutlineMagnifyingGlass className="search-icon" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {Object.entries(currentFilters).map(([key, options]) => {
            if (options.length === 0) return null;
            return (
              <select
                key={key}
                value={filters[key] || options[0]}
                onChange={(e) => handleFilterChange(key, e.target.value)}
                className="reports-filter-select"
              >
                {options.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            );
          })}

          {activeFilterCount > 0 && (
            <button className="reports-clear-btn" onClick={resetFilters}>
              Clear Filters ({activeFilterCount})
            </button>
          )}

          <div className="reports-result-count">
            {data.length} record{data.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Data Table */}
        {loading ? (
          <div className="loading-container" style={{ padding: '40px 20px' }}>
            <div className="spinner"></div>
          </div>
        ) : (
          <div style={{ marginTop: '16px' }}>
            {data.length > 0 ? (
              <DataTable columns={columns} data={data} />
            ) : (
              <div className="reports-empty">
                <HiOutlineFunnel style={{ fontSize: '2.5rem', opacity: 0.3 }} />
                <p>No records match your filters.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .reports-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          border-bottom: 1px solid var(--border);
          padding-bottom: 16px;
        }

        .reports-tab-btn {
          padding: 8px 16px;
          border-radius: var(--radius-sm);
          font-weight: 500;
          font-size: 0.9rem;
          text-transform: capitalize;
          background: var(--bg-secondary);
          color: var(--text-secondary);
          border: 1px solid transparent;
          cursor: pointer;
          transition: var(--transition);
        }

        .reports-tab-btn:hover {
          color: var(--text-primary);
        }

        .reports-tab-btn.active {
          background: var(--accent-gradient);
          color: #fff;
          box-shadow: 0 4px 15px rgba(6, 182, 212, 0.2);
        }

        .reports-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
          margin-top: 20px;
          padding: 16px;
          background: var(--bg-secondary);
          border-radius: var(--radius);
          border: 1px solid var(--border);
        }

        .reports-filter-select {
          padding: 10px 14px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border);
          background: var(--bg-primary);
          color: var(--text-primary);
          font-size: 0.85rem;
          font-weight: 500;
          min-width: 160px;
          cursor: pointer;
          transition: var(--transition);
          appearance: none;
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
          background-position: right 10px center;
          background-repeat: no-repeat;
          background-size: 16px;
          padding-right: 32px;
        }

        .reports-filter-select:focus {
          outline: none;
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.1);
        }

        .reports-filter-select:hover {
          border-color: var(--accent-primary);
        }

        .reports-clear-btn {
          padding: 10px 14px;
          border-radius: var(--radius-sm);
          border: 1px solid rgba(239, 68, 68, 0.3);
          background: rgba(239, 68, 68, 0.08);
          color: var(--danger);
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition);
          white-space: nowrap;
        }

        .reports-clear-btn:hover {
          background: rgba(239, 68, 68, 0.15);
        }

        .reports-result-count {
          margin-left: auto;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-muted);
          padding: 8px 14px;
          border-radius: var(--radius-sm);
          background: var(--bg-primary);
          border: 1px solid var(--border);
          white-space: nowrap;
        }

        .reports-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 60px 20px;
          color: var(--text-muted);
          font-size: 0.95rem;
        }

        .search-input-wrapper {
          position: relative;
          flex: 1;
          min-width: 200px;
        }

        .search-input-wrapper input {
          width: 100%;
          padding: 10px 14px 10px 40px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border);
          background: var(--bg-primary);
          color: var(--text-primary);
          font-size: 0.85rem;
          transition: var(--transition);
        }

        .search-input-wrapper input:focus {
          outline: none;
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.1);
        }

        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          font-size: 1.1rem;
          pointer-events: none;
        }

        @media (max-width: 768px) {
          .reports-filters {
            flex-direction: column;
            align-items: stretch;
          }
          .reports-result-count {
            margin-left: 0;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};

export default Reports;
