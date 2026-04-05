import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, AlertTriangle, CheckCircle, Plus, Search } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatCard from '../../components/common/StatCard';
import Modal from '../../components/common/Modal';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const STATUS_BADGE = {
  paid: 'badge-green', pending: 'badge-yellow', partial: 'badge-blue', overdue: 'badge-red'
};

export default function FeeManagement() {
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({ totalPaid: 0, totalPending: 0, totalOverdue: 0 });
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ student: '', amount: '', month: '', paymentMode: 'cash', status: 'paid', remarks: '' });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [payRes, statsRes, stuRes] = await Promise.all([
        api.get('/fees/payments'),
        api.get('/fees/summary/stats'),
        api.get('/students', { params: { limit: 100 } })
      ]);
      setPayments(payRes.data.payments || []);
      setStats(statsRes.data.stats || {});
      setStudents(stuRes.data.students || []);
    } catch { toast.error('Failed to load fee data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    if (!form.student || !form.amount) return toast.error('Student and amount required');
    setSaving(true);
    try {
      await api.post('/fees/payments', {
        ...form,
        paidAmount: form.status === 'paid' ? Number(form.amount) : 0,
        dueAmount: form.status !== 'paid' ? Number(form.amount) : 0
      });
      toast.success('Payment recorded');
      setModalOpen(false);
      fetchData();
    } catch { toast.error('Failed to record payment'); }
    finally { setSaving(false); }
  };

  const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;

  return (
    <div className="space-y-5 fade-in">
      <PageHeader
        title="Fee Management"
        subtitle="Track fee collections and payments"
        action={<button className="btn-primary flex items-center gap-2" onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" />Record Payment</button>}
      />

      {loading ? <LoadingSpinner /> : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard title="Total Collected" value={fmt(stats.totalPaid)} icon={CheckCircle} color="green" subtitle="All time" />
            <StatCard title="Pending Dues" value={fmt(stats.totalPending)} icon={TrendingUp} color="yellow" subtitle="Awaiting payment" />
            <StatCard title="Overdue" value={fmt(stats.totalOverdue)} icon={AlertTriangle} color="red" subtitle="Past due date" />
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-gray-700">Recent Payments</h3>
            </div>
            <div className="overflow-x-auto">
              {payments.length === 0 ? (
                <p className="text-center text-gray-400 py-10 text-sm">No payments recorded yet</p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="table-header">Student</th>
                      <th className="table-header">Month</th>
                      <th className="table-header">Amount</th>
                      <th className="table-header hidden sm:table-cell">Mode</th>
                      <th className="table-header">Status</th>
                      <th className="table-header hidden md:table-cell">Receipt</th>
                      <th className="table-header hidden md:table-cell">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {payments.map(p => (
                      <tr key={p._id} className="hover:bg-gray-50">
                        <td className="table-cell font-medium text-gray-800">{p.student?.user?.name || p.student?.admissionNo || '—'}</td>
                        <td className="table-cell text-gray-500">{p.month || '—'}</td>
                        <td className="table-cell font-semibold text-gray-800">{fmt(p.paidAmount || p.amount)}</td>
                        <td className="table-cell hidden sm:table-cell capitalize text-gray-500">{p.paymentMode}</td>
                        <td className="table-cell"><span className={`badge ${STATUS_BADGE[p.status] || 'badge-gray'}`}>{p.status}</span></td>
                        <td className="table-cell hidden md:table-cell font-mono text-xs text-gray-500">{p.receiptNo}</td>
                        <td className="table-cell hidden md:table-cell text-xs text-gray-500">
                          {p.createdAt ? format(new Date(p.createdAt), 'dd MMM yyyy') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Record Fee Payment">
        <div className="space-y-4">
          <div>
            <label className="label">Student *</label>
            <select className="input-field" value={form.student} onChange={e => setForm({ ...form, student: e.target.value })}>
              <option value="">Select Student</option>
              {students.map(s => <option key={s._id} value={s._id}>{s.user?.name} – {s.admissionNo}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Amount (₹) *</label>
              <input className="input-field" type="number" placeholder="Enter amount" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div>
              <label className="label">Month</label>
              <input className="input-field" placeholder="e.g. April 2024" value={form.month} onChange={e => setForm({ ...form, month: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Payment Mode</label>
              <select className="input-field" value={form.paymentMode} onChange={e => setForm({ ...form, paymentMode: e.target.value })}>
                {['cash', 'online', 'upi', 'card', 'bank_transfer'].map(m => (
                  <option key={m} value={m} className="capitalize">{m.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input-field" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Remarks</label>
            <input className="input-field" placeholder="Optional remarks" value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleCreate} disabled={saving}>{saving ? 'Saving...' : 'Record Payment'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
