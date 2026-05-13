import { useEffect, useState, useCallback } from 'react';
import {
  Plus, Search, Edit2, Trash2, ToggleLeft, ToggleRight,
  Filter, Users, GraduationCap, BookOpen, UserCheck, X, Eye, EyeOff,
  Link2, CheckCircle2
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const ROLES = ['admin', 'teacher', 'student', 'parent', 'accountant', 'librarian'];

const ROLE_BADGE = {
  admin:      'bg-blue-100 text-blue-700 border border-blue-200',
  teacher:    'bg-emerald-100 text-emerald-700 border border-emerald-200',
  student:    'bg-purple-100 text-purple-700 border border-purple-200',
  parent:     'bg-orange-100 text-orange-700 border border-orange-200',
  accountant: 'bg-teal-100 text-teal-700 border border-teal-200',
  librarian:  'bg-rose-100 text-rose-700 border border-rose-200',
};

const ROLE_AVATAR = {
  admin:      'bg-blue-100 text-blue-700',
  teacher:    'bg-emerald-100 text-emerald-700',
  student:    'bg-purple-100 text-purple-700',
  parent:     'bg-orange-100 text-orange-700',
  accountant: 'bg-teal-100 text-teal-700',
  librarian:  'bg-rose-100 text-rose-700',
};

// ── Confirm Delete Dialog ─────────────────────────────────────────────────────
function ConfirmDialog({ open, user, onConfirm, onCancel }) {
  if (!open || !user) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-6 h-6 text-red-500" />
        </div>
        <h3 className="font-bold text-gray-800 text-lg">Delete User</h3>
        <p className="text-gray-500 text-sm mt-2 mb-5">
          Are you sure you want to delete <strong>{user.name}</strong>?<br />
          This action cannot be undone.
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

// ── Assign Children Modal ─────────────────────────────────────────────────────
function AssignChildrenModal({ open, parentUser, onClose, onSaved }) {
  const [allStudents, setAllStudents]   = useState([]);
  const [selected, setSelected]         = useState(new Set());
  const [studentSearch, setStudentSearch] = useState('');
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStudentSearch('');
    // Load all students
    setLoadingStudents(true);
    api.get('/students', { params: { limit: 500 } })
      .then(r => {
        setAllStudents(r.data.students || []);
        // Pre-select already linked children
        const linked = new Set((parentUser.children || []).map(c =>
          typeof c === 'object' ? c._id : c
        ));
        setSelected(linked);
      })
      .catch(() => toast.error('Failed to load students'))
      .finally(() => setLoadingStudents(false));
  }, [open, parentUser]);

  if (!open) return null;

  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filtered = allStudents.filter(s => {
    const q = studentSearch.toLowerCase();
    return !q ||
      s.user?.name?.toLowerCase().includes(q) ||
      s.admissionNo?.toLowerCase().includes(q) ||
      s.class?.name?.toLowerCase().includes(q);
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/users/${parentUser._id}/assign-children`, {
        studentIds: [...selected],
      });
      toast.success(`${selected.size} child${selected.size !== 1 ? 'ren' : ''} linked to ${parentUser.name}`);
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign children');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-800">Link Children to Parent</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Parent: <span className="font-semibold text-orange-600">{parentUser.name}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="input-field pl-9 text-sm"
              placeholder="Search by name, admission no. or class…"
              value={studentSearch}
              onChange={e => setStudentSearch(e.target.value)}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {selected.size} student{selected.size !== 1 ? 's' : ''} selected
          </p>
        </div>

        {/* Student List */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {loadingStudents ? (
            <div className="py-12 flex justify-center"><LoadingSpinner /></div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-gray-400 py-10 text-sm">No students found</p>
          ) : (
            filtered.map(s => {
              const isChecked = selected.has(s._id);
              return (
                <button key={s._id} onClick={() => toggle(s._id)}
                  className={`w-full flex items-center gap-3 px-5 py-3 text-left transition hover:bg-orange-50/50 ${isChecked ? 'bg-orange-50' : ''}`}>
                  {/* Checkbox */}
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition ${isChecked ? 'bg-orange-500 border-orange-500' : 'border-gray-300'}`}>
                    {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                  </div>
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm flex-shrink-0">
                    {s.user?.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{s.user?.name}</p>
                    <p className="text-xs text-gray-400">
                      {s.admissionNo && <span>{s.admissionNo} · </span>}
                      {s.class?.name}{s.class?.section ? ` – ${s.class.section}` : ''}
                    </p>
                  </div>
                  {isChecked && (
                    <span className="text-xs font-semibold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full flex-shrink-0">Linked</span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50/60 rounded-b-2xl">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary flex items-center gap-2" onClick={handleSave} disabled={saving}>
            <Link2 className="w-4 h-4" />
            {saving ? 'Saving…' : `Save (${selected.size} linked)`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function UserManagement() {
  const [allUsers, setAllUsers]   = useState([]);
  const [stats, setStats]         = useState({});
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  // Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser]   = useState(null);
  const [form, setForm]           = useState({ name: '', email: '', password: '', role: 'teacher', phone: '' });
  const [showPass, setShowPass]   = useState(false);
  const [saving, setSaving]       = useState(false);
  // Children modal
  const [childrenModal, setChildrenModal] = useState({ open: false, user: null });
  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ── Load all users once + stats ──
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, statsRes] = await Promise.all([
        api.get('/users', { params: { limit: 200 } }),
        api.get('/users/stats/summary'),
      ]);
      setAllUsers(usersRes.data.users || []);
      setStats(statsRes.data.stats || {});
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, []);

  // ── Client-side filter ──
  const users = allUsers.filter(u => {
    const matchRole   = !roleFilter || u.role === roleFilter;
    const q           = search.toLowerCase();
    const matchSearch = !q ||
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.includes(q);
    return matchRole && matchSearch;
  });

  // ── Create / Edit ──
  const openCreate = () => {
    setEditUser(null);
    setForm({ name: '', email: '', password: '', role: 'teacher', phone: '' });
    setShowPass(false);
    setModalOpen(true);
  };

  const openEdit = (user) => {
    setEditUser(user);
    setForm({ name: user.name, email: user.email, password: '', role: user.role, phone: user.phone || '' });
    setShowPass(false);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.email) return toast.error('Name and email are required');
    if (!editUser && !form.password) return toast.error('Password is required for new users');
    setSaving(true);
    try {
      if (editUser) {
        const payload = { name: form.name, email: form.email, role: form.role, phone: form.phone };
        if (form.password) payload.password = form.password;
        await api.put(`/users/${editUser._id}`, payload);
        toast.success('User updated successfully');
      } else {
        await api.post('/users', form);
        toast.success('User created successfully');
      }
      setModalOpen(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle Active ──
  const handleToggle = async (user) => {
    try {
      const res = await api.put(`/users/${user._id}/toggle-status`);
      toast.success(res.data.message);
      setAllUsers(prev => prev.map(u => u._id === user._id ? { ...u, isActive: !u.isActive } : u));
    } catch {
      toast.error('Failed to update status');
    }
  };

  // ── Delete ──
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/users/${deleteTarget._id}`);
      toast.success('User deleted');
      setAllUsers(prev => prev.filter(u => u._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete user');
    }
  };

  return (
    <div className="space-y-5 fade-in">
      <PageHeader
        title="User Management"
        subtitle="Manage all system users and their roles"
        action={
          <button className="btn-primary flex items-center gap-2" onClick={openCreate}>
            <Plus className="w-4 h-4" /> Add User
          </button>
        }
      />

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={Users}        label="Total Users"   value={stats.totalUsers}   color="border-blue-500" />
        <StatCard icon={GraduationCap} label="Students"     value={stats.totalStudents} color="border-purple-500" />
        <StatCard icon={BookOpen}     label="Teachers"      value={stats.totalTeachers} color="border-emerald-500" />
        <StatCard icon={UserCheck}    label="Active Users"  value={stats.activeUsers}   color="border-green-500" />
      </div>

      {/* ── Filters ── */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search by name, email or phone..."
              className="input-field pl-9 pr-9"
              value={search} onChange={e => setSearch(e.target.value)} />
            {search && (
              <button onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="relative sm:w-44">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select className="input-field pl-9" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
              <option value="">All Roles</option>
              {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-700">
            {roleFilter ? `${roleFilter.charAt(0).toUpperCase() + roleFilter.slice(1)}s` : 'All Users'}
          </h3>
          <span className="text-xs text-gray-400">
            {search || roleFilter ? `${users.length} of ${allUsers.length}` : users.length} users
          </span>
        </div>

        {loading ? (
          <div className="py-16"><LoadingSpinner /></div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Users className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-gray-500 font-medium">No users found</p>
            <p className="text-gray-400 text-sm mt-1">
              {search || roleFilter ? 'Try changing your search or filter' : 'Click "Add User" to create one'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="table-header">User</th>
                  <th className="table-header">Role</th>
                  <th className="table-header hidden md:table-cell">Phone</th>
                  <th className="table-header">Status</th>
                  <th className="table-header hidden sm:table-cell">Joined</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(user => (
                  <tr key={user._id} className="hover:bg-gray-50 transition">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${ROLE_AVATAR[user.role] || 'bg-gray-100 text-gray-600'}`}>
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{user.name}</p>
                          <p className="text-xs text-gray-400">{user.email}</p>
                          {/* Show children count for parents */}
                          {user.role === 'parent' && (
                            <p className="text-xs text-orange-500 font-medium mt-0.5">
                              {(user.children?.length || 0)} child{(user.children?.length || 0) !== 1 ? 'ren' : ''} linked
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${ROLE_BADGE[user.role] || 'bg-gray-100 text-gray-600'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="table-cell hidden md:table-cell text-gray-500 text-sm">
                      {user.phone || '—'}
                    </td>
                    <td className="table-cell">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="table-cell hidden sm:table-cell text-gray-400 text-xs">
                      {user.createdAt ? format(new Date(user.createdAt), 'dd MMM yyyy') : '—'}
                    </td>
                    <td className="table-cell">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => handleToggle(user)}
                          title={user.isActive ? 'Deactivate' : 'Activate'}
                          className={`p-1.5 rounded-lg transition ${user.isActive ? 'text-green-500 hover:bg-green-50' : 'text-gray-300 hover:bg-gray-50'}`}>
                          {user.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        </button>
                        {/* Link children button — only for parents */}
                        {user.role === 'parent' && (
                          <button
                            onClick={() => setChildrenModal({ open: true, user })}
                            title="Link children"
                            className={`p-1.5 rounded-lg transition ${(user.children?.length || 0) > 0 ? 'text-orange-500 hover:bg-orange-50' : 'text-gray-300 hover:text-orange-400 hover:bg-orange-50'}`}>
                            <Link2 className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => openEdit(user)} title="Edit"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(user)} title="Delete"
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-800">{editUser ? 'Edit User' : 'Create New User'}</h3>
              <button onClick={() => setModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="label">Full Name *</label>
                  <input className="input-field" placeholder="Enter full name"
                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Email Address *</label>
                  <input className="input-field" type="email" placeholder="email@example.com"
                    value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <label className="label">Role *</label>
                  <select className="input-field" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                    {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input className="input-field" placeholder="10-digit mobile"
                    value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">
                    {editUser ? 'New Password' : 'Password *'}
                    {editUser && <span className="text-gray-400 font-normal ml-1">(leave blank to keep current)</span>}
                  </label>
                  <div className="relative">
                    <input className="input-field pr-10"
                      type={showPass ? 'text' : 'password'}
                      placeholder={editUser ? 'Enter new password to change…' : 'Set a strong password'}
                      value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                    <button type="button" onClick={() => setShowPass(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Role badge preview */}
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${ROLE_AVATAR[form.role]}`}>
                  {form.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">{form.name || 'Preview'}</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${ROLE_BADGE[form.role]}`}>{form.role}</span>
                </div>
              </div>

              {/* Hint for parent role */}
              {(form.role === 'parent') && editUser && (
                <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-100 rounded-xl text-sm text-orange-700">
                  <Link2 className="w-4 h-4 flex-shrink-0" />
                  <span>After saving, use the <strong>🔗 link button</strong> in the table to assign this parent's children.</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 px-5 pb-5">
              <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : editUser ? 'Update User' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Assign Children Modal ── */}
      <AssignChildrenModal
        open={childrenModal.open}
        parentUser={childrenModal.user || {}}
        onClose={() => setChildrenModal({ open: false, user: null })}
        onSaved={fetchAll}
      />

      {/* ── Delete Confirm ── */}
      <ConfirmDialog
        open={!!deleteTarget}
        user={deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
