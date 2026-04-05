import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, BookOpen, Users } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function ClassManagement() {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editClass, setEditClass] = useState(null);
  const [form, setForm] = useState({ name: '', section: '', academicYear: '2024-25', classTeacher: '', roomNumber: '' });
  const [saving, setSaving] = useState(false);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const [classRes, teacherRes] = await Promise.all([
        api.get('/classes'),
        api.get('/users', { params: { role: 'teacher', isActive: true } })
      ]);
      setClasses(classRes.data.classes || []);
      setTeachers(teacherRes.data.users || []);
    } catch { toast.error('Failed to load classes'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchClasses(); }, []);

  const openCreate = () => {
    setEditClass(null);
    setForm({ name: '', section: '', academicYear: '2024-25', classTeacher: '', roomNumber: '' });
    setModalOpen(true);
  };

  const openEdit = (cls) => {
    setEditClass(cls);
    setForm({
      name: cls.name, section: cls.section, academicYear: cls.academicYear,
      classTeacher: cls.classTeacher?._id || '', roomNumber: cls.roomNumber || ''
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.section) return toast.error('Class name and section are required');
    setSaving(true);
    try {
      if (editClass) {
        await api.put(`/classes/${editClass._id}`, form);
        toast.success('Class updated');
      } else {
        await api.post('/classes', form);
        toast.success('Class created');
      }
      setModalOpen(false);
      fetchClasses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save class');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this class?')) return;
    try {
      await api.delete(`/classes/${id}`);
      toast.success('Class deleted');
      fetchClasses();
    } catch { toast.error('Failed to delete class'); }
  };

  return (
    <div className="space-y-5 fade-in">
      <PageHeader
        title="Class Management"
        subtitle="Create and manage classes and sections"
        action={<button className="btn-primary flex items-center gap-2" onClick={openCreate}><Plus className="w-4 h-4" />Add Class</button>}
      />

      {loading ? <LoadingSpinner /> : classes.length === 0 ? (
        <div className="card">
          <EmptyState title="No classes yet" subtitle="Create your first class to get started"
            action={<button className="btn-primary" onClick={openCreate}>Add Class</button>} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map(cls => (
            <div key={cls._id} className="card hover:shadow-md transition group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-blue-700" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={() => openEdit(cls)} className="p-1.5 rounded text-gray-400 hover:text-emerald-600 hover:bg-emerald-50">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(cls._id)} className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <h3 className="text-gray-800 font-bold">{cls.name} – {cls.section}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{cls.academicYear}</p>
              <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5">
                {cls.classTeacher && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Users className="w-3.5 h-3.5" />
                    <span>Teacher: {cls.classTeacher.name}</span>
                  </div>
                )}
                {cls.roomNumber && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Room: {cls.roomNumber}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="badge badge-blue">{cls.subjects?.length || 0} Subjects</span>
                  {cls.isActive && <span className="badge badge-green">Active</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editClass ? 'Edit Class' : 'Create Class'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Class Name *</label>
              <input className="input-field" placeholder="e.g. Class 10" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Section *</label>
              <input className="input-field" placeholder="e.g. A" value={form.section} onChange={e => setForm({ ...form, section: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Academic Year *</label>
            <input className="input-field" placeholder="e.g. 2024-25" value={form.academicYear} onChange={e => setForm({ ...form, academicYear: e.target.value })} />
          </div>
          <div>
            <label className="label">Class Teacher</label>
            <select className="input-field" value={form.classTeacher} onChange={e => setForm({ ...form, classTeacher: e.target.value })}>
              <option value="">Select Teacher</option>
              {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Room Number</label>
            <input className="input-field" placeholder="e.g. 101" value={form.roomNumber} onChange={e => setForm({ ...form, roomNumber: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editClass ? 'Update' : 'Create'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
