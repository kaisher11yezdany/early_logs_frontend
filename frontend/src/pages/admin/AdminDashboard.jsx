import { useEffect, useState } from 'react';
import { Users, GraduationCap, BookOpen, DollarSign, Bell, TrendingUp, UserCheck, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import StatCard from '../../components/common/StatCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../api/axios';
import { format } from 'date-fns';

const mockAttendance = [
  { day: 'Mon', present: 92, absent: 8 },
  { day: 'Tue', present: 88, absent: 12 },
  { day: 'Wed', present: 95, absent: 5 },
  { day: 'Thu', present: 87, absent: 13 },
  { day: 'Fri', present: 90, absent: 10 },
];

const mockFeeData = [
  { month: 'Jan', collected: 85000 },
  { month: 'Feb', collected: 92000 },
  { month: 'Mar', collected: 88000 },
  { month: 'Apr', collected: 95000 },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, noticesRes] = await Promise.all([
          api.get('/users/stats/summary'),
          api.get('/notices')
        ]);
        setStats(statsRes.data.stats);
        setNotices(noticesRes.data.notices?.slice(0, 5) || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 fade-in">
      {/* Greeting */}
      <div>
        <h1 className="text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={stats?.totalStudents} icon={GraduationCap} color="blue" subtitle="Enrolled" />
        <StatCard title="Total Teachers" value={stats?.totalTeachers} icon={UserCheck} color="green" subtitle="Active staff" />
        <StatCard title="Total Parents" value={stats?.totalParents} icon={Users} color="orange" subtitle="Registered" />
        <StatCard title="Active Users" value={stats?.activeUsers} icon={TrendingUp} color="purple" subtitle="All roles" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card">
          <h3 className="text-gray-700 mb-4">Weekly Attendance Overview</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={mockAttendance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="present" fill="#3b82f6" name="Present" radius={[4, 4, 0, 0]} />
              <Bar dataKey="absent" fill="#fca5a5" name="Absent" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-gray-700 mb-4">Monthly Fee Collection (₹)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={mockFeeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'Collected']} />
              <Line type="monotone" dataKey="collected" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions + Notices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Quick Actions */}
        <div className="card">
          <h3 className="text-gray-700 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            {[
              { label: 'Add New Student', icon: GraduationCap, path: '/admin/students', color: 'text-blue-600 bg-blue-50' },
              { label: 'Create Notice', icon: Bell, path: '/admin/notices', color: 'text-yellow-600 bg-yellow-50' },
              { label: 'Manage Classes', icon: BookOpen, path: '/admin/classes', color: 'text-green-600 bg-green-50' },
              { label: 'Fee Management', icon: DollarSign, path: '/admin/fees', color: 'text-purple-600 bg-purple-50' },
            ].map(a => (
              <a key={a.label} href={a.path}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition group">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${a.color}`}>
                  <a.icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-gray-600 group-hover:text-gray-800">{a.label}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Recent Notices */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-700">Recent Notices</h3>
            <a href="/admin/notices" className="text-xs text-blue-600 hover:underline">View all</a>
          </div>
          {notices.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No notices yet</p>
          ) : (
            <div className="space-y-3">
              {notices.map(n => (
                <div key={n._id} className="flex gap-3 items-start p-3 rounded-lg bg-gray-50">
                  <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                    n.priority === 'high' ? 'bg-red-500' :
                    n.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">{n.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {n.author?.name} • {format(new Date(n.publishDate), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <span className={`badge flex-shrink-0 ${
                    n.type === 'event' ? 'badge-blue' :
                    n.type === 'alert' ? 'badge-red' : 'badge-gray'
                  }`}>{n.type}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
