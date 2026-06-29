import { useEffect, useState } from 'react';
import { Calendar, Printer, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { TimetableGrid } from '../admin/Timetable';
import api from '../../api/axios';
import toast from 'react-hot-toast';

/**
 * Read-only timetable view.
 * - admin/teacher: show class selector
 * - student: auto-load from their enrolled class
 */
export default function TimetableView() {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';

  const [classes, setClasses]             = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [academicYear, setAcademicYear]   = useState('2025-2026');
  const [timetable, setTimetable]         = useState(null);
  const [loading, setLoading]             = useState(false);
  const [className, setClassName]         = useState('');

  useEffect(() => {
    if (isStudent) {
      // Auto-load student's own timetable
      setLoading(true);
      api.get('/timetable/my')
        .then(res => {
          if (res.data.timetable) {
            setTimetable(res.data.timetable);
            const cls = res.data.timetable.class;
            setClassName(cls ? `${cls.name}${cls.section ? ` – ${cls.section}` : ''}` : '');
          }
        })
        .catch(() => toast.error('Failed to load timetable'))
        .finally(() => setLoading(false));
    } else {
      // Teacher/admin: load class list
      api.get('/classes').then(r => setClasses(r.data.classes || []));
    }
  }, [isStudent]);

  const loadByClass = async () => {
    if (!selectedClass) { toast.error('Please select a class'); return; }
    setLoading(true);
    try {
      const res = await api.get(`/timetable?classId=${selectedClass}&year=${encodeURIComponent(academicYear)}`);
      setTimetable(res.data.timetable || null);
      const cls = classes.find(c => c._id === selectedClass);
      setClassName(cls ? `${cls.name}${cls.section ? ` – ${cls.section}` : ''}` : '');
      if (!res.data.timetable) toast('No timetable set for this class yet', { icon: '📋' });
    } catch {
      toast.error('Failed to load timetable');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
          <Calendar className="w-5 h-5 text-blue-700" />
        </div>
        <div>
          <h1 className="text-gray-800">
            {isStudent ? 'My Class Timetable' : 'Class Timetable'}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Weekly period schedule</p>
        </div>
      </div>

      {/* Teacher: class selector */}
      {!isStudent && (
        <div className="card">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="label">Select Class</label>
              <select className="input-field" value={selectedClass}
                onChange={e => { setSelectedClass(e.target.value); setTimetable(null); }}>
                <option value="">— Select a class —</option>
                {classes.map(c => <option key={c._id} value={c._id}>{c.name} – {c.section}</option>)}
              </select>
            </div>
            <div className="w-36">
              <label className="label">Academic Year</label>
              <input className="input-field" value={academicYear}
                onChange={e => setAcademicYear(e.target.value)} placeholder="2025-2026" />
            </div>
            <button onClick={loadByClass} disabled={loading || !selectedClass}
              className="btn-primary flex items-center gap-2 h-10 px-5">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Loading…' : 'Load'}
            </button>
          </div>
        </div>
      )}

      {/* Loading spinner */}
      {loading && (
        <div className="card flex items-center justify-center py-16">
          <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
        </div>
      )}

      {/* Timetable */}
      {!loading && timetable && (
        <div className="card p-0 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white px-5 py-3 flex items-center justify-between">
            <div>
              <p className="font-bold text-lg">{className} &nbsp;·&nbsp; Class Time Table</p>
              <p className="text-blue-200 text-xs">Academic Year: {timetable.academicYear}</p>
            </div>
            <button onClick={() => window.print()}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition print:hidden">
              <Printer className="w-4 h-4" /> Print
            </button>
          </div>

          <TimetableGrid
            schedule={timetable.schedule}
            timeSlots={timetable.timeSlots}
            breaks={timetable.breaks}
            readonly={true}
          />
        </div>
      )}

      {/* Empty state */}
      {!loading && !timetable && !isStudent && !selectedClass && (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
            <Calendar className="w-8 h-8 text-blue-300" />
          </div>
          <h3 className="text-gray-600 font-semibold">Select a class to view its timetable</h3>
        </div>
      )}

      {!loading && !timetable && (isStudent || selectedClass) && (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
            <Calendar className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-gray-500 font-semibold">No timetable available</h3>
          <p className="text-gray-400 text-sm mt-1">The timetable for this class hasn't been set up yet.</p>
        </div>
      )}
    </div>
  );
}
