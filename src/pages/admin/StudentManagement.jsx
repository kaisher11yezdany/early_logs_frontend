import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Pencil, Trash2, AlertTriangle, Upload, ChevronLeft, ChevronRight, X } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import BulkImportModal from '../../components/BulkImportModal';
import api from '../../api/axios';
import toast from 'react-hot-toast';

// ── Confirm dialog ────────────────────────────────────────────────────────────
function ConfirmDelete({ title, message, onConfirm, onCancel, deleting }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{title}</h3>
            <p className="text-xs text-gray-400">This action cannot be undone</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-5">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1" disabled={deleting}>Cancel</button>
          <button onClick={onConfirm} disabled={deleting}
            className="flex-1 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition disabled:opacity-60">
            {deleting ? 'Deleting…' : 'Yes, Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 20;

function Pagination({ page, total, limit, onChange }) {
  const pages = Math.ceil(total / limit);
  if (pages <= 1) return null;
  const from = (page - 1) * limit + 1;
  const to   = Math.min(page * limit, total);

  const getPageNums = () => {
    if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
    if (page <= 4) return [1, 2, 3, 4, 5, '…', pages];
    if (page >= pages - 3) return [1, '…', pages-4, pages-3, pages-2, pages-1, pages];
    return [1, '…', page-1, page, page+1, '…', pages];
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-t border-gray-100">
      <p className="text-xs text-gray-400">
        Showing <span className="font-semibold text-gray-600">{from}–{to}</span> of{' '}
        <span className="font-semibold text-gray-600">{total}</span> students
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => onChange(page - 1)} disabled={page === 1}
          className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
          <ChevronLeft className="w-4 h-4" />
        </button>
        {getPageNums().map((p, i) =>
          p === '…'
            ? <span key={`e${i}`} className="px-2 text-gray-400 text-sm">…</span>
            : <button key={p} onClick={() => onChange(p)}
                className={`w-8 h-8 rounded-lg text-sm font-semibold transition
                  ${p === page ? 'bg-blue-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {p}
              </button>
        )}
        <button onClick={() => onChange(page + 1)} disabled={page === Math.ceil(total / limit)}
          className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function StudentManagement() {
  const navigate = useNavigate();
  const [students, setStudents]         = useState([]);
  const [classes, setClasses]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [classFilter, setClassFilter]   = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [fromDate, setFromDate]         = useState('');
  const [toDate, setToDate]             = useState('');
  const [page, setPage]                 = useState(1);
  const [total, setTotal]               = useState(0);

  // Single delete
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);

  // Multi-select
  const [selected, setSelected]         = useState(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);

  const [showImport, setShowImport] = useState(false);

  const allIds       = students.map(s => s._id);
  const allSelected  = allIds.length > 0 && allIds.every(id => selected.has(id));
  const someSelected = allIds.some(id => selected.has(id)) && !allSelected;

  const toggleOne = (id) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const toggleAll = () => {
    if (allSelected) {
      setSelected(prev => { const n = new Set(prev); allIds.forEach(id => n.delete(id)); return n; });
    } else {
      setSelected(prev => new Set([...prev, ...allIds]));
    }
  };

  const clearSelection = () => setSelected(new Set());

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [stuRes, clsRes] = await Promise.all([
        api.get('/students', { params: { search, classId: classFilter, showInactive, page, limit: PAGE_SIZE, ...(fromDate && { fromDate }), ...(toDate && { toDate }) } }),
        api.get('/classes')
      ]);
      setStudents(stuRes.data.students || []);
      setTotal(stuRes.data.total || 0);
      setClasses(clsRes.data.classes || []);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  }, [search, classFilter, showInactive, fromDate, toDate, page]);

  useEffect(() => { setPage(1); clearSelection(); }, [search, classFilter, showInactive, fromDate, toDate]);
  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Single delete ─────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/students/${deleteTarget._id}`);
      toast.success('Student deleted');
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    } finally { setDeleting(false); }
  };

  // ── Bulk delete ───────────────────────────────────────────────────────────
  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    try {
      await Promise.all([...selected].map(id => api.delete(`/students/${id}`)));
      toast.success(`${selected.size} student${selected.size > 1 ? 's' : ''} deleted`);
      clearSelection();
      setShowBulkConfirm(false);
      fetchData();
    } catch { toast.error('Some deletions failed'); }
    finally { setBulkDeleting(false); }
  };

  return (
    <div className="space-y-5 fade-in">
      {showImport && (
        <BulkImportModal onClose={() => setShowImport(false)}
          onSuccess={() => { fetchData(); setShowImport(false); }} />
      )}

      {deleteTarget && (
        <ConfirmDelete
          title="Delete Student"
          message={<>Are you sure you want to delete <strong>{deleteTarget.name}</strong>? Their profile will be permanently removed.</>}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}

      {showBulkConfirm && (
        <ConfirmDelete
          title={`Delete ${selected.size} Students`}
          message={`Are you sure you want to delete ${selected.size} selected student${selected.size > 1 ? 's' : ''}? This cannot be undone.`}
          onConfirm={handleBulkDelete}
          onCancel={() => setShowBulkConfirm(false)}
          deleting={bulkDeleting}
        />
      )}

      <PageHeader
        title="Student Management"
        subtitle="View and manage all enrolled students"
        action={
          <div className="flex items-center gap-2">
            <button onClick={() => setShowImport(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
              <Upload className="w-4 h-4" /> Import CSV
            </button>
            <button onClick={() => navigate('/admin/students/add')} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Student
            </button>
          </div>
        }
      />

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search students…" className="input-field pl-9"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input-field sm:w-44" value={classFilter} onChange={e => setClassFilter(e.target.value)}>
            <option value="">All Classes</option>
            {classes.map(c => <option key={c._id} value={c._id}>{c.name} – {c.section}</option>)}
          </select>
          <button onClick={() => setShowInactive(v => !v)}
            className={`px-3 py-2 rounded-xl border text-sm font-semibold transition whitespace-nowrap
              ${showInactive ? 'bg-amber-50 border-amber-300 text-amber-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
            {showInactive ? 'Inactive Students' : 'Show Inactive'}
          </button>
        </div>

        {/* Date range filter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-2 border-t border-gray-100">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">Created:</span>
          <div className="flex items-center gap-2 flex-1">
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
              className="input-field flex-1 text-sm" placeholder="From" />
            <span className="text-gray-400 text-sm shrink-0">to</span>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
              min={fromDate || undefined}
              className="input-field flex-1 text-sm" placeholder="To" />
            {(fromDate || toDate) && (
              <button onClick={() => { setFromDate(''); setToDate(''); }}
                className="flex items-center gap-1 px-3 py-2 text-xs text-gray-500 hover:text-red-600 border border-gray-200 rounded-xl transition whitespace-nowrap">
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-blue-700">{selected.size} selected</span>
            <button onClick={clearSelection} className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 transition">
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          </div>
          <button onClick={() => setShowBulkConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition">
            <Trash2 className="w-4 h-4" /> Delete {selected.size} Student{selected.size > 1 ? 's' : ''}
          </button>
        </div>
      )}

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <LoadingSpinner />
        ) : students.length === 0 ? (
          <EmptyState title="No students found"
            action={<button className="btn-primary" onClick={() => navigate('/admin/students/add')}>Add Student</button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="table-header w-10">
                    <input type="checkbox" checked={allSelected} ref={el => { if (el) el.indeterminate = someSelected; }}
                      onChange={toggleAll}
                      className="w-4 h-4 rounded border-gray-300 accent-blue-600 cursor-pointer" />
                  </th>
                  <th className="table-header">Student</th>
                  <th className="table-header">Admission No</th>
                  <th className="table-header hidden sm:table-cell">Class</th>
                  <th className="table-header hidden md:table-cell">Gender</th>
                  <th className="table-header hidden md:table-cell">Parent</th>
                  <th className="table-header hidden lg:table-cell">Created</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {students.map(s => {
                  const isChecked = selected.has(s._id);
                  return (
                    <tr key={s._id} className={`hover:bg-gray-50 transition ${isChecked ? 'bg-blue-50/60' : ''}`}>
                      <td className="table-cell w-10">
                        <input type="checkbox" checked={isChecked} onChange={() => toggleOne(s._id)}
                          className="w-4 h-4 rounded border-gray-300 accent-blue-600 cursor-pointer" />
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-semibold text-sm shrink-0">
                            {s.user?.name?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{s.user?.name}</p>
                            <p className="text-xs text-gray-400">{s.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell font-mono text-sm">{s.admissionNo}</td>
                      <td className="table-cell hidden sm:table-cell">
                        {s.class ? <span className="badge badge-blue">{s.class.name} – {s.class.section}</span> : '—'}
                      </td>
                      <td className="table-cell hidden md:table-cell capitalize text-gray-500">{s.gender || '—'}</td>
                      <td className="table-cell hidden md:table-cell text-gray-500">{s.parentInfo?.father?.name || '—'}</td>
                      <td className="table-cell hidden lg:table-cell text-gray-400 text-xs">
                        {s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—'}
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1">
                          <button onClick={() => navigate(`/admin/students/${s._id}`)}
                            className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="View">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => navigate(`/admin/students/${s._id}/edit`)}
                            className="p-1.5 rounded text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors" title="Edit">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteTarget({ _id: s._id, name: s.user?.name })}
                            className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} total={total} limit={PAGE_SIZE} onChange={p => { setPage(p); clearSelection(); }} />
      </div>
    </div>
  );
}
