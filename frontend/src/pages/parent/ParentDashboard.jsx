import { useEffect, useState } from 'react';
import { CheckSquare, ClipboardList, DollarSign, Bell, TrendingUp } from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';

export default function ParentDashboard() {
  const { user } = useAuth();
  const [attStats, setAttStats] = useState({ present: 0, total: 0 });
  const [pendingFees, setPendingFees] = useState(0);
  const [assignments, setAssignments] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [noticeRes, feeRes] = await Promise.all([
          api.get('/notices'),
          api.get('/fees/my/fees')
        ]);
        setNotices(noticeRes.data.notices?.slice(0, 4) || []);
        const feeRecords = feeRes.data.feeRecords || [];
        const totalDue = feeRecords.reduce((sum, record) => {
          const paid = record.payments?.reduce((s, p) => s + (p.amount || 0), 0) || 0;
          return sum + Math.max(0, (record.totalAmount || 0) - paid);
        }, 0);
        setPendingFees(totalDue);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner />;

  const childrenCount = user?.children?.length || 0;
  const attPct = attStats.total ? Math.round((attStats.present / attStats.total) * 100) : 0;

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-gray-800">Parent Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {format(new Date(), 'EEEE, MMMM d, yyyy')} • {childrenCount} child{childrenCount !== 1 ? 'ren' : ''} linked
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Children" value={childrenCount} icon={CheckSquare} color="blue" subtitle="Linked accounts" />
        <StatCard title="Attendance" value={`${attPct}%`} icon={TrendingUp} color={attPct >= 75 ? 'green' : 'red'} subtitle="This month" />
        <StatCard title="Pending Fees" value={`₹${pendingFees.toLocaleString('en-IN')}`} icon={DollarSign} color="yellow" subtitle="Due payment" />
        <StatCard title="Notices" value={notices.length} icon={Bell} color="purple" subtitle="New updates" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Quick Access */}
        <div className="card">
          <h3 className="mb-4">Quick Access</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Child's Attendance", icon: CheckSquare, path: '/parent/attendance', color: 'text-blue-700 bg-blue-50' },
              { label: 'Assignments', icon: ClipboardList, path: '/parent/assignments', color: 'text-emerald-700 bg-emerald-50' },
              { label: 'Fee Payment', icon: DollarSign, path: '/parent/fees', color: 'text-yellow-700 bg-yellow-50' },
              { label: 'School Notices', icon: Bell, path: '/parent/notices', color: 'text-purple-700 bg-purple-50' },
            ].map(a => (
              <a key={a.label} href={a.path}
                className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${a.color}`}>
                  <a.icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-gray-600">{a.label}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Notices */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3>Latest Notices</h3>
            <a href="/parent/notices" className="text-xs text-blue-600 hover:underline">View all</a>
          </div>
          {notices.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No notices</p>
          ) : (
            <div className="space-y-3">
              {notices.map(n => (
                <div key={n._id} className="p-3 rounded-lg bg-gray-50 flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${n.priority === 'high' ? 'bg-red-500' : n.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                  <div>
                    <p className="text-sm font-medium text-gray-700">{n.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{format(new Date(n.publishDate), 'MMM d, yyyy')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
