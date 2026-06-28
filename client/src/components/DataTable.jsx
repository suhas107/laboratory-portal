import { useState, useMemo } from 'react';
import {
  HiOutlineMagnifyingGlass,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineChevronUp,
  HiOutlineChevronDown,
  HiOutlineInboxStack,
} from 'react-icons/hi2';

const ITEMS_PER_PAGE = 10;

export default function DataTable({
  columns = [],
  data = [],
  onEdit,
  onDelete,
  searchable = true,
  loading = false,
}) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter
  const filteredData = useMemo(() => {
    if (!search.trim()) return data;
    const query = search.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        const value = row[col.key];
        if (value == null) return false;
        return String(value).toLowerCase().includes(query);
      })
    );
  }, [data, search, columns]);

  // Sort
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey] ?? '';
      const bVal = b[sortKey] ?? '';
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const comparison = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sortDir === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortKey, sortDir]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedData.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedData = sortedData.slice(
    (safeCurrentPage - 1) * ITEMS_PER_PAGE,
    safeCurrentPage * ITEMS_PER_PAGE
  );
  const startItem = sortedData.length === 0 ? 0 : (safeCurrentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(safeCurrentPage * ITEMS_PER_PAGE, sortedData.length);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const renderPageButtons = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, safeCurrentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(
        <button
          key={i}
          className={`pagination-btn ${i === safeCurrentPage ? 'active' : ''}`}
          onClick={() => setCurrentPage(i)}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  const hasActions = onEdit || onDelete;

  return (
    <div className="glass-card-static" style={{ overflow: 'hidden' }}>
      {/* Search bar */}
      {searchable && (
        <div style={{ padding: '16px 20px 0' }}>
          <div className="search-input-wrapper">
            <HiOutlineMagnifyingGlass className="search-icon" />
            <input
              type="text"
              placeholder="Search records..."
              value={search}
              onChange={handleSearch}
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="data-table-wrapper" style={{ padding: '12px 0 0' }}>
        {loading ? (
          <div className="loading-container">
            <div className="spinner" />
            <span className="loading-text">Loading data...</span>
          </div>
        ) : paginatedData.length === 0 ? (
          <div className="table-empty">
            <div className="table-empty-icon">
              <HiOutlineInboxStack />
            </div>
            <p style={{ fontSize: '1rem', fontWeight: 500, marginBottom: 4 }}>No records found</p>
            <p style={{ fontSize: '0.85rem' }}>
              {search ? 'Try adjusting your search terms' : 'Get started by adding a new entry'}
            </p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={sortKey === col.key ? 'sorted' : ''}
                    onClick={() => handleSort(col.key)}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                      {col.label}
                      <span className="sort-icon">
                        {sortKey === col.key ? (
                          sortDir === 'asc' ? <HiOutlineChevronUp /> : <HiOutlineChevronDown />
                        ) : (
                          <HiOutlineChevronUp style={{ opacity: 0.25 }} />
                        )}
                      </span>
                    </span>
                  </th>
                ))}
                {hasActions && <th style={{ width: 100 }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, idx) => (
                <tr key={row._id || row.id || idx} style={{ animationDelay: `${idx * 30}ms` }}>
                  {columns.map((col) => (
                    <td key={col.key}>
                      {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                    </td>
                  ))}
                  {hasActions && (
                    <td>
                      <div className="table-actions">
                        {onEdit && (
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => onEdit(row)}
                            title="Edit"
                          >
                            <HiOutlinePencilSquare />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => onDelete(row)}
                            title="Delete"
                          >
                            <HiOutlineTrash />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {sortedData.length > ITEMS_PER_PAGE && (
        <div className="pagination" style={{ padding: '12px 20px' }}>
          <span className="pagination-info">
            Showing {startItem}–{endItem} of {sortedData.length} records
          </span>
          <div className="pagination-controls">
            <button
              className="pagination-btn"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <HiOutlineChevronLeft />
            </button>
            {renderPageButtons()}
            <button
              className="pagination-btn"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              <HiOutlineChevronRight />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
