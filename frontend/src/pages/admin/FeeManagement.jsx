import { useEffect, useState } from 'react';
import {
  IndianRupee, Save, RefreshCw, Search, CreditCard,
  X, ChevronDown, ChevronUp, Trash2, Plus, CheckCircle
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const fmt   = n => `₹${(n || 0).toLocaleString('en-IN')}`;
const MODES = ['cash', 'upi', 'online', 'card', 'bank_transfer'];

const STATUS_STYLE = {
  paid:    'bg-green-100 text-green-700 border border-green-200',
  partial: 'bg-blue-100  text-blue-700  border border-blue-200',
  pending: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
};

function StatusBadge({ status }) {
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${STATUS_STYLE[status] || STATUS_STYLE.pending}`}>
      {status === 'paid' ? '✓ Paid' : status === 'partial' ? '◑ Partial' : '○ Pending'}
    </span>
  );
}

function ProgressBar({ paid, total }) {
  const pct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-green-500' : pct > 0 ? 'bg-blue-500' : 'bg-gray-200'}`}
          style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-500 w-8 text-right">{pct}%</span>
    </div>
  );
}

// ── Add Payment Modal ─────────────────────────────────────────────────────────
function PayModal({ open, student, fee, academicYear, onClose, onSuccess }) {
  const [form, setForm] = useState({
    amount: '', paymentMode: 'cash', transactionId: '',
    remarks: '', paymentDate: new Date().toISOString().split('T')[0]
  });
  const [saving, setSaving] = useState(false);

  if (!open || !student) return null;

  const totalPaid = fee?.payments?.reduce((s, p) => s + p.amount, 0) || 0;
  const balance   = (fee?.totalAmount || 0) - totalPaid;

  const handlePay = async () => {
    if (!form.amount || Number(form.amount) <= 0) return toast.error('Enter a valid amount');
    if (Number(form.amount) > balance) return toast.error(`Max balance is ${fmt(balance)}`);
    setSaving(true);
    try {
      const res = await api.post(`/fees/students/${student._id}/payment`, {
        academicYear, ...form, amount: Number(form.amount),
      });
      toast.success(`Payment saved · ${res.data.receiptNo}`);
      setForm({ amount: '', paymentMode: 'cash', transactionId: '', remarks: '', paymentDate: new Date().toISOString().split('T')[0] });
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-800">Add Payment</h3>
            <p className="text-xs text-gray-400 mt-0.5">{student.user?.name} · {student.class?.name} – {student.class?.section}</p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Balance strip */}
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="font-bold text-gray-800">{fmt(fee?.totalAmount)}</p>
              <p className="text-xs text-gray-400">Total Fee</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3">
              <p className="font-bold text-green-600">{fmt(totalPaid)}</p>
              <p className="text-xs text-gray-400">Paid So Far</p>
            </div>
            <div className="bg-red-50 rounded-xl p-3">
              <p className="font-bold text-red-600">{fmt(balance)}</p>
              <p className="text-xs text-gray-400">Balance Due</p>
            </div>
          </div>

          <div>
            <label className="label">Amount Paying Now (₹) *</label>
            <input className="input-field text-lg font-semibold" type="number" min="1" max={balance}
              placeholder={`Max: ${fmt(balance)}`} value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Payment Mode</label>
              <select className="input-field" value={form.paymentMode}
                onChange={e => setForm(f => ({ ...f, paymentMode: e.target.value }))}>
                {MODES.map(m => <option key={m} value={m}>{m.replace('_', ' ').toUpperCase()}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Date</label>
              <input className="input-field" type="date" value={form.paymentDate}
                onChange={e => setForm(f => ({ ...f, paymentDate: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="label">Transaction / Reference ID <span className="text-gray-400 font-normal">(optional)</span></label>
            <input className="input-field" placeholder="UPI ref, bank transaction no., etc."
              value={form.transactionId} onChange={e => setForm(f => ({ ...f, transactionId: e.target.value }))} />
          </div>

          <div>
            <label className="label">Remarks <span className="text-gray-400 font-normal">(optional)</span></label>
            <input className="input-field" placeholder="e.g. 2nd payment, post-dated cheque..."
              value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-5 pb-5">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary flex items-center gap-2" onClick={handlePay} disabled={saving || balance <= 0}>
            <CreditCard className="w-4 h-4" />
            {saving ? 'Saving…' : 'Record Payment'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Payment History Row ───────────────────────────────────────────────────────
function PaymentHistory({ payments, studentId, academicYear, onDelete }) {
  if (!payments?.length) return (
    <p className="text-xs text-gray-400 italic px-4 py-3">No payments recorded yet.</p>
  );
  return (
    <table className="w-full text-xs border-t border-gray-100">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-4 py-2 text-left text-gray-500 font-semibold">Date</th>
          <th className="px-4 py-2 text-right text-gray-500 font-semibold">Amount</th>
          <th className="px-4 py-2 text-left text-gray-500 font-semibold hidden sm:table-cell">Mode</th>
          <th className="px-4 py-2 text-left text-gray-500 font-semibold hidden md:table-cell">Ref / Transaction</th>
          <th className="px-4 py-2 text-left text-gray-500 font-semibold hidden md:table-cell">Receipt</th>
          <th className="px-4 py-2 text-left text-gray-500 font-semibold hidden lg:table-cell">Remarks</th>
          <th className="px-4 py-2" />
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {payments.map((p, i) => (
          <tr key={p._id || i} className="hover:bg-red-50/20 group">
            <td className="px-4 py-2 text-gray-600">
              {p.paymentDate ? format(new Date(p.paymentDate), 'dd MMM yyyy') : '—'}
            </td>
            <td className="px-4 py-2 text-right font-bold text-green-700">{fmt(p.amount)}</td>
            <td className="px-4 py-2 text-gray-500 capitalize hidden sm:table-cell">{p.paymentMode?.replace('_', ' ')}</td>
            <td className="px-4 py-2 text-gray-400 font-mono hidden md:table-cell">{p.transactionId || '—'}</td>
            <td className="px-4 py-2 text-gray-400 font-mono hidden md:table-cell">{p.receiptNo || '—'}</td>
            <td className="px-4 py-2 text-gray-400 hidden lg:table-cell">{p.remarks || '—'}</td>
            <td className="px-4 py-2">
              <button onClick={() => onDelete(studentId, p._id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-500 transition rounded">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function FeeManagement() {
  const [tab, setTab]             = useState('structure');
  const [academicYear, setYear]   = useState('2024-25');
  const [classes, setClasses]     = useState([]);
  const [selectedClass, setClass] = useState('');
  const [structures, setStructures] = useState([]);
  const [allStudents, setAllStudents] = useState([]); // full unfiltered list
  const [stats, setStats]         = useState({});
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(false);
  // inline fee structure editing
  const [editRow, setEditRow]     = useState(null);
  const [editAmt, setEditAmt]     = useState({});
  // expanded row in student tab
  const [expanded, setExpanded]   = useState(null);
  // pay modal
  const [payModal, setPayModal]   = useState({ open: false, student: null, fee: null });

  useEffect(() => {
    api.get('/classes').then(r => setClasses(r.data.classes || []));
  }, []);

  useEffect(() => { fetchStats(); }, [academicYear]);
  useEffect(() => { if (tab === 'structure') fetchStructures(); }, [tab, academicYear]);
  useEffect(() => { if (tab === 'students') fetchStudents();   }, [tab, selectedClass, academicYear]);

  const fetchStats      = () => api.get(`/fees/summary/stats?year=${academicYear}`).then(r => setStats(r.data.stats || {})).catch(() => {});
  const fetchStructures = async () => {
    setLoading(true);
    try { const r = await api.get(`/fees/structure?year=${academicYear}`); setStructures(r.data.structures || []); }
    catch { toast.error('Failed to load fee structure'); }
    finally { setLoading(false); }
  };
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ academicYear });
      if (selectedClass) p.append('classId', selectedClass);
      // no search param — we filter client-side so typing is instant
      const r = await api.get(`/fees/students?${p}`);
      setAllStudents(r.data.data || []);
    } catch { toast.error('Failed to load students'); }
    finally { setLoading(false); }
  };

  // Client-side filter — instant as user types, no API call needed
  const students = allStudents.filter(({ student }) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      student.user?.name?.toLowerCase().includes(q) ||
      student.admissionNo?.toLowerCase().includes(q)
    );
  });

  const saveStructure = async (cls) => {
    const amount = Number(editAmt[cls._id] || 0);
    if (!amount) return toast.error('Enter a valid amount');
    try {
      await api.put(`/fees/structure/${cls._id}`, { academicYear, totalAmount: amount });
      toast.success(`Fee saved for ${cls.name} – ${cls.section}`);
      setEditRow(null);
      fetchStructures(); fetchStats();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
  };

  const initFees = async (cls) => {
    try {
      const r = await api.post('/fees/students/initialize', { classId: cls._id, academicYear });
      toast.success(r.data.message);
      if (tab === 'students') fetchStudents();
    } catch (err) { toast.error(err.response?.data?.message || 'Init failed'); }
  };

  const deletePayment = async (studentId, paymentId) => {
    if (!window.confirm('Remove this payment entry?')) return;
    try {
      await api.delete(`/fees/students/${studentId}/payment/${paymentId}?academicYear=${academicYear}`);
      toast.success('Payment removed');
      fetchStudents();
      fetchStats();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const structureMap = Object.fromEntries(structures.map(s => [s.class?._id, s]));
  const pct = (p, t) => t > 0 ? Math.round((p / t) * 100) : 0;

  return (
    <div className="space-y-5 fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-gray-800">Fee Management</h1>
          <p className="text-sm text-gray-400 mt-0.5">Flexible payment tracking — students pay any amount at any time</p>
        </div>
        <input className="input-field w-32 text-sm" value={academicYear}
          onChange={e => setYear(e.target.value)} placeholder="2025-2026" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Fee', value: fmt(stats.totalAmount), color: 'border-blue-500 text-blue-600',   sub: `${stats.totalStudents || 0} students` },
          { label: 'Collected',  value: fmt(stats.totalPaid),   color: 'border-green-500 text-green-600', sub: `${pct(stats.totalPaid, stats.totalAmount)}% collected` },
          { label: 'Balance Due',value: fmt(stats.totalDue),    color: 'border-red-500 text-red-600',     sub: 'Remaining to collect' },
          { label: 'Collection', value: `${pct(stats.totalPaid, stats.totalAmount)}%`, color: 'border-indigo-500 text-indigo-600', sub: 'This academic year' },
        ].map(s => (
          <div key={s.label} className={`card border-l-4 ${s.color.split(' ')[0]} py-4`}>
            <p className={`text-2xl font-bold ${s.color.split(' ')[1]}`}>{s.value}</p>
            <p className="text-sm font-semibold text-gray-700 mt-0.5">{s.label}</p>
            <p className="text-xs text-gray-400">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {[['structure','Fee Structure'],['students','Student Fees']].map(([id, lbl]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${tab === id ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {lbl}
          </button>
        ))}
      </div>

      {/* ══ TAB 1: Fee Structure ══ */}
      {tab === 'structure' && (
        <div className="card p-0 overflow-hidden">
          <div className="px-5 py-3 bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex items-center justify-between">
            <div>
              <p className="font-bold">Class-wise Annual Fee · {academicYear}</p>
              <p className="text-blue-200 text-xs">Set total fee per class, then click "Init Students" to create individual fee records</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 w-10">SL</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Class</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Total Annual Fee</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {classes.length === 0 && (
                  <tr><td colSpan={4} className="text-center text-gray-400 py-10">No classes found</td></tr>
                )}
                {classes.map((cls, idx) => {
                  const str = structureMap[cls._id];
                  const isEditing = editRow === cls._id;
                  return (
                    <tr key={cls._id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'} hover:bg-blue-50/20 transition`}>
                      <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                      <td className="px-4 py-3 font-semibold text-gray-800">{cls.name} – {cls.section}</td>
                      <td className="px-4 py-3 text-right">
                        {isEditing ? (
                          <input type="number" className="w-36 text-right border border-blue-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-500"
                            value={editAmt[cls._id] || ''} placeholder="e.g. 55000"
                            onChange={e => setEditAmt(a => ({ ...a, [cls._id]: e.target.value }))} autoFocus />
                        ) : (
                          <span className={`font-bold text-base ${str ? 'text-gray-800' : 'text-gray-300'}`}>
                            {str ? fmt(str.totalAmount) : '— Not set'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          {isEditing ? (
                            <>
                              <button onClick={() => saveStructure(cls)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg">
                                <Save className="w-3 h-3" /> Save
                              </button>
                              <button onClick={() => setEditRow(null)}
                                className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-600 text-xs font-semibold rounded-lg">
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => { setEditRow(cls._id); setEditAmt(a => ({ ...a, [cls._id]: str?.totalAmount || '' })); }}
                                className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-semibold rounded-lg">
                                {str ? 'Edit' : 'Set Fee'}
                              </button>
                              {str && (
                                <button onClick={() => initFees(cls)}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 text-xs font-semibold rounded-lg"
                                  title="Create fee records for all students in this class">
                                  <Plus className="w-3 h-3" /> Init Students
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
            <strong>How it works:</strong> Set total annual fee per class → Save → Click "Init Students" to create fee records for all enrolled students → Go to Student Fees tab to record each payment.
          </div>
        </div>
      )}

      {/* ══ TAB 2: Student Fees ══ */}
      {tab === 'students' && (
        <div className="space-y-4">
          {/* Filter bar */}
          <div className="card">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[160px]">
                <label className="label">Class</label>
                <select className="input-field" value={selectedClass} onChange={e => { setClass(e.target.value); }}>
                  <option value="">All Classes</option>
                  {classes.map(c => <option key={c._id} value={c._id}>{c.name} – {c.section}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-[160px]">
                <label className="label">Search Student</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input className="input-field pl-9" placeholder="Name or admission no."
                    value={search} onChange={e => setSearch(e.target.value)} />
                  {search && (
                    <button onClick={() => setSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <button onClick={fetchStudents} disabled={loading}
                className="btn-primary flex items-center gap-2 h-10">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Loading…' : 'Load'}
              </button>
            </div>
          </div>

          {/* Student list */}
          <div className="card p-0 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-700">Student Fee Ledger</h3>
              <span className="text-xs text-gray-400">
                {search ? `${students.length} of ${allStudents.length}` : students.length} students
              </span>
            </div>

            {students.length === 0 ? (
              <div className="flex flex-col items-center py-14 text-center">
                <IndianRupee className="w-10 h-10 text-gray-200 mb-3" />
                <p className="text-gray-500 font-medium">No students found</p>
                <p className="text-gray-400 text-sm mt-1">Select a class and click Load · Initialize fees from the Fee Structure tab first</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {students.map(({ student, fee }) => {
                  const totalPaid = fee?.payments?.reduce((s, p) => s + p.amount, 0) || 0;
                  const balance   = (fee?.totalAmount || 0) - totalPaid;
                  const status    = !fee ? 'no-record' : totalPaid <= 0 ? 'pending' : balance <= 0 ? 'paid' : 'partial';
                  const isOpen    = expanded === student._id;

                  return (
                    <div key={student._id}>
                      {/* Main row */}
                      <div
                        className={`flex flex-wrap items-center gap-3 px-5 py-4 cursor-pointer hover:bg-gray-50 transition ${isOpen ? 'bg-blue-50/40' : ''}`}
                        onClick={() => setExpanded(isOpen ? null : student._id)}>

                        {/* Avatar + name */}
                        <div className="flex items-center gap-3 flex-1 min-w-[160px]">
                          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                            {student.user?.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 text-sm">{student.user?.name}</p>
                            <p className="text-xs text-gray-400">{student.admissionNo} · {student.class?.name} – {student.class?.section}</p>
                          </div>
                        </div>

                        {/* Progress */}
                        <div className="flex-1 min-w-[140px]">
                          {fee ? (
                            <>
                              <ProgressBar paid={totalPaid} total={fee.totalAmount} />
                              <p className="text-xs text-gray-500 mt-0.5">
                                {fmt(totalPaid)} <span className="text-gray-300">/</span> {fmt(fee.totalAmount)}
                              </p>
                            </>
                          ) : (
                            <span className="text-xs text-gray-400 italic">No fee record</span>
                          )}
                        </div>

                        {/* Balance */}
                        <div className="text-right min-w-[90px]">
                          {fee ? (
                            <>
                              <p className={`font-bold text-sm ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {balance > 0 ? fmt(balance) : '✓ Cleared'}
                              </p>
                              <p className="text-xs text-gray-400">Balance</p>
                            </>
                          ) : '—'}
                        </div>

                        {/* Status + actions */}
                        <div className="flex items-center gap-2">
                          {status !== 'no-record' && <StatusBadge status={status} />}
                          {fee && balance > 0 && (
                            <button
                              onClick={e => { e.stopPropagation(); setPayModal({ open: true, student, fee }); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition">
                              <Plus className="w-3 h-3" /> Pay
                            </button>
                          )}
                          {status === 'paid' && <CheckCircle className="w-5 h-5 text-green-500" />}
                          {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                        </div>
                      </div>

                      {/* Expanded: payment history */}
                      {isOpen && (
                        <div className="bg-gray-50/60 border-t border-gray-100">
                          <div className="px-5 py-2 flex items-center justify-between">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                              Payment History ({fee?.payments?.length || 0} entries)
                            </p>
                            {fee && balance > 0 && (
                              <button
                                onClick={() => setPayModal({ open: true, student, fee })}
                                className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition">
                                <Plus className="w-3 h-3" /> Add Payment
                              </button>
                            )}
                          </div>
                          <PaymentHistory
                            payments={fee?.payments || []}
                            studentId={student._id}
                            academicYear={academicYear}
                            onDelete={deletePayment}
                          />
                          {!fee && (
                            <p className="px-5 py-3 text-xs text-gray-400 italic">
                              Fee record not initialized. Go to Fee Structure tab and click "Init Students".
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pay Modal */}
      <PayModal
        open={payModal.open}
        student={payModal.student}
        fee={payModal.fee}
        academicYear={academicYear}
        onClose={() => setPayModal({ open: false, student: null, fee: null })}
        onSuccess={() => { fetchStudents(); fetchStats(); }}
      />
    </div>
  );
}
