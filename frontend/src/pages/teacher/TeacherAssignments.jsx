import { useEffect, useState } from 'react';
import { Plus, Eye, ClipboardList } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function TeacherAssignments() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewAssignment, setViewAssignment] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', class: '', subject: '', dueDate: '', totalMarks: 100 });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [aRes, cRes] = await Promise.all([
        api.get('/assignments', { params: { teacherId: user._id } }),
        api.get('/classes')
      ]);
      setAssignments(aRes.data.assignments || []);
      setClasses(cRes.data.classes || []);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const onClassChange = async (classId) => {
    setForm(f => ({ ...f, class: classId, subject: '' }));
    if (classId) {
      const res = await api.get(`/classes/${classId}/subjects`);
      setSubjects(res.data.subjects || []);
    } else setSubjects([]);
  };

  const handleCreate = async () => {
    if (!form.title || !form.class || !form.subject || !form.dueDate) return toast.error('Fill all required fields');
    setSaving(true);
    try {
      await api.post('/assignments', form);
      toast.success('Assignment created');
      setModalOpen(false);
      setForm({ title: '', description: '', class: '', subject: '', dueDate: '', totalMarks: 100 });
      fetchData();
    } catch { toast.error('Failed to create assignment'); }
    finally { setSaving(false); }
  };

  const evalSubmission = async (assignmentId, studentId, marks, feedback) => {
    try {
      await api.put(`/assignments/${assignmentId}/evaluate/${studentId}`, { marks, feedback });
      toast.success('Evaluated');
      fetchData();
    } catch { toast.error('Failed to evaluate'); }
  };

  return (
    <div className="space-y-5 fade-in">
      <PageHeader
        title="Assignments"
        subtitle="Create and manage student assignments"
        action={<button className="btn-primary flex items-center gap-2" onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" />New Assignment</button>}
      />

      {loading ? <LoadingSpinner /> : assignments.length === 0 ? (
        <div className="card"><EmptyState title="No assignments yet"
          action={<button className="btn-primary" onClick={() => setModalOpen(true)}>Create Assignment</button>} /></div>
      ) : (
        <div className="space-y-3">
          {assignments.map(a => {
            const submitted = a.submissions?.length || 0;
            const evaluated = a.submissions?.filter(s => s.status === 'evaluated').length || 0;
            const isOverdue = new Date(a.dueDate) < new Date();
            return (
              <div key={a._id} className="card hover:shadow-md transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <ClipboardList className="w-5 h-5 text-blue-700" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{a.title}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {a.subject?.name} • {a.class?.name}-{a.class?.section} • Due: {format(new Date(a.dueDate), 'MMM d, yyyy')}
                      </p>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <span className={`badge ${isOverdue ? 'badge-red' : 'badge-green'}`}>{isOverdue ? 'Overdue' : 'Active'}</span>
                        <span className="badge badge-blue">{submitted} Submitted</span>
                        <span className="badge badge-gray">{evaluated} Evaluated</span>
                        <span className="badge badge-yellow">Max: {a.totalMarks} marks</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setViewAssignment(a)} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" /> View
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create Assignment">
        <div className="space-y-4">
          <div>
            <label className="label">Title *</label>
            <input className="input-field" placeholder="Assignment title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input-field min-h-[80px] resize-y" placeholder="Instructions..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Class *</label>
              <select className="input-field" value={form.class} onChange={e => onClassChange(e.target.value)}>
                <option value="">Select Class</option>
                {classes.map(c => <option key={c._id} value={c._id}>{c.name} – {c.section}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Subject *</label>
              <select className="input-field" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}>
                <option value="">Select Subject</option>
                {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Due Date *</label>
              <input className="input-field" type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
            </div>
            <div>
              <label className="label">Total Marks</label>
              <input className="input-field" type="number" value={form.totalMarks} onChange={e => setForm({ ...form, totalMarks: Number(e.target.value) })} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleCreate} disabled={saving}>{saving ? 'Creating...' : 'Create'}</button>
          </div>
        </div>
      </Modal>

      {/* View Submissions Modal */}
      {viewAssignment && (
        <Modal isOpen={!!viewAssignment} onClose={() => setViewAssignment(null)} title={`Submissions: ${viewAssignment.title}`} size="lg">
          <div className="space-y-3">
            {(!viewAssignment.submissions || viewAssignment.submissions.length === 0) ? (
              <EmptyState title="No submissions yet" subtitle="Students haven't submitted yet" />
            ) : (
              viewAssignment.submissions.map(sub => (
                <div key={sub._id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700">{sub.student?.admissionNo || 'Student'}</p>
                      <p className="text-xs text-gray-400">{format(new Date(sub.submittedAt), 'MMM d, yyyy HH:mm')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge ${sub.status === 'evaluated' ? 'badge-green' : sub.status === 'late' ? 'badge-red' : 'badge-yellow'}`}>{sub.status}</span>
                      {sub.marks !== undefined && <span className="badge badge-blue">{sub.marks}/{viewAssignment.totalMarks}</span>}
                    </div>
                  </div>
                  {sub.description && <p className="text-xs text-gray-500 mt-2">{sub.description}</p>}
                  {sub.status !== 'evaluated' && (
                    <div className="flex gap-2 mt-2">
                      <input type="number" placeholder="Marks" className="input-field w-20 text-sm py-1" id={`marks-${sub._id}`} />
                      <input placeholder="Feedback" className="input-field flex-1 text-sm py-1" id={`feedback-${sub._id}`} />
                      <button className="btn-primary text-xs py-1 px-3" onClick={() => {
                        const m = document.getElementById(`marks-${sub._id}`)?.value;
                        const f = document.getElementById(`feedback-${sub._id}`)?.value;
                        evalSubmission(viewAssignment._id, sub.student?._id, Number(m), f);
                      }}>Evaluate</button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
