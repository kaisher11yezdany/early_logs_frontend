import { useEffect, useState } from 'react';
import { Plus, Trash2, Bell, Calendar } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const TYPE_COLORS = {
  notice: 'badge-gray', event: 'badge-blue', holiday: 'badge-green',
  circular: 'badge-yellow', alert: 'badge-red'
};
const PRIORITY_DOT = { high: 'bg-red-500', medium: 'bg-yellow-500', low: 'bg-green-500' };

export default function NoticeManagement() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: '', content: '', type: 'notice', priority: 'medium',
    targetRoles: ['all'], expiryDate: ''
  });
  const [saving, setSaving] = useState(false);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notices');
      setNotices(res.data.notices || []);
    } catch { toast.error('Failed to load notices'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchNotices(); }, []);

  const handleCreate = async () => {
    if (!form.title || !form.content) return toast.error('Title and content are required');
    setSaving(true);
    try {
      await api.post('/notices', form);
      toast.success('Notice published');
      setModalOpen(false);
      setForm({ title: '', content: '', type: 'notice', priority: 'medium', targetRoles: ['all'], expiryDate: '' });
      fetchNotices();
    } catch { toast.error('Failed to create notice'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this notice?')) return;
    try {
      await api.delete(`/notices/${id}`);
      toast.success('Notice deleted');
      fetchNotices();
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="space-y-5 fade-in">
      <PageHeader
        title="Notice Board"
        subtitle="Publish announcements, events, and circulars"
        action={<button className="btn-primary flex items-center gap-2" onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" />New Notice</button>}
      />

      {loading ? <LoadingSpinner /> : notices.length === 0 ? (
        <div className="card"><EmptyState title="No notices yet" action={<button className="btn-primary" onClick={() => setModalOpen(true)}>Create Notice</button>} /></div>
      ) : (
        <div className="space-y-3">
          {notices.map(n => (
            <div key={n._id} className="card hover:shadow-md transition">
              <div className="flex items-start gap-4">
                <div className={`mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${PRIORITY_DOT[n.priority]}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-800">{n.title}</h3>
                    <span className={`badge ${TYPE_COLORS[n.type] || 'badge-gray'}`}>{n.type}</span>
                    <span className={`badge ${n.priority === 'high' ? 'badge-red' : n.priority === 'medium' ? 'badge-yellow' : 'badge-green'}`}>{n.priority}</span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{n.content}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(n.publishDate), 'MMM d, yyyy')}
                    </span>
                    <span>By: {n.author?.name}</span>
                    <span>To: {n.targetRoles?.join(', ')}</span>
                  </div>
                </div>
                <button onClick={() => handleDelete(n._id)} className="p-2 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create Notice">
        <div className="space-y-4">
          <div>
            <label className="label">Title *</label>
            <input className="input-field" placeholder="Notice title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="label">Content *</label>
            <textarea className="input-field min-h-[100px] resize-y" placeholder="Write notice content..." value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Type</label>
              <select className="input-field" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                {['notice', 'event', 'holiday', 'circular', 'alert'].map(t => (
                  <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="input-field" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Target Audience</label>
            <select className="input-field" value={form.targetRoles[0]} onChange={e => setForm({ ...form, targetRoles: [e.target.value] })}>
              {['all', 'admin', 'teacher', 'student', 'parent', 'accountant'].map(r => (
                <option key={r} value={r} className="capitalize">{r.charAt(0).toUpperCase() + r.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Expiry Date (optional)</label>
            <input className="input-field" type="date" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleCreate} disabled={saving}>{saving ? 'Publishing...' : 'Publish Notice'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
