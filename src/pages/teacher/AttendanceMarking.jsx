import { useEffect, useState } from 'react';
import { CheckSquare, Save, Users } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const STATUS_OPTIONS = [
  { value: 'present', label: 'P', color: 'bg-green-500 text-white', hoverBg: 'hover:bg-green-100', activeBg: 'bg-green-500 text-white' },
  { value: 'absent', label: 'A', color: 'bg-red-500 text-white', hoverBg: 'hover:bg-red-100', activeBg: 'bg-red-500 text-white' },
  { value: 'late', label: 'L', color: 'bg-yellow-500 text-white', hoverBg: 'hover:bg-yellow-100', activeBg: 'bg-yellow-500 text-white' },
  { value: 'leave', label: 'Lv', color: 'bg-blue-500 text-white', hoverBg: 'hover:bg-blue-100', activeBg: 'bg-blue-500 text-white' },
];

export default function AttendanceMarking() {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [selectedClass, setSelectedClass] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/classes').then(r => setClasses(r.data.classes || []));
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    setLoading(true);
    api.get('/students', { params: { classId: selectedClass } })
      .then(r => {
        const stu = r.data.students || [];
        setStudents(stu);
        // Default all to present
        const defaultAtt = {};
        stu.forEach(s => { defaultAtt[s._id] = 'present'; });
        setAttendance(defaultAtt);
      })
      .finally(() => setLoading(false));
  }, [selectedClass]);

  const setStatus = (studentId, status) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const markAll = (status) => {
    const all = {};
    students.forEach(s => { all[s._id] = status; });
    setAttendance(all);
  };

  const handleSave = async () => {
    if (!selectedClass) return toast.error('Please select a class');
    setSaving(true);
    try {
      const records = students.map(s => ({
        student: s._id, status: attendance[s._id] || 'absent'
      }));
      await api.post('/attendance', { classId: selectedClass, date, records });
      toast.success('Attendance saved successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save attendance');
    } finally { setSaving(false); }
  };

  const counts = students.reduce((acc, s) => {
    const st = attendance[s._id] || 'absent';
    acc[st] = (acc[st] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-5 fade-in">
      <PageHeader title="Mark Attendance" subtitle="Record daily student attendance" />

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3">
          <select className="input-field sm:flex-1" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
            <option value="">Select Class</option>
            {classes.map(c => <option key={c._id} value={c._id}>{c.name} – {c.section}</option>)}
          </select>
          <input type="date" className="input-field sm:w-44" value={date} onChange={e => setDate(e.target.value)} max={format(new Date(), 'yyyy-MM-dd')} />
        </div>
      </div>

      {selectedClass && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Present', key: 'present', color: 'bg-green-50 text-green-700 border-green-200' },
              { label: 'Absent', key: 'absent', color: 'bg-red-50 text-red-700 border-red-200' },
              { label: 'Late', key: 'late', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
              { label: 'Leave', key: 'leave', color: 'bg-blue-50 text-blue-700 border-blue-200' },
            ].map(s => (
              <div key={s.key} className={`card border p-3 text-center ${s.color}`}>
                <p className="text-2xl font-bold">{counts[s.key] || 0}</p>
                <p className="text-xs font-medium mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Mark all buttons */}
          <div className="card py-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-500 font-medium">Mark All:</span>
              <button onClick={() => markAll('present')} className="btn-success text-xs py-1 px-3">All Present</button>
              <button onClick={() => markAll('absent')} className="btn-danger text-xs py-1 px-3">All Absent</button>
            </div>
          </div>

          {loading ? <LoadingSpinner /> : students.length === 0 ? (
            <div className="card"><EmptyState title="No students in this class" /></div>
          ) : (
            <div className="card p-0 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="table-header w-8">#</th>
                    <th className="table-header">Student</th>
                    <th className="table-header hidden sm:table-cell">Roll No</th>
                    <th className="table-header text-center">Attendance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {students.map((s, idx) => (
                    <tr key={s._id} className="hover:bg-gray-50">
                      <td className="table-cell text-gray-400">{idx + 1}</td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">
                            {s.user?.name?.charAt(0)}
                          </div>
                          <span className="font-medium text-gray-700">{s.user?.name}</span>
                        </div>
                      </td>
                      <td className="table-cell hidden sm:table-cell text-gray-500">{s.rollNo || '—'}</td>
                      <td className="table-cell">
                        <div className="flex justify-center gap-1.5">
                          {STATUS_OPTIONS.map(opt => (
                            <button
                              key={opt.value}
                              onClick={() => setStatus(s._id, opt.value)}
                              className={`w-8 h-8 rounded-full text-xs font-bold transition ${
                                attendance[s._id] === opt.value ? opt.color : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                              }`}
                              title={opt.value}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-5 py-3 border-t border-gray-100 flex justify-between items-center bg-gray-50">
                <span className="text-sm text-gray-500">{students.length} students</span>
                <button className="btn-primary flex items-center gap-2" onClick={handleSave} disabled={saving}>
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Attendance'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
