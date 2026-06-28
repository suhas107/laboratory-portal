import { useEffect, useState, useRef } from 'react';

export default function StatCard({ title, value, icon: Icon, color = '#06b6d4', trend }) {
  const [displayValue, setDisplayValue] = useState(0);
  const cardRef = useRef(null);

  // Animated counter
  useEffect(() => {
    const numValue = typeof value === 'number' ? value : parseInt(value, 10);
    if (isNaN(numValue) || numValue === 0) {
      setDisplayValue(0);
      return;
    }

    let startTime;
    const duration = 1200;
    const startValue = 0;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // easeOutQuart
      const eased = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(Math.floor(startValue + (numValue - startValue) * eased));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return (
    <div className="stat-card" ref={cardRef}>
      <div className="stat-card-accent" style={{ background: color }} />
      <div className="stat-card-content">
        <div className="stat-card-info">
          <span className="stat-card-title">{title}</span>
          <span className="stat-card-value">{displayValue}</span>
          {trend !== undefined && (
            <span
              className="stat-card-trend"
              style={{ color: trend >= 0 ? 'var(--success)' : 'var(--danger)' }}
            >
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </span>
          )}
        </div>
        <div className="stat-card-icon-wrapper" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
          {Icon && <Icon style={{ color, fontSize: '1.5rem' }} />}
        </div>
      </div>

      <style>{`
        .stat-card {
          background: var(--bg-card);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius);
          box-shadow: var(--shadow);
          position: relative;
          overflow: hidden;
          transition: var(--transition);
          animation: slideUp 0.5s ease-out both;
        }

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
          border-color: rgba(148, 163, 184, 0.18);
        }

        .stat-card-accent {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          border-radius: 12px 12px 0 0;
        }

        .stat-card-content {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 24px;
        }

        .stat-card-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stat-card-title {
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .stat-card-value {
          font-size: 2rem;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.2;
          animation: countUp 0.5s ease-out;
        }

        .stat-card-trend {
          font-size: 0.8rem;
          font-weight: 600;
          margin-top: 2px;
        }

        .stat-card-icon-wrapper {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
}
