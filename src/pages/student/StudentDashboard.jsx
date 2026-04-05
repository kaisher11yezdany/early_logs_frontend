import { useEffect, useState } from 'react';
import { CheckSquare, ClipboardList, FileText, Bell, TrendingUp, GraduationCap } from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ present: 0, absent: 0, total: 0 });
  const [assignments, setAssignments] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const now = new Date();
        const [attRes, assignRes, noticeRes] = await Promise.all([
          api.get('/attendance/my/attendance', { params: { month: now.getMonth() + 1, year: now.getFullYear() } }),
          api.get('/assignments/my/assignments'),
          api.get('/notices')
        ]);
        setStats(attRes.data.stats || {});
        setAssignments(assignRes.data.assignments || []);
        setNotices(noticeRes.data.notices?.slice(0, 4) || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const attPct = stats.total ? Math.round((stats.present / stats.total) * 100) : 0;
  const pending = assignments.filter(a => a.status === 'pending').length;
  const overdue = assignments.filter(a => a.status === 'overdue').length;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-gray-800">Hi, {user?.name?.split(' ')[0]}! 🎓</h1>
        <p className="text-gray-500 text-sm mt-0.5">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Attendance" value={`${attPct}%`} icon={CheckSquare} color={attPct >= 75 ? 'green' : 'red'} subtitle={`${stats.present}/${stats.total} days`} />
        <StatCard title="Pending Work" value={pending} icon={ClipboardList} color="yellow" subtitle="Assignments due" />
        <StatCard title="Overdue" value={overdue} icon={FileText} color="red" subtitle="Missed deadlines" />
        <StatCard title="This Month" value={stats.absent || 0} icon={TrendingUp} color="blue" subtitle="Days absent" />
      </div>

      {/* Attendance Ring */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card flex flex-col items-center justify-center py-6">
          <p className="text-sm font-medium text-gray-500 mb-4">Monthly Attendance</p>
          <div className="relative w-32 h-32">
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" strokeWidth="12" />
              <circle cx="60" cy="60" r="50" fill="none"
                stroke={attPct >= 75 ? '#10b981' : '#ef4444'}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 50}`}
                strokeDashoffset={`${2 * Math.PI * 50 * (1 - attPct / 100)}`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-2xl font-bold text-gray-800">{attPct}%</p>
              <p className="text-xs text-gray-400">Present</p>
            </div>
          </div>
          <div className="flex gap-4 mt-4 text-sm">
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full"></span> {stats.present} Present</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-400 rounded-full"></span> {stats.absent} Absent</span>
          </div>
        </div>

        {/* Assignments */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3>Upcoming Assignments</h3>
            <a href="/student/assignments" className="text-xs text-blue-600 hover:underline">View all</a>
          </div>
          {assignments.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No assignments</p>
          ) : (
            <div className="space-y-2">
              {assignments.slice(0, 5).map(a => (
                <div key={a._id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                    a.status === 'submitted' || a.status === 'evaluated' ? 'bg-green-500' :
                    a.status === 'overdue' ? 'bg-red-500' : 'bg-yellow-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">{a.title}</p>
                    <p className="text-xs text-gray-400">{a.subject?.name} • Due {format(new Date(a.dueDate), 'MMM d')}</p>
                  </div>
                  <span className={`badge flex-shrink-0 text-xs ${
                    a.status === 'submitted' ? 'badge-green' :
                    a.status === 'evaluated' ? 'badge-blue' :
                    a.status === 'overdue' ? 'badge-red' :
                    a.status === 'late' ? 'badge-yellow' : 'badge-gray'
                  }`}>{a.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notices */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3>Notices & Announcements</h3>
          <a href="/student/notices" className="text-xs text-blue-600 hover:underline">View all</a>
        </div>
        {notices.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No notices</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {notices.map(n => (
              <div key={n._id} className="p-3 rounded-lg bg-gray-50 flex items-start gap-3">
                <Bell className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-700">{n.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{format(new Date(n.publishDate), 'MMM d')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
