import { useEffect, useState } from 'react';
import { GraduationCap, CheckSquare, ClipboardList, Bell, Calendar } from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [notices, setNotices] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [noticeRes, assignRes] = await Promise.all([
          api.get('/notices'),
          api.get('/assignments', { params: { teacherId: user._id } })
        ]);
        setNotices(noticeRes.data.notices?.slice(0, 4) || []);
        setAssignments(assignRes.data.assignments || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const pending = assignments.filter(a => new Date(a.dueDate) >= new Date()).length;
  const overdue = assignments.filter(a => new Date(a.dueDate) < new Date()).length;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-gray-800">Welcome, {user?.name}! 👋</h1>
        <p className="text-gray-500 text-sm mt-0.5">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="My Assignments" value={assignments.length} icon={ClipboardList} color="blue" subtitle="Created" />
        <StatCard title="Active" value={pending} icon={CheckSquare} color="green" subtitle="Not yet due" />
        <StatCard title="Overdue" value={overdue} icon={ClipboardList} color="red" subtitle="Past deadline" />
        <StatCard title="Classes" value={user?.assignedClasses?.length || '—'} icon={GraduationCap} color="purple" subtitle="Assigned" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Assignments */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3>Recent Assignments</h3>
            <a href="/teacher/assignments" className="text-xs text-blue-600 hover:underline">View all</a>
          </div>
          {assignments.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No assignments yet</p>
          ) : (
            <div className="space-y-3">
              {assignments.slice(0, 5).map(a => (
                <div key={a._id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ClipboardList className="w-4 h-4 text-blue-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">{a.title}</p>
                    <p className="text-xs text-gray-400">{a.subject?.name} • Due {format(new Date(a.dueDate), 'MMM d')}</p>
                  </div>
                  <span className={`badge flex-shrink-0 ${new Date(a.dueDate) < new Date() ? 'badge-red' : 'badge-green'}`}>
                    {new Date(a.dueDate) < new Date() ? 'Overdue' : 'Active'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notices */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3>Latest Notices</h3>
            <a href="/teacher/notices" className="text-xs text-blue-600 hover:underline">View all</a>
          </div>
          {notices.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No notices</p>
          ) : (
            <div className="space-y-3">
              {notices.map(n => (
                <div key={n._id} className="p-3 rounded-lg bg-gray-50">
                  <div className="flex items-start gap-2">
                    <Bell className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">{n.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{format(new Date(n.publishDate), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-gray-700 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Mark Attendance', icon: CheckSquare, path: '/teacher/attendance', color: 'text-blue-700 bg-blue-50' },
            { label: 'New Assignment', icon: ClipboardList, path: '/teacher/assignments', color: 'text-emerald-700 bg-emerald-50' },
            { label: 'Enter Marks', icon: GraduationCap, path: '/teacher/exams', color: 'text-purple-700 bg-purple-50' },
            { label: 'View Timetable', icon: Calendar, path: '/teacher/timetable', color: 'text-orange-700 bg-orange-50' },
          ].map(a => (
            <a key={a.label} href={a.path}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition text-center">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${a.color}`}>
                <a.icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-gray-600">{a.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
