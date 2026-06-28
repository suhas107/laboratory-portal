import { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import StatCard from '../components/StatCard';
import {
  HiOutlineUsers,
  HiOutlineFolder,
  HiOutlineDocumentText,
  HiOutlineBeaker,
} from 'react-icons/hi2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import toast from 'react-hot-toast';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Chart defaults
ChartJS.defaults.color = '#94a3b8';
ChartJS.defaults.borderColor = 'rgba(148, 163, 184, 0.1)';
ChartJS.defaults.font.family = "'Inter', sans-serif";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchStats = async (isBackground = false) => {
    try {
      const { data } = await dashboardAPI.getStats();
      setStats(data);
      setLastUpdated(new Date());
    } catch (err) {
      if (!isBackground) {
        toast.error('Failed to load dashboard data');
        setStats({
          counts: { people: 0, projects: 0, publications: 0, inventory: 0 },
          peopleByCategory: {},
          projectsByStatus: {},
          publicationsByYear: {},
          inventoryByClass: {},
          recentActivity: [],
        });
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Auto-refresh every 30 seconds for real-time monitoring
    const interval = setInterval(() => fetchStats(true), 30000);
    return () => clearInterval(interval);
  }, []);




  if (loading) {
    return (
      <div className="page-content">
        <div className="loading-container">
          <div className="spinner" />
          <span className="loading-text">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  const counts = stats?.totals || {};
  
  const peopleByCategory = (stats?.peopleByCategory || []).reduce((acc, item) => ({ ...acc, [item.category]: item.count }), {});
  const projectsByStatus = (stats?.projectsByStatus || []).reduce((acc, item) => ({ ...acc, [item.status]: item.count }), {});
  const publicationsByYear = (stats?.publicationsByYear || []).reduce((acc, item) => ({ ...acc, [item.year]: item.count }), {});
  const inventoryByClass = (stats?.inventoryByClass || []).reduce((acc, item) => ({ ...acc, [item.inventory_class]: item.count }), {});
  
  // Combine recent activity
  const recentActivity = [];
  if (stats?.recent) {
    stats.recent.people?.forEach(p => recentActivity.push({ text: `New user: ${p.full_name}`, type: 'Person' }));
    stats.recent.projects?.forEach(p => recentActivity.push({ text: `New project: ${p.project_name}`, type: 'Project' }));
    stats.recent.publications?.forEach(p => recentActivity.push({ text: `New publication: ${p.title}`, type: 'Publication' }));
    stats.recent.inventory?.forEach(p => recentActivity.push({ text: `New item: ${p.item_name}`, type: 'Inventory' }));
  }

  // ── Chart Data ──
  const chartColors = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#14b8a6', '#f97316', '#6366f1'];

  const peopleByCategoryData = {
    labels: Object.keys(peopleByCategory),
    datasets: [
      {
        label: 'People',
        data: Object.values(peopleByCategory),
        backgroundColor: Object.keys(peopleByCategory).map(
          (_, i) => `${chartColors[i % chartColors.length]}cc`
        ),
        borderColor: Object.keys(peopleByCategory).map(
          (_, i) => chartColors[i % chartColors.length]
        ),
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const projectsByStatusData = {
    labels: Object.keys(projectsByStatus),
    datasets: [
      {
        data: Object.values(projectsByStatus),
        backgroundColor: ['#06b6d4cc', '#10b981cc', '#f59e0bcc', '#ef4444cc', '#8b5cf6cc'],
        borderColor: ['#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  };

  const yearLabels = Object.keys(publicationsByYear).sort();
  const publicationsByYearData = {
    labels: yearLabels,
    datasets: [
      {
        label: 'Publications',
        data: yearLabels.map((y) => publicationsByYear[y]),
        borderColor: '#06b6d4',
        backgroundColor: 'rgba(6, 182, 212, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#06b6d4',
        pointBorderColor: '#0f172a',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };

  const inventoryByClassData = {
    labels: Object.keys(inventoryByClass),
    datasets: [
      {
        data: Object.values(inventoryByClass),
        backgroundColor: ['#8b5cf6cc', '#06b6d4cc', '#10b981cc', '#f59e0bcc', '#3b82f6cc', '#ef4444cc'],
        borderColor: ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#3b82f6', '#ef4444'],
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'People by Category',
        font: { size: 14, weight: '600' },
        padding: { bottom: 16 },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1, font: { size: 11 } },
        grid: { color: 'rgba(148,163,184,0.06)' },
      },
      x: {
        ticks: { font: { size: 10 }, maxRotation: 45 },
        grid: { display: false },
      },
    },
  };

  const doughnutOptions = (title) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { padding: 16, usePointStyle: true, pointStyle: 'circle', font: { size: 11 } },
      },
      title: {
        display: true,
        text: title,
        font: { size: 14, weight: '600' },
        padding: { bottom: 16 },
      },
    },
    cutout: '65%',
  });

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Publications by Year',
        font: { size: 14, weight: '600' },
        padding: { bottom: 16 },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1, font: { size: 11 } },
        grid: { color: 'rgba(148,163,184,0.06)' },
      },
      x: {
        ticks: { font: { size: 11 } },
        grid: { display: false },
      },
    },
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome to your laboratory command center</p>
        </div>
        <div className="dashboard-live-indicator">
          <span className="live-dot"></span>
          <span>Live</span>
          {lastUpdated && (
            <span className="last-updated">Updated {lastUpdated.toLocaleTimeString()}</span>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="dashboard-stats">
        <StatCard title="Total People" value={counts.people || 0} icon={HiOutlineUsers} color="#06b6d4" />
        <StatCard title="Projects" value={counts.projects || 0} icon={HiOutlineFolder} color="#8b5cf6" />
        <StatCard title="Publications" value={counts.publications || 0} icon={HiOutlineDocumentText} color="#10b981" />
        <StatCard title="Inventory Items" value={counts.inventory || 0} icon={HiOutlineBeaker} color="#f59e0b" />
      </div>

      {/* Chart Row 1 */}
      <div className="dashboard-charts-row">
        <div className="glass-card chart-card">
          <div className="chart-container">
            <Bar data={peopleByCategoryData} options={barOptions} />
          </div>
        </div>
        <div className="glass-card chart-card">
          <div className="chart-container">
            <Doughnut data={projectsByStatusData} options={doughnutOptions('Projects by Status')} />
          </div>
        </div>
      </div>

      {/* Chart Row 2 */}
      <div className="dashboard-charts-row">
        <div className="glass-card chart-card">
          <div className="chart-container">
            <Line data={publicationsByYearData} options={lineOptions} />
          </div>
        </div>
        <div className="glass-card chart-card">
          <div className="chart-container">
            <Doughnut data={inventoryByClassData} options={doughnutOptions('Inventory by Class')} />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <div className="glass-card" style={{ padding: '24px', marginTop: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>
            Recent Activity
          </h3>
          <div className="recent-activity-list">
            {recentActivity.slice(0, 5).map((item, idx) => (
              <div key={idx} className="recent-activity-item" style={{ animationDelay: `${idx * 80}ms` }}>
                <div className="recent-activity-dot" style={{ background: chartColors[idx % chartColors.length] }} />
                <div className="recent-activity-content">
                  <span className="recent-activity-text">{item.text || item.name || item.title || 'New entry'}</span>
                  <span className="recent-activity-meta">{item.type || ''} {item.date ? `• ${new Date(item.date).toLocaleDateString()}` : ''}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .dashboard-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
          gap: 20px;
          margin-bottom: 24px;
        }

        .dashboard-charts-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }

        .chart-card {
          padding: 24px;
        }

        .chart-container {
          height: 300px;
          position: relative;
        }

        .recent-activity-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .recent-activity-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 16px;
          border-radius: 10px;
          background: rgba(15, 23, 42, 0.4);
          border: 1px solid var(--border);
          animation: slideInLeft 0.4s ease-out both;
          transition: var(--transition);
        }

        .recent-activity-item:hover {
          background: rgba(6, 182, 212, 0.04);
          border-color: rgba(6, 182, 212, 0.15);
        }

        .recent-activity-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .recent-activity-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .recent-activity-text {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-primary);
        }

        .recent-activity-meta {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        @media (max-width: 768px) {
          .dashboard-charts-row {
            grid-template-columns: 1fr;
          }

          .dashboard-stats {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 480px) {
          .dashboard-stats {
            grid-template-columns: 1fr;
          }
        }

        .dashboard-live-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 20px;
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.2);
          font-size: 0.8rem;
          font-weight: 600;
          color: #10b981;
        }

        .live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          animation: pulse-live 2s ease-in-out infinite;
        }

        @keyframes pulse-live {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
          50% { opacity: 0.6; box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
        }

        .last-updated {
          color: var(--text-muted);
          font-weight: 400;
          margin-left: 4px;
        }
      `}</style>
    </div>
  );
}
