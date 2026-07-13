import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Edit2, Trash2, ToggleLeft, ToggleRight,
  X, Eye, EyeOff, BookOpen, Users, UserCheck, GraduationCap, CreditCard
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import TeacherIDCardModal from '../../components/TeacherIDCardModal';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const DEPARTMENTS = ['Mathematics', 'Science', 'Languages', 'Social Studies', 'Physical Education', 'Arts', 'Commerce', 'Computer Science', 'Other'];
const EMPLOYMENT_TYPES = ['Permanent', 'Contract', 'Part-time', 'Guest'];

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className={`card border-l-4 ${color} py-4`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-800">{value ?? '—'}</p>
          <p className="text-sm text-gray-500 mt-0.5">{label}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color.replace('border-', 'bg-').replace('-500', '-100')}`}>
          <Icon className={`w-5 h-5 ${color.replace('border-', 'text-')}`} />
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirm ─────────────────────────────────────────────────────────────
function ConfirmDialog({ open, name, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-6 h-6 text-red-500" />
        </div>
        <h3 className="font-bold text-gray-800 text-lg">Delete Teacher</h3>
        <p className="text-gray-500 text-sm mt-2 mb-5">
          Are you sure you want to delete <strong>{name}</strong>?<br />This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button className="btn-secondary flex-1" onClick={onCancel}>Cancel</button>
          <button className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm transition"
            onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function TeacherManagement() {
  const navigate = useNavigate();
  const [teachers, setTeachers]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData]   = useState(null);   // { user, profile }
  const [form, setForm]           = useState({});
  const [showPass, setShowPass]   = useState(false);
  const [saving, setSaving]       = useState(false);
  // Delete
  const [deleteTarget, setDeleteTarget] = useState(null);
  // ID Card
  const [idCardTeacher, setIdCardTeacher] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/teachers', { params: { limit: 200 } });
      setTeachers(res.data.teachers || []);
    } catch { toast.error('Failed to load teachers'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, []);

  const filtered = teachers.filter(t => {
    const q = search.toLowerCase();
    return !q ||
      t.user?.name?.toLowerCase().includes(q) ||
      t.user?.email?.toLowerCase().includes(q) ||
      t.user?.phone?.includes(q) ||
      t.department?.toLowerCase().includes(q) ||
      t.employeeId?.toLowerCase().includes(q);
  });

  // Stats
  const total      = teachers.length;
  const active     = teachers.filter(t => t.user?.isActive !== false).length;
  const permanent  = teachers.filter(t => t.employmentType === 'Permanent').length;
  const depts      = new Set(teachers.map(t => t.department).filter(Boolean)).size;

  // ── Open modal ────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditData(null);
    setForm({ name:'', email:'', phone:'', password:'', employeeId:'', designation:'', department:'', qualification:'', experience:'', joiningDate:'', employmentType:'' });
    setShowPass(false);
    setModalOpen(true);
  };

  const openEdit = (t) => {
    setEditData(t);
    setForm({
      name:          t.user?.name       || '',
      email:         t.user?.email      || '',
      phone:         t.user?.phone      || '',
      password:      '',
      employeeId:    t.employeeId       || '',
      designation:   t.designation      || '',
      department:    t.department       || '',
      qualification: t.qualification    || '',
      experience:    t.experience ?? '',
      joiningDate:   t.joiningDate ? new Date(t.joiningDate).toISOString().split('T')[0] : '',
      employmentType:t.employmentType   || '',
    });
    setShowPass(false);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.email) return toast.error('Name and email are required');
    if (!editData && !form.password) return toast.error('Password is required for new teachers');
    setSaving(true);
    try {
      const payload = {
        name: form.name, email: form.email, phone: form.phone,
        employeeId: form.employeeId, designation: form.designation,
        department: form.department, qualification: form.qualification,
        experience: Number(form.experience) || 0,
        joiningDate: form.joiningDate || undefined,
        employmentType: form.employmentType || undefined,
      };
      if (form.password) payload.password = form.password;

      if (editData && editData._id && !editData.noProfile) {
        // Has Teacher profile — update via teacher route
        await api.put(`/teachers/${editData._id}`, payload);
      } else if (editData && editData.noProfile) {
        // Has user but no teacher profile — create profile + update user
        await api.put(`/users/${editData.user._id}`, { name: form.name, email: form.email, phone: form.phone, ...(form.password ? { password: form.password } : {}) });
        await api.post('/teachers', { ...payload, password: payload.password || form.employeeId });
      } else {
        // Brand new teacher
        await api.post('/teachers', { ...payload, password: form.password });
      }
      toast.success(editData ? 'Teacher updated' : 'Teacher created');
      setModalOpen(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  // ── Toggle active ─────────────────────────────────────────────────────────
  const handleToggle = async (t) => {
    try {
      await api.put(`/users/${t.user._id}/toggle-status`);
      toast.success(`Teacher ${t.user?.isActive ? 'deactivated' : 'activated'}`);
      fetchAll();
    } catch { toast.error('Failed to update status'); }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (!deleteTarget.noProfile && deleteTarget._id !== deleteTarget.user?._id) {
        await api.delete(`/teachers/${deleteTarget._id}`);
      } else {
        await api.delete(`/users/${deleteTarget.user._id}`);
      }
      toast.success('Teacher deleted');
      setDeleteTarget(null);
      fetchAll();
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="space-y-5 fade-in">
      {idCardTeacher && (
        <TeacherIDCardModal teacher={idCardTeacher} onClose={() => setIdCardTeacher(null)} />
      )}
      <PageHeader
        title="Teacher Management"
        subtitle="Manage teaching staff and their login accounts"
        action={
          <button className="btn-primary flex items-center gap-2" onClick={openCreate}>
            <Plus className="w-4 h-4" /> Add Teacher
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={Users}      label="Total Teachers"  value={total}    color="border-emerald-500" />
        <StatCard icon={UserCheck}  label="Active"          value={active}   color="border-green-500" />
        <StatCard icon={BookOpen}   label="Permanent Staff" value={permanent} color="border-blue-500" />
        <StatCard icon={GraduationCap} label="Departments"  value={depts}    color="border-purple-500" />
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search by name, email, department, employee ID…"
              className="input-field pl-9 pr-9"
              value={search} onChange={e => setSearch(e.target.value)} />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-700">All Teachers</h3>
          <span className="text-xs text-gray-400">{filtered.length} teacher{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {loading ? (
          <div className="py-16"><LoadingSpinner /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Users className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-gray-500 font-medium">No teachers found</p>
            <p className="text-gray-400 text-sm mt-1">{search ? 'Try a different search' : 'Click "Add Teacher" to create one'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="table-header">Teacher</th>
                  <th className="table-header hidden sm:table-cell">Department</th>
                  <th className="table-header hidden md:table-cell">Employee ID</th>
                  <th className="table-header hidden md:table-cell">Phone</th>
                  <th className="table-header">Status</th>
                  <th className="table-header hidden sm:table-cell">Joined</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(t => (
                  <tr key={t._id} className="hover:bg-gray-50 transition">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        {t.photo
                          ? <img src={`${(import.meta.env.VITE_API_URL||'').replace(/\/api$/,'')}${t.photo}`}
                              className="w-9 h-9 rounded-full object-cover flex-shrink-0" alt="" />
                          : <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                              {t.user?.name?.charAt(0).toUpperCase()}
                            </div>
                        }
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{t.user?.name}</p>
                          <p className="text-xs text-gray-400">{t.user?.email}</p>
                          {t.designation && <p className="text-xs text-emerald-600 font-medium mt-0.5">{t.designation}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="table-cell hidden sm:table-cell">
                      {t.department
                        ? <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">{t.department}</span>
                        : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="table-cell hidden md:table-cell text-gray-500 text-sm font-mono">
                      {t.employeeId || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="table-cell hidden md:table-cell text-gray-500 text-sm">
                      {t.user?.phone || '—'}
                    </td>
                    <td className="table-cell">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${t.user?.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {t.user?.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="table-cell hidden sm:table-cell text-gray-400 text-xs">
                      {t.user?.createdAt ? format(new Date(t.user.createdAt), 'dd MMM yyyy') : '—'}
                    </td>
                    <td className="table-cell">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => handleToggle(t)}
                          title={t.user?.isActive !== false ? 'Deactivate' : 'Activate'}
                          className={`p-1.5 rounded-lg transition ${t.user?.isActive !== false ? 'text-green-500 hover:bg-green-50' : 'text-gray-300 hover:bg-gray-50'}`}>
                          {t.user?.isActive !== false ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        </button>
                        <button onClick={() => setIdCardTeacher(t)} title="ID Card"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition">
                          <CreditCard className="w-4 h-4" />
                        </button>
                        <button onClick={() => navigate(`/admin/teachers/${t._id}`)} title="Full profile"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition">
                          <GraduationCap className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(t)} title="Delete"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition">
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

      {/* ── Create / Edit Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <h3 className="font-bold text-gray-800">{editData ? 'Edit Teacher' : 'Add New Teacher'}</h3>
              <button onClick={() => setModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Account section */}
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Login Account</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="label-field">Full Name *</label>
                  <input className="input-field" placeholder="Enter full name"
                    value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="sm:col-span-2">
                  <label className="label-field">Email Address *</label>
                  <input className="input-field" type="email" placeholder="email@school.com"
                    value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <label className="label-field">Phone</label>
                  <input className="input-field" placeholder="10-digit mobile"
                    value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div>
                  <label className="label-field">{editData ? 'New Password' : 'Password *'}</label>
                  <div className="relative">
                    <input className="input-field pr-10"
                      type={showPass ? 'text' : 'password'}
                      placeholder={editData ? 'Leave blank to keep current' : 'Set a password'}
                      value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                    <button type="button" onClick={() => setShowPass(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Professional section */}
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-1">Professional Details</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label-field">Employee ID</label>
                  <input className="input-field" placeholder="EMP001"
                    value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))} />
                </div>
                <div>
                  <label className="label-field">Designation</label>
                  <input className="input-field" placeholder="Senior Teacher"
                    value={form.designation} onChange={e => setForm(f => ({ ...f, designation: e.target.value }))} />
                </div>
                <div>
                  <label className="label-field">Department</label>
                  <select className="input-field" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}>
                    <option value="">Select department</option>
                    {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-field">Employment Type</label>
                  <select className="input-field" value={form.employmentType} onChange={e => setForm(f => ({ ...f, employmentType: e.target.value }))}>
                    <option value="">Select type</option>
                    {EMPLOYMENT_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-field">Qualification</label>
                  <input className="input-field" placeholder="B.Ed, M.Sc"
                    value={form.qualification} onChange={e => setForm(f => ({ ...f, qualification: e.target.value }))} />
                </div>
                <div>
                  <label className="label-field">Experience (years)</label>
                  <input className="input-field" type="number" min="0" placeholder="5"
                    value={form.experience} onChange={e => setForm(f => ({ ...f, experience: e.target.value }))} />
                </div>
                <div className="sm:col-span-2">
                  <label className="label-field">Joining Date</label>
                  <input className="input-field" type="date"
                    value={form.joiningDate} onChange={e => setForm(f => ({ ...f, joiningDate: e.target.value }))} />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-5 py-4 border-t border-gray-100 shrink-0">
              <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : editData ? 'Update Teacher' : 'Create Teacher'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      <ConfirmDialog
        open={!!deleteTarget}
        name={deleteTarget?.user?.name}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
