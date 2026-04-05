import { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, ToggleLeft, ToggleRight, Filter } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const ROLES = ['admin', 'teacher', 'student', 'parent', 'accountant', 'librarian'];

const ROLE_BADGE = {
  admin: 'badge-blue', teacher: 'badge-green', student: 'badge-purple',
  parent: 'badge-yellow', accountant: 'badge-green', librarian: 'badge-gray'
};

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student', phone: '' });
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const res = await api.get('/users', { params });
      setUsers(res.data.users || []);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [search, roleFilter]);

  const openCreate = () => {
    setEditUser(null);
    setForm({ name: '', email: '', password: '', role: 'student', phone: '' });
    setModalOpen(true);
  };

  const openEdit = (user) => {
    setEditUser(user);
    setForm({ name: user.name, email: user.email, password: '', role: user.role, phone: user.phone || '' });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.email) return toast.error('Name and email are required');
    setSaving(true);
    try {
      if (editUser) {
        const { password, ...data } = form;
        await api.put(`/users/${editUser._id}`, data);
        toast.success('User updated');
      } else {
        if (!form.password) return toast.error('Password is required');
        await api.post('/users', form);
        toast.success('User created');
      }
      setModalOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (user) => {
    try {
      const res = await api.put(`/users/${user._id}/toggle-status`);
      toast.success(res.data.message);
      fetchUsers();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/users/${userId}`);
      toast.success('User deleted');
      fetchUsers();
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

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text" placeholder="Search by name or email..."
              className="input-field pl-9"
              value={search} onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="relative sm:w-44">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select className="input-field pl-9 appearance-none" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
              <option value="">All Roles</option>
              {ROLES.map(r => <option key={r} value={r} className="capitalize">{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? <LoadingSpinner /> : users.length === 0 ? (
          <EmptyState title="No users found" subtitle="Create a new user to get started"
            action={<button className="btn-primary" onClick={openCreate}>Add User</button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
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
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{user.name}</p>
                          <p className="text-xs text-gray-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${ROLE_BADGE[user.role] || 'badge-gray'} capitalize`}>{user.role}</span>
                    </td>
                    <td className="table-cell hidden md:table-cell text-gray-500">{user.phone || '—'}</td>
                    <td className="table-cell">
                      <span className={`badge ${user.isActive ? 'badge-green' : 'badge-red'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="table-cell hidden sm:table-cell text-gray-500 text-xs">
                      {new Date(user.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="table-cell">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => handleToggle(user)} className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50" title="Toggle status">
                          {user.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        </button>
                        <button onClick={() => openEdit(user)} className="p-1.5 rounded text-gray-400 hover:text-emerald-600 hover:bg-emerald-50">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(user._id)} className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50">
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

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editUser ? 'Edit User' : 'Create New User'}>
        <div className="space-y-4">
          <div>
            <label className="label">Full Name *</label>
            <input className="input-field" placeholder="Enter full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Email *</label>
            <input className="input-field" type="email" placeholder="Enter email address" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          {!editUser && (
            <div>
              <label className="label">Password *</label>
              <input className="input-field" type="password" placeholder="Set password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>
          )}
          <div>
            <label className="label">Role *</label>
            <select className="input-field" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
              {ROLES.map(r => <option key={r} value={r} className="capitalize">{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input-field" placeholder="Phone number" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editUser ? 'Update User' : 'Create User'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
