import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Pencil, Trash2, AlertTriangle, Upload } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import BulkImportModal from '../../components/BulkImportModal';
import api from '../../api/axios';
import toast from 'react-hot-toast';

// ── Inline confirm dialog ─────────────────────────────────────────────────────
function ConfirmDelete({ name, onConfirm, onCancel, deleting }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">Delete Student</h3>
            <p className="text-xs text-gray-400">This action cannot be undone</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-5">
          Are you sure you want to delete <span className="font-semibold text-gray-800">{name}</span>?
          Their student profile will be permanently removed.
        </p>
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

export default function StudentManagement() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);   // { _id, name }
  const [deleting, setDeleting] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/students/${deleteTarget._id}`);
      toast.success('Student deleted successfully');
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete student');
    } finally {
      setDeleting(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [stuRes, clsRes] = await Promise.all([
        api.get('/students', { params: { search, classId: classFilter, showInactive, limit: 1000 } }),
        api.get('/classes')
      ]);
      setStudents(stuRes.data.students || []);
      setClasses(clsRes.data.classes || []);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [search, classFilter, showInactive]);

  return (
    <div className="space-y-5 fade-in">
      {showImport && (
        <BulkImportModal
          onClose={() => setShowImport(false)}
          onSuccess={() => { fetchData(); setShowImport(false); }}
        />
      )}
      {deleteTarget && (
        <ConfirmDelete
          name={deleteTarget.name}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}
      <PageHeader
        title="Student Management"
        subtitle="View and manage all enrolled students"
        action={
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
              onClick={() => setShowImport(true)}
            >
              <Upload className="w-4 h-4" /> Import CSV
            </button>
            <button
              className="btn-primary flex items-center gap-2"
              onClick={() => navigate('/admin/students/add')}
            >
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
            <input
              type="text"
              placeholder="Search students…"
              className="input-field pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="input-field sm:w-44"
            value={classFilter}
            onChange={e => setClassFilter(e.target.value)}
          >
            <option value="">All Classes</option>
            {classes.map(c => (
              <option key={c._id} value={c._id}>{c.name} – {c.section}</option>
            ))}
          </select>
          <button
            onClick={() => setShowInactive(v => !v)}
            className={`px-3 py-2 rounded-xl border text-sm font-semibold transition whitespace-nowrap
              ${showInactive
                ? 'bg-amber-50 border-amber-300 text-amber-700'
                : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
          >
            {showInactive ? 'Inactive Students' : 'Show Inactive'}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <LoadingSpinner />
        ) : students.length === 0 ? (
          <EmptyState
            title="No students found"
            action={
              <button className="btn-primary" onClick={() => navigate('/admin/students/add')}>
                Add Student
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="table-header">Student</th>
                  <th className="table-header">Admission No</th>
                  <th className="table-header hidden sm:table-cell">Class</th>
                  <th className="table-header hidden md:table-cell">Gender</th>
                  <th className="table-header hidden md:table-cell">Parent</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {students.map(s => (
                  <tr key={s._id} className="hover:bg-gray-50">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-semibold text-sm">
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
                      {s.class
                        ? <span className="badge badge-blue">{s.class.name} – {s.class.section}</span>
                        : '—'}
                    </td>
                    <td className="table-cell hidden md:table-cell capitalize text-gray-500">
                      {s.gender || '—'}
                    </td>
                    <td className="table-cell hidden md:table-cell text-gray-500">
                      {s.parentInfo?.father?.name || '—'}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => navigate(`/admin/students/${s._id}`)}
                          className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="View student"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/admin/students/${s._id}/edit`)}
                          className="p-1.5 rounded text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          title="Edit student"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ _id: s._id, name: s.user?.name })}
                          className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete student"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
