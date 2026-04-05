import { useEffect, useState } from 'react';
import { Send, ClipboardList, CheckCircle } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { format, isPast } from 'date-fns';

const STATUS_STYLES = {
  pending: 'badge-yellow', submitted: 'badge-green', evaluated: 'badge-blue',
  overdue: 'badge-red', late: 'badge-yellow'
};

export default function MyAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitModal, setSubmitModal] = useState(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/assignments/my/assignments');
      setAssignments(res.data.assignments || []);
    } catch { toast.error('Failed to load assignments'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.post(`/assignments/${submitModal._id}/submit`, { description });
      toast.success('Assignment submitted!');
      setSubmitModal(null);
      setDescription('');
      fetchData();
    } catch { toast.error('Failed to submit'); }
    finally { setSubmitting(false); }
  };

  const pending = assignments.filter(a => a.status === 'pending' || a.status === 'overdue').length;
  const submitted = assignments.filter(a => a.status === 'submitted' || a.status === 'evaluated' || a.status === 'late').length;

  return (
    <div className="space-y-5 fade-in">
      <PageHeader title="My Assignments" subtitle="View and submit assignments" />

      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center py-4">
          <p className="text-2xl font-bold text-gray-800">{assignments.length}</p>
          <p className="text-xs text-gray-500 mt-1">Total</p>
        </div>
        <div className="card text-center py-4">
          <p className="text-2xl font-bold text-yellow-600">{pending}</p>
          <p className="text-xs text-gray-500 mt-1">Pending</p>
        </div>
        <div className="card text-center py-4">
          <p className="text-2xl font-bold text-green-600">{submitted}</p>
          <p className="text-xs text-gray-500 mt-1">Submitted</p>
        </div>
      </div>

      {loading ? <LoadingSpinner /> : assignments.length === 0 ? (
        <div className="card"><EmptyState title="No assignments yet" /></div>
      ) : (
        <div className="space-y-3">
          {assignments.map(a => {
            const canSubmit = a.status === 'pending' || a.status === 'overdue';
            const hasMarks = a.submission?.marks !== undefined;
            return (
              <div key={a._id} className={`card hover:shadow-md transition border-l-4 ${
                a.status === 'evaluated' ? 'border-l-blue-500' :
                a.status === 'submitted' ? 'border-l-green-500' :
                a.status === 'overdue' ? 'border-l-red-500' : 'border-l-yellow-500'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <ClipboardList className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-gray-800">{a.title}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">{a.description}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="badge badge-gray">{a.subject?.name}</span>
                        <span className="badge badge-gray">By: {a.teacher?.name}</span>
                        <span className={`badge ${isPast(new Date(a.dueDate)) && !a.submission ? 'badge-red' : 'badge-yellow'}`}>
                          Due: {format(new Date(a.dueDate), 'MMM d, yyyy')}
                        </span>
                        <span className={`badge ${STATUS_STYLES[a.status] || 'badge-gray'}`}>{a.status}</span>
                        {hasMarks && <span className="badge badge-blue">{a.submission.marks}/{a.totalMarks}</span>}
                      </div>
                      {a.submission?.feedback && (
                        <p className="text-xs text-blue-600 mt-1 bg-blue-50 px-2 py-1 rounded">Feedback: {a.submission.feedback}</p>
                      )}
                    </div>
                  </div>
                  {canSubmit && (
                    <button
                      className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 flex-shrink-0"
                      onClick={() => { setSubmitModal(a); setDescription(''); }}
                    >
                      <Send className="w-3.5 h-3.5" /> Submit
                    </button>
                  )}
                  {!canSubmit && a.status !== 'overdue' && (
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Submit Modal */}
      <Modal isOpen={!!submitModal} onClose={() => setSubmitModal(null)} title={`Submit: ${submitModal?.title}`}>
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
            <p><strong>Subject:</strong> {submitModal?.subject?.name}</p>
            <p><strong>Due Date:</strong> {submitModal && format(new Date(submitModal.dueDate), 'MMMM d, yyyy')}</p>
            <p><strong>Max Marks:</strong> {submitModal?.totalMarks}</p>
          </div>
          <div>
            <label className="label">Your Answer / Description</label>
            <textarea
              className="input-field min-h-[120px] resize-y"
              placeholder="Write your answer or describe your submission..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button className="btn-secondary" onClick={() => setSubmitModal(null)}>Cancel</button>
            <button className="btn-primary flex items-center gap-2" onClick={handleSubmit} disabled={submitting}>
              <Send className="w-4 h-4" />{submitting ? 'Submitting...' : 'Submit Assignment'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
