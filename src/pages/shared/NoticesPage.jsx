import { useEffect, useState } from 'react';
import { Bell, Calendar, Filter } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import api from '../../api/axios';
import { format } from 'date-fns';

const TYPE_COLORS = { notice: 'badge-gray', event: 'badge-blue', holiday: 'badge-green', circular: 'badge-yellow', alert: 'badge-red' };
const PRIORITY_DOT = { high: 'bg-red-500', medium: 'bg-yellow-500', low: 'bg-green-500' };

export default function NoticesPage() {
  const [notices, setNotices] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/notices').then(r => {
      setNotices(r.data.notices || []);
      setFiltered(r.data.notices || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!typeFilter) setFiltered(notices);
    else setFiltered(notices.filter(n => n.type === typeFilter));
  }, [typeFilter, notices]);

  return (
    <div className="space-y-5 fade-in">
      <PageHeader title="Notice Board" subtitle="Stay updated with school announcements" />

      <div className="card">
        <div className="flex gap-3 items-center">
          <Filter className="w-4 h-4 text-gray-400" />
          <select className="input-field w-44" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            {['notice', 'event', 'holiday', 'circular', 'alert'].map(t => (
              <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
          <span className="text-sm text-gray-400">{filtered.length} notice{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
        <div className="card"><EmptyState title="No notices found" /></div>
      ) : (
        <div className="space-y-3">
          {filtered.map(n => (
            <div key={n._id} className="card hover:shadow-md transition">
              <div className="flex items-start gap-4">
                <div className={`mt-2 w-2.5 h-2.5 rounded-full flex-shrink-0 ${PRIORITY_DOT[n.priority]}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start gap-2 mb-2">
                    <h3 className="font-semibold text-gray-800 flex-1">{n.title}</h3>
                    <span className={`badge ${TYPE_COLORS[n.type] || 'badge-gray'} flex-shrink-0`}>{n.type}</span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{n.content}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(n.publishDate), 'MMM d, yyyy')}</span>
                    {n.author && <span>Posted by: {n.author.name}</span>}
                    {n.expiryDate && <span>Expires: {format(new Date(n.expiryDate), 'MMM d, yyyy')}</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
