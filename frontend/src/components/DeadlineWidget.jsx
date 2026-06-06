import { useEffect, useState } from 'react';
import { Bell, Clock } from 'lucide-react';
import { newsApi, asList } from '../api/client';
import { getCountdown } from '../utils/format';

export default function DeadlineWidget() {
  const [deadlines, setDeadlines] = useState([]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    newsApi.getDeadlines()
      .then(({ data }) => setDeadlines(asList(data)))
      .catch(() => setDeadlines([]));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  if (!deadlines.length) return null;

  return (
    <div className="deadline-widget" aria-label="Upcoming deadlines">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <Bell size={18} />
        <h3 style={{ fontSize: '1rem', color: 'white' }}>Upcoming Deadlines</h3>
      </div>

      {deadlines.map((d) => {
        const countdown = getCountdown(d.submission_deadline);
        const urgency = countdown.expired ? 'critical' : countdown.totalMinutes < 60 ? 'critical' : countdown.totalMinutes < 180 ? 'urgent' : '';

        const progress = countdown.expired
          ? 100
          : Math.max(0, Math.min(100, 100 - (countdown.totalMinutes / 480) * 100));

        return (
          <div key={d.id} className="deadline-item">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                className="category-badge"
                style={{ background: d.category?.color_hex || '#3B82F6' }}
              >
                {d.category?.name}
              </span>
              <Clock size={14} style={{ opacity: 0.6 }} />
            </div>
            <p style={{ fontSize: '0.8125rem', opacity: 0.8, margin: '0.5rem 0 0.25rem' }}>
              {d.broadcast_slot?.name}
            </p>
            <div className={`countdown ${urgency}`}>
              {countdown.expired ? '⚠ Past deadline' : countdown.text}
            </div>
            <div className="deadline-progress">
              <div
                className="deadline-progress-bar"
                style={{
                  width: `${progress}%`,
                  background: urgency === 'critical'
                    ? 'linear-gradient(90deg, #EF4444, #DC2626)'
                    : urgency === 'urgent'
                    ? 'linear-gradient(90deg, #F59E0B, #D97706)'
                    : undefined,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
